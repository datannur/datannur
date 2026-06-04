An organization represents a legal entity, one of its departments, or one of its contributors. Organizations are arranged as a tree.

An organization can be associated with folders and datasets, either as a provider and/or as a manager.

An organization can also have tags and docs.

mermaid(
$organization $recursive
$organization -- manager - owner --> $folder
$organization -- manager - owner --> $dataset
$organization <--> $tag
$organization <--> $doc
);
