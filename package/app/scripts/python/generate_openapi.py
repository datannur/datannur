#!/usr/bin/env python3
"""Generate catalog-specific OpenAPI specs from data and official schemas."""

from __future__ import annotations

import copy
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from _local_runtime import (
    APP_DIR,
    DATA_DIR,
    PACKAGE_DIR,
    SCHEMAS_DIR,
    require_data_db_dir,
)

OPENAPI_VERSION = "3.1.0"
API_VERSION = "1.0.0"
SCALAR_API_REFERENCE_VERSION = "1.57.2"
CONTACT = {"name": "datannur", "url": "https://datannur.com"}
LICENSE = {"name": "MIT", "url": "https://opensource.org/licenses/MIT"}
IGNORE_TABLES = {"__table__"}
IGNORE_SCHEMA_FILES = {"__meta__.schema.json", "__table__.schema.json"}

OUTPUT_DIR = DATA_DIR / "api"

JsonObject = dict[str, Any]


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        sys.exit(f"ERROR: Invalid JSON in {path.relative_to(APP_DIR)}: {error}")
    except OSError as error:
        sys.exit(f"ERROR: Cannot read {path.relative_to(APP_DIR)}: {error}")


def write_json(path: Path, data: JsonObject) -> str:
    content = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    path.write_text(content, encoding="utf-8")
    return get_file_hash(path)


def get_file_hash(path: Path) -> str:
    content = path.read_bytes()
    return hashlib.sha256(content).hexdigest()[:8]


def write_html(path: Path, title: str, spec_file: str, spec_hash: str) -> None:
    content = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="../../app/assets/icon/icon.ico" sizes="any" />
    <title>{title}</title>
    <style>
      body {{
        margin: 0;
        padding: 0;
      }}

            scalar-api-reference {{
                --scalar-font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }}
    </style>
  </head>
  <body>
        <script
            id="api-reference"
            data-url="./{spec_file}?v={spec_hash}"
            data-layout="modern"
            data-theme="default"
        ></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@{SCALAR_API_REFERENCE_VERSION}"></script>
  </body>
