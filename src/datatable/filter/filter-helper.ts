import jQuery from 'jquery'
import escapeHtml from 'escape-html'
import type { Api, ApiColumnMethods, InternalSettings } from 'datatables.net'
import type { Column } from '@type'
import { UrlParam } from '@lib/url'
import { dateToTimestamp } from '@lib/time'
import { t } from '@i18n/messages'
import type { FilterSelectPopupRequest } from './filter-select-popup'

interface ButtonInfo {
  text: string
  action: () => void
  footer: boolean
}

export function getActiveFilterCount(entity: string): number {
  const filterTableId = 'tab_' + entity
  let nbActive = 0
  for (const key in UrlParam.getAllParams()) {
    if (key.startsWith(filterTableId + '_')) {
      nbActive += 1
    }
  }
  return nbActive
}

export default class FilterHelper {
  tableId: string
  filters: Record<number, number>
  filterKeyByColumn: Record<number, string>
  filterColumnByKey: Record<string, number>
  filterTableId: string
  onUpdateFilterCount: (count: number) => void
  openFilterSelectPopup?: (request: FilterSelectPopupRequest) => void
  datatable?: Api
  constructor(
    tableId: string,
    entity: string,
    onUpdateFilterCount: (count: number) => void,
    openFilterSelectPopup?: (request: FilterSelectPopupRequest) => void,
  ) {
    this.tableId = tableId
    this.filters = {}
    this.filterKeyByColumn = {}
    this.filterColumnByKey = {}
    this.filterTableId = 'tab_' + entity
    this.onUpdateFilterCount = onUpdateFilterCount
    this.openFilterSelectPopup = openFilterSelectPopup
  }
  init(datatable: Api) {
    this.datatable = datatable
    datatable.columns().every(index => {
      this.initColumn(datatable.column(index), index)
    })
  }
  initColumn(column: ApiColumnMethods<unknown>, columnNum: number) {
    const id = 'datatables-title-' + this.tableId + '-filter-' + columnNum
    const filterElem = jQuery('#' + id)
    const filterContainer = filterElem.parent()
    const columnAttr = column.settings().init().columns?.[columnNum] as
      | Column
      | undefined
    const columnKey = this.getColumnKey(columnAttr, columnNum)
    this.filterKeyByColumn[columnNum] = columnKey
    this.filterColumnByKey[columnKey] = columnNum
    const columnDateType = columnAttr?.dateType
    const filterType = columnAttr?.filterType
    const uniqueValues = column.data().unique().toArray() as unknown[]

    if (
      filterType === 'select' ||
      (filterType !== 'input' &&
        uniqueValues.length < 10 &&
        Array.isArray(uniqueValues[0]) &&
        typeof uniqueValues[0] !== 'object' &&
        Array.isArray(uniqueValues[1]) &&
        typeof uniqueValues[1] !== 'object')
    ) {
      let options = '<option value="">- - -</option>'
      if (column.header().innerHTML.includes('icon-favorite')) {
        for (const val of [t('filter.favorite'), t('filter.notFavorite')]) {
          options += '<option value="' + val + '">' + val + '</option>'
        }
      } else {
        const values = uniqueValues
          .map(val => (val === null || val === undefined ? '' : val))
          .sort()

        for (let val of values) {
          if (val === '') {
            options +=
              '<option value="__empty__">' +
              t('filter.emptyOption') +
              '</option>'
          } else {
            if (val === true) val = t('column.trueValue')
            else if (val === false) val = t('column.falseValue')
            else if (typeof val === 'string' && val.includes('span>'))
              val = val.split('span>')[1].trim()

            const safeVal = escapeHtml(String(val))
            options +=
              '<option value="' + safeVal + '">' + safeVal + '</option>'
          }
        }
      }
      const selectElem = document.createElement('select')
      selectElem.required = true
      selectElem.name = id
      selectElem.id = id
      selectElem.innerHTML = options
      const select = jQuery(selectElem)
      filterContainer.html('')
      const selectWrap = jQuery('<div class="select"></div>')
      selectWrap.appendTo(filterContainer)
      select.appendTo(selectWrap)
      this.initSelectPopup(select)
      const searchSelectValue = (val: string) => {
        if (val === '__empty__') {
          column.search('^$', true, false).draw()
        } else {
          const escaped = jQuery.fn.dataTable.util.escapeRegex(val)
          column.search(val ? '^' + escaped + '$' : '', true, false).draw()
        }
      }
      select.on('change', event => {
        const elem = jQuery(event.target)
        let val = String(elem.val())
        if (val === 'true') val = t('column.trueValue')
        if (val === 'false') val = t('column.falseValue')

        searchSelectValue(val)
        this.updateFilterUrl(columnNum, columnKey, val)
        this.updateFilterCount()
      })

      const colFilterUrl = this.getColFilterUrl(columnNum, columnKey)

      if (colFilterUrl) {
        select.val(colFilterUrl)
        searchSelectValue(colFilterUrl)
        this.updateFilterCount()
      } else if (column.search() !== '') {
        const rawVal = column
          .search()
          .replace(/^\^|\$$/g, '')
          .replace(/\\(.)/g, '$1')
        select.val(rawVal).trigger('change')
      }
    } else {
      filterElem.on('keyup', event => {
        const elem = jQuery(event.target)
        const clearBtn = elem.parent().children('.btn-clear-input')
        const searchIcon = elem.parent().children('.search-icon')
        if (elem.val() === '') {
          clearBtn.hide()
          searchIcon.show()
        } else {
          clearBtn.show()
          searchIcon.hide()
        }

        if (columnNum in this.filters) {
          this.searchEquationEnd(columnNum)
        }

        let value = String(elem.val())

        if (value && columnDateType) {
          if (value.charCodeAt(0) > 47 && value.charCodeAt(0) < 58) {
            const timestamp = dateToTimestamp(
              value,
              columnDateType as 'start' | 'end',
            )
            if (![NaN, undefined].includes(timestamp)) {
              value = timestamp.toString()
            }
          } else {
            value =
              value[0] +
              dateToTimestamp(value.slice(1), columnDateType as 'start' | 'end')
          }
        }

        if (
          value &&
          (value.startsWith('>') ||
            value.startsWith('<') ||
            value.startsWith('=') ||
            value.startsWith('!'))
        ) {
          column.search('')
          this.searchEquationStart(columnNum, value)
        } else {
          column.search(value)
        }
        column.draw()
        this.updateFilterUrl(columnNum, columnKey, String(elem.val()))
        this.updateFilterCount()
      })

      const colFilterUrl = this.getColFilterUrl(columnNum, columnKey)
      if (colFilterUrl) {
        filterElem.val(colFilterUrl).trigger('keyup')
      } else if (column.search() !== '') {
        filterElem.val(column.search()).trigger('keyup')
      }
    }
  }
  getColumnKey(column: Column | undefined, columnNum: number): string {
    const data = column?.data
    if (column?.name) return column.name
    if (typeof data === 'string') return data
    return String(columnNum)
  }
  initSelectPopup(select: JQuery<HTMLSelectElement>) {
    if (!this.openFilterSelectPopup) return

    select.on('pointerdown', event => {
      if (!window.matchMedia('(pointer: fine)').matches) return

      event.preventDefault()
    })

    select.on('click', event => {
      if (!window.matchMedia('(pointer: fine)').matches) return

      event.preventDefault()
      const selectElem = event.currentTarget
      const options = Array.from(selectElem.options).map(option => ({
        value: option.value,
        label: option.textContent ?? '',
      }))

      this.openFilterSelectPopup?.({
        options,
        value: selectElem.value,
        onSelect: value => {
          selectElem.value = value
          selectElem.dispatchEvent(new Event('change', { bubbles: true }))
        },
      })
    })
  }
  cleanString(value: unknown) {
    return String(value).trim().toLowerCase()
  }
  searchEquationStart(columnNum: number, search: string) {
    const dt = jQuery.fn.dataTable
    this.filters[columnNum] = dt.ext.search.length
    dt.ext.search.push((settings: InternalSettings, data: string[]) => {
      if ((settings.nTable as HTMLTableElement).id !== this.tableId) return true
      if (!search || search.slice(1).trim() === '') return true
      const value = data[columnNum].replaceAll(' ', '')
      const searchValue = search.slice(1).trim()
      if (search.startsWith('<')) {
        return parseInt(value) < parseInt(searchValue)
      } else if (search.startsWith('>')) {
        return parseInt(value) > parseInt(searchValue)
      } else if (search.startsWith(`=""`) || search.startsWith(`=''`)) {
        return this.cleanString(value) === ''
      } else if (search.startsWith(`!""`) || search.startsWith(`!''`)) {
        return this.cleanString(value) !== ''
      } else if (search.startsWith('=')) {
        return this.cleanString(value) === this.cleanString(searchValue)
      } else if (search.startsWith('!')) {
        return !this.cleanString(value).includes(this.cleanString(searchValue))
      }
      return true
    })
  }
  updateSearchFilters(position: number) {
    if (!this.filters) return
    for (const [colNum, filterPosition] of Object.entries(this.filters)) {
      if (filterPosition > position) {
        this.filters[Number(colNum)] -= 1
      }
    }
  }
  searchEquationEnd(colNum: number) {
    const dt = jQuery.fn.dataTable
    dt.ext.search.splice(this.filters[colNum], 1)
    this.updateSearchFilters(this.filters[colNum])
    delete this.filters[colNum]
  }
  destroy() {
    const dt = jQuery.fn.dataTable
    const toRemove = Object.values(this.filters)
    dt.ext.search = dt.ext.search.filter((v, i) => toRemove.indexOf(i) === -1)
  }
  updateFilterUrl(colNum: number, columnKey: string, value: string) {
    const colId = this.filterTableId + '_' + columnKey
    const legacyColId = this.filterTableId + '_' + colNum
    if ([undefined, null, NaN, ''].includes(value)) {
      UrlParam.delete(colId)
      UrlParam.delete(legacyColId)
    } else {
      UrlParam.set(colId, value)
      UrlParam.delete(legacyColId)
    }
  }
  getColFilterUrl(colNum: number, columnKey: string) {
    const colId = this.filterTableId + '_' + columnKey
    const legacyColId = this.filterTableId + '_' + colNum
    const value = UrlParam.get(colId) || UrlParam.get(legacyColId)
    if (!value) return false
    return value
  }
  getActiveFilterCount(): number {
    return getActiveFilterCount(this.filterTableId.replace(/^tab_/, ''))
  }
  updateFilterCount() {
    const nbActive = this.getActiveFilterCount()
    this.onUpdateFilterCount(nbActive)
  }
  removeAll() {
    for (const key in UrlParam.getAllParams()) {
      if (key.startsWith(this.filterTableId + '_')) {
        const columnKey = key.split(this.filterTableId + '_')[1]
        const colNum = this.filterColumnByKey[columnKey] ?? Number(columnKey)
        if (!Number.isFinite(colNum)) continue
        const id = 'datatables-title-' + this.tableId + '-filter-' + colNum
        jQuery('#' + id)
          .val('')
          .trigger('keyup')
          .trigger('change')
      }
    }
  }
  getBtnInfoPopup(action: () => void = () => {}): ButtonInfo {
    return {
      text: `<span class="icon"><i class="fa-solid fa-magnifying-glass-plus"></i></span>`,
      action,
      footer: false,
    }
  }
}
