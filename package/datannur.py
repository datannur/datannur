#!/usr/bin/env python3
"""Command launcher for the datannur portable app."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
APP_DIR = PACKAGE_DIR / "app"
PYTHON_SCRIPTS_DIR = APP_DIR / "scripts" / "python"
sys.dont_write_bytecode = True


@dataclass(frozen=True)
class Command:
    description: str
    script: str


COMMANDS = {
    "start": Command("Start the local app server", "start_app.py"),
    "update": Command("Update the app files", "update_app.py"),
    "validate": Command("Validate schemas and data files", "validate_schemas.py"),
    "openapi": Command(
        "Generate catalog-specific OpenAPI files", "generate_openapi.py"
    ),
    "api": Command("Start the local REST API server", "api_server.py"),
    "static": Command("Generate SEO-friendly static pages", "static_make.py"),
    "deploy": Command("Deploy files with rsync over SSH", "deploy.py"),
    "dcat": Command("Export the catalog to DCAT", "export_dcat.py"),
    "stac": Command("Export geographic datasets to STAC", "export_stac.py"),
    "iso": Command("Export geographic datasets to ISO 19139", "export_iso.py"),
    "build-db-source": Command(
        "Build data/db-source from source files", "build_db_source.py"
    ),
    "proxy-llm": Command("Start the local LLM proxy", "proxy_llm.py"),
    "edit-server": Command("Start the local edit server", "edit_server.py"),
    "install-shortcut": Command("Install an app shortcut", "install_shortcut.py"),
    "install-autostart": Command(
        "Install autostart integration", "install_autostart.py"
    ),
    "uninstall-autostart": Command(
        "Remove autostart integration", "uninstall_autostart.py"
    ),
}


def print_commands():
    width = max(len(name) for name in COMMANDS)
    for name, command in COMMANDS.items():
        print(f"  {name.ljust(width)}  {command.description}")
    print("  static-deploy".ljust(width + 4) + "  Generate static pages, then deploy")


class HelpFormatter(argparse.RawDescriptionHelpFormatter):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="datannur.py",
        description="Run datannur app commands.",
        epilog="Use 'python3 datannur.py <command> -- --help' to pass options to a script.",
        formatter_class=HelpFormatter,
    )
    parser.add_argument("command", nargs="?", help="Command to run")
    parser.add_argument(
        "args", nargs=argparse.REMAINDER, help="Arguments passed to the command"
    )
    return parser.parse_args()


def normalize_script_args(args: list[str]) -> list[str]:
    return args[1:] if args[:1] == ["--"] else args


def run_script(command_name: str, script_args: list[str]) -> int:
    command = COMMANDS[command_name]
    script_path = PYTHON_SCRIPTS_DIR / command.script
    if not script_path.exists():
        print(
            f"ERROR: Script not found: {script_path.relative_to(PACKAGE_DIR)}",
            file=sys.stderr,
        )
        return 1

    env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
    return subprocess.run(
        [sys.executable, str(script_path), *normalize_script_args(script_args)],
        cwd=PACKAGE_DIR,
        env=env,
    ).returncode


def main() -> int:
    args = parse_args()

    if args.command in (None, "help", "--help", "-h"):
        print("Usage: python3 datannur.py <command> [-- script options]\n")
        print("Commands:")
        print_commands()
        return 0

    if args.command == "static-deploy":
        static_code = run_script("static", args.args)
        if static_code != 0:
            return static_code
        return run_script("deploy", [])

    if args.command not in COMMANDS:
        print(f"ERROR: Unknown command: {args.command}", file=sys.stderr)
        print("\nAvailable commands:", file=sys.stderr)
        print_commands()
        return 1

    return run_script(args.command, args.args)


if __name__ == "__main__":
    raise SystemExit(main())
