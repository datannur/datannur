import type { LanguageOption, Locale } from './types'

const supportedLocales: Locale[] = ['en', 'fr', 'de', 'it']

type LocaleDocument = {
  querySelector(
    selector: string,
  ): { getAttribute(name: string): string | null } | null
}

const dateLocales: { [locale in Locale]: string } = {
  en: 'en',
  fr: 'fr-CH',
  de: 'de-CH',
  it: 'it-CH',
}

export function getDateLocale(locale: Locale): string {
  return dateLocales[locale]
}

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

export function getDocumentLocale(
  document: LocaleDocument,
): Locale | undefined {
  const value = document
    .querySelector('meta[name="datannur-locale"]')
    ?.getAttribute('content')
  return isLocale(value) ? value : undefined
}

export function resolveLocale(
  option: unknown,
  urlLang: unknown,
  documentLocale: unknown,
  languages: readonly string[],
): Locale {
  if (isLocale(urlLang)) return urlLang
  if (isLocale(option)) return option
  if (isLocale(documentLocale)) return documentLocale
  if (option === undefined || option === 'auto')
    return getBrowserLocale(languages)
  return 'en'
}

export function getLocalePath(pathname: string, locale: Locale): string {
  const segments = pathname.split('/')
  const localeIndex = segments.findIndex(segment => isLocale(segment))
  if (localeIndex < 0) return pathname
  segments[localeIndex] = locale
  return segments.join('/') || '/'
}
