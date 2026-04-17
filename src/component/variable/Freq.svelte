<script lang="ts">
  import { untrack } from 'svelte'
  import Render from '@lib/render'
  import Datatable from '@datatable/Datatable.svelte'
  import { getPercent } from '@lib/util'
  import escapeHtml from 'escape-html'
  import type { Freq, Column as ColumnType } from '@type'

  let {
    freq: freqProp,
    scale,
    isPattern = false,
  }: { freq: Freq[]; scale?: number; isPattern?: boolean } = $props()
  const freq = untrack(() => freqProp)

  const freqSorted = [...freq].sort((a, b) => (b.freq || 0) - (a.freq || 0))
  const totalFreq = freq.reduce((sum, item) => sum + (item.freq || 0), 0)
  const maxFreq = freqSorted.length > 0 ? freqSorted[0].freq : 1

  function defineColumns() {
    const columns: ColumnType[] = []

    columns.push({
      data: 'value',
      title: Render.icon('value') + (isPattern ? 'Pattern' : 'Valeur'),
      tooltip: isPattern ? 'Pattern de la variable' : 'Valeur de la variable',
      render: Render.longText,
    })

    columns.push({
      data: 'freq',
      title: Render.icon('freq') + 'Fréquence',
      tooltip: "Nombre d'occurrences avec pourcentage",
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
            <div class="freq-background color-freq" style="width: ${percentBackground}%"></div>
            <span class="freq-number">${escapeHtml(freqNum)}</span>
            <span class="freq-percent">${percentDisplay}%</span>
          </div>`
        }

        return Render.numPercent(scaledFreq, percentDisplay, 'freq', type, true)
      },
    })

    return columns
  }

  const columns = defineColumns()
</script>

<Datatable entity="freq" data={freqSorted} {columns} keepAllCols={true} />
