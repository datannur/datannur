import { beforeEach, describe, expect, it } from 'vitest'
import { buildDashboard } from '../src/dashboard/build-dashboard'
import { currentLocale } from '../src/i18n/state'
import type { DashboardInput } from '../src/dashboard/dashboard-types'

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
  },
}

describe('buildDashboard', () => {
  beforeEach(() => {
    currentLocale.set('en')
  })

  it('builds representative dashboard labels in french', () => {
    currentLocale.set('fr')

    const dashboard = buildDashboard(input)
    expect(dashboard.globalScore).toEqual({
      label: 'Maturité du catalogue',
      score: 26,
    })
    expect(dashboard.diagnostic).toEqual(
      expect.objectContaining({
        label: 'Catalogue en structuration',
        strengths: [
          expect.objectContaining({ key: 'governance', label: 'Gouverné' }),
          expect.objectContaining({ key: 'protection', label: 'Maîtrisé' }),
        ],
        watchpoints: [
          expect.objectContaining({
            key: 'understanding',
            label: 'Compréhensible',
          }),
          expect.objectContaining({
            key: 'profileQuality',
            label: 'Réutilisable',
          }),
        ],
      }),
    )
    expect(
      dashboard.priorities.find(item => item.key === 'variableTypes')
        ?.targetGroups,
    ).toEqual([
      expect.objectContaining({
        entity: 'variable',
        label: 'Variables',
      }),
    ])
  })

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
      label: 'Catalog maturity',
      score: 26,
    })
    expect(dashboard.diagnostic).toEqual({
      label: 'Catalog under structuring',
      description:
        'The catalog foundations are present, but essential information still needs consolidation to improve understanding and reuse.',
      strengths: [
        { key: 'governance', label: 'Governed', score: 34 },
        { key: 'protection', label: 'Controlled', score: 33 },
      ],
      watchpoints: [
        { key: 'understanding', label: 'Understandable', score: 18 },
        { key: 'profileQuality', label: 'Reusable', score: 21 },
      ],
    })
    expect(
      dashboard.maturity.map(item => ({
        key: item.key,
        label: item.label,
        score: item.score,
        applicable: item.applicable,
      })),
    ).toEqual([
      { key: 'inventory', label: 'Inventoried', score: 25, applicable: true },
      {
        key: 'understanding',
        label: 'Understandable',
        score: 18,
        applicable: true,
      },
      { key: 'governance', label: 'Governed', score: 34, applicable: true },
      { key: 'protection', label: 'Controlled', score: 33, applicable: true },
      {
        key: 'profileQuality',
        label: 'Reusable',
        score: 21,
        applicable: true,
      },
    ])

    const inventory = dashboard.maturity.find(item => item.key === 'inventory')
    const understanding = dashboard.maturity.find(
      item => item.key === 'understanding',
    )
    const governance = dashboard.maturity.find(
      item => item.key === 'governance',
    )
    const profileQuality = dashboard.maturity.find(
      item => item.key === 'profileQuality',
    )
    const protection = dashboard.maturity.find(
      item => item.key === 'protection',
    )

    expect(inventory?.score).toBe(25)
    expect(inventory?.criteria.map(item => item.key)).toEqual([
      'datasetFolders',
      'access',
      'formats',
      'previews',
    ])
    expect(understanding?.criteria.map(item => item.key)).toEqual([
      'descriptions',
      'tags',
      'linkedDocs',
      'variableDescriptions',
      'variableConcepts',
      'lineageRelations',
    ])
    expect(governance?.criteria).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'owners', score: 67 }),
        expect.objectContaining({ key: 'managers', score: 0 }),
      ]),
    )
    expect(profileQuality?.criteria.map(item => item.key)).toEqual([
      'licenses',
      'schemaExtracted',
      'variableTypes',
      'datasetStats',
      'variableStats',
      'enumerationsOrFrequencies',
      'sampledDatasets',
    ])
    expect(governance?.score).toBe(34)
    expect(protection?.criteria.map(item => item.key)).toEqual([
      'lastUpdateDate',
      'updateFrequency',
      'periods',
      'seriesPeriods',
      'noSensitiveSignals',
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
          gainPoints: 50,
          globalGainPoints: 10,
          gainPerTarget: 16.7,
        }),
        expect.objectContaining({
          key: 'previews',
          dimensionKey: 'inventory',
          count: 2,
          total: 2,
          gainPoints: 25,
          globalGainPoints: 5,
          gainPerTarget: 12.5,
        }),
        expect.objectContaining({
          key: 'access',
          count: 1,
          total: 2,
          gainPoints: 12.5,
          globalGainPoints: 2.5,
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
})
