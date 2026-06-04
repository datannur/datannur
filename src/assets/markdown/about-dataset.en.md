A dataset represents a database table or a data file (Excel, CSV, ...) as a table made of rows and columns.

A dataset contains variables (table columns or table attributes).
It can be managed by a manager (organization) and provided by a provider (organization).
It can belong to a single folder, and many tags and docs can be associated with it.

Datasets can also be linked to other datasets as sources or derivatives (lineage).

mermaid(
$organization -- manager - owner --> $dataset
$folder --> $dataset
$dataset --> $variable
$dataset <--> $tag
$dataset <--> $doc
$dataset <-- source - derived --> $dataset
);
