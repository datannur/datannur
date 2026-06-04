A doc (documentation item) can be a PDF or Markdown file (the format commonly used for readme files).

It can be associated with many organizations, folders, datasets, and tags.

mermaid(
$organization <--> $doc
$folder <--> $doc
$tag <--> $doc
$dataset <--> $doc
);
