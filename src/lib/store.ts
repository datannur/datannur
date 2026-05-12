import { writable, type Writable } from 'svelte/store'
import type { EnumerationSimilitute } from '@type'
import type { Tab } from '@tab/tabs-helper'
import type { LocalEditStatus } from '@src/local-edit/local-edit-config'

export const headerOpen = writable(false)
export const footerVisible = writable(true)
export const enumerationsSimilitutes: Writable<EnumerationSimilitute[]> =
  writable([])
export const nbFavorite = writable(0)
export const allTabsIcon = writable({})
export const allTabs: Writable<{ [key: string]: Tab }> = writable({})
export const allTablesLoaded = writable(false)
export const searchValue = writable('')
export const localEditStatus = writable<LocalEditStatus>({
  available: false,
  mode: 'readonly',
})
export const whenAppReady: Writable<Promise<void>> = writable(
  new Promise(() => {}),
)
export const tabSelected = writable({} as Tab)
