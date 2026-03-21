<script lang="ts">
  import { untrack } from 'svelte'
  import { getLocalFilter } from '@lib/db'
  import Column from '@lib/column'
  import Datatable from '@datatable/Datatable.svelte'
  import type { Variable } from '@type'

  let {
    variables: variablesProp,
    isMeta: isMetaProp = false,
  }: {
    variables?: Variable[]
    isMeta?: boolean
  } = $props()

  const variables = untrack(() => variablesProp!)
  const isMeta = untrack(() => isMetaProp)

  const hasMultipleDatasets = new Set(variables.map(v => v.datasetId)).size > 1
  const variablesSorted = [...variables]
  const metaPath = isMeta ? 'metaVariable' : undefined

  function sortVariables(toSort: Variable[]) {
    if (toSort.length === 0) return
    const dbFilters = getLocalFilter()
    const filterPos: { [key: string]: number } = {}
    dbFilters.forEach((filter, i) => (filterPos[filter.id] = i))
    toSort.sort(
      (a, b) =>
        (b.lineageType ?? '').localeCompare(a.lineageType ?? '') ||
        (filterPos[a.datasetType ?? ''] ?? 0) -
          (filterPos[b.datasetType ?? ''] ?? 0) ||
        (a.folderName ?? '').localeCompare(b.folderName ?? '') ||
        (a.datasetName ?? '').localeCompare(b.datasetName ?? '') ||
        (a.num ?? 0) - (b.num ?? 0),
    )
  }
  sortVariables(variablesSorted)

  let nbRowMax = 0
  let nbValueMax = 0
  let nbSourcesMax = 0
  let nbDerivedMax = 0
  for (const variable of variables) {
    nbRowMax = Math.max(nbRowMax, variable.nbRow ?? 0)
    nbValueMax = Math.max(nbValueMax, variable.nbValue ?? 0)
    if ('sourceIds' in variable && 'derivedIds' in variable) {
      nbSourcesMax = Math.max(nbSourcesMax, variable.sourceIds?.size ?? 0)
      nbDerivedMax = Math.max(nbDerivedMax, variable.derivedIds?.size ?? 0)
    }
  }

  function defineColumns() {
    const base = [
      Column.name('variable', 'Variable', { isMeta }),
      Column.originalName(),
      Column.description(),
      Column.datatype(),
      Column.isKey(),
      Column.lineageType(),
      Column.nbSources(nbSourcesMax, 'variable'),
      Column.nbDerived(nbDerivedMax, 'variable'),
      ...(hasMultipleDatasets ? [Column.nbRow(nbRowMax)] : []),
      Column.stats(),
      Column.nbMissing(),
      Column.nbDuplicates(),
      Column.nbValues(nbValueMax),
      Column.freq(),
      Column.valuesPreview(),
    ]
    if (isMeta) {
      return [
        ...base,
        Column.metaLocalisation(),
        ...(hasMultipleDatasets
          ? [Column.dataset(isMeta), Column.metaFolder()]
          : []),
      ]
    }
    return [
      Column.favorite(),
      ...base,
      Column.modality(),
      ...(hasMultipleDatasets
        ? [
            Column.dataset(isMeta),
            Column.folder(),
            Column.owner(),
            Column.manager(),
          ]
        : []),
      Column.tag(),
      Column.startDate(),
      Column.endDate(),
    ]
  }
  const columns = defineColumns()
</script>

<Datatable entity="variable" data={variablesSorted} {columns} {metaPath} />
