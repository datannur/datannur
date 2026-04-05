type DatabaseItem = Record<string, unknown>

export type Attribut = {
  name?: string
  type?: string
  variable?: string
  getValue?: (item: DatabaseItem) => unknown
  parseDate?: boolean
  nbRange?: number
  rangeType?: string
  nonExclusive?: string
  subtype?: (item: DatabaseItem) => boolean
  icon?: string
  key?: string
  withHtml?: {
    text: string
    icon?: string
    link?: string | null
  }
}

const attributsDef: Record<string, Attribut> = {
  name: {
    name: 'Nom',
    type: 'string',
    nbRange: 5,
    getValue: x => (typeof x.name === 'string' ? x.name.length : 0),
  },
  description: {
    name: 'Description',
    type: 'string',
    nbRange: 5,
    getValue: x =>
      typeof x.description === 'string' ? x.description.length : 0,
  },
  tag: {
    name: 'Mots clés',
    type: 'category',
    nonExclusive: 'tags',
  },
  frequency: {
    name: 'Fréquence',
    type: 'category',
    variable: 'updatingEach',
  },
  lastUpdate: {
    icon: 'timeAgo',
    name: 'Mise à jour',
    type: 'numeric',
    variable: 'lastUpdateDate',
    rangeType: 'timeAgo',
    parseDate: true,
  },
  lastUpdateDoc: {
    icon: 'timeAgo',
    name: 'Mise à jour',
    type: 'numeric',
    variable: 'lastUpdate',
    rangeType: 'timeAgo',
  },
  type: {
    name: 'Type',
    type: 'category',
    variable: 'typeClean',
  },
  docType: {
    name: 'Type',
    icon: 'type',
    type: 'category',
    variable: 'type',
  },
  modality: {
    name: 'Nombre de modalités',
    type: 'categoryOrdered',
    getValue: x => (Array.isArray(x.modalities) ? x.modalities.length : 0),
  },
  entity: {
    name: 'Entités',
    type: 'category',
    nonExclusive: 'entities',
  },
  variable: {
    name: 'Nombre de variables',
    type: 'numeric',
    variable: 'nbVariable',
  },
  value: {
    name: 'Nombre de valeurs',
    type: 'numeric',
    getValue: x => (Array.isArray(x.values) ? x.values.length : 0),
  },
  nbRow: {
    name: 'Nombre de lignes',
    type: 'numeric',
    variable: 'nbRow',
  },
  nbResources: {
    name: 'Nombre de ressources',
    type: 'numeric',
    variable: 'nbResources',
  },
  level: {
    name: "Niveau de l'arborecence",
    type: 'categoryOrdered',
    getValue: x =>
      Array.isArray(x.parentsRelative) ? x.parentsRelative.length + 1 : 1,
  },
  localisation: {
    name: 'Localisation',
    type: 'category',
    variable: 'localisation',
  },
  email: {
    name: 'Email',
    type: 'string',
    nbRange: 1,
    getValue: x => (typeof x.email === 'string' ? x.email.length : 0),
  },
  phone: {
    name: 'Téléphone',
    type: 'string',
    nbRange: 1,
    getValue: x => (typeof x.phone === 'string' ? x.phone.length : 0),
  },
  surveyType: {
    name: "Type d'enquête",
    type: 'category',
    variable: 'surveyType',
  },
  deliveryFormat: {
    name: 'Format des données',
    type: 'category',
    variable: 'deliveryFormat',
  },
  metadataPath: {
    name: 'Metadonnées',
    type: 'string',
    nbRange: 1,
    getValue: x =>
      typeof x.metadataPath === 'string' ? x.metadataPath.length : 0,
  },
  docPath: {
    name: 'Lien',
    type: 'string',
    nbRange: 1,
    getValue: x => (typeof x.path === 'string' ? x.path.length : 0),
  },
  gitCode: {
    name: 'Repo GIT',
    type: 'string',
    nbRange: 1,
    getValue: x => (typeof x.gitCode === 'string' ? x.gitCode.length : 0),
  },
  actionReadable: {
    icon: 'log',
    name: 'Log',
    withHtml: {
      text: 'actionReadable',
      icon: 'actionIcon',
      link: 'actionLink',
    },
  },
  page: {
    name: 'Charger la page',
    withHtml: {
      text: 'element',
      icon: 'elementIcon',
      link: 'elementLink',
    },
    subtype: x => x.actionName === 'loadPage',
  },
  tab: {
    name: "Sélectionner l'onglet",
    withHtml: {
      text: 'element',
      icon: 'elementIcon',
      link: 'elementLink',
    },
    subtype: x => x.actionName === 'selectTab',
  },
  search: {
    name: 'Rechercher',
    withHtml: {
      text: 'element',
      icon: 'elementIcon',
      link: 'elementLink',
    },
    subtype: x => x.actionName === 'searchBar',
  },
  timeAgo: {
    name: 'Moment',
    type: 'numeric',
    variable: 'timestamp',
    rangeType: 'timeAgo',
  },
}

export default attributsDef
