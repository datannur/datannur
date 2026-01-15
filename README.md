![datannur logo](https://raw.githubusercontent.com/datannur/datannur/main/public/assets/main-banner-dark.png?raw=true#gh-dark-mode-only)
![datannur logo](https://raw.githubusercontent.com/datannur/datannur/main/public/assets/main-banner.png?raw=true#gh-light-mode-only)

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/v/release/datannur/datannur?color=blue)](https://github.com/datannur/datannur/releases)
[![CI Tests](https://github.com/datannur/datannur/actions/workflows/ci.yml/badge.svg)](https://github.com/datannur/datannur/actions/workflows/ci.yml)
[![Deploy Status](https://github.com/datannur/datannur/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/datannur/datannur/actions/workflows/deploy-pages.yml)
[![Demo](https://img.shields.io/badge/demo-live-success)](https://datannur.github.io/datannur/)

# datannur

datannur is a client-side data catalog designed to organize and explore datasets without requiring server and database infrastructure.

**Key features:**

- **Zero-config deployment** - Single entry point (index.html) that runs in any browser
- **Portable** - Works locally, on shared drives, or cloud storage
- **Comprehensive metadata** - Structured around 7 core concepts: Institution, Folder, Tag, Doc, Dataset, Variable, and Modality
- **Browser-isolated** - No system access, inherently secure
- **French interface** - Currently available in French, with multilingual support planned for future releases

> **Contributing:** For development documentation and contributing guidelines, see [`CONTRIBUTING.md`](https://github.com/datannur/datannur?tab=contributing-ov-file).

**🌐 More info:** [datannur.com](https://datannur.com)

## Table of Contents

- [Demo](#demo)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Data Integration](#data-integration)
  - [Database Structure](#database-structure)
  - [File Format Specifications](#file-format-specifications)
    - [Table Registry](#table-registry)
  - [Data Schema Overview](#data-schema-overview)
    - [Configuration Options](#configuration-options)
  - [Excel to jsonjsdb format](#excel-to-jsonjsdb-format)
- [Updates](#updates)
  - [Automatic Update (Recommended)](#automatic-update-recommended)
  - [Manual Update](#manual-update)
- [Web Deployment](#web-deployment)
  - [Static Page Generation](#static-page-generation)
  - [Deployment](#deployment)
  - [URL Rewriting](#url-rewriting)
- [DCAT-AP-CH Export](#dcat-ap-ch-export)
- [API Access](#api-access)
  - [Raw API](#raw-api)
  - [RESTful API](#restful-api)
- [Advanced Configuration](#advanced-configuration)
  - [DB Configuration](#db-configuration)
    - [app-name](#app-name)
    - [path](#path)
    - [db-key (Optional)](#db-key-optional)
- [License](#license)

## Demo

🚀 **[Try the live demo](https://datannur.github.io/datannur/)**

![datannur interface](https://raw.githubusercontent.com/datannur/datannur/main/public/assets/about-page/dossier-sitg-tab-dataset-dark.webp#gh-dark-mode-only)
![datannur interface](https://raw.githubusercontent.com/datannur/datannur/main/public/assets/about-page/dossier-sitg-tab-dataset.webp#gh-light-mode-only)

## Quick Start

1. **Download** the app to your computer - [download here](https://github.com/datannur/datannur/releases/latest/download/datannur-app-latest.zip)
2. **Open** the `index.html` file in your browser
3. **Explore** the demo metadata to understand how it works
4. **Replace** the demo metadata in `/data/db/` with your own

## Project Structure

> **📁 Context:** This structure represents the **distributed application** (inside the `app/` folder or downloaded package). For development structure, see the full repository.

Here is the top-level structure:

```
├── assets/                     # Static assets (JS, images, etc.)
├── data/                       # ⚠️ YOUR DATA - Only folder to modify
├── data-template/              # Templates to copy into data/
├── node-scripts/               # Node.js scripts (deploy, static generation, sync db, etc.)
├── python-scripts/             # Python scripts (update app, export dcat, proxy llm, etc.)
├── .htaccess                   # Apache configuration (clean URLs, cache)
├── .nojekyll                   # Disables Jekyll on GitHub Pages
├── CHANGELOG.md                # Application changelog
├── LICENSE                     # License information
├── README.md                   # This documentation
├── index.html                  # Application entry point
├── manifest.json               # PWA configuration
├── package.json                # Node.js package manifest for node-scripts/
├── tsconfig.json               # TypeScript configuration for node-scripts/
```

> **⚠️ Important:** Only the `/data/` folder should be modified by the user (adding/modifying your metadata). All other files constitute the application and should not be edited, except in exceptional cases or for advanced configuration.

## Data Integration

### Database Structure

datannur uses a client-side relational database powered by [jsonjsdb](https://github.com/datannur/jsonjsdb). Your metadata must be structured as a relational database with specific requirements:

- **Database location**: By default in `/data/db/` folder (see [path](#path) for customization options)
- **Tables**: Each table is stored in two files (`.json` and `.json.js`)
- **Table registry**: `__table__.json` file lists all available tables
- **Primary keys**: Must be a column named `id`
- **Foreign keys**: Columns named after the foreign table with `_id` suffix (e.g., `dataset_id`)
- **Many-to-many relationships**: Two approaches available:
  - **Array of IDs** (recommended): Use `_ids` suffix with comma-separated values (e.g., `tag_ids: "1,3,7"`)
  - **Junction tables**: Use underscore notation (e.g., `dataset_tag` table)

### File Format Specifications

Each table is stored in two formats:

**`.json` files** - Standard JSON format (source of truth, editable):

```json
[
  {
    "id": 1,
    "name": "Example item",
    "description": "Item description"
  },
  {
    "id": 2,
    "name": "Another item",
    "description": "Another description"
  }
]
```

**`.json.js` files** - Compact format (auto-generated, optimized for browser):

```javascript
jsonjs.data['dataset'] = [
  ['id', 'name', 'description'],
  [1, 'Example item', 'Item description'],
  [2, 'Another item', 'Another description'],
]
```

> **💡 Note:** Both files are generated automatically by jsonjsdb-builder. Edit only the `.json` files - the `.json.js` files are derived for optimal browser performance

#### Table Registry

The `__table__.json` file serves as a registry of all available tables in your database:

```json
[
  {
    "name": "dataset",
    "last_modif": 1753608552
  },
  {
    "name": "folder",
    "last_modif": 1757018090
  },
  {
    "name": "__table__",
    "last_modif": 1757018100
  }
]
```

**Key features:**

- **name**: Table name (must match the corresponding `.json` and `.json.js` filenames)
- **last_modif**: Unix timestamp of last modification (in seconds), used for caching optimization
- **Special entry**: The `"__table__"` entry tracks the overall metadata update time, displayed in the catalog interface

### Data Schema Overview

The catalog supports several entities with flexible relationships. All tables are optional - use only what you need:

> **📋 Schema Reference:** For complete schema details, see the metadata page at `index.html#/meta` in your catalog, which displays all tables and variables based on the current data structure. The "localisation" column indicates whether each table/variable exists only in schema, only in data, or both (when empty).
>
> **🔗 Entity Organization:** For information about entities and their relationships, see the about page at `index.html#/about?tab=about_organisation` in your catalog.

#### Configuration Options

The `config.json` file allows you to customize various application settings:

```json
[
  {
    "id": "contact_email",
    "value": "contact@yourdomain.com"
  },
  {
    "id": "filter_1",
    "value": "open_data : Open Data"
  },
  {
    "id": "filter_2",
    "value": "closed_data : Closed Data"
  },
  {
    "id": "banner",
    "value": "![main-banner no_caption](data/img/main-banner.png)"
  }
]
```

**Available options:**

- **contact_email**: Contact email displayed in the catalog interface
- **filter_1, filter_2, ...**: Custom filter options for datasets type (format: `"key : Display Name"`)

**About page/tab customization:**

The "About" content (both homepage tab and dedicated page) is composed of three sections: `banner` + `body` + `more_info`. Each can be customized independently using Markdown.

- **banner**: Custom main banner image
  - Add `no_caption` to hide image caption
  - Add `{darkMode}` in the filename (`main-banner{darkMode}`). This will show `main-banner.png` in light mode and `main-banner-dark.png` in dark mode
- **body**: Custom main content
- **more_info**: Custom additional information

### Excel to jsonjsdb format

- Use the script `node-scripts/sync-db.ts` to convert Excel files to both `.json` and `.json.js` formats
- Run with:
  ```bash
  npm run sync-db
  ```
- The script supports watch mode: any changes to your Excel files are automatically detected and converted, keeping your metadata up to date in real time

## Updates

### Automatic Update (Recommended)

If you have Python installed, you can update automatically:

```bash
python3 python-scripts/update_app.py
```

> **💡 Note:** The update script uses only Python's standard library - no additional dependencies required! Just run it directly with any Python 3.8+ installation.

**Configuration options** in `data/update_app.json`:

- **targetVersion**: Choose `"latest"` (stable), `"pre-release"` (newest), or specific version `"x.x.x"`
- **proxyUrl**: Optional proxy for downloading files
- **include**: List of files/folders to update

### Manual Update

If you don't have Python, you can:

1. Download the latest version from [Latest release](https://github.com/datannur/datannur/releases/latest/download/datannur-app-latest.zip)
2. Replace the old files with new ones
3. Keep your `/data/` folder to preserve your data

## Web Deployment

For public web deployment with SEO optimization and clean URLs:

### Static Page Generation

Generate SEO-friendly static pages:

```bash
npm run static-make
```

**Configuration** in `data/static-make.config.json`:

- **domain**: Your public domain (e.g., `"https://yourdomain.com"`) - required for sitemap generation when `indexSeo: true`
- **indexSeo**: `true` to allow search engine indexing, `false` to add `noindex` meta tag (default: `false`)
- **entities**: Which entity types to generate static pages for
- **routes**: Which routes to pre-generate

> **Note:** This setup requires an Apache server with mod_rewrite enabled. Static generation creates SEO-optimized HTML files while maintaining the full SPA functionality.

### Deployment

The deployment script `node-scripts/deploy.ts` automates the process of publishing your app to a remote server using `rsync` over SSH.

**Usage:**

```bash
npm run deploy
```

**How it works:**

- Reads deployment settings from `deploy.config.json` (see `data-template/deploy.config.json` for an example).
- Uses `rsync` to synchronize your local files to the remote server, with options for excluding files and deleting removed files.
- Supports SSH key authentication and custom port configuration.
- Shows progress and errors directly in the terminal.

**Configuration options:**

- `host`, `port`, `username`, `privateKeyPath`: SSH connection details
- `remotePath`: Destination folder on the server
- `ignore`: Array of file/folder patterns to exclude
- `syncOption.delete`: If true, files deleted locally are also deleted remotely

> If no config is found, the script will prompt you to create one from the template (`data-template/deploy.config.json`).

### URL Rewriting

The included `.htaccess` file enables:

- **Clean URLs**: `/dataset/123` instead of `#/dataset/123`
- **Static page fallback**: Serves pre-generated HTML when available
- **HTTPS redirect**: Automatic redirect to secure connection
- **Caching**: Optimized cache headers for assets

## DCAT-AP-CH Export

datannur can export your catalog metadata to DCAT-AP-CH format, making it compatible with [opendata.swiss](https://opendata.swiss) and other semantic web portals.

**Export script:** `python-scripts/export_dcat.py`

**Configuration:** Edit `/data/dcat-export.config.json` to set:

- `catalog_uri`: URI of your catalog
- `base_uri`: Base URI for generating dataset/publisher URIs
- `catalog_title`, `catalog_description`, `catalog_publisher`: Catalog metadata

**Usage:**

```bash
# Export to RDF/XML (default)
python python-scripts/export_dcat.py

# Export to JSON-LD
python python-scripts/export_dcat.py json-ld
```

**Output:** Generated files in `/data/db-semantic/`:

- `dcat.rdf` - RDF/XML format
- `dcat.jsonld` - JSON-LD format

The export includes automatic SHACL validation to ensure DCAT-AP 2.1.1 compliance.

## API Access

datannur provides two read-only API endpoints for programmatic access to your catalog data. Both APIs are automatically generated from your database schemas.

**API documentation:** Available at `/api/api-docs.html` (RESTful) and `/api/api-docs-raw.html` (Raw) in your deployed catalog.

### Raw API

Direct access to database JSON files with no server-side processing.

**Endpoint pattern:** `/data/db/{table}.json`

**Example:**

```
GET /data/db/dataset.json
```

Returns the complete table as a JSON array.

### RESTful API

Query-based API with filtering, pagination, and sorting capabilities. Requires a server-side implementation (PHP or Node.js).

**Endpoint patterns:**

- `GET /api/php/{table}` - Get all records (with optional query parameters)
- `GET /api/php/{table}/{id}` - Get single record by ID

**Query parameters:**

- `_limit`: Limit number of results
- `_offset`: Offset for pagination
- `_sort`: Field to sort by
- `_order`: Sort order (`asc` or `desc`)
- Additional filters by field name

**Examples:**

```
GET /api/php/dataset?_limit=10&_sort=name&_order=asc
GET /api/php/dataset/123
GET /api/php/dataset?folder_id=5
```

> **Server requirement:** The RESTful API requires either PHP 7.4+ or Node.js to run. The Raw API works with any static file server.

## Advanced Configuration

### DB Configuration

The app uses a configuration automatically embedded in `index.html`:

```html
<div
  id="jsonjsdb-config"
  style="display:none;"
  data-app-name="datannur-app"
  data-path="data/db"
></div>
```

> **💡 Best Practice:** Instead of editing `index.html` directly, modify the configuration in `/data/jsonjsdb-config.html` and then:
>
> - Run `python3 python-scripts/update_app.py` to automatically apply the configuration, OR
> - Manually copy the configuration block from `/data/jsonjsdb-config.html` to `index.html`
>
> This approach ensures your configuration is preserved during application updates.

#### app-name

The `data-app-name` parameter is an application identifier used as a namespace for user data stored in the browser (favorites, search history, settings).

**Default value:** `"datannur-app"`

**Use case:** Change this value when running multiple catalog instances from the same location to keep user data separate. For example, use `"catalog-dev"` and `"catalog-prod"` to isolate development and production environments.

#### path

The `data-path` parameter defines the path to your database folder (default: `"data/db"`).

- Can be a relative path from the `index.html` location
- Examples: `"data/db"`, `"my-catalog/database"`, `"../shared-data/db"`

#### db-key (Optional)

The `data-db-key` parameter provides security enhancement against data exfiltration by malicious scripts running in the browser on `file://`.

```html
<div
  id="jsonjsdb-config"
  style="display:none;"
  data-app-name="datannur-app"
  data-path="data/db"
  data-db-key="R63CYikswPqAu3uCBnsV"
></div>
```

This configuration expects your data files to be in `/data/db/{key}/`, making file paths unpredictable to malicious scripts.

## License

MIT - see [LICENSE](LICENSE). All dependencies are MIT/Apache 2.0/BSD compatible.
