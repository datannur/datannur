import type {
  DashboardData,
  DashboardDiagnostic,
  DashboardDiagnosticDimension,
  DashboardEntities,
  DashboardGlobalScore,
  DashboardInput,
  DashboardMetric,
  DashboardPriority,
  DashboardScore,
  DashboardScoreCriterion,
  DashboardScope,
  DashboardTarget,
  DashboardTargetGroup,
} from './dashboard-types'
import { t } from '@i18n/messages'

type MaybeValue = string | number | boolean | null | undefined

type CountableItem = {
  id: string | number
  name: string
}

type DescribableItem = CountableItem & {
  description?: string
}

type GovernedItem = CountableItem & {
  ownerOrganizationId?: string | number
  managerOrganizationId?: string | number
}

type TaggedItem = CountableItem & {
  tags?: unknown[]
}

type LinkedDocsItem = CountableItem & {
  docs?: unknown[]
  docsRecursive?: unknown[]
}

type DatasetLike = CountableItem & {
  folderId?: string | number
  dataPath?: string
  deliveryFormat?: string
  license?: string
  link?: string
  hasPreview?: boolean | number | string
  nbRow?: number
  nbVariable?: number
  nbResources?: number
  dataSize?: number
  schemaSignature?: string | null
  sampleSize?: number
  startDate?: string
  endDate?: string
  lastUpdateDate?: string | number
  updatingEach?: string
}

type VariableLike = CountableItem & {
  tags?: { id?: string | number; name?: string }[]
  tagIds?: string
  type?: string
  description?: string
  conceptId?: string | number
  enumerationIds?: string
  enumerations?: unknown[]
  nbDistinct?: number
  nbDuplicate?: number
  nbMissing?: number
  min?: number | null
  max?: number | null
  mean?: number | null
  std?: number | null
  key?: MaybeValue
  businessKey?: MaybeValue
  fkVariableId?: string | number
  sourceVariableIds?: string
  hasFreq?: boolean
  isPattern?: boolean
  ownerOrganizationId?: string | number
  managerOrganizationId?: string | number
  startDate?: string
  endDate?: string
}

const priorityTargetLimit = 6
const emptyFilterValue = `=""`

type FilterColumn = {
  column: number
  value: string
}

type TargetGroupInput<T extends CountableItem> = {
  entity: string
  label: string
  tab: string
  items: T[]
  isComplete: (item: T) => boolean
  filters: FilterColumn[]
}

function collection<T>(items: T[] | undefined): T[] {
  return items ?? []
}

function isFilled(value: MaybeValue): boolean {
  return (
    value !== null && value !== undefined && value !== false && value !== ''
  )
}

function percent(value: number, total: number): number {
  if (total === 0) return 100
  return Math.round((value / total) * 100)
}

