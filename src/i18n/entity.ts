import type { MainEntityName } from '@type'
import type { TranslationKey } from './types'

const entityKeys: { [entity in MainEntityName]: TranslationKey } = {
  concept: 'entity.concept',
  dataset: 'entity.dataset',
  doc: 'entity.doc',
  enumeration: 'entity.enumeration',
  folder: 'entity.folder',
  organization: 'entity.organization',
  tag: 'entity.tag',
  variable: 'entity.variable',
}

const entityPluralKeys: { [entity in MainEntityName]: TranslationKey } = {
  concept: 'entityPlural.concept',
  dataset: 'entityPlural.dataset',
  doc: 'entityPlural.doc',
  enumeration: 'entityPlural.enumeration',
  folder: 'entityPlural.folder',
  organization: 'entityPlural.organization',
  tag: 'entityPlural.tag',
  variable: 'entityPlural.variable',
}

export function getEntityLabelKey(entity: MainEntityName): TranslationKey {
  return entityKeys[entity]
}

export function getEntityPluralLabelKey(
  entity: MainEntityName,
): TranslationKey {
  return entityPluralKeys[entity]
}
