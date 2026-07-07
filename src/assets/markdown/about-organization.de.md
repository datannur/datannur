Eine Organisation stellt eine juristische Person, eine ihrer Abteilungen oder einen ihrer Mitwirkenden dar. Organisationen sind baumartig angeordnet.

Eine Organisation kann mit Ordnern und Datensätzen verknüpft werden, entweder als Anbieter und/oder als Verwalter.

Eine Organisation kann ausserdem Tags und Docs haben.

mermaid(
$organization $recursive
$organization -- manager - owner --> $folder
$organization -- manager - owner --> $dataset
$organization <--> $tag
$organization <--> $doc
);
