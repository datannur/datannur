import db from '@db'
import { getEntityName } from '@i18n/constant-labels'
import { entityNames } from '@lib/constant'
import type { EntityName, MainEntityName } from '@type'
import type { SearchResult } from './search'

export type SearchHistoryEntry = {
  entity: MainEntityName
  entityId: string | number
  timestamp: number
  id: number
}

export default class SearchHistory {
  static limit = 100
  static searchHistory: SearchHistoryEntry[] = []
  static dbKey = 'userData/searchHistory'
  static onChangeCallbacks: Record<string, () => void> = {}
  static onClearCallback: (() => void) | null = null

  static init(searchHistory: SearchHistoryEntry[], option = { limit: 100 }) {
    this.limit = option.limit
    this.searchHistory = searchHistory ?? []
  }
  static getAll() {
    return this.searchHistory
  }
  static add(entity: MainEntityName, entityId: string | number) {
    let searchEntityId = 1
    this.searchHistory = this.searchHistory
      .filter(
        searchItem =>
          searchItem.entity !== entity || searchItem.entityId !== entityId,
      )
      .map(searchItem => {
        searchItem.id = searchEntityId
        searchEntityId += 1
        return searchItem
      })

    this.searchHistory.unshift({
      id: 0,
      entity,
      entityId,
      timestamp: Date.now(),
    })
    if (this.searchHistory.length > this.limit) {
      this.searchHistory.pop()
    }
    this.save()
    this.callOnChange()
  }
  static callOnChange() {
    Object.values(this.onChangeCallbacks).forEach(callback => callback())
  }
  static save() {
    db.browser.set(this.dbKey, this.searchHistory)
  }
  static remove(entity: MainEntityName, entityId: string | number) {
    this.searchHistory = this.searchHistory.filter(
      searchItem =>
        searchItem.entity !== entity || searchItem.entityId !== entityId,
    )
    this.save()
    this.callOnChange()
  }
  static clear() {
    this.searchHistory = []
    this.save()
    if (this.onClearCallback) this.onClearCallback()
  }
  static onClear(callback: () => void) {
    this.onClearCallback = callback
  }
  static getRecentSearch() {
    const result: SearchResult[] = []
    const recentSearch = this.getAll()
    for (const entry of recentSearch) {
      if (!db.exists(entry.entity as EntityName, entry.entityId)) continue
      const itemData = db.get(entry.entity as EntityName, entry.entityId)
      if (!itemData) continue
      const data = itemData as SearchResult
      result.push({
        id: data.id,
        name: data.name,
        description: data.description,
        entity: entry.entity,
        isRecent: true,
        isFavorite: data.isFavorite,
        folderId: data.folderId,
        folderName: data.folderName,
        _entity: data._entity,
        _entityClean:
          data._entity && data._entity in entityNames
            ? getEntityName(data._entity as keyof typeof entityNames)
            : '',
      })
    }
    return result
  }
  static getRecentSearchIds() {
    const recentSearchIds: Record<string, number> = {}
    const recentSearch = this.getAll()
    for (const [i, entry] of recentSearch.entries()) {
      if (!db.exists(entry.entity as EntityName, entry.entityId)) continue
      recentSearchIds[`${entry.entity}-${entry.entityId}`] = i
    }
    return recentSearchIds
  }
  static putRecentFirst(result: SearchResult[]) {
    const recentIds = this.getRecentSearchIds()
    const recentSearch: {
      name: SearchResult[]
      description: SearchResult[]
    } = { name: [], description: [] }
    for (const item of result) {
      const itemObj = item
      const key = `${itemObj.entity}-${itemObj.id}`
      if (!(key in recentIds)) continue
      const itemData = { ...itemObj, isRecent: true, position: recentIds[key] }
      for (const [variable, list] of Object.entries(recentSearch)) {
        if (itemObj.variable === variable) list.push(itemData)
      }
    }
    recentSearch.name.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    recentSearch.description.sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    )
    result = result.filter(item => {
      const itemObj = item
      return !(`${itemObj.entity}-${itemObj.id}` in recentIds)
    })
    return [...recentSearch.name, ...recentSearch.description, ...result]
  }
  static onChange(key: string, callback: () => void) {
    if (this.onChangeCallbacks === undefined) this.onChangeCallbacks = {}
    this.onChangeCallbacks[key] = callback
  }
}
