import { entityNames } from '@lib/constant'
import { link } from '@lib/url'
import { statExists } from '@stat/stat'
import escapeHtml from 'escape-html'
import type { TranslationKey } from '@i18n/types'
import type { Row, Column as ColumnType } from '@type'

type Translate = (key: TranslationKey) => string

const titleTranslations: { source: string; key: TranslationKey }[] = [
  { source: 'Identifiant', key: 'column.title.id' },
  { source: 'Nom', key: 'column.title.name' },
  { source: "Nom d'origine", key: 'column.title.originalName' },
  { source: 'Email', key: 'column.title.email' },
  { source: 'Téléphone', key: 'column.title.phone' },
  { source: 'Entité', key: 'column.title.entity' },
  { source: 'Element', key: 'column.title.element' },
  { source: 'Organisation', key: 'entity.organization' },
  { source: 'Partie de', key: 'column.title.partOf' },
  { source: 'Dossier', key: 'column.title.folder' },
  { source: 'Dossiers', key: 'column.title.folders' },
  { source: 'Type', key: 'column.title.type' },
  { source: 'Description', key: 'column.title.description' },
  { source: 'Mot clé', key: 'entity.tag' },
  { source: 'Mots clés', key: 'column.title.tags' },
  { source: 'Implique aussi', key: 'column.title.alsoImplies' },
  { source: 'Remonte', key: 'column.title.propagates' },
  { source: 'Impl.', key: 'column.title.implied' },
  { source: 'Concept', key: 'column.title.concept' },
  { source: 'Définition', key: 'column.title.definition' },
  { source: 'Fournisseur', key: 'column.title.owner' },
  { source: 'Gestionnaire', key: 'column.title.manager' },
  { source: 'Énumération', key: 'column.title.enumeration' },
  { source: 'Valeur', key: 'column.title.value' },
  { source: 'Nb val.', key: 'column.title.nbValues' },
  { source: 'Valeurs', key: 'column.title.values' },
  { source: 'Variables', key: 'column.title.variables' },
  { source: 'Doublons', key: 'column.title.duplicates' },
  { source: 'Manquant', key: 'column.title.missing' },
  { source: 'Fréquence', key: 'column.title.frequency' },
  { source: 'Similitude', key: 'column.title.similarity' },
  { source: 'Similaire à', key: 'column.title.similarTo' },
  { source: 'Stats', key: 'column.title.stats' },
  { source: 'Lignes', key: 'column.title.rows' },
  { source: 'Res.', key: 'column.title.resources' },
  { source: 'Taille', key: 'column.title.size' },
  { source: 'Mise à jour', key: 'column.title.update' },
  { source: 'Prochaine', key: 'column.title.next' },
  { source: 'Localisation', key: 'column.title.location' },
  { source: 'Format', key: 'column.title.format' },
  { source: 'Licence', key: 'column.title.license' },
  { source: 'Période', key: 'column.title.period' },
  { source: 'Début', key: 'column.title.start' },
  { source: 'Fin', key: 'column.title.end' },
  { source: 'Dataset', key: 'column.title.dataset' },
  { source: 'Emplacement', key: 'column.title.path' },
  { source: 'Metadonnées', key: 'column.title.metadata' },
  { source: 'Lien', key: 'column.title.link' },
  { source: 'Moment', key: 'column.title.moment' },
  { source: 'Clé étrangère', key: 'column.title.foreignKey' },
  { source: 'Clé métier', key: 'column.title.businessKey' },
  { source: 'Clé', key: 'column.title.key' },
  { source: 'Hérité', key: 'column.title.inherited' },
  { source: 'Relation', key: 'column.title.relation' },
]

const titleTranslationsByLength = [...titleTranslations].sort(
  (a, b) => b.source.length - a.source.length,
)

