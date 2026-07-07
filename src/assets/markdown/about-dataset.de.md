Ein Datensatz stellt eine Datenbanktabelle oder eine Datendatei (Excel, CSV, ...) als Tabelle aus Zeilen und Spalten dar.

Ein Datensatz enthält Variablen (Tabellenspalten oder Tabellenattribute).
Er kann von einem Verwalter (Organisation) verwaltet und von einem Anbieter (Organisation) bereitgestellt werden.
Er kann zu einem einzigen Ordner gehören, und zahlreiche Tags und Docs können mit ihm verknüpft werden.

Datensätze können ausserdem mit anderen Datensätzen als Quellen oder Ableitungen (Lineage) verknüpft werden.

mermaid(
$organization -- manager - owner --> $dataset
$folder --> $dataset
$dataset --> $variable
$dataset <--> $tag
$dataset <--> $doc
$dataset <-- source - abgeleitet --> $dataset
);
