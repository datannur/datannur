# APIs & Interoperability

datannur exposes your catalog data through programmatic APIs and standardized exports, making it easy to integrate with other systems or publish on open data portals.

## REST API

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
