# Advanced Configuration

## Local Development Ports

For local app serving and optional local APIs, you can define ports in `data/localhost-ports.config.json`.

```json
{
  "appPort": 61291,
  "llmProxyPort": 61292,
  "apiPort": 61293,
  "editServerPort": 61294
}
```

- `appPort`: local static app server used by `python3 datannur.py start`
- `llmProxyPort`: local Python LLM proxy port
- `apiPort`: optional local REST API dev server port
- `editServerPort`: local Python edit server port

If the file is missing or invalid, built-in defaults are used.

When the app runs on `localhost`, `127.0.0.1`, or `::1`, the frontend LLM and local edit clients automatically read this file to find their local server ports. On a deployed web server it uses `/api/llm`, and on `file://` it does not use local proxy or edit servers.

## DB Configuration

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
> - Run `python3 datannur.py update` to automatically apply the configuration, OR
> - Manually copy the configuration block from `/data/jsonjsdb-config.html` to `index.html`
>
> This approach ensures your configuration is preserved during application updates.

### app-name

The `data-app-name` parameter is an application identifier used as a namespace for user data stored in the browser (favorites, search history, settings).

**Default value:** `"datannur-app"`

**Use case:** Change this value when running multiple catalog instances from the same location to keep user data separate. For example, use `"catalog-dev"` and `"catalog-prod"` to isolate development and production environments.

### path

The `data-path` parameter defines the path to your database folder from the root `index.html` entry point (default: `"data/db"`).

- Can be a relative path from the `index.html` location
- Examples: `"data/db"`, `"shared-data/db"`

### db-key (Optional)

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

## Language Selection

The app stores the user's interface language in browser settings under the `language` option. Supported values are:

- `auto`: use the browser language when it is supported, otherwise fall back to English
- `en`: force English
- `fr`: force French
- `de`: force German
- `it`: force Italian

English is the default fallback language. A `?lang=en`, `?lang=fr`, `?lang=de`, or `?lang=it` URL parameter overrides the stored option for that launch. In generated static pages, a small `datannur-locale` meta marker keeps the hydrated app in the same language as the generated HTML, for example `/en/datasets` stays English, `/fr/datasets` stays French, and `/de/datasets` stays German.
