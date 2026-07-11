# Gérer vos données

## Structure de la base de données

datannur utilise une base de données relationnelle côté client propulsée par [jsonjsdb](https://github.com/datannur/jsonjsdb). Vos métadonnées doivent être structurées comme une base de données relationnelle répondant à des exigences précises :

- **Emplacement de la base de données** : par défaut dans le dossier `/data/db/` (voir [path](./configuration#path) pour les options de personnalisation)
- **Tables** : chaque table est stockée dans deux fichiers (`.json` et `.json.js`)
- **Registre des tables** : le fichier `__table__.json` liste toutes les tables disponibles
- **Clés primaires** : doivent être une colonne nommée `id`
- **Clés étrangères** : colonnes nommées d'après la table étrangère avec le suffixe `_id` (p. ex. `dataset_id`)
- **Relations plusieurs-à-plusieurs** : deux approches possibles :
  - **Tableau d'identifiants** (recommandé) : utilisez le suffixe `_ids` avec des valeurs séparées par des virgules (p. ex. `tag_ids: "1,3,7"`)
  - **Tables de jonction** : utilisez la notation avec tiret bas (p. ex. table `dataset_tag`)

## Spécifications des formats de fichiers

Chaque table est stockée dans deux formats :

**Fichiers `.json`** — format JSON standard :

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

**Fichiers `.json.js`** — format compact (généré automatiquement, optimisé pour le navigateur) :

```javascript
jsonjs.data['dataset'] = [
  ['id', 'name', 'description'],
  [1, 'Example item', 'Item description'],
  [2, 'Another item', 'Another description'],
]
```

> **💡 Remarque :** la base de données de démonstration est générée depuis `/data/db-source/` avec `python3 datannur.py build-db-source`. Modifiez les fichiers sources à cet endroit, puis reconstruisez `/data/db/` ; les fichiers `.json.js` en sont dérivés pour des performances optimales dans le navigateur.

### Registre des tables

Le fichier `__table__.json` sert de registre de toutes les tables disponibles dans votre base de données :

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

**Caractéristiques principales :**

- **name** : nom de la table (doit correspondre aux noms des fichiers `.json` et `.json.js` correspondants)
- **last_modif** : horodatage Unix de la dernière modification (en secondes), utilisé pour l'optimisation du cache
- **Entrée spéciale** : l'entrée `"__table__"` suit la date de mise à jour globale des métadonnées, affichée dans l'interface du catalogue

## Aperçu du schéma de données

Le catalogue prend en charge plusieurs entités avec des relations flexibles. Toutes les tables sont optionnelles — n'utilisez que ce dont vous avez besoin :

> **📋 Référence des schémas :** pour le détail complet des schémas, consultez la page des métadonnées à l'adresse `index.html#/meta` de votre catalogue, qui affiche toutes les tables et variables en fonction de la structure de données actuelle. La colonne « localisation » indique si chaque table/variable existe uniquement dans le schéma, uniquement dans les données, ou dans les deux (quand elle est vide).
>
> **🔗 Structure des entités :** pour des informations sur les entités et leurs relations, consultez la page À propos à l'adresse `index.html#/about?tab=aboutStructure` de votre catalogue.

### Métadonnées géographiques

Les datasets peuvent porter des métadonnées géographiques optionnelles :

- **`bbox`** : emprise (bounding box) sous forme de tableau de quatre nombres `[west, south, east, north]` en WGS84 (lon/lat)
- **`crs`** : système de référence de coordonnées, p. ex. `"EPSG:2056"`
- **`geometry_type`** : `point`, `linestring`, `polygon`, … (datasets vectoriels)
- **`spatial_resolution`** : résolution spatiale en mètres (datasets raster)

Lorsqu'ils sont présents, le catalogue affiche une **colonne « Geo »** dans les listes et une **carte de couverture** sur la page du dataset (et du dossier), et ces champs alimentent les [exports géospatiaux](./integrations#exports-semantiques-et-geospatiaux) (DCAT/GeoDCAT-AP, STAC, ISO 19139). La couverture d'un dossier est l'union des emprises de ses datasets.

Pour les variables, deux valeurs de `type` prennent en charge les géodonnées : **`geometry`** (la colonne de géométrie d'un dataset vectoriel) et **`band`** (une variable par bande d'un dataset raster, avec ses statistiques de pixels).

### Options de configuration

Le fichier `config.json` vous permet de personnaliser divers paramètres de l'application :

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

**Options disponibles :**

- **contact_email** : adresse e-mail de contact affichée dans l'interface du catalogue

### Règles de filtrage global

Le fichier `configFilter.json` définit des filtres globaux de base de données affichés dans l'en-tête de l'application. Chaque règle peut cibler n'importe quelle table et n'importe quel champ :

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

Utilisez une ligne par valeur ciblée. Lorsqu'un filtre est désactivé par l'utilisateur, les lignes correspondantes sont retirées de la base de données en mémoire et les lignes liées sont retirées via les relations jsonjsdb.

**Personnalisation de la page/de l'onglet À propos :**

Le contenu « À propos » (onglet de la page d'accueil et page dédiée) est composé de trois sections : `banner` + `body` + `more_info`. Chacune peut être personnalisée indépendamment en Markdown.

- **banner** : image de bannière principale personnalisée
  - Ajoutez `no_caption` pour masquer la légende de l'image
  - Ajoutez `{darkMode}` dans le nom du fichier (`main-banner{darkMode}`). Cela affichera `main-banner.png` en mode clair et `main-banner-dark.png` en mode sombre
- **body** : contenu principal personnalisé
- **more_info** : informations complémentaires personnalisées

## Des fichiers sources au format jsonjsdb

- Maintenez des fichiers sources éditables dans `/data/db-source/` :
  - fichiers `*.json` au premier niveau pour les tables de métadonnées
  - fichiers `md/*.md` pour les documents Markdown
  - fichiers `dataset/*.csv` pour les aperçus de datasets
- Utilisez `python3 datannur.py build-db-source` pour compiler les fichiers sources vers les deux formats `.json` et `.json.js` dans `/data/db/`
- Exécutez depuis le dossier de l'application avec :
  ```bash
  python3 datannur.py build-db-source
  ```
- Relancez le script après toute modification des fichiers sources pour mettre à jour la base de données générée.
