import json
from pathlib import Path

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
