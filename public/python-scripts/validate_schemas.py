#!/usr/bin/env python3
"""Validate JSON schemas and data files against schemas."""

import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Optional

from _local_runtime import find_data_db_dir

try:
    from jsonschema import Draft7Validator
    from referencing import Registry, Resource
    from referencing.jsonschema import DRAFT7
except ImportError as e:
    missing = str(e).split("'")[1] if "'" in str(e) else "required packages"
    print(f"❌ Missing dependency: {missing}")
    print("   Install with: pip install jsonschema referencing")
    sys.exit(1)


def find_schemas_dir(base_dir: Path) -> Optional[Path]:
    """Find schemas directory."""
    schemas_dir = base_dir / "schemas"
    if schemas_dir.exists() and list(schemas_dir.glob("*.schema.json")):
        return schemas_dir
    return None


def format_validation_errors(validation_errors: list, entity_name: str) -> list[str]:
    """Group errors by schema path (property) and format with counts or precise locations."""
    # Group by schema_path (the property causing the error, e.g. "nb_row")
    error_groups: dict[tuple[str, str], list[str]] = defaultdict(list)

    for err in validation_errors:
        # schema_path = property path in schema (e.g. "properties.nb_row.type")
        schema_path = (
            ".".join(str(p) for p in err.schema_path) if err.schema_path else ""
        )
        # absolute_path = location in data (e.g. "0.nb_row")
        data_path = ".".join(str(p) for p in err.absolute_path) or entity_name
        # Use schema message pattern (without specific value) for grouping
        error_groups[(schema_path, err.validator)].append(data_path)

    formatted = []
    for (schema_path, validator), paths in error_groups.items():
        # Get a sample error to show the message
        sample_err = next(
            e
            for e in validation_errors
            if ".".join(str(p) for p in e.schema_path) == schema_path
            and e.validator == validator
        )
        # Extract property name from first path (e.g. "0.nb_row" -> "nb_row")
        prop = paths[0].split(".")[-1] if "." in paths[0] else paths[0]

        if len(paths) == 1:
            formatted.append(f"  {paths[0]}: {sample_err.message}")
        else:
            formatted.append(f"  {prop}: {sample_err.message} (×{len(paths)} items)")

    return formatted


script_dir = Path(__file__).parent
public_dir = script_dir.parent

schemas_dir = find_schemas_dir(public_dir)
if not schemas_dir:
    print("❌ Schemas directory not found")
    sys.exit(1)

data_dir = find_data_db_dir(public_dir)
if not data_dir:
    print("❌ Data directory not found (no JSON files in data/db/)")
    sys.exit(1)

print(f"📁 Data: {data_dir.relative_to(public_dir)}")

# Collect schema files
data_schemas = [
    {"file": f.name, "dir": schemas_dir, "type": "data"}
    for f in schemas_dir.glob("*.schema.json")
    if not f.name.startswith("__")
]

user_data_dir = schemas_dir / "userData"
user_data_schemas = (
    [
        {"file": f.name, "dir": user_data_dir, "type": "userData"}
        for f in user_data_dir.glob("*.schema.json")
    ]
    if user_data_dir.exists()
    else []
)

schema_files = data_schemas + user_data_schemas

# Load meta-schema
meta_schema = json.loads(
    (schemas_dir / "__meta__.schema.json").read_text(encoding="utf-8")
)
meta_validator = Draft7Validator(meta_schema)

errors = 0
schemas: dict[str, dict] = {}

print("📋 Validating schemas...")
for item in schema_files:
    schema_path = item["dir"] / item["file"]
    schema = json.loads(schema_path.read_text(encoding="utf-8"))

    meta_errors = list(meta_validator.iter_errors(schema))
    if meta_errors:
        print(f"❌ {item['file']} (meta-schema):")
        for err in meta_errors:
            print(f"  {err.message}")
        errors += 1
        continue

    entity_name = item["file"].replace(".schema.json", "")
    schemas[entity_name] = schema

if errors > 0:
    print(f"\n❌ {errors} schema(s) invalid\n")
    sys.exit(1)

print(f"✅ {len(schema_files)} schemas valid\n")

print("🔍 Validating data files...")
total_items = 0

registry = Registry().with_resources(
    [
        (name, Resource.from_contents(schema, default_specification=DRAFT7))
        for name, schema in schemas.items()
    ]
)

for item in schema_files:
    if item["type"] == "userData":
        continue

    entity_name = item["file"].replace(".schema.json", "")
    data_file = data_dir / f"{entity_name}.json"

    if not data_file.exists():
        continue

    try:
        data = json.loads(data_file.read_text(encoding="utf-8"))
        validator = Draft7Validator(schemas[entity_name], registry=registry)
        validation_errors = list(validator.iter_errors(data))

        if validation_errors:
            print(f"❌ {entity_name}.json:")
            for line in format_validation_errors(validation_errors, entity_name):
                print(line)
            errors += 1
        elif isinstance(data, list):
            total_items += len(data)
    except json.JSONDecodeError as e:
        print(f"❌ {entity_name}.json: {e}")
        errors += 1

if errors > 0:
    print("\n❌ Validation failed\n")
    sys.exit(1)

print(f"✅ {total_items} items validated")
sys.exit(0)
