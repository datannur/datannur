<script lang="ts">
  import { untrack } from 'svelte'
  import { getLocalFilter } from '@lib/db'
  import Column from '@lib/column'
  import Datatable from '@datatable/Datatable.svelte'
  import type { Dataset } from '@type'

  let {
    datasets: datasetsProp,
    isMeta: isMetaProp = false,
  }: { datasets: Dataset[]; isMeta?: boolean } = $props()

  const datasets = untrack(() => datasetsProp)
  const isMeta = untrack(() => isMetaProp)

  const datasetPath = isMeta ? 'metaDataset/' : 'dataset/'
  const tabVariables = isMeta ? 'metaVariables' : 'variables'
  const metaPath = isMeta ? 'metaDataset' : undefined
  const datasetsSorted = [...datasets]

  function sortDatasets(toSort: Dataset[]) {
    if (toSort.length === 0) return
    const dbFilters = getLocalFilter()
    const filterPos: { [key: string]: number } = {}
    dbFilters.forEach((filter, i) => (filterPos[filter.id] = i))
    toSort.sort(
      (a, b) =>
        (b.relationType ?? '').localeCompare(a.relationType ?? '') ||
        (filterPos[a.type ?? ''] ?? 0) - (filterPos[b.type ?? ''] ?? 0) ||
        (a.folderName ?? '').localeCompare(b.folderName ?? '') ||
        a.name.localeCompare(b.name),
    )
  }
  sortDatasets(datasetsSorted)

  let nbVariableMax = 0
  let nbRowMax = 0
  let nbResourcesMax = 0
  let dataSizeMax = 0
  let nbDocMax = 0
  let nbSourcesMax = 0
  let nbDerivedMax = 0
  let nbFkMax = 0
  let nbFkRefMax = 0
  for (const d of datasets) {
    nbVariableMax = Math.max(nbVariableMax, d.nbVariable ?? 0)
    nbRowMax = Math.max(nbRowMax, d.nbRow ?? 0)
    nbResourcesMax = Math.max(nbResourcesMax, d.nbResources ?? 0)
    dataSizeMax = Math.max(dataSizeMax, d.dataSize ?? 0)
    nbDocMax = Math.max(nbDocMax, d.docsRecursive?.length ?? 0)
    nbSourcesMax = Math.max(nbSourcesMax, d.sourceIds?.size ?? 0)
    nbDerivedMax = Math.max(nbDerivedMax, d.derivedIds?.size ?? 0)
    nbFkMax = Math.max(nbFkMax, d.fkDatasetIds?.size ?? 0)
    nbFkRefMax = Math.max(nbFkRefMax, d.fkReferencedByDatasetIds?.size ?? 0)
  }

  function defineColumns() {
    const base = [
      Column.name('dataset', 'Dataset', { isMeta }),
      Column.description(),
      Column.relationType(),
      Column.nbFk(nbFkMax),
      Column.nbFkRef(nbFkRefMax),
      Column.nbSources(nbSourcesMax, 'dataset'),
      Column.nbDerived(nbDerivedMax, 'dataset'),
      Column.datasetType(),
      Column.nbVariable('dataset', nbVariableMax, {
        tab: tabVariables,
        linkPath: datasetPath,
        showTitle: true,
      }),
      Column.nbRow(nbRowMax),
      Column.nbResources(nbResourcesMax),
      Column.dataSize(dataSizeMax),
    ]
    if (isMeta) {
      return [
        ...base,
        Column.metaLocalisation(),
        Column.metaFolder(),
        Column.timestamp({
          varName: 'lastUpdateTimestamp',
          title: 'Mise à jour',
          tooltip: 'Moment de la dernière mise à jour',
        }),
      ]
    }
    return [
      Column.favorite(),
      ...base,
      Column.nbDoc('dataset', nbDocMax, true),
      Column.folder(),
      Column.tag(),
      Column.lastUpdate(),
      Column.nextUpdate(),
      Column.updateFrequency(),
      Column.startDate(),
      Column.endDate(),
      Column.owner(),
      Column.manager(),
      Column.localisation(),
      Column.deliveryFormat(),
      Column.license(),
      Column.dataPath(),
    ]
  }
  const columns = defineColumns()
</script>

<Datatable entity="dataset" data={datasetsSorted} {columns} {metaPath} />
