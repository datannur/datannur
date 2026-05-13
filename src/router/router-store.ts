import { writable, derived } from 'svelte/store'

export const page = writable('')
export const onPageHomepage = derived(page, p => p === '_index')
export const onPageSearch = derived(page, p => p === 'search')
export const pageHash = writable('')
export const pageLoadedRoute = writable('')
export const pageContentLoaded = writable(false)
