# Installation sur votre ordinateur

Pour un usage régulier, datannur peut être installé de façon persistante avec un raccourci dans le menu Démarrer / le Dock et, en option, un serveur local qui démarre automatiquement à l'ouverture de session.

## Windows

Dans les contextes d'entreprise ou institutionnels (Windows, lecteur réseau partagé, sans droits d'administration), datannur peut être installé au niveau utilisateur. Les scripts se trouvent dans `app/scripts/windows/` à l'intérieur de l'application distribuée. Chaque cible est indépendante et possède sa propre paire `install`/`uninstall` (à l'exception du raccourci, qui se désinstalle depuis le menu Démarrer).

**Quatre façons d'accéder au catalogue :**

| Mode                                          | Prérequis            | Icône menu Démarrer | URL localhost cliquables | LLM |
| --------------------------------------------- | -------------------- | :-----------------: | :----------------------: | :-: |
| Ouvrir `index.html` directement (`file://`)   | Aucun                |         ❌          |            ❌            | ❌  |
| `install-shortcut.bat` (mode `file://`)       | Edge ou Chrome       |         ✅          |            ❌            | ❌  |
| `install-app.bat` (serveur HTTP local)        | Aucun                |         ✅          |            ✅            | ❌  |
| `install-llm.bat` (en plus du mode précédent) | Python 3 dans `PATH` |         ✅          |            ✅            | ✅  |

**Fonctionnement :**

- `install-shortcut.bat` — crée un raccourci dans le menu Démarrer qui ouvre `index.html` dans une fenêtre de navigateur sans interface (`msedge.exe` ou `chrome.exe --app=file:///…`). Aucun processus à l'écoute, aucune persistance, pas de PowerShell à l'exécution — le mode le plus respectueux des exigences de conformité pour les environnements verrouillés. Désinstallation via menu Démarrer > clic droit sur `datannur` > Supprimer.
- `install-app.bat` — installe un serveur statique PowerShell natif (`System.Net.HttpListener`, sans aucune dépendance). Démarre automatiquement à l'ouverture de session et sert l'application sur `http://localhost:<appPort>` (par défaut `61291`).
- `install-llm.bat` — installe un lanceur pour le proxy LLM local qui démarre automatiquement sur `http://localhost:<llmProxyPort>` (par défaut `61292`).
- `uninstall-app.bat` / `uninstall-llm.bat` — suppriment toute trace du profil utilisateur (entrée `%APPDATA%\...\Startup` + amorce `%LOCALAPPDATA%\datannur\`).

**Résilient aux lecteurs réseau :** le démarrage automatique utilise une amorce en deux étapes (le lanceur local dans `%LOCALAPPDATA%` attend que le lecteur partagé soit disponible avant d'exécuter le script de service qui s'y trouve). Sans risque lorsque le lecteur n'est pas encore monté à l'ouverture de session.

**Les ports** sont lus depuis `data/localhost-ports.config.json`. Les journaux sont écrits dans `%LOCALAPPDATA%\datannur\logs\` (les 5 derniers sont conservés).

## macOS / Linux

Sur macOS et Linux, Python 3 est préinstallé (ou facilement disponible), le serveur d'application local est donc simplement `python -m http.server`.

```bash
# macOS (launchd) or Linux (systemd --user)
python3 datannur.py install-autostart -- app     # auto-start local app server at login
python3 datannur.py install-autostart -- llm     # auto-start local LLM proxy at login
python3 datannur.py uninstall-autostart -- app   # remove the auto-start entry
python3 datannur.py uninstall-autostart -- llm
```

- macOS : crée `~/Library/LaunchAgents/com.datannur-<target>.plist`, journaux dans `~/Library/Logs/datannur/`.
- Linux : crée `~/.config/systemd/user/datannur-<target>.service`, journaux dans `~/.local/state/datannur/logs/`.
- Les ports sont lus depuis `data/localhost-ports.config.json` (par défaut `61291` / `61292`).
- Les services redémarrent automatiquement en cas d'échec et démarrent à l'ouverture de session de l'utilisateur.

Sur Linux, une commande supplémentaire `python3 datannur.py install-shortcut` crée une entrée `~/.local/share/applications/datannur.desktop` qui ouvre `index.html` dans une fenêtre de navigateur sans interface (mode `file://`, sans serveur). macOS n'est pas couvert par `install-shortcut` : pour une application native dans le Dock, utilisez `python3 datannur.py install-autostart -- app`, puis ouvrez l'URL `http://localhost` dans Safari et utilisez **Fichier > Ajouter au Dock**.
