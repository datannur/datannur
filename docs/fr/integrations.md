# API et interopérabilité

datannur expose les données de votre catalogue via des API programmatiques et des exports standardisés, ce qui facilite l'intégration avec d'autres systèmes ou la publication sur des portails open data.

## API REST

datannur fournit deux points d'accès d'API en lecture seule pour l'accès programmatique aux données de votre catalogue. Leur documentation OpenAPI peut être générée pour l'instance de catalogue courante à partir des données présentes dans `data/db` et des schémas officiels fournis avec l'application.

**Documentation de l'API :** disponible à `/api/` (RESTful) et `/api/raw` (Raw) dans votre catalogue déployé après génération des fichiers OpenAPI. Dans l'application, un onglet **API** apparaît dans les Options uniquement lorsque l'API REST est réellement disponible.

### API Raw

Accès direct aux fichiers JSON de la base de données, sans aucun traitement côté serveur.

**Modèle de point d'accès :** `/data/db/{table}.json`

**Exemple :**

```
GET /data/db/dataset.json
```

Retourne la table complète sous forme de tableau JSON.

### API RESTful

API à base de requêtes avec des capacités de filtrage, de pagination et de tri. Nécessite une implémentation côté serveur, généralement PHP sur un hébergement mutualisé ou le serveur de développement Python local.

**Modèles de points d'accès :**

- `GET /api/{table}` — récupère tous les enregistrements (avec des paramètres de requête optionnels)
- `GET /api/{table}/{id}` — récupère un enregistrement unique par son ID

**Paramètres de requête :**

- `_limit` : limite le nombre de résultats
- `_offset` : décalage pour la pagination
- `_sort` : champ de tri
- `_order` : ordre de tri (`asc` ou `desc`)
- Filtres supplémentaires par nom de champ

**Exemples :**

```
GET /api/dataset?_limit=10&_sort=name&_order=asc
GET /api/dataset/123
GET /api/dataset?folder_id=5
```

Générez les fichiers OpenAPI propres au catalogue avec :

```bash
python3 datannur.py openapi
```

Les fichiers générés sont écrits dans `data/api` afin de rester avec les données de votre catalogue lors des mises à jour de l'application.

> **Prérequis serveur :** l'API RESTful nécessite PHP 7.4+ pour fonctionner sur un hébergement mutualisé. Pour un usage local, exécutez `python3 datannur.py api` en parallèle du serveur d'application local. L'API Raw fonctionne avec n'importe quel serveur de fichiers statiques. Lorsque `index.html` est ouvert directement en `file://`, l'application reste utilisable mais l'API HTTP n'est pas active.

## Exports sémantiques et géospatiaux

datannur peut exporter votre catalogue vers des formats de métadonnées standard afin qu'il puisse être moissonné par des portails open data et géospatiaux. **Les datasets géographiques** — ceux qui portent une emprise, un système de coordonnées, un type de géométrie ou une résolution spatiale (voir [Métadonnées géographiques](./data#metadonnees-geographiques)) — bénéficient de métadonnées spatiales plus riches dans chaque format.

Chaque export est une étape de post-traitement qui lit le JSON généré dans `/data/db/` et écrit des fichiers statiques dans `/data/db-semantic/`. Ils reposent sur quelques paquets Python supplémentaires, installés une seule fois :

- DCAT : `pip install rdflib pyshacl`
- STAC : `pip install pystac`
- ISO 19139 : `pip install pygeometa`

### DCAT / GeoDCAT-AP

**Commande :** `python3 datannur.py dcat`

Exporte votre catalogue en RDF (Turtle, JSON-LD et RDF/XML), validé avec les formes SHACL de la version actuelle **DCAT-AP 3.0.1**. Les datasets géographiques portent également la couverture spatiale **GeoDCAT-AP** : emprise et centroïde (WKT), système de référence de coordonnées et résolution spatiale.

Après l'export, il indique — sans bloquer — à quel point la sortie est proche de **GeoDCAT-AP 3.1** (UE) et de **DCAT-AP-CH** (Suisse), afin que vous puissiez suivre l'écart avec chaque niveau.

**Profils** — la sortie cible par défaut le niveau le plus large (européen) :

- **par défaut (`eu`)** : conforme à DCAT-AP 3.0.1 et GeoDCAT-AP 3.1.
- **`python3 datannur.py dcat --profile ch`** : conforme à **DCAT-AP-CH** (eCH-0200) pour le moissonnage par [opendata.swiss](https://opendata.swiss). Il retire la référence CRS et la taille en octets (entier) que le profil suisse rejette ; le résultat est alors valide pour les trois profils.

**Configuration :** modifiez `/data/dcat-export.config.json` :

- `catalog_uri`, `base_uri` : URI du catalogue et URI pour les datasets/éditeurs générés
- `catalog_title`, `catalog_description`, `catalog_publisher` : métadonnées du catalogue
- `default_license` : URI de licence pour le catalogue et les distributions
- `license_uris` : table optionnelle associant les libellés de la colonne `license` à des IRIs (fusionnée par-dessus la table intégrée), afin que les libellés restent lisibles dans l'UI tandis que l'export émet les IRIs exigés par SHACL — p. ex. `{"Opendata.swiss BY": "http://dcat-ap.ch/vocabulary/licenses/terms_by"}`
- `default_language`, `languages` : étiquettes de langue pour les textes non qualifiés et pour les champs localisés tels que `name:fr`, `description:fr`
- `profile` : `"eu"` (par défaut) ou `"ch"` (même effet que `--profile ch`)

**Sortie** dans `/data/db-semantic/` : `dcat.ttl`, `dcat.jsonld`, `dcat.rdf` et `validation.json`.

### STAC

**Commande :** `python3 datannur.py stac`

Exporte chaque dataset géographique sous forme de **STAC Item** (géométrie de l'emprise, bounding box, datetime, `proj:code` dérivé du CRS, `gsd` dérivé de la résolution) au sein d'un catalogue STAC statique autonome, validé avec pystac. Utile pour les navigateurs STAC et les clients de découverte géospatiale.

**Sortie :** `/data/db-semantic/stac/` — un `catalog.json` plus un item par dataset géographique.

### ISO 19139

**Commande :** `python3 datannur.py iso`

Exporte chaque dataset géographique sous forme de fiche de métadonnées **ISO 19139** (titre, résumé, emprise géographique WGS84, étendue temporelle, mots clés, contact, distribution), générée avec pygeometa. Convient aux catalogues ISO/INSPIRE et aux portails GeoNetwork/CSW (comme geocat.ch).

**Profils** — comme pour l'export DCAT, la sortie cible par défaut le niveau le plus large :

- **par défaut (`eu`)** : ISO 19139 générique. Les fiches sont basiques mais valides.
- **`python3 datannur.py iso --profile ch`** : ajoute les éléments que le profil suisse (**eCH-0271**, attendu par [geocat.ch](https://www.geocat.ch)) rend obligatoires en plus de l'ISO générique — la catégorie thématique et un bloc généalogie / qualité des données. Ces éléments proviennent des valeurs par défaut de la configuration (`ch_topic_category`, `ch_lineage`) ; les fiches sont donc structurellement complètes et ingérables, mais ces valeurs génériques méritent une relecture humaine pour une généalogie et une catégorie thématique exactes. La conformité stricte à eCH-0271 (XSD + Schematron) est confirmée par le validateur de geocat.ch lui-même lors de l'ingestion.

**Sortie :** `/data/db-semantic/iso/` — une fiche XML par dataset géographique.
