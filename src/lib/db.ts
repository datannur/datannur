import db from '@db'
import { getVariableTypeClean } from '@lib/util'
import { getPeriod, dateToTimestamp, timestampToDate } from '@lib/time'
import { entityNames, locale } from '@lib/constant'
import { evolutionInitialSetup } from '@lib/evolution'
import type {
  Doc,
  EntityTypeMap,
  Filter,
  Value,
  RecursiveEntityName,
  MainEntityName,
  MainEntity,
  MainEntityMap,
  PeriodableEntity,
  DocableEntity,
  DocableEntityName,
  Variable,
  RecursiveEntity,
} from '@type'

function getNbValues(
  values: Value[],
  row: EntityTypeMap['variable' | 'modality' | 'metaVariable'],
) {
  if (values && values.length) return values.length
  if ('nbDistinct' in row && row.nbDistinct) return row.nbDistinct
  return 0
}

function formatStat(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return value.toLocaleString(locale, { maximumFractionDigits: 1 })
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString(locale)
}

function buildStatsPreview(variable: Variable): string {
  if (variable.min == null && variable.max == null) return ''
  const isDate = variable.type === 'date' || variable.type === 'datetime'
  const fmt = isDate ? formatDate : formatStat
  const minStr = variable.min != null ? fmt(variable.min) : ''
  const maxStr = variable.max != null ? fmt(variable.max) : ''
  const suffix = variable.type === 'string' ? ' car.' : ''
  const line1 = `${minStr} — ${maxStr}${suffix}`
  if (variable.mean == null) return line1
  const meanStr = fmt(variable.mean)
  let stdStr = ''
  if (variable.std != null) {
    const std = isDate ? Math.round(variable.std / 86400) : variable.std
    stdStr = ` ±${formatStat(std)}${isDate ? ' j' : ''}`
  }
  return `${line1}<br>moy. ${meanStr}${stdStr}`
}

function addEntities(item: EntityTypeMap['tag' | 'doc']) {
  if (!item) return
  item.entities = []
  if (item.nbInstitution && item.nbInstitution > 0)
    item.entities.push({ name: 'institution', nb: item.nbInstitution })
  if (item.nbFolder && item.nbFolder > 0)
    item.entities.push({ name: 'folder', nb: item.nbFolder })
  if (item.nbDataset && item.nbDataset > 0)
    item.entities.push({ name: 'dataset', nb: item.nbDataset })
  if ('nbVariable' in item && item.nbVariable && item.nbVariable > 0)
    item.entities.push({ name: 'variable', nb: item.nbVariable })
  if ('nbTag' in item && item.nbTag && item.nbTag > 0)
    item.entities.push({ name: 'tag', nb: item.nbTag })
}

function addName(item: MainEntity, entity: MainEntityName, alias = '') {
  if (!alias) alias = entity
  const itemIdField = `${alias}Id` as keyof MainEntity
  const itemId = itemIdField in item ? item[itemIdField] : undefined
  let itemName = ''
  if (typeof itemId === 'string' || typeof itemId === 'number')
    itemName = db.get(entity, itemId)?.name as string
  return itemName ?? ''
}
function addVariableNum(
  dataset: EntityTypeMap['dataset' | 'metaDataset'],
  entity: 'dataset' | 'metaDataset',
  variableEntity: 'variable' | 'metaVariable',
) {
  const variables = db.getAll(variableEntity, { [entity]: dataset.id })
  for (const [i, variable] of variables.entries()) variable.num = i + 1
}
function addPeriod(item: PeriodableEntity) {
  item.period = ''
  if (item.startDate && item.startDate === item.endDate)
    item.period = item.startDate
  else if (item.startDate && item.endDate) {
    item.periodDuration = getPeriod(item.startDate, item.endDate, true)
    item.period = `${item.startDate} - ${item.endDate}`
  } else if (item.startDate) item.period = `dès ${item.startDate}`
  else if (item.endDate) item.period = `jusqu'à ${item.endDate}`
}

function addDocs(entity: DocableEntityName, item: DocableEntity) {
  item.docs = db.getAll('doc', { [entity]: item.id })
  for (const doc of item.docs) {
    doc.entity = entity
    doc.entityId = item.id
  }
}

function variableAddDatasetInfo(variable: Variable) {
  const dataset = db.get('dataset', variable.datasetId)
  if (!dataset) return
  variable.nbRow = dataset.nbRow
  variable.datasetName = dataset.name
  variable.datasetType = dataset.type
  variable.folderName = ''
  if (db.use.folder) {
    variable.folderId = dataset.folderId
    variable.folderName = dataset.folderName
  }
  if (db.use.owner) {
    variable.ownerId = dataset.ownerId
    variable.ownerName = dataset.ownerName
  }
  if (db.use.manager) {
    variable.managerId = dataset.managerId
    variable.managerName = dataset.managerName
  }
}

