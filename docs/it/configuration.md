# Configurazione avanzata

## Porte per lo sviluppo locale

Per servire l'app in locale e per le API locali opzionali, puoi definire le porte in `data/localhost-ports.config.json`.

```json
{
  "appPort": 61291,
  "llmProxyPort": 61292,
  "apiPort": 61293,
  "editServerPort": 61294
}
```

- `appPort`: server statico locale dell'app usato da `python3 datannur.py start`
- `llmProxyPort`: porta del proxy LLM Python locale
- `apiPort`: porta opzionale del server di sviluppo locale della REST API
- `editServerPort`: porta del server di modifica Python locale

Se il file manca o non è valido, vengono usati i valori predefiniti integrati.

Quando l'app è in esecuzione su `localhost`, `127.0.0.1` o `::1`, i client frontend LLM e di modifica locale leggono automaticamente questo file per trovare le porte dei rispettivi server locali. Su un server web pubblicato l'app usa `/api/llm`, e su `file://` non usa né il proxy né il server di modifica locali.

## Configurazione del DB

L'app usa una configurazione incorporata automaticamente in `index.html`:

```html
<div
  id="jsonjsdb-config"
  style="display:none;"
  data-app-name="datannur-app"
  data-path="data/db"
></div>
```

> **💡 Buona pratica:** invece di modificare direttamente `index.html`, modifica la configurazione in `/data/jsonjsdb-config.html` e poi:
>
> - esegui `python3 datannur.py update` per applicare automaticamente la configurazione, OPPURE
> - copia manualmente il blocco di configurazione da `/data/jsonjsdb-config.html` a `index.html`
>
> Questo approccio garantisce che la configurazione venga preservata durante gli aggiornamenti dell'applicazione.

### app-name

Il parametro `data-app-name` è un identificatore dell'applicazione usato come namespace per i dati utente memorizzati nel browser (preferiti, cronologia di ricerca, impostazioni).

**Valore predefinito:** `"datannur-app"`

**Caso d'uso:** cambia questo valore quando esegui più istanze del catalogo dalla stessa posizione, per mantenere separati i dati utente. Ad esempio, usa `"catalog-dev"` e `"catalog-prod"` per isolare gli ambienti di sviluppo e produzione.

### path

Il parametro `data-path` definisce il percorso della cartella del database a partire dal punto di ingresso `index.html` alla radice (predefinito: `"data/db"`).

- Può essere un percorso relativo rispetto alla posizione di `index.html`
- Esempi: `"data/db"`, `"shared-data/db"`

### db-key (facoltativo)

Il parametro `data-db-key` offre una protezione aggiuntiva contro l'esfiltrazione dei dati da parte di script dannosi eseguiti nel browser in `file://`.

```html
<div
  id="jsonjsdb-config"
  style="display:none;"
  data-app-name="datannur-app"
  data-path="data/db"
  data-db-key="R63CYikswPqAu3uCBnsV"
></div>
```

Questa configurazione prevede che i file di dati si trovino in `/data/db/{key}/`, rendendo i percorsi dei file imprevedibili per gli script dannosi.

## Selezione della lingua

L'app memorizza la lingua dell'interfaccia scelta dall'utente nelle impostazioni del browser, sotto l'opzione `language`. I valori supportati sono:

- `auto`: usa la lingua del browser quando è supportata, altrimenti ricade sull'inglese
- `en`: forza l'inglese
- `fr`: forza il francese
- `de`: forza il tedesco
- `it`: forza l'italiano

L'inglese è la lingua di ripiego predefinita. Un parametro URL `?lang=en`, `?lang=fr`, `?lang=de` o `?lang=it` sovrascrive l'opzione memorizzata per quell'avvio. Nelle pagine statiche generate, un piccolo marcatore meta `datannur-locale` mantiene l'app idratata nella stessa lingua dell'HTML generato: ad esempio `/en/datasets` resta in inglese, `/fr/datasets` resta in francese e `/de/datasets` resta in tedesco. Lo spagnolo è previsto a breve.
