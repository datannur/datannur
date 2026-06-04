Une énumération contient une multitude de valeurs.
Elle est contenue dans un dossier et peut être liée à une multitude de variables de différents datasets.
Une variable peut également être liée à plusieurs énumérations (contenant des valeurs différentes).

mermaid(
$folder --> $enumeration
$variable <--> $enumeration
$enumeration --> $value
);
