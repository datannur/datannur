# OpenAPI and API Adapter Plan

## Context

datannur is a lightweight portable data catalog. The application code, schemas, API adapters, and documentation are shipped by the app. User-managed catalog content lives in `public/data`, and updates are expected to overwrite the app files while preserving `public/data`.

This means generated OpenAPI files that describe a specific user catalog should be treated as data-owned artifacts, not app-owned artifacts.

## Decisions

### OpenAPI scope

The published OpenAPI specifications should describe the current catalog instance, not the full theoretical datannur model.

The generator should use:

- tables present in `public/data/db`;
- fields actually present in the table records;
- official schema definitions from `public/schemas` for field types, descriptions, examples, constraints, and required metadata.

The data decides what is exposed. The official schemas decide how exposed fields are described.

Unknown tables or fields that are not covered by official schemas should not silently become part of the OpenAPI contract. They should be reported as validation errors or warnings.

### Field filtering

The OpenAPI specs should filter fields to the fields actually used by the catalog data.

This keeps the documentation useful for consumers of a specific catalog: no unused tables, no unused fields, and less noise in Redoc, Swagger, no-code tools, scripts, and external integrations.

The generator should not infer types from observed values. It should intersect observed fields with official schema properties and reuse the official schema metadata.

### Raw API

The Raw API remains the core portable API model.

It documents direct access to JSON database files, for example:

```text
/data/db/dataset.json
/data/db/tag.json
```

This API requires no server-side runtime and fits the static, portable nature of datannur.

### RESTful API

The RESTful API is an optional integration adapter.

It exposes familiar routes such as:

```text
/api/dataset
/api/dataset/{id}
```

It is useful for integrations, dashboards, no-code tools, local scripts, assistants, and consumers that prefer query-style access with pagination, sorting, and lookup by ID.

The RESTful API should not become the primary product architecture. It is a convenience layer over the portable JSON data.

### PHP adapter

The PHP REST adapter remains useful because it works well on shared hosting, where PHP is often available and Node.js or Python server runtimes may not be.

### Node.js adapter

The current Node.js REST adapter is less aligned with the portable runtime strategy. It does not currently use Node-specific capabilities that would make it clearly preferable.

It can eventually be replaced by a Python standard-library adapter for local usage, while keeping PHP for shared hosting.

### Python standard library tooling

New local/catalog tooling should prefer Python standard library when practical, compatible with Python 3.9 and newer.

The OpenAPI generator is a good candidate for migration from TypeScript/Node.js to Python because it only needs filesystem access, JSON handling, hashing, and basic HTML generation.

## Proposed Output Layout

Generated OpenAPI artifacts for a catalog instance should live under `public/data`, because they belong to the user catalog and should survive app updates.

Recommended output:

```text
public/data/api/openapi.json
public/data/api/openapi-raw.json
public/data/api/api-docs.html
public/data/api/api-docs-raw.html
```

The generated HTML entrypoints should point to the generated JSON specs with a content hash query parameter:

```html
<redoc spec-url="./openapi.json?v=<content-hash>"></redoc>
```

The hash should be computed from the final OpenAPI JSON content. This avoids stale Redoc/browser cache issues without writing data-specific version state into `public/package.json`.

## Public URL Strategy

The stable public API URLs should remain under `/api`.

On a hosted catalog such as:

```text
https://catalog.datannur.com/
```

the intended public routes are:

```text
/api/
/api/raw
/api/openapi.json
/api/openapi-raw.json
/api/{table}
/api/{table}/{id}
```

The physical generated files can live in `/data/api`, while `/api/.htaccess` acts as the public facade.

Conceptual routing:

```apache
RewriteEngine On

RewriteRule ^$ ../data/api/api-docs.html [L]
RewriteRule ^raw/?$ ../data/api/api-docs-raw.html [L]
RewriteRule ^openapi\.json$ ../data/api/openapi.json [L]
RewriteRule ^openapi-raw\.json$ ../data/api/openapi-raw.json [L]

RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

RewriteRule ^(.*)$ php/index.php [QSA,L]
```

If a shared host does not allow internal rewrites to `../data/api`, the fallback is to redirect `/api` documentation/spec routes to `/data/api` URLs.

## Generator Plan

Create a Python standard-library generator, likely:

```text
public/python-scripts/generate_openapi.py
```

The generator should be self-contained and should not read or write `package.json`.

It should:

1. resolve the portable app root from the script location;
2. use `_local_runtime.find_data_db_dir()` to locate the active database directory;
3. use built-in app conventions for schemas and output paths: `schemas` and `data/api`;
4. use a built-in OpenAPI version, currently `3.1.0`;
5. inspect the active database directory for tables and observed fields;
6. load official schemas from `schemas/*.schema.json`;
7. filter tables and schema properties to the observed catalog subset;
8. generate Raw and RESTful OpenAPI specs;
9. generate Redoc HTML entrypoints with content-hash cache busting;
10. write all generated artifacts to `data/api`;
11. avoid modifying any app-owned metadata files.

## Follow-Up Cleanup

Once the Python generator is implemented and verified:

- remove `api:generate` from `package.json` files instead of replacing it with another npm wrapper;
- document direct Python usage for catalog owners, for example `python3 python-scripts/generate_openapi.py` from the portable app folder;
- remove the Node.js OpenAPI generator if it is no longer needed;
- update `CONTRIBUTING.md` and user documentation to explain instance-specific OpenAPI generation;
- update `/api/.htaccess` to expose the generated docs and specs from `/data/api`;
- decide whether to replace the Node.js REST adapter with a Python standard-library local adapter.
