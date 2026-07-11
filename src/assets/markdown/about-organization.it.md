Un'organizzazione rappresenta una persona giuridica, una delle sue unità o uno dei suoi collaboratori. Le organizzazioni sono disposte in una struttura ad albero.

Un'organizzazione può essere associata a cartelle e dataset, come fornitore e/o come gestore.

Un'organizzazione può inoltre avere parole chiave e doc.

mermaid(
$organization $recursive
$organization -- manager - owner --> $folder
$organization -- manager - owner --> $dataset
$organization <--> $tag
$organization <--> $doc
);
