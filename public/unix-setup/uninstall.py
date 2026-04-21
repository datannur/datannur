#!/usr/bin/env python3
"""Uninstall datannur auto-start.

Usage: python3 uninstall.py <app|llm>
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import parse_target, uninstall  # noqa: E402

if __name__ == "__main__":
    uninstall(parse_target(sys.argv))
