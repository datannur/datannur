# Erste Schritte

1. [Die App](https://github.com/datannur/datannur/releases/latest/download/datannur-app-latest.zip) **herunterladen**
2. `index.html` im Browser **öffnen**
3. Den Demo-Katalog **erkunden**, um zu sehen, wie alles funktioniert
4. Die Demo-Metadaten in `/data/db/` durch Ihre eigenen **ersetzen** (siehe unten)

Die Benutzeroberfläche der Anwendung ist mehrsprachig. Englisch ist die Standard-Fallback-Sprache; Französisch, Deutsch und Italienisch werden unterstützt, und die Einstellung `auto` folgt nach Möglichkeit der Browsersprache. Die Sprache kann in der Fusszeile der App oder auf der Optionsseite geändert werden; Spanisch ist in Kürze geplant.

Für eine besser integrierte Nutzung (Verknüpfung im Startmenü / Dock, lokaler Server mit Autostart bei der Anmeldung) siehe [Installation auf Ihrem Computer](/de/install).

## Die Demo-Metadaten ersetzen

Sie können Ihren eigenen Katalog auf verschiedene Weise befüllen:

- **Quelldateien bearbeiten** — pflegen Sie Ihre Metadaten in `/data/db-source/` als JSON-Dateien, Markdown-Dokumente und CSV-Vorschauen und führen Sie anschliessend `python3 datannur.py build-db-source` aus, um `/data/db/` neu zu erstellen. Siehe [Ihre Daten verwalten](/de/data).
- **Beliebiger anderer Workflow** — solange die Ausgabe den Schemas in `/app/schemas/` entspricht, können Sie `/data/db/` mit einem beliebigen Tool oder Skript Ihrer Wahl generieren.
