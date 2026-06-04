Un dataset représente une table de base de données ou un fichier de données (Excel, CSV, ...) sous forme de tableau (lignes et colonnes).

Un dataset contient des variables (colonnes du tableau ou attributs de la table).
Il peut être géré par un gestionnaire (organisation) et être fourni par un fournisseur (organisation).
Il peut être contenu dans un seul dossier et une multitude de mots clés et de docs peuvent lui être associés.

Les datasets peuvent également être liés à d’autres datasets, en tant que sources ou dérivés (lineage).

mermaid(
$organization -- manager - owner --> $dataset
$folder --> $dataset
$dataset --> $variable
$dataset <--> $tag
$dataset <--> $doc
$dataset <-- source - dérivé --> $dataset
);
