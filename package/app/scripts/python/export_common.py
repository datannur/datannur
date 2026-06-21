"""Shared helpers for the catalog export scripts (DCAT, STAC, ISO)."""

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Sequence


def load_config(config_file: Path, default: Optional[Dict] = None) -> Dict:
    """Load a JSON config file, or return `default` (or {}) when it is missing."""
    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return default if default is not None else {}


def write_export_summary(
    output_dir: Path, basename: str, global_var: str, payload: Dict
) -> None:
    """Write an export summary the app's Interoperability page can read.

    Emits both `<basename>.json` (for the HTTP fetch path) and a file://-safe
    `<basename>.json.js` that assigns `window.<global_var>` (loaded via a script
    tag when the app runs from the filesystem). Mirrors the DCAT validation.json.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    (output_dir / f"{basename}.json").write_text(text, encoding="utf-8")
    safe = text.replace("</", "<\\/")
    (output_dir / f"{basename}.json.js").write_text(
        f"window.{global_var} = {safe};\n", encoding="utf-8"
    )


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


def parse_datetime(value) -> Optional[datetime]:
    """Parse a year / date / date-time / epoch value into a UTC datetime."""
    if value is None:
        return None
    text = str(value).strip()
    if re.fullmatch(r"\d{10}", text):
        return datetime.fromtimestamp(int(text), tz=timezone.utc)
    match = re.match(r"^(\d{4})(?:[/-](\d{1,2}))?(?:[/-](\d{1,2}))?", text)
    if not match:
        return None
    year, month, day = (
        int(match.group(1)),
        int(match.group(2) or 1),
        int(match.group(3) or 1),
    )
    try:
        return datetime(year, month, day, tzinfo=timezone.utc)
    except ValueError:
        return None


def first_datetime(
    dataset: Dict,
    fields: Sequence[str] = ("start_date", "last_update_date", "end_date"),
) -> Optional[datetime]:
    """First parseable date among the given dataset fields, or None."""
    for field in fields:
        parsed = parse_datetime(dataset.get(field))
        if parsed:
            return parsed
    return None