function numericValue(value: number | string | undefined | null): number {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function sum(values: (number | string | undefined | null)[]): number {
  return values.reduce<number>((total, value) => total + numericValue(value), 0)
}

function makeMetric(
  key: string,
  label: string,
  value: number,
  total?: number,
  unit?: string,
): DashboardMetric {
  return {
    key,
    label,
    value,
    ...(total !== undefined && { total, percent: percent(value, total) }),
    ...(unit && { unit }),
  }
}

function score(
  key: string,
  label: string,
  description: string,
  criteria: DashboardScoreCriterion[],
): DashboardScore {
  const activeCriteria = criteria.filter(criterion => criterion.total > 0)
  const totalScore = activeCriteria.reduce(
    (total, criterion) => total + criterion.score,
    0,
  )
  return {
    key,
    label,
    description,
    criteria: activeCriteria,
    applicable: activeCriteria.length > 0,
    score:
      activeCriteria.length === 0
        ? 100
        : Math.round(totalScore / activeCriteria.length),
  }
}

function criterion(
  key: string,
  label: string,
  value: number,
  total: number,
  priorityLabel: string,
  priorityImpact: string,
): DashboardScoreCriterion {
  return {
    key,
    label,
    value,
    total,
    score: percent(value, total),
    priorityLabel,
    priorityImpact,
  }
}

function priority(
  key: string,
  label: string,
  dimensionKey: string,
  dimensionLabel: string,
  count: number,
  total: number,
  gainPoints: number,
  globalGainPoints: number,
  gainPerTarget: number,
  impact: string,
  targets: DashboardTarget[],
  targetGroups: DashboardTargetGroup[],
): DashboardPriority {
  return {
    key,
    label,
    dimensionKey,
    dimensionLabel,
    count,
    total,
    gainPoints,
    globalGainPoints,
    gainPerTarget,
    impact,
    targets,
    targetGroups,
  }
}

function roundGain(value: number): number {
  return Math.round(value * 10) / 10
}

function target(entity: string, item: CountableItem): DashboardTarget {
  return {
    id: item.id,
    label: item.name,
    href: `${entity}/${item.id}`,
  }
}

function missingTargets<T extends CountableItem>(
  entity: string,
  items: T[],
  isComplete: (item: T) => boolean,
): DashboardTarget[] {
  return items
    .filter(item => !isComplete(item))
    .slice(0, priorityTargetLimit)
    .map(item => target(entity, item))
}

function entityListPath(entity: string): string {
  const paths: { [entity: string]: string } = {
    organization: 'organizations',
    folder: 'folders',
    tag: 'tags',
    concept: 'concepts',
    doc: 'docs',
    dataset: 'datasets',
    variable: 'variables',
  }
  return paths[entity] ?? `${entity}s`
}

function filterHref(
  scope: DashboardScope,
  tab: string,
  entity: string,
  filters: FilterColumn[],
): string {
  void scope
  const params = new URLSearchParams({ tab })
  for (const filter of filters) {
    params.set(`tab_${entity}_${filter.column}`, filter.value)
  }
  return `${entityListPath(entity)}?${params.toString()}`
}

function targetGroup<T extends CountableItem>(
  scope: DashboardScope,
  input: TargetGroupInput<T>,
): DashboardTargetGroup | undefined {
  const count = input.items.filter(item => !input.isComplete(item)).length
  if (count === 0) return undefined
  return {
    entity: input.entity,
    label: input.label,
    count,
    href: filterHref(scope, input.tab, input.entity, input.filters),
  }
}

function compactGroups(
  groups: (DashboardTargetGroup | undefined)[],
): DashboardTargetGroup[] {
  return groups.filter(group => group !== undefined)
}

function filledCount<T>(items: T[], getValue: (item: T) => MaybeValue): number {
  return items.filter(item => isFilled(getValue(item))).length
}

function hasItemsCount<T>(
  items: T[],
  getItems: (item: T) => unknown[] | undefined,
): number {
  return items.filter(item => (getItems(item)?.length ?? 0) > 0).length
}

function describedCount(items: DescribableItem[]): number {
  return items.filter(item => isFilled(item.description)).length
}

function hasDatasetStats(dataset: DatasetLike): boolean {
  return isFilled(dataset.nbRow) || isFilled(dataset.dataSize)
}

function hasVariableStats(variable: VariableLike): boolean {
  return (
    isFilled(variable.nbMissing) ||
    isFilled(variable.nbDistinct) ||
    isFilled(variable.min) ||
    isFilled(variable.max) ||
    isFilled(variable.mean) ||
    isFilled(variable.std)
  )
}

function hasEnumerationOrFrequency(variable: VariableLike): boolean {
  return (
    isFilled(variable.enumerationIds) ||
    (variable.enumerations?.length ?? 0) > 0 ||
    !!variable.hasFreq
  )
}

function hasLineageOrRelation(variable: VariableLike): boolean {
  return isFilled(variable.fkVariableId) || isFilled(variable.sourceVariableIds)
}

function hasPeriod(item: { startDate?: string; endDate?: string }): boolean {
  return isFilled(item.startDate || item.endDate)
}

function isSeries(dataset: DatasetLike): boolean {
  return numericValue(dataset.nbResources) > 1
}

function isUniqueKey(variable: VariableLike): boolean {
  if (!isFilled(variable.key) && !isFilled(variable.businessKey)) return true
  return numericValue(variable.nbDuplicate) === 0
}

function variableTags(variable: VariableLike): string[] {
  return [
    variable.tagIds ?? '',
    ...(variable.tags ?? []).flatMap(tag => [tag.id ?? '', tag.name ?? '']),
  ]
    .join(',')
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag !== '')
}

function hasVariableTag(variable: VariableLike, prefix: string): boolean {
  return variableTags(variable).some(tag => tag.startsWith(prefix))
}

function isSensitiveVariable(variable: VariableLike): boolean {
  return variableTags(variable).some(
    tag =>
      tag.startsWith('auto---email') ||
      tag.startsWith('auto---phone') ||
      tag.startsWith('auto---iban') ||
      tag.startsWith('auto---jwt') ||
      tag.startsWith('auto---secret') ||
      tag.startsWith('auto---bcrypt') ||
      tag.startsWith('auto---argon2'),
  )
}

function isProtectedSensitiveVariable(variable: VariableLike): boolean {
  return (
    variable.isPattern || hasVariableTag(variable, 'policy---frequency-hidden')
  )
}

function buildSummary(entities: DashboardEntities): DashboardMetric[] {
  const organizations = collection(entities.organizations)
  const folders = collection(entities.folders)
  const tags = collection(entities.tags)
  const concepts = collection(entities.concepts)
  const datasets = collection(entities.datasets)
  const variables = collection(entities.variables)
  const enumerations = collection(entities.enumerations)
  const docs = collection(entities.docs)
  const dataSize = sum(
    datasets.map(
      dataset =>
        numericValue(dataset.dataSize) *
        (numericValue(dataset.nbResources) || 1),
    ),
  )
  const nbRows = sum(datasets.map(dataset => dataset.nbRow))

  return [
    makeMetric(
      'organizations',
      t('dashboard.summary.organizations'),
      organizations.length,
    ),
    makeMetric('folders', t('dashboard.summary.folders'), folders.length),
    makeMetric('tags', t('dashboard.summary.tags'), tags.length),
    makeMetric('concepts', t('dashboard.summary.concepts'), concepts.length),
    makeMetric('docs', t('dashboard.summary.docs'), docs.length),
    makeMetric('datasets', t('dashboard.summary.datasets'), datasets.length),
    makeMetric('variables', t('dashboard.summary.variables'), variables.length),
    makeMetric(
      'enumerations',
      t('dashboard.summary.enumerations'),
      enumerations.length,
    ),
    makeMetric('rows', t('dashboard.summary.rows'), nbRows),
    makeMetric(
      'dataSize',
      t('dashboard.summary.dataSize'),
      dataSize,
      undefined,
      'bytes',
    ),
  ].filter(metric => metric.value > 0)
}

const maturityOrder = [
  'inventory',
  'understanding',
  'governance',
  'protection',
  'profileQuality',
]

