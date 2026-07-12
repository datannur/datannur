import db from '@db'
import { evolutionTypes, parentEntities } from '@lib/constant'
import { getEntityName, getEvolutionTypeName } from '@i18n/constant-labels'
import { getCurrentLocale, t } from '@i18n/messages'
import {
  dateToTimestamp,
  timestampToDate,
  convertQuarterToFullDate,
  normalizeLastUpdateDate,
} from '@lib/time'
import { diffWords } from 'diff'
import { getPeriod } from '@lib/time'
import { splitOnLastSeparator } from '@lib/util'
import type {
  Evolution,
  ParentableEntity,
  ParentableEntityName,
  ParentableEntityItem,
} from '@type'

type EvolutionDeleted = {
  [K in ParentableEntityName]?: {
    [entityId: string | number]: Evolution
  }
}

type EvolutionItemRef = {
  id?: string | number
  name?: string
  folderId?: string | number
  parentEntityId?: string | number
  _deleted: boolean
}

type EvolutionItemCache = Map<string, EvolutionItemRef | null>

const arrowRight = `<i class="fas fa-arrow-right"></i>`

function getEvoDeleted() {
  const evoDeleted: EvolutionDeleted = {}
  db.foreach('evolution', evo => {
    if (evo.type === 'delete') {
      if (!(evo.entity in evoDeleted)) {
        evoDeleted[evo.entity] = {}
      }
      evoDeleted[evo.entity]![evo.entityId] = evo
    }
  })
  return evoDeleted
}

function getItem(
  entity: ParentableEntityName,
  entityId: string | number | undefined,
  evoDeleted: EvolutionDeleted,
  cache: EvolutionItemCache,
): EvolutionItemRef | null {
  if (!entityId) return null

  const cacheKey = `${entity}|${entityId}`
  const cached = cache.get(cacheKey)
  if (cached !== undefined) return cached

  if (db.exists(entity, entityId)) {
    const item = db.get(entity, entityId) as Record<string, unknown> | undefined
    if (!item) {
      cache.set(cacheKey, null)
      return null
    }
    const parentKey = `${parentEntities[entity]}Id`
    const ref: EvolutionItemRef = {
      id: item.id as string | number | undefined,
      name: item.name as string | undefined,
      folderId: item.folderId as string | number | undefined,
      parentEntityId: item[parentKey] as string | number | undefined,
      _deleted: false,
    }
    cache.set(cacheKey, ref)
    return ref
  }

  const deletedEvo = evoDeleted[entity]?.[entityId]
  if (!deletedEvo) {
    cache.set(cacheKey, null)
    return null
  }

  // not cached: addHistory can still mutate the source evolution row
  return {
    id: deletedEvo.id,
    name: deletedEvo.name,
    folderId: deletedEvo.folderId as string | number | undefined,
    parentEntityId: deletedEvo.parentEntityId,
    _deleted: true,
  }
}

function addHistory(evoDeleted: EvolutionDeleted, cache: EvolutionItemCache) {
  const now = Date.now()
  const futureLabel = t('evolution.future')
  const pastLabel = t('evolution.past')
  db.foreach('evolution', evo => {
    const item = getItem(evo.entity, evo.entityId, evoDeleted, cache)
    if (item && 'name' in item && item.name) {
      evo.name = item.name
      evo.parentEntityId = item.parentEntityId
      evo._deleted = item._deleted
      evo.id = item.id
    } else if (evo.entity === 'value') {
      const [id, value] = splitOnLastSeparator(String(evo.entityId), '---')
      evo._deleted = true
      if (!evo.parentEntityId) evo.parentEntityId = id
      if (!evo.name) evo.name = value ? value : String(evo.entityId)
    } else {
      evo.name = String(evo.entityId)
      evo._deleted = true
      evo._toHide = true
    }

    const parentEntity = (
      parentEntities[evo.entity] === 'parent'
        ? evo.entity
        : parentEntities[evo.entity]
    ) as ParentableEntityName

    evo._entity = evo.entity
    evo._entityClean = getEntityName(evo.entity)
    evo.typeClean = getEvolutionTypeName(evo.type)
    evo.parentEntity = parentEntity
    evo.parentEntityClean = getEntityName(parentEntity)
    evo.timestamp *= 1000
    evo.time = evo.timestamp > now ? futureLabel : pastLabel

    const parentItem = getItem(
      evo.parentEntity,
      evo.parentEntityId,
      evoDeleted,
      cache,
    )
    evo.parentName =
      parentItem && 'name' in parentItem ? parentItem.name : undefined
    evo.parentDeleted = parentItem?._deleted
    evo.isFavorite = false

    evo.date = timestampToDate(evo.timestamp)
    evo.folderId = getFolderId(evo.entity, item, parentItem)

    if (evo.variable) {
      evo.variable = evo.variable.replace(/_([a-z])/g, (m: string, c: string) =>
        c.toUpperCase(),
      )
    }
  })

  db.tables.evolution = db.tables.evolution?.filter(evo => !evo._toHide)
}

