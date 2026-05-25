#!/usr/bin/env python3
"""Install a datannur shortcut in file:// mode (Linux only).

No server, no listener, no persistence: the shortcut opens index.html
directly in a chromeless browser window (--app=file:///...). LLM
features that require an HTTP origin are disabled in this mode.

Creates ~/.local/share/applications/datannur.desktop.

On macOS, use install_autostart.py + Safari > File > Add to Dock on
the http://localhost URL: the file:// mode cannot be packaged as a
clean native app bundle on macOS.
On Windows, use app/scripts/windows/install-shortcut.bat.
"""

from __future__ import annotations

import platform
import shutil
import subprocess
from pathlib import Path

from _local_runtime import APP_DIR, PACKAGE_DIR

INDEX_HTML = PACKAGE_DIR / "index.html"
ICON_SRC_PNG = APP_DIR / "assets" / "icon" / "icon-512.png"

LINUX_BROWSERS = [
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
    "microsoft-edge",
    "brave-browser",
]


def find_browser(candidates: list[str]) -> str:
    for c in candidates:
        found = shutil.which(c)
        if found:
            return found
    raise SystemExit(
        "No supported Chromium-based browser found (Chrome, Edge, Brave, Chromium)."
    )


def install_linux() -> Path:
    browser = find_browser(LINUX_BROWSERS)
    apps_dir = Path.home() / ".local" / "share" / "applications"
    icons_dir = Path.home() / ".local" / "share" / "icons"
    apps_dir.mkdir(parents=True, exist_ok=True)
    icons_dir.mkdir(parents=True, exist_ok=True)

    icon_dst = icons_dir / "datannur.png"
    if ICON_SRC_PNG.exists():
        shutil.copy2(ICON_SRC_PNG, icon_dst)

    desktop = apps_dir / "datannur.desktop"
    file_url = f"file://{INDEX_HTML}"
    desktop.write_text(
        "[Desktop Entry]\n"
        "Type=Application\n"
        "Name=datannur\n"
        "Comment=datannur (file:// mode)\n"
        f"Exec={browser} --app={file_url}\n"
        f"Icon={icon_dst if icon_dst.exists() else 'text-html'}\n"
        "Terminal=false\n"
        "Categories=Office;Database;\n",
        encoding="utf-8",
    )
    desktop.chmod(0o644)

    # Refresh the desktop database so the entry appears immediately.
    update_cmd = shutil.which("update-desktop-database")
    if update_cmd:
        subprocess.run([update_cmd, str(apps_dir)], capture_output=True, check=False)
    return desktop


def main() -> None:
    system = platform.system()
    if not INDEX_HTML.exists():
        raise SystemExit(f"index.html not found at {INDEX_HTML}")

    if system == "Linux":
        path = install_linux()
        print(f"==> datannur.desktop installed: {path}")
        print("    Launch from your application menu or search 'datannur'.")
    elif system == "Darwin":
        raise SystemExit(
            "macOS is not supported by install_shortcut.py.\n"
            "For a native Dock app on macOS, run:\n"
            "    python3 app/scripts/python/install_autostart.py app\n"
            "then open the http://localhost URL in Safari and use\n"
            "File > Add to Dock."
        )
    else:
        raise SystemExit(
            f"Unsupported platform: {system}. "
            "On Windows, use app/scripts/windows/install-shortcut.bat."
        )


if __name__ == "__main__":
    main()
