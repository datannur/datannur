import { entityNames } from '@lib/constant'
import { link } from '@lib/url'
import { statExists } from '@stat/stat'
import type { TranslationKey } from '@i18n/types'
import type { Row, Column as ColumnType } from '@type'

type Translate = (key: TranslationKey) => string

function filterEmptyColumns(columns: ColumnType[], items: Row[]) {
  const hasProp: Record<string, boolean> = {}
  const wanted = new Set(
    columns.map(column => String(column.data)).filter(key => key !== 'null'),
  )
  for (const item of items) {
    if (wanted.size === 0) break
    for (const key of [...wanted]) {
      if (key === 'id' || key === 'isFavorite') {
        if (key in item) {
          hasProp[key] = true
          wanted.delete(key)
        }
        continue
      }
      const value = (item as Record<string, unknown>)[key]
      const isEmpty = Array.isArray(value) ? value.length === 0 : !value
      if (!isEmpty) {
        hasProp[key] = true
        wanted.delete(key)
      }
    }
  }
  const filterColumns = columns.filter(
    column => column.data === null || String(column.data) in hasProp,
  )
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
  translate: Translate,
) {
  let columnsCopy = columns.map(obj => ({ ...obj })) as ColumnType[]

  if (columnsCopy[0]?.title !== '#') {
    const colNumerotation: ColumnType = {
      data: null,
      name: '_rowNum',
      title: '#',
      tooltip: translate('column.rowNumber.tooltip'),
      filterType: 'input',
      width: '20px',
      defaultContent: '',
    }
    if (entity in entityNames) {
      const basePath = metaPath ?? entity
      colNumerotation.render = (data, type, row: Row, meta) => {
        const rowNum = meta.row + 1
        if (type !== 'display') return rowNum
        return link(basePath + '/' + row.id, String(rowNum))
      }
    } else {
      colNumerotation.render = (data, type, row: Row, meta) => meta.row + 1
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
