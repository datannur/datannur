import {
  columnCleanNames,
  entityNames,
  evolutionTypes,
  mainEntityNames,
  varTypes,
} from '@lib/constant'
import { t } from './messages'

function hasOwnKey<T extends object>(
  object: T,
  key: PropertyKey,
): key is keyof T {
  return Object.hasOwn(object, key)
}

export function getMainEntityName(entity: string | undefined): string {
  if (!entity || !hasOwnKey(mainEntityNames, entity)) return ''
  return t(mainEntityNames[entity])
}

export function getEntityName(entity: string | undefined): string {
  if (!entity || !hasOwnKey(entityNames, entity)) return ''
  return t(entityNames[entity])
}

export function getVariableTypeName(type: string | undefined): string {
  if (!type || !hasOwnKey(varTypes, type)) return ''
  return t(varTypes[type])
}

export function getEvolutionTypeName(type: string | undefined): string {
  if (!type || !hasOwnKey(evolutionTypes, type)) return ''
  return t(evolutionTypes[type])
}

export function getColumnCleanName(
  column: keyof typeof columnCleanNames,
): string | string[] {
  const cleanName = columnCleanNames[column]
  if (typeof cleanName === 'string') return t(cleanName)
  return cleanName.map(key => t(key))
}
