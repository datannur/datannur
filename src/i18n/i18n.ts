import { derived, get, writable } from 'svelte/store'
import Options from '@lib/options'
import { UrlParam } from '@lib/url'
import { en } from './en'
import { fr } from './fr'
import { isLanguageOption, resolveLocale } from './locale'
import type {
  LanguageOption,
  Locale,
  Translation,
  TranslationKey,
} from './types'

const translations: { [locale in Locale]: Translation } = { en, fr }

export const currentLocale = writable<Locale>('en')
export const translate = derived(
  currentLocale,
  locale => (key: TranslationKey) => t(key, locale),
)

function getMessage(locale: Locale, key: TranslationKey): string | undefined {
  let message: unknown = translations[locale]
  for (const part of key.split('.')) {
    if (!message || typeof message !== 'object') return undefined
    message = (message as { [key: string]: unknown })[part]
  }
  return typeof message === 'string' ? message : undefined
}

export function initI18n() {
  Options.loaded.then(() => {
    const option = Options.get('language')
    if (!isLanguageOption(option)) {
      Options.set('language', 'auto')
    }
    currentLocale.set(
      resolveLocale(
        Options.get('language'),
        UrlParam.get('lang'),
        navigator.languages,
      ),
    )
  })
}

export function setLanguageOption(language: LanguageOption) {
  Options.set('language', language)
  UrlParam.delete('lang')
  currentLocale.set(resolveLocale(language, false, navigator.languages))
}

export function t(key: TranslationKey, locale = get(currentLocale)): string {
  return getMessage(locale, key) ?? getMessage('en', key) ?? key
}
