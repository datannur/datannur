import json
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

APP_DIR = Path(__file__).resolve().parent.parent
LOCAL_PORTS_CONFIG = APP_DIR / "data" / "localhost-ports.config.json"


def get_local_port(key: str, default: int) -> int:
    if not LOCAL_PORTS_CONFIG.exists():
        return default

    try:
        config = json.loads(LOCAL_PORTS_CONFIG.read_text(encoding="utf-8"))
        port = config.get(key)
        if isinstance(port, int) and port > 0:
            return port
    except (json.JSONDecodeError, OSError):
        pass

    return default


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
    def send_json_response(self, status_code: int, data: dict[str, Any]) -> None:
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
