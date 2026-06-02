import type { LanguageOption, Locale } from './types'

const supportedLocales: Locale[] = ['en', 'fr']

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && supportedLocales.includes(value as Locale)
}

export function isLanguageOption(value: unknown): value is LanguageOption {
  return value === 'auto' || isLocale(value)
}

export function getBrowserLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const locale = language.toLowerCase().split('-')[0]
    if (isLocale(locale)) return locale
  }
  return 'en'
}

export function resolveLocale(
  option: unknown,
  urlLang: unknown,
  languages: readonly string[],
): Locale {
  if (isLocale(urlLang)) return urlLang
  if (isLocale(option)) return option
  if (option === undefined || option === 'auto')
    return getBrowserLocale(languages)
  return 'en'
}
