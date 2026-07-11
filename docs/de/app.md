# Die App verwalten

## Paketstruktur

Diese Seite beschreibt das **ausgelieferte Paket**, das Sie herunterladen, kopieren, aktualisieren oder bereitstellen. Die Entwicklungsquellen befinden sich im Git-Repository; Endbenutzer arbeiten normalerweise ausschliesslich innerhalb des ausgelieferten Pakets.

Innerhalb des Pakets enthält der Ordner `app/` die von der Anwendung verwalteten Laufzeitdateien:

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

Im Stammverzeichnis des Pakets, neben `app/`:

```
├── app/                        # Application files, not user-edited
├── data/                       # ⚠️ YOUR DATA - Only folder to modify
├── datannur.py                 # Command launcher for app scripts
├── index.html                  # Root browser entry point for clean URLs
├── start.bat                   # Windows launcher
├── .htaccess                   # Apache configuration (clean URLs, cache)
```

> **⚠️ Wichtig:** Nur der Ordner `/data/` sollte vom Benutzer geändert werden (Hinzufügen/Ändern Ihrer Metadaten). Alle anderen Dateien gehören zur Anwendung und sollten nicht bearbeitet werden, ausser in Ausnahmefällen oder für erweiterte Konfiguration.

Wird das Paket über HTTP bereitgestellt, verwendet datannur saubere URLs wie `/dataset/accident_route`. Wird `index.html` direkt als lokale Datei geöffnet, verwendet datannur Hash-URLs wie `#/dataset/accident_route`, da kein Webserver vorhanden ist, der saubere Pfade umschreiben könnte.

## Die App aktualisieren

### Automatische Aktualisierung (empfohlen)

Wenn Python installiert ist, können Sie automatisch aktualisieren:

```bash
python3 datannur.py update
```

> **💡 Hinweis:** Das Update-Skript verwendet ausschliesslich die Python-Standardbibliothek — keine zusätzlichen Abhängigkeiten erforderlich! Führen Sie es einfach direkt mit einer beliebigen Python-Installation ab Version 3.8 aus.

**Konfigurationsoptionen** in `data/update_app.json`:

- **targetVersion**: Wählen Sie `"latest"` (stabil), `"pre-release"` (neueste) oder eine bestimmte Version `"x.x.x"`
- **proxyUrl**: Optionaler Proxy zum Herunterladen der Dateien
- **include**: Liste der zu aktualisierenden Dateien/Ordner

### Manuelle Aktualisierung

Wenn Sie kein Python haben, können Sie:

1. Die neueste Version vom [aktuellen Release](https://github.com/datannur/datannur/releases/latest/download/datannur-app-latest.zip) herunterladen
2. Die alten Dateien durch die neuen ersetzen
3. Ihren Ordner `/data/` behalten, um Ihre Daten zu bewahren