const tooltipTranslations: [string, TranslationKey][] = [
  ['Numéro de ligne', 'column.tooltip.rowNumber'],
  ['Identifiant unique', 'column.tooltip.id'],
  ['Nom', 'column.tooltip.name'],
  ["Nom d'origine avant renommage", 'column.tooltip.originalName'],
  ['Email de contact', 'column.tooltip.email'],
  ['Téléphone de contact', 'column.tooltip.phone'],
  ['Entité', 'column.tooltip.entity'],
  ['Element impliqué', 'column.tooltip.element'],
  ["Partie de l'entité", 'column.tooltip.partOfEntity'],
  ['Dossier', 'column.tooltip.folder'],
  ['Eléments parents', 'column.tooltip.parents'],
  ['Type de dataset', 'column.tooltip.datasetType'],
  ['Type de dossier', 'column.tooltip.folderType'],
  ['Type de données', 'column.tooltip.dataType'],
  ['Type de modification', 'column.tooltip.modificationType'],
  ['Type de fichier (markdown ou pdf)', 'column.tooltip.fileType'],
  ["Type de l'énumération 1", 'column.tooltip.enumeration1Type'],
  ["Type de l'énumération 2", 'column.tooltip.enumeration2Type'],
  ['Description', 'column.tooltip.description'],
  ['Mots clés directement associés', 'column.tooltip.tags'],
  ['Mots clés impliqués par ce mot clé', 'column.tooltip.impliedTags'],
  [
    'Remonte automatiquement vers les entités parentes',
    'column.tooltip.propagateToParents',
  ],
  [
    'Nombre de mots clés qui impliquent ce mot clé',
    'column.tooltip.impliedByTags',
  ],
  ['Concept métier associé', 'column.tooltip.concept'],
  ['Définition métier', 'column.tooltip.definition'],
  ['Organisation propriétaire', 'column.tooltip.owner'],
  ['Organisation gestionnaire', 'column.tooltip.manager'],
  ['Énumérations', 'column.tooltip.enumeration'],
  ["Nom de l'énumération 1", 'column.tooltip.enumeration1Name'],
  ["Nom de l'énumération 2", 'column.tooltip.enumeration2Name'],
  ['Valeur', 'column.tooltip.value'],
  ['Valeur de la variable', 'column.tooltip.variableValue'],
  ['Nom de la variable', 'column.tooltip.variableName'],
  ['Nombre de valeurs distinctes', 'column.tooltip.nbValues'],
  ["Nombre de valeurs de l'énumération 1", 'column.tooltip.enumeration1Values'],
  ["Nombre de valeurs de l'énumération 2", 'column.tooltip.enumeration2Values'],
  ['Valeurs', 'column.tooltip.values'],
  ['Nombre de valeurs dupliquées', 'column.tooltip.duplicates'],
  ['Nombre de valeurs manquantes', 'column.tooltip.missing'],
  ['Aperçu des données de fréquence', 'column.tooltip.frequency'],
  [
    'Statistiques descriptives (min, max, moyenne, écart-type)',
    'column.tooltip.stats',
  ],
  ['Nombre de lignes', 'column.tooltip.rows'],
  ['Nombre de ressources', 'column.tooltip.resources'],
  ['Taille des données', 'column.tooltip.size'],
  ['Fréquence de mise à jour', 'column.tooltip.updateFrequency'],
  ['Date de dernière mise à jour', 'column.tooltip.lastUpdate'],
  ['Date de prochaine mise à jour estimée', 'column.tooltip.nextUpdate'],
  ['Favoris', 'column.tooltip.favorites'],
  ["Niveau de profondeur de l'arborecence", 'column.tooltip.level'],
  ['Localisation géographique des données', 'column.tooltip.location'],
  ['Format des données', 'column.tooltip.format'],
  ['Licence', 'column.tooltip.license'],
  ['Période couverte par les données', 'column.tooltip.period'],
  ['Date de début de validité', 'column.tooltip.start'],
  ['Date de fin de validité', 'column.tooltip.end'],
  ['Dataset', 'column.tooltip.dataset'],
  ['Emplacement des données', 'column.tooltip.path'],
  ['Emplacement du doc', 'column.tooltip.docPath'],
  ['Nombre de docs', 'column.tooltip.docs'],
  ['Nombre de dossiers', 'column.tooltip.folders'],
  ["Nombre d'organisations", 'column.tooltip.organizations'],
  ['Nombre de datasets', 'column.tooltip.datasets'],
  ['Nombre de variables', 'column.tooltip.variables'],
  [
    "Nombre de variables liées à l'énumération 1",
    'column.tooltip.enumeration1Variables',
  ],
  [
    "Nombre de variables liées à l'énumération 2",
    'column.tooltip.enumeration2Variables',
  ],
  [
    "Pourcentage de valeurs de l'énumération 1 présentes dans l'énumération 2",
    'column.tooltip.enumerationSimilarity',
  ],
  ['Emplacement des métadonnées', 'column.tooltip.metadataPath'],
  ['Code source des traitements', 'column.tooltip.sourceCode'],
  ['Action', 'column.tooltip.action'],
  ['passé ou futur', 'column.tooltip.pastOrFuture'],
  ['Clé primaire ou partie de clé primaire', 'column.tooltip.key'],
  ['Clé métier ou partie de clé métier', 'column.tooltip.businessKey'],
  ['Variable référencée dans un autre dataset', 'column.tooltip.foreignKey'],
  [
    'Nombre de datasets référencés par clé étrangère (sortant)',
    'column.tooltip.outboundFkDatasets',
  ],
  [
    'Nombre de datasets qui référencent ce dataset par clé étrangère (entrant)',
    'column.tooltip.inboundFkDatasets',
  ],
  [
    'Nombre de variables qui référencent cette variable par clé étrangère (entrant)',
    'column.tooltip.inboundFkVariables',
  ],
  [
    "Element direct (vide) ou hérité d'un sous-élément (hérité)",
    'column.tooltip.inherited',
  ],
  [
    'Source (parent), dérivé (enfant) ou clé étrangère',
    'column.tooltip.relation',
  ],
]

