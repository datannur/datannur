<script lang="ts">
  import { untrack } from 'svelte'
  import Column from '@lib/column'
  import Datatable from '@datatable/Datatable.svelte'
  import { t } from '@i18n/messages'
  import type { Enumeration } from '@type'

  let { enumerations: enumerationsProp }: { enumerations: Enumeration[] } =
    $props()
  const enumerations = untrack(() => enumerationsProp)

  let nbValueMax = 0
  let nbVariableMax = 0
  for (const enumeration of enumerations) {
    nbValueMax = Math.max(nbValueMax, enumeration.nbValue ?? 0)
    nbVariableMax = Math.max(nbVariableMax, enumeration.nbVariable ?? 0)
  }

  const columns = $derived([
    Column.favorite(),
    Column.name('enumeration', t('entity.enumeration')),
    Column.description(),
    Column.datatype(),
    Column.nbVariable('enumeration', nbVariableMax, { showTitle: true }),
    Column.nbValues(nbValueMax),
    Column.valuesPreview(),
    Column.folder(),
  ])
</script>

<Datatable
  entity="enumeration"
  data={enumerations}
  {columns}
  sortByName={true}
/>
