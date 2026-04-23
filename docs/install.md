# Installing on Your Computer

For regular use, datannur can be installed persistently with a Start Menu / Dock shortcut and, optionally, a local server that starts automatically at login.

## Windows

In corporate/institutional contexts (Windows, shared network drive, no admin rights), datannur can be installed at user level. Scripts live in `windows-setup/` inside the distributed app. Each target is independent and has its own `install`/`uninstall` pair (except the shortcut, which uninstalls via the Start Menu).

**Four ways to access the catalog:**

| Mode                                    | Prerequisites      | Start Menu icon | Clickable localhost URLs | LLM |
| --------------------------------------- | ------------------ | :-------------: | :----------------------: | :-: |
| Open `index.html` directly (`file://`)  | None               |       ❌        |            ❌            | ❌  |
| `install-shortcut.bat` (`file://` mode) | Edge or Chrome     |       ✅        |            ❌            | ❌  |
| `install-app.bat` (local HTTP server)   | None               |       ✅        |            ✅            | ❌  |
| `install-llm.bat` (on top of the above) | Python 3 in `PATH` |       ✅        |            ✅            | ✅  |

**How it works:**

- `install-shortcut.bat` — creates a Start Menu shortcut that opens `index.html` in a chromeless browser window (`msedge.exe` or `chrome.exe --app=file:///…`). No listener, no persistence, no PowerShell at runtime — the most compliance-friendly mode for locked-down environments. Uninstall via Start menu > right-click `datannur` > Remove.
- `install-app.bat` — installs a native PowerShell static server (`System.Net.HttpListener`, zero dependencies). Auto-starts at login and serves the app on `http://localhost:<appPort>` (default `61291`).
- `install-llm.bat` — installs a launcher for `python-scripts/proxy_llm.py` that auto-starts the local LLM proxy on `http://localhost:<llmProxyPort>` (default `61292`).
- `uninstall-app.bat` / `uninstall-llm.bat` — remove every trace from the user profile (`%APPDATA%\...\Startup` entry + `%LOCALAPPDATA%\datannur\` bootstrap).

**Network-drive resilient:** auto-start uses a two-stage bootstrap (local `%LOCALAPPDATA%` launcher waits for the shared drive to appear before running the serve script on it). Safe when the drive is not yet mounted at login.

**Ports** are read from `data/localhost-ports.config.json`. Logs land in `%LOCALAPPDATA%\datannur\logs\` (last 5 kept).

## macOS / Linux

On macOS and Linux, Python 3 is preinstalled (or readily available) so the local app server is just `python -m http.server`.

```bash
# macOS (launchd) or Linux (systemd --user)
python3 python-scripts/install_autostart.py app     # auto-start local app server at login
python3 python-scripts/install_autostart.py llm     # auto-start local LLM proxy at login
python3 python-scripts/uninstall_autostart.py app   # remove the auto-start entry
python3 python-scripts/uninstall_autostart.py llm
```

- macOS: creates `~/Library/LaunchAgents/com.datannur-<target>.plist`, logs in `~/Library/Logs/datannur/`.
- Linux: creates `~/.config/systemd/user/datannur-<target>.service`, logs in `~/.local/state/datannur/logs/`.
- Ports are read from `data/localhost-ports.config.json` (defaults `61291` / `61292`).
- Services restart automatically on failure and start at user login.

On Linux, an additional `python3 python-scripts/install_shortcut.py` creates a `~/.local/share/applications/datannur.desktop` entry that opens `index.html` in a chromeless browser window (`file://` mode, no server). macOS is not covered by `install_shortcut.py`: for a native Dock app, use `install_autostart.py app` then open the `http://localhost` URL in Safari and use **File > Add to Dock**.
