datannur si basa su 8 concetti principali, suddivisi in due categorie:

- Dati del dataset: elementi direttamente legati ai dati stessi
- Contesto del dataset: elementi che strutturano, organizzano o arricchiscono i dataset

mermaid(
$dataset -.-> dataset_data["Dati"]
$dataset -.-> dataset_context["Contesto"]
);

## Dati del dataset

### Dataset

Un dataset rappresenta una tabella di dati, che provenga da un database o da un file (Excel, CSV, ecc.), organizzata in righe e colonne. Le righe corrispondono agli individui o alle osservazioni, mentre le colonne sono variabili o attributi. Ogni variabile contiene un elenco di valori che differiscono da un individuo all'altro.

mermaid( $dataset --> $variable );

### Variabile

Alcune variabili sono di tipo categoriale, con valori possibili definiti da un'enumerazione. Una variabile può essere collegata a più enumerazioni, e viceversa. Può inoltre essere associata a un concetto del glossario di business per precisare il significato esatto della nozione misurata. Ogni variabile può anche avere dati di frequenza associati.

mermaid(
$concept --> $variable
$variable <--> $enumeration
$variable --> $frequency
);

### Frequenza

Le frequenze contano il numero di occorrenze di ciascun valore specifico all'interno di una variabile. Ciò offre una vista statistica della distribuzione dei dati e aiuta a identificare i valori più comuni o più rari. Ogni voce di frequenza contiene un valore e il suo numero di occorrenze.

### Enumerazione

Un'enumerazione raggruppa un insieme di valori possibili per una o più variabili categoriali. Ogni valore può includere una descrizione per precisarne il significato.

mermaid( $enumeration --> $value );

## Contesto del dataset

### Cartella

I dataset e le enumerazioni possono essere organizzati in cartelle. Le cartelle possono essere annidate le une nelle altre, formando un albero gerarchico per strutturare i vostri dati.

mermaid(
$folder $recursive
$folder --> $dataset
$folder --> $enumeration
);

### Organizzazione

Una cartella o un dataset può essere associato a due ruoli rappresentati da un'organizzazione:

- **Fornitore**: l'entità che produce o condivide i dati
- **Gestore**: l'entità che li mantiene e ne garantisce la qualità

Anche le organizzazioni possono essere disposte gerarchicamente, con organizzazioni contenute le une nelle altre.

mermaid(
$organization $recursive
$organization -- manager - owner --> $folder
$organization -- manager - owner --> $dataset
);

### Parola chiave

Le parole chiave arricchiscono organizzazioni, cartelle, dataset, variabili o concetti con tematiche o categorie trasversali. Una parola chiave può essere collegata a numerosi elementi e può a sua volta essere organizzata gerarchicamente.

mermaid(
$tag $recursive
$organization <--> $tag
$folder <--> $tag
$dataset <--> $tag
$variable <--> $tag
$concept <--> $tag
$tag <--> $doc
);

### Concetto

I concetti del glossario di business definiscono nozioni specifiche utilizzate nei dati. A differenza delle parole chiave, non classificano per tema: descrivono un significato di business esplicito. Un concetto può essere organizzato gerarchicamente, collegato a più variabili e arricchito con parole chiave o doc.

mermaid(
$concept $recursive
$concept --> $variable
$concept <--> $tag
$concept <--> $doc
);

### Doc

File di documentazione (doc) in formato Markdown o PDF possono essere associati a organizzazioni, cartelle, parole chiave, concetti o dataset. Servono a descrivere o spiegare in dettaglio questi elementi.

mermaid(
$organization <--> $doc
$folder <--> $doc
$tag <--> $doc
$concept <--> $doc
$dataset <--> $doc
);

## Visione d'insieme

I concetti di datannur sono interconnessi e offrono grande flessibilità per organizzare, arricchire e documentare i vostri dati. Ecco come sono collegati tra loro:

mermaid(
$folder $recursive
$organization $recursive
$tag $recursive
$organization -- manager - owner --> $dataset
$organization -- manager - owner --> $folder
$organization <--> $tag
$organization <--> $doc
$folder --> $dataset
$folder --> $enumeration
$folder <--> $tag
$folder <--> $doc
$tag <--> $doc
$dataset --> $variable
$dataset <--> $tag
$dataset <--> $doc
$concept $recursive
$concept --> $variable
$concept <--> $tag
$concept <--> $doc
$variable <--> $enumeration
$variable <--> $tag
$variable --> $frequency
$enumeration --> $value
);
