datannur is built around 8 main concepts, divided into two categories:

- Dataset data: items directly related to the data itself
- Dataset context: items that structure, organize, or enrich datasets

mermaid(
$dataset -.-> dataset_data["Data"]
$dataset -.-> dataset_context["Context"]
);

## Dataset data

### Dataset

A dataset represents a data table, whether it comes from a database or a file (Excel, CSV, etc.), organized as rows and columns. Rows correspond to individuals or observations, and columns are variables or attributes. Each variable contains a list of values that differ from one individual to another.

mermaid( $dataset --> $variable );

### Variable

Some variables are categorical, with possible values defined by an enumeration. A variable can be linked to several enumerations, and conversely. It can also be attached to a business glossary concept to clarify the exact meaning of the measured notion. Each variable can also have associated frequency data.

mermaid(
$concept --> $variable
$variable <--> $enumeration
$variable --> $frequency
);

### Frequency

Frequencies count the number of occurrences of each specific value within a variable. This provides a statistical view of the data distribution and helps identify the most common or rare values. Each frequency entry contains a value and its number of occurrences.

### Enumeration

An enumeration groups a set of possible values for one or more categorical variables. Each value can include a description to clarify its meaning.

mermaid( $enumeration --> $value );

## Dataset context

### Folder

Datasets and enumerations can be organized into folders. Folders can be nested inside each other, forming a hierarchical tree to structure your data.

mermaid(
$folder $recursive
$folder --> $dataset
$folder --> $enumeration
);

### Organization

A folder or dataset can be associated with two roles represented by an organization:

- **Provider**: the entity that produces or shares the data
- **Manager**: the entity that maintains it and ensures its quality

Organizations can also be arranged hierarchically, with organizations contained inside one another.

mermaid(
$organization $recursive
$organization -- manager - owner --> $folder
$organization -- manager - owner --> $dataset
);

### Tag

Tags enrich organizations, folders, datasets, variables, or concepts with themes or cross-cutting categories. A tag can be linked to many items and can also be organized hierarchically.

mermaid(
$tag $recursive
$organization <--> $tag
$folder <--> $tag
$dataset <--> $tag
$variable <--> $tag
$concept <--> $tag
$tag <--> $doc
);

### Concept

Business glossary concepts define specific notions used in the data. Unlike tags, they do not classify by theme: they describe an explicit business meaning. A concept can be organized hierarchically, linked to several variables, and enriched with tags or docs.

mermaid(
$concept $recursive
$concept --> $variable
$concept <--> $tag
$concept <--> $doc
);

### Doc

Documentation files (docs) in Markdown or PDF format can be associated with organizations, folders, tags, concepts, or datasets. They describe or explain these items in detail.

mermaid(
$organization <--> $doc
$folder <--> $doc
$tag <--> $doc
$concept <--> $doc
$dataset <--> $doc
);

## Overview

The concepts in datannur are interconnected, providing great flexibility to organize, enrich, and document your data. Here is how they relate to each other:

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
