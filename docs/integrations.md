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

## Semantic and geospatial exports

datannur can export your catalog to standard metadata formats so it can be harvested by open-data and geospatial portals. **Geographic datasets** — those carrying a bounding box, coordinate system, geometry type, or spatial resolution (see [Geographic metadata](./data#geographic-metadata)) — get richer spatial metadata in every format.

Each export is a post-processing step that reads the generated `/data/db/` JSON and writes static files to `/data/db-semantic/`. They rely on a few extra Python packages, installed once:

- DCAT: `pip install rdflib pyshacl`
- STAC: `pip install pystac`
- ISO 19139: `pip install pygeometa`

### DCAT / GeoDCAT-AP

**Command:** `python3 datannur.py dcat`

Exports your catalog as RDF (Turtle, JSON-LD, and RDF/XML), validated against the current **DCAT-AP 3.0.1** SHACL shapes. Geographic datasets also carry **GeoDCAT-AP** spatial coverage: bounding box and centroid (WKT), coordinate reference system, and spatial resolution.

After exporting, it reports — without blocking — how close the output is to **GeoDCAT-AP 3.1** (EU) and **DCAT-AP-CH** (Swiss), so you can track the gap to each level.

**Profiles** — the output targets the broadest (European) level by default:

- **default (`eu`)**: conformant to DCAT-AP 3.0.1 and GeoDCAT-AP 3.1.
- **`python3 datannur.py dcat --profile ch`**: conformant to **DCAT-AP-CH** (eCH-0200) for harvesting by [opendata.swiss](https://opendata.swiss). It drops the CRS reference and integer byte size that the Swiss profile rejects; the result then validates against all three profiles.

**Configuration:** Edit `/data/dcat-export.config.json`:

- `catalog_uri`, `base_uri`: URIs of the catalog and for generated dataset/publisher URIs
- `catalog_title`, `catalog_description`, `catalog_publisher`: catalog metadata
- `default_license`: license URI for the catalog and distributions
- `default_language`, `languages`: language tags for unqualified text and for localized fields such as `name:fr`, `description:fr`
- `profile`: `"eu"` (default) or `"ch"` (same effect as `--profile ch`)

**Output** in `/data/db-semantic/`: `dcat.ttl`, `dcat.jsonld`, `dcat.rdf`, and `validation.json`.

### STAC

**Command:** `python3 datannur.py stac`

Exports each geographic dataset as a **STAC Item** (footprint geometry, bounding box, datetime, `proj:code` from the CRS, `gsd` from the resolution) inside a self-contained static STAC catalog, validated with pystac. Useful for STAC browsers and geospatial discovery clients.

**Output:** `/data/db-semantic/stac/` — a `catalog.json` plus one item per geographic dataset.

### ISO 19139

**Command:** `python3 datannur.py iso`

Exports each geographic dataset as an **ISO 19139** metadata record (title, abstract, WGS84 geographic bounding box, temporal extent, keywords, contact, distribution), generated with pygeometa. Suitable for ISO/INSPIRE catalogs and GeoNetwork/CSW portals (such as geocat.ch). Records are basic but valid; full INSPIRE completeness needs manually entered fields (lineage, topic category, access conditions) that a scan cannot infer.

**Output:** `/data/db-semantic/iso/` — one XML record per geographic dataset.
