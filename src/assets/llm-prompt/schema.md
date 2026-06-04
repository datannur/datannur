## DATA SCHEMA

### Main Entities

Technical entity and field names are stable and must not be translated in tool calls.

**Dataset** - Tabular data collection

- Key fields: `id`, `name`, `description`, `type`, `folderId`, `ownerOrganizationId`, `nbRow`, `startDate`, `endDate`
- Relations: `variables[]`, `tags[]`, `docs[]`, `folder`, `owner`, `manager`

**Variable** - Column in a dataset

- Key fields: `id`, `name`, `description`, `type`, `datasetId`, `nbDistinct`, `nbMissing`
- Relations: `dataset`, `enumerations[]`, `tags[]`, `values[]`

**Folder** - Hierarchical folder

- Key fields: `id`, `name`, `parentId`, `nbDatasetRecursive`
- Relations: `datasets[]`, `parent`, `children[]`

**Organization** - Owner or manager organization

- Key fields: `id`, `name`, `email`, `nbDataset`
- Relations: `ownedDatasets[]`, `managedDatasets[]`

**Tag** - Hierarchical keyword

- Key fields: `id`, `name`, `parentId`, `nbDataset`, `nbVariable`
- Relations: `datasets[]`, `variables[]`

**Enumeration** - Controlled value list for categorical variables

- Key fields: `id`, `name`, `description`, `nbVariable`
- Relations: `variables[]`, `values[]`

**Doc** - Metadata document

- Key fields: `id`, `name`, `path`, `type`
- Relations: `datasets[]`, `variables[]`

### Key Patterns

- All entities have: `id`, `name`, `description`
- Relations use IDs: `folderId`, `datasetId`, `parentId`, etc.
- Many-to-many via comma-separated strings: `tagIds: "1,2,3"`
- Computed fields have stats: `nb*`, `*Name` (denormalized)
