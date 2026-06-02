import { describe, expect, it } from 'vitest'
import { getBrowserLocale, resolveLocale } from '@i18n/locale'
import { en } from '@i18n/en'
import { fr } from '@i18n/fr'

function getTranslationKeys(
  value: { readonly [key: string]: unknown },
  prefix = '',
): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof child === 'string') return [path]
    if (child && typeof child === 'object') {
      return getTranslationKeys(
        child as { readonly [key: string]: unknown },
        path,
      )
    }
    return []
  })
}

describe('i18n', () => {
  it('should resolve supported browser languages', () => {
    expect(getBrowserLocale(['fr-CA', 'en-US'])).toBe('fr')
    expect(getBrowserLocale(['de-DE', 'en-GB'])).toBe('en')
    expect(getBrowserLocale(['de-DE'])).toBe('en')
  })

  it('should resolve locale precedence', () => {
    const browserLanguages = ['fr-FR']

    expect(resolveLocale('fr', false, browserLanguages)).toBe('fr')
    expect(resolveLocale('fr', 'en', browserLanguages)).toBe('en')
    expect(resolveLocale('auto', false, browserLanguages)).toBe('fr')
    expect(resolveLocale(undefined, false, browserLanguages)).toBe('fr')
    expect(resolveLocale('unsupported', false, browserLanguages)).toBe('en')
  })

  it('should keep french translations structurally complete', () => {
    expect(getTranslationKeys(fr).sort()).toEqual(getTranslationKeys(en).sort())
  })

  it('should translate representative UI labels', () => {
    expect(en.entity.organization).toBe('Organization')
    expect(fr.entity.organization).toBe('Organisation')
    expect(en.entityPlural.organization).toBe('Organizations')
    expect(fr.entityPlural.organization).toBe('Organisations')
    expect(en.search.placeholder).toBe('Search...')
    expect(fr.search.placeholder).toBe('Rechercher...')
    expect(en.nav.context).toBe('Context')
    expect(fr.nav.context).toBe('Contexte')
    expect(en.footer.updated).toBe('updated')
    expect(fr.footer.updated).toBe('actualisé')
  })
})
