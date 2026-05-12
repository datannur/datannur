#!/usr/bin/env python3
"""Compile editable demo DB source files into jsonjsdb files."""

import csv
import json
import sys
from pathlib import Path
from typing import Any, NoReturn

from _local_runtime import APP_DIR

SOURCE_DIR = APP_DIR / "data" / "db-source"
OUTPUT_DIR = APP_DIR / "data" / "db"
MD_SOURCE_DIR = SOURCE_DIR / "md"
DATASET_SOURCE_DIR = SOURCE_DIR / "dataset"
MD_OUTPUT_DIR = OUTPUT_DIR / "md-doc"
PREVIEW_OUTPUT_DIR = OUTPUT_DIR / "preview"


def fail(message: str) -> NoReturn:
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(1)


def read_json_table(path: Path) -> list[dict[str, Any]]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(APP_DIR)} is not valid JSON: {error}")
    except UnicodeDecodeError:
        fail(f"{path.relative_to(APP_DIR)} is not valid UTF-8")
    except OSError as error:
        fail(f"Cannot read {path.relative_to(APP_DIR)}: {error}")

    if not isinstance(data, list):
        fail(f"{path.relative_to(APP_DIR)} must contain a JSON array")

    for index, item in enumerate(data):
        if not isinstance(item, dict):
            fail(f"{path.relative_to(APP_DIR)} item {index} must be an object")

    return data


def normalize_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    keys = sorted({key for row in rows for key in row})
    return [{key: row.get(key) for key in keys} for row in rows]


def sort_value(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def sort_rows(table_name: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if table_name == "value" and all(
        "enumeration_id" in row and "value" in row for row in rows
    ):
        return sorted(
            rows,
            key=lambda row: (
                sort_value(row["enumeration_id"]),
                sort_value(row["value"]),
            ),
        )

    if table_name == "frequency" and all(
        "variable_id" in row and "value" in row for row in rows
    ):
        return sorted(
            rows,
            key=lambda row: (sort_value(row["variable_id"]), sort_value(row["value"])),
        )

    if rows and all("id" in row for row in rows):
        return sorted(rows, key=lambda row: sort_value(row["id"]))

    return rows


def write_json(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def write_jsonjs(path: Path, table_name: str, rows: list[dict[str, Any]]) -> None:
    headers = list(rows[0].keys()) if rows else []
    data = [headers] + [[row.get(header) for header in headers] for row in rows]
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.write_text(f"jsonjs.data['{table_name}'] = {payload}\n", encoding="utf-8")


def write_table(table_name: str, rows: list[dict[str, Any]], output_dir: Path) -> None:
    json_path = output_dir / f"{table_name}.json"
    write_json(json_path, rows)
    write_jsonjs(json_path.with_suffix(".json.js"), table_name, rows)


def compile_json_tables() -> set[str]:
    table_names: set[str] = set()

    for source_path in sorted(SOURCE_DIR.glob("*.json")):
        table_name = source_path.stem
        rows = sort_rows(table_name, normalize_rows(read_json_table(source_path)))
        write_table(table_name, rows, OUTPUT_DIR)
        table_names.add(table_name)

    return table_names


def compile_markdown_docs() -> set[str]:
    doc_names: set[str] = set()

    if not MD_SOURCE_DIR.exists():
        return doc_names

    for source_path in sorted(MD_SOURCE_DIR.glob("*.md")):
        try:
            content = source_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            fail(f"{source_path.relative_to(APP_DIR)} is not valid UTF-8")
        except OSError as error:
            fail(f"Cannot read {source_path.relative_to(APP_DIR)}: {error}")

        doc_name = source_path.stem
        write_table(doc_name, [{"content": content}], MD_OUTPUT_DIR)
        doc_names.add(doc_name)

    return doc_names


def compile_csv_previews() -> set[str]:
    preview_names: set[str] = set()

    if not DATASET_SOURCE_DIR.exists():
        return preview_names

    for source_path in sorted(DATASET_SOURCE_DIR.glob("*.csv")):
        try:
            with source_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
                reader = csv.DictReader(csv_file)
                rows = [dict(row) for row in reader]
        except UnicodeDecodeError:
            fail(f"{source_path.relative_to(APP_DIR)} is not valid UTF-8")
        except csv.Error as error:
            fail(f"Cannot parse {source_path.relative_to(APP_DIR)}: {error}")
        except OSError as error:
            fail(f"Cannot read {source_path.relative_to(APP_DIR)}: {error}")

        preview_name = source_path.stem
        write_table(preview_name, rows, PREVIEW_OUTPUT_DIR)
        preview_names.add(preview_name)

    return preview_names


def remove_stale_files(output_dir: Path, current_names: set[str]) -> None:
    if not output_dir.exists():
        return

    for path in output_dir.glob("*.json"):
        if path.stem not in current_names:
            path.unlink()

    for path in output_dir.glob("*.json.js"):
        if path.name.removesuffix(".json.js") not in current_names:
            path.unlink()


def has_source_files() -> bool:
    return (
        any(SOURCE_DIR.glob("*.json"))
        or (MD_SOURCE_DIR.exists() and any(MD_SOURCE_DIR.glob("*.md")))
        or (DATASET_SOURCE_DIR.exists() and any(DATASET_SOURCE_DIR.glob("*.csv")))
    )


def main() -> None:
    if not SOURCE_DIR.exists():
        fail(f"Source directory not found: {SOURCE_DIR.relative_to(APP_DIR)}")

    if not has_source_files():
        fail(
            "No JSON, Markdown, or CSV source files found in "
            f"{SOURCE_DIR.relative_to(APP_DIR)}"
        )

    table_names = compile_json_tables()
    doc_names = compile_markdown_docs()
    preview_names = compile_csv_previews()

    remove_stale_files(OUTPUT_DIR, table_names)
    remove_stale_files(MD_OUTPUT_DIR, doc_names)
    remove_stale_files(PREVIEW_OUTPUT_DIR, preview_names)

    print(
        "Built "
        f"{len(table_names)} table(s), "
        f"{len(doc_names)} markdown doc(s), "
        f"{len(preview_names)} preview(s)."
    )


if __name__ == "__main__":
    main()
