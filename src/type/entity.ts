import type {
  BaseEntity,
  Value,
  Frequency,
  Config,
  Favorite,
  ConfigFilter,
  FilterActive,
  Option,
  SearchHistory,
} from './base'
import { parentEntities, evolutionTypes } from '@lib/constant'

export type EnumerationSimilitute = {
  enumeration1Id: string | number
  enumeration2Id: string | number
  enumeration1FolderId: string | number
  enumeration2FolderId: string | number
  enumeration1Name: string
  enumeration2Name: string
  enumeration1FolderName: string
  enumeration2FolderName: string
  enumeration1Type: string
  enumeration2Type: string
  enumeration1NbValue: number
  enumeration2NbValue: number
  enumeration1NbVariable: number
  enumeration2NbVariable: number
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
    managerOrganizationId?: string | number
    ownerOrganizationId?: string | number
    dataPath?: string
    deliveryFormat?: string
    license?: string
    type?: string
    link?: string
    hasPreview?: boolean | number | string
    localisation?: string
    nbRow?: number
    schemaSignature?: string | null
    sampleSize?: number
    nbResources?: number
    dataSize?: number
    lastUpdateDate?: string | number
    updatingEach?: string
    noMoreUpdate?: boolean

    // Computed fields added during processing
    typeClean?: string
    folderName?: string
    ownerName?: string
    managerName?: string
    nbVariable?: number
    nextUpdateDate?: string
    keyVariables?: Variable[]
    businessKeyVariables?: Variable[]
    fkDatasetIds?: Set<string | number>
    fkReferencedByDatasetIds?: Set<string | number>
  }

export type FreqPreview = Frequency & {
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
    enumerationIds?: string
    conceptId?: string | number
    originalName?: string
    key?: string | boolean
    businessKey?: string | boolean
    nbDistinct?: number
    nbDuplicate?: number
    nbMissing?: number
    min?: number | null
    max?: number | null
    mean?: number | null
    std?: number | null
    type?: string
    sourceVariableIds?: string
    fkVariableId?: string | number
    isPattern?: boolean

    // Computed fields added during processing
    typeClean?: string
    fkVariableName?: string
    fkDatasetId?: string | number
    fkDatasetName?: string
    fkReferencedByVariableIds?: Set<string | number>
    num?: number
    nbRow?: number
    sampleSize?: number
    datasetName?: string
    datasetType?: string
    folderId?: string | number
    folderName?: string
    ownerOrganizationId?: string | number
    ownerName?: string
    managerOrganizationId?: string | number
    managerName?: string
    enumerations?: Enumeration[]
    values?: Value[]
    valuesPreview?: Value[]
    nbValue?: number
    hasFreq?: boolean
    freqPreview?: FreqPreview[]
    statsPreview?: string
    concept?: Concept
    conceptName?: string
  }

export type Enumeration = BaseEntity &
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
    managerOrganizationId?: string | number
    ownerOrganizationId?: string | number
    dataPath?: string
    deliveryFormat?: string
    license?: string
    gitCode?: string
    lastUpdateDate?: string | number
    link?: string
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

export type Organization = BaseEntity &
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
    impliedTagIds?: string
    propagateToParents?: boolean | 1

    // Computed fields added during processing
    impliedTags?: Tag[]
    impliedByTags?: Tag[]
    impliedTagsRecursive?: Tag[]
    entities?: { name: string; nb: number }[]
    nbOrganization?: number
    nbFolder?: number
    nbDataset?: number
    nbVariable?: number
    nbOrganizationRecursive?: number
    nbFolderRecursive?: number
    nbDocRecursive?: number
    nbDatasetRecursive?: number
    nbVariableRecursive?: number
    dataSizeRecursive?: number
  }

export type TagWithChildren = Tag & {
  children?: { [key: string]: TagWithChildren }
}

export type Concept = BaseEntity &
  WithRecursiveParent &
  WithTags &
  WithDocs &
  WithFavorite & {
    description?: string
    nbVariable?: number
    nbVariableRecursive?: number
  }

export type ConceptWithChildren = Concept & {
  children?: { [key: string]: ConceptWithChildren }
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
    nbOrganization?: number
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
  businessKey?: string
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
  organization: Organization
  folder: Folder
  tag: Tag
  concept: Concept
  doc: Doc
  dataset: Dataset
  variable: Variable
  enumeration: Enumeration
}

export type EntityTypeMap = MainEntityMap & {
  config: Config
  value: Value
  frequency: Frequency
  owner: Organization
  manager: Organization
  evolution: Evolution
  metaVariable: MetaVariable
  metaDataset: MetaDataset
  metaFolder: MetaFolder
  favorite: Favorite
  configFilter: ConfigFilter
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
