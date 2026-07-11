# Installazione sul computer

Per un uso regolare, datannur può essere installato in modo persistente con un collegamento nel menu Start / Dock e, facoltativamente, un server locale che si avvia automaticamente all'accesso.

## Windows

In contesti aziendali/istituzionali (Windows, unità di rete condivisa, nessun diritto di amministratore), datannur può essere installato a livello utente. Gli script si trovano in `app/scripts/windows/` all'interno dell'app distribuita. Ogni target è indipendente e ha la propria coppia `install`/`uninstall` (tranne il collegamento, che si disinstalla dal menu Start).

**Quattro modi per accedere al catalogo:**

| Modalità                                      | Prerequisiti        | Icona nel menu Start | URL localhost cliccabili | LLM |
| --------------------------------------------- | ------------------- | :------------------: | :----------------------: | :-: |
| Apertura diretta di `index.html` (`file://`)  | Nessuno             |          ❌          |            ❌            | ❌  |
| `install-shortcut.bat` (modalità `file://`)   | Edge o Chrome       |          ✅          |            ❌            | ❌  |
| `install-app.bat` (server HTTP locale)        | Nessuno             |          ✅          |            ✅            | ❌  |
| `install-llm.bat` (in aggiunta ai precedenti) | Python 3 nel `PATH` |          ✅          |            ✅            | ✅  |

**Come funziona:**

- `install-shortcut.bat` — crea un collegamento nel menu Start che apre `index.html` in una finestra del browser senza interfaccia (`msedge.exe` o `chrome.exe --app=file:///…`). Nessun listener, nessuna persistenza, nessun PowerShell in esecuzione: la modalità più adatta alla conformità negli ambienti bloccati. Disinstallazione da menu Start > clic destro su `datannur` > Rimuovi.
- `install-app.bat` — installa un server statico PowerShell nativo (`System.Net.HttpListener`, zero dipendenze). Si avvia automaticamente all'accesso e serve l'app su `http://localhost:<appPort>` (predefinita `61291`).
- `install-llm.bat` — installa un launcher per il proxy LLM locale che si avvia automaticamente su `http://localhost:<llmProxyPort>` (predefinita `61292`).
- `uninstall-app.bat` / `uninstall-llm.bat` — rimuovono ogni traccia dal profilo utente (voce `%APPDATA%\...\Startup` + bootstrap `%LOCALAPPDATA%\datannur\`).

**Resiliente alle unità di rete:** l'avvio automatico usa un bootstrap in due fasi (il launcher locale in `%LOCALAPPDATA%` attende che l'unità condivisa sia disponibile prima di eseguire su di essa lo script del server). Sicuro quando l'unità non è ancora montata al momento dell'accesso.

**Le porte** vengono lette da `data/localhost-ports.config.json`. I log vengono salvati in `%LOCALAPPDATA%\datannur\logs\` (vengono conservati gli ultimi 5).

## macOS / Linux

Su macOS e Linux, Python 3 è preinstallato (o facilmente disponibile), quindi il server locale dell'app è semplicemente `python -m http.server`.

```bash
# macOS (launchd) or Linux (systemd --user)
python3 datannur.py install-autostart -- app     # auto-start local app server at login
python3 datannur.py install-autostart -- llm     # auto-start local LLM proxy at login
python3 datannur.py uninstall-autostart -- app   # remove the auto-start entry
python3 datannur.py uninstall-autostart -- llm
```

- macOS: crea `~/Library/LaunchAgents/com.datannur-<target>.plist`, log in `~/Library/Logs/datannur/`.
- Linux: crea `~/.config/systemd/user/datannur-<target>.service`, log in `~/.local/state/datannur/logs/`.
- Le porte vengono lette da `data/localhost-ports.config.json` (valori predefiniti `61291` / `61292`).
- I servizi si riavviano automaticamente in caso di errore e partono all'accesso dell'utente.

Su Linux, il comando aggiuntivo `python3 datannur.py install-shortcut` crea una voce `~/.local/share/applications/datannur.desktop` che apre `index.html` in una finestra del browser senza interfaccia (modalità `file://`, senza server). macOS non è coperto da `install-shortcut`: per un'app nativa nel Dock, usa `python3 datannur.py install-autostart -- app`, poi apri l'URL `http://localhost` in Safari e usa **File > Aggiungi al Dock**.
