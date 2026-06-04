<script lang="ts">
  import { untrack } from 'svelte'
  import Render from '@lib/render'
  import Datatable from '@datatable/Datatable.svelte'
  import { t } from '@i18n/messages'
  import { getPercent } from '@lib/util'
  import escapeHtml from 'escape-html'
  import type { Frequency, Column as ColumnType } from '@type'

  let {
    frequency: freqProp,
    scale,
    isPattern = false,
  }: { frequency: Frequency[]; scale?: number; isPattern?: boolean } = $props()
  const frequency = untrack(() => freqProp)

  const freqSorted = [...frequency].sort(
    (a, b) => (b.frequency || 0) - (a.frequency || 0),
  )
  const totalFreq = frequency.reduce(
    (sum, item) => sum + (item.frequency || 0),
    0,
  )
  const maxFreq = freqSorted.length > 0 ? freqSorted[0].frequency : 1

  function defineColumns() {
    const columns: ColumnType[] = []

    columns.push({
      data: 'value',
      title:
        Render.icon('value') +
        (isPattern
          ? t('column.pattern.title')
          : t('column.value.title')),
      tooltip: isPattern
        ? t('column.pattern.tooltip')
        : t('column.variableValue.tooltip'),
      render: Render.longText,
    })

    columns.push({
      data: 'frequency',
      title:
        Render.icon('frequency') + t('column.frequencyCount.title'),
      tooltip: t('column.frequencyCount.tooltip'),
      filterType: 'input',
      className: 'text-right',
      render: (data, type) => {
        if (data === null || data === undefined || !totalFreq) return ''
        const freq = Number(data)
        const percentDisplay = getPercent(freq / totalFreq)
        const percentBackground = getPercent(freq / maxFreq)
        const scaledFreq = scale ? Math.round(freq * scale) : freq
        const approx = scale ? '≈\u00a0' : ''
        if (type === 'display') {
          const freqNum = approx + Render.num(scaledFreq, type)
          return `
          <div class="freq-item-container">
            <div class="freq-background color-frequency" style="width: ${percentBackground}%"></div>
            <span class="freq-number">${escapeHtml(freqNum)}</span>
            <span class="freq-percent">${percentDisplay}%</span>
          </div>`
        }

        return Render.numPercent(
          scaledFreq,
          percentDisplay,
          'frequency',
          type,
          true,
        )
      },
    })

    return columns
  }

  const columns = $derived(defineColumns())
</script>

<Datatable entity="frequency" data={freqSorted} {columns} keepAllCols={true} />
