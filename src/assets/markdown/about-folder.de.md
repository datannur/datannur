Ordner gruppieren und organisieren Datensätze und Enumerationen in einer Baumstruktur.

Ein Ordner kann als von einer Organisation verwaltet und/oder bereitgestellt gekennzeichnet werden, und es können ihm Tags und Docs zugewiesen werden.

mermaid(
$folder $recursive
$organization -- manager - owner --> $folder
$folder --> $dataset
$folder --> $enumeration
$folder <--> $tag
$folder <--> $doc
);
