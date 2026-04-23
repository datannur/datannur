# Getting Started

1. **Download** [the app](https://github.com/datannur/datannur/releases/latest/download/datannur-app-latest.zip)
2. **Open** `index.html` in your browser
3. **Explore** the demo catalog to see how it works
4. **Replace** the demo metadata in `/data/db/` with your own (see below)

For a more integrated experience (Start Menu / Dock shortcut, local server auto-starting at login), see [Installing on Your Computer](/install).

## Replacing the demo metadata

You can populate your own catalog in several ways:

- **Edit Excel sources** — maintain your metadata in `/data/db-source/` as Excel files and sync to `/data/db/` with either `npm run sync-db` (Node.js) or [datannurpy](https://github.com/datannur/datannurpy) (Python). See [Managing Your Data](/data).
- **Use the datannur builder** — [datannurpy](https://github.com/datannur/datannurpy) can also auto-extract metadata by scanning databases and files, writing directly to `/data/db/`.
- **Any other workflow** — as long as the output matches the schemas in `/public/schemas/`, you can generate `/data/db/` with any tool or script of your choice.
