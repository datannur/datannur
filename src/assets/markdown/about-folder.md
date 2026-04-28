Les dossiers permettent de regrouper et organiser les datasets et les énumérations en une arborescence.

Un dossier peut être indiqué comme étant géré et/ou fourni par une organisation, des mots clés et des docs peuvent lui être attribués.

mermaid(
$folder $recursive
$organization -- manager - owner --> $folder
$folder --> $dataset
$folder --> $enumeration
$folder <--> $tag
$folder <--> $doc
);