function buildMaturity(entities: DashboardEntities): DashboardScore[] {
  const organizations = collection(entities.organizations)
  const folders = collection(entities.folders)
  const tags = collection(entities.tags)
  const concepts = collection(entities.concepts)
  const datasets: DatasetLike[] = collection(entities.datasets)
  const variables: VariableLike[] = collection(entities.variables)
  const docs = collection(entities.docs)
  const governedItems: GovernedItem[] = [...folders, ...datasets]
  const describableItems: DescribableItem[] = [
    ...organizations,
    ...folders,
    ...datasets,
    ...variables,
    ...docs,
  ]
  const taggedItems: TaggedItem[] = [...folders, ...datasets]
  const docableItems: LinkedDocsItem[] = [
    ...organizations,
    ...folders,
    ...datasets,
    ...tags,
    ...concepts,
  ]
  const periodItems = [...folders, ...datasets]
  const seriesDatasets = datasets.filter(isSeries)
  const keyVariables = variables.filter(
    variable => isFilled(variable.key) || isFilled(variable.businessKey),
  )
  const relationalVariables = variables.filter(variable =>
    hasLineageOrRelation(variable),
  )
  const sensitiveVariables = variables.filter(isSensitiveVariable)

  return [
    score(
      'inventory',
      t('dashboard.dimension.inventory.label'),
      t('dashboard.dimension.inventory.description'),
      [
        criterion(
          'datasetFolders',
          t('dashboard.criterion.datasetFolders.label'),
          filledCount(datasets, dataset => dataset.folderId),
          datasets.length,
          t('dashboard.criterion.datasetFolders.priorityLabel'),
          t('dashboard.criterion.datasetFolders.priorityImpact'),
        ),
        criterion(
          'access',
          t('dashboard.criterion.access.label'),
          datasets.filter(
            dataset => isFilled(dataset.link) || isFilled(dataset.dataPath),
          ).length,
          datasets.length,
          t('dashboard.criterion.access.priorityLabel'),
          t('dashboard.criterion.access.priorityImpact'),
        ),
        criterion(
          'formats',
          t('dashboard.criterion.formats.label'),
          filledCount(datasets, dataset => dataset.deliveryFormat),
          datasets.length,
          t('dashboard.criterion.formats.priorityLabel'),
          t('dashboard.criterion.formats.priorityImpact'),
        ),
        criterion(
          'previews',
          t('dashboard.criterion.previews.label'),
          datasets.filter(dataset => !!dataset.hasPreview).length,
          datasets.length,
          t('dashboard.criterion.previews.priorityLabel'),
          t('dashboard.criterion.previews.priorityImpact'),
        ),
      ],
    ),
    score(
      'understanding',
      t('dashboard.dimension.understanding.label'),
      t('dashboard.dimension.understanding.description'),
      [
        criterion(
          'descriptions',
          t('dashboard.criterion.descriptions.label'),
          describedCount(describableItems),
          describableItems.length,
          t('dashboard.criterion.descriptions.priorityLabel'),
          t('dashboard.criterion.descriptions.priorityImpact'),
        ),
        criterion(
          'tags',
          t('dashboard.criterion.tags.label'),
          hasItemsCount(taggedItems, item => item.tags),
          taggedItems.length,
          t('dashboard.criterion.tags.priorityLabel'),
          t('dashboard.criterion.tags.priorityImpact'),
        ),
        criterion(
          'linkedDocs',
          t('dashboard.criterion.linkedDocs.label'),
          hasItemsCount(docableItems, item => item.docsRecursive ?? item.docs),
          docableItems.length,
          t('dashboard.criterion.linkedDocs.priorityLabel'),
          t('dashboard.criterion.linkedDocs.priorityImpact'),
        ),
        criterion(
          'variableDescriptions',
          t('dashboard.criterion.variableDescriptions.label'),
          describedCount(variables),
          variables.length,
          t('dashboard.criterion.variableDescriptions.priorityLabel'),
          t('dashboard.criterion.variableDescriptions.priorityImpact'),
        ),
        criterion(
          'variableConcepts',
          t('dashboard.criterion.variableConcepts.label'),
          filledCount(variables, variable => variable.conceptId),
          variables.length,
          t('dashboard.criterion.variableConcepts.priorityLabel'),
          t('dashboard.criterion.variableConcepts.priorityImpact'),
        ),
        criterion(
          'lineageRelations',
          t('dashboard.criterion.lineageRelations.label'),
          relationalVariables.length,
          variables.length,
          t('dashboard.criterion.lineageRelations.priorityLabel'),
          t('dashboard.criterion.lineageRelations.priorityImpact'),
        ),
      ],
    ),
    score(
      'profileQuality',
      t('dashboard.dimension.profileQuality.label'),
      t('dashboard.dimension.profileQuality.description'),
      [
        criterion(
          'licenses',
          t('dashboard.criterion.licenses.label'),
          filledCount(datasets, dataset => dataset.license),
          datasets.length,
          t('dashboard.criterion.licenses.priorityLabel'),
          t('dashboard.criterion.licenses.priorityImpact'),
        ),
        criterion(
          'schemaExtracted',
          t('dashboard.criterion.schemaExtracted.label'),
          datasets.filter(dataset => numericValue(dataset.nbVariable) > 0)
            .length,
          datasets.length,
          t('dashboard.criterion.schemaExtracted.priorityLabel'),
          t('dashboard.criterion.schemaExtracted.priorityImpact'),
        ),
        criterion(
          'variableTypes',
          t('dashboard.criterion.variableTypes.label'),
          filledCount(variables, variable => variable.type),
          variables.length,
          t('dashboard.criterion.variableTypes.priorityLabel'),
          t('dashboard.criterion.variableTypes.priorityImpact'),
        ),
        criterion(
          'datasetStats',
          t('dashboard.criterion.datasetStats.label'),
          datasets.filter(hasDatasetStats).length,
          datasets.length,
          t('dashboard.criterion.datasetStats.priorityLabel'),
          t('dashboard.criterion.datasetStats.priorityImpact'),
        ),
        criterion(
          'variableStats',
          t('dashboard.criterion.variableStats.label'),
          variables.filter(hasVariableStats).length,
          variables.length,
          t('dashboard.criterion.variableStats.priorityLabel'),
          t('dashboard.criterion.variableStats.priorityImpact'),
        ),
        criterion(
          'enumerationsOrFrequencies',
          t('dashboard.criterion.enumerationsOrFrequencies.label'),
          variables.filter(hasEnumerationOrFrequency).length,
          variables.length,
          t('dashboard.criterion.enumerationsOrFrequencies.priorityLabel'),
          t('dashboard.criterion.enumerationsOrFrequencies.priorityImpact'),
        ),
      ],
    ),
    score(
      'governance',
      t('dashboard.dimension.governance.label'),
      t('dashboard.dimension.governance.description'),
      [
        criterion(
          'owners',
          t('dashboard.criterion.owners.label'),
          filledCount(governedItems, item => item.ownerOrganizationId),
          governedItems.length,
          t('dashboard.criterion.owners.priorityLabel'),
          t('dashboard.criterion.owners.priorityImpact'),
        ),
        criterion(
          'managers',
          t('dashboard.criterion.managers.label'),
          filledCount(governedItems, item => item.managerOrganizationId),
          governedItems.length,
          t('dashboard.criterion.managers.priorityLabel'),
          t('dashboard.criterion.managers.priorityImpact'),
        ),
        criterion(
          'organizationContacts',
          t('dashboard.criterion.organizationContacts.label'),
          organizations.filter(
            organization =>
              isFilled(organization.email) || isFilled(organization.phone),
          ).length,
          organizations.length,
          t('dashboard.criterion.organizationContacts.priorityLabel'),
          t('dashboard.criterion.organizationContacts.priorityImpact'),
        ),
      ],
    ),
    score(
      'protection',
      t('dashboard.dimension.protection.label'),
      t('dashboard.dimension.protection.description'),
      [
        criterion(
          'lastUpdateDate',
          t('dashboard.criterion.lastUpdateDate.label'),
          filledCount(periodItems, item => item.lastUpdateDate),
          periodItems.length,
          t('dashboard.criterion.lastUpdateDate.priorityLabel'),
          t('dashboard.criterion.lastUpdateDate.priorityImpact'),
        ),
        criterion(
          'updateFrequency',
          t('dashboard.criterion.updateFrequency.label'),
          filledCount(periodItems, item => item.updatingEach),
          periodItems.length,
          t('dashboard.criterion.updateFrequency.priorityLabel'),
          t('dashboard.criterion.updateFrequency.priorityImpact'),
        ),
        criterion(
          'periods',
          t('dashboard.criterion.periods.label'),
          periodItems.filter(hasPeriod).length,
          periodItems.length,
          t('dashboard.criterion.periods.priorityLabel'),
          t('dashboard.criterion.periods.priorityImpact'),
        ),
        criterion(
          'seriesPeriods',
          t('dashboard.criterion.seriesPeriods.label'),
          seriesDatasets.filter(hasPeriod).length,
          seriesDatasets.length,
          t('dashboard.criterion.seriesPeriods.priorityLabel'),
          t('dashboard.criterion.seriesPeriods.priorityImpact'),
        ),
        criterion(
          'keyUniqueness',
          t('dashboard.criterion.keyUniqueness.label'),
          keyVariables.filter(isUniqueKey).length,
          keyVariables.length,
          t('dashboard.criterion.keyUniqueness.priorityLabel'),
          t('dashboard.criterion.keyUniqueness.priorityImpact'),
        ),
        ...(sensitiveVariables.length === 0
          ? [
              criterion(
                'noSensitiveSignals',
                t('dashboard.criterion.noSensitiveSignals.label'),
                1,
                1,
                t('dashboard.criterion.noSensitiveSignals.priorityLabel'),
                t('dashboard.criterion.noSensitiveSignals.priorityImpact'),
              ),
            ]
          : []),
        criterion(
          'sensitiveIdentified',
          t('dashboard.criterion.sensitiveIdentified.label'),
          sensitiveVariables.length,
          sensitiveVariables.length,
          t('dashboard.criterion.sensitiveIdentified.priorityLabel'),
          t('dashboard.criterion.sensitiveIdentified.priorityImpact'),
        ),
        criterion(
          'sensitiveProtection',
          t('dashboard.criterion.sensitiveProtection.label'),
          sensitiveVariables.filter(isProtectedSensitiveVariable).length,
          sensitiveVariables.length,
          t('dashboard.criterion.sensitiveProtection.priorityLabel'),
          t('dashboard.criterion.sensitiveProtection.priorityImpact'),
        ),
        criterion(
          'sensitiveDocumentation',
          t('dashboard.criterion.sensitiveDocumentation.label'),
          describedCount(sensitiveVariables),
          sensitiveVariables.length,
          t('dashboard.criterion.sensitiveDocumentation.priorityLabel'),
          t('dashboard.criterion.sensitiveDocumentation.priorityImpact'),
        ),
        criterion(
          'sensitiveGovernance',
          t('dashboard.criterion.sensitiveGovernance.label'),
          sensitiveVariables.filter(
            variable =>
              isFilled(variable.ownerOrganizationId) ||
              isFilled(variable.managerOrganizationId),
          ).length,
          sensitiveVariables.length,
          t('dashboard.criterion.sensitiveGovernance.priorityLabel'),
          t('dashboard.criterion.sensitiveGovernance.priorityImpact'),
        ),
      ],
    ),
  ].sort((a, b) => maturityOrder.indexOf(a.key) - maturityOrder.indexOf(b.key))
}

