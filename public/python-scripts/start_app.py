#!/usr/bin/env python3
"""
Start datannur app with LLM proxy
Launches both the HTTP server for index.html and the LLM proxy in parallel
No external dependencies required - uses only Python standard library
"""

import functools
import os
import subprocess
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

APP_PORT = 8080
APP_DIR = Path(__file__).parent.parent


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
            self.send_error(404, "File not found")
            return None

        try:
            f = open(path, "rb")
            fs = os.stat(path)
        except OSError:
            self.send_error(404, "File not found")
            return None

        self.send_response(200)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Length", str(fs.st_size))
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()
        return f


def main():
    proxy_script = Path(__file__).parent / "proxy_llm.py"
    processes = []

    if proxy_script.exists():
        processes.append(subprocess.Popen([sys.executable, str(proxy_script)]))

    handler = functools.partial(SafeHTTPHandler, directory=str(APP_DIR))
    server = ThreadingHTTPServer(("", APP_PORT), handler)

    print(f"\n  App: http://localhost:{APP_PORT}")
    print(f"  Press Ctrl+C to stop\n")

    webbrowser.open(f"http://localhost:{APP_PORT}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
        for p in processes:
            p.terminate()


if __name__ == "__main__":
    main()
