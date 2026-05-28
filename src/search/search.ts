import db from '@db'
import { mainEntityNames } from '@lib/constant'
import escapeHtml from 'escape-html'
import flexSearchScript from '../../node_modules/flexsearch/dist/flexsearch.bundle.min.js?raw'
import { writable } from 'svelte/store'
import type FlexSearchType from 'flexsearch'
import type { Index } from 'flexsearch'
import type { MainEntity, MainEntityName } from '@type'

const flexSearchScriptId = 'flexsearch-legacy-bundle'
const maxPendingAdds = 500
const mainEntityOrder = Object.keys(mainEntityNames) as MainEntityName[]

export const searchReady = writable(false)

let flexSearchLoading: Promise<typeof FlexSearchType> | null = null

function injectFlexSearchScript(): void {
  if (document.getElementById(flexSearchScriptId)) return

  const script = document.createElement('script')
  script.id = flexSearchScriptId
  script.text = flexSearchScript
  document.head.appendChild(script)
}

async function getFlexSearch(): Promise<typeof FlexSearchType> {
  if (window.FlexSearch) return window.FlexSearch

  flexSearchLoading ??= Promise.resolve().then(() => {
    injectFlexSearchScript()
    if (!window.FlexSearch?.Index) {
      throw new Error('FlexSearch loaded without exposing window.FlexSearch')
    }
    return window.FlexSearch
  })
  return flexSearchLoading
}

type VariableName = 'name' | 'description'

type SearchItemRef = {
  entity: MainEntityName
  id: string | number
}

type SearchFieldData = {
  name: VariableName
  items: Index<true>
  refs: Map<string, SearchItemRef>
}

export type SearchResult = {
  id: string | number
  name: string
  description: string
  entity: MainEntityName
  variable?: VariableName
  isFavorite: boolean
  folderId: string | number
  folderName: string
  _entity: string
  _entityClean: string
  isRecent?: boolean
  position?: number
  navHover?: boolean
}

function removeDiacritics(str: string | undefined) {
  if (typeof str !== 'string') {
    console.warn('removeDiacritics() input is not a string', str)
    return ''
  }
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const charMap: Record<string, string> = {
  a: '[aâäà]',
  e: '[eéèêë]',
  i: '[iîï]',
  o: '[oôö]',
  u: '[uûü]',
  c: '[cç]',
}

export function searchHighlight(value: string, search: string | null) {
  if (!search || search.trim() === '') return value

  const normalizedSearch = removeDiacritics(search)
    .split('')
    .map(char => {
      const lowerChar = char.toLowerCase()
      if (charMap[lowerChar]) {
        return charMap[lowerChar]
      } else {
        return char.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
      }
    })
    .join('')

  const pattern = `(^|[^a-zA-Z])(${normalizedSearch})`
  const regex = new RegExp(pattern, 'gi')

  return escapeHtml(value).replace(regex, (match, p1, p2) => {
    return `${p1}<span class="searchHighlight">${p2}</span>`
  })
}

class Search {
  allSearch: SearchFieldData[]
  loading: Promise<void> | null
  ready: boolean

  constructor() {
    this.allSearch = []
    this.loading = null
    this.ready = false
  }
  async init() {
    if (this.loading) return this.loading
    if (this.ready) return

    this.loading = (async () => {
      const flexSearch = await getFlexSearch()
      const variables: VariableName[] = ['name', 'description']
      const addPromises: Promise<unknown>[] = []
      const flushPromises: Promise<void>[] = []
      const flushAdds = async () => {
        const pendingAdds = addPromises.splice(0)
        await Promise.all(pendingAdds)
      }
      const queueAdd = (addPromise: Promise<unknown>) => {
        addPromises.push(addPromise)
        if (addPromises.length >= maxPendingAdds) {
          flushPromises.push(flushAdds())
        }
      }
      const flushAllAdds = async () => {
        flushPromises.push(flushAdds())
        await Promise.all(flushPromises)
        addPromises.length = 0
        flushPromises.length = 0
      }
      for (const variable of variables) {
        this.allSearch.push({
          name: variable,
          items: await new flexSearch.Worker({ tokenize: 'forward' }),
          refs: new Map(),
        })
      }
      for (const variable of this.allSearch) {
        for (const entity of mainEntityOrder) {
          db.foreach(entity, item => {
            if (!('name' in item) || item.id === undefined) return
            let name = String(item[variable.name] ?? '')
            if (
              'originalName' in item &&
              item.originalName &&
              variable.name === 'name'
            )
              name += ` (${item.originalName})`
            const searchId = `${entity}:${item.id}`
            variable.refs.set(searchId, { entity, id: item.id })
            queueAdd(variable.items.add(searchId, removeDiacritics(name)))
          })
          await flushAllAdds()
        }
      }
      await flushAllAdds()
      this.ready = true
      searchReady.set(true)
    })()
    return this.loading
  }
  async find(toSearch: string): Promise<SearchResult[]> {
    if (!this.loading) await this.init()
    if (this.loading) await this.loading
    const result: SearchResult[] = []
    const idsFound: Record<string, unknown[]> = {}
    for (const entity in mainEntityNames) idsFound[entity] = []
    for (const variable of this.allSearch) {
      const itemRefs = await this.getItemsRef(toSearch, variable, idsFound)
      for (const itemRef of itemRefs) {
        const item = db.get(itemRef.entity, itemRef.id) as MainEntity & {
          folderId?: string | number
          folderName?: string
          originalName?: string
        }
        result.push({
          id: item.id,
          name:
            item.name + (item.originalName ? ` (${item.originalName})` : ''),
          description: item.description ?? '',
          entity: itemRef.entity,
          variable: variable.name,
          isFavorite: item.isFavorite || false,
          folderId: item.folderId ?? '',
          folderName: item.folderName ?? '',
          _entity: item._entity ?? '',
          _entityClean:
            mainEntityNames[item._entity as keyof typeof mainEntityNames] ?? '',
        })
      }
    }
    return result
  }
  async getItemsRef(
    toSearch: string,
    fieldData: SearchFieldData,
    idsFound: Record<string, unknown[]>,
  ) {
    const normalizedSearch = removeDiacritics(toSearch)
    if (!normalizedSearch) return []
    const searchIds = await fieldData.items.search(normalizedSearch, {
      limit: 99999,
    })
    const itemRefsByEntity: { [key in MainEntityName]?: SearchItemRef[] } = {}
    searchIds.forEach(searchId => {
      const itemRef = fieldData.refs.get(String(searchId))
      if (!itemRef || idsFound[itemRef.entity].includes(itemRef.id)) return

      idsFound[itemRef.entity].push(itemRef.id)
      const itemRefs = itemRefsByEntity[itemRef.entity] ?? []
      itemRefs.push(itemRef)
      itemRefsByEntity[itemRef.entity] = itemRefs
    })
    return mainEntityOrder.flatMap(entity => itemRefsByEntity[entity] ?? [])
  }
}

export default new Search()
