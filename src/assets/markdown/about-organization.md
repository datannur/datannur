Une organisation représente une personne morale, une de ses composantes ou l'un de ses collaborateurs. Les organisations sont organisées de façon arborescente.

Une organisation peut être associée à des dossiers et à des datasets, elle peut en avoir le statut de fournisseur et/ou de gestionnaire.

Une organisation peut également avoir des mots clés et des docs.

mermaid(
$organization $recursive
$organization -- manager - owner --> $folder
$organization -- manager - owner --> $dataset
$organization <--> $tag
$organization <--> $doc
);
