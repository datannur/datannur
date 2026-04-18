<script lang="ts">
  import { untrack } from 'svelte'
  import { onMount } from 'svelte'
  import db from '@db'
  import { page } from 'svelte-fileapp'
  import { getParentPath } from '@lib/db'
  import Column from '@lib/column'
  import Datatable from '@datatable/Datatable.svelte'
  import type { Concept, Column as ColumnType } from '@type'

  let { concepts: conceptsProp }: { concepts: Concept[] } = $props()
  const concepts = untrack(() => conceptsProp)

  let isRecursive = $state(false)
  let mounted = $state(false)

  let conceptMax = 0
  let variableMax = 0
  let levelMax = 0
  for (const concept of concepts) {
    if (db.useRecursive.concept) concept.pathString = getParentPath(concept)
    conceptMax = Math.max(conceptMax, concept.nbChildRecursive ?? 0)
    variableMax = Math.max(variableMax, concept.nbVariableRecursive ?? 0)
    levelMax = Math.max(levelMax, (concept.parents?.length ?? 0) + 1)
  }

  const conceptsSorted = [...concepts]
  if (db.useRecursive.concept) {
    conceptsSorted.sort((a, b) =>
      (a.pathString ?? '').localeCompare(b.pathString ?? ''),
    )
  }

  function defineColumns() {
    let columns: ColumnType[] = []
    columns.push(Column.favorite())
    if (db.useRecursive.concept) {
      columns.push(
        Column.name('concept', 'Concept', {
          withIndent: true,
          linkSameEntityTab: true,
        }),
      )
    } else {
      columns.push(Column.name('concept', 'Concept'))
    }

    columns.push(Column.id())
    columns.push(Column.description())

    if (db.useRecursive.concept) {
      columns.push(Column.parents('concept'))
    }

    columns = columns.concat([
      Column.tag(),
      Column.nbChildRecursive('concept', conceptMax),
      Column.nbVariable('concept', variableMax, { recursive: true }),
    ])

    if (db.useRecursive.concept) {
      columns.push(Column.level(levelMax))
    }
    return columns
  }

  const columns = defineColumns()

  onMount(() => {
    isRecursive =
      !!db.useRecursive.concept &&
      ['_index', 'concept', 'concepts'].includes($page)
    mounted = true
  })
</script>

{#if concepts && concepts.length > 0 && mounted}
  <Datatable entity="concept" data={conceptsSorted} {isRecursive} {columns} />
{/if}
