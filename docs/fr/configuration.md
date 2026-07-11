# Configuration avancée

## Ports de développement local

Pour servir l'application en local et pour les API locales optionnelles, vous pouvez définir les ports dans `data/localhost-ports.config.json`.

```json
{
  "appPort": 61291,
  "llmProxyPort": 61292,
  "apiPort": 61293,
  "editServerPort": 61294
}
```

- `appPort` : serveur d'application statique local utilisé par `python3 datannur.py start`
- `llmProxyPort` : port du proxy LLM Python local
- `apiPort` : port optionnel du serveur de développement de l'API REST locale
- `editServerPort` : port du serveur d'édition Python local

Si le fichier est manquant ou invalide, les valeurs par défaut intégrées sont utilisées.

Lorsque l'application s'exécute sur `localhost`, `127.0.0.1` ou `::1`, les clients frontend LLM et d'édition locale lisent automatiquement ce fichier pour trouver les ports de leurs serveurs locaux. Sur un serveur web déployé, elle utilise `/api/llm`, et en `file://` elle n'utilise ni proxy local ni serveur d'édition.

## Configuration de la base de données

L'application utilise une configuration automatiquement intégrée dans `index.html` :

```html
<div
  id="jsonjsdb-config"
  style="display:none;"
  data-app-name="datannur-app"
  data-path="data/db"
></div>
```

> **💡 Bonne pratique :** au lieu de modifier `index.html` directement, modifiez la configuration dans `/data/jsonjsdb-config.html`, puis :
>
> - Exécutez `python3 datannur.py update` pour appliquer automatiquement la configuration, OU
> - Copiez manuellement le bloc de configuration de `/data/jsonjsdb-config.html` vers `index.html`
>
> Cette approche garantit que votre configuration est préservée lors des mises à jour de l'application.

### app-name

Le paramètre `data-app-name` est un identifiant d'application utilisé comme espace de noms pour les données utilisateur stockées dans le navigateur (favoris, historique de recherche, paramètres).

**Valeur par défaut :** `"datannur-app"`

**Cas d'usage :** modifiez cette valeur lorsque vous exécutez plusieurs instances de catalogue depuis le même emplacement afin de garder les données utilisateur séparées. Par exemple, utilisez `"catalog-dev"` et `"catalog-prod"` pour isoler les environnements de développement et de production.

### path

Le paramètre `data-path` définit le chemin vers votre dossier de base de données depuis le point d'entrée `index.html` à la racine (par défaut : `"data/db"`).

- Peut être un chemin relatif à l'emplacement d'`index.html`
- Exemples : `"data/db"`, `"shared-data/db"`

### db-key (optionnel)

Le paramètre `data-db-key` apporte un renforcement de sécurité contre l'exfiltration de données par des scripts malveillants s'exécutant dans le navigateur en `file://`.

```html
<div
  id="jsonjsdb-config"
  style="display:none;"
  data-app-name="datannur-app"
  data-path="data/db"
  data-db-key="R63CYikswPqAu3uCBnsV"
></div>
```

Cette configuration attend que vos fichiers de données se trouvent dans `/data/db/{key}/`, ce qui rend les chemins de fichiers imprévisibles pour les scripts malveillants.

## Choix de la langue

L'application stocke la langue d'interface de l'utilisateur dans les paramètres du navigateur sous l'option `language`. Les valeurs prises en charge sont :

- `auto` : utilise la langue du navigateur lorsqu'elle est prise en charge, sinon revient à l'anglais
- `en` : force l'anglais
- `fr` : force le français
- `de` : force l'allemand
- `it` : force l'italien

L'anglais est la langue de repli par défaut. Un paramètre d'URL `?lang=en`, `?lang=fr`, `?lang=de` ou `?lang=it` remplace l'option enregistrée pour ce lancement. Dans les pages statiques générées, un petit marqueur meta `datannur-locale` maintient l'application hydratée dans la même langue que le HTML généré : par exemple, `/en/datasets` reste en anglais, `/fr/datasets` reste en français et `/de/datasets` reste en allemand. L'espagnol est prévu prochainement.
