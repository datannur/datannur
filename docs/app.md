# Managing the App

## Project Structure

> **📁 Context:** This structure represents the **distributed application** (inside the `app/` folder or downloaded package). For development structure, see the full repository.

Here is the top-level structure:

```
├── assets/                     # Static assets (JS, images, etc.)
├── data/                       # ⚠️ YOUR DATA - Only folder to modify
├── data-template/              # Templates to copy into data/
├── datannur.py                 # Command launcher for app scripts
├── python-scripts/             # Python scripts (update app, deploy, static generation, etc.)
├── .htaccess                   # Apache configuration (clean URLs, cache)
├── .nojekyll                   # Disables Jekyll on GitHub Pages
├── CHANGELOG.md                # Application changelog
├── LICENSE                     # License information
├── README.md                   # This documentation
├── index.html                  # Application entry point
├── manifest.json               # PWA configuration
```

> **⚠️ Important:** Only the `/data/` folder should be modified by the user (adding/modifying your metadata). All other files constitute the application and should not be edited, except in exceptional cases or for advanced configuration.

## Updating the App

### Automatic Update (Recommended)

If you have Python installed, you can update automatically:

```bash
python3 datannur.py update
```

> **💡 Note:** The update script uses only Python's standard library - no additional dependencies required! Just run it directly with any Python 3.8+ installation.

**Configuration options** in `data/update_app.json`:

- **targetVersion**: Choose `"latest"` (stable), `"pre-release"` (newest), or specific version `"x.x.x"`
- **proxyUrl**: Optional proxy for downloading files
- **include**: List of files/folders to update

### Manual Update

If you don't have Python, you can:

1. Download the latest version from [Latest release](https://github.com/datannur/datannur/releases/latest/download/datannur-app-latest.zip)
2. Replace the old files with new ones
3. Keep your `/data/` folder to preserve your data
