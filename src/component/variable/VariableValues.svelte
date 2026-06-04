<script lang="ts">
  import { untrack } from 'svelte'
  import Render from '@lib/render'
  import Column from '@lib/column'
  import Datatable from '@datatable/Datatable.svelte'
  import { t } from '@i18n/messages'
  import { link } from '@lib/url'
  import escapeHtml from 'escape-html'
  import type { Value, Column as ColumnType } from '@type'

  let {
    variableValues: variableValuesProp,
    isMeta: isMetaProp = false,
  }: { variableValues: Value[]; isMeta: boolean } = $props()

  const variableValues = untrack(() => variableValuesProp)
  const isMeta = untrack(() => isMetaProp)

  let hasDescription = false
  for (const value of variableValues) {
    if (value.description) {
      hasDescription = true
      break
    }
  }

  function defineColumns() {
    const columns: ColumnType[] = []
    if (!isMeta) {
      columns.push({
        data: 'enumerationName',
        title:
          Render.icon('enumeration') + t('column.enumeration.title'),
        tooltip: t('column.enumeration.tooltip'),
        render: (data, type, row: Value) => {
          if (!data) return ''
          if (type !== 'display') return String(data)
          return link(
            'enumeration/' + row.enumerationId,
            escapeHtml(data),
            'enumeration',
          )
        },
      })
    }
    columns.push(Column.value())
    if (hasDescription) columns.push(Column.description())
    return columns
  }
  const columns = $derived(defineColumns())
</script>

<Datatable
  entity="value"
  data={variableValues}
  {columns}
  keepAllCols={true}
  sortByName={true}
/>
