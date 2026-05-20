#!/usr/bin/env python3
"""Deploy datannur app files with rsync over SSH."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from _local_runtime import APP_DIR

CONFIG_PATH = APP_DIR / "data" / "deploy.config.json"


@dataclass
class DeployConfig:
    name: str
    host: str
    port: int
    username: str
    remote_path: str
    private_key_path: str
    ignore: list[str]
    delete: bool


def load_config(config_path: Path) -> DeployConfig:
    if not config_path.exists():
        sys.exit(
            "ERROR: No deploy config found. "
            "Create data/deploy.config.json from data-template/deploy.config.json."
        )

    try:
        raw = json.loads(config_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        sys.exit(f"ERROR: Failed to read or parse {config_path}: {error}")

    sync_option = raw.get("syncOption", {})
    return DeployConfig(
        name=str(raw["name"]),
        host=str(raw["host"]),
        port=int(raw.get("port", 22)),
        username=str(raw["username"]),
        remote_path=str(raw["remotePath"]).rstrip("/"),
        private_key_path=str(Path(str(raw["privateKeyPath"])).expanduser()),
        ignore=[str(pattern) for pattern in raw.get("ignore", [])],
        delete=(
            bool(sync_option.get("delete", False))
            if isinstance(sync_option, dict)
            else False
        ),
    )


def require_command(command: str):
    if shutil.which(command) is None:
        sys.exit(f"ERROR: Required command not found: {command}")


def build_rsync_command(config: DeployConfig) -> list[str]:
    command = ["rsync", "-avzh"]

    if config.delete:
        command.append("--delete")

    for pattern in config.ignore:
        command.extend(["--exclude", pattern])

    ssh_command = f"ssh -i {config.private_key_path} -p {config.port}"
    destination = f"{config.username}@{config.host}:{config.remote_path}/"
    command.extend(["-e", ssh_command, "./", destination])
    return command


def main():
    require_command("rsync")
    require_command("ssh")

    config = load_config(CONFIG_PATH)
    print(f"Deploying to {config.name}", flush=True)
    print(f"Remote: {config.username}@{config.host}:{config.remote_path}/", flush=True)

    try:
        subprocess.run(build_rsync_command(config), cwd=APP_DIR, check=True)
    except subprocess.CalledProcessError as error:
        sys.exit(f"ERROR: Deploy failed with exit code {error.returncode}")

    print(f"\nDeploy complete: {config.name}", flush=True)


if __name__ == "__main__":
    main()
