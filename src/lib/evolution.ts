import db from '@db'
import { evolutionTypes, parentEntities } from '@lib/constant'
import { getEntityName, getEvolutionTypeName } from '@i18n/constant-labels'
import { t } from '@i18n/messages'
import {
  dateToTimestamp,
  timestampToDate,
  convertQuarterToFullDate,
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
): ParentableEntityItem | null {
  if (!entityId) return null

  if (db.exists(entity, entityId)) {
    const item = db.get(entity, entityId)
    if (!item) return null
    const parentKey = `${parentEntities[entity]}Id` as keyof typeof item
    const parentEntityId = item[parentKey] as string | number | undefined
    return { ...item, _deleted: false, parentEntityId } as ParentableEntityItem
  }

  const item = evoDeleted[entity]?.[entityId]
  if (!item) return null

  return { ...item, _deleted: true } as ParentableEntityItem
}

function addHistory(evoDeleted: EvolutionDeleted) {
  db.foreach('evolution', evo => {
    const item = getItem(evo.entity, evo.entityId, evoDeleted)
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
    evo.time =
      evo.timestamp > Date.now() ? t('evolution.future') : t('evolution.past')

    const parentItem = getItem(evo.parentEntity, evo.parentEntityId, evoDeleted)
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
  entityData: ParentableEntityItem | null,
  parentItem: ParentableEntityItem | null,
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

function addValidity(
  validities: Evolution[],
  type: keyof typeof evolutionTypes,
  entity: ParentableEntityName,
  entityData: ParentableEntity,
  evoDeleted: EvolutionDeleted,
) {
  if (!entityData || !('id' in entityData)) return

  const parentEntityValue = parentEntities[entity]
  const parentEntity = (
    parentEntityValue === 'parent' ? entity : parentEntityValue
  ) as ParentableEntityName

  const parentKey = `${parentEntityValue}Id` as keyof ParentableEntity
  const parentEntityId =
    parentKey in entityData
      ? (entityData[parentKey] as string | number | undefined)
      : undefined

  const parentItem = getItem(parentEntity, parentEntityId, evoDeleted)

  const entityRecord = entityData as unknown as Record<string, unknown>
  const timestamp = dateToTimestamp(
    entityRecord[type] as string,
    type === 'startDate' ? 'start' : 'end',
  )

  if (!timestamp) {
    console.error(
      `Invalid date format for ${type} in ${entity} with id ${entityRecord.id}, value = ${entityRecord[type]}`,
    )
    return
  }

  const time =
    timestamp > Date.now() ? t('evolution.future') : t('evolution.past')

  let typeClean = t('evolution.other')
  if (type in evolutionTypes) typeClean = getEvolutionTypeName(type)

  const folderId = getFolderId(
    entity,
    entityData as ParentableEntityItem,
    parentItem,
  )

  validities.push({
    id: entityData.id,
    entity: entity,
    _entity: entity,
    _entityClean: getEntityName(entity),
    entityId: entityData.id,
    parentEntity: parentEntity,
    parentEntityClean: getEntityName(parentEntity),
    parentEntityId: entityRecord[`${parentEntities[entity]}Id`] as
      | string
      | number
      | undefined,
    parentName:
      parentItem && 'name' in parentItem ? parentItem.name : undefined,
    name: entityData.name,
    type,
    oldValue: entityRecord[type] as string | undefined,
    newValue: entityRecord[type] as string | undefined,
    variable: type,
    typeClean: typeClean,
    timestamp,
    time,
    date: timestampToDate(timestamp),
    folderId,
    isFavorite: false,
  })
}

function addValidities(evoDeleted: EvolutionDeleted) {
  const validities: Evolution[] = []
  const entities = Object.keys(parentEntities) as ParentableEntityName[]
  for (const entity of entities) {
    const tableData = db.tables[entity]
    if (
      Array.isArray(tableData) &&
      tableData.length > 0 &&
      (Object.keys(tableData[0]).includes('startDate') ||
        Object.keys(tableData[0]).includes('endDate') ||
        Object.keys(tableData[0]).includes('lastUpdateDate') ||
        Object.keys(tableData[0]).includes('nextUpdateDate'))
    ) {
      db.foreach(entity, entityData => {
        if ('startDate' in entityData && entityData.startDate) {
          addValidity(validities, 'startDate', entity, entityData, evoDeleted)
        }
        if ('endDate' in entityData && entityData.endDate) {
          addValidity(validities, 'endDate', entity, entityData, evoDeleted)
        }
        if ('lastUpdateDate' in entityData && entityData.lastUpdateDate) {
          addValidity(
            validities,
            'lastUpdateDate',
            entity,
            entityData,
            evoDeleted,
          )
        }
        if ('nextUpdateDate' in entityData && entityData.nextUpdateDate) {
          addValidity(
            validities,
            'nextUpdateDate',
            entity,
            entityData,
            evoDeleted,
          )
        }
      })
    }
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
  const diffDays = Math.ceil(
    (newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24),
  )
  const diffClass =
    diffDays > 0 ? 'highlight-diff-add' : 'highlight-diff-delete'

  const diffRelative = getPeriod(oldDate, newDate, true)

  return `
  ${oldDateString} ${arrowRight} ${newDateString}
  <br><span class="${diffClass}">${
    diffDays > 0 ? '+' : ''
  }${diffRelative}</span>`
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
    a = timestampToDate((a as number) * 1000)
    b = timestampToDate((b as number) * 1000)
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
  addHistory(evoDeleted)
  addValidities(evoDeleted)
}
