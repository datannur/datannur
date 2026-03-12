#!/usr/bin/env python3
"""Generate redirect link files for file:// sharing."""

import json
from pathlib import Path

# Entities that have detail pages
ENTITIES = ["institution", "folder", "dataset", "variable", "modality", "tag", "doc"]


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


def generate_links(base_dir: Path) -> dict[str, int]:
    """Generate all link redirect files. Returns count per entity."""
    template_path = get_template_path(base_dir)
    if not template_path:
        print("❌ Template not found (link-redirect.html)")
        return {}

    db_dir = get_db_dir(base_dir)
    if not db_dir:
        print("❌ Database directory not found (data/db/)")
        return {}

    # Read template once into memory
    template_content = template_path.read_bytes()

    # Output directory (same level as data/)
    link_dir = base_dir / "link"

    counts = {}

    for entity in ENTITIES:
        ids = load_entity_ids(db_dir, entity)
        if not ids:
            continue

        entity_dir = link_dir / entity
        entity_dir.mkdir(parents=True, exist_ok=True)

        for id_ in ids:
            (entity_dir / f"{id_}.html").write_bytes(template_content)

        counts[entity] = len(ids)

    return counts


def main():
    base_dir = get_base_dir()

    print(f"📁 Working directory: {base_dir}")

    counts = generate_links(base_dir)

    if not counts:
        print("❌ No links generated")
    else:
        print(f"✅ Generated {sum(counts.values())} link files")


if __name__ == "__main__":
    main()
