datannur réunit dans une même interface les fonctions essentielles d’un catalogue de données : navigation, documentation, exploration et exploitation des métadonnées. L’outil permet de retrouver rapidement les jeux de données, de comprendre leur structure, d’explorer leurs dépendances et d’en suivre l’évolution dans le temps.

L’objectif n’est pas seulement de stocker de l’information, mais de rendre les données plus lisibles, plus exploitables et plus faciles à gouverner au quotidien.

## Navigation

datannur permet de parcourir le catalogue de plusieurs façons complémentaires. L’arborescence donne une vue structurée des institutions, dossiers, jeux de données, variables et documents, tandis que la recherche et les filtres permettent d’accéder rapidement à l’information pertinente.

Cette navigation multiple rend le catalogue utilisable aussi bien pour une exploration globale que pour des besoins ciblés : retrouver un jeu de données, identifier une variable, repérer un responsable ou naviguer dans un ensemble documentaire lié.

![Dossier SITG – Onglet dataset](assets/about-page/dossier-sitg-tab-dataset{darkMode}.webp?v=1)

### Recherche

La barre de recherche permet de retrouver rapidement les éléments les plus pertinents à partir des termes saisis. Une page dédiée affiche les résultats de manière claire, avec un accès direct aux recherches récentes.

![Homepage - Onglet à propos - Bar de recherche active](assets/about-page/homepage-search-bar{darkMode}.webp?v=1)

![Page de recherche](assets/about-page/search-page{darkMode}.webp?v=1)

### Filtre

Chaque tableau propose des filtres par colonne pour affiner les résultats de façon plus précise que par la recherche globale. Plusieurs filtres peuvent être combinés pour isoler rapidement un sous-ensemble pertinent. Les filtres prennent en charge différents types de conditions selon la nature des colonnes.

![Onglet datasets avec deux filtres actifs](assets/about-page/datasets-tab-filter{darkMode}.webp?v=1)

Un filtre global permet également d’inclure ou d’exclure certaines catégories de datasets à l’échelle du catalogue, par exemple selon leur statut d’ouverture ou leur niveau de traitement.

![Filtre global](assets/about-page/main-filter{darkMode}.webp?v=1)

### Tri

Les tableaux peuvent être triés en ordre ascendant ou descendant à partir de chaque colonne. Ce tri se combine naturellement avec les filtres pour faciliter l’exploration et l’analyse des données.

![Tri du tableau](assets/tuto/datasets-tab-sort{darkMode}.gif?v=1)

### Arborescence

datannur s’appuie sur une structure arborescente pour organiser les institutions, les dossiers et les mots clés. Chaque élément peut contenir des sous-éléments sur plusieurs niveaux, ce qui permet de représenter fidèlement des organisations complexes.

Chaque nœud de l’arborescence dispose de sa propre page et agit comme un sous-ensemble du catalogue. Il est ainsi possible d’explorer à la fois son contenu, son contexte, et les datasets qui lui sont rattachés. Combinée au tri et aux filtres, cette structure offre une navigation à la fois simple et puissante.

![Page à propos – Organisation : vision d’ensemble](assets/about-page/about-page-diagramm{darkMode}.webp?v=1)

### Assistant IA

Une barre latérale de chat permet d’explorer le catalogue en langage naturel. L’assistant peut répondre à des questions sur les métadonnées, retrouver des éléments pertinents et naviguer dans le catalogue en s’appuyant directement sur les informations disponibles.

Intégré à l’interface, il complète les fonctions classiques de recherche, de filtrage et d’exploration en offrant un accès plus direct et plus souple au contenu du catalogue.

![Dataset Dépenses publiques en santé - avec Assistant IA](assets/about-page/sidebar-ai-open{darkMode}.webp?v=1)

## Information

Chaque page dédiée à un élément du catalogue comporte un onglet « À propos » qui rassemble ses principales métadonnées. On y retrouve ses attributs spécifiques — par exemple une description, une date de mise à jour ou un contact — ainsi que les éléments auxquels il est rattaché, comme ses mots clés, son dossier ou ses institutions liées.

Les autres onglets donnent accès aux éléments qu’il contient ou auxquels il est associé, comme les datasets, variables, modalités ou documents.

![Dataset Communes Suisses – Onglet à propos](assets/about-page/dataset-list-histo{darkMode}.webp?v=1)

### Doc

Le catalogue peut relier à ses principaux éléments une ou plusieurs documentations existantes, au format Markdown ou PDF. Il peut s’agir, par exemple, d’un README, d’une notice, d’un rapport ou d’une documentation métier déjà présente dans l’organisation. Accessibles directement depuis la page de l’élément concerné, ces documents apportent du contexte, des explications et des informations complémentaires.

![Doc tourisme en Markdown](assets/about-page/doc-tourisme{darkMode}.webp?v=1)

### Dépendances (lineage)

