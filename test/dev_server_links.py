from __future__ import annotations

import subprocess
import sys
import time
import urllib.request

from runtime_browser_checks import assert_clean_http_navigation

PORT = 18089
BASE_URL = f"http://127.0.0.1:{PORT}"


def wait_until_ready(process: subprocess.Popen[str]) -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process.poll() is not None:
            output = process.stdout.read() if process.stdout else ""
            sys.exit(f"ERROR: Vite dev server exited early\n{output}")
        try:
            with urllib.request.urlopen(f"{BASE_URL}/", timeout=2) as response:
                if response.status == 200:
                    return
        except OSError:
            pass
        time.sleep(0.2)
    sys.exit("ERROR: Vite dev server did not become ready")


def main() -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("ERROR: Playwright is required for dev link tests")

    process = subprocess.Popen(
        [
            "npm",
            "run",
            "dev",
            "--",
            "--host",
            "127.0.0.1",
            "--port",
            str(PORT),
            "--strictPort",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    try:
        wait_until_ready(process)
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            assert_clean_http_navigation(browser, BASE_URL)
            browser.close()
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()

    print("OK Vite dev clean link navigation")


if __name__ == "__main__":
    main()
