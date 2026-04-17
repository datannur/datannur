#!/usr/bin/env python3
"""Generate redirect link files for file:// sharing."""

import json
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

# Entities that have detail pages
ENTITIES = ["institution", "folder", "dataset", "variable", "modality", "tag", "doc"]
MAX_WORKERS = int(os.environ.get("LINK_WORKERS", "8"))


def get_base_dir() -> Path:
    """Get the base directory (parent of python-scripts/)."""
    script_dir = Path(__file__).parent
    return script_dir.parent


def get_template_path(base_dir: Path) -> Path | None:
    """Get template path: custom from data/ or default from data-template/."""
    # Check for custom template in data/
    custom = base_dir / "data" / "link-redirect.html"
    if custom.exists():
        return custom
    # Fallback to default template
    default = base_dir / "data-template" / "link-redirect.html"
    if default.exists():
        return default
    return None


def get_db_dir(base_dir: Path) -> Path | None:
    """Find data directory: either db/ with JSON files or first subdirectory containing them."""
    db_dir = base_dir / "data" / "db"
    if not db_dir.exists():
        return None

    # Check if JSON files exist directly in db/
    if list(db_dir.glob("*.json")):
        return db_dir

    # Otherwise find first subdirectory with JSON files
    for subdir in db_dir.iterdir():
        if (
            subdir.is_dir()
            and not subdir.name.startswith(".")
            and list(subdir.glob("*.json"))
        ):
            return subdir

    return None


def load_entity_ids(db_dir: Path, entity: str) -> list[str]:
    """Load IDs from entity JSON file."""
    json_file = db_dir / f"{entity}.json"
    if not json_file.exists():
        return []

    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    return [str(item["id"]) for item in data if "id" in item]


def write_file(args: tuple[Path, bytes]) -> None:
    """Write content to file."""
    path, content = args
    path.write_bytes(content)


def generate_link_manifest(base_dir: Path, entity_ids: dict[str, list[str]]) -> None:
    """Generate link.json.js manifest listing all redirect files."""
    link_map = {entity: {id_: 1 for id_ in ids} for entity, ids in entity_ids.items()}

    content = f"jsonjs.data.link = {json.dumps(link_map, ensure_ascii=False)}\n"
    manifest_path = base_dir / "data" / "link.json.js"
    manifest_path.write_text(content, encoding="utf-8")


def generate_links(base_dir: Path) -> tuple[dict[str, int], int]:
    """Generate all link redirect files. Returns (count per entity, files written)."""
    template_path = get_template_path(base_dir)
    if not template_path:
        print("❌ Template not found (link-redirect.html)")
        return {}, 0

    db_dir = get_db_dir(base_dir)
    if not db_dir:
        print("❌ Database directory not found (data/db/)")
        return {}, 0

    # Read template once into memory
    template_content = template_path.read_bytes()

    # Output directory (inside data/)
    link_dir = base_dir / "data" / "link"

    counts = {}
    entity_ids: dict[str, list[str]] = {}
    files_to_write: list[tuple[Path, bytes]] = []

    for entity in ENTITIES:
        ids = load_entity_ids(db_dir, entity)
        if not ids:
            continue

        entity_dir = link_dir / entity
        entity_dir.mkdir(parents=True, exist_ok=True)

        # Get existing files in one call (no stat per file)
        existing = {f.name for f in entity_dir.iterdir() if f.name.endswith(".html")}

        # Collect missing files to write
        for id_ in ids:
            filename = f"{id_}.html"
            if filename not in existing:
                files_to_write.append((entity_dir / filename, template_content))

        entity_ids[entity] = ids
        counts[entity] = len(ids)

    # Write all files in parallel
    if files_to_write:
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            executor.map(write_file, files_to_write)

    if entity_ids:
        generate_link_manifest(base_dir, entity_ids)

    return counts, len(files_to_write)


def main():
    base_dir = get_base_dir()

    print(f"📁 Working directory: {base_dir}")

    result = generate_links(base_dir)
    if not result[0]:
        print("❌ No links generated")
    else:
        counts, written = result
        total = sum(counts.values())
        skipped = total - written
        if written > 0 and skipped > 0:
            print(f"✅ {written} new, {skipped} skipped ({total} total)")
        elif written > 0:
            print(f"✅ {written} new link files created")
        else:
            print(f"✅ All {total} link files already exist")


if __name__ == "__main__":
    main()
