import type {
  BaseEntity,
  Value,
  Freq,
  Config,
  Favorite,
  FilterActive,
  Option,
  SearchHistory,
  Filter,
} from './base'
import { parentEntities, evolutionTypes } from '@lib/constant'

export type ModalitySimilitute = {
  modality1Id: string | number
  modality2Id: string | number
  modality1FolderId: string | number
  modality2FolderId: string | number
  modality1Name: string
  modality2Name: string
  modality1FolderName: string
  modality2FolderName: string
  modality1Type: string
  modality2Type: string
  modality1NbValue: number
  modality2NbValue: number
  modality1NbVariable: number
  modality2NbVariable: number
  ratio: number
}

export type Log = {
  id: number
  action: string
  entity: string
  entityId: string | number
  timestamp: number
  actionName?: string
  actionReadable?: string
  actionIcon?: string
  element?: string | number
  elementIcon?: string
  elementLink?: string
  _entity?: string
  _entityClean?: string
}

// Composable type fragments for entity properties
export type WithRecursiveParent<T = BaseEntity> = {
  parentId?: string | number
  parents?: T[]
  parentsRelative?: T[]
  minimumDeep?: number
  noIndent?: boolean
  pathString?: string
  nbChild?: number
  nbChildRecursive?: number
}

export type WithTags = {
  tagIds?: string
  tags?: Tag[]
}

export type WithDocs = {
  docIds?: string
  docs?: Doc[]
  docsRecursive?: (Doc & { inherited?: string })[]
}

export type WithFavorite = {
  isFavorite?: boolean
  favoriteTimestamp?: number
}

export type WithPeriod = {
  startDate?: string
  endDate?: string
  period?: string
  periodDuration?: string
}

export type WithRelations = {
  sourceIds?: Set<string | number>
  derivedIds?: Set<string | number>
  relationType?: 'source' | 'derived' | 'fk' | 'fk-ref'
}

export type EntityWithRelations = BaseEntity & {
  tags?: Tag[]
  docs?: Doc[]
  docsRecursive?: (Doc & { inherited?: string })[]
}

export type Dataset = BaseEntity &
  WithTags &
  WithDocs &
  WithFavorite &
  WithPeriod &
  WithRelations & {
    folderId?: string | number
    managerId?: string | number
    ownerId?: string | number
    dataPath?: string
    deliveryFormat?: string
    type?: string
    link?: string
    localisation?: string
    nbRow?: number
    sampleSize?: number
    nbResources?: number
    dataSize?: number
    lastUpdateDate?: string
    updatingEach?: string
    noMoreUpdate?: boolean

    // Computed fields added during processing
    typeClean?: string
    folderName?: string
    ownerName?: string
    managerName?: string
    nbVariable?: number
    nextUpdateDate?: string
    fkDatasetIds?: Set<string | number>
    fkReferencedByDatasetIds?: Set<string | number>
  }

export type FreqPreview = Freq & {
  total: number
  max: number
  scale?: number
}

export type Variable = BaseEntity &
  WithTags &
  WithFavorite &
  WithPeriod &
  WithRelations & {
    datasetId: string | number
    modalityIds?: string
    originalName?: string
    key?: string | boolean
    nbDistinct?: number
    nbDuplicate?: number
    nbMissing?: number
    min?: number | null
    max?: number | null
    mean?: number | null
    std?: number | null
    type?: string
    sourceVarIds?: string
    fkVarId?: string | number
    isPattern?: boolean

    // Computed fields added during processing
    typeClean?: string
    fkVarName?: string
    fkDatasetId?: string | number
    fkDatasetName?: string
    fkReferencedByVarIds?: Set<string | number>
    num?: number
    nbRow?: number
    sampleSize?: number
    datasetName?: string
    datasetType?: string
    folderId?: string | number
    folderName?: string
    ownerId?: string | number
    ownerName?: string
    managerId?: string | number
    managerName?: string
    modalities?: Modality[]
    values?: Value[]
    valuesPreview?: Value[]
    nbValue?: number
    hasFreq?: boolean
    freqPreview?: FreqPreview[]
    statsPreview?: string
  }

export type Modality = BaseEntity &
  WithFavorite & {
    folderId?: string | number
    type?: string

    // Computed fields added during processing
    folderName?: string
    typeClean?: string
    nbVariable?: number
    variables?: Variable[]
    values?: Value[]
    valuesPreview?: Value[]
    nbValue?: number
  }

export type Folder = BaseEntity &
  WithRecursiveParent &
  WithTags &
  WithDocs &
  WithFavorite &
  WithPeriod & {
    managerId?: string | number
    ownerId?: string | number
    dataPath?: string
    deliveryFormat?: string
    gitCode?: string
    lastUpdateDate?: string
    localisation?: string
    metadataPath?: string
    surveyType?: string
    type?: string
    updatingEach?: string
    noMoreUpdate?: boolean

    // Computed fields added during processing
    ownerName?: string
    managerName?: string
    nbDatasetRecursive?: number
    nbVariableRecursive?: number
    dataSizeRecursive?: number
    nextUpdateDate?: string
    typeClean?: string
  }

export type Institution = BaseEntity &
  WithRecursiveParent &
  WithTags &
  WithDocs &
  WithFavorite &
  WithPeriod & {
    email?: string
    phone?: string

    // Computed fields added during processing
    nbFolder?: number
    nbDataset?: number
    nbFolderRecursive?: number
    nbDatasetRecursive?: number
    nbVariableRecursive?: number
    dataSizeRecursive?: number
  }

