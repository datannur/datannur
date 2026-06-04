import Options from '@lib/options'
import { UrlParam } from '@lib/url'
import {
  getDocumentLocale,
  getLocalePath,
  isLanguageOption,
  resolveLocale,
} from './locale'
import { currentLocale } from './state'
import { getCurrentLocale, t, translate } from './messages'
import type { LanguageOption } from './types'

export { currentLocale, getCurrentLocale, t, translate }

const languageCookieName = 'datannur-lang'

function setLanguageCookie(language: LanguageOption) {
  if (language === 'auto') {
    document.cookie = `${languageCookieName}=; Path=/; SameSite=Lax; Max-Age=0`
    return
  }
  document.cookie = `${languageCookieName}=${language}; Path=/; SameSite=Lax; Max-Age=31536000`
}

export function initI18n(): Promise<void> {
  return Options.loaded.then(() => {
    const option = Options.get('language')
    if (!isLanguageOption(option)) {
      Options.set('language', 'auto')
    }
    currentLocale.set(
      resolveLocale(
        Options.get('language'),
        UrlParam.get('lang'),
        getDocumentLocale(document),
        navigator.languages,
      ),
    )
  })
}

export function setLanguageOption(language: LanguageOption) {
  setLanguageCookie(language)
  Options.set('language', language, () => {
    if (language !== 'auto') {
      const localePath = getLocalePath(window.location.pathname, language)
      if (localePath !== window.location.pathname) {
        window.location.assign(
          `${window.location.origin}${localePath}${window.location.search}${window.location.hash}`,
        )
        return
      }
    }
    window.location.reload()
  })
  UrlParam.delete('lang')
}
