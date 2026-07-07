import { describe, expect, it } from 'vitest'
import {
  getBrowserLocale,
  getDocumentLocale,
  getLocalePath,
  resolveLocale,
} from '@i18n/locale'
import { t } from '@i18n/messages'
import { currentLocale } from '@i18n/state'
import { en } from '@i18n/en'
import { fr } from '@i18n/fr'
import { de } from '@i18n/de'

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
    expect(getBrowserLocale(['de-DE', 'en-GB'])).toBe('de')
    expect(getBrowserLocale(['de-DE'])).toBe('de')
    expect(getBrowserLocale(['it-IT', 'en-GB'])).toBe('en')
    expect(getBrowserLocale(['it-IT'])).toBe('en')
  })

  it('should resolve locale precedence', () => {
    const browserLanguages = ['fr-FR']

    expect(resolveLocale('fr', false, undefined, browserLanguages)).toBe('fr')
    expect(resolveLocale('fr', 'en', 'fr', browserLanguages)).toBe('en')
    expect(resolveLocale('fr', false, 'en', browserLanguages)).toBe('fr')
    expect(resolveLocale('auto', false, 'en', browserLanguages)).toBe('en')
    expect(resolveLocale('auto', false, undefined, browserLanguages)).toBe('fr')
    expect(resolveLocale(undefined, false, undefined, browserLanguages)).toBe(
      'fr',
    )
    expect(
      resolveLocale('unsupported', false, undefined, browserLanguages),
    ).toBe('en')
  })

  it('should read supported locale metadata from static HTML', () => {
    const document = {
      querySelector: () => ({ getAttribute: () => 'fr' }),
    }
    const germanDocument = {
      querySelector: () => ({ getAttribute: () => 'de' }),
    }
    const unsupportedDocument = {
      querySelector: () => ({ getAttribute: () => 'it' }),
    }
    const documentWithoutLocale = {
      querySelector: () => null,
    }

    expect(getDocumentLocale(document)).toBe('fr')
    expect(getDocumentLocale(germanDocument)).toBe('de')
    expect(getDocumentLocale(unsupportedDocument)).toBeUndefined()
    expect(getDocumentLocale(documentWithoutLocale)).toBeUndefined()
  })

  it('should replace locale path segments', () => {
    expect(getLocalePath('/fr/tag/data_protection', 'en')).toBe(
      '/en/tag/data_protection',
    )
    expect(getLocalePath('/datannur/fr/tag/data_protection', 'en')).toBe(
      '/datannur/en/tag/data_protection',
    )
    expect(getLocalePath('/tag/data_protection', 'fr')).toBe(
      '/tag/data_protection',
    )
  })

  it('should keep french translations structurally complete', () => {
    expect(getTranslationKeys(fr).sort()).toEqual(getTranslationKeys(en).sort())
  })

  it('should keep german translations structurally complete', () => {
    expect(getTranslationKeys(de).sort()).toEqual(getTranslationKeys(en).sort())
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
    expect(en.home.title).toBe('datannur | Home')
    expect(fr.home.title).toBe('datannur | Accueil')
    expect(en.error.item.page).toBe('The page')
    expect(fr.error.item.page).toBe('La page')
    expect(en.error.missingSuffix).toBe('does not exist')
    expect(fr.error.missingSuffix).toBe("n'existe pas")
  })

  it('should interpolate translation placeholders', () => {
    currentLocale.set('fr')
    expect(t('checkDb.issueSummaryMany', { count: 3 })).toBe(
      "3 types d'anomalie détectés.",
    )
    currentLocale.set('en')
    expect(t('checkDb.issueSummaryMany', { count: 3 })).toBe(
      '3 issue types detected.',
    )
  })
})
