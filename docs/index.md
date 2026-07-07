# Getting Started

1. **Download** [the app](https://github.com/datannur/datannur/releases/latest/download/datannur-app-latest.zip)
2. **Open** `index.html` in your browser
3. **Explore** the demo catalog to see how it works
4. **Replace** the demo metadata in `/data/db/` with your own (see below)

The application interface is multilingual. English is the default fallback language, French and German are supported, and the `auto` setting follows the browser language when possible. Users can change the language from the app footer or Options page; Italian and Spanish are planned soon.

For a more integrated experience (Start Menu / Dock shortcut, local server auto-starting at login), see [Installing on Your Computer](/install).

## Replacing the demo metadata

You can populate your own catalog in several ways:

- **Edit source files** — maintain your metadata in `/data/db-source/` as JSON files, Markdown documents, and CSV previews, then run `python3 datannur.py build-db-source` to rebuild `/data/db/`. See [Managing Your Data](/data).
- **Any other workflow** — as long as the output matches the schemas in `/app/schemas/`, you can generate `/data/db/` with any tool or script of your choice.