function addEntity(item: MainEntity, entity: MainEntityName) {
  item._entity = entity
  item._entityClean = entityNames[entity]
}

function addSourceVar(variable: Variable) {
  if (!variable.sourceVarIds) return
  variable.sourceIds = new Set()
  const dataset = db.get('dataset', variable.datasetId)
  for (const sourceVarIdRaw of variable.sourceVarIds.split(',')) {
    const sourceVarId = sourceVarIdRaw.trim()
    const sourceVar = db.get('variable', sourceVarId.trim())
    if (!sourceVar) continue
    variable.sourceIds.add(sourceVarId)
    if (!sourceVar.derivedIds) sourceVar.derivedIds = new Set()
    sourceVar.derivedIds.add(variable.id)

    if (dataset) {
      if (!dataset.sourceIds) dataset.sourceIds = new Set()
      if (dataset.id !== sourceVar.datasetId) {
        dataset.sourceIds.add(sourceVar.datasetId)
      }
    }
    const sourceDataset = db.get('dataset', sourceVar.datasetId)
    if (sourceDataset) {
      if (!sourceDataset.derivedIds) sourceDataset.derivedIds = new Set()
      if (dataset && sourceDataset.id !== dataset.id) {
        sourceDataset.derivedIds.add(dataset.id)
      }
    }
  }
}

function addNextUpdate(item: EntityTypeMap['dataset' | 'folder']) {
  if (!item.lastUpdateDate || !item.updatingEach || item.noMoreUpdate) return
  let diff = 0
  const updatingEach = item.updatingEach.toLowerCase()
  if (updatingEach === 'quotidienne') diff = 24 * 3600
  else if (updatingEach === 'hebdomadaire') diff = 7 * (24 * 3600)
  else if (updatingEach === 'mensuelle') diff = 30 * (24 * 3600)
  else if (updatingEach === 'trimestrielle') diff = 90 * (24 * 3600)
  else if (updatingEach === 'semestrielle') diff = 180 * (24 * 3600)
  else if (updatingEach === 'annuelle') diff = 365 * (24 * 3600)
  else if (updatingEach === 'biennale') diff = 2 * (365 * 24 * 3600)
  else if (updatingEach === 'triennale') diff = 3 * (365 * 24 * 3600)
  else if (updatingEach === 'quadrimestrielle') diff = 4 * (365 * 24 * 3600)
  else if (updatingEach === 'quinquennale') diff = 5 * (365 * 24 * 3600)

  if (diff) {
    const lastUpdate = dateToTimestamp(item.lastUpdateDate)
    item.nextUpdateDate = timestampToDate(lastUpdate + diff * 1000)
  }
}

function getInstitutionItems(
  institutionId: string | number,
  entity: MainEntityName,
) {
  const ownItems = db.getAll(entity, { owner: institutionId })
  const manageItems = db.getAll(entity, { manager: institutionId })
  return removeDuplicateById([...ownItems, ...manageItems])
}

export function makeParentsRelative(
  parentId: string | number | undefined | false,
  items: RecursiveEntity[],
) {
  for (const item of items) {
    let position = 0
    item.parentsRelative = []
    if (!item.parents) continue
    for (const [i, parent] of item.parents.entries()) {
      if (parent.id === parentId) position = i + 1
    }
    item.parentsRelative = item.parents.slice(position)
  }
}

export function getRecursive<T extends MainEntityName>(
  entity: RecursiveEntityName,
  itemId: string | number,
  target: T,
): MainEntityMap[T][] {
  const get =
    entity === 'institution'
      ? (id: string | number) => getInstitutionItems(id, target)
      : (id: string | number) => db.getAll(target, { [entity]: id })
  let items = get(itemId)
  const childs = db.getAllChilds(entity, itemId)
  for (const child of childs) items = items.concat(get(child.id))
  return removeDuplicateById(items) as MainEntityMap[T][]
}

export function getParentPath(row: RecursiveEntity) {
  const items = 'parentsRelative' in row ? row.parentsRelative : row.parents
  if (!items) return row.name
  const parents = items.map(parent => parent.name)
  parents.push(row.name)
  return parents.join(' / ')
}

export function removeDuplicateById<T extends MainEntity>(items: T[]): T[] {
  return items.filter((v, i, a) => a.findIndex(v2 => v2.id === v.id) === i)
}

