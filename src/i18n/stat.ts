import type { TranslationKey } from './types'

const statAttributeLabelKeys: { [attribute: string]: TranslationKey } = {
  actionReadable: 'stat.attribute.actionReadable',
  deliveryFormat: 'stat.attribute.deliveryFormat',
  description: 'stat.attribute.description',
  docPath: 'stat.attribute.docPath',
  docType: 'stat.attribute.docType',
  email: 'stat.attribute.email',
  entity: 'stat.attribute.entity',
  enumeration: 'stat.attribute.enumeration',
  gitCode: 'stat.attribute.gitCode',
  lastUpdate: 'stat.attribute.lastUpdate',
  lastUpdateDoc: 'stat.attribute.lastUpdate',
  level: 'stat.attribute.level',
  license: 'stat.attribute.license',
  localisation: 'stat.attribute.localisation',
  metadataPath: 'stat.attribute.metadataPath',
  name: 'stat.attribute.name',
  nbResources: 'stat.attribute.nbResources',
  nbRow: 'stat.attribute.nbRow',
  page: 'stat.attribute.page',
  phone: 'stat.attribute.phone',
  search: 'stat.attribute.search',
  surveyType: 'stat.attribute.surveyType',
  tab: 'stat.attribute.tab',
  tag: 'stat.attribute.tag',
  timeAgo: 'stat.attribute.timeAgo',
  type: 'stat.attribute.type',
  updateFrequency: 'stat.attribute.updateFrequency',
  value: 'stat.attribute.value',
  variable: 'stat.attribute.variable',
}

export function getStatAttributeLabelKey(
  attribute: string | undefined,
): TranslationKey {
  return statAttributeLabelKeys[attribute ?? ''] ?? 'stat.attribute.unknown'
}
