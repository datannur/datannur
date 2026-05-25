# Publishing Online

For public web deployment with SEO optimization and clean URLs:

## Static Page Generation

Generate SEO-friendly static pages:

```bash
python3 datannur.py static
```

To generate static pages and deploy in one step:

```bash
python3 datannur.py static-deploy
```

**Configuration** in `data/static-make.config.json`:

- **domain**: Your public domain (e.g., `"https://yourdomain.com"`) - required for sitemap generation when `indexSeo: true`
- **indexSeo**: `true` to allow search engine indexing, `false` to add `noindex` meta tag (default: `false`)
- **entities**: Which entity types to generate static pages for
- **routes**: Which routes to pre-generate

> **Note:** This setup requires an Apache server with mod_rewrite enabled. Static generation creates SEO-optimized HTML files while maintaining the full SPA functionality.

## Apache / Shared Hosting Mode

The generated package includes an `.htaccess` file for Apache deployments, including typical shared hosting environments. It supports both domain-root installs such as `https://example.org/` and subfolder installs such as `https://example.org/datannur/`.

Apache deployment provides:

- Clean application URLs such as `/dataset/accident_route`
- Static HTML pages when generated, with SPA fallback when a static page is missing
- Public API entry points under `/api/`, including Raw API docs and REST API routes
- PHP LLM proxy endpoints under `/api/llm/` when LLM web integration is enabled

For subfolder installs, upload the package contents into the target directory (for example `datannur/`) and keep the included `.htaccess` file next to `index.html`. Links and assets are resolved relative to that install path, so the same package can be installed at the domain root or in a subfolder.

## GitHub Pages Mode

GitHub Pages does not support Apache `.htaccess` rewrites. The project deployment workflow keeps the default hash routing, so internal links use URLs such as `/datannur/#/folder/example`.

Pre-generated static HTML pages remain preferable for public SEO pages. Hash routing is mainly for app navigation, shared links, and direct reloads on static servers without URL rewriting.

## Deployment

The deployment command `python3 datannur.py deploy` automates the process of publishing your app to a remote server using `rsync` over SSH.

**Usage:**

```bash
python3 datannur.py deploy
```

**How it works:**

- Reads deployment settings from `deploy.config.json` (see `app/data-template/deploy.config.json` for an example).
- Uses `rsync` to synchronize your local files to the remote server, with options for excluding files and deleting removed files.
- Supports SSH key authentication and custom port configuration.
- Shows progress and errors directly in the terminal.

**Configuration options:**

- `host`, `port`, `username`, `privateKeyPath`: SSH connection details
- `remotePath`: Destination folder on the server
- `ignore`: Array of file/folder patterns to exclude
- `syncOption.delete`: If true, files deleted locally are also deleted remotely

> If no config is found, create one from the template (`app/data-template/deploy.config.json`).

## URL Rewriting

The included `.htaccess` file enables:

- **Clean URLs**: `/dataset/123` instead of `#/dataset/123`
- **Static page fallback**: Serves pre-generated HTML when available
- **HTTPS redirect**: Automatic redirect to secure connection
- **Caching**: Optimized cache headers for assets