function buildGlobalScore(maturity: DashboardScore[]): DashboardGlobalScore {
  const applicableMaturity = maturity.filter(item => item.applicable)
  const scoreValue =
    applicableMaturity.length === 0
      ? 100
      : Math.round(
          applicableMaturity.reduce((total, item) => total + item.score, 0) /
            applicableMaturity.length,
        )
  return { label: t('dashboard.globalScore.label'), score: scoreValue }
}

function diagnosticLabel(scoreValue: number): string {
  if (scoreValue < 40) return t('dashboard.diagnostic.structuring.label')
  if (scoreValue < 70) return t('dashboard.diagnostic.consolidating.label')
  if (scoreValue < 90) return t('dashboard.diagnostic.operational.label')
  return t('dashboard.diagnostic.mastered.label')
}

function diagnosticDescription(scoreValue: number): string {
  if (scoreValue < 40) {
    return t('dashboard.diagnostic.structuring.description')
  }
  if (scoreValue < 70) {
    return t('dashboard.diagnostic.consolidating.description')
  }
  if (scoreValue < 90) {
    return t('dashboard.diagnostic.operational.description')
  }
  return t('dashboard.diagnostic.mastered.description')
}

function diagnosticDimension(
  dimension: DashboardScore,
): DashboardDiagnosticDimension {
  return {
    key: dimension.key,
    label: dimension.label,
    score: dimension.score,
  }
}

