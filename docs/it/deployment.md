# Pubblicazione online

Per la pubblicazione web pubblica con ottimizzazione SEO e URL puliti:

## Generazione di pagine statiche

Genera pagine statiche ottimizzate per la SEO:

```bash
python3 datannur.py static
```

Per generare le pagine statiche e pubblicarle in un solo passaggio:

```bash
python3 datannur.py static-deploy
```

**Configurazione** in `data/static-make.config.json`:

- **domain**: il tuo dominio pubblico (es. `"https://yourdomain.com"`) - necessario per la generazione della sitemap quando `indexSeo: true`
- **indexSeo**: `true` per consentire l'indicizzazione dai motori di ricerca, `false` per aggiungere il meta tag `noindex` (predefinito: `false`)
- **languages**: cartelle di lingua da generare, ad esempio `["en", "fr", "de", "it"]`; se impostato, le pagine statiche vengono scritte in percorsi con prefisso di lingua come `/en/datasets`, `/fr/datasets`, `/de/datasets` e `/it/datasets`
- **entities**: per quali tipi di entità generare le pagine statiche
- **routes**: quali route pre-generare

> **Nota:** questa configurazione richiede un server Apache con mod_rewrite abilitato. La generazione statica crea file HTML ottimizzati per la SEO mantenendo la piena funzionalità SPA. Nell'output statico multilingue, ogni pagina generata registra la propria lingua, così l'app idratata mantiene la stessa lingua d'interfaccia dell'HTML servito.

## Modalità Apache / hosting condiviso

Il pacchetto generato include un file `.htaccess` per le installazioni su Apache, compresi i tipici ambienti di hosting condiviso. Supporta sia le installazioni alla radice del dominio, come `https://example.org/`, sia quelle in sottocartella, come `https://example.org/datannur/`.

L'installazione su Apache offre:

- URL puliti dell'applicazione come `/dataset/accident_route`
- URL statici con prefisso di lingua come `/en/dataset/accident_route`, `/fr/dataset/accident_route`, `/de/dataset/accident_route` e `/it/dataset/accident_route` quando la generazione statica multilingue è abilitata
- Pagine HTML statiche quando generate, con fallback SPA quando una pagina statica manca
- Punti di accesso API pubblici sotto `/api/`, inclusa la documentazione della Raw API e le route della REST API
- Endpoint del proxy LLM in PHP sotto `/api/llm/` quando l'integrazione web LLM è abilitata

Per le installazioni in sottocartella, carica il contenuto del pacchetto nella directory di destinazione (ad esempio `datannur/`) e mantieni il file `.htaccess` incluso accanto a `index.html`. Link e asset vengono risolti rispetto a quel percorso di installazione, quindi lo stesso pacchetto può essere installato alla radice del dominio o in una sottocartella.

## Modalità GitHub Pages

GitHub Pages non supporta le riscritture `.htaccess` di Apache. Il workflow di pubblicazione del progetto mantiene il routing hash predefinito, quindi i link interni usano URL come `/datannur/#/folder/example`.

Le pagine HTML statiche pre-generate restano preferibili per le pagine SEO pubbliche. Il routing hash serve principalmente per la navigazione nell'app, i link condivisi e i ricaricamenti diretti su server statici senza riscrittura degli URL.

## Pubblicazione

Il comando di pubblicazione `python3 datannur.py deploy` automatizza la pubblicazione dell'app su un server remoto usando `rsync` via SSH.

**Utilizzo:**

```bash
python3 datannur.py deploy
```

**Come funziona:**

- Legge le impostazioni di pubblicazione da `deploy.config.json` (vedi `app/data-template/deploy.config.json` per un esempio).
- Usa `rsync` per sincronizzare i file locali con il server remoto, con opzioni per escludere file ed eliminare i file rimossi.
- Supporta l'autenticazione con chiave SSH e la configurazione di una porta personalizzata.
- Mostra avanzamento ed errori direttamente nel terminale.

**Opzioni di configurazione:**

- `host`, `port`, `username`, `privateKeyPath`: dettagli della connessione SSH
- `remotePath`: cartella di destinazione sul server
- `ignore`: array di pattern di file/cartelle da escludere
- `syncOption.delete`: se true, i file eliminati in locale vengono eliminati anche in remoto

> Se non viene trovata alcuna configurazione, creane una a partire dal template (`app/data-template/deploy.config.json`).

## Riscrittura degli URL

Il file `.htaccess` incluso abilita:

- **URL puliti**: `/dataset/123` invece di `#/dataset/123`
- **Fallback su pagine statiche**: serve l'HTML pre-generato quando disponibile
- **Redirect HTTPS**: reindirizzamento automatico alla connessione sicura
- **Caching**: header di cache ottimizzati per gli asset