export function filterKeys(list: Record<string, unknown>[], keys: string[]) {
  return list.map(o => Object.fromEntries(keys.map(k => [k, o[k]])))
}

export function addMinimumDeep(
  items: RecursiveEntity[],
  noDeep = false,
  noIndent = false,
) {
  let minimumDeep = 999
  for (const item of items) {
    if (item.parentsRelative && item.parentsRelative.length < minimumDeep) {
      minimumDeep = item.parentsRelative.length
    }
  }
  for (const item of items) {
    if (noDeep) item.minimumDeep = item.parentsRelative?.length ?? 0
    else item.minimumDeep = minimumDeep

    item.noIndent = noIndent
    if (noIndent) item.minimumDeep = 0
  }
}

export function getLineage<T extends 'dataset' | 'variable'>(
  entity: T,
  elem: EntityTypeMap[T],
  lineageType: 'source' | 'derived',
): (EntityTypeMap[T] & { lineageType: string })[] {
  const lineage: (EntityTypeMap[T] & { lineageType: string })[] = []
  const lineageIds = elem[`${lineageType}Ids`]
  if (!lineageIds) return lineage
  for (const id of lineageIds) {
    const item = db.get(entity, id)
    if (!item) continue
    lineage.push({ ...item, lineageType })
  }
  return lineage
}