Pour chaque variable, datannur affiche ses liens de dépendance avec les autres variables du catalogue. Il distingue les variables sources, utilisées comme entrée, et les variables dérivées, qui en dépendent.

Ces relations rendent visibles les chaînes de transformation au sein du catalogue et permettent aussi d’inférer les dépendances entre jeux de données. On peut ainsi repérer rapidement sur quels datasets un autre s’appuie, ou quels jeux de données il alimente.

![Page variable - Onglet dépendances](assets/about-page/variable-page-lineage-tab{darkMode}.webp?v=1)

### Résumé statistique

L’onglet « Stat » propose une synthèse visuelle des informations disponibles dans le catalogue. Selon le type d’élément, il peut afficher aussi bien des résumés agrégés — par exemple le nombre de variables par dataset ou les mots clés associés à un dossier — que des statistiques descriptives plus fines au niveau des variables.

Pour les variables, datannur peut notamment présenter la fréquence des valeurs ainsi que des indicateurs statistiques comme le minimum, le maximum, la moyenne ou l’écart-type. Ces informations facilitent l’exploration, le contrôle de cohérence et la compréhension rapide du contenu des données.

![Dossier Genève – Onglet stat](assets/about-page/stat-tab{darkMode}.webp?v=1)

### Aperçu des données

Pour les jeux de données compatibles, un onglet dédié permet d’afficher un aperçu tabulaire du contenu. Cet aperçu facilite une première lecture des données et s’appuie sur les fonctions intégrées de tri et de filtrage pour explorer rapidement les enregistrements.

![Dataset Communes Suisses – Onglet aperçu](assets/about-page/dataset-histo-commune-preview{darkMode}.webp?v=1)

### Modalités similaires

L’harmonisation des modalités entre plusieurs jeux de données peut rapidement devenir fastidieuse. Pour faciliter ce travail, datannur propose un onglet qui rapproche les modalités selon leur similarité et permet d’identifier rapidement les doublons, variantes proches ou recouvrements partiels.

Cette vue aide à repérer les écarts de libellé, à uniformiser les valeurs et à améliorer la cohérence d’ensemble du catalogue.

![Page modalités - Onglet similitudes](assets/about-page/modality-compare{darkMode}.webp?v=1)

### Évolution

L’onglet « Évolution » permet de suivre dans le temps les changements apportés aux éléments du catalogue. Il met en évidence les ajouts, suppressions et modifications, avec leur horodatage, pour rendre l’historique des métadonnées plus lisible.

Cette vue facilite le suivi des changements, le contrôle de cohérence et la compréhension de l’évolution d’un dataset, d’une variable ou d’un autre élément du catalogue.

![Onglet évolution](assets/about-page/evolution-tab{darkMode}.webp?v=1)

## Utilisation

Les données d’utilisation sont stockées localement dans le navigateur. Le catalogue reste ainsi pleinement fonctionnel sans connexion internet, tout en conservant les favoris, recherches, journaux et préférences de l’utilisateur.

Ces éléments peuvent être exportés et importés à tout moment, ce qui facilite la continuité d’usage d’un poste à l’autre ou dans le temps.

### Mise en favoris

Tous les éléments du catalogue peuvent être ajoutés aux favoris en un clic. Une page dédiée permet ensuite de les retrouver facilement, avec des onglets distincts selon le type d’élément.

![Onglet dossier – ajout d’un élément en favoris](assets/tuto/add-favorite{darkMode}.gif?v=2)

![Page favoris](assets/about-page/favorite-page{darkMode}.webp?v=1)

### Personnalisation

Une page de configuration permet d’ajuster plusieurs aspects de l’interface, comme le mode sombre, le niveau d’arborescence affiché ou d’autres préférences visuelles. Elle permet aussi de réinitialiser les données d’utilisation stockées localement, comme les favoris, les recherches, les préférences ou les journaux.

Un onglet dédié regroupe par ailleurs les logs d’utilisation — pages consultées, recherches, favoris — ainsi qu’un résumé statistique permettant d’en visualiser les principaux usages.

![Page options](assets/about-page/options{darkMode}.webp?v=1)

### Téléchargement

Les données d’utilisation stockées dans le navigateur peuvent être exportées ou importées à tout moment sous forme de fichier compressé (ZIP).

Les tableaux du catalogue peuvent également être exportés facilement, soit par copie dans le presse-papier, soit au format CSV ou Excel (XLSX).

![Page datasets - téléchargement](assets/tuto/datasets-download{darkMode}.gif?v=1)

### Vue interne

datannur intègre une vue interne qui permet d’explorer directement la structure de ses propres métadonnées. Le catalogue devient ainsi lisible de l’intérieur : on peut voir comment l’information est organisée, reliée et stockée.

Cette transparence facilite la compréhension du fonctionnement de l’outil, le contrôle des structures internes et l’appropriation du catalogue par ses utilisateurs les plus avancés.
