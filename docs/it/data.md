# Gestire i dati

## Struttura del database

datannur usa un database relazionale lato client basato su [jsonjsdb](https://github.com/datannur/jsonjsdb). I tuoi metadati devono essere strutturati come un database relazionale con requisiti specifici:

- **Posizione del database**: per impostazione predefinita nella cartella `/data/db/` (vedi [path](/it/configuration#path) per le opzioni di personalizzazione)
- **Tabelle**: ogni tabella è memorizzata in due file (`.json` e `.json.js`)
- **Registro delle tabelle**: il file `__table__.json` elenca tutte le tabelle disponibili
- **Chiavi primarie**: devono essere una colonna denominata `id`
- **Chiavi esterne**: colonne denominate come la tabella esterna con il suffisso `_id` (es. `dataset_id`)
- **Relazioni molti-a-molti**: due approcci disponibili:
  - **Array di ID** (consigliato): usa il suffisso `_ids` con valori separati da virgola (es. `tag_ids: "1,3,7"`)
  - **Tabelle di giunzione**: usa la notazione con underscore (es. tabella `dataset_tag`)

## Specifiche dei formati di file

Ogni tabella è memorizzata in due formati:

**File `.json`** - formato JSON standard:

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

**File `.json.js`** - formato compatto (generato automaticamente, ottimizzato per il browser):

```javascript
jsonjs.data['dataset'] = [
  ['id', 'name', 'description'],
  [1, 'Example item', 'Item description'],
  [2, 'Another item', 'Another description'],
]
```

> **💡 Nota:** il database demo è generato da `/data/db-source/` con `python3 datannur.py build-db-source`. Modifica lì i file sorgente, poi rigenera `/data/db/`; i file `.json.js` sono derivati per prestazioni ottimali nel browser.

### Registro delle tabelle

Il file `__table__.json` funge da registro di tutte le tabelle disponibili nel database:

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

**Caratteristiche principali:**

- **name**: nome della tabella (deve corrispondere ai nomi dei file `.json` e `.json.js` corrispondenti)
- **last_modif**: timestamp Unix dell'ultima modifica (in secondi), usato per l'ottimizzazione della cache
- **Voce speciale**: la voce `"__table__"` traccia la data complessiva di aggiornamento dei metadati, visualizzata nell'interfaccia del catalogo

## Panoramica dello schema dei dati

Il catalogo supporta diverse entità con relazioni flessibili. Tutte le tabelle sono facoltative: usa solo quelle che ti servono:

> **📋 Riferimento dello schema:** per i dettagli completi dello schema, consulta la pagina dei metadati in `index.html#/meta` nel tuo catalogo, che mostra tutte le tabelle e le variabili in base alla struttura dati corrente. La colonna "localisation" indica se ogni tabella/variabile esiste solo nello schema, solo nei dati o in entrambi (quando è vuota).
>
> **🔗 Struttura delle entità:** per informazioni sulle entità e sulle loro relazioni, consulta la pagina Info in `index.html#/about?tab=aboutStructure` nel tuo catalogo.

### Metadati geografici

I dataset possono avere metadati geografici facoltativi:

- **`bbox`**: rettangolo di delimitazione come array di quattro numeri `[west, south, east, north]` in WGS84 (lon/lat)
- **`crs`**: sistema di riferimento delle coordinate, es. `"EPSG:2056"`
- **`geometry_type`**: `point`, `linestring`, `polygon`, … (dataset vettoriali)
- **`spatial_resolution`**: risoluzione spaziale in metri (dataset raster)

Quando presenti, il catalogo mostra una **colonna "Geo"** negli elenchi e una **mappa di copertura** nella pagina del dataset (e della cartella), e questi campi alimentano le [esportazioni geospaziali](/it/integrations#esportazioni-semantiche-e-geospaziali) (DCAT/GeoDCAT-AP, STAC, ISO 19139). La copertura di una cartella è l'unione dei rettangoli di delimitazione dei suoi dataset.

Per le variabili, due valori di `type` supportano i geodati: **`geometry`** (la colonna geometrica di un dataset vettoriale) e **`band`** (una variabile per ogni banda di un dataset raster, con le relative statistiche dei pixel).

### Opzioni di configurazione

Il file `config.json` consente di personalizzare varie impostazioni dell'applicazione:

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

**Opzioni disponibili:**

- **contact_email**: email di contatto visualizzata nell'interfaccia del catalogo

### Regole di filtro globali

Il file `configFilter.json` definisce i filtri globali del database visualizzati nell'intestazione dell'applicazione. Ogni regola può riguardare qualsiasi tabella e campo:

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

Usa una riga per ogni valore da confrontare. Quando un filtro viene disattivato dall'utente, le righe corrispondenti vengono rimosse dal database in memoria e le righe correlate vengono rimosse tramite le relazioni di jsonjsdb.

**Personalizzazione della pagina/tab "Info":**

Il contenuto "Info" (sia il tab della pagina iniziale sia la pagina dedicata) è composto da tre sezioni: `banner` + `body` + `more_info`. Ognuna può essere personalizzata in modo indipendente usando Markdown.

- **banner**: immagine banner principale personalizzata
  - Aggiungi `no_caption` per nascondere la didascalia dell'immagine
  - Aggiungi `{darkMode}` nel nome del file (`main-banner{darkMode}`). In questo modo verrà mostrato `main-banner.png` in modalità chiara e `main-banner-dark.png` in modalità scura
- **body**: contenuto principale personalizzato
- **more_info**: informazioni aggiuntive personalizzate

## Dai file sorgente al formato jsonjsdb

- Mantieni file sorgente modificabili in `/data/db-source/`:
  - file `*.json` di primo livello per le tabelle di metadati
  - file `md/*.md` per i documenti Markdown
  - file `dataset/*.csv` per le anteprime dei dataset
- Usa `python3 datannur.py build-db-source` per compilare i file sorgente in entrambi i formati `.json` e `.json.js` in `/data/db/`
- Esegui dalla cartella dell'applicazione con:
  ```bash
  python3 datannur.py build-db-source
  ```
- Riesegui lo script dopo aver modificato i file sorgente per aggiornare il database generato.
