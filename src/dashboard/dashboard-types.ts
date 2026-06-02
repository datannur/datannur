import type {
  Concept,
  Dataset,
  Doc,
  Enumeration,
  Folder,
  Organization,
  Tag,
  Variable,
} from '@type'

export type DashboardScopeType =
  | 'catalog'
  | 'organization'
  | 'folder'
  | 'dataset'
  | 'tag'
  | 'concept'

export type DashboardScope = {
  type: DashboardScopeType
  id?: string | number
  label: string
}

export type DashboardEntities = {
  organizations?: Organization[]
  folders?: Folder[]
  datasets?: Dataset[]
  variables?: Variable[]
  docs?: Doc[]
  tags?: Tag[]
  concepts?: Concept[]
  enumerations?: Enumeration[]
}

export type DashboardInput = {
  scope: DashboardScope
  entities: DashboardEntities
}

export type DashboardMetric = {
  key: string
  label: string
  value: number
  total?: number
  unit?: string
  percent?: number
}

export type DashboardScore = {
  key: string
  label: string
  score: number
  description: string
  criteria: DashboardScoreCriterion[]
  applicable: boolean
}

export type DashboardScoreCriterion = {
  key: string
  label: string
  value: number
  total: number
  score: number
  priorityLabel: string
  priorityImpact: string
}

export type DashboardGlobalScore = {
  label: string
  score: number
}

export type DashboardDiagnostic = {
  label: string
  description: string
  strengths: DashboardDiagnosticDimension[]
  watchpoints: DashboardDiagnosticDimension[]
}

export type DashboardDiagnosticDimension = {
  key: string
  label: string
  score: number
}

export type DashboardPriority = {
  key: string
  label: string
  dimensionKey: string
  dimensionLabel: string
  count: number
  total: number
  gainPoints: number
  globalGainPoints: number
  gainPerTarget: number
  impact: string
  targets: DashboardTarget[]
  targetGroups: DashboardTargetGroup[]
}

export type DashboardTarget = {
  id: string | number
  label: string
  href: string
}

export type DashboardTargetGroup = {
  entity: string
  label: string
  count: number
  href: string
}

export type DashboardData = {
  scope: DashboardScope
  summary: DashboardMetric[]
  globalScore: DashboardGlobalScore
  diagnostic: DashboardDiagnostic
  maturity: DashboardScore[]
  priorities: DashboardPriority[]
}
