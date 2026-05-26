import db from '@db'
import type { ConfigFilter } from '@type'

type FilterState = {
  id: string
  isActive?: boolean
}

export default class MainFilter {
  static dbKey = 'userData/filterActive'
  static filterStates: FilterState[] = []

  static init() {
    return new Promise<void>(resolve => {
      this.filterStates = []
      db.browser.get(this.dbKey).then(filters => {
        if (filters && Array.isArray(filters)) {
          this.filterStates = filters as FilterState[]
        }
        resolve()
      })
    })
  }
  static applySavedState(filters: readonly ConfigFilter[]) {
    const savedFiltersById = new Map(
      this.filterStates.map(filter => [filter.id, filter.isActive]),
    )
    return filters.map(filter => ({
      ...filter,
      isActive:
        savedFiltersById.get(filter.id) ?? filter.isActiveDefault ?? true,
    }))
  }
  static getInactiveFilters(filters: readonly ConfigFilter[]) {
    return this.applySavedState(filters).filter(filter => !filter.isActive)
  }
  static getFilterValues(filter: ConfigFilter) {
    return [filter.value]
  }
  static buildDbFilters(filters: readonly ConfigFilter[]) {
    return filters
      .map(filter => ({ filter, values: this.getFilterValues(filter) }))
      .filter(
        ({ filter, values }) =>
          filter.entity && filter.field && values.length > 0,
      )
      .map(({ filter, values }) => ({
        entity: filter.entity,
        variable: filter.field,
        values,
      }))
  }
  static save(filters: readonly ConfigFilter[]) {
    db.browser.set(
      this.dbKey,
      filters.map(row => ({ id: row.id, isActive: row.isActive })),
    )
  }
}
