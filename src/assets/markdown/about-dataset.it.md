Un dataset rappresenta una tabella di database o un file di dati (Excel, CSV, ...) sotto forma di tabella composta da righe e colonne.

Un dataset contiene variabili (colonne o attributi della tabella).
Può essere gestito da un gestore (organizzazione) e fornito da un fornitore (organizzazione).
Può appartenere a una sola cartella, e numerose parole chiave e doc possono essergli associati.

I dataset possono inoltre essere collegati ad altri dataset come sorgenti o derivati (lineage).

mermaid(
$organization -- manager - owner --> $dataset
$folder --> $dataset
$dataset --> $variable
$dataset <--> $tag
$dataset <--> $doc
$dataset <-- source - derivato --> $dataset
);
