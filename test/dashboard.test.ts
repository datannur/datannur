import { describe, expect, it } from 'vitest'
import { buildDashboard } from '../src/dashboard/build-dashboard'
import type { DashboardInput } from '../src/dashboard/dashboard-types'

const now = Date.now()

const input: DashboardInput = {
  scope: { type: 'catalog', label: 'Catalogue' },
  entities: {
    folders: [
      {
        id: 'folder-a',
        name: 'Dossier A',
        description: 'Données métier',
        ownerOrganizationId: 'org-a',
        lastUpdateDate: '2026-05-01',
        typeClean: 'Domaine',
      },
    ],
    tags: [{ id: 'tag-a', name: 'Mot clé A' }],
    concepts: [{ id: 'concept-a', name: 'Concept A' }],
    datasets: [
      {
        id: 'dataset-a',
        name: 'Dataset A',
        description: 'Dataset documenté',
        ownerOrganizationId: 'org-a',
        link: 'https://example.org/data',
        deliveryFormat: 'csv',
        license: 'interne',
        nbRow: 100,
        nbResources: 2,
        dataSize: 50,
        lastUpdateDate: '2026-05-01',
        ownerName: 'Organisation A',
        folderName: 'Dossier A',
      },
      {
        id: 'dataset-b',
        name: 'Dataset B',
      },
    ],
    variables: [
      {
        id: 'variable-a',
        name: 'Variable A',
        datasetId: 'dataset-a',
        description: 'Variable documentée',
        type: 'string',
        typeClean: 'Texte',
      },
      {
        id: 'variable-b',
        name: 'Variable B',
        datasetId: 'dataset-b',
      },
    ],
    enumerations: [{ id: 'enumeration-a', name: 'Énumération A' }],
    evolutions: [
      {
        entity: 'dataset',
        entityId: 'dataset-a',
        type: 'update',
        timestamp: now - 1000,
        name: 'Dataset A',
      },
      {
        entity: 'dataset',
        entityId: 'dataset-b',
        type: 'nextUpdateDate',
        timestamp: now + 1000,
        name: 'Dataset B',
      },
    ],
  },
}

describe('buildDashboard', () => {
  it('builds summary metrics from scoped collections', () => {
    const dashboard = buildDashboard(input)
    expect(dashboard.scope).toEqual(input.scope)
    expect(dashboard.summary).toEqual([
      expect.objectContaining({ key: 'folders', value: 1 }),
      expect.objectContaining({ key: 'tags', value: 1 }),
      expect.objectContaining({ key: 'concepts', value: 1 }),
      expect.objectContaining({ key: 'datasets', value: 2 }),
      expect.objectContaining({ key: 'variables', value: 2 }),
      expect.objectContaining({ key: 'enumerations', value: 1 }),
      expect.objectContaining({ key: 'rows', value: 100 }),
      expect.objectContaining({ key: 'dataSize', value: 100, unit: 'bytes' }),
    ])
  })

  it('builds equal-weight score dimensions and global score', () => {
    const dashboard = buildDashboard(input)
    expect(dashboard.globalScore).toEqual({
      label: 'Qualité du catalogue',
      score: 31,
    })
    const inventory = dashboard.maturity.find(item => item.key === 'inventory')
    const understanding = dashboard.maturity.find(
      item => item.key === 'understanding',
    )
    const governance = dashboard.maturity.find(
      item => item.key === 'governance',
    )
    const profiling = dashboard.maturity.find(item => item.key === 'profiling')
    const dataQuality = dashboard.maturity.find(
      item => item.key === 'dataQuality',
    )
    const lifecycle = dashboard.maturity.find(item => item.key === 'lifecycle')
    const publication = dashboard.maturity.find(
      item => item.key === 'publication',
    )
    const protection = dashboard.maturity.find(
      item => item.key === 'protection',
    )

    expect(inventory?.score).toBe(25)
    expect(inventory?.criteria).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'datasetFolders', score: 0 }),
        expect.objectContaining({ key: 'access', score: 50 }),
      ]),
    )
    expect(understanding?.score).toBe(22)
    expect(governance?.criteria).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'owners', score: 67 }),
        expect.objectContaining({ key: 'managers', score: 0 }),
      ]),
    )
    expect(governance?.score).toBe(39)
    expect(profiling?.score).toBe(20)
    expect(dataQuality?.score).toBe(0)
    expect(lifecycle?.score).toBe(42)
    expect(publication?.score).toBe(0)
    expect(protection?.score).toBe(100)
    expect(protection?.criteria).toEqual([
      expect.objectContaining({ key: 'noSensitiveSignals', score: 100 }),
    ])
  })

  it('builds priorities with linked targets', () => {
    const dashboard = buildDashboard(input)
    expect(dashboard.priorities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'managers',
          dimensionKey: 'governance',
          count: 3,
          total: 3,
          gainPoints: 33.3,
          globalGainPoints: 4.2,
          gainPerTarget: 11.1,
        }),
        expect.objectContaining({
          key: 'enumerationsOrFrequencies',
          dimensionKey: 'dataQuality',
          count: 2,
          total: 2,
          gainPoints: 33.3,
          globalGainPoints: 4.2,
          gainPerTarget: 16.7,
        }),
        expect.objectContaining({
          key: 'access',
          count: 1,
          total: 2,
          gainPoints: 12.5,
          globalGainPoints: 1.6,
          gainPerTarget: 12.5,
        }),
      ]),
    )
    expect(
      dashboard.priorities.find(item => item.key === 'access')?.targets,
    ).toEqual([
      expect.objectContaining({
        href: 'dataset/dataset-b',
        label: 'Dataset B',
      }),
    ])
    expect(
      dashboard.priorities.find(item => item.key === 'variableTypes')
        ?.targetGroups,
    ).toEqual([
      {
        entity: 'variable',
        label: 'Variables',
        count: 1,
        href: 'variables?tab=variables&tab_variable_5=%3D%22%22',
      },
    ])
  })

  it('builds recent and upcoming timeline items', () => {
    const dashboard = buildDashboard(input)
    expect(dashboard.timeline.recent).toEqual([
      expect.objectContaining({
        href: 'dataset/dataset-a',
        label: 'Dataset A',
        typeLabel: 'Modification',
      }),
    ])
    expect(dashboard.timeline.upcoming).toEqual([
      expect.objectContaining({
        href: 'dataset/dataset-b',
        label: 'Dataset B',
        typeLabel: 'Prochaine mise à jour',
      }),
    ])
  })
})
