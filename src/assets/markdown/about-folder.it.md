Le cartelle raggruppano e organizzano i dataset e le enumerazioni in una struttura ad albero.

Una cartella può essere indicata come gestita e/o fornita da un'organizzazione, e le si possono assegnare parole chiave e doc.

mermaid(
$folder $recursive
$organization -- manager - owner --> $folder
$folder --> $dataset
$folder --> $enumeration
$folder <--> $tag
$folder <--> $doc
);
