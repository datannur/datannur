# Managing Your Data

## Database Structure

datannur uses a client-side relational database powered by [jsonjsdb](https://github.com/datannur/jsonjsdb). Your metadata must be structured as a relational database with specific requirements:

- **Database location**: By default in `/data/db/` folder (see [path](./configuration#path) for customization options)
- **Tables**: Each table is stored in two files (`.json` and `.json.js`)
- **Table registry**: `__table__.json` file lists all available tables
- **Primary keys**: Must be a column named `id`
- **Foreign keys**: Columns named after the foreign table with `_id` suffix (e.g., `dataset_id`)
- **Many-to-many relationships**: Two approaches available:
  - **Array of IDs** (recommended): Use `_ids` suffix with comma-separated values (e.g., `tag_ids: "1,3,7"`)
  - **Junction tables**: Use underscore notation (e.g., `dataset_tag` table)

## File Format Specifications

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

### Table Registry

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

## Data Schema Overview

The catalog supports several entities with flexible relationships. All tables are optional - use only what you need:

> **📋 Schema Reference:** For complete schema details, see the metadata page at `index.html#/meta` in your catalog, which displays all tables and variables based on the current data structure. The "localisation" column indicates whether each table/variable exists only in schema, only in data, or both (when empty).
>
> **🔗 Entity Structure:** For information about entities and their relationships, see the about page at `index.html#/about?tab=aboutStructure` in your catalog.

### Configuration Options

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

## Excel to jsonjsdb format

- Use the script `node-scripts/sync-db.ts` to convert Excel files to both `.json` and `.json.js` formats
- Run with:
  ```bash
  npm run sync-db
  ```
- The script supports watch mode: any changes to your Excel files are automatically detected and converted, keeping your metadata up to date in real time
