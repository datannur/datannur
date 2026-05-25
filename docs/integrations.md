# APIs & Interoperability

datannur exposes your catalog data through programmatic APIs and standardized exports, making it easy to integrate with other systems or publish on open data portals.

## REST API

datannur provides two read-only API endpoints for programmatic access to your catalog data. Their OpenAPI documentation can be generated for the current catalog instance from the data present in `data/db` and the official schemas shipped with the app.

**API documentation:** Available at `/api/` (RESTful) and `/api/raw` (Raw) in your deployed catalog after generating the OpenAPI files. In the app, an **API** tab appears in Options only when the REST API is actually available.

### Raw API

Direct access to database JSON files with no server-side processing.

**Endpoint pattern:** `/data/db/{table}.json`

**Example:**

```
GET /data/db/dataset.json
```

Returns the complete table as a JSON array.

### RESTful API

Query-based API with filtering, pagination, and sorting capabilities. Requires a server-side implementation, typically PHP on shared hosting or the local Python development server.

**Endpoint patterns:**

- `GET /api/{table}` - Get all records (with optional query parameters)
- `GET /api/{table}/{id}` - Get single record by ID

**Query parameters:**

- `_limit`: Limit number of results
- `_offset`: Offset for pagination
- `_sort`: Field to sort by
- `_order`: Sort order (`asc` or `desc`)
- Additional filters by field name

**Examples:**

```
GET /api/dataset?_limit=10&_sort=name&_order=asc
GET /api/dataset/123
GET /api/dataset?folder_id=5
```

Generate catalog-specific OpenAPI files with:

```bash
python3 datannur.py openapi
```

The generated files are written to `data/api` so they stay with your catalog data across app updates.

> **Server requirement:** The RESTful API requires PHP 7.4+ to run on shared hosting. For local use, run `python3 datannur.py api` alongside the local app server. The Raw API works with any static file server. When opening `index.html` directly with `file://`, the app remains usable but the HTTP API is not active.

## DCAT-AP-CH Export

datannur can export your catalog metadata to DCAT-AP-CH format, making it compatible with [opendata.swiss](https://opendata.swiss) and other semantic web portals.

**Export command:** `python3 datannur.py dcat`

**Configuration:** Edit `/data/dcat-export.config.json` to set:

- `catalog_uri`: URI of your catalog
- `base_uri`: Base URI for generating dataset/publisher URIs
- `catalog_title`, `catalog_description`, `catalog_publisher`: Catalog metadata

**Usage:**

```bash
# Export to RDF/XML (default)
python3 datannur.py dcat

# Export to JSON-LD
python3 datannur.py dcat -- json-ld
```

**Output:** Generated files in `/data/db-semantic/`:

- `dcat.rdf` - RDF/XML format
- `dcat.jsonld` - JSON-LD format

The export includes automatic SHACL validation to ensure DCAT-AP 2.1.1 compliance.
