import errno
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys
from typing import Any, Callable, Optional
from urllib.parse import urlparse

RequestHandlerFactory = Callable[..., BaseHTTPRequestHandler]

SCRIPT_DIR = Path(__file__).resolve().parent
APP_DIR = (
    SCRIPT_DIR.parent.parent
    if SCRIPT_DIR.parent.name == "scripts"
    else SCRIPT_DIR.parent
)
PACKAGE_DIR = APP_DIR.parent if APP_DIR.name == "app" else APP_DIR
DATA_DIR = PACKAGE_DIR / "data"
DATA_TEMPLATE_DIR = APP_DIR / "data-template"
SCHEMAS_DIR = APP_DIR / "schemas"
API_DIR = APP_DIR / "api"
SCRIPTS_DIR = APP_DIR / "scripts"
LOCAL_PORTS_CONFIG = DATA_DIR / "localhost-ports.config.json"
DEV_LOCAL_PORTS = {
    "appPort": 8080,
    "llmProxyPort": 62292,
    "editServerPort": 62294,
}


def find_data_db_dir(base_dir: Path = APP_DIR) -> Optional[Path]:
    data_root = (
        base_dir.parent / "data" if base_dir.name == "app" else base_dir / "data"
    )
    db_dir = data_root / "db"
    if not db_dir.exists():
        return None

    if list(db_dir.glob("*.json")):
        return db_dir

    for subdir in db_dir.iterdir():
        if (
            subdir.is_dir()
            and not subdir.name.startswith(".")
            and list(subdir.glob("*.json"))
        ):
            return subdir

    return None


def require_data_db_dir(base_dir: Path = APP_DIR) -> Path:
    data_dir = find_data_db_dir(base_dir)
    if data_dir is not None:
        return data_dir

    sys.exit("ERROR: Data directory not found (no JSON files in data/db/)")


def get_local_port(key: str, default: int) -> int:
    if is_source_package_runtime() and key in DEV_LOCAL_PORTS:
        return DEV_LOCAL_PORTS[key]

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


def is_source_package_runtime() -> bool:
    return PACKAGE_DIR.name == "package" and (PACKAGE_DIR.parent / "src").is_dir()


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
        headers: Optional[dict[str, str]] = None,
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
