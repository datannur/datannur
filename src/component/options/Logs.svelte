<script lang="ts">
  import { untrack } from 'svelte'
  import { link } from '@lib/url'
  import { wrapLongText } from '@lib/util'
  import Datatable from '@datatable/Datatable.svelte'
  import Render from '@lib/render'
  import Column from '@lib/column'
  import { getEntityName } from '@i18n/constant-labels'
  import { entityNames } from '@lib/constant'
  import { t } from '@i18n/messages'
  import escapeHTML from 'escape-html'
  import type { Log, Column as ColumnType } from '@type'

  let { logs: logsProp }: { logs: Log[] } = $props()
  const logs = untrack(() => logsProp)

  for (const log of logs) {
    log._entityClean = log.entity
      ? getEntityName(log.entity as keyof typeof entityNames)
      : ''
    log._entity = log.entity
  }

  let columns: ColumnType[] = $derived([
    {
      data: 'action',
      title: Render.icon('log') + t('column.log.title'),
      defaultContent: '',
      filterType: 'select',
      tooltip: t('column.log.tooltip'),
      render: (data, type, row: Log) => {
        if (type !== 'display') return String(row.actionReadable || row.action)
        let content = ''
        if (row.actionIcon) content += Render.icon(row.actionIcon)
        if (row.actionReadable) content += ' ' + escapeHTML(row.actionReadable)
        else content += ' ' + escapeHTML(row.action)
        return wrapLongText(data ? content : '')
      },
    },
    Column.entity(),
    {
      data: 'element',
      title: Render.icon('entity') + t('column.element.title'),
      defaultContent: '',
      tooltip: t('column.element.tooltip'),
      render: (data, type, row: Log) => {
        if (!data) return ''
        if (type !== 'display') return String(data)
        data = escapeHTML(data)
        let content = ''
        if (row.elementIcon) content += Render.icon(escapeHTML(row.elementIcon))
        if (row.elementLink) {
          content += link(row.elementLink, data)
        } else {
          content += ' ' + data
        }
        return wrapLongText(content)
      },
    },
    Column.timestamp(),
  ])
</script>

<Datatable entity="log" data={logs} {columns} />
