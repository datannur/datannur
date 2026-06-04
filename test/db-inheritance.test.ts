import { beforeEach, describe, expect, it, vi } from 'vitest'

type EntityName =
  | 'organization'
  | 'folder'
  | 'dataset'
  | 'tag'
  | 'doc'
  | 'configFilter'
  | 'concept'
  | 'variable'
  | 'enumeration'
  | 'metaVariable'
  | 'metaDataset'
  | 'metaFolder'

type Row = {
  id: string | number
  name?: string
  folderId?: string | number
  ownerOrganizationId?: string | number
  managerOrganizationId?: string | number
  updatingEach?: string
  license?: string
  nbDatasetRecursive?: number
  nbVariableRecursive?: number
  dataSizeRecursive?: number
}

type Tables = { [entity in EntityName]: Row[] }

type RelationIndexes = {
  ownerOrganization: Map<string, Set<string | number>>
  managerOrganization: Map<string, Set<string | number>>
}

function emptyTables(): Tables {
  return {
    organization: [],
    folder: [],
    dataset: [],
    tag: [],
    doc: [],
    configFilter: [],
    concept: [],
    variable: [],
    enumeration: [],
    metaVariable: [],
    metaDataset: [],
    metaFolder: [],
  }
}

function addIndex(
  index: Map<string, Set<string | number>>,
  organizationId: string | number,
  datasetId: string | number,
) {
  const key = String(organizationId)
  const ids = index.get(key) ?? new Set<string | number>()
  ids.add(datasetId)
  index.set(key, ids)
}

const mockDb = vi.hoisted(() => {
  const relationIndexes: RelationIndexes = {
    ownerOrganization: new Map(),
    managerOrganization: new Map(),
  }

  const db = {
    tables: emptyTables(),
    use: {
      organization: true,
      folder: true,
      doc: false,
    },
    useRecursive: {},
    reset(tables: Partial<Tables>) {
      this.tables = { ...emptyTables(), ...tables }
      relationIndexes.ownerOrganization.clear()
      relationIndexes.managerOrganization.clear()
      for (const dataset of this.tables.dataset) {
        if (dataset.ownerOrganizationId) {
          addIndex(
            relationIndexes.ownerOrganization,
            dataset.ownerOrganizationId,
            dataset.id,
          )
        }
        if (dataset.managerOrganizationId) {
          addIndex(
            relationIndexes.managerOrganization,
            dataset.managerOrganizationId,
            dataset.id,
          )
        }
      }
    },
    foreach(entity: EntityName, callback: (row: Row) => void) {
      for (const row of this.tables[entity] ?? []) callback(row)
    },
    get(entity: EntityName, id: string | number) {
      return this.tables[entity]?.find(row => String(row.id) === String(id))
    },
    getAll(entity: EntityName, foreignTableObj?: { [key: string]: unknown }) {
      const rows = this.tables[entity] ?? []
      if (!foreignTableObj) return rows
      const [relation, value] = Object.entries(foreignTableObj)[0] ?? []
      if (relation === undefined || value === undefined) return rows
      const id =
        typeof value === 'object' && value !== null && 'id' in value
          ? value.id
          : value
      if (typeof id !== 'string' && typeof id !== 'number') return []

      if (entity === 'dataset' && relation === 'ownerOrganization') {
        const ids =
          relationIndexes.ownerOrganization.get(String(id)) ?? new Set()
        return rows.filter(row => ids.has(row.id))
      }
      if (entity === 'dataset' && relation === 'managerOrganization') {
        const ids =
          relationIndexes.managerOrganization.get(String(id)) ?? new Set()
        return rows.filter(row => ids.has(row.id))
      }
      if (relation === 'folder') {
        return rows.filter(row => String(row.folderId) === String(id))
      }
      if (relation === 'ownerOrganization') {
        return rows.filter(
          row => String(row.ownerOrganizationId) === String(id),
        )
      }
      if (relation === 'managerOrganization') {
        return rows.filter(
          row => String(row.managerOrganizationId) === String(id),
        )
      }
      if (relation.endsWith('Id')) {
        return rows.filter(
          row => String(row[relation as keyof Row]) === String(id),
        )
      }
      return []
    },
    addForeignKey(
      entity: EntityName,
      id: string | number,
      relationField: string,
      relatedId: string | number,
    ) {
      const row = this.get(entity, id)
      if (!row) throw new Error(`Unknown ${entity}: ${String(id)}`)
      if (relationField === 'ownerOrganizationId') {
        if (row.ownerOrganizationId) throw new Error('Foreign key exists')
        row.ownerOrganizationId = relatedId
        addIndex(relationIndexes.ownerOrganization, relatedId, id)
      }
      if (relationField === 'managerOrganizationId') {
        if (row.managerOrganizationId) throw new Error('Foreign key exists')
        row.managerOrganizationId = relatedId
        addIndex(relationIndexes.managerOrganization, relatedId, id)
      }
      return true
    },
    countRelated() {
      return 0
    },
    getAllChilds() {
      return []
    },
    getParents() {
      return []
    },
  }

  return db
})

vi.mock('@db', () => ({ default: mockDb }))

describe('dbAddProcessedData dataset inheritance', () => {
  beforeEach(() => {
    mockDb.reset({
      organization: [{ id: 'org-a', name: 'Organization A' }],
      folder: [
        {
          id: 'folder-a',
          name: 'Folder A',
          ownerOrganizationId: 'org-a',
        },
      ],
      dataset: [
        {
          id: 'dataset-inherited',
          name: 'Inherited dataset',
          folderId: 'folder-a',
        },
      ],
    })
  })

  it('includes datasets with organization inherited from their folder', async () => {
    const { dbAddProcessedData, getRecursive } = await import('../src/lib/db')

    dbAddProcessedData()

    const datasets = getRecursive('organization', 'org-a', 'dataset')

    expect(datasets.map(dataset => dataset.id)).toContain('dataset-inherited')
    expect(
      mockDb.get('dataset', 'dataset-inherited')?.ownerOrganizationId,
    ).toBe('org-a')
    expect(
      mockDb.get('organization', 'org-a')?.nbDatasetRecursive,
    ).toBeGreaterThan(0)
  })
})