class Process {
  static institution() {
    db.foreach('institution', item => {
      addEntity(item, 'institution')
      item.isFavorite = false
      addPeriod(item)
      item.tags = db.getAll('tag', { institution: item.id })
      item.parents = db.getParents('institution', item.id)
      addDocs('institution', item)
      item.nbChild = db.countRelated('parent', item.id, 'institution')
      item.nbChildRecursive = db.getAllChilds('institution', item.id).length
      item.nbFolder = getInstitutionItems(item.id, 'folder').length
      item.nbDataset = getInstitutionItems(item.id, 'dataset').length
      item.nbFolderRecursive = getRecursive(
        'institution',
        item.id,
        'folder',
      ).length
      const datasets = getRecursive('institution', item.id, 'dataset')
      const variables = datasets.flatMap(dataset =>
        db.getAll('variable', { dataset }),
      )
      item.nbDatasetRecursive = datasets.length
      item.nbVariableRecursive = variables.length
    })
  }
  static folder() {
    db.foreach('folder', folder => {
      addEntity(folder, 'folder')
      folder.isFavorite = false
      folder.tags = db.getAll('tag', { folder })
      folder.parents = db.getParents('folder', folder.id)
      addDocs('folder', folder)
      folder.nbChild = db.countRelated('parent', folder.id, 'folder')
      folder.nbChildRecursive = db.getAllChilds('folder', folder.id).length
      addNextUpdate(folder)
      folder.typeClean = folder.type ?? ''
      if (db.use.owner)
        folder.ownerName = addName(folder, 'institution', 'owner')
      if (db.use.manager)
        folder.managerName = addName(folder, 'institution', 'manager')
      addPeriod(folder)
      const datasets = getRecursive('folder', folder.id, 'dataset')
      const variables = datasets.flatMap(dataset =>
        db.getAll('variable', { dataset }),
      )
      folder.nbDatasetRecursive = datasets.length
      folder.nbVariableRecursive = variables.length
    })
  }
  static tag() {
    db.foreach('tag', tag => {
      addEntity(tag, 'tag')
      tag.isFavorite = false
      tag.nbInstitution = db.countRelated('tag', tag.id, 'institution')
      tag.nbFolder = db.countRelated('tag', tag.id, 'folder')
      tag.nbDataset = db.countRelated('tag', tag.id, 'dataset')
      tag.nbVariable = db.countRelated('tag', tag.id, 'variable')
      addDocs('tag', tag)
      if (db.useRecursive.tag) tag.parents = db.getParents('tag', tag.id)
      tag.nbChild = db.countRelated('parent', tag.id, 'tag')
      tag.nbChildRecursive = db.getAllChilds('tag', tag.id).length
      tag.nbInstitutionRecursive = getRecursive(
        'tag',
        tag.id,
        'institution',
      ).length
      tag.nbFolderRecursive = getRecursive('tag', tag.id, 'folder').length
      tag.nbDocRecursive = getRecursive('tag', tag.id, 'doc').length
      tag.nbDatasetRecursive = getRecursive('tag', tag.id, 'dataset').length
      tag.nbVariableRecursive = getRecursive('tag', tag.id, 'variable').length
      addEntities(tag)
    })
  }
  static dataset() {
    const filters = getLocalFilter()
    const filterToName: { [id: string]: string } = {}
    for (const filter of filters) {
      db.use.filter = true
      filterToName[filter.id] = filter.name
    }
    db.foreach('dataset', dataset => {
      addEntity(dataset, 'dataset')
      dataset.isFavorite = false
      dataset.tags = db.getAll('tag', { dataset })
      addDocs('dataset', dataset)
      if (db.use.owner)
        dataset.ownerName = addName(dataset, 'institution', 'owner')
      if (db.use.manager)
        dataset.managerName = addName(dataset, 'institution', 'manager')
      if (db.use.folder) {
        dataset.folderName = addName(dataset, 'folder')
      } else dataset.folderName = ''
      addVariableNum(dataset, 'dataset', 'variable')
      dataset.nbVariable = db.countRelated('dataset', dataset.id, 'variable')
      addPeriod(dataset)
      addNextUpdate(dataset)
      dataset.typeClean = ''
      if (dataset.type) {
        dataset.typeClean = filterToName[dataset.type]
      }
    })
  }
  static doc() {
    db.foreach('doc', doc => {
      addEntity(doc, 'doc')
      doc.isFavorite = false
      doc.nbInstitution = db.countRelated('doc', doc.id, 'institution')
      doc.nbFolder = db.countRelated('doc', doc.id, 'folder')
      doc.nbDataset = db.countRelated('doc', doc.id, 'dataset')
      doc.nbTag = db.countRelated('doc', doc.id, 'tag')
      if (doc.lastUpdate) doc.lastUpdate *= 1000
      doc.lastUpdateDate = ''
      if (doc.lastUpdate) {
        doc.lastUpdateDate = new Date(doc.lastUpdate)
          .toISOString()
          .slice(0, 10)
          .replaceAll('-', '/')
      }
      addEntities(doc)
    })
  }
  static variable() {
    db.foreach('variable', variable => {
      addEntity(variable, 'variable')
      variable.isFavorite = false
      addPeriod(variable)
      variable.tags = db.getAll('tag', { variable })
      variable.modalities = []
      variable.values = []
      const modalities = db.getAll('modality', { variable })
      for (const modality of modalities) {
        const values = db.getAll('value', { modality })
        variable.values = variable.values.concat(values)
        variable.modalities = variable.modalities.concat(modality)
      }
      variable.valuesPreview = [...variable.values.slice(0, 10)]
      variable.typeClean = getVariableTypeClean(variable.type)
      variable.statsPreview = buildStatsPreview(variable)
      variableAddDatasetInfo(variable)
      const nbValues = getNbValues(variable.values, variable)
      variable.nbDistinct = nbValues
      variable.nbValue = nbValues
      addSourceVar(variable)
      if (variable.key) variable.key = 'oui'

      const freqData = db.getAll('freq', { variable })
      variable.hasFreq = freqData.length > 0

      if (freqData.length > 0) {
        const freqSorted = [...freqData].sort(
          (a, b) => (b.freq || 0) - (a.freq || 0),
        )
        const totalFreq = freqData.reduce(
          (sum, item) => sum + (item.freq || 0),
          0,
        )
        const maxFreq = freqSorted[0].freq || 1
        variable.freqPreview = freqSorted.slice(0, 10).map(item => ({
          ...item,
          total: totalFreq,
          max: maxFreq,
        }))
      } else {
        variable.freqPreview = []
      }

      if (!nbValues || !variable.nbDuplicate) return
      variable.nbDuplicate = Math.max((variable.nbRow || 0) - nbValues, 0)
      if (variable.nbMissing) variable.nbDuplicate -= variable.nbMissing
    })
  }
  static modality() {
    db.foreach('modality', modality => {
      addEntity(modality, 'modality')
      modality.isFavorite = false
      modality.nbVariable = db.countRelated('modality', modality.id, 'variable')
      if (db.use.folder) modality.folderName = addName(modality, 'folder')

      modality.variables = db.getAll('variable', { modality })
      modality.values = db.getAll('value', { modality })
      modality.nbValue = modality.values.length
      modality.valuesPreview = [...modality.values.slice(0, 10)]
      for (const value of modality.values) {
        value.modalityName = modality.name
        if (value.value === null) value.value = ''
        else {
          value.value = value.value.toString()
        }
      }
      if (!modality.type && modality.variables.length > 0) {
        modality.type = modality.variables[0].type
      }
      modality.typeClean = getVariableTypeClean(modality.type)
    })
  }
  static metaVariable() {
    db.foreach('metaVariable', metaVariable => {
      metaVariable._entity = 'metaVariable'
      metaVariable.isMeta = true
      metaVariable.typeClean = getVariableTypeClean(metaVariable.type)
      metaVariable.nbValue = getNbValues(
        metaVariable.values ?? [],
        metaVariable,
      )

      if (locale === 'fr' && metaVariable.descriptionFr) {
        metaVariable.description = metaVariable.descriptionFr
      }

      if (metaVariable.name === 'id') metaVariable.key = 'oui'
      metaVariable.metaLocalisation = ''
      if (metaVariable.isInMeta && !metaVariable.isInData)
        metaVariable.metaLocalisation = 'schéma'
      if (!metaVariable.isInMeta && metaVariable.isInData)
        metaVariable.metaLocalisation = 'données'

      const metaDataset = db.get('metaDataset', metaVariable.metaDatasetId)
      if (!metaDataset) return
      metaVariable.datasetId = metaDataset.id as string
      metaVariable.datasetName = metaDataset.name
      metaVariable.nbRow = metaDataset.nbRow
      metaVariable.metaFolderId = metaDataset.metaFolderId
      metaVariable.folderName = metaDataset.metaFolderId as string
    })
  }
  static metaDataset() {
    db.foreach('metaDataset', metaDataset => {
      metaDataset._entity = 'metaDataset'
      metaDataset.isMeta = true
      metaDataset.folder = { id: metaDataset.metaFolderId }
      metaDataset.folderName = metaDataset.metaFolderId as string
      if (locale === 'fr' && metaDataset.descriptionFr) {
        metaDataset.description = metaDataset.descriptionFr
      }
      addVariableNum(metaDataset, 'metaDataset', 'metaVariable')
      const metaVariables = db.getAll('metaVariable', { metaDataset })
      metaDataset.nbVariable = metaVariables.length
      if (metaDataset.lastUpdateTimestamp)
        metaDataset.lastUpdateTimestamp *= 1000
      metaDataset.metaLocalisation = ''
      if (metaDataset.isInMeta && !metaDataset.isInData)
        metaDataset.metaLocalisation = 'schéma'
      if (!metaDataset.isInMeta && metaDataset.isInData)
        metaDataset.metaLocalisation = 'données'
    })
  }
  static metaFolder() {
    db.foreach('metaFolder', metaFolder => {
      metaFolder._entity = 'metaFolder'
      metaFolder.isMeta = true
      if (locale === 'fr' && metaFolder.descriptionFr) {
        metaFolder.description = metaFolder.descriptionFr
      }
      const metaDatasets = db.getAll('metaDataset', { metaFolder })
      metaFolder.nbDataset = metaDatasets.length
      metaFolder.nbVariable = 0
      for (const metaDataset of metaDatasets) {
        metaFolder.nbVariable += metaDataset.nbVariable || 0
      }
    })
  }

