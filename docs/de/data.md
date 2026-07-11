# Ihre Daten verwalten

## Datenbankstruktur

datannur verwendet eine clientseitige relationale Datenbank auf Basis von [jsonjsdb](https://github.com/datannur/jsonjsdb). Ihre Metadaten müssen als relationale Datenbank mit bestimmten Anforderungen strukturiert sein:

- **Speicherort der Datenbank**: Standardmässig im Ordner `/data/db/` (siehe [path](./configuration#path) für Anpassungsmöglichkeiten)
- **Tabellen**: Jede Tabelle wird in zwei Dateien gespeichert (`.json` und `.json.js`)
- **Tabellenregister**: Die Datei `__table__.json` listet alle verfügbaren Tabellen auf
- **Primärschlüssel**: Muss eine Spalte namens `id` sein
- **Fremdschlüssel**: Spalten, die nach der Fremdtabelle benannt sind, mit dem Suffix `_id` (z. B. `dataset_id`)
- **n:m-Beziehungen**: Zwei Ansätze stehen zur Verfügung:
  - **Array von IDs** (empfohlen): Verwenden Sie das Suffix `_ids` mit kommagetrennten Werten (z. B. `tag_ids: "1,3,7"`)
  - **Verknüpfungstabellen**: Verwenden Sie die Unterstrich-Notation (z. B. Tabelle `dataset_tag`)

## Dateiformat-Spezifikationen

Jede Tabelle wird in zwei Formaten gespeichert:

**`.json`-Dateien** — Standard-JSON-Format:

```json
[
  {
    "id": 1,
    "name": "Example item",
    "description": "Item description"
  },
  {
    "id": 2,
    "name": "Another item",
    "description": "Another description"
  }
]
```

**`.json.js`-Dateien** — kompaktes Format (automatisch generiert, für den Browser optimiert):

```javascript
jsonjs.data['dataset'] = [
  ['id', 'name', 'description'],
  [1, 'Example item', 'Item description'],
  [2, 'Another item', 'Another description'],
]
```

> **💡 Hinweis:** Die Demo-Datenbank wird mit `python3 datannur.py build-db-source` aus `/data/db-source/` generiert. Bearbeiten Sie dort die Quelldateien und erstellen Sie anschliessend `/data/db/` neu; die `.json.js`-Dateien werden für eine optimale Browser-Performance abgeleitet.

### Tabellenregister

Die Datei `__table__.json` dient als Register aller in Ihrer Datenbank verfügbaren Tabellen:

```json
[
  {
    "name": "dataset",
    "last_modif": 1753608552
  },
  {
    "name": "folder",
    "last_modif": 1757018090
  },
  {
    "name": "__table__",
    "last_modif": 1757018100
  }
]
```

**Wichtigste Merkmale:**

- **name**: Tabellenname (muss mit den entsprechenden `.json`- und `.json.js`-Dateinamen übereinstimmen)
- **last_modif**: Unix-Zeitstempel der letzten Änderung (in Sekunden), wird zur Cache-Optimierung verwendet
- **Spezialeintrag**: Der Eintrag `"__table__"` hält den Zeitpunkt der letzten Metadaten-Aktualisierung insgesamt fest, der in der Katalogoberfläche angezeigt wird

## Überblick über das Datenschema

Der Katalog unterstützt mehrere Entitäten mit flexiblen Beziehungen. Alle Tabellen sind optional — verwenden Sie nur, was Sie benötigen:

> **📋 Schema-Referenz:** Vollständige Details zum Schema finden Sie auf der Metadaten-Seite unter `index.html#/meta` in Ihrem Katalog, die alle Tabellen und Variablen auf Basis der aktuellen Datenstruktur anzeigt. Die Spalte "localisation" gibt an, ob eine Tabelle/Variable nur im Schema, nur in den Daten oder in beiden (wenn leer) vorhanden ist.
>
> **🔗 Entitätsstruktur:** Informationen zu den Entitäten und ihren Beziehungen finden Sie auf der "Über"-Seite unter `index.html#/about?tab=aboutStructure` in Ihrem Katalog.

### Geografische Metadaten

Datasets können optionale geografische Metadaten enthalten:

- **`bbox`**: Begrenzungsrahmen als Array aus vier Zahlen `[west, south, east, north]` in WGS84 (Lon/Lat)
- **`crs`**: Koordinatenreferenzsystem, z. B. `"EPSG:2056"`
- **`geometry_type`**: `point`, `linestring`, `polygon`, … (Vektor-Datasets)
- **`spatial_resolution`**: räumliche Auflösung in Metern (Raster-Datasets)

Wenn vorhanden, zeigt der Katalog eine **"Geo"-Spalte** in den Listen sowie eine **Abdeckungskarte** auf der Dataset- (und Ordner-)Seite an, und diese Felder steuern die [Geodaten-Exporte](./integrations#semantische-und-geodaten-exporte) (DCAT/GeoDCAT-AP, STAC, ISO 19139). Die Abdeckung eines Ordners ist die Vereinigung der Begrenzungsrahmen seiner Datasets.

Für Variablen unterstützen zwei `type`-Werte Geodaten: **`geometry`** (die Geometriespalte eines Vektor-Datasets) und **`band`** (eine Variable pro Band eines Raster-Datasets, mit ihren Pixelstatistiken).

### Konfigurationsoptionen

Die Datei `config.json` ermöglicht es Ihnen, verschiedene Anwendungseinstellungen anzupassen:

```json
[
  {
    "id": "contact_email",
    "value": "contact@yourdomain.com"
  },
  {
    "id": "banner",
    "value": "![main-banner no_caption](data/img/main-banner.png)"
  }
]
```

**Verfügbare Optionen:**

- **contact_email**: Kontakt-E-Mail-Adresse, die in der Katalogoberfläche angezeigt wird

### Globale Filterregeln

Die Datei `configFilter.json` definiert globale Datenbankfilter, die im Kopfbereich der Anwendung angezeigt werden. Jede Regel kann auf eine beliebige Tabelle und ein beliebiges Feld abzielen:

```json
[
  {
    "id": "open_data",
    "name": "Open Data",
    "entity": "dataset",
    "field": "type",
    "value": "open_data",
    "is_active_default": true
  }
]
```

Verwenden Sie eine Zeile pro übereinstimmendem Wert. Wenn ein Filter vom Benutzer deaktiviert wird, werden die passenden Zeilen aus der In-Memory-Datenbank entfernt und zugehörige Zeilen über die jsonjsdb-Relationen ebenfalls entfernt.

**Anpassung der "Über"-Seite bzw. des "Über"-Tabs:**

Der "Über"-Inhalt (sowohl der Tab auf der Startseite als auch die eigene Seite) besteht aus drei Abschnitten: `banner` + `body` + `more_info`. Jeder kann unabhängig mit Markdown angepasst werden.

- **banner**: Eigenes Hauptbanner-Bild
  - Fügen Sie `no_caption` hinzu, um die Bildunterschrift auszublenden
  - Fügen Sie `{darkMode}` im Dateinamen hinzu (`main-banner{darkMode}`). Dadurch wird `main-banner.png` im hellen Modus und `main-banner-dark.png` im dunklen Modus angezeigt
- **body**: Eigener Hauptinhalt
- **more_info**: Eigene Zusatzinformationen

## Quelldateien ins jsonjsdb-Format

- Pflegen Sie bearbeitbare Quelldateien in `/data/db-source/`:
  - `*.json`-Dateien auf oberster Ebene für Metadatentabellen
  - `md/*.md`-Dateien für Markdown-Dokumente
  - `dataset/*.csv`-Dateien für Dataset-Vorschauen
- Verwenden Sie `python3 datannur.py build-db-source`, um die Quelldateien in die Formate `.json` und `.json.js` in `/data/db/` zu kompilieren
- Führen Sie den Befehl aus dem Anwendungsordner aus mit:
  ```bash
  python3 datannur.py build-db-source
  ```
- Führen Sie das Skript nach Änderungen an den Quelldateien erneut aus, um die generierte Datenbank zu aktualisieren.
