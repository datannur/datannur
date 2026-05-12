#!/usr/bin/env python3
"""
Datannur local edit server.
Provides the local editing runtime API for the browser app.
"""

from http.server import HTTPServer

from _local_runtime import JsonRequestHandler, get_local_port

DEFAULT_EDIT_SERVER_PORT = 61294


class EditHandler(JsonRequestHandler):
    def do_GET(self) -> None:
        if self.path == "/api/status":
            self.send_json_response(
                200,
                {
                    "available": True,
                    "mode": "readonly",
                },
            )
            return

        self.send_json_response(404, {"error": "not_found"})


if __name__ == "__main__":
    port = get_local_port("editServerPort", DEFAULT_EDIT_SERVER_PORT)
    server = HTTPServer(("127.0.0.1", port), EditHandler)
    print(f"✓ Edit server running on http://127.0.0.1:{port}")
    print("✓ Endpoints:")
    print("  - GET /api/status - Check edit runtime status")
    print("✓ Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Server stopped")
