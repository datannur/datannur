#!/usr/bin/env python3
"""
datannur auto-start helpers (macOS + Linux), shared by
install_autostart.py and uninstall_autostart.py.

Usage:
    python3 app/scripts/python/install_autostart.py <app|llm>
    python3 app/scripts/python/uninstall_autostart.py <app|llm>

User-scope only: no sudo, no root. Uses launchd on macOS and
systemd --user on Linux. Logs land in a user-writable location.
"""

from __future__ import annotations

import os
import platform
import shutil
import socket
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

from _local_runtime import PACKAGE_DIR, SCRIPT_DIR, get_local_port

PROXY_SCRIPT = SCRIPT_DIR / "proxy_llm.py"

TARGETS = {
    "app": {"label": "datannur-app", "port_key": "appPort", "default_port": 61291},
    "llm": {"label": "datannur-llm", "port_key": "llmProxyPort", "default_port": 61292},
}


def logs_dir() -> Path:
    if platform.system() == "Darwin":
        return Path.home() / "Library" / "Logs" / "datannur"
    base = os.environ.get("XDG_STATE_HOME") or str(Path.home() / ".local" / "state")
    return Path(base) / "datannur" / "logs"


def open_url(url: str) -> None:
    try:
        webbrowser.open(url)
    except Exception:
        pass


def port_is_listening(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        try:
            s.connect(("127.0.0.1", port))
            return True
        except OSError:
            return False


def build_argv(target: str) -> list[str]:
    """Command line to run the service (python + args)."""
    python_bin = sys.executable or shutil.which("python3") or "python3"
    if target == "app":
        port = get_local_port("appPort", 61291)
        return [
            python_bin,
            "-m",
            "http.server",
            str(port),
            "--bind",
            "127.0.0.1",
            "--directory",
            str(PACKAGE_DIR),
        ]
    if target == "llm":
        if not PROXY_SCRIPT.exists():
            sys.exit(f"ERROR: Python script not found: {PROXY_SCRIPT}")
        return [python_bin, str(PROXY_SCRIPT)]
    sys.exit(f"ERROR: unknown target '{target}'")


# --- macOS launchd -----------------------------------------------------------
def mac_plist_path(label: str) -> Path:
    return Path.home() / "Library" / "LaunchAgents" / f"com.{label}.plist"


def mac_install(label: str, argv: list[str], logs: Path) -> None:
    plist = mac_plist_path(label)
    plist.parent.mkdir(parents=True, exist_ok=True)
    logs.mkdir(parents=True, exist_ok=True)

    def xml_escape(s: str) -> str:
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    program_args = "\n".join(f"    <string>{xml_escape(a)}</string>" for a in argv)
    content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.{label}</string>
  <key>ProgramArguments</key><array>
{program_args}
  </array>
    <key>WorkingDirectory</key><string>{xml_escape(str(PACKAGE_DIR))}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>{xml_escape(str(logs / f"{label}.log"))}</string>
  <key>StandardErrorPath</key><string>{xml_escape(str(logs / f"{label}.err.log"))}</string>
</dict></plist>
"""
    plist.write_text(content, encoding="utf-8")
    subprocess.run(
        ["launchctl", "unload", str(plist)], check=False, capture_output=True
    )
    subprocess.run(["launchctl", "load", str(plist)], check=True)
    print(f"    wrote {plist}")


def mac_uninstall(label: str) -> None:
    plist = mac_plist_path(label)
    if plist.exists():
        subprocess.run(
            ["launchctl", "unload", str(plist)], check=False, capture_output=True
        )
        plist.unlink()
        print(f"    removed {plist}")
    else:
        print("    (no launchd plist to remove)")


# --- Linux systemd --user ----------------------------------------------------
def linux_service_path(label: str) -> Path:
    base = os.environ.get("XDG_CONFIG_HOME") or str(Path.home() / ".config")
    return Path(base) / "systemd" / "user" / f"{label}.service"


def linux_install(label: str, argv: list[str], logs: Path) -> None:
    if not shutil.which("systemctl"):
        sys.exit(
            "ERROR: systemctl not found. datannur unix-setup requires systemd on Linux."
        )
    service = linux_service_path(label)
    service.parent.mkdir(parents=True, exist_ok=True)
    logs.mkdir(parents=True, exist_ok=True)

    # ExecStart wants a single command line; quote each arg.
    import shlex

    exec_cmd = " ".join(shlex.quote(a) for a in argv)

    content = f"""[Unit]
Description=datannur ({label})
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory={PACKAGE_DIR}
ExecStart={exec_cmd}
Restart=on-failure
RestartSec=5
StandardOutput=append:{logs / f"{label}.log"}
StandardError=append:{logs / f"{label}.err.log"}

[Install]
WantedBy=default.target
"""
    service.write_text(content, encoding="utf-8")
    subprocess.run(["systemctl", "--user", "daemon-reload"], check=True)
    subprocess.run(
        ["systemctl", "--user", "enable", "--now", f"{label}.service"], check=True
    )
    print(f"    wrote {service}")


def linux_uninstall(label: str) -> None:
    if not shutil.which("systemctl"):
        sys.exit("ERROR: systemctl not found.")
    subprocess.run(
        ["systemctl", "--user", "disable", "--now", f"{label}.service"],
        check=False,
        capture_output=True,
    )
    service = linux_service_path(label)
    if service.exists():
        service.unlink()
        subprocess.run(["systemctl", "--user", "daemon-reload"], check=True)
        print(f"    removed {service}")
    else:
        print("    (no systemd unit to remove)")


# --- Dispatch ----------------------------------------------------------------
def install(target: str) -> None:
    cfg = TARGETS[target]
    label = cfg["label"]
    argv = build_argv(target)
    logs = logs_dir()

    print(f"==> datannur unix-setup: install [{target}]")
    print(f"    PackageDir: {PACKAGE_DIR}")

    system = platform.system()
    if system == "Darwin":
        mac_install(label, argv, logs)
    elif system == "Linux":
        linux_install(label, argv, logs)
    else:
        sys.exit(f"ERROR: unsupported OS: {system}")

    time.sleep(1)
    port = get_local_port(cfg["port_key"], cfg["default_port"])
    if target == "app":
        url = f"http://localhost:{port}"
        print(f"    opening {url}")
        open_url(url)
    else:
        if port_is_listening(port):
            print(f"    OK: llm proxy listening on port {port}")
        else:
            print(
                f"    WARN: llm proxy not yet listening on port {port} (may still be starting)"
            )
    print("==> install done. Will auto-start at next login.")


def uninstall(target: str) -> None:
    cfg = TARGETS[target]
    label = cfg["label"]
    print(f"==> datannur unix-setup: uninstall [{target}]")
    system = platform.system()
    if system == "Darwin":
        mac_uninstall(label)
    elif system == "Linux":
        linux_uninstall(label)
    else:
        sys.exit(f"ERROR: unsupported OS: {system}")
    print("==> uninstall done.")


def parse_target(argv: list[str]) -> str:
    if len(argv) != 2 or argv[1] not in TARGETS:
        prog = Path(argv[0]).name
        sys.exit(f"Usage: python3 {prog} <app|llm>")
    return argv[1]
