<script lang="ts">
  import db from '@db'
  import { enumerationsSimilitutes, tabSelected } from '@lib/store'
  import Column from '@lib/column'
  import Render from '@lib/render'
  import { link } from '@lib/url'
  import { worker } from '@lib/util'
  import { enumerationCompareWorker } from '@lib/enumeration-compare-worker'
  import Datatable from '@datatable/Datatable.svelte'
  import Loading from '@frame/Loading.svelte'
  import escapeHtml from 'escape-html'
  import type { EnumerationSimilitute, Column as ColumnType } from '@type'

  let similitutes: EnumerationSimilitute[] = $state([])
  let loading = $state(true)

  ;(async () => {
    if ($enumerationsSimilitutes.length > 0) {
      similitutes = $enumerationsSimilitutes
      loading = false
      return
    }
    const enumerations = db.getAll('enumeration')
    similitutes = await worker(
      { enumerationsCompare: enumerations, limit: 50000 },
      enumerationCompareWorker,
    )
    $enumerationsSimilitutes = similitutes
    loading = false
    if (similitutes.length === 0) $tabSelected.nb = 0
  })()

  const columns: ColumnType[] = [
    {
      data: 'ratio',
      title: Render.icon('compare') + 'Similitude',
      tooltip:
        "Pourcentage de valeurs de l'énumération 1 présentes dans l'énumération 2",
      render: data => `${data}%`,
    },
    {
      data: 'enumeration1Id',
      title: Render.icon('enumeration') + 'Énumération',
      tooltip: "Nom de l'énumération 1",
      render: (data, type, row: EnumerationSimilitute) => {
        if (type !== 'display') return String(row.enumeration2Name)
        return link(
          'enumeration/' + data,
          escapeHtml(row.enumeration1Name),
          'enumeration',
        )
      },
    },
    Column.folder('enumeration1FolderId', 'enumeration1FolderName'),
    {
      data: 'enumeration1Type',
      title: Render.icon('type') + 'Type',
      tooltip: "Type de l'énumération 1",
      render: Render.shortText,
    },
    {
      data: 'enumeration1NbValue',
      title: Render.icon('value') + 'Valeurs',
      tooltip: "Nombre de valeurs de l'énumération 1",
      render: Render.num,
    },
    {
      data: 'enumeration1NbVariable',
      title: Render.icon('variable') + 'Variables',
      tooltip: "Nombre de variables liées à l'énumération 1",
      render: Render.num,
    },
    {
      data: 'enumeration2Id',
      title: Render.icon('enumeration') + 'Similaire à',
      tooltip: "Nom de l'énumération 2",
      render: (data, type, row: EnumerationSimilitute) => {
        if (type !== 'display') return String(row.enumeration2Name)
        return link(
          'enumeration/' + data,
          escapeHtml(row.enumeration2Name),
          'enumeration',
        )
      },
    },
    Column.folder('enumeration2FolderId', 'enumeration2FolderName'),
    {
      data: 'enumeration2Type',
      title: Render.icon('type') + 'Type',
      tooltip: "Type de l'énumération 2",
      render: Render.shortText,
    },
    {
      data: 'enumeration2NbValue',
      title: Render.icon('value') + 'Valeurs',
      tooltip: "Nombre de valeurs de l'énumération 2",
      render: Render.num,
    },
    {
      data: 'enumeration2NbVariable',
      title: Render.icon('variable') + 'Variables',
      tooltip: "Nombre de variables liées à l'énumération 2",
      render: Render.num,
    },
  ]
</script>

{#if loading && similitutes.length === 0}
  <Loading type="tabBody" colorEntity="compare" />
{:else if similitutes.length > 0}
  <Datatable entity="compare" data={similitutes} {columns} sortByName={true} />
{:else}
  <div style="padding: 20px; text-align: center;">
    Aucune similitude trouvée
  </div>
{/if}
