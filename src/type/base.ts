import type { ConfigColumns } from 'datatables.net'

export type NullableNumber = number | null | undefined | false

export type BaseEntity = {
  id: string | number
  name: string
  description?: string

  // Computed fields added during processing
  _entity?: string
  _entityClean?: string
}

// General types
export type Row = Record<string, unknown>

// Core database entities (no dependencies)
export type Config = {
  id: string
  value: string
}

export type Value = {
  enumerationId: string | number
  value: string | null
  description?: string

  // Computed fields added during processing
  enumerationName?: string
}

export type Frequency = {
  variableId: string | number
  value: string
  frequency: number
}

// User data entities
export type Favorite = {
  id: string | number
  entityId: string | number
  entity: string
  timestamp: number
}

export type FilterActive = {
  id: string
  isActive: boolean
}

export type Option = {
  id: string
  value: string
}

export type SearchHistory = {
  id: string | number
  entityId: string | number
  entity: string
  timestamp: number
}

// Filter configuration exposed in the header
export type ConfigFilter = {
  id: string
  name: string
  entity: string
  field: string
  value: string | number | boolean | null
  isActiveDefault?: boolean
  isActive?: boolean
}

export type Column = ConfigColumns & {
  tooltip?: string
  filterType?: string
  hasLongText?: boolean
  dateType?: string
  fromLength?: boolean
  loadingWidth?: number
  loadingMaxWidth?: number
}
