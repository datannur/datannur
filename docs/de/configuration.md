# Erweiterte Konfiguration

## Lokale Entwicklungsports

Für die lokale Bereitstellung der App und optionale lokale APIs können Sie Ports in `data/localhost-ports.config.json` definieren.

```json
{
  "appPort": 61291,
  "llmProxyPort": 61292,
  "apiPort": 61293,
  "editServerPort": 61294
}
```

- `appPort`: lokaler statischer App-Server, verwendet von `python3 datannur.py start`
- `llmProxyPort`: Port des lokalen Python-LLM-Proxys
- `apiPort`: optionaler Port des lokalen REST-API-Entwicklungsservers
- `editServerPort`: Port des lokalen Python-Edit-Servers

Fehlt die Datei oder ist sie ungültig, werden die eingebauten Standardwerte verwendet.

Läuft die App auf `localhost`, `127.0.0.1` oder `::1`, lesen der Frontend-LLM-Client und die lokalen Edit-Clients diese Datei automatisch, um die Ports ihrer lokalen Server zu ermitteln. Auf einem bereitgestellten Webserver wird `/api/llm` verwendet, und unter `file://` werden keine lokalen Proxy- oder Edit-Server verwendet.

## DB-Konfiguration

Die App verwendet eine Konfiguration, die automatisch in `index.html` eingebettet ist:

```html
<div
  id="jsonjsdb-config"
  style="display:none;"
  data-app-name="datannur-app"
  data-path="data/db"
></div>
```

> **💡 Bewährte Vorgehensweise:** Anstatt `index.html` direkt zu bearbeiten, ändern Sie die Konfiguration in `/data/jsonjsdb-config.html` und dann:
>
> - Führen Sie `python3 datannur.py update` aus, um die Konfiguration automatisch anzuwenden, ODER
> - Kopieren Sie den Konfigurationsblock manuell von `/data/jsonjsdb-config.html` nach `index.html`
>
> Dieser Ansatz stellt sicher, dass Ihre Konfiguration bei Anwendungsupdates erhalten bleibt.

### app-name

Der Parameter `data-app-name` ist ein Anwendungsbezeichner, der als Namensraum für im Browser gespeicherte Benutzerdaten dient (Favoriten, Suchverlauf, Einstellungen).

**Standardwert:** `"datannur-app"`

**Anwendungsfall:** Ändern Sie diesen Wert, wenn mehrere Kataloginstanzen vom selben Ort aus betrieben werden, um die Benutzerdaten getrennt zu halten. Verwenden Sie zum Beispiel `"catalog-dev"` und `"catalog-prod"`, um Entwicklungs- und Produktionsumgebungen zu isolieren.

### path

Der Parameter `data-path` definiert den Pfad zu Ihrem Datenbankordner ausgehend vom Einstiegspunkt `index.html` im Stammverzeichnis (Standard: `"data/db"`).

- Kann ein relativer Pfad ausgehend vom Speicherort der `index.html` sein
- Beispiele: `"data/db"`, `"shared-data/db"`

### db-key (optional)

Der Parameter `data-db-key` bietet einen zusätzlichen Schutz gegen Datenexfiltration durch bösartige Skripte, die unter `file://` im Browser laufen.

```html
<div
  id="jsonjsdb-config"
  style="display:none;"
  data-app-name="datannur-app"
  data-path="data/db"
  data-db-key="R63CYikswPqAu3uCBnsV"
></div>
```

Diese Konfiguration erwartet Ihre Datendateien in `/data/db/{key}/`, wodurch die Dateipfade für bösartige Skripte unvorhersehbar werden.

## Sprachauswahl

Die App speichert die Oberflächensprache des Benutzers in den Browser-Einstellungen unter der Option `language`. Unterstützte Werte sind:

- `auto`: die Browsersprache verwenden, sofern sie unterstützt wird, andernfalls auf Englisch zurückfallen
- `en`: Englisch erzwingen
- `fr`: Französisch erzwingen
- `de`: Deutsch erzwingen
- `it`: Italienisch erzwingen

Englisch ist die Standard-Fallback-Sprache. Ein URL-Parameter `?lang=en`, `?lang=fr`, `?lang=de` oder `?lang=it` überschreibt die gespeicherte Option für diesen Start. In generierten statischen Seiten sorgt ein kleiner `datannur-locale`-Meta-Marker dafür, dass die hydrierte App in derselben Sprache wie das generierte HTML bleibt; zum Beispiel bleibt `/en/datasets` Englisch, `/fr/datasets` Französisch und `/de/datasets` Deutsch. Spanisch ist in Kürze geplant.
