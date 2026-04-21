#!/usr/bin/env python3
"""Install datannur auto-start at user login (macOS + Linux).

Usage: python3 python-scripts/install_autostart.py <app|llm>
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _autostart_common import install, parse_target  # noqa: E402

if __name__ == "__main__":
    install(parse_target(sys.argv))
