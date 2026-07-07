Variablen gehören zu einem bestimmten Datensatz.
Sie können mit einer oder mehreren Enumerationen verknüpft werden.
Ihnen können Tags zugewiesen werden.
Variablen können ausserdem mit anderen Variablen als Quellen oder Ableitungen (Lineage) verknüpft werden.
Häufigkeiten zählen die Vorkommen jedes Werts innerhalb der Variable.

mermaid(
$dataset --> $variable
$variable <--> $enumeration
$variable <--> $tag
$variable <-- source - abgeleitet --> $variable
$variable --> $frequency
);
