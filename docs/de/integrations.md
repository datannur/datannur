# APIs & Interoperabilität

datannur stellt Ihre Katalogdaten über programmatische APIs und standardisierte Exporte bereit und erleichtert so die Integration mit anderen Systemen oder die Veröffentlichung auf Open-Data-Portalen.

## REST API

datannur bietet zwei schreibgeschützte API-Endpunkte für den programmatischen Zugriff auf Ihre Katalogdaten. Ihre OpenAPI-Dokumentation kann für die aktuelle Kataloginstanz aus den in `data/db` vorhandenen Daten und den mit der App ausgelieferten offiziellen Schemas generiert werden.

**API-Dokumentation:** Nach der Generierung der OpenAPI-Dateien verfügbar unter `/api/` (RESTful) und `/api/raw` (Raw) in Ihrem bereitgestellten Katalog. In der App erscheint ein **API**-Tab in den Optionen nur dann, wenn die REST API tatsächlich verfügbar ist.

### Raw API

Direkter Zugriff auf die JSON-Dateien der Datenbank ohne serverseitige Verarbeitung.

**Endpunktmuster:** `/data/db/{table}.json`

**Beispiel:**

```
GET /data/db/dataset.json
```

Gibt die vollständige Tabelle als JSON-Array zurück.

### RESTful API

Abfragebasierte API mit Filter-, Paginierungs- und Sortierfunktionen. Erfordert eine serverseitige Implementierung, typischerweise PHP auf Shared Hosting oder den lokalen Python-Entwicklungsserver.

**Endpunktmuster:**

- `GET /api/{table}` — Alle Datensätze abrufen (mit optionalen Abfrageparametern)
- `GET /api/{table}/{id}` — Einzelnen Datensatz per ID abrufen

**Abfrageparameter:**

- `_limit`: Anzahl der Ergebnisse begrenzen
- `_offset`: Versatz für die Paginierung
- `_sort`: Feld, nach dem sortiert wird
- `_order`: Sortierreihenfolge (`asc` oder `desc`)
- Weitere Filter nach Feldname

**Beispiele:**

```
GET /api/dataset?_limit=10&_sort=name&_order=asc
GET /api/dataset/123
GET /api/dataset?folder_id=5
```

Generieren Sie katalogspezifische OpenAPI-Dateien mit:

```bash
python3 datannur.py openapi
```

Die generierten Dateien werden nach `data/api` geschrieben, sodass sie über App-Updates hinweg bei Ihren Katalogdaten bleiben.

> **Serveranforderung:** Die RESTful API erfordert PHP 7.4+ auf Shared Hosting. Für die lokale Nutzung führen Sie `python3 datannur.py api` parallel zum lokalen App-Server aus. Die Raw API funktioniert mit jedem statischen Dateiserver. Wird `index.html` direkt über `file://` geöffnet, bleibt die App nutzbar, aber die HTTP-API ist nicht aktiv.

## Semantische und Geodaten-Exporte

