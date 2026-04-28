<script lang="ts">
  import { untrack } from 'svelte'
  import Column from '@lib/column'
  import Datatable from '@datatable/Datatable.svelte'
  import type { Value } from '@type'

  let { values: valuesProp }: { values: Value[] } = $props()
  const values = untrack(() => valuesProp)

  const hasDescription = values.some(value => value.description)
  const columns = [Column.value()]
  if (hasDescription) columns.push(Column.description())
</script>

<Datatable
  entity="value"
  data={values}
  {columns}
  keepAllCols={true}
  sortByName={true}
/>
