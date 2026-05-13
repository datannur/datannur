<script lang="ts">
  import { untrack } from 'svelte'
  import { page } from '@router/router-store'
  import Column from '@lib/column'
  import Render from '@lib/render'
  import { wrapLongText } from '@lib/util'
  import { highlightDiff } from '@lib/evolution'
  import {
    entityToIcon,
    columnCleanNames,
    columnIcons,
    isBigLimit,
  } from '@lib/constant'
  import Options from '@lib/options'
  import Datatable from '@datatable/Datatable.svelte'
  import escapeHtml from 'escape-html'
  import { evolutionTypes } from '@lib/constant'
  import type { Evolution, Column as ColumnType } from '@type'

  let { evolutions: evolutionsProp }: { evolutions: Evolution[] } = $props()
  const evolutions = untrack(() => evolutionsProp)

  let evolutionSummary = $state(Options.get('evolutionSummary'))

  function sortEvolutions(toSort: Evolution[]) {
    if (toSort.length === 0) return
    toSort.sort((a, b) => b.timestamp - a.timestamp)
  }

  function filterEvolutions(toFilter: Evolution[]) {
    if (toFilter.length === 0) return []
    const detailEntities = [
      'dataset',
      'variable',
      'enumeration',
      'value',
      'frequency',
    ]
    const mainRows = toFilter.filter(
      evo => !detailEntities.includes(evo.entity),
    )
    return mainRows
  }

  const detailPages = [
    'dataset',
    'datasets',
    'variable',
    'variables',
    'enumeration',
    'enumerations',
    'favorite',
  ]
  const filterEvolution =
    evolutionSummary &&
    !detailPages.includes($page) &&
    evolutions.length > isBigLimit

  const evolutionsSorted = filterEvolution
    ? filterEvolutions([...evolutions])
    : [...evolutions]

  sortEvolutions(evolutionsSorted)

  function getInitialScrollRow(toScroll: Evolution[]) {
    const currentIndex = toScroll.findIndex(
      evolution => evolution.timestamp <= Date.now(),
    )
    return currentIndex > 0 ? currentIndex : undefined
  }

  const initialScrollRow = getInitialScrollRow(evolutionsSorted)

  function defineColumns(): ColumnType[] {
    return [
      Column.favorite(),
      {
        data: 'typeClean',
        title: Render.icon('type'),
        defaultContent: '',
        name: 'evolutionType',
        width: '20px',
        filterType: 'select',
        tooltip: 'Type de modification',
        render: (data, type, row: Evolution) => {
          if (type !== 'display') return String(data)
          data = escapeHtml(data)
          const evolutionType = row.type as keyof typeof evolutionTypes
          return `
          <span class="icon icon-${evolutionType}" title="${data}">
            <i class="fas fa-${entityToIcon[evolutionType]}"></i>
          </span>
          <span style="display: none;">${data}</span>`
        },
      },
      Column.entity(),
      Column.name(),
      Column.parentEntity(),
      {
        data: 'variable',
        title: Render.icon('variable') + 'Variable',
        defaultContent: '',
        name: 'variable',
        filterType: 'input',
        tooltip: 'Nom de la variable',
        render: (data, type) => {
          if (!data) return ''

          const dataStr = String(data)
          let columnCleanNameLine2 = ''
          let columnCleanName: string | readonly string[] | string[] = dataStr

          const cleanName =
            columnCleanNames[dataStr as keyof typeof columnCleanNames]
          if (cleanName) {
            columnCleanName = cleanName
          } else {
            const col = Column[dataStr.toLowerCase() as keyof typeof Column]
            if (col && typeof col === 'object' && 'name' in col) {
              columnCleanName = (col.name as string | string[]) ?? dataStr
            }
          }

          if (Array.isArray(columnCleanName))
            [columnCleanName, columnCleanNameLine2] = columnCleanName

          if (type !== 'display') {
            return (
              columnCleanName +
              (columnCleanNameLine2 ? ' ' + columnCleanNameLine2 : '')
            )
          }

          const dataEscaped = escapeHtml(dataStr)
          const columnCleanNameEscaped = escapeHtml(String(columnCleanName))
          const columnCleanNameLine2Escaped = escapeHtml(columnCleanNameLine2)
          let icon = dataStr
          if (columnIcons[dataStr as keyof typeof columnIcons])
            icon = columnIcons[dataStr as keyof typeof columnIcons]

          return `
          <div style="display: flex; align-items: center;">
            <span class="icon icon-${icon}" title="${dataEscaped}">
              <i class="fas fa-${entityToIcon[icon as keyof typeof entityToIcon] ?? icon}"></i>
            </span>
            <span style="font-size: 13px;">
              ${columnCleanNameEscaped}
              ${columnCleanNameLine2Escaped ? `<br>${columnCleanNameLine2Escaped}` : ''}
            </span>
          </div>`
        },
      },
      {
        data: 'type',
        title: Render.icon('update') + 'Valeur',
        defaultContent: '',
        hasLongText: true,
        name: 'value',
        filterType: 'input',
        tooltip: 'Valeur de la variable',
        render: (data, type, row: Evolution) => {
          if (!row.oldValue && !row.newValue) {
            return ''
          }

          const oldValue = row.oldValue === null ? '' : row.oldValue
          const newValue = row.newValue === null ? '' : row.newValue

          if (oldValue === newValue) return wrapLongText(escapeHtml(oldValue))

          const diff = highlightDiff(
            escapeHtml(oldValue),
            escapeHtml(newValue),
            row.variable,
          )
          if (type !== 'display') return diff
          return wrapLongText(diff)
        },
      },
      {
        data: 'time',
        title: Render.icon('date'),
        defaultContent: '',
        filterType: 'select',
        tooltip: 'passé ou futur',
        render: (data, type) => {
          if (type !== 'display') return String(data)
          return `<span style="display: none;">${escapeHtml(data)}</span>`
        },
      },
      Column.timestamp(),
    ]
  }
  const columns = defineColumns()
</script>

<Datatable
  entity="evolution"
  data={evolutionsSorted}
  {columns}
  {initialScrollRow}
/>
