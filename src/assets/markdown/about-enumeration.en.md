An enumeration contains many values.
It belongs to a folder and can be linked to many variables from different datasets.
A variable can also be linked to several enumerations containing different values.

mermaid(
$folder --> $enumeration
$variable <--> $enumeration
$enumeration --> $value
);
