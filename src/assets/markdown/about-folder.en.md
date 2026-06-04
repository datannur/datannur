Folders group and organize datasets and enumerations into a tree structure.

A folder can be marked as managed and/or provided by an organization, and tags and docs can be assigned to it.

mermaid(
$folder $recursive
$organization -- manager - owner --> $folder
$folder --> $dataset
$folder --> $enumeration
$folder <--> $tag
$folder <--> $doc
);
