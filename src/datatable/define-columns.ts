import { entityNames } from '@lib/constant'
import { link } from '@lib/url'
import { statExists } from '@stat/stat'
import type { Row, Column as ColumnType } from '@type'

function filterEmptyColumns(columns: ColumnType[], items: Row[]) {
  const hasProp: Record<string, boolean> = {}
  for (const item of items) {
    for (const key of Object.keys(item)) {
      if (key === 'id' || key === 'isFavorite') {
        hasProp[key] = true
        continue
      }
      const value = (item as Record<string, unknown>)[key]
      if (Array.isArray(value)) {
        if (value.length > 0) hasProp[key] = true
      } else if (value) hasProp[key] = true
    }
  }
  const filterColumns = columns.filter(column => String(column.data) in hasProp)
  return filterColumns
}

function getTextWidth(lines: string[], font: string) {
  let maxWidth = 0
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return maxWidth
  context.font = font
  for (const line of lines) {
    const metrics = context.measureText(line)
    maxWidth = Math.max(maxWidth, metrics.width)
  }
  return maxWidth
}

export function defineColumns(
  columns: ColumnType[],
  data: Row[],
  entity: keyof typeof entityNames,
  keepAllCols: boolean,
  metaPath: string | undefined,
  nbRowLoading = 50,
) {
  let columnsCopy = columns.map(obj => ({ ...obj })) as ColumnType[]

  if (columnsCopy[0]?.title !== '#') {
    const colNumerotation: ColumnType = {
      data: '_rowNum',
      name: '_rowNum',
      title: '#',
      tooltip: 'Numéro de ligne',
      filterType: 'input',
      width: '20px',
    }
    if (entity in entityNames) {
      if (metaPath) {
        colNumerotation.render = (data, type, row: Row) => {
          return link(metaPath + '/' + row.id, data)
        }
      } else {
        colNumerotation.render = (data, type, row: Row) => {
          return link(entity + '/' + row.id, data)
        }
      }
    }
    columnsCopy = [colNumerotation, ...columnsCopy]
  }

  if (!keepAllCols) columnsCopy = filterEmptyColumns(columnsCopy, data)

  let bold = ''
  const miniCol = [
    '_rowNum',
    'level',
    'isFavorite',
    'searchRecent',
    'evolutionType',
  ]
  for (const column of columnsCopy) {
    const key = column.name ? column.name : (column.data as string)
    if (key !== '_rowNum' && statExists(entity, key)) {
      const columnStatBtn = `
        <span class="column-stat-btn icon-stat" data-entity="${entity}" data-attribut="${key}">
          <i class="fa-solid fa-signal">
        </i></span>`
      if (column.tooltip) column.tooltip += '&nbsp;&nbsp;' + columnStatBtn
      else column.tooltip = columnStatBtn
    }

    if (column.name && miniCol.includes(column.name)) {
      column.loadingMaxWidth = 20
      continue
    }
    if (column.hasLongText) {
      column.loadingWidth = 274
      column.loadingMaxWidth = 274
      continue
    }
    if (column.name === 'name') bold = 'bold'
    const cells: string[] = []
    for (const row of data.slice(0, nbRowLoading)) {
      let value = (row as Record<string, unknown>)[column.data as string]
      if ('fromLength' in column && column.fromLength && Array.isArray(value))
        value = value.length
      if (column.data === '_entityClean') value = 'icon-ico,' + value
      cells.push(String(value))
    }
    const cellsWidth =
      Math.round(getTextWidth(cells, `${bold} 16px "Helvetica Neue"`) * 100) /
      100
    column.loadingWidth = Math.min(274, cellsWidth)
    column.loadingMaxWidth = Math.min(274, cellsWidth)
  }
  return columnsCopy
}