function buildDiagnostic(
  globalScore: DashboardGlobalScore,
  maturity: DashboardScore[],
): DashboardDiagnostic {
  const applicableMaturity = maturity.filter(item => item.applicable)
  const byStrength = [...applicableMaturity].sort(
    (a, b) => b.score - a.score || a.label.localeCompare(b.label),
  )
  const byWatchpoint = [...applicableMaturity].sort(
    (a, b) => a.score - b.score || a.label.localeCompare(b.label),
  )
  const watchpoints = byWatchpoint
    .filter(
      item =>
        !byStrength.slice(0, 2).some(strength => strength.key === item.key),
    )
    .slice(0, 2)

  return {
    label: diagnosticLabel(globalScore.score),
    description: diagnosticDescription(globalScore.score),
    strengths: byStrength.slice(0, 2).map(diagnosticDimension),
    watchpoints: watchpoints.map(diagnosticDimension),
  }
}

function buildPriorityTargets(entities: DashboardEntities): {
  [key: string]: DashboardTarget[]
} {
  const organizations = collection(entities.organizations)
  const folders = collection(entities.folders)
  const datasets = collection(entities.datasets)
  const variables = collection(entities.variables)
  const docs = collection(entities.docs)

  return {
    descriptions: [
      ...missingTargets('organization', organizations, item =>
        isFilled(item.description),
      ),
      ...missingTargets('folder', folders, item => isFilled(item.description)),
      ...missingTargets('dataset', datasets, item =>
        isFilled(item.description),
      ),
      ...missingTargets('variable', variables, item =>
        isFilled(item.description),
      ),
      ...missingTargets('doc', docs, item => isFilled(item.description)),
    ].slice(0, priorityTargetLimit),
    tags: [
      ...missingTargets(
        'folder',
        folders,
        item => (item.tags?.length ?? 0) > 0,
      ),
      ...missingTargets(
        'dataset',
        datasets,
        item => (item.tags?.length ?? 0) > 0,
      ),
    ].slice(0, priorityTargetLimit),
    datasetFolders: missingTargets('dataset', datasets, item =>
      isFilled(item.folderId),
    ),
    owners: [
      ...missingTargets('folder', folders, item =>
        isFilled(item.ownerOrganizationId),
      ),
      ...missingTargets('dataset', datasets, item =>
        isFilled(item.ownerOrganizationId),
      ),
    ].slice(0, priorityTargetLimit),
    managers: [
      ...missingTargets('folder', folders, item =>
        isFilled(item.managerOrganizationId),
      ),
      ...missingTargets('dataset', datasets, item =>
        isFilled(item.managerOrganizationId),
      ),
    ].slice(0, priorityTargetLimit),
    organizationContacts: missingTargets(
      'organization',
      organizations,
      item => isFilled(item.email) || isFilled(item.phone),
    ),
    access: missingTargets(
      'dataset',
      datasets,
      item => isFilled(item.link) || isFilled(item.dataPath),
    ),
    formats: missingTargets('dataset', datasets, item =>
      isFilled(item.deliveryFormat),
    ),
    datasetStats: missingTargets('dataset', datasets, hasDatasetStats),
    schemaExtracted: missingTargets(
      'dataset',
      datasets,
      item => numericValue(item.nbVariable) > 0,
    ),
    lastUpdateDate: [
      ...missingTargets('folder', folders, item =>
        isFilled(item.lastUpdateDate),
      ),
      ...missingTargets('dataset', datasets, item =>
        isFilled(item.lastUpdateDate),
      ),
    ].slice(0, priorityTargetLimit),
    updateFrequency: [
      ...missingTargets('folder', folders, item => isFilled(item.updatingEach)),
      ...missingTargets('dataset', datasets, item =>
        isFilled(item.updatingEach),
      ),
    ].slice(0, priorityTargetLimit),
    periods: [
      ...missingTargets('folder', folders, item =>
        isFilled(item.startDate || item.endDate),
      ),
      ...missingTargets('dataset', datasets, item =>
        isFilled(item.startDate || item.endDate),
      ),
    ].slice(0, priorityTargetLimit),
    variableTypes: missingTargets('variable', variables, item =>
      isFilled(item.type),
    ),
    variableDescriptions: missingTargets('variable', variables, item =>
      isFilled(item.description),
    ),
    variableConcepts: missingTargets('variable', variables, item =>
      isFilled(item.conceptId),
    ),
    variableStats: missingTargets('variable', variables, hasVariableStats),
    variablesProfiled: missingTargets('variable', variables, hasVariableStats),
    keyUniqueness: missingTargets(
      'variable',
      variables.filter(
        variable => isFilled(variable.key) || isFilled(variable.businessKey),
      ),
      isUniqueKey,
    ),
    enumerationsOrFrequencies: missingTargets(
      'variable',
      variables,
      hasEnumerationOrFrequency,
    ),
    lineageRelations: missingTargets(
      'variable',
      variables,
      hasLineageOrRelation,
    ),
    licenses: missingTargets('dataset', datasets, item =>
      isFilled(item.license),
    ),
    seriesPeriods: missingTargets(
      'dataset',
      datasets.filter(isSeries),
      hasPeriod,
    ),
    publishableDatasets: missingTargets(
      'dataset',
      datasets,
      item =>
        isFilled(item.license) &&
        (isFilled(item.link) || isFilled(item.dataPath)) &&
        !!item.hasPreview,
    ),
    documentedConcepts: missingTargets(
      'concept',
      collection(entities.concepts),
      item => isFilled(item.description),
    ),
    documentedTags: missingTargets('tag', collection(entities.tags), item =>
      isFilled(item.description),
    ),
    sensitiveProtection: missingTargets(
      'variable',
      variables.filter(isSensitiveVariable),
      isProtectedSensitiveVariable,
    ),
    sensitiveDocumentation: missingTargets(
      'variable',
      variables.filter(isSensitiveVariable),
      item => isFilled(item.description),
    ),
    sensitiveGovernance: missingTargets(
      'variable',
      variables.filter(isSensitiveVariable),
      item =>
        isFilled(item.ownerOrganizationId) ||
        isFilled(item.managerOrganizationId),
    ),
    previews: missingTargets('dataset', datasets, item => !!item.hasPreview),
    linkedDocs: [
      ...missingTargets(
        'organization',
        organizations,
        item => ((item.docsRecursive ?? item.docs)?.length ?? 0) > 0,
      ),
      ...missingTargets(
        'folder',
        folders,
        item => ((item.docsRecursive ?? item.docs)?.length ?? 0) > 0,
      ),
      ...missingTargets(
        'dataset',
        datasets,
        item => ((item.docsRecursive ?? item.docs)?.length ?? 0) > 0,
      ),
      ...missingTargets(
        'tag',
        collection(entities.tags),
        item => ((item.docsRecursive ?? item.docs)?.length ?? 0) > 0,
      ),
      ...missingTargets(
        'concept',
        collection(entities.concepts),
        item => ((item.docsRecursive ?? item.docs)?.length ?? 0) > 0,
      ),
    ].slice(0, priorityTargetLimit),
  }
}