  static evolution() {
    evolutionInitialSetup()
  }
}

function addDocRecursive() {
  for (const entity of ['institution', 'folder', 'dataset', 'tag'] as const) {
    db.foreach(entity, item => {
      item.docsRecursive = []
      let docs: Doc[] = []
      if (entity === 'institution') {
        const childs = getRecursive(entity, item.id, entity)
        for (const child of childs) {
          if (child.docs) docs = docs.concat(child.docs)
        }
      }
      if (entity === 'institution' || entity === 'folder') {
        const folders = getRecursive(entity, item.id, 'folder')
        const datasets = getRecursive(entity, item.id, 'dataset')
        for (const folder of folders) {
          if (folder.docs) docs = docs.concat(folder.docs)
        }
        for (const dataset of datasets) {
          if (dataset.docs) docs = docs.concat(dataset.docs)
        }
      }
      if (docs.length > 1) docs = removeDuplicateById(docs)
      for (const doc of docs) {
        item.docsRecursive?.push({ ...doc, inherited: 'hérité' })
      }
      if (item.docs) item.docsRecursive = item.docsRecursive.concat(item.docs)
    })
  }
}

export function getLocalFilter() {
  const dbFilters: Filter[] = []
  for (const configRow of db.getAll('config')) {
    if (configRow.id?.startsWith('filter_')) {
      dbFilters.push({
        id: configRow.value?.split(':')[0]?.trim(),
        name: configRow.value?.split(':')[1]?.trim(),
      })
    }
  }
  if (dbFilters.length > 0) return dbFilters
  return db.getAll('filter')
}

export function dbAddProcessedData() {
  Process.institution()
  Process.folder()
  Process.tag()
  Process.dataset()
  Process.doc()
  Process.variable()
  Process.modality()
  Process.metaVariable()
  Process.metaDataset()
  Process.metaFolder()
  Process.evolution()
  if (db.use.doc) addDocRecursive()
}
