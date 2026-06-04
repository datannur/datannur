import { writable } from 'svelte/store'
import type { Locale } from './types'

export const currentLocale = writable<Locale>('en')
