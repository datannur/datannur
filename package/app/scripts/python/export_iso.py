#!/usr/bin/env python3
"""Export datannur geographic datasets to ISO 19139 metadata records.

Same post-processing pattern as the DCAT/STAC exports: read the generated
catalog JSON and emit static files — one ISO 19139 XML record per dataset that
has a bounding box. Reuses dcat-export.config.json and the export_common helpers.

The records are basic but valid: they carry the fields derivable from the
catalog. Full INSPIRE completeness (lineage, topic category, access conditions)
needs manually-entered metadata that a scan cannot produce.

A `--profile ch` flag adds the elements that the Swiss profile (eCH-0271,
expected by geocat.ch) makes mandatory on top of generic ISO 19139 — topic
category and a lineage / data-quality block — filled from config defaults so the
records are structurally complete and ingestable. The values are generic
placeholders unless overridden in config; accurate lineage and topic category
still warrant human review.
"""

import json
import sys
from datetime import datetime, timezone
from typing import Dict, List, Optional

from _local_runtime import DATA_DIR, require_data_db_dir
from export_common import (
    first_datetime,
    load_config,
    localized_field,
    parse_bbox,
    write_export_summary,
)

try:
    from pygeometa.core import read_mcf
    from pygeometa.schemas.iso19139 import ISO19139OutputSchema
except ImportError as e:
    missing = str(e).split("'")[1] if "'" in str(e) else "pygeometa"
    print(f"❌ Missing dependency: {missing}")
    print("   Install with: pip install pygeometa")
    sys.exit(1)

FALLBACK_DATE = datetime(1970, 1, 1, tzinfo=timezone.utc)

# catalog language (ISO 639-1) -> ISO 19139 metadata language (ISO 639-2)
ISO_LANGUAGES = {"en": "eng", "fr": "fra", "de": "deu", "it": "ita"}

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

# Swiss profile (eCH-0271) defaults for elements not derivable from a scan.
CH_DEFAULT_TOPIC_CATEGORY = "geoscientificInformation"
CH_DEFAULT_LINEAGE = (
    "Metadata generated automatically by datannur from the catalog; "
    "see the data provider for the full production lineage."
)


def _date(value: Optional[datetime]) -> str:
    return (value or FALLBACK_DATE).date().isoformat()


def _keywords(dataset: Dict, tags: Dict, language: str) -> List[str]:
    names = []
    for tag_id in str(dataset.get("tag_ids") or "").split(","):
        tag = tags.get(tag_id.strip())
        if tag:
            name = localized_field(tag, "name", language)
            if name:
                names.append(name)
    return names


def _apply_ch_profile(mcf: Dict, config: Dict) -> None:
    """Add the elements eCH-0271 (geocat.ch) makes mandatory over generic ISO.

    Topic category and a lineage / data-quality block — both filled from config
    defaults (generic placeholders) so the record is structurally complete.
    """
    topic = config.get("ch_topic_category") or CH_DEFAULT_TOPIC_CATEGORY
    mcf["identification"]["topiccategory"] = [topic]
    mcf["dataquality"] = {
        "scope": {"level": mcf["metadata"]["hierarchylevel"]},
        "lineage": {
            "statement": config.get("ch_lineage") or CH_DEFAULT_LINEAGE
        },
    }


def dataset_to_mcf(
    dataset: Dict, config: Dict, tags: Dict, organizations: Dict, profile: str = "eu"
) -> Optional[Dict]:
    coords = parse_bbox(dataset.get("bbox"))
    if coords is None:
        return None

    geometry_type = str(dataset.get("geometry_type") or "").lower()
    is_grid = not geometry_type and dataset.get("spatial_resolution") is not None

    base_uri = config.get("base_uri", "https://example.org/")
    landing = f"{base_uri}dataset/{dataset['id']}"
    language = config.get("default_language", config.get("language", "en"))
    iso_language = ISO_LANGUAGES.get(language, "eng")
    title = localized_field(dataset, "name", language) or str(dataset["id"])
    abstract = localized_field(dataset, "description", language) or title

    owner = organizations.get(dataset.get("owner_organization_id"), {})
    org_name = localized_field(owner, "name", language) or config.get(
        "catalog_publisher", "datannur"
    )

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

    mcf: Dict = {
        "mcf": {"version": 2.0},
        "metadata": {
            "identifier": str(dataset["id"]),
            "language": iso_language,
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
            "language": iso_language,
            "charset": "utf8",
            "title": title,
            "abstract": abstract,
            "dates": {"creation": creation},
            "keywords": {
                "default": {
                    "keywords": _keywords(dataset, tags, language),
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

    if profile == "ch":
        _apply_ch_profile(mcf, config)

    return mcf


def main():
    config = load_config(DATA_DIR / "dcat-export.config.json")
    profile = config.get("profile", "eu")
    if "--profile" in sys.argv:
        index = sys.argv.index("--profile")
        if index + 1 < len(sys.argv):
            profile = sys.argv[index + 1]
    db_dir = require_data_db_dir(DATA_DIR.parent)
    output_dir = DATA_DIR / "db-semantic" / "iso"

    with open(db_dir / "dataset.json", "r", encoding="utf-8") as f:
        datasets = json.load(f)
    with open(db_dir / "tag.json", "r", encoding="utf-8") as f:
        tags = {tag["id"]: tag for tag in json.load(f)}
    with open(db_dir / "organization.json", "r", encoding="utf-8") as f:
        organizations = {org["id"]: org for org in json.load(f)}

    label = "ISO 19139 (eCH-0271 / CH profile)" if profile == "ch" else "ISO 19139"
    print(f"📊 Exporting datannur geographic datasets to {label}...")
    writer = ISO19139OutputSchema()
    output_dir.mkdir(parents=True, exist_ok=True)

    records = []
    for dataset in datasets:
        mcf = dataset_to_mcf(dataset, config, tags, organizations, profile)
        if mcf is None:
            continue
        xml = writer.write(read_mcf(mcf))
        if not isinstance(xml, str):  # ISO19139 always stringifies; satisfy typing
            xml = json.dumps(xml, ensure_ascii=False)
        (output_dir / f"{dataset['id']}.xml").write_text(xml, encoding="utf-8")
        records.append(
            {"id": str(dataset["id"]), "file": f"iso/{dataset['id']}.xml"}
        )

    count = len(records)
    print(f"  ✓ {count} geographic dataset(s) of {len(datasets)} total")
    if count:
        print(f"✓ Wrote ISO 19139 records to {output_dir}")

    write_export_summary(
        output_dir.parent,
        "iso",
        "datannurIsoExport",
        {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "profile": "eCH-0271 / CH" if profile == "ch" else "ISO 19139",
            "recordCount": count,
            "datasetTotal": len(datasets),
            "records": records,
        },
    )


if __name__ == "__main__":
    main()
