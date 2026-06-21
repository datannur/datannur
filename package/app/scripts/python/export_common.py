"""Shared helpers for the catalog export scripts (DCAT, STAC)."""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional


def load_config(config_file: Path, default: Optional[Dict] = None) -> Dict:
    """Load a JSON config file, or return `default` (or {}) when it is missing."""
    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return default if default is not None else {}


def parse_bbox(bbox) -> Optional[List[float]]:
    """Validate a [west, south, east, north] bbox; return its floats or None."""
    if (
        not isinstance(bbox, list)
        or len(bbox) != 4
        or not all(
            isinstance(v, (int, float)) and not isinstance(v, bool) for v in bbox
        )
    ):
        return None
    return [float(v) for v in bbox]


def parse_epsg(crs) -> Optional[int]:
    """Parse an 'EPSG:2056' style code into its integer (2056), else None."""
    if not crs:
        return None
    match = re.match(r"^EPSG:(\d+)$", str(crs).strip(), re.IGNORECASE)
    return int(match.group(1)) if match else None
