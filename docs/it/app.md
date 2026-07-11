# Gestire l'app

## Struttura del pacchetto

Questa pagina descrive il **pacchetto distribuito** che scarichi, copi, aggiorni o pubblichi. I sorgenti di sviluppo si trovano nel repository Git; gli utenti finali lavorano normalmente solo all'interno del pacchetto distribuito.

All'interno del pacchetto, la cartella `app/` contiene i file di runtime gestiti dall'applicazione:

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

Alla radice del pacchetto, accanto ad `app/`:

```
├── app/                        # Application files, not user-edited
├── data/                       # ⚠️ YOUR DATA - Only folder to modify
├── datannur.py                 # Command launcher for app scripts
├── index.html                  # Root browser entry point for clean URLs
├── start.bat                   # Windows launcher
├── .htaccess                   # Apache configuration (clean URLs, cache)
```

> **⚠️ Importante:** solo la cartella `/data/` deve essere modificata dall'utente (aggiunta/modifica dei tuoi metadati). Tutti gli altri file costituiscono l'applicazione e non devono essere modificati, se non in casi eccezionali o per configurazioni avanzate.

Quando il pacchetto è servito via HTTP, datannur usa URL puliti come `/dataset/accident_route`. Quando `index.html` viene aperto direttamente come file locale, datannur usa URL con hash come `#/dataset/accident_route`, perché non c'è un server web che riscriva i percorsi puliti.

## Aggiornare l'app

### Aggiornamento automatico (consigliato)

Se hai Python installato, puoi aggiornare automaticamente:

```bash
python3 datannur.py update
```

> **💡 Nota:** lo script di aggiornamento usa solo la libreria standard di Python: nessuna dipendenza aggiuntiva richiesta! Basta eseguirlo direttamente con qualsiasi installazione di Python 3.8+.

**Opzioni di configurazione** in `data/update_app.json`:

- **targetVersion**: scegli `"latest"` (stabile), `"pre-release"` (più recente) o una versione specifica `"x.x.x"`
- **proxyUrl**: proxy facoltativo per il download dei file
- **include**: elenco di file/cartelle da aggiornare

### Aggiornamento manuale

Se non hai Python, puoi:

1. Scaricare l'ultima versione da [Ultima release](https://github.com/datannur/datannur/releases/latest/download/datannur-app-latest.zip)
2. Sostituire i vecchi file con i nuovi
3. Conservare la cartella `/data/` per preservare i tuoi dati
