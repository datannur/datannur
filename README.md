![datannur logo](https://raw.githubusercontent.com/datannur/datannur/main/package/app/assets/main-banner-dark.png?raw=true#gh-dark-mode-only)
![datannur logo](https://raw.githubusercontent.com/datannur/datannur/main/package/app/assets/main-banner.png?raw=true#gh-light-mode-only)

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/v/release/datannur/datannur?color=blue)](https://github.com/datannur/datannur/releases)
[![CI Tests](https://github.com/datannur/datannur/actions/workflows/ci.yml/badge.svg)](https://github.com/datannur/datannur/actions/workflows/ci.yml)
[![Deploy Status](https://github.com/datannur/datannur/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/datannur/datannur/actions/workflows/deploy-pages.yml)
[![Demo](https://img.shields.io/badge/demo-live-success)](https://dev.datannur.com/)

# datannur

datannur is an open-source data catalog that runs from static files, without requiring a server or database. This repository contains the datannur app; for most users, the easiest way to create a catalog from real files or databases is the Python builder, [`datannurpy`](https://github.com/datannur/datannurpy).

![datannur catalog screenshot](https://raw.githubusercontent.com/datannur/datannur/main/docs/public/screenshot_dashboard_dark.png?raw=true)

👉 [Try the live demo](https://dev.datannur.com/) · [Read the docs](https://docs.datannur.com/app/) · [Use the Python builder](https://github.com/datannur/datannurpy)

## Why datannur?

Useful datasets are often scattered across spreadsheets, databases, folders, definitions, and documentation. datannur helps make this metadata visible, understandable, and shareable while keeping the catalog lightweight, portable, and under your control.

Start small or scale gradually: generate a portable catalog, explore it in the browser, and share it from a local folder, shared drive, web server, or cloud storage.

## Quick start: generate a catalog with datannurpy

```bash
pip install datannurpy
```

Create a `catalog.yml`:

```yaml
# catalog.yml
app_path: ./my-catalog
open_browser: true

add:
  - folder: ./data
    include: ['*.csv', '*.xlsx', '*.parquet']

  - database: sqlite:///mydb.sqlite
```

Build and open the catalog:

```bash
python -m datannurpy catalog.yml
```

See the [datannurpy repository](https://github.com/datannur/datannurpy) and the [builder documentation](https://docs.datannur.com/builder/) for more input sources, including databases, cloud storage, and the Python API.

## This repository

The datannur app is the portable catalog interface that runs from a single `index.html`. It is bundled by `datannurpy` when you create a catalog, and this repository is the right place to develop the UI, inspect the app source, or explore the demo data.

**Key features:**

- **Zero-config deployment** - Runs from a single `index.html`
- **Portable** - Works locally, on shared drives, or cloud storage
- **Structured metadata** - Organizes catalogs around 8 core concepts: Organization, Folder, Tag, Concept, Doc, Dataset, Variable, and Enumeration
- **Browser-isolated** - Runs in the browser sandbox, with no direct system access
- **Multilingual interface** - English by default, with French and German support and browser language detection; Italian and Spanish are planned soon

## Documentation

🧰 **Builder:** [github.com/datannur/datannurpy](https://github.com/datannur/datannurpy)

🚀 **Demo:** [dev.datannur.com](https://dev.datannur.com/)

📖 **Full documentation:** [docs.datannur.com/app](https://docs.datannur.com/app/)

🌐 **Website:** [datannur.com](https://datannur.com)

## Contributing

For development documentation and contributing guidelines, see [`CONTRIBUTING.md`](https://github.com/datannur/datannur?tab=contributing-ov-file).

## License

MIT - see [LICENSE](LICENSE). All dependencies are MIT/Apache 2.0/BSD compatible.
