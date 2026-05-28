import db from '@db'
import { mainEntityNames } from '@lib/constant'
import escapeHtml from 'escape-html'
import flexSearchScript from '../../node_modules/flexsearch/dist/flexsearch.bundle.min.js?raw'
import type FlexSearchType from 'flexsearch'
import type { Index } from 'flexsearch'
import type { MainEntity, MainEntityName } from '@type'

const flexSearchScriptId = 'flexsearch-legacy-bundle'

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

type EntityData = {
  name: MainEntityName
  items: Index
  data: unknown[]
}

type VariableName = 'name' | 'description'

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
  allSearch: {
    name: VariableName
    entities: EntityData[]
  }[]
  loading: Promise<void> | null

  constructor() {
    this.allSearch = []
    this.loading = new Promise<void>(() => {})
  }
  async init() {
    this.loading = (async () => {
      const flexSearch = await getFlexSearch()
      const variables: VariableName[] = ['name', 'description']
      for (const variable of variables) {
        const entitiesData: EntityData[] = []
        for (const entity in mainEntityNames) {
          entitiesData.push({
            name: entity as MainEntityName,
            items: new flexSearch.Index({ tokenize: 'forward' }),
            data: [],
          })
        }
        this.allSearch.push({ name: variable, entities: entitiesData })
      }
      for (const variable of this.allSearch) {
        for (const entity of variable.entities) {
          db.foreach(entity.name, item => {
            if (!('name' in item) || item.id === undefined) return
            let name = String(item[variable.name] ?? '')
            if (
              'originalName' in item &&
              item.originalName &&
              variable.name === 'name'
            )
              name += ` (${item.originalName})`
            entity.items.add(item.id, removeDiacritics(name))
          })
        }
      }
    })()
  }
  async find(toSearch: string): Promise<SearchResult[]> {
    if (this.loading) await this.loading
    const result: SearchResult[] = []
    const idsFound: Record<string, unknown[]> = {}
    for (const entity in mainEntityNames) idsFound[entity] = []
    for (const variable of this.allSearch) {
      for (const entity of variable.entities) {
        const itemsId = await this.getItemsId(toSearch, entity, idsFound)
        for (const itemId of itemsId) {
          const item = db.get(entity.name, itemId) as MainEntity & {
            folderId?: string | number
            folderName?: string
            originalName?: string
          }
          result.push({
            id: item.id,
            name:
              item.name + (item.originalName ? ` (${item.originalName})` : ''),
            description: item.description ?? '',
            entity: entity.name,
            variable: variable.name,
            isFavorite: item.isFavorite || false,
            folderId: item.folderId ?? '',
            folderName: item.folderName ?? '',
            _entity: item._entity ?? '',
            _entityClean:
              mainEntityNames[item._entity as keyof typeof mainEntityNames] ??
              '',
          })
        }
      }
    }
    return result
  }
  async getItemsId(
    toSearch: string,
    entity: EntityData,
    idsFound: Record<string, unknown[]>,
  ) {
    entity.data = []
    const normalizedSearch = removeDiacritics(toSearch)
    if (!normalizedSearch) return []
    const result = await entity.items.search(normalizedSearch, { limit: 99999 })
    const itemsId = result.filter(x => !idsFound[entity.name].includes(x))
    idsFound[entity.name] = idsFound[entity.name].concat(itemsId)
    return itemsId
  }
}

export default new Search()
