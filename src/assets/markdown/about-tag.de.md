Tags können Organisationen, Ordnern, Datensätzen und Variablen zugewiesen werden.

Ihnen können ausserdem Docs zugewiesen werden.

mermaid(
$tag $recursive
$organization <--> $tag
$folder <--> $tag
$dataset <--> $tag
$variable <--> $tag
$tag <--> $doc
);
