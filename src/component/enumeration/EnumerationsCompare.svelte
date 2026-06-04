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
  import { t } from '@i18n/messages'
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

  const columns: ColumnType[] = $derived([
    {
      data: 'ratio',
      title:
        Render.icon('compare') +
        t('column.enumerationSimilarity.title'),
      tooltip: t('column.enumerationSimilarity.tooltip'),
      render: (data: number) => `${data}%`,
    },
    {
      data: 'enumeration1Id',
      title:
        Render.icon('enumeration') + t('column.enumeration.title'),
      tooltip: t('column.enumeration1Name.tooltip'),
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
      title: Render.icon('type') + t('column.type.title'),
      tooltip: t('column.enumeration1Type.tooltip'),
      render: Render.shortText,
    },
    {
      data: 'enumeration1NbValue',
      title: Render.icon('value') + t('column.values.title'),
      tooltip: t('column.enumeration1Values.tooltip'),
      render: Render.num,
    },
    {
      data: 'enumeration1NbVariable',
      title: Render.icon('variable') + t('column.variables.title'),
      tooltip: t('column.enumeration1Variables.tooltip'),
      render: Render.num,
    },
    {
      data: 'enumeration2Id',
      title:
        Render.icon('enumeration') +
        t('column.enumerationSimilarity.title'),
      tooltip: t('column.enumeration2Name.tooltip'),
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
      title: Render.icon('type') + t('column.type.title'),
      tooltip: t('column.enumeration2Type.tooltip'),
      render: Render.shortText,
    },
    {
      data: 'enumeration2NbValue',
      title: Render.icon('value') + t('column.values.title'),
      tooltip: t('column.enumeration2Values.tooltip'),
      render: Render.num,
    },
    {
      data: 'enumeration2NbVariable',
      title: Render.icon('variable') + t('column.variables.title'),
      tooltip: t('column.enumeration2Variables.tooltip'),
      render: Render.num,
    },
  ])
</script>

{#if loading && similitutes.length === 0}
  <Loading type="tabBody" colorEntity="compare" />
{:else if similitutes.length > 0}
  <Datatable entity="compare" data={similitutes} {columns} sortByName={true} />
{:else}
  <div style="padding: 20px; text-align: center;">
    {t('enumerationCompare.noSimilarity')}
  </div>
{/if}