function translateColumnTitle(title: string | undefined, translate: Translate) {
  if (!title) return title
  return title
    .split(/(<[^>]+>)/)
    .map(part => {
      if (part.startsWith('<')) return part
      let translatedPart = part
      for (const { source, key } of titleTranslationsByLength) {
        translatedPart = translatedPart.replace(
          source,
          escapeHtml(translate(key)),
        )
      }
      return translatedPart
    })
    .join('')
}

function translateColumnTooltip(tooltip: unknown, translate: Translate) {
  if (typeof tooltip !== 'string' || !tooltip) return undefined
  const [label, statButton] = tooltip.split('&nbsp;&nbsp;')
  const key = tooltipTranslations.find(([source]) => source === label)?.[1]
  if (!key) return tooltip
  const translatedLabel = escapeHtml(translate(key))
  return statButton
    ? `${translatedLabel}&nbsp;&nbsp;${statButton}`
    : translatedLabel
}

function filterEmptyColumns(columns: ColumnType[], items: Row[]) {
  const hasProp: Record<string, boolean> = {}
  for (const item of items) {
    for (const key of Object.keys(item)) {
      if (key === 'id' || key === 'isFavorite') {
        hasProp[key] = true
        continue
      }
      const value = (item as Record<string, unknown>)[key]
      if (Array.isArray(value)) {
        if (value.length > 0) hasProp[key] = true
      } else if (value) hasProp[key] = true
    }
  }
  const filterColumns = columns.filter(column => String(column.data) in hasProp)
  return filterColumns
}

function getTextWidth(lines: string[], font: string) {
  let maxWidth = 0
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return maxWidth
  context.font = font
  for (const line of lines) {
    const metrics = context.measureText(line)
    maxWidth = Math.max(maxWidth, metrics.width)
  }
  return maxWidth
}

export function defineColumns(
  columns: ColumnType[],
  data: Row[],
  entity: keyof typeof entityNames,
  keepAllCols: boolean,
  metaPath: string | undefined,
  nbRowLoading = 50,
  translate: Translate,
) {
  let columnsCopy = columns.map(obj => ({ ...obj })) as ColumnType[]

  if (columnsCopy[0]?.title !== '#') {
    const colNumerotation: ColumnType = {
      data: '_rowNum',
      name: '_rowNum',
      title: '#',
      tooltip: translate('column.tooltip.rowNumber'),
      filterType: 'input',
      width: '20px',
    }
    if (entity in entityNames) {
      if (metaPath) {
        colNumerotation.render = (data, type, row: Row) => {
          return link(metaPath + '/' + row.id, data)
        }
      } else {
        colNumerotation.render = (data, type, row: Row) => {
          return link(entity + '/' + row.id, data)
        }
      }
    }
    columnsCopy = [colNumerotation, ...columnsCopy]
  }

  if (!keepAllCols) columnsCopy = filterEmptyColumns(columnsCopy, data)

  let bold = ''
  const miniCol = [
    '_rowNum',
    'level',
    'isFavorite',
    'searchRecent',
    'evolutionType',
  ]
  for (const column of columnsCopy) {
    column.title = translateColumnTitle(column.title, translate)
    column.tooltip = translateColumnTooltip(column.tooltip, translate)

    const key = column.name ? column.name : (column.data as string)
    if (key !== '_rowNum' && statExists(entity, key)) {
      const columnStatBtn = `
        <span class="column-stat-btn icon-stat" data-entity="${entity}" data-attribut="${key}">
          <i class="fa-solid fa-signal">
        </i></span>`
      if (column.tooltip) column.tooltip += '&nbsp;&nbsp;' + columnStatBtn
      else column.tooltip = columnStatBtn
    }

    if (column.name && miniCol.includes(column.name)) {
      column.loadingMaxWidth = 20
      continue
    }
    if (column.hasLongText) {
      column.loadingWidth = 274
      column.loadingMaxWidth = 274
      continue
    }
    if (column.name === 'name') bold = 'bold'
    const cells: string[] = []
    for (const row of data.slice(0, nbRowLoading)) {
      let value = (row as Record<string, unknown>)[column.data as string]
      if ('fromLength' in column && column.fromLength && Array.isArray(value))
        value = value.length
      if (column.data === '_entityClean') value = 'icon-ico,' + value
      cells.push(String(value))
    }
    const cellsWidth =
      Math.round(getTextWidth(cells, `${bold} 16px "Helvetica Neue"`) * 100) /
      100
    column.loadingWidth = Math.min(274, cellsWidth)
    column.loadingMaxWidth = Math.min(274, cellsWidth)
  }
  return columnsCopy
}