function buildPriorityTargetGroups(
  scope: DashboardScope,
  entities: DashboardEntities,
): {
  [key: string]: DashboardTargetGroup[]
} {
  const organizations = collection(entities.organizations)
  const folders = collection(entities.folders)
  const datasets = collection(entities.datasets)
  const variables = collection(entities.variables)
  const docs = collection(entities.docs)
  const tags = collection(entities.tags)
  const concepts = collection(entities.concepts)

  return {
    descriptions: compactGroups([
      targetGroup(scope, {
        entity: 'organization',
        label: t('dashboard.summary.organizations'),
        tab: 'organizations',
        items: organizations,
        isComplete: item => isFilled(item.description),
        filters: [{ column: 2, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'folder',
        label: t('dashboard.summary.folders'),
        tab: 'folders',
        items: folders,
        isComplete: item => isFilled(item.description),
        filters: [{ column: 2, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => isFilled(item.description),
        filters: [{ column: 2, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'variable',
        label: t('dashboard.summary.variables'),
        tab: 'variables',
        items: variables,
        isComplete: item => isFilled(item.description),
        filters: [{ column: 3, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'doc',
        label: t('dashboard.summary.docs'),
        tab: 'docs',
        items: docs,
        isComplete: item => isFilled(item.description),
        filters: [{ column: 2, value: emptyFilterValue }],
      }),
    ]),
    tags: compactGroups([
      targetGroup(scope, {
        entity: 'folder',
        label: t('dashboard.summary.folders'),
        tab: 'folders',
        items: folders,
        isComplete: item => (item.tags?.length ?? 0) > 0,
        filters: [{ column: 9, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => (item.tags?.length ?? 0) > 0,
        filters: [{ column: 15, value: emptyFilterValue }],
      }),
    ]),
    datasetFolders: compactGroups([
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => isFilled(item.folderId),
        filters: [{ column: 14, value: emptyFilterValue }],
      }),
    ]),
    owners: compactGroups([
      targetGroup(scope, {
        entity: 'folder',
        label: t('dashboard.summary.folders'),
        tab: 'folders',
        items: folders,
        isComplete: item => isFilled(item.ownerOrganizationId),
        filters: [{ column: 16, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => isFilled(item.ownerOrganizationId),
        filters: [{ column: 21, value: emptyFilterValue }],
      }),
    ]),
    managers: compactGroups([
      targetGroup(scope, {
        entity: 'folder',
        label: t('dashboard.summary.folders'),
        tab: 'folders',
        items: folders,
        isComplete: item => isFilled(item.managerOrganizationId),
        filters: [{ column: 17, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => isFilled(item.managerOrganizationId),
        filters: [{ column: 22, value: emptyFilterValue }],
      }),
    ]),
    organizationContacts: compactGroups([
      targetGroup(scope, {
        entity: 'organization',
        label: t('dashboard.summary.organizations'),
        tab: 'organizations',
        items: organizations,
        isComplete: item => isFilled(item.email) || isFilled(item.phone),
        filters: [
          { column: 11, value: emptyFilterValue },
          { column: 12, value: emptyFilterValue },
        ],
      }),
    ]),
    access: compactGroups([
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => isFilled(item.link) || isFilled(item.dataPath),
        filters: [{ column: 26, value: emptyFilterValue }],
      }),
    ]),
    formats: compactGroups([
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => isFilled(item.deliveryFormat),
        filters: [{ column: 24, value: emptyFilterValue }],
      }),
    ]),
    volume: compactGroups([
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => isFilled(item.nbRow) || isFilled(item.dataSize),
        filters: [
          { column: 10, value: emptyFilterValue },
          { column: 12, value: emptyFilterValue },
        ],
      }),
    ]),
    datasetStats: compactGroups([
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: hasDatasetStats,
        filters: [
          { column: 10, value: emptyFilterValue },
          { column: 12, value: emptyFilterValue },
        ],
      }),
    ]),
    schemaExtracted: compactGroups([
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => numericValue(item.nbVariable) > 0,
        filters: [{ column: 8, value: emptyFilterValue }],
      }),
    ]),
    lastUpdateDate: compactGroups([
      targetGroup(scope, {
        entity: 'folder',
        label: t('dashboard.summary.folders'),
        tab: 'folders',
        items: folders,
        isComplete: item => isFilled(item.lastUpdateDate),
        filters: [{ column: 10, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => isFilled(item.lastUpdateDate),
        filters: [{ column: 16, value: emptyFilterValue }],
      }),
    ]),
    updateFrequency: compactGroups([
      targetGroup(scope, {
        entity: 'folder',
        label: t('dashboard.summary.folders'),
        tab: 'folders',
        items: folders,
        isComplete: item => isFilled(item.updatingEach),
        filters: [{ column: 12, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => isFilled(item.updatingEach),
        filters: [{ column: 18, value: emptyFilterValue }],
      }),
    ]),
    periods: compactGroups([
      targetGroup(scope, {
        entity: 'folder',
        label: t('dashboard.summary.folders'),
        tab: 'folders',
        items: folders,
        isComplete: item => isFilled(item.startDate || item.endDate),
        filters: [
          { column: 13, value: emptyFilterValue },
          { column: 14, value: emptyFilterValue },
        ],
      }),
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => isFilled(item.startDate || item.endDate),
        filters: [
          { column: 19, value: emptyFilterValue },
          { column: 20, value: emptyFilterValue },
        ],
      }),
    ]),
    variableTypes: compactGroups([
      targetGroup(scope, {
        entity: 'variable',
        label: t('dashboard.summary.variables'),
        tab: 'variables',
        items: variables,
        isComplete: item => isFilled(item.type),
        filters: [{ column: 5, value: emptyFilterValue }],
      }),
    ]),
    variableDescriptions: compactGroups([
      targetGroup(scope, {
        entity: 'variable',
        label: t('dashboard.summary.variables'),
        tab: 'variables',
        items: variables,
        isComplete: item => isFilled(item.description),
        filters: [{ column: 3, value: emptyFilterValue }],
      }),
    ]),
    variableConcepts: compactGroups([
      targetGroup(scope, {
        entity: 'variable',
        label: t('dashboard.summary.variables'),
        tab: 'variables',
        items: variables,
        isComplete: item => isFilled(item.conceptId),
        filters: [{ column: 4, value: emptyFilterValue }],
      }),
    ]),
    variableStats: compactGroups([
      targetGroup(scope, {
        entity: 'variable',
        label: t('dashboard.summary.variables'),
        tab: 'variables',
        items: variables,
        isComplete: hasVariableStats,
        filters: [
          { column: 16, value: emptyFilterValue },
          { column: 17, value: emptyFilterValue },
        ],
      }),
    ]),
    variablesProfiled: compactGroups([
      targetGroup(scope, {
        entity: 'variable',
        label: t('dashboard.summary.variables'),
        tab: 'variables',
        items: variables,
        isComplete: hasVariableStats,
        filters: [
          { column: 16, value: emptyFilterValue },
          { column: 17, value: emptyFilterValue },
        ],
      }),
    ]),
    keyUniqueness: compactGroups([
      targetGroup(scope, {
        entity: 'variable',
        label: t('dashboard.summary.variables'),
        tab: 'variables',
        items: variables.filter(
          variable => isFilled(variable.key) || isFilled(variable.businessKey),
        ),
        isComplete: isUniqueKey,
        filters: [{ column: 16, value: '>0' }],
      }),
    ]),
    enumerationsOrFrequencies: compactGroups([
      targetGroup(scope, {
        entity: 'variable',
        label: t('dashboard.summary.variables'),
        tab: 'variables',
        items: variables,
        isComplete: hasEnumerationOrFrequency,
        filters: [{ column: 19, value: emptyFilterValue }],
      }),
    ]),
    lineageRelations: compactGroups([
      targetGroup(scope, {
        entity: 'variable',
        label: t('dashboard.summary.variables'),
        tab: 'variables',
        items: variables,
        isComplete: hasLineageOrRelation,
        filters: [
          { column: 8, value: emptyFilterValue },
          { column: 10, value: emptyFilterValue },
        ],
      }),
    ]),
    licenses: compactGroups([
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item => isFilled(item.license),
        filters: [{ column: 25, value: emptyFilterValue }],
      }),
    ]),
    seriesPeriods: compactGroups([
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets.filter(isSeries),
        isComplete: hasPeriod,
        filters: [
          { column: 19, value: emptyFilterValue },
          { column: 20, value: emptyFilterValue },
        ],
      }),
    ]),
    publishableDatasets: compactGroups([
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item =>
          isFilled(item.license) &&
          (isFilled(item.link) || isFilled(item.dataPath)) &&
          !!item.hasPreview,
        filters: [{ column: 25, value: emptyFilterValue }],
      }),
    ]),
    documentedConcepts: compactGroups([
      targetGroup(scope, {
        entity: 'concept',
        label: t('dashboard.summary.concepts'),
        tab: 'concepts',
        items: concepts,
        isComplete: item => isFilled(item.description),
        filters: [{ column: 2, value: emptyFilterValue }],
      }),
    ]),
    documentedTags: compactGroups([
      targetGroup(scope, {
        entity: 'tag',
        label: t('dashboard.criterion.tags.label'),
        tab: 'tags',
        items: tags,
        isComplete: item => isFilled(item.description),
        filters: [{ column: 2, value: emptyFilterValue }],
      }),
    ]),
    linkedDocs: compactGroups([
      targetGroup(scope, {
        entity: 'organization',
        label: t('dashboard.summary.organizations'),
        tab: 'organizations',
        items: organizations,
        isComplete: item =>
          ((item.docsRecursive ?? item.docs)?.length ?? 0) > 0,
        filters: [{ column: 8, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'folder',
        label: t('dashboard.summary.folders'),
        tab: 'folders',
        items: folders,
        isComplete: item =>
          ((item.docsRecursive ?? item.docs)?.length ?? 0) > 0,
        filters: [{ column: 8, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'dataset',
        label: t('dashboard.summary.datasets'),
        tab: 'datasets',
        items: datasets,
        isComplete: item =>
          ((item.docsRecursive ?? item.docs)?.length ?? 0) > 0,
        filters: [{ column: 13, value: emptyFilterValue }],
      }),
      targetGroup(scope, {
        entity: 'tag',
        label: t('dashboard.criterion.tags.label'),
        tab: 'tags',
        items: tags,
        isComplete: item =>
          ((item.docsRecursive ?? item.docs)?.length ?? 0) > 0,
        filters: [],
      }),
      targetGroup(scope, {
        entity: 'concept',
        label: t('dashboard.summary.concepts'),
        tab: 'concepts',
        items: concepts,
        isComplete: item =>
          ((item.docsRecursive ?? item.docs)?.length ?? 0) > 0,
        filters: [],
      }),
    ]),
  }
}

function buildPriorities(
  maturity: DashboardScore[],
  scope: DashboardScope,
  entities: DashboardEntities,
): DashboardPriority[] {
  const targetsByKey = buildPriorityTargets(entities)
  const targetGroupsByKey = buildPriorityTargetGroups(scope, entities)
  const dimensionCount = maturity.length || 1
  return maturity
    .flatMap(dimension =>
      dimension.criteria.map(criterion => {
        const missingCount = criterion.total - criterion.value
        const criterionWeight = 100 / dimension.criteria.length
        const gainPoints = roundGain(
          ((100 - criterion.score) / 100) * criterionWeight,
        )
        const globalGainPoints = roundGain(gainPoints / dimensionCount)
        const gainPerTarget =
          missingCount === 0 ? 0 : roundGain(gainPoints / missingCount)

        return priority(
          criterion.key,
          criterion.priorityLabel,
          dimension.key,
          dimension.label,
          missingCount,
          criterion.total,
          gainPoints,
          globalGainPoints,
          gainPerTarget,
          criterion.priorityImpact,
          targetsByKey[criterion.key] ?? [],
          targetGroupsByKey[criterion.key] ?? [],
        )
      }),
    )
    .filter(item => item.total > 0 && item.count > 0)
    .sort(
      (a, b) =>
        b.gainPoints - a.gainPoints ||
        b.count / b.total - a.count / a.total ||
        b.count - a.count ||
        a.label.localeCompare(b.label),
    )
}

export function buildDashboard(input: DashboardInput): DashboardData {
  const maturity = buildMaturity(input.entities)
  const globalScore = buildGlobalScore(maturity)
  return {
    scope: input.scope,
    summary: buildSummary(input.entities),
    globalScore,
    diagnostic: buildDiagnostic(globalScore, maturity),
    maturity,
    priorities: buildPriorities(maturity, input.scope, input.entities),
  }
}