function getFolderId(
  entity: ParentableEntityName,
  entityData: EvolutionItemRef | ParentableEntityItem | null,
  parentItem: EvolutionItemRef | null,
) {
  if (entity === 'folder' && entityData && 'id' in entityData) {
    return entityData.id
  } else if (entity === 'dataset' && entityData && 'folderId' in entityData) {
    return entityData.folderId
  } else if (entity === 'variable' && parentItem && 'folderId' in parentItem) {
    return parentItem.folderId
  } else if (
    entity === 'enumeration' &&
    entityData &&
    'folderId' in entityData
  ) {
    return entityData.folderId
  } else if (entity === 'value' && parentItem && 'folderId' in parentItem) {
    return parentItem.folderId
  }
  return undefined
}

type ValidityContext = {
  entity: ParentableEntityName
  parentEntity: ParentableEntityName
  parentKey: string
  entityClean: string
  parentEntityClean: string
  now: number
  futureLabel: string
  pastLabel: string
  typeCleanByType: Record<string, string>
  evoDeleted: EvolutionDeleted
  cache: EvolutionItemCache
}

const validityTypes = [
  'startDate',
  'endDate',
  'lastUpdateDate',
  'nextUpdateDate',
] as const

function addValidity(
  validities: Evolution[],
  type: keyof typeof evolutionTypes,
  ctx: ValidityContext,
  entityData: ParentableEntity,
) {
  if (!entityData || !('id' in entityData)) return

  const entityRecord = entityData as unknown as Record<string, unknown>
  const parentEntityId = entityRecord[ctx.parentKey] as
    | string
    | number
    | undefined

  const parentItem = getItem(
    ctx.parentEntity,
    parentEntityId,
    ctx.evoDeleted,
    ctx.cache,
  )

  const timestamp = dateToTimestamp(
    entityRecord[type] as string,
    type === 'startDate' ? 'start' : 'end',
  )

  if (!timestamp) {
    console.error(
      `Invalid date format for ${type} in ${ctx.entity} with id ${entityRecord.id}, value = ${entityRecord[type]}`,
    )
    return
  }

  const folderId = getFolderId(
    ctx.entity,
    entityData as ParentableEntityItem,
    parentItem,
  )

  validities.push({
    id: entityData.id,
    entity: ctx.entity,
    _entity: ctx.entity,
    _entityClean: ctx.entityClean,
    entityId: entityData.id,
    parentEntity: ctx.parentEntity,
    parentEntityClean: ctx.parentEntityClean,
    parentEntityId,
    parentName: parentItem?.name,
    name: entityData.name,
    type,
    oldValue: entityRecord[type] as string | undefined,
    newValue: entityRecord[type] as string | undefined,
    variable: type,
    typeClean: ctx.typeCleanByType[type],
    timestamp,
    time: timestamp > ctx.now ? ctx.futureLabel : ctx.pastLabel,
    date: timestampToDate(timestamp),
    folderId,
    isFavorite: false,
  })
}

function addValidities(
  evoDeleted: EvolutionDeleted,
  cache: EvolutionItemCache,
) {
  const validities: Evolution[] = []
  const now = Date.now()
  const futureLabel = t('evolution.future')
  const pastLabel = t('evolution.past')
  const otherLabel = t('evolution.other')
  const typeCleanByType: Record<string, string> = {}
  for (const type of validityTypes) {
    typeCleanByType[type] =
      type in evolutionTypes ? getEvolutionTypeName(type) : otherLabel
  }

  const entities = Object.keys(parentEntities) as ParentableEntityName[]
  for (const entity of entities) {
    const tableData = db.tables[entity]
    if (!Array.isArray(tableData) || tableData.length === 0) continue
    const columns = Object.keys(tableData[0])
    if (!validityTypes.some(type => columns.includes(type))) continue

    const parentEntityValue = parentEntities[entity]
    const parentEntity = (
      parentEntityValue === 'parent' ? entity : parentEntityValue
    ) as ParentableEntityName
    const ctx: ValidityContext = {
      entity,
      parentEntity,
      parentKey: `${parentEntityValue}Id`,
      entityClean: getEntityName(entity),
      parentEntityClean: getEntityName(parentEntity),
      now,
      futureLabel,
      pastLabel,
      typeCleanByType,
      evoDeleted,
      cache,
    }
    db.foreach(entity, entityData => {
      const record = entityData as unknown as Record<string, unknown>
      for (const type of validityTypes) {
        if (record[type]) {
          addValidity(validities, type, ctx, entityData)
        }
      }
    })
  }

  if (!db.tables.evolution) db.tables.evolution = []
  for (const validity of validities) {
    db.tables.evolution.push(validity)
  }
}

function parseDateStandard(dateString: string) {
  if (dateString.length === 6 && dateString[4] === 't') {
    dateString = convertQuarterToFullDate(dateString, 'start')
  }
  if (/(?:T| )\d{1,2}:\d{2}/.test(dateString)) {
    const timestamp = dateToTimestamp(dateString)
    return Number.isFinite(timestamp) ? new Date(timestamp) : null
  }
  const parts = dateString.split('/')
  if (parts.length === 2) parts.push('1')
  if (parts.length !== 3) return null
  const [year, month, day] = parts.map(Number)
  if (year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
    return new Date(year, month - 1, day)
  }
  return null
}

