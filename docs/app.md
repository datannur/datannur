# Managing the App

## Project Structure

> **📁 Context:** This structure represents the **distributed package**. For development structure, see the full repository.

Inside the `app/` runtime folder:

```
├── assets/                     # Static assets (JS, images, etc.)
├── data-template/              # Templates to copy into data/
├── scripts/                    # Python and Windows scripts
├── schemas/                    # JSON schemas
├── api/                        # API adapters
├── CHANGELOG.md                # Application changelog
├── LICENSE                     # License information
├── manifest.json               # PWA configuration
├── index.html                  # Application entry point
├── README.md                   # Application documentation
```

At the package root:

```
├── app/                        # Application files, not user-edited
├── data/                       # ⚠️ YOUR DATA - Only folder to modify
├── datannur.py                 # Command launcher for app scripts
├── index.html                  # Root browser entry point for clean URLs
├── start.bat                   # Windows launcher
├── .htaccess                   # Apache configuration (clean URLs, cache)
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
