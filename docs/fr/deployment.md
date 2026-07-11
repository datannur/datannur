# Publication en ligne

Pour un déploiement web public avec optimisation SEO et URL propres :

## Génération de pages statiques

Générez des pages statiques optimisées pour le référencement :

```bash
python3 datannur.py static
```

Pour générer les pages statiques et déployer en une seule étape :

```bash
python3 datannur.py static-deploy
```

**Configuration** dans `data/static-make.config.json` :

- **domain** : votre domaine public (p. ex. `"https://yourdomain.com"`) — requis pour la génération du sitemap lorsque `indexSeo: true`
- **indexSeo** : `true` pour autoriser l'indexation par les moteurs de recherche, `false` pour ajouter la balise meta `noindex` (par défaut : `false`)
- **languages** : dossiers de langues à générer, par exemple `["en", "fr", "de", "it"]` ; lorsque cette option est définie, les pages statiques sont écrites sous des chemins préfixés par la langue tels que `/en/datasets`, `/fr/datasets`, `/de/datasets` et `/it/datasets`
- **entities** : les types d'entités pour lesquels générer des pages statiques
- **routes** : les routes à pré-générer

> **Remarque :** cette configuration nécessite un serveur Apache avec mod_rewrite activé. La génération statique crée des fichiers HTML optimisés pour le SEO tout en conservant l'intégralité des fonctionnalités de la SPA. En sortie statique multilingue, chaque page générée enregistre sa langue afin que l'application hydratée conserve la même langue d'interface que le HTML servi.

## Mode Apache / hébergement mutualisé

Le paquet généré inclut un fichier `.htaccess` pour les déploiements Apache, y compris les environnements d'hébergement mutualisé classiques. Il prend en charge aussi bien les installations à la racine du domaine, comme `https://example.org/`, que les installations en sous-dossier, comme `https://example.org/datannur/`.

Le déploiement Apache fournit :

- Des URL d'application propres telles que `/dataset/accident_route`
- Des URL statiques préfixées par la langue telles que `/en/dataset/accident_route`, `/fr/dataset/accident_route`, `/de/dataset/accident_route` et `/it/dataset/accident_route` lorsque la génération statique multilingue est activée
- Des pages HTML statiques lorsqu'elles sont générées, avec repli sur la SPA lorsqu'une page statique est manquante
- Des points d'entrée d'API publics sous `/api/`, dont la documentation de l'API Raw et les routes de l'API REST
- Des points d'accès du proxy LLM en PHP sous `/api/llm/` lorsque l'intégration web LLM est activée

Pour les installations en sous-dossier, téléversez le contenu du paquet dans le répertoire cible (par exemple `datannur/`) et conservez le fichier `.htaccess` inclus à côté d'`index.html`. Les liens et ressources sont résolus relativement à ce chemin d'installation, si bien que le même paquet peut être installé à la racine du domaine ou dans un sous-dossier.

## Mode GitHub Pages

GitHub Pages ne prend pas en charge les réécritures Apache `.htaccess`. Le workflow de déploiement du projet conserve le routage par hash par défaut, si bien que les liens internes utilisent des URL telles que `/datannur/#/folder/example`.

Les pages HTML statiques pré-générées restent préférables pour les pages SEO publiques. Le routage par hash sert principalement à la navigation dans l'application, aux liens partagés et aux rechargements directs sur des serveurs statiques sans réécriture d'URL.

## Déploiement

La commande de déploiement `python3 datannur.py deploy` automatise la publication de votre application vers un serveur distant à l'aide de `rsync` via SSH.

**Utilisation :**

```bash
python3 datannur.py deploy
```

**Fonctionnement :**

- Lit les paramètres de déploiement depuis `deploy.config.json` (voir `app/data-template/deploy.config.json` pour un exemple).
- Utilise `rsync` pour synchroniser vos fichiers locaux vers le serveur distant, avec des options pour exclure des fichiers et supprimer les fichiers retirés.
- Prend en charge l'authentification par clé SSH et la configuration d'un port personnalisé.
- Affiche la progression et les erreurs directement dans le terminal.

**Options de configuration :**

- `host`, `port`, `username`, `privateKeyPath` : détails de la connexion SSH
- `remotePath` : dossier de destination sur le serveur
- `ignore` : tableau de motifs de fichiers/dossiers à exclure
- `syncOption.delete` : si `true`, les fichiers supprimés en local sont aussi supprimés côté distant

> Si aucune configuration n'est trouvée, créez-en une à partir du modèle (`app/data-template/deploy.config.json`).

## Réécriture d'URL

Le fichier `.htaccess` inclus permet :

- **URL propres** : `/dataset/123` au lieu de `#/dataset/123`
- **Repli sur les pages statiques** : sert le HTML pré-généré lorsqu'il est disponible
- **Redirection HTTPS** : redirection automatique vers la connexion sécurisée
- **Mise en cache** : en-têtes de cache optimisés pour les ressources