</html>
"""
    path.write_text(content, encoding="utf-8")


def convert_json_schema_to_openapi(schema: Any) -> Any:
    if isinstance(schema, list):
        return [convert_json_schema_to_openapi(item) for item in schema]

    if not isinstance(schema, dict):
        return schema

    converted = {
        key: convert_json_schema_to_openapi(value)
        for key, value in schema.items()
        if key not in {"$schema", "$id"}
    }
    return converted


def get_table_name(schema_file: Path) -> str:
    return schema_file.name.removesuffix(".schema.json")


def load_official_schemas() -> dict[str, JsonObject]:
    if not SCHEMAS_DIR.exists():
        sys.exit("ERROR: schemas directory not found")

    schemas: dict[str, JsonObject] = {}
    for schema_file in sorted(SCHEMAS_DIR.glob("*.schema.json")):
        if schema_file.name in IGNORE_SCHEMA_FILES:
            continue
        schema = read_json(schema_file)
        if isinstance(schema, dict):
            schemas[get_table_name(schema_file)] = schema

    return schemas


def load_table_samples(data_dir: Path) -> dict[str, JsonObject]:
    samples_by_table: dict[str, JsonObject] = {}

    for data_file in sorted(data_dir.glob("*.json")):
        table_name = data_file.stem
        if table_name in IGNORE_TABLES:
            continue

        data = read_json(data_file)
        if not isinstance(data, list):
            print(f"WARNING: Skipping {data_file.name}: expected a JSON array")
            continue

        first_record = next((item for item in data if isinstance(item, dict)), None)
        if first_record:
            samples_by_table[table_name] = first_record
        else:
            print(f"INFO: Skipping {data_file.name}: no object records")

    return samples_by_table


def get_observed_fields(sample: JsonObject) -> list[str]:
    return sorted(sample.keys())


def get_schema_name(schema: JsonObject, fallback: str) -> str:
    title = schema.get("title")
    return title if isinstance(title, str) and title else fallback


def get_item_schema(schema: JsonObject) -> JsonObject:
    items = schema.get("items")
    if schema.get("type") == "array" and isinstance(items, dict):
        return items
    return schema


def filter_object_schema(schema: JsonObject, observed_fields: list[str]) -> JsonObject:
    filtered = copy.deepcopy(schema)
    properties = filtered.get("properties")
    if not isinstance(properties, dict):
        return filtered

    observed = set(observed_fields)
    filtered["properties"] = {
        key: value for key, value in properties.items() if key in observed
    }

    required = filtered.get("required")
    if isinstance(required, list):
        filtered["required"] = [field for field in required if field in observed]

    return filtered


def build_filtered_schema(
    table_name: str,
    official_schema: JsonObject,
    observed_fields: list[str],
) -> JsonObject | None:
    item_schema = get_item_schema(official_schema)
    properties = item_schema.get("properties")
    if not isinstance(properties, dict):
        print(f"WARNING: Skipping {table_name}: schema has no object properties")
        return None

    unknown_fields = sorted(set(observed_fields) - set(properties.keys()))
    if unknown_fields:
        print(
            f"WARNING: {table_name}.json contains fields not in official schema: "
            + ", ".join(unknown_fields)
        )

    known_fields = [field for field in observed_fields if field in properties]
    if not known_fields:
        print(f"INFO: Skipping {table_name}: no schema-covered fields observed")
        return None

    filtered = copy.deepcopy(official_schema)
    if filtered.get("type") == "array" and isinstance(filtered.get("items"), dict):
        filtered["items"] = filter_object_schema(filtered["items"], known_fields)
    else:
        filtered = filter_object_schema(filtered, known_fields)

    return convert_json_schema_to_openapi(filtered)


def build_catalog_schemas(
    official_schemas: dict[str, JsonObject],
    samples_by_table: dict[str, JsonObject],
) -> dict[str, JsonObject]:
    schemas: dict[str, JsonObject] = {}

    for table_name, sample in samples_by_table.items():
        official_schema = official_schemas.get(table_name)
        if official_schema is None:
            print(f"WARNING: Skipping {table_name}.json: official schema not found")
            continue

        filtered_schema = build_filtered_schema(
            table_name,
            official_schema,
            get_observed_fields(sample),
        )
        if filtered_schema is not None:
            schemas[table_name] = filtered_schema

    return schemas


def build_raw_api_spec(schemas: dict[str, JsonObject]) -> JsonObject:
    paths: JsonObject = {}
    tags: list[JsonObject] = []

    for table_name, schema in schemas.items():
        schema_name = get_schema_name(schema, table_name)
        description = schema.get("description", f"{table_name} table")

        tags.append({"name": table_name, "description": description})
        paths[f"/{table_name}.json"] = {
            "get": {
                "summary": f"Get all {table_name}",
                "description": f"Returns the complete {table_name} table as a JSON array",
                "tags": [table_name],
                "responses": {
                    "200": {
                        "description": "Successful response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": f"#/components/schemas/{schema_name}"
                                }
                            }
                        },
                    },
                    "404": {"description": "Table not found"},
                },
            }
        }

    return {"schemas": schemas, "paths": paths, "tags": tags}


def get_query_parameters(item_schema: JsonObject) -> list[JsonObject]:
    parameters: list[JsonObject] = [
        {
            "name": "_limit",
            "in": "query",
            "schema": {"type": "integer"},
            "description": "Limit number of results",
        },
        {
            "name": "_offset",
            "in": "query",
            "schema": {"type": "integer"},
            "description": "Offset for pagination",
        },
        {
            "name": "_sort",
            "in": "query",
            "schema": {"type": "string"},
            "description": "Field to sort by",
        },
        {
            "name": "_order",
            "in": "query",
            "schema": {"type": "string", "enum": ["asc", "desc"]},
            "description": "Sort order",
        },
    ]

    properties = item_schema.get("properties")
    if isinstance(properties, dict):
        for field_name, field_schema in properties.items():
            if field_name == "id" or not isinstance(field_schema, dict):
                continue
            parameters.append(
                {
                    "name": field_name,
                    "in": "query",
                    "schema": field_schema,
                    "description": f"Filter by {field_name}",
                }
            )

    return parameters


def build_restful_api_spec(schemas: dict[str, JsonObject]) -> JsonObject:
    api_schemas: dict[str, JsonObject] = {}
    paths: JsonObject = {}
    tags: list[JsonObject] = []

    for table_name, schema in schemas.items():
        schema_name = get_schema_name(schema, table_name)
        description = schema.get("description", f"{table_name} table")
        item_schema = get_item_schema(schema)

        api_schemas[schema_name] = item_schema
        tags.append({"name": table_name, "description": description})

        paths[f"/{table_name}"] = {
            "get": {
                "summary": f"Get all {table_name} records",
                "description": f"Returns records from the {table_name} table with optional filtering, pagination, and sorting",
                "tags": [table_name],
                "parameters": get_query_parameters(item_schema),
                "responses": {
                    "200": {
                        "description": "Successful response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": {
                                        "$ref": f"#/components/schemas/{schema_name}"
                                    },
                                }
                            }
                        },
                    }
                },
            }
        }

        paths[f"/{table_name}/{{id}}"] = {
            "get": {
                "summary": f"Get {table_name} by ID",
                "description": f"Returns a single record from the {table_name} table by its ID",
                "tags": [table_name],
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                        "description": "Record ID",
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": f"#/components/schemas/{schema_name}"
                                }
                            }
                        },
                    },
                    "404": {"description": "Record not found"},
                },
            }
        }

    return {"schemas": api_schemas, "paths": paths, "tags": tags}


def build_openapi(
    spec: JsonObject,
    title: str,
    description: str,
    server_url: str,
) -> JsonObject:
    return {
        "openapi": OPENAPI_VERSION,
        "info": {
            "title": title,
            "description": description,
            "version": API_VERSION,
            "contact": CONTACT,
            "license": LICENSE,
        },
        "servers": [{"url": server_url, "description": "API Server"}],
        "paths": spec["paths"],
        "components": {"schemas": spec["schemas"]},
        "tags": spec["tags"],
    }


def generate_openapi() -> None:
    data_dir = require_data_db_dir(APP_DIR)

    official_schemas = load_official_schemas()
    samples_by_table = load_table_samples(data_dir)
    schemas = build_catalog_schemas(official_schemas, samples_by_table)
    if not schemas:
        sys.exit("ERROR: No schema-covered catalog data found")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    raw_spec = build_openapi(
        build_raw_api_spec(schemas),
        "datannur Raw API",
        "Read-only API providing direct access to this datannur catalog's JSON database files.",
        "data/db",
    )
    restful_spec = build_openapi(
        build_restful_api_spec(schemas),
        "datannur API",
        "RESTful API for this datannur data catalog, with read-only access to observed catalog tables and fields.",
        "/api",
    )

    raw_hash = write_json(OUTPUT_DIR / "openapi-raw.json", raw_spec)
    restful_hash = write_json(OUTPUT_DIR / "openapi.json", restful_spec)

    write_html(
        OUTPUT_DIR / "api-docs-raw.html",
        "datannur Raw API Documentation",
        "openapi-raw.json",
        raw_hash,
    )
    write_html(
        OUTPUT_DIR / "api-docs.html",
        "datannur API Documentation",
        "openapi.json",
        restful_hash,
    )

    print(f"Data: {data_dir.relative_to(PACKAGE_DIR)}")
    print(f"Output: {OUTPUT_DIR.relative_to(PACKAGE_DIR)}")
    print(f"Tables: {len(schemas)}")
    print("Generated openapi.json, openapi-raw.json, api-docs.html, api-docs-raw.html")


if __name__ == "__main__":
    generate_openapi()