export type Tag = BaseEntity &
  WithRecursiveParent &
  WithDocs &
  WithFavorite & {
    // Computed fields added during processing
    entities?: { name: string; nb: number }[]
    nbInstitution?: number
    nbFolder?: number
    nbDataset?: number
    nbVariable?: number
    nbInstitutionRecursive?: number
    nbFolderRecursive?: number
    nbDocRecursive?: number
    nbDatasetRecursive?: number
    nbVariableRecursive?: number
    dataSizeRecursive?: number
  }

export type TagWithChildren = Tag & {
  children?: { [key: string]: TagWithChildren }
}

export type Doc = BaseEntity &
  WithFavorite & {
    path?: string
    type?: string
    lastUpdate?: number
    lastUpdateDate?: string

    // Computed fields added during processing
    entities?: { name: string; nb: number }[]
    entity?: string
    entityId?: string | number
    nbInstitution?: number
    nbFolder?: number
    nbDataset?: number
    nbTag?: number
    inherited?: string
  }

// Meta entities (for metadata datasets)
export type MetaVariable = Omit<BaseEntity, 'id'> & {
  id: string
  metaDatasetId: string
  storageKey: string
  descriptionFr?: string
  type?: string
  values?: Value[]
  isInMeta?: boolean
  isInData?: boolean
  nbDistinct: number
  nbDuplicate: number
  nbMissing: number

  // Computed fields
  num?: number
  isMeta?: boolean
  typeClean?: string
  nbValue?: number
  datasetId?: string
  datasetName?: string
  nbRow?: number
  metaFolderId?: string | number
  folderName?: string
  metaLocalisation?: string
  key?: string
}

export type MetaDataset = Omit<BaseEntity, 'id' | 'description'> & {
  id: string
  name: EntityName
  description: string
  metaFolderId: string
  isInMeta: boolean
  isInData: boolean
  lastUpdateTimestamp: number
  descriptionFr?: string

  // Computed fields
  isMeta?: true
  folder?: { id: string | number }
  folderName?: string
  nbVariable?: number
  metaLocalisation?: string
  nbRow?: number
}

export type MetaFolder = Omit<BaseEntity, 'id'> & {
  id: string
  descriptionFr?: string
  // Computed fields
  isMeta?: boolean
  nbDataset?: number
  nbVariable?: number
}

export type Evolution = WithFavorite & {
  id?: string | number
  entity: ParentableEntityName
  entityId: string | number
  type: keyof typeof evolutionTypes
  timestamp: number
  name?: string
  parentEntityId?: string | number
  oldValue?: string
  newValue?: string
  variable?: string
  _deleted?: boolean
  _entity?: ParentableEntityName
  _entityClean?: string
  typeClean?: string
  parentEntity?: ParentableEntityName
  parentEntityClean?: string
  time?: string
  parentName?: string
  parentDeleted?: boolean
  date?: string
  folderId?: string | number
  _toHide?: boolean
}

export type MainEntityMap = {
  institution: Institution
  folder: Folder
  tag: Tag
  doc: Doc
  dataset: Dataset
  variable: Variable
  modality: Modality
}

export type EntityTypeMap = MainEntityMap & {
  config: Config
  value: Value
  freq: Freq
  owner: Institution
  manager: Institution
  evolution: Evolution
  metaVariable: MetaVariable
  metaDataset: MetaDataset
  metaFolder: MetaFolder
  favorite: Favorite
  filter: Filter
  filterActive: FilterActive
  log: Log
  option: Option
  searchHistory: SearchHistory
  parent: BaseEntity
}

export type EntityName = keyof EntityTypeMap
export type AnyEntity = EntityTypeMap[EntityName]

export type MainEntityName = keyof MainEntityMap
export type MainEntity = MainEntityMap[MainEntityName]

export type ParentableEntityName = keyof typeof parentEntities
export type ParentableEntityTypeMap = Pick<EntityTypeMap, ParentableEntityName>
export type ParentableEntity = ParentableEntityTypeMap[ParentableEntityName]

export type ParentableEntityItem = ParentableEntity & {
  _deleted: boolean
  parentEntityId?: string | number
}

// Auto-generated entity capability types using conditional types
export type FavoritableEntityName = {
  [K in keyof EntityTypeMap]: EntityTypeMap[K] extends WithFavorite ? K : never
}[keyof EntityTypeMap]
export type FavoritableEntityMap = Pick<EntityTypeMap, FavoritableEntityName>
export type FavoritableEntity = FavoritableEntityMap[FavoritableEntityName]

export type TaguableEntityName = {
  [K in keyof EntityTypeMap]: EntityTypeMap[K] extends WithTags ? K : never
}[keyof EntityTypeMap]
export type TaguableEntityMap = Pick<EntityTypeMap, TaguableEntityName>
export type TaguableEntity = TaguableEntityMap[TaguableEntityName]

export type RecursiveEntityName = {
  [K in keyof EntityTypeMap]: EntityTypeMap[K] extends WithRecursiveParent
    ? K
    : never
}[keyof EntityTypeMap]
export type RecursiveEntityMap = Pick<EntityTypeMap, RecursiveEntityName>
export type RecursiveEntity = RecursiveEntityMap[RecursiveEntityName]

export type DocableEntityName = {
  [K in keyof EntityTypeMap]: EntityTypeMap[K] extends WithDocs ? K : never
}[keyof EntityTypeMap]
export type DocableEntityMap = Pick<EntityTypeMap, DocableEntityName>
export type DocableEntity = DocableEntityMap[DocableEntityName]

export type PeriodableEntityName = {
  [K in keyof EntityTypeMap]: EntityTypeMap[K] extends WithPeriod ? K : never
}[keyof EntityTypeMap]
export type PeriodableEntityMap = Pick<EntityTypeMap, PeriodableEntityName>
export type PeriodableEntity = PeriodableEntityMap[PeriodableEntityName]
