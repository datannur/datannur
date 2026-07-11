# Installation auf Ihrem Computer

Für die regelmässige Nutzung kann datannur dauerhaft installiert werden — mit einer Verknüpfung im Startmenü / Dock und optional einem lokalen Server, der bei der Anmeldung automatisch startet.

## Windows

In Unternehmens- bzw. Behördenumgebungen (Windows, gemeinsames Netzlaufwerk, keine Administratorrechte) kann datannur auf Benutzerebene installiert werden. Die Skripte befinden sich in `app/scripts/windows/` innerhalb des ausgelieferten Pakets. Jedes Ziel ist unabhängig und hat sein eigenes `install`/`uninstall`-Paar (mit Ausnahme der Verknüpfung, die über das Startmenü deinstalliert wird).

**Vier Möglichkeiten, auf den Katalog zuzugreifen:**

| Modus                                      | Voraussetzungen    | Startmenü-Symbol | Klickbare localhost-URLs | LLM |
| ------------------------------------------ | ------------------ | :--------------: | :----------------------: | :-: |
| `index.html` direkt öffnen (`file://`)     | Keine              |        ❌        |            ❌            | ❌  |
| `install-shortcut.bat` (`file://`-Modus)   | Edge oder Chrome   |        ✅        |            ❌            | ❌  |
| `install-app.bat` (lokaler HTTP-Server)    | Keine              |        ✅        |            ✅            | ❌  |
| `install-llm.bat` (zusätzlich zum Vorigen) | Python 3 im `PATH` |        ✅        |            ✅            | ✅  |

**Funktionsweise:**

- `install-shortcut.bat` — erstellt eine Startmenü-Verknüpfung, die `index.html` in einem rahmenlosen Browserfenster öffnet (`msedge.exe` oder `chrome.exe --app=file:///…`). Kein Listener, keine Persistenz, kein PowerShell zur Laufzeit — der Compliance-freundlichste Modus für stark eingeschränkte Umgebungen. Deinstallation über Startmenü > Rechtsklick auf `datannur` > Entfernen.
- `install-app.bat` — installiert einen nativen statischen PowerShell-Server (`System.Net.HttpListener`, keine Abhängigkeiten). Startet automatisch bei der Anmeldung und stellt die App unter `http://localhost:<appPort>` bereit (Standard `61291`).
- `install-llm.bat` — installiert einen Launcher für den lokalen LLM-Proxy, der automatisch unter `http://localhost:<llmProxyPort>` startet (Standard `61292`).
- `uninstall-app.bat` / `uninstall-llm.bat` — entfernen sämtliche Spuren aus dem Benutzerprofil (`%APPDATA%\...\Startup`-Eintrag + `%LOCALAPPDATA%\datannur\`-Bootstrap).

**Robust bei Netzlaufwerken:** Der Autostart verwendet einen zweistufigen Bootstrap (ein lokaler `%LOCALAPPDATA%`-Launcher wartet, bis das gemeinsame Laufwerk verfügbar ist, bevor er das Serve-Skript darauf ausführt). Sicher, wenn das Laufwerk bei der Anmeldung noch nicht eingebunden ist.

**Ports** werden aus `data/localhost-ports.config.json` gelesen. Die Logs landen in `%LOCALAPPDATA%\datannur\logs\` (die letzten 5 werden aufbewahrt).

## macOS / Linux

Unter macOS und Linux ist Python 3 vorinstalliert (oder leicht verfügbar), sodass der lokale App-Server einfach `python -m http.server` ist.

```bash
# macOS (launchd) or Linux (systemd --user)
python3 datannur.py install-autostart -- app     # auto-start local app server at login
python3 datannur.py install-autostart -- llm     # auto-start local LLM proxy at login
python3 datannur.py uninstall-autostart -- app   # remove the auto-start entry
python3 datannur.py uninstall-autostart -- llm
```

- macOS: erstellt `~/Library/LaunchAgents/com.datannur-<target>.plist`, Logs in `~/Library/Logs/datannur/`.
- Linux: erstellt `~/.config/systemd/user/datannur-<target>.service`, Logs in `~/.local/state/datannur/logs/`.
- Die Ports werden aus `data/localhost-ports.config.json` gelesen (Standardwerte `61291` / `61292`).
- Die Dienste starten bei Fehlern automatisch neu und werden bei der Benutzeranmeldung gestartet.

Unter Linux erstellt zusätzlich `python3 datannur.py install-shortcut` einen `~/.local/share/applications/datannur.desktop`-Eintrag, der `index.html` in einem rahmenlosen Browserfenster öffnet (`file://`-Modus, ohne Server). macOS wird von `install-shortcut` nicht abgedeckt: Für eine native Dock-App verwenden Sie `python3 datannur.py install-autostart -- app`, öffnen dann die `http://localhost`-URL in Safari und wählen **Ablage > Zum Dock hinzufügen**.
