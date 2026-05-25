#!/usr/bin/env python3
"""
Start datannur app with optional local services
Launches the HTTP server for index.html and available local service scripts in parallel
No external dependencies required - uses only Python standard library
"""

import functools
import os
import subprocess
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

from _local_runtime import PACKAGE_DIR, create_local_http_server, get_local_port

DEFAULT_APP_PORT = 61291
LOCAL_SERVICE_SCRIPTS = ("proxy_llm.py", "edit_server.py")
LOCAL_BASE_TAG = '<base href="/" />'
LOCAL_ROUTING_META = '<meta app-routing="clean" />'
LOCAL_ROUTING_COOKIE = "datannur-routing=clean; Path=/; SameSite=Lax"


class SafeHTTPHandler(SimpleHTTPRequestHandler):
    """HTTP handler compatible with Windows network drives.

    Fixes os.fstat() OSError on SMB shares with Microsoft Store Python.
    Uses os.stat(path) instead of os.fstat(fd) for Content-Length header.
    """

    def send_head(self):
        path = self.translate_path(self.path)

        if os.path.isdir(path):
            if not self.path.endswith("/"):
                self.send_response(301)
                self.send_header("Location", self.path + "/")
                self.end_headers()
                return None
            for index in ("index.html", "index.htm"):
                index_path = os.path.join(path, index)
                if os.path.isfile(index_path):
                    path = index_path
                    break
            else:
                return self.list_directory(path)

        if not os.path.isfile(path):
            fallback_path = self.get_spa_fallback_path()
            if fallback_path is None:
                self.send_error(404, "File not found")
                return None
            path = fallback_path

        try:
            fs = os.stat(path)
        except OSError:
            self.send_error(404, "File not found")
            return None

        if Path(path).name == "index.html":
            return self.send_local_index(path, fs.st_mtime)

        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        self.send_response(200)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Length", str(fs.st_size))
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()
        return f

    def send_local_index(self, path, modified_time):
        try:
            html = Path(path).read_text(encoding="utf-8")
        except OSError:
            self.send_error(404, "File not found")
            return None

        html = html.replace("<head>", f"<head>{LOCAL_ROUTING_META}", 1)
        html = html.replace('<base href="" />', LOCAL_BASE_TAG, 1)

        payload = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.send_header("Set-Cookie", LOCAL_ROUTING_COOKIE)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Last-Modified", self.date_time_string(modified_time))
        self.end_headers()
        self.wfile.write(payload)
        return None

    def get_spa_fallback_path(self):
        parsed_url = urlparse(self.path)
        request_path = parsed_url.path.lstrip("/")
        first_segment = request_path.split("/", 1)[0]

        if not request_path or "." in Path(request_path).name:
            return None
        if first_segment in {"app", "data", "api"}:
            return None

        index_path = Path(PACKAGE_DIR) / "index.html"
        if index_path.is_file():
            return str(index_path)
        return None


def main():
    processes = []
    app_port = get_local_port("appPort", DEFAULT_APP_PORT)
    handler = functools.partial(SafeHTTPHandler, directory=str(PACKAGE_DIR))

    server = create_local_http_server(app_port, handler, "app")

    for script_name in LOCAL_SERVICE_SCRIPTS:
        service_script = Path(__file__).parent / script_name
        if service_script.exists():
            processes.append(subprocess.Popen([sys.executable, str(service_script)]))

    print(f"\n  App: http://localhost:{app_port}/")
    print("  Press Ctrl+C to stop\n")

    webbrowser.open(f"http://localhost:{app_port}/")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
        for p in processes:
            p.terminate()


if __name__ == "__main__":
    main()
