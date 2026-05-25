from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parents[2]
DIST_DIR = REPO_DIR / "dist"
HTTPD_CONF = Path(__file__).resolve().parent / "httpd.conf"
CONTAINER_NAME = "datannur-apache-smoke"
IMAGE = "php:8.3-apache"
PORT = 18088


def run(
    command: list[str],
    check: bool = True,
    quiet: bool = False,
) -> subprocess.CompletedProcess[str]:
    output = subprocess.DEVNULL if quiet else None
    return subprocess.run(
        command,
        check=check,
        text=True,
        stdout=output,
        stderr=output,
    )


def ensure_container_runtime() -> None:
    if shutil.which("orbctl"):
        run(["orbctl", "start"], check=False)

    if not shutil.which("docker"):
        sys.exit("ERROR: Docker is required for Apache smoke tests")


def remove_container() -> None:
    run(["docker", "rm", "-f", CONTAINER_NAME], check=False, quiet=True)


def docker_run_args(detached: bool) -> list[str]:
    if not DIST_DIR.exists():
        sys.exit("ERROR: dist/ not found. Run npm run static-make first.")

    args = [
        "docker",
        "run",
        "--rm",
        "--name",
        CONTAINER_NAME,
        "-p",
        f"{PORT}:80",
        "-v",
        f"{DIST_DIR}:/var/www/html:ro",
        "-v",
        f"{HTTPD_CONF}:/etc/apache2/sites-available/000-default.conf:ro",
    ]
    if detached:
        args.append("-d")
    args.extend(
        [
            IMAGE,
            "sh",
            "-c",
            "a2enmod rewrite headers expires deflate && apache2-foreground",
        ]
    )
    return args


def start_container(detached: bool) -> subprocess.CompletedProcess[str]:
    ensure_container_runtime()
    remove_container()
    return run(docker_run_args(detached), quiet=detached)
