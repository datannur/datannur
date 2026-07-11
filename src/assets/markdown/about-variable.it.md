Le variabili appartengono a un dataset specifico.
Possono essere collegate a una o più enumerazioni.
Possono essere loro assegnate delle parole chiave.
Le variabili possono inoltre essere collegate ad altre variabili come sorgenti o derivate (lineage).
Le frequenze contano le occorrenze di ciascun valore all'interno della variabile.

mermaid(
$dataset --> $variable
$variable <--> $enumeration
$variable <--> $tag
$variable <-- source - derivato --> $variable
$variable --> $frequency
);
