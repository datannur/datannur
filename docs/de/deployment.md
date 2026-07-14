# Online veröffentlichen

Für die öffentliche Web-Bereitstellung mit SEO-Optimierung und sauberen URLs:

## Generierung statischer Seiten

Generieren Sie SEO-freundliche statische Seiten:

```bash
python3 datannur.py static
```

Um statische Seiten zu generieren und in einem Schritt bereitzustellen:

```bash
python3 datannur.py static-deploy
```

**Konfiguration** in `data/static-make.config.json`:

- **domain**: Ihre öffentliche Domain (z. B. `"https://yourdomain.com"`) — erforderlich für die canonical/`hreflang`-Links und die Sitemap-Generierung bei `indexSeo: true`
- **indexSeo**: `true`, um die Indexierung durch Suchmaschinen zu erlauben, `false`, um das Meta-Tag `noindex` hinzuzufügen (Standard: `false`). Aktiviert mit einer `domain`, erhält jede Seite zusätzlich einen `canonical`-Link und bei mehrsprachiger Ausgabe `hreflang`-Alternates für jede Sprache sowie ein `x-default`, das auf die sprachverhandelte URL ohne Präfix verweist; eine einzige `sitemap.xml` im Wurzelverzeichnis listet alle Seiten mit denselben Alternates
- **languages**: Zu generierende Sprachordner, zum Beispiel `["en", "fr", "de", "it"]`; wenn gesetzt, werden die statischen Seiten unter Pfaden mit Sprachpräfix wie `/en/datasets`, `/fr/datasets`, `/de/datasets` und `/it/datasets` geschrieben
- **entities**: Für welche Entitätstypen statische Seiten generiert werden
- **routes**: Welche Routen vorab generiert werden

> **Hinweis:** Dieses Setup erfordert einen Apache-Server mit aktiviertem mod_rewrite. Die statische Generierung erstellt SEO-optimierte HTML-Dateien und erhält gleichzeitig die volle SPA-Funktionalität. Bei mehrsprachiger statischer Ausgabe hält jede generierte Seite ihre Sprache fest, sodass die hydrierte App dieselbe Oberflächensprache wie das ausgelieferte HTML beibehält.

## Apache- / Shared-Hosting-Modus

Das generierte Paket enthält eine `.htaccess`-Datei für Apache-Bereitstellungen, einschliesslich typischer Shared-Hosting-Umgebungen. Sie unterstützt sowohl Installationen im Domain-Stammverzeichnis wie `https://example.org/` als auch Installationen in Unterordnern wie `https://example.org/datannur/`.

Die Apache-Bereitstellung bietet:

- Saubere Anwendungs-URLs wie `/dataset/accident_route`
- Statische URLs mit Sprachpräfix wie `/en/dataset/accident_route`, `/fr/dataset/accident_route`, `/de/dataset/accident_route` und `/it/dataset/accident_route`, wenn die mehrsprachige statische Generierung aktiviert ist
- Statische HTML-Seiten, sofern generiert, mit SPA-Fallback, wenn eine statische Seite fehlt
- Öffentliche API-Einstiegspunkte unter `/api/`, einschliesslich der Raw-API-Dokumentation und der REST-API-Routen
- PHP-LLM-Proxy-Endpunkte unter `/api/llm/`, wenn die LLM-Web-Integration aktiviert ist

Für Installationen in einem Unterordner laden Sie den Paketinhalt in das Zielverzeichnis hoch (zum Beispiel `datannur/`) und belassen die mitgelieferte `.htaccess`-Datei neben `index.html`. Links und Assets werden relativ zu diesem Installationspfad aufgelöst, sodass dasselbe Paket im Domain-Stammverzeichnis oder in einem Unterordner installiert werden kann.

## GitHub-Pages-Modus

GitHub Pages unterstützt keine Apache-`.htaccess`-Umschreibungen. Der Bereitstellungs-Workflow des Projekts behält das standardmässige Hash-Routing bei, sodass interne Links URLs wie `/datannur/#/folder/example` verwenden.

Für öffentliche SEO-Seiten bleiben vorab generierte statische HTML-Seiten vorzuziehen. Hash-Routing dient hauptsächlich der App-Navigation, geteilten Links und dem direkten Neuladen auf statischen Servern ohne URL-Umschreibung.

## Bereitstellung

Der Bereitstellungsbefehl `python3 datannur.py deploy` automatisiert die Veröffentlichung Ihrer App auf einem entfernten Server mittels `rsync` über SSH.

**Verwendung:**

```bash
python3 datannur.py deploy
```

**Funktionsweise:**

- Liest die Bereitstellungseinstellungen aus `deploy.config.json` (siehe `app/data-template/deploy.config.json` für ein Beispiel).
- Verwendet `rsync`, um Ihre lokalen Dateien mit dem entfernten Server zu synchronisieren, mit Optionen zum Ausschliessen von Dateien und zum Löschen entfernter Dateien.
- Unterstützt SSH-Schlüssel-Authentifizierung und benutzerdefinierte Port-Konfiguration.
- Zeigt Fortschritt und Fehler direkt im Terminal an.

**Konfigurationsoptionen:**

- `host`, `port`, `username`, `privateKeyPath`: SSH-Verbindungsdetails
- `remotePath`: Zielordner auf dem Server
- `ignore`: Array von Datei-/Ordnermustern, die ausgeschlossen werden sollen
- `syncOption.delete`: Wenn true, werden lokal gelöschte Dateien auch auf dem Server gelöscht

> Wenn keine Konfiguration gefunden wird, erstellen Sie eine aus der Vorlage (`app/data-template/deploy.config.json`).

## URL-Umschreibung

Die mitgelieferte `.htaccess`-Datei ermöglicht:

- **Saubere URLs**: `/dataset/123` statt `#/dataset/123`
- **Fallback auf statische Seiten**: Liefert vorab generiertes HTML aus, sofern verfügbar
- **HTTPS-Weiterleitung**: Automatische Weiterleitung zur sicheren Verbindung
- **Caching**: Optimierte Cache-Header für Assets
