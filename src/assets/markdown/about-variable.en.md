Variables belong to a specific dataset.
They can be linked to one or more enumerations.
Tags can be assigned to them.
Variables can also be linked to other variables as sources or derivatives (lineage).
Frequencies count the occurrences of each value within the variable.

mermaid(
$dataset --> $variable
$variable <--> $enumeration
$variable <--> $tag
$variable <-- source - derived --> $variable
$variable --> $frequency
);
