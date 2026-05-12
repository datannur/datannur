import errno
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys
from typing import Any, Callable, TypeAlias
from urllib.parse import urlparse

RequestHandlerFactory: TypeAlias = Callable[..., BaseHTTPRequestHandler]

APP_DIR = Path(__file__).resolve().parent.parent
LOCAL_PORTS_CONFIG = APP_DIR / "data" / "localhost-ports.config.json"


def get_local_port(key: str, default: int) -> int:
    config = get_local_runtime_config()
    port = config.get(key)
    if isinstance(port, int) and port > 0:
        return port

    return default


def get_local_runtime_config() -> dict[str, Any]:
    if not LOCAL_PORTS_CONFIG.exists():
        return {}

    try:
        config = json.loads(LOCAL_PORTS_CONFIG.read_text(encoding="utf-8"))
        if isinstance(config, dict):
            return config
    except (json.JSONDecodeError, OSError):
        pass

    return {}


def get_local_app_origin(default_port: int) -> str:
    app_port = get_local_port("appPort", default_port)
    return f"http://localhost:{app_port}"


def is_local_app_origin(origin: str, default_port: int) -> bool:
    if not origin or origin == "null":
        return False

    try:
        parsed = urlparse(origin)
        app_port = get_local_port("appPort", default_port)
        return (
            parsed.scheme == "http"
            and parsed.hostname in ("localhost", "127.0.0.1")
            and parsed.port == app_port
        )
    except Exception:
        return False


class JsonRequestHandler(BaseHTTPRequestHandler):
    def send_json_response(
        self,
        status_code: int,
        data: dict[str, Any],
        headers: dict[str, str] | None = None,
    ) -> None:
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(payload)


def create_local_http_server(
    port: int,
    handler: RequestHandlerFactory,
    label: str,
) -> ThreadingHTTPServer:
    try:
        return ThreadingHTTPServer(("127.0.0.1", port), handler)
    except OSError as error:
        if error.errno == errno.EADDRINUSE:
            sys.exit(
                f"ERROR: {label} port {port} is already in use. "
                "Stop the existing service or update data/localhost-ports.config.json."
            )
        raise
