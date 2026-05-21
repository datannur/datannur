## DATA SCHEMA

### Main Entities

**Dataset** - Collection de données tabulaires

- Champs clés: `id`, `name`, `description`, `type`, `folderId`, `ownerOrganizationId`, `nbRow`, `startDate`, `endDate`
- Relations: `variables[]`, `tags[]`, `docs[]`, `folder`, `owner`, `manager`

**Variable** - Colonne dans un dataset

- Champs clés: `id`, `name`, `description`, `type`, `datasetId`, `nbDistinct`, `nbMissing`
- Relations: `dataset`, `enumerations[]`, `tags[]`, `values[]`

**Folder** - Dossier hiérarchique

- Champs clés: `id`, `name`, `parentId`, `nbDatasetRecursive`
- Relations: `datasets[]`, `parent`, `children[]`

**Organization** - Organisation propriétaire/gestionnaire

- Champs clés: `id`, `name`, `email`, `nbDataset`
- Relations: `ownedDatasets[]`, `managedDatasets[]`

**Tag** - Mot-clé hiérarchique

- Champs clés: `id`, `name`, `parentId`, `nbDataset`, `nbVariable`
- Relations: `datasets[]`, `variables[]`

**Enumeration** - Nomenclature pour variables catégorielles

- Champs clés: `id`, `name`, `description`, `nbVariable`
- Relations: `variables[]`, `values[]`

**Doc** - Document de métadonnées

- Champs clés: `id`, `name`, `path`, `type`
- Relations: `datasets[]`, `variables[]`

### Key Patterns

- All entities have: `id`, `name`, `description`
- Relations use IDs: `folderId`, `datasetId`, `parentId`, etc.
- Many-to-many via comma-separated strings: `tagIds: "1,2,3"`
- Computed fields have stats: `nb*`, `*Name` (denormalized)
