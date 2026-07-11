import { derived, get } from 'svelte/store'
import { en } from './en'
import { fr } from './fr'
import { de } from './de'
import { it } from './it'
import { currentLocale } from './state'
import type { Locale, Translation, TranslationKey } from './types'

const translations: { [locale in Locale]: Translation } = { en, fr, de, it }
export type TranslationParams = { [key: string]: string | number }

export const translate = derived(
  currentLocale,
  locale => (key: TranslationKey, params?: TranslationParams) =>
    translateWithLocale(key, locale, params),
)

function getMessage(locale: Locale, key: TranslationKey): string | undefined {
  let message: unknown = translations[locale]
  for (const part of key.split('.')) {
    if (!message || typeof message !== 'object') return undefined
    message = (message as { [key: string]: unknown })[part]
  }
  return typeof message === 'string' ? message : undefined
}

function interpolate(message: string, params?: TranslationParams) {
  if (!params) return message
  return message.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) =>
    params[name] === undefined ? match : String(params[name]),
  )
}

function translateWithLocale(
  key: TranslationKey,
  locale: Locale,
  params?: TranslationParams,
): string {
  return interpolate(
    getMessage(locale, key) ?? getMessage('en', key) ?? key,
    params,
  )
}

export function t(key: TranslationKey, params?: TranslationParams): string {
  return translateWithLocale(key, get(currentLocale), params)
}

export function getCurrentLocale(): Locale {
  return get(currentLocale)
}
