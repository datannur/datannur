#!/usr/bin/env python3
"""
LLM Proxy Server for Infomaniak API
Supports chat completions (streaming) and Whisper STT
No external dependencies required - uses only Python standard library
API credentials are stored in user config file
"""

from http.server import BaseHTTPRequestHandler
import json
import http.client
import ssl
import traceback
import urllib.request
import urllib.error
import os
import sys
import time
import random
from pathlib import Path
from typing import Optional

from _local_runtime import (
    create_local_http_server,
    get_local_app_origin,
    get_local_port,
    is_local_app_origin,
)

REPO_PATH = Path(__file__).parent.parent
UPDATE_APP_CONFIG = REPO_PATH / "data" / "update-app.json"
DEFAULT_APP_PORT = 61291
DEFAULT_LLM_PROXY_PORT = 61292


def get_proxy_url() -> Optional[str]:
    """Get proxy URL from update-app.json config file"""
    if not UPDATE_APP_CONFIG.exists():
        return None
    try:
        config = json.loads(UPDATE_APP_CONFIG.read_text(encoding="utf-8"))
        return config.get("proxyUrl")
    except (json.JSONDecodeError, OSError):
        return None


def get_config_dir():
    """Get platform-specific config directory"""
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "datannur"
    elif sys.platform == "win32":
        appdata = os.getenv("APPDATA")
        if appdata:
            return Path(appdata) / "datannur"
        return Path.home() / "AppData" / "Roaming" / "datannur"
    else:
        return Path.home() / ".config" / "datannur"


def get_config_path():
    """Get config file path"""
    return get_config_dir() / "llm-config.json"


def load_config():
    """Load API credentials from config file"""
    config_path = get_config_path()
    if not config_path.exists():
        return None

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}")
        return None


def save_config(api_key, product_id):
    """Save API credentials to config file"""
    config_dir = get_config_dir()
    config_dir.mkdir(parents=True, exist_ok=True)

    config = {"api_key": api_key, "product_id": product_id}

    config_path = get_config_path()
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    os.chmod(config_path, 0o600)
    return config_path


def make_request(
    req: urllib.request.Request,
    proxy_url: Optional[str] = None,
    timeout: int = 60,
) -> bytes:
    """Make HTTP request with optional proxy support."""
    if proxy_url:
        proxy_values = {"http": proxy_url, "https": proxy_url}
        proxy_handler = urllib.request.ProxyHandler(proxy_values)
        opener = urllib.request.build_opener(proxy_handler)
        with opener.open(req, timeout=timeout) as response:
            return response.read()
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read()


class ProxyHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")

    def _is_allowed_origin(self, origin: str) -> bool:
        """Check if origin is the configured localhost app origin"""
        return is_local_app_origin(origin, DEFAULT_APP_PORT)

    def _is_allowed_cors_origin(self, origin: str) -> bool:
        if not origin:
            return True
        return self._is_allowed_origin(origin)

    def _check_origin(self):
        """Verify request comes from localhost, reject otherwise"""
        origin = self.headers.get("Origin", "")
        if not self._is_allowed_origin(origin):
            self._send_json_response(403, {"error": "Forbidden origin"})
            return False
        return True

    def _get_cors_origin(self) -> str:
        """Get validated origin for CORS headers"""
        origin = self.headers.get("Origin", "")
        if origin and self._is_allowed_cors_origin(origin):
            return origin
        return get_local_app_origin(DEFAULT_APP_PORT)

    def _send_json_response(self, status_code, data):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", self._get_cors_origin())
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def _get_api_credentials(self):
        """Get API credentials from config file, env vars, or headers (fallback)"""
        config = load_config()

        if config and "api_key" in config and "product_id" in config:
            return config["api_key"], config["product_id"]

        api_key = os.environ.get("INFOMANIAK_API_KEY")
        product_id = os.environ.get("INFOMANIAK_PRODUCT_ID")
        if api_key and product_id:
            return api_key, product_id

        api_key = self.headers.get("x-api-key")
        product_id = self.headers.get("x-product-id")

        if not api_key or not product_id:
            self._send_json_response(
                401,
                {
                    "error": "Missing API credentials. Please configure via /set_keys endpoint."
                },
            )
            return None

        return api_key, product_id

    def _extract_audio_from_multipart(self, body, boundary):
        """Extract audio data from multipart/form-data"""
        for part in body.split(b"--" + boundary):
            if b"Content-Type: audio/" in part:
                lines = part.split(b"\r\n\r\n", 1)
                if len(lines) == 2:
                    return lines[1].rstrip(b"\r\n")
        return None

    def _build_multipart(self, audio_data, fields):
        """Build multipart/form-data body"""
        boundary_str = f"----WebKitFormBoundary{random.randbytes(8).hex()}"
        boundary_bytes = boundary_str.encode()

        parts = [
            b"--" + boundary_bytes,
            b'Content-Disposition: form-data; name="file"; filename="audio.webm"',
            b"Content-Type: audio/webm",
            b"",
            audio_data,
        ]

        for name, value in fields:
            parts.extend(
                [
                    b"--" + boundary_bytes,
                    f'Content-Disposition: form-data; name="{name}"'.encode(),
                    b"",
                    value.encode(),
                ]
            )

        parts.extend([b"--" + boundary_bytes + b"--", b""])
        return boundary_str, b"\r\n".join(parts)

    def _handle_chat_completions(self):
        """Handle /api/chat/completions endpoint"""
        if not self._check_origin():
            return

        creds = self._get_api_credentials()
        if not creds:
            return

        api_key, product_id = creds
        conn = None
        proxy_url = get_proxy_url()

        try:
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data.decode("utf-8"))
            is_stream = payload.get("stream", True)

            if proxy_url:
                # Parse proxy URL to get host and port
                proxy_parts = proxy_url.replace("http://", "").replace("https://", "")
                if ":" in proxy_parts:
                    proxy_host, proxy_port_str = proxy_parts.split(":")
                    proxy_port = int(proxy_port_str)
                else:
                    proxy_host = proxy_parts
                    proxy_port = 8080
                conn = http.client.HTTPSConnection(
                    proxy_host,
                    proxy_port,
                    context=ssl.create_default_context(),
                    timeout=None,
                )
                conn.set_tunnel("api.infomaniak.com", 443)
            else:
                conn = http.client.HTTPSConnection(
                    "api.infomaniak.com",
                    context=ssl.create_default_context(),
                    timeout=None,
                )

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "Accept": "text/event-stream" if is_stream else "application/json",
            }

            conn.request(
                "POST",
                f"/2/ai/{product_id}/openai/v1/chat/completions",
                json.dumps(payload),
                headers,
            )
            response = conn.getresponse()

            if response.status >= 400:
                error_body = response.read().decode("utf-8")
                print(
                    f"[ERROR] Infomaniak API error (status {response.status}): {error_body}"
                )
                self.send_response(response.status)
                self.send_header("Access-Control-Allow-Origin", self._get_cors_origin())
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(error_body.encode())
                return

            self.send_response(response.status)
            self.send_header("Access-Control-Allow-Origin", self._get_cors_origin())
            self.send_header(
                "Content-Type",
                "text/event-stream" if is_stream else "application/json",
            )
            if is_stream:
                self.send_header("Cache-Control", "no-cache")
                self.send_header("Connection", "close")
            self.end_headers()

            while chunk := response.read(1024):
                self.wfile.write(chunk)
                self.wfile.flush()

        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception as e:
            print(f"Chat error: {e}")
            print(f"Traceback: {traceback.format_exc()}")
            try:
                self._send_json_response(500, {"error": str(e)})
            except (BrokenPipeError, ConnectionResetError):
                pass
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

    def _handle_transcriptions(self):
        """Handle /api/audio/transcriptions endpoint with internal polling"""
        if not self._check_origin():
            return

        creds = self._get_api_credentials()
        if not creds:
            return

        api_key, product_id = creds

        try:
            content_type = self.headers.get("Content-Type", "")
            if not content_type.startswith("multipart/form-data"):
                self._send_json_response(400, {"error": "multipart/form-data required"})
                return

            content_length = int(self.headers["Content-Length"])
            body = self.rfile.read(content_length)
            boundary = content_type.split("boundary=")[1].encode()

            audio_data = self._extract_audio_from_multipart(body, boundary)
            if not audio_data:
                self._send_json_response(400, {"error": "No audio data"})
                return

            boundary_str, body_data = self._build_multipart(
                audio_data,
                [("model", "whisper"), ("language", "fr"), ("response_format", "text")],
            )

            # Upload audio and get batch_id
            proxy_url = get_proxy_url()
            url = f"https://api.infomaniak.com/1/ai/{product_id}/openai/audio/transcriptions"
            req = urllib.request.Request(url, data=body_data, method="POST")
            req.add_header("Authorization", f"Bearer {api_key}")
            req.add_header(
                "Content-Type", f"multipart/form-data; boundary={boundary_str}"
            )

            response_data = make_request(req, proxy_url, timeout=60)
            upload_result = json.loads(response_data.decode("utf-8"))

            batch_id = upload_result.get("batch_id")
            if not batch_id:
                self._send_json_response(500, {"error": "No batch_id received"})
                return

            print(f"Batch ID received: {batch_id}, starting polling...")

            max_attempts = 30
            poll_interval = 0.5

            for attempt in range(max_attempts):
                time.sleep(poll_interval)

                result_url = (
                    f"https://api.infomaniak.com/1/ai/{product_id}/results/{batch_id}"
                )
                result_req = urllib.request.Request(result_url, method="GET")
                result_req.add_header("Authorization", f"Bearer {api_key}")

                try:
                    response_data = make_request(result_req, proxy_url, timeout=10)
                    result = json.loads(response_data.decode("utf-8"))

                    status = result.get("status")
                    print(f"Polling attempt {attempt + 1}: status={status}")

                    if status in ["done", "success"]:
                        transcription_text = result.get("data", "")
                        print(f"Transcription completed: {transcription_text[:50]}...")
                        self._send_json_response(200, {"text": transcription_text})
                        return
                    elif status == "error":
                        error_msg = result.get("error", "Transcription failed")
                        self._send_json_response(500, {"error": error_msg})
                        return
                    # else: status is "pending" or similar, continue polling

                except urllib.error.HTTPError as poll_err:
                    # 404 means batch not ready yet, continue polling
                    if poll_err.code == 404:
                        print(f"Polling attempt {attempt + 1}: batch not ready (404)")
                        continue
                    # Other HTTP errors should be reported
                    raise

            # Timeout
            self._send_json_response(500, {"error": "Transcription timeout"})

        except urllib.error.HTTPError as e:
            print(f"HTTP error: {e.code} - {e.reason}")
            self._send_json_response(e.code, {"error": f"HTTP {e.code}: {e.reason}"})

        except Exception as e:
            print(f"Transcription error: {e}")
            traceback.print_exc()
            self._send_json_response(500, {"error": str(e)})

    def _handle_set_keys(self):
        """Handle /set_keys endpoint to save API credentials"""
        if not self._check_origin():
            return

        try:
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode("utf-8"))

            api_key = data.get("api_key")
            product_id = data.get("product_id")

            if not api_key or not product_id:
                self._send_json_response(
                    400, {"error": "api_key and product_id required"}
                )
                return

            # Basic validation
            if len(api_key) < 20 or not api_key.strip():
                self._send_json_response(400, {"error": "Invalid API key format"})
                return

            if not product_id.strip():
                self._send_json_response(400, {"error": "Invalid product ID"})
                return

            config_path = save_config(api_key, product_id)

            self._send_json_response(
                200,
                {
                    "success": True,
                    "message": "API credentials saved successfully",
                    "config_path": str(config_path),
                },
            )

        except Exception as e:
            print(f"Set keys error: {e}")
            self._send_json_response(500, {"error": str(e)})

    def _handle_get_status(self):
        """Handle /status endpoint to check if credentials are configured"""
        config = load_config()
        is_configured = (
            config is not None and "api_key" in config and "product_id" in config
        ) or (
            os.environ.get("INFOMANIAK_API_KEY")
            and os.environ.get("INFOMANIAK_PRODUCT_ID")
        )

        self._send_json_response(
            200,
            {
                "configured": is_configured,
                "config_path": str(get_config_path()),
                "config_dir": str(get_config_dir()),
            },
        )

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", self._get_cors_origin())

        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers", "Content-Type, x-api-key, x-product-id"
        )
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()

    def do_POST(self):
        """Handle POST requests"""
        if self.path == "/api/chat/completions":
            self._handle_chat_completions()
        elif self.path == "/api/audio/transcriptions":
            self._handle_transcriptions()
        elif self.path == "/set_keys":
            self._handle_set_keys()
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        if self.path == "/status":
            self._handle_get_status()
        else:
            self.send_response(404)
            self.end_headers()


if __name__ == "__main__":
    port = get_local_port("llmProxyPort", DEFAULT_LLM_PROXY_PORT)

    config = load_config()
    if config:
        print(f"✓ Configuration loaded from {get_config_path()}")
    else:
        print("⚠ No configuration found. Use /set_keys endpoint to configure.")
        print(f"  Config will be saved to: {get_config_path()}")

    proxy_url = get_proxy_url()
    if proxy_url:
        print(f"✓ HTTP proxy configured: {proxy_url}")
    else:
        print("✓ No HTTP proxy configured (direct connection)")

    server = create_local_http_server(port, ProxyHandler, "LLM proxy")

    print(f"✓ LLM Proxy running on http://localhost:{port}")
    print("✓ Endpoints:")
    print("  - POST /set_keys - Configure API credentials")
    print("  - GET  /status - Check configuration status")
    print("  - POST /api/chat/completions - Chat completions")
    print("  - POST /api/audio/transcriptions - Audio transcriptions")
    print("✓ Press Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Server stopped")
