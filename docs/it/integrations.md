# API e interoperabilità

datannur espone i dati del catalogo tramite API programmatiche ed esportazioni standardizzate, facilitando l'integrazione con altri sistemi o la pubblicazione su portali open data.

## REST API

datannur fornisce due endpoint API in sola lettura per l'accesso programmatico ai dati del catalogo. La loro documentazione OpenAPI può essere generata per l'istanza corrente del catalogo a partire dai dati presenti in `data/db` e dagli schemi ufficiali forniti con l'app.

**Documentazione delle API:** disponibile in `/api/` (RESTful) e `/api/raw` (Raw) nel catalogo pubblicato, dopo aver generato i file OpenAPI. Nell'app, un tab **API** appare nelle Opzioni solo quando la REST API è effettivamente disponibile.

### Raw API

Accesso diretto ai file JSON del database senza elaborazione lato server.

**Pattern dell'endpoint:** `/data/db/{table}.json`

**Esempio:**

```
GET /data/db/dataset.json
```

Restituisce la tabella completa come array JSON.

### RESTful API

API basata su query con funzionalità di filtro, paginazione e ordinamento. Richiede un'implementazione lato server, tipicamente PHP su hosting condiviso o il server di sviluppo Python locale.

**Pattern degli endpoint:**

- `GET /api/{table}` - restituisce tutti i record (con parametri di query facoltativi)
- `GET /api/{table}/{id}` - restituisce un singolo record per ID

**Parametri di query:**

- `_limit`: limita il numero di risultati
- `_offset`: offset per la paginazione
- `_sort`: campo di ordinamento
- `_order`: direzione di ordinamento (`asc` o `desc`)
- Filtri aggiuntivi per nome di campo

**Esempi:**

```
GET /api/dataset?_limit=10&_sort=name&_order=asc
GET /api/dataset/123
GET /api/dataset?folder_id=5
```

Genera i file OpenAPI specifici del catalogo con:

```bash
python3 datannur.py openapi
```

I file generati vengono scritti in `data/api`, così restano insieme ai dati del catalogo attraverso gli aggiornamenti dell'app.

> **Requisito server:** la RESTful API richiede PHP 7.4+ per funzionare su hosting condiviso. Per l'uso locale, esegui `python3 datannur.py api` insieme al server locale dell'app. La Raw API funziona con qualsiasi server di file statici. Quando `index.html` viene aperto direttamente con `file://`, l'app resta utilizzabile ma l'API HTTP non è attiva.

## Esportazioni semantiche e geospaziali

datannur può esportare il catalogo in formati di metadati standard, in modo che possa essere raccolto da portali open data e geospaziali. I **dataset geografici** — quelli dotati di un rettangolo di delimitazione, un sistema di coordinate, un tipo di geometria o una risoluzione spaziale (vedi [Metadati geografici](/it/data#metadati-geografici)) — ottengono metadati spaziali più ricchi in ogni formato.

Ogni esportazione è una fase di post-elaborazione che legge il JSON generato in `/data/db/` e scrive file statici in `/data/db-semantic/`. Le esportazioni si basano su alcuni pacchetti Python aggiuntivi, da installare una sola volta:

- DCAT: `pip install rdflib pyshacl`
- STAC: `pip install pystac`
- ISO 19139: `pip install pygeometa`

### DCAT / GeoDCAT-AP

**Comando:** `python3 datannur.py dcat`

Esporta il catalogo come RDF (Turtle, JSON-LD e RDF/XML), validato con le shape SHACL correnti di **DCAT-AP 3.0.1**. I dataset geografici includono anche la copertura spaziale **GeoDCAT-AP**: rettangolo di delimitazione e centroide (WKT), sistema di riferimento delle coordinate e risoluzione spaziale.

Dopo l'esportazione, indica — senza bloccare — quanto l'output è vicino a **GeoDCAT-AP 3.1** (UE) e **DCAT-AP-CH** (svizzero), così puoi monitorare la distanza da ciascun livello.

**Profili** — per impostazione predefinita l'output punta al livello più ampio (europeo):

- **predefinito (`eu`)**: conforme a DCAT-AP 3.0.1 e GeoDCAT-AP 3.1.
- **`python3 datannur.py dcat --profile ch`**: conforme a **DCAT-AP-CH** (eCH-0200) per l'harvesting da parte di [opendata.swiss](https://opendata.swiss). Rimuove il riferimento al CRS e la dimensione intera in byte che il profilo svizzero rifiuta; il risultato è quindi valido per tutti e tre i profili.

**Configurazione:** modifica `/data/dcat-export.config.json`:

- `catalog_uri`, `base_uri`: URI del catalogo e base per gli URI generati di dataset/publisher
- `catalog_title`, `catalog_description`, `catalog_publisher`: metadati del catalogo
- `default_license`: URI della licenza per il catalogo e le distribuzioni
- `default_language`, `languages`: tag di lingua per i testi non qualificati e per i campi localizzati come `name:fr`, `description:fr`
- `profile`: `"eu"` (predefinito) o `"ch"` (stesso effetto di `--profile ch`)

**Output** in `/data/db-semantic/`: `dcat.ttl`, `dcat.jsonld`, `dcat.rdf` e `validation.json`.

### STAC

**Comando:** `python3 datannur.py stac`

Esporta ogni dataset geografico come **STAC Item** (geometria dell'impronta, rettangolo di delimitazione, datetime, `proj:code` dal CRS, `gsd` dalla risoluzione) all'interno di un catalogo STAC statico autonomo, validato con pystac. Utile per i browser STAC e i client di ricerca geospaziale.

**Output:** `/data/db-semantic/stac/` — un `catalog.json` più un item per ogni dataset geografico.

### ISO 19139

**Comando:** `python3 datannur.py iso`

Esporta ogni dataset geografico come record di metadati **ISO 19139** (titolo, abstract, rettangolo di delimitazione geografico WGS84, estensione temporale, parole chiave, contatto, distribuzione), generato con pygeometa. Adatto ai cataloghi ISO/INSPIRE e ai portali GeoNetwork/CSW (come geocat.ch).

**Profili** — come per l'esportazione DCAT, per impostazione predefinita l'output punta al livello più ampio:

- **predefinito (`eu`)**: ISO 19139 generico. I record sono essenziali ma validi.
- **`python3 datannur.py iso --profile ch`**: aggiunge gli elementi che il profilo svizzero (**eCH-0271**, atteso da [geocat.ch](https://www.geocat.ch)) rende obbligatori rispetto all'ISO generico — la categoria tematica e un blocco di lineage / qualità dei dati. Provengono dai valori predefiniti di configurazione (`ch_topic_category`, `ch_lineage`), quindi i record sono strutturalmente completi e importabili; i segnaposto richiedono comunque una revisione umana per garantire lineage e categoria tematica accurati. La conformità rigorosa a eCH-0271 (XSD + Schematron) è confermata dal validatore di geocat.ch al momento dell'importazione.

**Output:** `/data/db-semantic/iso/` — un record XML per ogni dataset geografico.
