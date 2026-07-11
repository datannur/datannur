Un'enumerazione contiene numerosi valori.
Appartiene a una cartella e può essere collegata a numerose variabili di dataset diversi.
Una variabile può inoltre essere collegata a più enumerazioni contenenti valori differenti.

mermaid(
$folder --> $enumeration
$variable <--> $enumeration
$enumeration --> $value
);