datannur kann Ihren Katalog in Standard-Metadatenformate exportieren, sodass er von Open-Data- und Geodaten-Portalen geharvestet werden kann. **Geografische Datasets** — also solche mit Begrenzungsrahmen, Koordinatensystem, Geometrietyp oder räumlicher Auflösung (siehe [Geografische Metadaten](./data#geografische-metadaten)) — erhalten in jedem Format reichhaltigere räumliche Metadaten.

Jeder Export ist ein Nachbearbeitungsschritt, der das generierte JSON aus `/data/db/` liest und statische Dateien nach `/data/db-semantic/` schreibt. Die Exporte benötigen einige zusätzliche Python-Pakete, die einmalig installiert werden:

- DCAT: `pip install rdflib pyshacl`
- STAC: `pip install pystac`
- ISO 19139: `pip install pygeometa`

### DCAT / GeoDCAT-AP

**Befehl:** `python3 datannur.py dcat`

Exportiert Ihren Katalog als RDF (Turtle, JSON-LD und RDF/XML), validiert gegen die aktuellen **DCAT-AP 3.0.1**-SHACL-Shapes. Geografische Datasets enthalten zusätzlich die räumliche Abdeckung nach **GeoDCAT-AP**: Begrenzungsrahmen und Zentroid (WKT), Koordinatenreferenzsystem und räumliche Auflösung.

Nach dem Export wird — ohne zu blockieren — gemeldet, wie nah die Ausgabe an **GeoDCAT-AP 3.1** (EU) und **DCAT-AP-CH** (Schweiz) liegt, sodass Sie den Abstand zu jeder Stufe verfolgen können.

**Profile** — die Ausgabe zielt standardmässig auf die breiteste (europäische) Stufe:

- **Standard (`eu`)**: konform zu DCAT-AP 3.0.1 und GeoDCAT-AP 3.1.
- **`python3 datannur.py dcat --profile ch`**: konform zu **DCAT-AP-CH** (eCH-0200) für das Harvesting durch [opendata.swiss](https://opendata.swiss). Dabei entfallen die CRS-Referenz und die ganzzahlige Byte-Grösse, die das Schweizer Profil ablehnt; das Ergebnis validiert dann gegen alle drei Profile.

**Konfiguration:** Bearbeiten Sie `/data/dcat-export.config.json`:

- `catalog_uri`, `base_uri`: URIs des Katalogs und für generierte Dataset-/Publisher-URIs
- `catalog_title`, `catalog_description`, `catalog_publisher`: Katalog-Metadaten
- `default_license`: Lizenz-URI für den Katalog und die Distributionen
- `default_language`, `languages`: Sprach-Tags für nicht qualifizierten Text und für lokalisierte Felder wie `name:fr`, `description:fr`
- `profile`: `"eu"` (Standard) oder `"ch"` (gleiche Wirkung wie `--profile ch`)

**Ausgabe** in `/data/db-semantic/`: `dcat.ttl`, `dcat.jsonld`, `dcat.rdf` und `validation.json`.

### STAC

**Befehl:** `python3 datannur.py stac`

Exportiert jedes geografische Dataset als **STAC Item** (Footprint-Geometrie, Begrenzungsrahmen, Datum/Zeit, `proj:code` aus dem CRS, `gsd` aus der Auflösung) innerhalb eines eigenständigen statischen STAC-Katalogs, validiert mit pystac. Nützlich für STAC-Browser und Clients zur Geodaten-Recherche.

**Ausgabe:** `/data/db-semantic/stac/` — eine `catalog.json` plus ein Item pro geografischem Dataset.

### ISO 19139

**Befehl:** `python3 datannur.py iso`

Exportiert jedes geografische Dataset als **ISO 19139**-Metadatensatz (Titel, Kurzbeschreibung, geografischer WGS84-Begrenzungsrahmen, zeitliche Ausdehnung, Schlüsselwörter, Kontakt, Distribution), generiert mit pygeometa. Geeignet für ISO/INSPIRE-Kataloge und GeoNetwork/CSW-Portale (wie geocat.ch).

**Profile** — wie beim DCAT-Export zielt die Ausgabe standardmässig auf die breiteste Stufe:

- **Standard (`eu`)**: generisches ISO 19139. Die Datensätze sind einfach gehalten, aber gültig.
- **`python3 datannur.py iso --profile ch`**: ergänzt die Elemente, die das Schweizer Profil (**eCH-0271**, erwartet von [geocat.ch](https://www.geocat.ch)) über das generische ISO hinaus verpflichtend macht — Themenkategorie und einen Block zu Herkunft/Datenqualität. Diese stammen aus Standardwerten der Konfiguration (`ch_topic_category`, `ch_lineage`), sodass die Datensätze strukturell vollständig und einlesbar sind; die Platzhalter sollten dennoch von Hand geprüft werden, um Herkunft und Themenkategorie korrekt anzugeben. Die strikte eCH-0271-Konformität (XSD + Schematron) wird beim Einlesen durch den eigenen Validator von geocat.ch bestätigt.

**Ausgabe:** `/data/db-semantic/iso/` — ein XML-Datensatz pro geografischem Dataset.
