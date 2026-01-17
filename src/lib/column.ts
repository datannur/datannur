import escapeHtml from 'escape-html'
import { link } from 'svelte-fileapp'
import { get } from 'svelte/store'
import { viewportManager } from '@lib/viewport-manager'
import { wrapLongText, getPercent, pluralize, capitalize } from '@lib/util'
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

type EntityWithInstitution = MainEntityMap['folder' | 'dataset' | 'variable']

export default class Column {
  static id(): ColumnType {
    return {
      data: 'id',
      title: Render.icon('internalId') + 'Identifiant',
      name: 'id',
      tooltip: 'Identifiant unique',
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
    const titleName = name || 'Nom'
    if (!('withLink' in option)) option.withLink = true
    return {
      data: 'name',
      title: Render.icon(icon) + titleName,
      name: 'name',
      tooltip: 'Nom',
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
        let text = ''
        if (!option.withLink) {
          text = data
        } else if (option.withIndent && !row.noIndent) {
          text = link(row._entity + '/' + row.id, data, row._entity)
          indent = row.parentsRelative?.length - row.minimumDeep
        } else if (option?.isMeta && entity === 'variable' && row.storageKey) {
          text = link(row._entity + '/' + row.id, row.storageKey, row._entity)
        } else {
          text = link(row._entity + '/' + row.id, data, row._entity)
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
      title: Render.icon('name') + "Nom d'origine",
      hasLongText: true,
      filterType: 'input',
      tooltip: "Nom d'origine avant renommage",
      render: Render.longText,
    }
  }
  static entity(): ColumnType {
    return {
      data: '_entityClean',
      name: 'entity',
      title: Render.icon('entity') + 'Entité',
      defaultContent: '',
      tooltip: 'Entité',
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
      title: Render.icon('entity') + 'Partie de',
      defaultContent: '',
      hasLongText: true,
      tooltip: "Partie de l'entité",
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
      | 'modality1FolderId'
      | 'modality2FolderId' = 'folderId',
    folderNameVar:
      | 'folderName'
      | 'modality1FolderName'
      | 'modality2FolderName' = 'folderName',
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
      title: Render.icon('folder') + 'Dossier',
      defaultContent: '',
      hasLongText: true,
      tooltip: 'Dossier',
      render,
    }
  }
  static folderSimple(): ColumnType {
    return {
      data: 'folderId',
      title: Render.icon('folder') + 'Dossier',
      defaultContent: '',
      hasLongText: true,
      tooltip: 'Dossier',
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
      title: Render.icon(`folderTree${capitalize(entity)}`) + 'Partie de',
      defaultContent: '',
      hasLongText: true,
      tooltip: 'Eléments parents',
      render,
    }
  }
  static datasetType(): ColumnType {
    return {
      data: 'typeClean',
      title: Render.icon('type') + 'Type',
      defaultContent: '',
      name: 'type',
      filterType: 'select',
      tooltip: 'Type de dataset',
      render: Render.shortText,
    }
  }
  static datatype(): ColumnType {
    return {
      data: 'typeClean',
      title: Render.icon('type') + 'Type',
      defaultContent: '',
      name: 'type',
      filterType: 'select',
      tooltip: 'Type de données',
      render: Render.shortText,
    }
  }
  static description(): ColumnType {
    return {
      data: 'description',
      defaultContent: '',
      title: Render.icon('description') + 'Description',
      hasLongText: true,
      filterType: 'input',
      tooltip: 'Description',
      render: Render.longText,
    }
  }
  static tag(): ColumnType {
    return {
      data: 'tags',
      title: Render.icon('tag') + 'Mots clés',
      defaultContent: '',
      hasLongText: true,
      tooltip: 'Mots clés directement associés',
      name: 'tag',
      render: Render.tags,
    }
  }
  static owner(): ColumnType {
    let render: ColumnType['render'] = () => {}
    if (get(viewportManager.isMobile))
      render = (data, type, row: EntityWithInstitution) => {
        return wrapLongText(
          link(`institution/${row.ownerId}`, escapeHtml(row.ownerName)),
        )
      }
    else {
      render = (data, type, row: EntityWithInstitution) => {
        if (!row.ownerId) return ''
        return Render.withParentsFromId('institution', row.ownerId, type)
      }
    }
    return {
      data: 'ownerName',
      title: Render.icon('institution') + entityNames.owner,
      defaultContent: '',
      hasLongText: true,
      tooltip: 'Institution propriétaire',
      render,
    }
  }
  static manager(): ColumnType {
    let render: ColumnType['render'] = () => {}
    if (get(viewportManager.isMobile))
      render = (data, type, row: EntityWithInstitution) => {
        return wrapLongText(
          link(`institution/${row.managerId}`, escapeHtml(row.managerName)),
        )
      }
    else {
      render = (data, type, row: EntityWithInstitution) => {
        if (!row.managerId) return ''
        return Render.withParentsFromId('institution', row.managerId, type)
      }
    }
    return {
      data: 'managerName',
      title: Render.icon('institution') + entityNames.manager,
      defaultContent: '',
      hasLongText: true,
      tooltip: 'Institution gestionnaire',
      render,
    }
  }
  static modality(): ColumnType {
    return {
      data: 'modalities',
      title: Render.icon('modality') + 'Modalité',
      defaultContent: '',
      tooltip: 'Modalités',
      render: Render.modalitiesName,
    }
  }
  static value(): ColumnType {
    return {
      data: 'value',
      defaultContent: '',
      title: Render.icon('value') + 'Valeur',
      hasLongText: true,
      tooltip: 'Valeur',
      render: Render.longText,
    }
  }
  static nbValues(nbValueMax: number): ColumnType {
    return {
      data: 'nbValue',
      name: 'value',
      title: Render.icon('value') + 'Nb',
      defaultContent: '',
      filterType: 'input',
      tooltip: 'Nombre de valeurs',
      render: (data, type, row) => Render.nbValues(data, type, row, nbValueMax),
    }
  }
  static valuesPreview(): ColumnType {
    return {
      data: 'valuesPreview',
      title: Render.icon('value') + 'Valeurs',
      hasLongText: true,
      defaultContent: '',
      tooltip: 'Valeurs',
      render: Render.value,
    }
  }
  static nbDuplicates(): ColumnType {
    return {
      data: 'nbDuplicate',
      defaultContent: '',
      filterType: 'input',
      title: Render.icon('duplicate') + 'Doublons',
      tooltip: 'Nombre de valeurs dupliquées',
      render: Render.nbDuplicate,
    }
  }
  static nbMissing(): ColumnType {
    return {
      data: 'nbMissing',
      defaultContent: '',
      filterType: 'input',
      title: Render.icon('missing') + 'Manquant',
      tooltip: 'Nombre de valeurs manquantes',
      render: Render.nbMissing as ColumnType['render'],
    }
  }
  static freq(): ColumnType {
    return {
      data: 'freqPreview',
      title: Render.icon('freq') + 'Fréquence',
      defaultContent: '',
      hasLongText: true,
      tooltip: 'Aperçu des données de fréquence',
      render: Render.freqPreview,
    }
  }
  static nbRow(nbRowMax: number): ColumnType {
    return {
      data: 'nbRow',
      title: Render.icon('nbRow') + 'Lignes',
      filterType: 'input',
      defaultContent: '',
      tooltip: 'Nombre de lignes',
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
  static nbSources(
    nbSourcesMax: number,
    entity: 'dataset' | 'variable',
  ): ColumnType {
    return {
      data: 'sourceIds',
      title: Render.icon('nbSource') + 'In',
      filterType: 'input',
      defaultContent: '',
      tooltip: `Nombre de ${entity}s sources (en amont)`,
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
      tooltip: `Nombre de ${entity}s dérivées (en aval)`,
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
  static frequency(): ColumnType {
    return {
      data: 'updatingEach',
      name: 'frequency',
      defaultContent: '',
      filterType: 'select',
      title: Render.icon('frequency') + 'Fréquence',
      tooltip: 'Fréquence de mise à jour',
      render: Render.shortText,
    }
  }
  static lastUpdate(): ColumnType {
    return {
      data: 'lastUpdateDate',
      name: 'lastUpdate',
      defaultContent: '',
      title: Render.icon('date') + 'Mise à jour',
      filterType: 'input',
      tooltip: 'Date de dernière mise à jour',
      render: (data, type, row) => Render.datetime(data, type, row),
    }
  }
  static nextUpdate(): ColumnType {
    return {
      data: 'nextUpdateDate',
      name: 'nextUpdate',
      defaultContent: '',
      title: Render.icon('date') + 'Prochaine',
      filterType: 'input',
      tooltip: 'Date de prochaine mise à jour estimée',
      render: (data, type, row) =>
        Render.datetime(data, type, row, { estimation: true }),
    }
  }
  static favorite(): ColumnType {
    return {
      data: 'isFavorite',
      title: Render.icon('favorite') + "<span class='hidden'>favorite</span>",
      name: 'isFavorite',
      width: '20px',
      tooltip: 'Favoris',
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
      title: Render.icon('level') + "<span class='hidden'>level</span>",
      defaultContent: '',
      name: 'level',
      filterType: 'input',
      width: '20px',
      tooltip: "Niveau de profondeur de l'arborecence",
      render,
    }
  }
  static localisation(): ColumnType {
    return {
      data: 'localisation',
      title: Render.icon('localisation') + 'Localisation',
      defaultContent: '',
      tooltip: 'Localisation géographique des données',
      render: Render.shortText,
    }
  }
  static deliveryFormat(): ColumnType {
    return {
      data: 'deliveryFormat',
      title: Render.icon('deliveryFormat') + 'Format',
      defaultContent: '',
      filterType: 'select',
      tooltip: 'Format des données',
      render: Render.shortText,
    }
  }
  static period(): ColumnType {
    return {
      data: 'period',
      title: Render.icon('dateRange') + 'Période',
      defaultContent: '',
      tooltip: 'Période couverte par les données',
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
      title: Render.icon('dateRange') + 'Début',
      defaultContent: '',
      dateType: 'start',
      filterType: 'input',
      tooltip: 'Date de début de validité',
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
      title: Render.icon('dateRange') + 'Fin',
      defaultContent: '',
      dateType: 'end',
      filterType: 'input',
      tooltip: 'Date de fin de validité',
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
      title: Render.icon('dataset') + 'Dataset',
      hasLongText: true,
      tooltip: 'Dataset',
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
      title: Render.icon('dataPath') + 'Emplacement',
      defaultContent: '',
      tooltip: 'Emplacement des données',
      render: (data: string, type) => {
        if (!data) return ''
        if (type !== 'display') return data
        data = escapeHtml(data)
        return Render.copyCell(data, type)
      },
    }
  }
  static docPath(): ColumnType {
    return {
      data: 'path',
      name: 'docPath',
      title: Render.icon('link') + 'Lien',
      defaultContent: '',
      hasLongText: true,
      tooltip: 'Emplacement du doc',
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
      tooltip: 'Nombre de docs',
      render: (
        data: unknown[],
        type,
        row: MainEntityMap['institution' | 'folder' | 'dataset'],
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
      title: Render.icon('doc') + "<span class='hidden'>nbDocs</span>",
      filterType: 'input',
      tooltip: 'Nombre de docs',
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
      tooltip: "Nombre d'éléments de type " + entity,
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
      title: Render.icon('folder') + "<span class='hidden'>nbFolders</span>",
      filterType: 'input',
      tooltip: 'Nombre de dossiers',
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
  static nbDatasetRecursive(
    entity: keyof typeof entityNames,
    total: number,
  ): ColumnType {
    return {
      data: 'nbDatasetRecursive',
      title: Render.icon('dataset') + "<span class='hidden'>nbDatasets</span>",
      filterType: 'input',
      tooltip: 'Nombre de datasets',
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
      ? 'Variables'
      : `<span class='hidden'>nbVariables</span>`
    const linkPath =
      'linkPath' in option && option.linkPath ? option.linkPath : entity + '/'
    return {
      data: 'nbVariable' + (option.recursive ? 'Recursive' : ''),
      title: Render.icon('variable') + title,
      name: 'variable',
      filterType: 'input',
      tooltip: 'Nombre de variables',
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
      title: Render.icon('folder') + 'Dossier',
      tooltip: 'Dossier',
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
    if (!('title' in options)) options.title = 'Moment'
    if (!('tooltip' in options)) options.tooltip = "moment de l'ajout"
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
      title: Render.icon('key') + 'Clé',
      defaultContent: '',
      filterType: 'select',
      tooltip: 'Clé primaire ou partie de clé primaire',
      render: (data: string | boolean, type) => {
        if (!data) return ''
        if (type !== 'display') return data
        return `<i class="fas fa-key"></i>`
      },
    }
  }
  static metaLocalisation(): ColumnType {
    return {
      data: 'metaLocalisation',
      title: Render.icon('localisation') + 'Localisation',
      filterType: 'select',
      defaultContent: '',
      tooltip: 'Localisation (dans les données ou dans le schéma',
      render: Render.shortText,
    }
  }
  static inherited(): ColumnType {
    return {
      data: 'inherited',
      title: Render.icon('diagram') + 'Hérité',
      defaultContent: '',
      tooltip: "Element direct (vide) ou hérité d'un sous-élément (hérité)",
      render: Render.shortText,
    }
  }
  static lineageType(): ColumnType {
    return {
      data: 'lineageType',
      title: Render.icon('diagram') + 'Relation',
      defaultContent: '',
      filterType: 'select',
      tooltip: 'Source (parent) ou dérivé (enfant)',
      render: data => {
        if (!data) return ''
        if (data === 'derived') return 'Dérivé'
        if (data === 'source') return 'Source'
        return ''
      },
    }
  }
}
