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

## Deployment

The deployment script `python-scripts/deploy.py` automates the process of publishing your app to a remote server using `rsync` over SSH.

**Usage:**

```bash
python3 datannur.py deploy
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

## URL Rewriting

The included `.htaccess` file enables:

- **Clean URLs**: `/dataset/123` instead of `#/dataset/123`
- **Static page fallback**: Serves pre-generated HTML when available
- **HTTPS redirect**: Automatic redirect to secure connection
- **Caching**: Optimized cache headers for assets
