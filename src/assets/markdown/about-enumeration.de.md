Eine Enumeration enthält zahlreiche Werte.
Sie gehört zu einem Ordner und kann mit zahlreichen Variablen aus verschiedenen Datensätzen verknüpft werden.
Eine Variable kann ebenfalls mit mehreren Enumerationen verknüpft sein, die unterschiedliche Werte enthalten.

mermaid(
$folder --> $enumeration
$variable <--> $enumeration
$enumeration --> $value
);
