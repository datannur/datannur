import escapeHtml from 'escape-html'
import { link } from '@lib/url'
import { get } from 'svelte/store'
import { translate } from '@i18n/i18n'
import type { TranslationKey } from '@i18n/types'
import type { TranslationParams } from '@i18n/messages'
import { viewportManager } from '@lib/viewport-manager'
import {
  wrapLongText,
  getPercent,
  pluralize,
  capitalize,
  isHttpUrl,
} from '@lib/util'
import { getTimeAgo, getDatetime, dateToTimestamp } from '@lib/time'
import { entityNames, entityToIcon } from '@lib/constant'
import Render from '@lib/render'
import type {
  Column as ColumnType,
  EntityTypeMap,
  Evolution,
  FavoritableEntity,
  MainEntity,
  MainEntityMap,
  PeriodableEntity,
  RecursiveEntity,
  Tag,
} from '@type'

type EntityWithOrganization = MainEntityMap['folder' | 'dataset' | 'variable']

function t(key: TranslationKey, params?: TranslationParams) {
  return get(translate)(key, params)
}

export default class Column {
  static id(): ColumnType {
    return {
      data: 'id',
      title: Render.icon('internalId') + t('column.id.title'),
      name: 'id',
      tooltip: t('column.id.tooltip'),
      filterType: 'input',
      hasLongText: true,
      render: (data, type) => {
        data = escapeHtml(data)
        return Render.copyCell(data, type)
      },
    }
  }
  static name(
    entity = '',
    name = '',
    option: {
      withLink?: boolean
      withIndent?: boolean
      isMeta?: boolean
      linkSameEntityTab?: boolean
    } = {},
  ): ColumnType {
    const icon = entity || 'name'
    const titleName = name || t('column.name.title')
    if (!('withLink' in option)) option.withLink = true
    return {
      data: 'name',
      title: Render.icon(icon) + titleName,
      name: 'name',
      tooltip: t('column.name.tooltip'),
      filterType: 'input',
      hasLongText: true,
      render: (
        data: string,
        type: string,
        row: {
          id: string | number
          _entity: string
          parentsRelative: unknown[]
          minimumDeep: number
          storageKey: string
          nbChild: number
          [key: string]: unknown
        },
      ) => {
        data = escapeHtml(data)
        let indent = 0
        let text = data
        if (option.withLink) {
          if (option.withIndent && !row.noIndent) {
            text = link(row._entity + '/' + row.id, data, row._entity)
            indent = row.parentsRelative?.length - row.minimumDeep
          } else if (
            option?.isMeta &&
            entity === 'variable' &&
            row.storageKey
          ) {
            text = link(row._entity + '/' + row.id, row.storageKey, row._entity)
          } else {
            text = link(row._entity + '/' + row.id, data, row._entity)
          }
        }
        if (option.linkSameEntityTab && row.nbChild > 0) {
          text = link(
            row._entity + '/' + row.id + '?tab=' + row._entity + 's',
            data,
            row._entity,
          )
        }
        text = `<strong class="var-main-col">${text}</strong>`
        if (row._deleted) {
          text = `<span class="deleted">${data}</span>`
        }
        return wrapLongText(text, indent)
      },
    }
  }
  static originalName(): ColumnType {
    return {
      data: 'originalName',
      title: Render.icon('name') + t('column.originalName.title'),
      hasLongText: true,
      filterType: 'input',
      tooltip: t('column.originalName.tooltip'),
      render: Render.longText,
    }
  }
  static entity(): ColumnType {
    return {
      data: '_entityClean',
      name: 'entity',
      title: Render.icon('entity') + t('column.entity.title'),
      defaultContent: '',
      tooltip: t('column.entity.tooltip'),
      filterType: 'select',
      render: (data: string, type: string, row: { _entity: string }) => {
        if (!data) return ''
        if (type !== 'display') return data
        if (!row._entity)
          return '<span class="unknown-entity">Unknown Entity</span>'
        const entity = row._entity as keyof typeof entityNames
        return `
          <span class="icon icon-${entity}">
            <i class="fas fa-${entityToIcon[entity] || entity}"></i>
          </span>
          <span>${escapeHtml(data)}</span>`
      },
    }
  }
  static parentEntity(): ColumnType {
    return {
      data: 'parentName',
      name: 'parentEntity',
      title: Render.icon('entity') + t('column.partOf.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.partOf.tooltip'),
      filterType: 'input',
      render: (data, type, row: Evolution) => {
        if (!data) return ''
        if (type !== 'display')
          return `${row.parentEntityClean} | ${row.parentName}`
        if (!row.parentEntity)
          return '<span class="unknown-entity">Unknown Entity</span>'
        const entity = row.parentEntity as keyof typeof entityNames
        return wrapLongText(`
          <span class="icon icon-${entity}">
            <i class="fas fa-${entityToIcon[entity] || entity}"></i>
          </span>
          <span>${link(
            `${row.parentEntity}/${row.parentEntityId}`,
            escapeHtml(row.parentName),
            row.parentEntity,
          )}</span>`)
      },
    }
  }
  static folder(
    folderIdVar:
      | 'folderId'
      | 'enumeration1FolderId'
      | 'enumeration2FolderId' = 'folderId',
    folderNameVar:
      | 'folderName'
      | 'enumeration1FolderName'
      | 'enumeration2FolderName' = 'folderName',
  ): ColumnType {
    const render: ColumnType['render'] = (
      data,
      type,
      row: Record<string, string | number>,
    ) => {
      const folderId: string | number = row[folderIdVar]
      const folderName = row[folderNameVar] as string
      if (type !== 'display') return folderName
      return get(viewportManager.isMobile)
        ? wrapLongText(link('folder/' + folderId, escapeHtml(folderName)))
        : Render.withParentsFromId('folder', folderId, type)
    }
    return {
      data: folderNameVar,
      title: Render.icon('folder') + t('column.folder.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.folder.tooltip'),
      render,
    }
  }
  static folderSimple(): ColumnType {
    return {
      data: 'folderId',
      title: Render.icon('folder') + t('column.folder.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.folder.tooltip'),
      render: (data, type, row: FavoritableEntity) => {
        if (!data || !('folderName' in row)) return ''
        if (type !== 'display') return row.folderName
        return wrapLongText(link('folder/' + data, escapeHtml(row.folderName)))
      },
    }
  }
  static parents(entity: keyof typeof entityNames): ColumnType {
    const render = get(viewportManager.isMobile)
      ? Render.firstParent
      : Render.parentsIndent
    return {
      data: 'parents',
      title:
        Render.icon(`folderTree${capitalize(entity)}`) +
        t('column.parents.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.parents.tooltip'),
      render,
    }
  }
  static datasetType(): ColumnType {
    return {
      data: 'typeClean',
      title: Render.icon('type') + t('column.datasetType.title'),
      defaultContent: '',
      name: 'type',
      filterType: 'select',
      tooltip: t('column.datasetType.tooltip'),
      render: Render.shortText,
    }
  }
  static folderType(): ColumnType {
    return {
      data: 'typeClean',
      title: Render.icon('type') + t('column.folderType.title'),
      defaultContent: '',
      name: 'type',
      filterType: 'select',
      tooltip: t('column.folderType.tooltip'),
      render: Render.shortText,
    }
  }
  static datatype(): ColumnType {
    return {
      data: 'typeClean',
      title: Render.icon('type') + t('column.dataType.title'),
      defaultContent: t('column.emptyValue'),
      name: 'type',
      filterType: 'select',
      tooltip: t('column.dataType.tooltip'),
      render: (data, type) => {
        if (!data) return t('column.emptyValue')
        return Render.shortText(data, type)
      },
    }
  }
  static description(): ColumnType {
    return {
      data: 'description',
      defaultContent: '',
      title: Render.icon('description') + t('column.description.title'),
      hasLongText: true,
      filterType: 'input',
      tooltip: t('column.description.tooltip'),
      render: Render.longText,
    }
  }
  static tag(): ColumnType {
    return {
      data: 'tags',
      title: Render.icon('tag') + t('column.tags.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.tags.tooltip'),
      name: 'tag',
      render: Render.tags,
    }
  }
  static impliedTag(): ColumnType {
    return {
      data: 'impliedTags',
      title: Render.icon('tag') + t('column.alsoImplies.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.alsoImplies.tooltip'),
      name: 'impliedTag',
      render: Render.tags,
    }
  }
  static propagateToParents(): ColumnType {
    return {
      data: 'propagateToParents',
      title: Render.icon('propagateToParents') + t('column.propagates.title'),
      defaultContent: '',
      filterType: 'select',
      tooltip: t('column.propagates.tooltip'),
      name: 'propagateToParents',
      render: data => (data ? t('column.trueValue') : ''),
    }
  }
  static nbImpliedByTag(): ColumnType {
    return {
      data: 'impliedByTags',
      title: Render.icon('tag') + t('column.implied.title'),
      defaultContent: '',
      filterType: 'input',
      fromLength: true,
      tooltip: t('column.implied.tooltip'),
      name: 'impliedByTag',
      render: (data: Tag[], type, row: Tag) => {
        if (!data?.length) return ''
        if (type !== 'display') return data.length
        const content = link(`tag/${row.id}`, String(data.length), 'tag')
        return Render.numPercent(content, 100, 'tag', type)
      },
    }
  }
  static concept(): ColumnType {
    return {
      data: 'conceptName',
      title: Render.icon('concept') + t('column.concept.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.concept.tooltip'),
      name: 'concept',
      render: (data: string, type, row: { conceptId?: string | number }) => {
        if (!data || !row.conceptId) return ''
        if (type !== 'display') return data
        return wrapLongText(
          link('concept/' + row.conceptId, escapeHtml(data), 'concept'),
        )
      },
    }
  }
  static definition(): ColumnType {
    return {
      data: 'definition',
      defaultContent: '',
      title: Render.icon('description') + t('column.definition.title'),
      hasLongText: true,
      filterType: 'input',
      tooltip: t('column.definition.tooltip'),
      render: Render.longText,
    }
  }
  static owner(): ColumnType {
    const render: ColumnType['render'] = get(viewportManager.isMobile)
      ? (data, type, row: EntityWithOrganization) =>
          wrapLongText(
            link(
              `organization/${row.ownerOrganizationId}`,
              escapeHtml(row.ownerName),
            ),
          )
      : (data, type, row: EntityWithOrganization) => {
          if (!row.ownerOrganizationId) return ''
          return Render.withParentsFromId(
            'organization',
            row.ownerOrganizationId,
            type,
          )
        }
    return {
      data: 'ownerName',
      title: Render.icon('organization') + t('column.owner.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.owner.tooltip'),
      render,
    }
  }
  static manager(): ColumnType {
    const render: ColumnType['render'] = get(viewportManager.isMobile)
      ? (data, type, row: EntityWithOrganization) =>
          wrapLongText(
            link(
              `organization/${row.managerOrganizationId}`,
              escapeHtml(row.managerName),
            ),
          )
      : (data, type, row: EntityWithOrganization) => {
          if (!row.managerOrganizationId) return ''
          return Render.withParentsFromId(
            'organization',
            row.managerOrganizationId,
            type,
          )
        }
    return {
      data: 'managerName',
      title: Render.icon('organization') + t('column.manager.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.manager.tooltip'),
      render,
    }
  }
  static enumeration(): ColumnType {
    return {
      data: 'enumerations',
      title: Render.icon('enumeration') + t('column.enumeration.title'),
      defaultContent: '',
      tooltip: t('column.enumeration.tooltip'),
      render: Render.enumerationsName,
    }
  }
  static value(): ColumnType {
    return {
      data: 'value',
      defaultContent: '',
      title: Render.icon('value') + t('column.value.title'),
      hasLongText: true,
      tooltip: t('column.value.tooltip'),
      render: Render.longText,
    }
  }
  static nbValues(nbValueMax: number): ColumnType {
    return {
      data: 'nbValue',
      name: 'value',
      title: Render.icon('value') + t('column.nbValues.title'),
      defaultContent: '',
      filterType: 'input',
      tooltip: t('column.nbValues.tooltip'),
      render: (data, type, row) => Render.nbValues(data, type, row, nbValueMax),
    }
  }
  static valuesPreview(): ColumnType {
    return {
      data: 'valuesPreview',
      title: Render.icon('value') + t('column.values.title'),
      hasLongText: true,
      defaultContent: '',
      tooltip: t('column.values.tooltip'),
      render: Render.value,
    }
  }
  static nbDuplicates(): ColumnType {
    return {
      data: 'nbDuplicate',
      defaultContent: '',
      filterType: 'input',
      title: Render.icon('duplicate') + t('column.duplicates.title'),
      tooltip: t('column.duplicates.tooltip'),
      render: Render.nbDuplicate,
    }
  }
  static nbMissing(): ColumnType {
    return {
      data: 'nbMissing',
      defaultContent: '',
      filterType: 'input',
      title: Render.icon('missing') + t('column.missing.title'),
      tooltip: t('column.missing.tooltip'),
      render: Render.nbMissing as ColumnType['render'],
    }
  }
  static frequency(): ColumnType {
    return {
      data: 'freqPreview',
      title: Render.icon('frequency') + t('column.frequency.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.frequency.tooltip'),
      render: Render.freqPreview,
    }
  }
  static stats(): ColumnType {
    return {
      data: 'statsPreview',
      title: Render.icon('stat') + t('column.stats.title'),
      defaultContent: '',
      tooltip: t('column.stats.tooltip'),
      render: Render.statsPreview,
    }
  }
  static nbRow(nbRowMax: number): ColumnType {
    return {
      data: 'nbRow',
      title: Render.icon('nbRow') + t('column.rows.title'),
      filterType: 'input',
      defaultContent: '',
      tooltip: t('column.rows.tooltip'),
      render: (data, type) => {
        if (type !== 'display') {
          return data === '' || data === null ? 0 : parseInt(data)
        }
        if (!data) return ''
        const percent = getPercent(data / nbRowMax)
        return `${Render.numPercent(data, percent, 'nbRow', type)}`
      },
    }
  }
  static nbResources(nbResourcesMax: number): ColumnType {
    return {
      data: 'nbResources',
      title: Render.icon('nbResources') + t('column.resources.title'),
      filterType: 'input',
      defaultContent: '',
      tooltip: t('column.resources.tooltip'),
      render: (data, type) => {
        if (type !== 'display') {
          return data === '' || data === null ? 0 : parseInt(data)
        }
        if (!data) return ''
        const percent = getPercent(data / nbResourcesMax)
        return `${Render.numPercent(data, percent, 'nbResources', type)}`
      },
    }
  }
  static dataSize(
    dataSizeMax: number,
    option: { recursive?: boolean } = {},
  ): ColumnType {
    return {
      data: 'dataSize' + (option.recursive ? 'Recursive' : ''),
      title: Render.icon('dataSize') + t('column.size.title'),
      filterType: 'input',
      defaultContent: '',
      tooltip: t('column.size.tooltip'),
      render: (data, type) => {
        if (type !== 'display') {
          return data === '' || data === null ? 0 : parseInt(data)
        }
        if (!data) return ''
        const percent = getPercent(data / dataSizeMax)
        return `${Render.numPercent(Render.dataSize(data), percent, 'dataSize', type)}`
      },
    }
  }
  static nbSources(
    nbSourcesMax: number,
    entity: 'dataset' | 'variable',
  ): ColumnType {
    return {
      data: 'sourceIds',
      title: Render.icon('nbSource') + 'In',
      filterType: 'input',
      defaultContent: '',
      tooltip: t('column.sourceCount.tooltip', { entity }),
      render: (
        data: Set<string | number>,
        type,
        row: MainEntityMap['dataset' | 'variable'],
      ) => {
        if (!data || !data.size) return ''
        const nb = data.size
        if (type !== 'display') return nb
        const percent = getPercent(nb / nbSourcesMax)
        const content = link(`${entity}/${row.id}?tab=${entity}s`, String(nb))
        return `${Render.numPercent(content, percent, 'nbSource', type)}`
      },
    }
  }
  static nbDerived(
    nbDerivedMax: number,
    entity: 'dataset' | 'variable',
  ): ColumnType {
    return {
      data: 'derivedIds',
      title: Render.icon('nbDerived') + 'Out',
      filterType: 'input',
      defaultContent: '',
      tooltip: t('column.derivedCount.tooltip', { entity }),
      render: (
        data: Set<string | number>,
        type,
        row: MainEntityMap['dataset' | 'variable'],
      ) => {
        if (!data || !data.size) return ''
        const nb = data.size
        if (type !== 'display') return nb
        const percent = getPercent(nb / nbDerivedMax)
        const content = link(`${entity}/${row.id}?tab=${entity}s`, String(nb))
        return `${Render.numPercent(content, percent, 'nbDerived', type)}`
      },
    }
  }
  static updateFrequency(): ColumnType {
    return {
      data: 'updatingEach',
      name: 'updateFrequency',
      defaultContent: '',
      filterType: 'select',
      title: Render.icon('updateFrequency') + t('column.updateFrequency.title'),
      tooltip: t('column.updateFrequency.tooltip'),
      render: Render.shortText,
    }
  }
  static lastUpdate(): ColumnType {
    return {
      data: 'lastUpdateDate',
      name: 'lastUpdate',
      defaultContent: '',
      title: Render.icon('date') + t('column.lastUpdate.title'),
      filterType: 'input',
      tooltip: t('column.lastUpdate.tooltip'),
      render: (data, type, row) => Render.datetime(data, type, row),
    }
  }
  static nextUpdate(): ColumnType {
    return {
      data: 'nextUpdateDate',
      name: 'nextUpdate',
      defaultContent: '',
      title: Render.icon('date') + t('column.nextUpdate.title'),
      filterType: 'input',
      tooltip: t('column.nextUpdate.tooltip'),
      render: (data, type, row) =>
        Render.datetime(data, type, row, { estimation: true }),
    }
  }
  static favorite(): ColumnType {
    return {
      data: 'isFavorite',
      title:
        Render.icon('favorite') +
        `<span class='hidden'>${t('column.favorites.title')}</span>`,
      name: 'isFavorite',
      width: '20px',
      tooltip: t('column.favorites.tooltip'),
      filterType: 'select',
      render: Render.favorite,
    }
  }
  static level(levelMax = 0): ColumnType {
    let render: ColumnType['render'] = (data, type, row: RecursiveEntity) =>
      (row.parents?.length ?? 0) + 1
    if (levelMax) {
      render = (data, type, row: RecursiveEntity) => {
        const value = (row.parents?.length ?? 0) + 1
        if (!value) return ''
        const percent = getPercent(value / levelMax)
        return `${Render.numPercent(value, percent, 'key', type)}`
      }
    }
    return {
      data: 'id',
      title:
        Render.icon('level') +
        `<span class='hidden'>${t('column.level.title')}</span>`,
      defaultContent: '',
      name: 'level',
      filterType: 'input',
      width: '20px',
      tooltip: t('column.level.tooltip'),
      render,
    }
  }
  static localisation(): ColumnType {
    return {
      data: 'localisation',
      title: Render.icon('localisation') + t('column.location.title'),
      defaultContent: '',
      tooltip: t('column.location.tooltip'),
      render: Render.shortText,
    }
  }
  static geo(): ColumnType {
    return {
      data: 'geoType',
      title: Render.icon('geo') + t('column.geo.title'),
      name: 'geo',
      defaultContent: '',
      filterType: 'select',
      tooltip: t('column.geo.tooltip'),
      render: Render.shortText,
    }
  }
  static deliveryFormat(): ColumnType {
    return {
      data: 'deliveryFormat',
      title: Render.icon('deliveryFormat') + t('column.format.title'),
      defaultContent: '',
      filterType: 'select',
      tooltip: t('column.format.tooltip'),
      render: Render.shortText,
    }
  }
  static license(): ColumnType {
    return {
      data: 'license',
      title: Render.icon('license') + t('column.license.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.license.tooltip'),
      render: Render.longText,
    }
  }
  static period(): ColumnType {
    return {
      data: 'period',
      title: Render.icon('dateRange') + t('column.period.title'),
      defaultContent: '',
      tooltip: t('column.period.tooltip'),
      render: (data: string, type, row: PeriodableEntity) => {
        if (!data) return ''
        if (type !== 'display') return data
        let text = escapeHtml(data)
        if (row.periodDuration) text += '<br>' + escapeHtml(row.periodDuration)
        return text
      },
    }
  }
  static startDate(): ColumnType {
    return {
      data: 'startDate',
      title: Render.icon('dateRange') + t('column.start.title'),
      defaultContent: '',
      dateType: 'start',
      filterType: 'input',
      tooltip: t('column.start.tooltip'),
      render: (data: string, type) => {
        if (type === 'display') return data
        if (!data) data = '1000'
        return dateToTimestamp(data, 'start')
      },
    }
  }
  static endDate(): ColumnType {
    return {
      data: 'endDate',
      title: Render.icon('dateRange') + t('column.end.title'),
      defaultContent: '',
      dateType: 'end',
      filterType: 'input',
      tooltip: t('column.end.tooltip'),
      render: (data: string, type) => {
        if (type === 'display') return data
        if (!data) data = '9999'
        return dateToTimestamp(data, 'end')
      },
    }
  }
  static dataset(isMeta: boolean): ColumnType {
    return {
      data: 'datasetName',
      title: Render.icon('dataset') + t('column.dataset.title'),
      hasLongText: true,
      tooltip: t('column.dataset.tooltip'),
      render: (
        data: string,
        type,
        row: EntityTypeMap['variable' | 'metaVariable'],
      ) => {
        if (!data) return ''
        if (type !== 'display') return data
        data = escapeHtml(data)
        let linkContent = 'dataset/' + row.datasetId
        if (isMeta && 'metaDatasetId' in row)
          linkContent = 'metaDataset/' + row.metaDatasetId
        return wrapLongText(link(linkContent, data, 'dataset'))
      },
    }
  }
  static dataPath(): ColumnType {
    return {
      data: 'dataPath',
      title: Render.icon('dataPath') + t('column.path.title'),
      defaultContent: '',
      tooltip: t('column.path.tooltip'),
      render: (data: string, type) => {
        if (!data) return ''
        if (type !== 'display') return data
        const escapedData = escapeHtml(data)
        if (isHttpUrl(data)) {
          const href = escapeHtml(data.trim())
          return wrapLongText(
            `<a href="${href}" target="_blank" rel="noreferrer">${escapedData}</a>`,
          )
        }
        return Render.copyCell(escapedData, type)
      },
    }
  }
  static docPath(): ColumnType {
    return {
      data: 'path',
      name: 'docPath',
      title: Render.icon('link') + t('column.docPath.title'),
      defaultContent: '',
      hasLongText: true,
      tooltip: t('column.docPath.tooltip'),
      render: (data: string, type) => {
        if (!data) return ''
        if (type !== 'display') return data
        data = escapeHtml(data)
        return wrapLongText(`<a href="${data}" target="_blanck">${data}</a>`)
      },
    }
  }
  static nbDoc(
    entity: keyof typeof entityNames,
    total: number,
    withName = false,
  ): ColumnType {
    return {
      data: 'docsRecursive',
      title:
        Render.icon('doc') +
        (withName ? 'Docs' : "<span class='hidden'>nbDocs</span>"),
      filterType: 'input',
      defaultContent: '',
      fromLength: true,
      tooltip: t('column.docs.tooltip'),
      render: (
        data: unknown[],
        type,
        row: MainEntityMap['organization' | 'folder' | 'dataset'],
      ) => {
        if (!data.length) return ''
        if (type !== 'display') return data.length
        const content = link(
          entity + '/' + row.id + '?tab=docs',
          String(data.length),
        )
        const percent = getPercent(data.length / total)
        return `${Render.numPercent(content, percent, 'doc', type)}`
      },
    }
  }
  static nbDocRecursive(
    entity: keyof typeof entityNames,
    total: number,
  ): ColumnType {
    return {
      data: 'nbDocRecursive',
      title:
        Render.icon('doc') +
        `<span class='hidden'>${t('column.docs.title')}</span>`,
      filterType: 'input',
      tooltip: t('column.docs.tooltip'),
      render: (data: number, type, row: Tag) => {
        if (!data) return ''
        if (type !== 'display') return data
        const content = link(
          entity + '/' + row.id + '?tab=docs',
          escapeHtml(String(data)),
        )
        const percent = getPercent(data / total)
        return `${Render.numPercent(content, percent, 'doc', type)}`
      },
    }
  }
  static nbChildRecursive(
    entity: keyof typeof entityNames,
    total: number,
    linkPath = '',
  ): ColumnType {
    if (!linkPath) linkPath = entity + '/'
    const entityPlural = pluralize(entity)
    return {
      data: 'nbChildRecursive',
      title:
        Render.icon(entity) +
        `<span class='hidden'>nb${capitalize(entityPlural)}</span>`,
      filterType: 'input',
      tooltip: t('column.children.tooltip', { entity }),
      render: (data: number, type, row: RecursiveEntity) => {
        if (!data) return ''
        if (type !== 'display') return data
        const content = link(
          linkPath + row.id + `?tab=${entityPlural}`,
          escapeHtml(String(data)),
        )
        const percent = getPercent(data / total)
        return `${Render.numPercent(content, percent, entity, type)}`
      },
    }
  }
  static nbFolderRecursive(
    entity: keyof typeof entityNames,
    total: number,
  ): ColumnType {
    return {
      data: 'nbFolderRecursive',
      title:
        Render.icon('folder') +
        `<span class='hidden'>${t('column.folders.title')}</span>`,
      filterType: 'input',
      tooltip: t('column.folders.tooltip'),
      render: (data: number, type, row: RecursiveEntity) => {
        if (!data) return ''
        if (type !== 'display') return data
        const content = link(
          `${entity}/${row.id}?tab=folders`,
          escapeHtml(String(data)),
        )
        const percent = getPercent(data / total)
        return `${Render.numPercent(content, percent, 'folder', type)}`
      },
    }
  }
  static nbOrganizationRecursive(
    entity: keyof typeof entityNames,
    total: number,
  ): ColumnType {
    return {
      data: 'nbOrganizationRecursive',
      title:
        Render.icon('organization') +
        `<span class='hidden'>${t('column.organizations.title')}</span>`,
      filterType: 'input',
      tooltip: t('column.organizations.tooltip'),
      render: (data: number, type, row: RecursiveEntity) => {
        if (!data) return ''
        if (type !== 'display') return data
        const content = link(
          `${entity}/${row.id}?tab=organizations`,
          escapeHtml(String(data)),
        )
        const percent = getPercent(data / total)
        return `${Render.numPercent(content, percent, 'organization', type)}`
      },
    }
  }
  static nbDatasetRecursive(
    entity: keyof typeof entityNames,
    total: number,
  ): ColumnType {
    return {
      data: 'nbDatasetRecursive',
      title:
        Render.icon('dataset') +
        `<span class='hidden'>${t('column.datasets.title')}</span>`,
      filterType: 'input',
      tooltip: t('column.datasets.tooltip'),
      render: (data: number, type, row: RecursiveEntity) => {
        if (!data) return ''
        if (type !== 'display') return data
        const content = link(
          entity + '/' + row.id + '?tab=datasets',
          escapeHtml(String(data)),
        )
        const percent = getPercent(data / total)
        return `${Render.numPercent(content, percent, 'dataset', type)}`
      },
    }
  }
  static nbVariable(
    entity: keyof typeof entityNames,
    total: number,
    option: {
      linkPath?: string
      tab?: string
      showTitle?: boolean
      recursive?: boolean
    } = {},
  ): ColumnType {
    if (!('tab' in option)) option.tab = 'variables'
    if (!('showTitle' in option)) option.showTitle = false
    const title = option.showTitle
      ? t('column.variables.title')
      : `<span class='hidden'>${t('column.variables.title')}</span>`
    const linkPath =
      'linkPath' in option && option.linkPath ? option.linkPath : entity + '/'
    return {
      data: 'nbVariable' + (option.recursive ? 'Recursive' : ''),
      title: Render.icon('variable') + title,
      name: 'variable',
      filterType: 'input',
      tooltip: t('column.variables.tooltip'),
      render: (data: number, type, row: MainEntity) => {
        if (!data) return ''
        if (type !== 'display') return data
        const content = link(
          linkPath + row.id + `?tab=${option.tab}`,
          escapeHtml(String(data)),
        )
        const percent = getPercent(data / total)
        return `${Render.numPercent(content, percent, 'variable', type)}`
      },
    }
  }
  static metaFolder(): ColumnType {
    return {
      data: 'metaFolderId',
      title: Render.icon('folder') + t('column.folder.title'),
      tooltip: t('column.folder.tooltip'),
      render: (data: string | number, type) => {
        if (!data) return ''
        if (type !== 'display') return data
        data = escapeHtml(String(data))
        return link('metaFolder/' + data, data)
      },
    }
  }
  static timestamp(
    options: { varName?: string; title?: string; tooltip?: string } = {},
  ): ColumnType {
    if (!('varName' in options)) options.varName = 'timestamp'
    if (!('title' in options)) options.title = t('column.moment.title')
    if (!('tooltip' in options)) options.tooltip = t('column.moment.tooltip')
    return {
      data: options.varName,
      title: Render.icon('date') + options.title,
      defaultContent: '',
      type: 'num',
      filterType: 'input',
      tooltip: options.tooltip,
      render: (data: number, type) => {
        if (!data) return ''
        if (type === 'sort') return data
        if (type !== 'display') return getDatetime(data)
        let datetime = getDatetime(data)
        if (datetime.includes(' 00:00:00') || datetime.includes(' 01:00:00'))
          datetime = datetime.split(' ')[0]

        if (datetime.length > 12) {
          datetime = `<span style="font-size: 12px";>${datetime}</span>`
        }

        let timeAgo = getTimeAgo(data)

        if (timeAgo && timeAgo.length > 18) {
          timeAgo = `<span style="font-size: 12px";>${timeAgo}</span>`
        }

        const percent = getPercent((new Date().getTime() - data) / 31536000000)
        const entity = percent < 0 ? 'value' : 'doc'
        const percentAbsInversed = 100 - Math.abs(percent)
        const content = `${timeAgo}<br>${datetime}`
        return `${Render.numPercent(content, percentAbsInversed, entity, type)}`
      },
    }
  }
  static isKey(): ColumnType {
    return {
      data: 'key',
      title: Render.icon('key') + t('column.key.title'),
      defaultContent: '',
      filterType: 'select',
      tooltip: t('column.key.tooltip'),
      render: (data: string | boolean, type) => {
        if (!data) return ''
        if (type !== 'display') return data
        return `<span class="icon icon-key"><i class="fas fa-key"></i></span>`
      },
    }
  }
  static isBusinessKey(): ColumnType {
    return {
      data: 'businessKey',
      title: Render.icon('businessKey') + t('column.businessKey.title'),
      defaultContent: '',
      filterType: 'select',
      tooltip: t('column.businessKey.tooltip'),
      render: (data: string | boolean, type) => {
        if (!data) return ''
        if (type !== 'display') return data
        return `<span class="icon icon-businessKey"><i class="fas fa-id-card"></i></span>`
      },
    }
  }
  static fkVariable(): ColumnType {
    return {
      data: 'fkVariableName',
      title: Render.icon('fk') + t('column.foreignKey.title'),
      defaultContent: '',
      tooltip: t('column.foreignKey.tooltip'),
      render: (data: string, type, row: EntityTypeMap['variable']) => {
        if (!row.fkVariableId) return ''
        if (!data) return escapeHtml(String(row.fkVariableId))
        if (type !== 'display') return data
        const varLink = link(
          'variable/' + row.fkVariableId,
          escapeHtml(data),
          'variable',
        )
        const datasetLink = link(
          'dataset/' + row.fkDatasetId,
          escapeHtml(row.fkDatasetName ?? ''),
          'dataset',
        )
        return `${varLink}<br><small>${datasetLink}</small>`
      },
    }
  }
  static nbFk(nbFkMax: number): ColumnType {
    return {
      data: 'fkDatasetIds',
      title: Render.icon('fk') + 'FK →',
      filterType: 'input',
      defaultContent: '',
      tooltip: t('column.outboundFkDatasets.tooltip'),
      render: (
        data: Set<string | number>,
        type,
        row: EntityTypeMap['dataset'],
      ) => {
        if (!data || !data.size) return ''
        const nb = data.size
        if (type !== 'display') return nb
        const percent = getPercent(nb / nbFkMax)
        const content = link(`dataset/${row.id}?tab=datasets`, String(nb))
        return `${Render.numPercent(content, percent, 'fk', type)}`
      },
    }
  }
  static nbFkRef(nbFkRefMax: number): ColumnType {
    return {
      data: 'fkReferencedByDatasetIds',
      title: Render.icon('fk') + 'FK ←',
      filterType: 'input',
      defaultContent: '',
      tooltip: t('column.inboundFkDatasets.tooltip'),
      render: (
        data: Set<string | number>,
        type,
        row: EntityTypeMap['dataset'],
      ) => {
        if (!data || !data.size) return ''
        const nb = data.size
        if (type !== 'display') return nb
        const percent = getPercent(nb / nbFkRefMax)
        const content = link(`dataset/${row.id}?tab=datasets`, String(nb))
        return `${Render.numPercent(content, percent, 'fk', type)}`
      },
    }
  }
  static nbFkRefVar(nbFkRefMax: number): ColumnType {
    return {
      data: 'fkReferencedByVariableIds',
      title: Render.icon('fk') + 'FK ←',
      filterType: 'input',
      defaultContent: '',
      tooltip: t('column.inboundFkVariables.tooltip'),
      render: (
        data: Set<string | number>,
        type,
        row: EntityTypeMap['variable'],
      ) => {
        if (!data || !data.size) return ''
        const nb = data.size
        if (type !== 'display') return nb
        const percent = getPercent(nb / nbFkRefMax)
        const content = link(`variable/${row.id}?tab=variables`, String(nb))
        return `${Render.numPercent(content, percent, 'fk', type)}`
      },
    }
  }
  static metaLocalisation(): ColumnType {
    return {
      data: 'metaLocalisation',
      title: Render.icon('localisation') + t('column.metaLocation.title'),
      filterType: 'select',
      defaultContent: '',
      tooltip: t('column.metaLocation.tooltip'),
      render: Render.shortText,
    }
  }
  static inherited(): ColumnType {
    return {
      data: 'inherited',
      title: Render.icon('diagram') + t('column.inherited.title'),
      defaultContent: '',
      tooltip: t('column.inherited.tooltip'),
      render: Render.shortText,
    }
  }
  static relationType(): ColumnType {
    return {
      data: 'relationType',
      title: Render.icon('diagram') + t('column.relation.title'),
      defaultContent: '',
      filterType: 'select',
      tooltip: t('column.relation.tooltip'),
      render: data => {
        if (!data) return ''
        if (data === 'derived') return t('column.relation.derived')
        if (data === 'source') return t('column.relation.source')
        if (data === 'fk') return t('column.relation.foreignKey')
        if (data === 'fk-ref')
          return t('column.relation.referencedByForeignKey')
        return ''
      },
    }
  }
}
