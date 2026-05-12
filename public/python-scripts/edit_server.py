#!/usr/bin/env python3
"""
Datannur local edit server.
Provides the local editing runtime API for the browser app.
"""

from contextlib import contextmanager
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import socket
import tempfile
import time
from typing import Any, Iterator, Optional

from _local_runtime import (
    APP_DIR,
    DATA_DIR,
    JsonRequestHandler,
    create_local_http_server,
    find_data_db_dir,
    get_local_app_origin,
    get_local_port,
    is_local_app_origin,
)

DEFAULT_APP_PORT = 61291
DEFAULT_EDIT_SERVER_PORT = 61294
OVERLAY_DB_DIR = DATA_DIR / "db-ui"
AUDIT_DIR = OVERLAY_DB_DIR / "audit"
LOCK_FILE = OVERLAY_DB_DIR / ".write.lock"
SCHEMAS_DIR = APP_DIR / "schemas"
MAX_REQUEST_BODY_BYTES = 16 * 1024
LOCK_TIMEOUT_SECONDS = 5
LOCK_RETRY_DELAY_SECONDS = 0.1


@contextmanager
def locked_overlay() -> Iterator[None]:
    OVERLAY_DB_DIR.mkdir(parents=True, exist_ok=True)
    deadline = time.monotonic() + LOCK_TIMEOUT_SECONDS
    lock_fd: Optional[int] = None

    while lock_fd is None:
        try:
            lock_fd = os.open(LOCK_FILE, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError:
            if time.monotonic() >= deadline:
                raise RuntimeError("write_locked")
            time.sleep(LOCK_RETRY_DELAY_SECONDS)

    try:
        lock_payload = {
            "hostname": socket.gethostname(),
            "pid": os.getpid(),
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        os.write(lock_fd, json.dumps(lock_payload).encode("utf-8"))
        os.fsync(lock_fd)
        yield
    finally:
        os.close(lock_fd)
        try:
            LOCK_FILE.unlink()
        except FileNotFoundError:
            pass


def read_json_array(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []

    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list) or not all(isinstance(item, dict) for item in data):
        raise ValueError("invalid_json_table")
    return data


def write_json_atomic(path: Path, data: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False, indent=2) + "\n"

    with tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        dir=path.parent,
        delete=False,
    ) as temp_file:
        temp_file.write(payload)
        temp_file.flush()
        os.fsync(temp_file.fileno())
        temp_path = Path(temp_file.name)

    os.replace(temp_path, path)


def append_audit_entry(entry: dict[str, Any]) -> None:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    audit_path = AUDIT_DIR / f"{datetime.now(timezone.utc).strftime('%Y-%m')}.jsonl"
    with audit_path.open("a", encoding="utf-8") as audit_file:
        audit_file.write(json.dumps(entry, ensure_ascii=False) + "\n")
        audit_file.flush()
        os.fsync(audit_file.fileno())


def find_row(rows: list[dict[str, Any]], row_id: str) -> Optional[dict[str, Any]]:
    for row in rows:
        if row.get("id") == row_id:
            return row
    return None


def read_data_schemas() -> dict[str, dict[str, Any]]:
    schemas: dict[str, dict[str, Any]] = {}

    for schema_path in SCHEMAS_DIR.glob("*.schema.json"):
        if schema_path.name.startswith("__"):
            continue

        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        if schema.get("x-db") != "data":
            continue

        title = schema.get("title")
        properties = schema.get("items", {}).get("properties")
        if isinstance(title, str) and isinstance(properties, dict):
            schemas[title] = properties

    return schemas


def get_json_schema_types(field_schema: dict[str, Any]) -> set[str]:
    schema_type = field_schema.get("type")
    if isinstance(schema_type, str):
        return {schema_type}
    if isinstance(schema_type, list):
        return {item for item in schema_type if isinstance(item, str)}
    return set()


def matches_schema_type(value: Any, schema_types: set[str]) -> bool:
    if value == "!":
        return True
    if value is None:
        return "null" in schema_types
    if isinstance(value, bool):
        return "boolean" in schema_types
    if isinstance(value, int):
        return "integer" in schema_types or "number" in schema_types
    if isinstance(value, float):
        return "number" in schema_types
    if isinstance(value, str):
        return "string" in schema_types
    if isinstance(value, list):
        return "array" in schema_types
    if isinstance(value, dict):
        return "object" in schema_types
    return False


def validate_patch_payload(payload: Any) -> tuple[str, str, dict[str, Any], str]:
    if not isinstance(payload, dict):
        raise ValueError("invalid_payload")

    table = payload.get("table")
    row_id = payload.get("id")
    changes = payload.get("changes")
    user = payload.get("user", "local")

    if not isinstance(table, str) or not table:
        raise ValueError("invalid_table")
    if not isinstance(row_id, str) or not row_id:
        raise ValueError("invalid_id")
    if not isinstance(changes, dict) or not changes:
        raise ValueError("invalid_changes")
    if not isinstance(user, str) or not user:
        raise ValueError("invalid_user")

    schemas = read_data_schemas()
    table_schema = schemas.get(table)
    if table_schema is None:
        raise ValueError("unsupported_table")

    clean_changes: dict[str, Any] = {}
    for field, value in changes.items():
        if not isinstance(field, str) or field == "id" or field not in table_schema:
            raise ValueError("unsupported_field")
        field_schema = table_schema[field]
        if not isinstance(field_schema, dict) or not matches_schema_type(
            value,
            get_json_schema_types(field_schema),
        ):
            raise ValueError("invalid_field_value")
        clean_changes[field] = value

    return table, row_id, clean_changes, user


def apply_overlay_patch(payload: Any) -> dict[str, Any]:
    table, row_id, changes, user = validate_patch_payload(payload)
    published_db_dir = find_data_db_dir(APP_DIR)
    if published_db_dir is None:
        raise ValueError("published_db_not_found")

    published_path = published_db_dir / f"{table}.json"
    overlay_path = OVERLAY_DB_DIR / f"{table}.json"

    with locked_overlay():
        published_rows = read_json_array(published_path)
        published_row = find_row(published_rows, row_id)
        if published_row is None:
            raise ValueError("unknown_id")

        overlay_rows = read_json_array(overlay_path)
        overlay_row = find_row(overlay_rows, row_id)
        if overlay_row is None:
            overlay_row = {"id": row_id}
            overlay_rows.append(overlay_row)

        audit_changes = {}
        for field, new_value in changes.items():
            old_value = overlay_row.get(field, published_row.get(field))
            if old_value != new_value:
                audit_changes[field] = {"old": old_value, "new": new_value}
                overlay_row[field] = new_value

        if not audit_changes:
            return {"saved": False, "table": table, "id": row_id, "changes": {}}

        write_json_atomic(overlay_path, overlay_rows)
        append_audit_entry(
            {
                "ts": datetime.now(timezone.utc).isoformat(),
                "user": user,
                "action": "update",
                "table": table,
                "id": row_id,
                "changes": audit_changes,
            }
        )

    return {"saved": True, "table": table, "id": row_id, "changes": audit_changes}


class EditHandler(JsonRequestHandler):
    def _is_allowed_cors_origin(self, origin: str) -> bool:
        if not origin:
            return True
        return is_local_app_origin(origin, DEFAULT_APP_PORT)

    def _get_cors_origin(self) -> str:
        origin = self.headers.get("Origin", "")
        if origin and self._is_allowed_cors_origin(origin):
            return origin
        return get_local_app_origin(DEFAULT_APP_PORT)

    def _send_edit_json_response(self, status_code: int, data: dict) -> None:
        self.send_json_response(
            status_code,
            data,
            {
                "Access-Control-Allow-Origin": self._get_cors_origin(),
                "Access-Control-Allow-Credentials": "true",
            },
        )

    def _check_origin(self) -> bool:
        origin = self.headers.get("Origin", "")
        if self._is_allowed_cors_origin(origin):
            return True

        self._send_edit_json_response(403, {"error": "forbidden_origin"})
        return False

    def do_OPTIONS(self) -> None:
        if not self._check_origin():
            return

        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", self._get_cors_origin())
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()

    def do_GET(self) -> None:
        if not self._check_origin():
            return

        if self.path == "/api/status":
            self._send_edit_json_response(
                200,
                {"available": True},
            )
            return

        self._send_edit_json_response(404, {"error": "not_found"})

    def do_POST(self) -> None:
        if not self._check_origin():
            return

        if self.path != "/api/patch":
            self._send_edit_json_response(404, {"error": "not_found"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_edit_json_response(413, {"error": "invalid_body_size"})
            return

        if content_length <= 0 or content_length > MAX_REQUEST_BODY_BYTES:
            self._send_edit_json_response(413, {"error": "invalid_body_size"})
            return

        try:
            body = self.rfile.read(content_length).decode("utf-8")
            result = apply_overlay_patch(json.loads(body))
            self._send_edit_json_response(200, result)
        except json.JSONDecodeError:
            self._send_edit_json_response(400, {"error": "invalid_json"})
        except ValueError as error:
            self._send_edit_json_response(400, {"error": str(error)})
        except RuntimeError as error:
            status_code = 423 if str(error) == "write_locked" else 500
            self._send_edit_json_response(status_code, {"error": str(error)})
        except OSError:
            self._send_edit_json_response(500, {"error": "write_failed"})


if __name__ == "__main__":
    port = get_local_port("editServerPort", DEFAULT_EDIT_SERVER_PORT)
    server = create_local_http_server(port, EditHandler, "edit server")

    print(f"✓ Edit server running on http://127.0.0.1:{port}")
    print("✓ Endpoints:")
    print("  - GET /api/status - Check edit runtime status")
    print("  - POST /api/patch - Apply a supported overlay patch")
    print("✓ Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Server stopped")
