![datannur logo](https://raw.githubusercontent.com/datannur/datannur/main/package/app/assets/main-banner-dark.png?raw=true#gh-dark-mode-only)
![datannur logo](https://raw.githubusercontent.com/datannur/datannur/main/package/app/assets/main-banner.png?raw=true#gh-light-mode-only)

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/v/release/datannur/datannur?color=blue)](https://github.com/datannur/datannur/releases)
[![CI Tests](https://github.com/datannur/datannur/actions/workflows/ci.yml/badge.svg)](https://github.com/datannur/datannur/actions/workflows/ci.yml)
[![Deploy Status](https://github.com/datannur/datannur/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/datannur/datannur/actions/workflows/deploy-pages.yml)
[![Demo](https://img.shields.io/badge/demo-live-success)](https://dev.datannur.com/)

# datannur

datannur is a client-side data catalog designed to organize and explore datasets without requiring a server or database. This repository contains the Datannur app; for most users, the easiest way to create a catalog from real files or databases is the Python builder, [`datannurpy`](https://github.com/datannur/datannurpy).

## Quick start: generate a catalog with datannurpy

```bash
pip install datannurpy
```

Create a minimal `catalog.yml`:

```yaml
app_path: ./my-catalog

add:
  - folder: ./data
    include: ['*.csv', '*.xlsx', '*.parquet']
```

Build and open the catalog:

```bash
python -m datannurpy catalog.yml
```

See the [datannurpy repository](https://github.com/datannur/datannurpy) and the [builder documentation](https://docs.datannur.com/builder/) for more input sources, including databases, cloud storage, and the Python API.

## This repository

The Datannur app is the portable catalog interface that runs from a single `index.html`. It is bundled by `datannurpy` when you create a catalog, and this repository is the right place to develop the UI, inspect the app source, or explore the demo data.

**Key features:**

- **Zero-config deployment** - Runs from a single `index.html`
- **Portable** - Works locally, on shared drives, or cloud storage
- **Structured metadata** - Organizes catalogs around 8 core concepts: Organization, Folder, Tag, Concept, Doc, Dataset, Variable, and Enumeration
- **Browser-isolated** - Runs in the browser sandbox, with no direct system access
- **Multilingual interface** - English by default, with French support and browser language detection; German, Italian, and Spanish are planned soon

## Documentation

🧰 **Builder:** [github.com/datannur/datannurpy](https://github.com/datannur/datannurpy)

🚀 **Demo:** [dev.datannur.com](https://dev.datannur.com/)

📖 **Full documentation:** [docs.datannur.com/app](https://docs.datannur.com/app/)

🌐 **Website:** [datannur.com](https://datannur.com)

## Contributing

For development documentation and contributing guidelines, see [`CONTRIBUTING.md`](https://github.com/datannur/datannur?tab=contributing-ov-file).

## License

MIT - see [LICENSE](LICENSE). All dependencies are MIT/Apache 2.0/BSD compatible.
