#!/usr/bin/env python3
"""Export datannur geographic datasets to ISO 19139 metadata records.

Same post-processing pattern as the DCAT/STAC exports: read the generated
catalog JSON and emit static files — one ISO 19139 XML record per dataset that
has a bounding box. Reuses dcat-export.config.json and the export_common helpers.

The records are basic but valid: they carry the fields derivable from the
catalog. Full INSPIRE completeness (lineage, topic category, access conditions)
needs manually-entered metadata that a scan cannot produce.
"""

import json
import sys
from datetime import datetime, timezone
from typing import Dict, List, Optional

from _local_runtime import DATA_DIR, require_data_db_dir
from export_common import first_datetime, load_config, parse_bbox

try:
    from pygeometa.core import read_mcf
    from pygeometa.schemas.iso19139 import ISO19139OutputSchema
except ImportError as e:
    missing = str(e).split("'")[1] if "'" in str(e) else "pygeometa"
    print(f"❌ Missing dependency: {missing}")
    print("   Install with: pip install pygeometa")
    sys.exit(1)

FALLBACK_DATE = datetime(1970, 1, 1, tzinfo=timezone.utc)

# datannur geometry_type -> ISO geometric object type
GEOM_TYPES = {
    "point": "point",
    "multipoint": "point",
    "linestring": "curve",
    "multilinestring": "curve",
    "polygon": "surface",
    "multipolygon": "surface",
    "geometrycollection": "complex",
}


def _date(value: Optional[datetime]) -> str:
    return (value or FALLBACK_DATE).date().isoformat()


def _keywords(dataset: Dict, tags: Dict) -> List[str]:
    names = []
    for tag_id in str(dataset.get("tag_ids") or "").split(","):
        tag = tags.get(tag_id.strip())
        if tag and tag.get("name"):
            names.append(tag["name"])
    return names


def dataset_to_mcf(
    dataset: Dict, config: Dict, tags: Dict, organizations: Dict
) -> Optional[Dict]:
    coords = parse_bbox(dataset.get("bbox"))
    if coords is None:
        return None

    geometry_type = str(dataset.get("geometry_type") or "").lower()
    is_grid = not geometry_type and dataset.get("spatial_resolution") is not None

    base_uri = config.get("base_uri", "https://example.org/")
    landing = f"{base_uri}dataset/{dataset['id']}"
    title = dataset.get("name") or str(dataset["id"])
    abstract = dataset.get("description") or title

    owner = organizations.get(dataset.get("owner_organization_id"), {})
    org_name = owner.get("name") or config.get("catalog_publisher", "datannur")

    # The ISO geographic bounding box is always WGS84 (our bbox already is).
    extents: Dict = {"spatial": [{"bbox": list(coords), "crs": 4326}]}
    begin = first_datetime(dataset, ("start_date",))
    end = first_datetime(dataset, ("end_date",))
    if begin or end:
        extents["temporal"] = [
            {
                "begin": begin.date().isoformat() if begin else None,
                "end": end.date().isoformat() if end else None,
            }
        ]

    creation = _date(first_datetime(dataset))

    return {
        "mcf": {"version": 2.0},
        "metadata": {
            "identifier": str(dataset["id"]),
            "language": "eng",
            "charset": "utf8",
            "hierarchylevel": "dataset",
            "dataseturi": landing,
            "dates": {"creation": creation},
        },
        "spatial": {
            "datatype": "grid" if is_grid else "vector",
            "geomtype": GEOM_TYPES.get(geometry_type, "surface"),
        },
        "identification": {
            "language": "eng",
            "charset": "utf8",
            "title": title,
            "abstract": abstract,
            "dates": {"creation": creation},
            "keywords": {
                "default": {
                    "keywords": _keywords(dataset, tags),
                    "keywords_type": "theme",
                }
            },
            "extents": extents,
            "fees": "None",
            "accessconstraints": "otherRestrictions",
            "rights": dataset.get("license") or "See distributor",
            "url": landing,
            "status": "completed",
            "maintenancefrequency": "asNeeded",
        },
        "contact": {
            "pointOfContact": {"organization": org_name, "url": base_uri}
        },
        "distribution": {
            "data": {
                "url": dataset.get("data_path") or dataset.get("link") or landing,
                "type": "WWW:LINK-1.0-http--link",
                "name": title,
                "description": abstract,
                "function": "download",
            }
        },
    }


def main():
    config = load_config(DATA_DIR / "dcat-export.config.json")
    db_dir = require_data_db_dir(DATA_DIR.parent)
    output_dir = DATA_DIR / "db-semantic" / "iso"

    with open(db_dir / "dataset.json", "r", encoding="utf-8") as f:
        datasets = json.load(f)
    with open(db_dir / "tag.json", "r", encoding="utf-8") as f:
        tags = {tag["id"]: tag for tag in json.load(f)}
    with open(db_dir / "organization.json", "r", encoding="utf-8") as f:
        organizations = {org["id"]: org for org in json.load(f)}

    print("📊 Exporting datannur geographic datasets to ISO 19139...")
    writer = ISO19139OutputSchema()
    output_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    for dataset in datasets:
        mcf = dataset_to_mcf(dataset, config, tags, organizations)
        if mcf is None:
            continue
        xml = writer.write(read_mcf(mcf))
        (output_dir / f"{dataset['id']}.xml").write_text(xml, encoding="utf-8")
        count += 1

    print(f"  ✓ {count} geographic dataset(s) of {len(datasets)} total")
    if count:
        print(f"✓ Wrote ISO 19139 records to {output_dir}")


if __name__ == "__main__":
    main()