function outputDiffNumber(oldVal: number, newVal: number) {
  const diff = newVal - oldVal
  const percentageChange =
    oldVal !== 0 ? ((diff / oldVal) * 100).toFixed(1) : '∞'
  const diffClass = diff > 0 ? 'highlight-diff-add' : 'highlight-diff-delete'

  return `${oldVal.toLocaleString()} ${arrowRight} ${newVal.toLocaleString()} 
      <br><span class="${diffClass}">${
        diff > 0 ? '+' : ''
      }${diff.toLocaleString()} | 
      ${diff > 0 ? '+' : ''}${percentageChange}%</span>
  `
}

function outputDiffDate(
  oldDate: Date,
  newDate: Date,
  oldDateString: string,
  newDateString: string,
) {
  const diffMs = newDate.getTime() - oldDate.getTime()
  const hasTime = [oldDateString, newDateString].some(date =>
    /(?:T| )\d{1,2}:\d{2}/.test(date),
  )
  const diffClass = diffMs > 0 ? 'highlight-diff-add' : 'highlight-diff-delete'

  const diffRelative = hasTime
    ? formatDateTimeDiff(diffMs)
    : getPeriod(oldDate, newDate, true)
  const diffPrefix = hasTime && diffMs < 0 ? '-' : diffMs > 0 ? '+' : ''

  return `
  ${oldDateString} ${arrowRight} ${newDateString}
  <br><span class="${diffClass}">${diffPrefix}${diffRelative}</span>`
}

function formatDateTimeDiff(diffMs: number) {
  const absSeconds = Math.abs(diffMs) / 1000
  if (absSeconds < 60) return formatDiffUnit(absSeconds, 'second')
  const absMinutes = absSeconds / 60
  if (absMinutes < 60) return formatDiffUnit(absMinutes, 'minute')
  const absHours = absMinutes / 60
  if (absHours < 24) return formatDiffUnit(absHours, 'hour')
  const absDays = absHours / 24
  if (absDays < 7) return formatDiffUnit(absDays, 'day')
  const absWeeks = absDays / 7
  if (absWeeks < 4.34524) return formatDiffUnit(absWeeks, 'week')
  const absMonths = absWeeks / 4.34524
  if (absMonths < 12) return formatDiffUnit(absMonths, 'month')
  return formatDiffUnit(absMonths / 12, 'year')
}

function formatDiffUnit(value: number, unit: Intl.NumberFormatOptions['unit']) {
  const rounded = Math.round(value)
  return new Intl.NumberFormat(getCurrentLocale(), {
    style: 'unit',
    unit,
    unitDisplay: 'long',
  }).format(rounded)
}

function outputDiffString(oldVal: string, newVal: string) {
  const diff = diffWords(oldVal, newVal)
  return diff
    .map(part => {
      if (part.added) {
        return `<span class="highlight-diff-add">${part.value}</span>`
      } else if (part.removed) {
        return `<span class="highlight-diff-delete">${part.value}</span>`
      } else {
        return `<span>${part.value}</span>`
      }
    })
    .join('')
}

export function highlightDiff(
  a: unknown,
  b: unknown,
  variable: string | null = null,
) {
  if (!a && !b) return ''

  if (variable === 'lastUpdate') {
    a =
      typeof a === 'number'
        ? timestampToDate(a * 1000)
        : normalizeLastUpdateDate(String(a))
    b =
      typeof b === 'number'
        ? timestampToDate(b * 1000)
        : normalizeLastUpdateDate(String(b))
  }

  const aStr = a ? a.toString() : ''
  const bStr = b ? b.toString() : ''

  let oldDate: Date | null = null
  let newDate: Date | null = null
  const isANumber = !isNaN(Number(aStr)) && aStr !== ''
  const isBNumber = !isNaN(Number(bStr)) && bStr !== ''

  if (!isANumber) {
    oldDate = parseDateStandard(aStr)
  } else {
    const aNum = parseFloat(aStr)
    if (aNum > 1800 && aNum < 2100) {
      oldDate = new Date(aNum, 0, 1)
    }
  }

  if (!isBNumber) {
    newDate = parseDateStandard(bStr)
  } else {
    const bNum = parseFloat(bStr)
    if (bNum > 1800 && bNum < 2100) {
      newDate = new Date(bNum, 0, 1)
    }
  }

  if (oldDate && newDate) return outputDiffDate(oldDate, newDate, aStr, bStr)
  if (isANumber && isBNumber)
    return outputDiffNumber(parseFloat(aStr), parseFloat(bStr))
  return outputDiffString(aStr, bStr)
}

export function evolutionInitialSetup() {
  const evoDeleted = getEvoDeleted()
  const cache: EvolutionItemCache = new Map()
  addHistory(evoDeleted, cache)
  addValidities(evoDeleted, cache)
}
