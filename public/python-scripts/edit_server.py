#!/usr/bin/env python3
"""
Datannur local edit server.
Provides the local editing runtime API for the browser app.
"""

from _local_runtime import (
    JsonRequestHandler,
    create_local_http_server,
    get_local_app_origin,
    get_local_port,
    is_local_app_origin,
)

DEFAULT_APP_PORT = 61291
DEFAULT_EDIT_SERVER_PORT = 61294


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
                {
                    "available": True,
                    "mode": "readonly",
                    "capabilities": [],
                },
            )
            return

        self._send_edit_json_response(404, {"error": "not_found"})


if __name__ == "__main__":
    port = get_local_port("editServerPort", DEFAULT_EDIT_SERVER_PORT)
    server = create_local_http_server(port, EditHandler, "edit server")

    print(f"✓ Edit server running on http://127.0.0.1:{port}")
    print("✓ Endpoints:")
    print("  - GET /api/status - Check edit runtime status")
    print("✓ Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Server stopped")
