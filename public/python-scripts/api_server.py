#!/usr/bin/env python3
"""Local read-only REST API server for datannur catalog data."""

from __future__ import annotations

import json
import sys
from functools import cmp_to_key
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

from _local_runtime import (
    APP_DIR,
    create_local_http_server,
    get_local_port,
    require_data_db_dir,
)

DEFAULT_API_PORT = 61293
IGNORE_SCHEMAS = {"__meta__.schema.json", "__table__.schema.json"}
SCHEMAS_DIR = APP_DIR / "schemas"
OPENAPI_DIR = APP_DIR / "data" / "api"


def load_tables() -> list[str]:
    if not SCHEMAS_DIR.exists():
        sys.exit("ERROR: schemas directory not found")

    return sorted(
        schema_file.name.removesuffix(".schema.json")
        for schema_file in SCHEMAS_DIR.glob("*.schema.json")
        if schema_file.name not in IGNORE_SCHEMAS
    )


DATA_DIR = require_data_db_dir(APP_DIR)

TABLES = load_tables()
TABLE_SET = set(TABLES)


def load_table_data(table_name: str) -> list[dict[str, Any]]:
    data_file = DATA_DIR / f"{table_name}.json"
    data = json.loads(data_file.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict)]


def compare_values(a: dict[str, Any], b: dict[str, Any], field: str, order: str) -> int:
    a_value = a.get(field)
    b_value = b.get(field)

    if a_value == b_value:
        return 0
    if isinstance(a_value, str) and isinstance(b_value, str):
        result = (a_value > b_value) - (a_value < b_value)
    elif isinstance(a_value, (int, float)) and isinstance(b_value, (int, float)):
        result = (a_value > b_value) - (a_value < b_value)
    else:
        return 0

    return -result if order == "desc" else result


def apply_filters(
    data: list[dict[str, Any]], query: dict[str, str]
) -> list[dict[str, Any]]:
    result = list(data)

    for field, value in query.items():
        if field.startswith("_"):
            continue
        result = [item for item in result if str(item.get(field, "")) == value]

    sort_field = query.get("_sort")
    order = query.get("_order", "asc")
    if sort_field:
        result.sort(
            key=cmp_to_key(lambda a, b: compare_values(a, b, sort_field, order))
        )

    offset = int(query.get("_offset", "0") or 0)
    limit = query.get("_limit")
    if offset > 0:
        result = result[offset:]
    if limit is not None:
        result = result[: int(limit)]

    return result


def send_json(handler: BaseHTTPRequestHandler, status: int, data: Any) -> None:
    payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(payload)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(payload)


def send_empty(handler: BaseHTTPRequestHandler, status: int) -> None:
    handler.send_response(status)
    handler.send_header("Content-Length", "0")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()


def send_file(handler: BaseHTTPRequestHandler, path: Path, content_type: str) -> None:
    if not path.exists():
        send_json(handler, 404, {"error": "Not found"})
        return

    payload = path.read_bytes()
    handler.send_response(200)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Content-Length", str(len(payload)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(payload)


def send_data_file(handler: BaseHTTPRequestHandler, table_file: str) -> None:
    if "/" in table_file or not table_file.endswith(".json"):
        send_json(handler, 404, {"error": "Not found"})
        return

    table_name = table_file.removesuffix(".json")
    if table_name not in TABLE_SET:
        send_json(handler, 404, {"error": "Not found"})
        return

    send_file(handler, DATA_DIR / table_file, "application/json; charset=utf-8")


class ApiHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        segments = [unquote(segment) for segment in parsed.path.split("/") if segment]
        query = {
            key: values[-1]
            for key, values in parse_qs(parsed.query, keep_blank_values=True).items()
            if values
        }

        if segments == ["favicon.ico"]:
            send_empty(self, 204)
            return

        if segments in ([], ["api"]):
            send_file(self, OPENAPI_DIR / "api-docs.html", "text/html; charset=utf-8")
            return

        if segments in (["raw"], ["api", "raw"]):
            send_file(
                self, OPENAPI_DIR / "api-docs-raw.html", "text/html; charset=utf-8"
            )
            return

        if segments in (["openapi.json"], ["api", "openapi.json"]):
            send_file(
                self, OPENAPI_DIR / "openapi.json", "application/json; charset=utf-8"
            )
            return

        if segments in (["openapi-raw.json"], ["api", "openapi-raw.json"]):
            send_file(
                self,
                OPENAPI_DIR / "openapi-raw.json",
                "application/json; charset=utf-8",
            )
            return

        if len(segments) == 3 and segments[:2] == ["data", "db"]:
            send_data_file(self, segments[2])
            return

        if segments and segments[0] == "api":
            segments = segments[1:]

        table_name = segments[0] if segments else None
        record_id = segments[1] if len(segments) > 1 else None

        if not table_name or table_name not in TABLE_SET:
            send_json(self, 404, {"error": "Not found"})
            return

        try:
            data = load_table_data(table_name)
            if record_id:
                record = next(
                    (item for item in data if str(item.get("id")) == record_id), None
                )
                if record is None:
                    send_json(self, 404, {"error": "Record not found"})
                else:
                    send_json(self, 200, record)
            else:
                send_json(self, 200, apply_filters(data, query))
        except Exception as error:
            print(error, file=sys.stderr)
            send_json(self, 500, {"error": "Internal server error"})


def main() -> None:
    port = get_local_port("apiPort", DEFAULT_API_PORT)
    server = create_local_http_server(port, ApiHandler, "api")
    print(f"\n  API: http://localhost:{port}")
    print(f"  Data: {DATA_DIR.relative_to(APP_DIR)}")
    print(f"  Tables: {', '.join(TABLES)}")
    print("  Press Ctrl+C to stop\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
