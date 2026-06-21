#!/usr/bin/env python3
"""Export datannur geographic datasets to a static STAC catalog.

Same post-processing pattern as export_dcat.py: read the generated catalog JSON
and emit static files. One STAC Item per dataset that has a bounding box.
Reuses dcat-export.config.json for the catalog identity.
"""

import json
import sys
from datetime import datetime, timezone
from typing import Dict, List, Optional

from _local_runtime import DATA_DIR, require_data_db_dir
from export_common import first_datetime, load_config, parse_bbox, parse_epsg

try:
    import pystac
    from pystac.extensions.projection import ProjectionExtension
except ImportError as e:
    missing = str(e).split("'")[1] if "'" in str(e) else "pystac"
    print(f"❌ Missing dependency: {missing}")
    print("   Install with: pip install pystac")
    sys.exit(1)

# Fallback datetime for datasets with no usable date (STAC requires one).
FALLBACK_DATETIME = datetime(1970, 1, 1, tzinfo=timezone.utc)


def bbox_to_geometry(bbox: List[float]) -> Dict:
    """Footprint polygon (CRS84 lon/lat) derived from the bounding box."""
    west, south, east, north = bbox
    return {
        "type": "Polygon",
        "coordinates": [
            [
                [west, south],
                [east, south],
                [east, north],
                [west, north],
                [west, south],
            ]
        ],
    }


def build_item(dataset: Dict) -> Optional[pystac.Item]:
    bbox = parse_bbox(dataset.get("bbox"))
    if bbox is None:
        return None

    properties: Dict = {}
    if dataset.get("name"):
        properties["title"] = dataset["name"]
    if dataset.get("description"):
        properties["description"] = dataset["description"]
    resolution = dataset.get("spatial_resolution")
    if isinstance(resolution, (int, float)) and not isinstance(resolution, bool):
        properties["gsd"] = resolution

    item = pystac.Item(
        id=str(dataset["id"]),
        geometry=bbox_to_geometry(bbox),
        bbox=bbox,
        datetime=first_datetime(dataset) or FALLBACK_DATETIME,
        properties=properties,
    )

    epsg = parse_epsg(dataset.get("crs"))
    if epsg:
        ProjectionExtension.ext(item, add_if_missing=True).epsg = epsg

    data_href = dataset.get("data_path") or dataset.get("link")
    if data_href:
        item.add_asset("data", pystac.Asset(href=data_href, roles=["data"]))

    return item


def build_catalog(config: Dict, datasets: List[Dict]) -> tuple[pystac.Catalog, int]:
    catalog = pystac.Catalog(
        id=f"{config.get('organization_slug', 'datannur')}-stac",
        title=config.get("catalog_title", "datannur STAC Catalog"),
        description=config.get(
            "catalog_description", "datannur geographic datasets"
        ),
    )
    count = 0
    for dataset in datasets:
        item = build_item(dataset)
        if item is not None:
            catalog.add_item(item)
            count += 1
    return catalog, count


def main():
    config = load_config(DATA_DIR / "dcat-export.config.json")
    db_dir = require_data_db_dir(DATA_DIR.parent)
    output_dir = DATA_DIR / "db-semantic" / "stac"

    with open(db_dir / "dataset.json", "r", encoding="utf-8") as f:
        datasets = json.load(f)

    print("📊 Exporting datannur geographic datasets to STAC...")
    catalog, count = build_catalog(config, datasets)
    print(f"  ✓ {count} geographic dataset(s) of {len(datasets)} total")

    if count == 0:
        print("No geographic datasets (with a bbox) found — nothing to export.")
        return

    catalog.normalize_hrefs(str(output_dir))
    catalog.save(catalog_type=pystac.CatalogType.SELF_CONTAINED)
    print(f"✓ Wrote STAC catalog to {output_dir}")

    print("Validating against STAC schemas...")
    try:
        catalog.validate_all()
        print("✓ Validation passed — valid STAC")
    except Exception as error:  # noqa: BLE001 - report any validation failure
        print(f"⚠️  STAC validation failed: {error}")


if __name__ == "__main__":
    main()
