datannur basiert auf 8 Hauptkonzepten, die sich in zwei Kategorien aufteilen:

- Datensatzdaten: Elemente, die direkt mit den Daten selbst zusammenhängen
- Datensatzkontext: Elemente, die Datensätze strukturieren, organisieren oder anreichern

mermaid(
$dataset -.-> dataset_data["Daten"]
$dataset -.-> dataset_context["Kontext"]
);

## Datensatzdaten

### Datensatz

Ein Datensatz stellt eine Datentabelle dar, unabhängig davon, ob sie aus einer Datenbank oder einer Datei (Excel, CSV usw.) stammt, organisiert in Zeilen und Spalten. Zeilen entsprechen Individuen oder Beobachtungen, und Spalten sind Variablen oder Attribute. Jede Variable enthält eine Liste von Werten, die sich von einem Individuum zum anderen unterscheiden.

mermaid( $dataset --> $variable );

### Variable

Manche Variablen sind kategorial, wobei die möglichen Werte durch eine Enumeration definiert werden. Eine Variable kann mit mehreren Enumerationen verknüpft sein und umgekehrt. Sie kann auch mit einem Konzept des Businessglossars verbunden werden, um die genaue Bedeutung des gemessenen Begriffs zu präzisieren. Jede Variable kann zudem zugehörige Häufigkeitsdaten besitzen.

mermaid(
$concept --> $variable
$variable <--> $enumeration
$variable --> $frequency
);

### Häufigkeit

Häufigkeiten zählen die Anzahl der Vorkommen jedes einzelnen Werts innerhalb einer Variable. Dies bietet eine statistische Sicht auf die Datenverteilung und hilft, die häufigsten oder seltensten Werte zu erkennen. Jeder Häufigkeitseintrag enthält einen Wert und seine Anzahl an Vorkommen.

### Enumeration

Eine Enumeration fasst eine Reihe möglicher Werte für eine oder mehrere kategoriale Variablen zusammen. Jeder Wert kann eine Beschreibung enthalten, um seine Bedeutung zu präzisieren.

mermaid( $enumeration --> $value );

## Datensatzkontext

### Ordner

Datensätze und Enumerationen können in Ordnern organisiert werden. Ordner können ineinander verschachtelt werden und bilden so einen hierarchischen Baum, um Ihre Daten zu strukturieren.

mermaid(
$folder $recursive
$folder --> $dataset
$folder --> $enumeration
);

### Organisation

Ein Ordner oder Datensatz kann mit zwei Rollen verknüpft werden, die durch eine Organisation verkörpert werden:

- **Anbieter**: die Einheit, die die Daten erzeugt oder bereitstellt
- **Verwalter**: die Einheit, die sie pflegt und ihre Qualität sicherstellt

Organisationen können ebenfalls hierarchisch angeordnet werden, wobei Organisationen ineinander enthalten sind.

mermaid(
$organization $recursive
$organization -- manager - owner --> $folder
$organization -- manager - owner --> $dataset
);

### Tag

Tags reichern Organisationen, Ordner, Datensätze, Variablen oder Konzepte mit Themen oder übergreifenden Kategorien an. Ein Tag kann mit vielen Elementen verknüpft und ebenfalls hierarchisch organisiert werden.

mermaid(
$tag $recursive
$organization <--> $tag
$folder <--> $tag
$dataset <--> $tag
$variable <--> $tag
$concept <--> $tag
$tag <--> $doc
);

### Konzept

Konzepte des Businessglossars definieren bestimmte Begriffe, die in den Daten verwendet werden. Anders als Tags klassifizieren sie nicht nach Thema: Sie beschreiben eine explizite fachliche Bedeutung. Ein Konzept kann hierarchisch organisiert, mit mehreren Variablen verknüpft und mit Tags oder Docs angereichert werden.

mermaid(
$concept $recursive
$concept --> $variable
$concept <--> $tag
$concept <--> $doc
);

### Doc

Dokumentationsdateien (Docs) im Markdown- oder PDF-Format können mit Organisationen, Ordnern, Tags, Konzepten oder Datensätzen verknüpft werden. Sie beschreiben oder erläutern diese Elemente im Detail.

mermaid(
$organization <--> $doc
$folder <--> $doc
$tag <--> $doc
$concept <--> $doc
$dataset <--> $doc
);

## Gesamtüberblick

Die Konzepte in datannur sind miteinander verbunden und bieten grosse Flexibilität, um Ihre Daten zu organisieren, anzureichern und zu dokumentieren. So hängen sie miteinander zusammen:

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
