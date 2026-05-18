<script lang="ts">
  import { untrack } from 'svelte'
  import { onMount } from 'svelte'
  import db from '@db'
  import { page } from '@router/router-store'
  import { getParentPath } from '@lib/db'
  import Column from '@lib/column'
  import Datatable from '@datatable/Datatable.svelte'
  import type { Tag, Column as ColumnType } from '@type'

  let { tags: tagsProp }: { tags: Tag[] } = $props()
  const tags = untrack(() => tagsProp)

  let isRecursive = $state(false)
  let mounted = $state(false)

  let tagMax = 0
  let organizationMax = 0
  let folderMax = 0
  let docMax = 0
  let datasetMax = 0
  let variableMax = 0
  let dataSizeMax = 0
  let levelMax = 0
  for (const tag of tags) {
    if (db.useRecursive.tag) tag.pathString = getParentPath(tag)
    tagMax = Math.max(tagMax, tag.nbChildRecursive ?? 0)
    organizationMax = Math.max(
      organizationMax,
      tag.nbOrganizationRecursive ?? 0,
    )
    folderMax = Math.max(folderMax, tag.nbFolderRecursive ?? 0)
    docMax = Math.max(docMax, tag.nbDocRecursive ?? 0)
    datasetMax = Math.max(datasetMax, tag.nbDatasetRecursive ?? 0)
    variableMax = Math.max(variableMax, tag.nbVariableRecursive ?? 0)
    dataSizeMax = Math.max(dataSizeMax, tag.dataSizeRecursive ?? 0)
    levelMax = Math.max(levelMax, (tag.parents?.length ?? 0) + 1)
  }

  const tagsSorted = [...tags]
  if (db.useRecursive.tag) {
    tagsSorted.sort((a, b) =>
      (a.pathString ?? '').localeCompare(b.pathString ?? ''),
    )
  }

  function defineColumns() {
    let columns: ColumnType[] = []
    columns.push(Column.favorite())
    if (db.useRecursive.tag) {
      columns.push(
        Column.name('tag', 'Mot clé', {
          withIndent: true,
          linkSameEntityTab: true,
        }),
      )
    } else {
      columns.push(Column.name('tag', 'Mot clé'))
    }

    columns.push(Column.id())
    columns.push(Column.description())

    if (db.useRecursive.tag) {
      columns.push(Column.parents('tag'))
    }

    columns = columns.concat([
      Column.impliedTag(),
      Column.nbImpliedByTag(),
      Column.nbOrganizationRecursive('tag', organizationMax),
      Column.nbFolderRecursive('tag', folderMax),
      Column.nbChildRecursive('tag', tagMax),
      Column.nbDocRecursive('tag', docMax),
      Column.nbDatasetRecursive('tag', datasetMax),
      Column.nbVariable('tag', variableMax, { recursive: true }),
      Column.dataSize(dataSizeMax, { recursive: true }),
    ])

    if (db.useRecursive.tag) {
      columns.push(Column.level(levelMax))
    }
    return columns
  }

  const columns = defineColumns()

  onMount(() => {
    isRecursive =
      !!db.useRecursive.tag && ['_index', 'tag', 'tags'].includes($page)
    mounted = true
  })
</script>

{#if tags && tags.length > 0 && mounted}
  <Datatable entity="tag" data={tagsSorted} {isRecursive} {columns} />
{/if}
