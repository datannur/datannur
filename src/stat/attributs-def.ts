type DatabaseItem = Record<string, unknown>

export type Attribut = {
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
    type: 'string',
    nbRange: 5,
    getValue: x => (typeof x.name === 'string' ? x.name.length : 0),
  },
  description: {
    type: 'string',
    nbRange: 5,
    getValue: x =>
      typeof x.description === 'string' ? x.description.length : 0,
  },
  tag: {
    type: 'category',
    nonExclusive: 'tags',
  },
  updateFrequency: {
    type: 'category',
    variable: 'updatingEach',
  },
  lastUpdate: {
    icon: 'timeAgo',
    type: 'numeric',
    variable: 'lastUpdateDate',
    rangeType: 'timeAgo',
    parseDate: true,
  },
  lastUpdateDoc: {
    icon: 'timeAgo',
    type: 'numeric',
    variable: 'lastUpdate',
    rangeType: 'timeAgo',
  },
  type: {
    type: 'category',
    variable: 'typeClean',
  },
  docType: {
    icon: 'type',
    type: 'category',
    variable: 'type',
  },
  enumeration: {
    type: 'categoryOrdered',
    getValue: x => (Array.isArray(x.enumerations) ? x.enumerations.length : 0),
  },
  entity: {
    type: 'category',
    nonExclusive: 'entities',
  },
  variable: {
    type: 'numeric',
    variable: 'nbVariable',
  },
  value: {
    type: 'numeric',
    getValue: x => (Array.isArray(x.values) ? x.values.length : 0),
  },
  nbRow: {
    type: 'numeric',
    variable: 'nbRow',
  },
  nbResources: {
    type: 'numeric',
    variable: 'nbResources',
  },
  level: {
    type: 'categoryOrdered',
    getValue: x =>
      Array.isArray(x.parentsRelative) ? x.parentsRelative.length + 1 : 1,
  },
  localisation: {
    type: 'category',
    variable: 'localisation',
  },
  email: {
    type: 'string',
    nbRange: 1,
    getValue: x => (typeof x.email === 'string' ? x.email.length : 0),
  },
  phone: {
    type: 'string',
    nbRange: 1,
    getValue: x => (typeof x.phone === 'string' ? x.phone.length : 0),
  },
  surveyType: {
    type: 'category',
    variable: 'surveyType',
  },
  deliveryFormat: {
    type: 'category',
    variable: 'deliveryFormat',
  },
  license: {
    type: 'category',
    variable: 'license',
  },
  metadataPath: {
    type: 'string',
    nbRange: 1,
    getValue: x =>
      typeof x.metadataPath === 'string' ? x.metadataPath.length : 0,
  },
  docPath: {
    type: 'string',
    nbRange: 1,
    getValue: x => (typeof x.path === 'string' ? x.path.length : 0),
  },
  gitCode: {
    type: 'string',
    nbRange: 1,
    getValue: x => (typeof x.gitCode === 'string' ? x.gitCode.length : 0),
  },
  actionReadable: {
    icon: 'log',
    withHtml: {
      text: 'actionReadable',
      icon: 'actionIcon',
      link: 'actionLink',
    },
  },
  page: {
    withHtml: {
      text: 'element',
      icon: 'elementIcon',
      link: 'elementLink',
    },
    subtype: x => x.actionName === 'loadPage',
  },
  tab: {
    withHtml: {
      text: 'element',
      icon: 'elementIcon',
      link: 'elementLink',
    },
    subtype: x => x.actionName === 'selectTab',
  },
  search: {
    withHtml: {
      text: 'element',
      icon: 'elementIcon',
      link: 'elementLink',
    },
    subtype: x => x.actionName === 'searchBar',
  },
  timeAgo: {
    type: 'numeric',
    variable: 'timestamp',
    rangeType: 'timeAgo',
  },
}

export default attributsDef
