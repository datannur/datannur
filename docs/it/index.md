# Per iniziare

1. **Scarica** [l'app](https://github.com/datannur/datannur/releases/latest/download/datannur-app-latest.zip)
2. **Apri** `index.html` nel browser
3. **Esplora** il catalogo demo per vedere come funziona
4. **Sostituisci** i metadati demo in `/data/db/` con i tuoi (vedi sotto)

L'interfaccia dell'applicazione è multilingue. L'inglese è la lingua di ripiego predefinita; francese, tedesco e italiano sono supportati e l'impostazione `auto` segue la lingua del browser quando possibile. Gli utenti possono cambiare lingua dal piè di pagina dell'app o dalla pagina Opzioni; lo spagnolo è previsto a breve.

Per un'esperienza più integrata (collegamento nel menu Start / Dock, server locale che si avvia automaticamente all'accesso), vedi [Installazione sul computer](/it/install).

## Sostituire i metadati demo

Puoi popolare il tuo catalogo in diversi modi:

- **Modifica dei file sorgente** — mantieni i tuoi metadati in `/data/db-source/` come file JSON, documenti Markdown e anteprime CSV, poi esegui `python3 datannur.py build-db-source` per rigenerare `/data/db/`. Vedi [Gestire i dati](/it/data).
- **Qualsiasi altro flusso di lavoro** — purché l'output rispetti gli schemi in `/app/schemas/`, puoi generare `/data/db/` con qualsiasi strumento o script a tua scelta.
