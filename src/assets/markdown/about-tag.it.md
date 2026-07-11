Le parole chiave possono essere assegnate a organizzazioni, cartelle, dataset e variabili.

A loro volta possono ricevere delle doc.

mermaid(
$tag $recursive
$organization <--> $tag
$folder <--> $tag
$dataset <--> $tag
$variable <--> $tag
$tag <--> $doc
);
