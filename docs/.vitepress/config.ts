import { defineConfig } from 'vitepress'
import type { DefaultTheme } from 'vitepress'

type LocaleText = {
  label: string
  lang: string
  description: string
  websiteUrl: string
  sidebar: [string, string, string, string, string, string, string]
  editLinkText: string
  lastUpdatedText: string
  outlineLabel: string
  docFooter: { prev: string; next: string }
  searchButton: string
  searchNoResults: string
  searchReset: string
  searchSelect: string
  searchNavigate: string
  searchClose: string
}

const localeTexts: { [key: string]: LocaleText } = {
  root: {
    label: 'English',
    lang: 'en-US',
    description: 'Portable client-side data catalog',
    websiteUrl: 'https://datannur.com',
    sidebar: [
      'Getting Started',
      'Installing on Your Computer',
      'Managing the App',
      'Managing Your Data',
      'Publishing Online',
      'APIs & Interoperability',
      'Advanced Configuration',
    ],
    editLinkText: 'Edit this page on GitHub',
    lastUpdatedText: 'Last updated',
    outlineLabel: 'On this page',
    docFooter: { prev: 'Previous page', next: 'Next page' },
    searchButton: 'Search',
    searchNoResults: 'No results for',
    searchReset: 'Reset search',
    searchSelect: 'to select',
    searchNavigate: 'to navigate',
    searchClose: 'to close',
  },
  fr: {
    label: 'Français',
    lang: 'fr-FR',
    description: 'Catalogue de données portable, côté client',
    websiteUrl: 'https://datannur.com/fr/',
    sidebar: [
      'Premiers pas',
      'Installation sur votre ordinateur',
      "Gérer l'application",
      'Gérer vos données',
      'Publication en ligne',
      'API et interopérabilité',
      'Configuration avancée',
    ],
    editLinkText: 'Modifier cette page sur GitHub',
    lastUpdatedText: 'Dernière mise à jour',
    outlineLabel: 'Sur cette page',
    docFooter: { prev: 'Page précédente', next: 'Page suivante' },
    searchButton: 'Rechercher',
    searchNoResults: 'Aucun résultat pour',
    searchReset: 'Réinitialiser la recherche',
    searchSelect: 'pour sélectionner',
    searchNavigate: 'pour naviguer',
    searchClose: 'pour fermer',
  },
  de: {
    label: 'Deutsch',
    lang: 'de-DE',
    description: 'Portabler clientseitiger Datenkatalog',
    websiteUrl: 'https://datannur.com/de/',
    sidebar: [
      'Erste Schritte',
      'Installation auf Ihrem Computer',
      'Die App verwalten',
      'Ihre Daten verwalten',
      'Online veröffentlichen',
      'APIs & Interoperabilität',
      'Erweiterte Konfiguration',
    ],
    editLinkText: 'Diese Seite auf GitHub bearbeiten',
    lastUpdatedText: 'Zuletzt aktualisiert',
    outlineLabel: 'Auf dieser Seite',
    docFooter: { prev: 'Vorherige Seite', next: 'Nächste Seite' },
    searchButton: 'Suchen',
    searchNoResults: 'Keine Ergebnisse für',
    searchReset: 'Suche zurücksetzen',
    searchSelect: 'auswählen',
    searchNavigate: 'navigieren',
    searchClose: 'schliessen',
  },
  it: {
    label: 'Italiano',
    lang: 'it-IT',
    description: 'Catalogo di dati portabile, lato client',
    websiteUrl: 'https://datannur.com/it/',
    sidebar: [
      'Per iniziare',
      'Installazione sul computer',
      "Gestire l'app",
      'Gestire i dati',
      'Pubblicazione online',
      'API e interoperabilità',
      'Configurazione avanzata',
    ],
    editLinkText: 'Modifica questa pagina su GitHub',
    lastUpdatedText: 'Ultimo aggiornamento',
    outlineLabel: 'In questa pagina',
    docFooter: { prev: 'Pagina precedente', next: 'Pagina successiva' },
    searchButton: 'Cerca',
    searchNoResults: 'Nessun risultato per',
    searchReset: 'Reimposta la ricerca',
    searchSelect: 'per selezionare',
    searchNavigate: 'per navigare',
    searchClose: 'per chiudere',
  },
}

const pageSlugs = [
  '',
  'install',
  'app',
  'data',
  'deployment',
  'integrations',
  'configuration',
]

function localeConfig(key: string, text: LocaleText) {
  const prefix = key === 'root' ? '/' : `/${key}/`
  return {
    label: text.label,
    lang: text.lang,
    description: text.description,
    themeConfig: {
      nav: [
        { text: 'Website', link: text.websiteUrl },
        { text: 'Demo', link: 'https://dev.datannur.com/' },
        { text: 'Builder docs', link: 'https://docs.datannur.com/builder/' },
      ],
      sidebar: text.sidebar.map((label, index) => ({
        text: label,
        link: `${prefix}${pageSlugs[index]}`,
      })),
      editLink: {
        pattern: 'https://github.com/datannur/datannur/edit/main/docs/:path',
        text: text.editLinkText,
      },
      lastUpdated: { text: text.lastUpdatedText },
      outline: { label: text.outlineLabel },
      docFooter: text.docFooter,
    },
  }
}

function searchLocale(text: LocaleText): DefaultTheme.LocalSearchOptions {
  return {
    translations: {
      button: {
        buttonText: text.searchButton,
        buttonAriaLabel: text.searchButton,
      },
      modal: {
        noResultsText: text.searchNoResults,
        resetButtonTitle: text.searchReset,
        footer: {
          selectText: text.searchSelect,
          navigateText: text.searchNavigate,
          closeText: text.searchClose,
        },
      },
    },
  }
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'datannur app docs',
  description: 'Portable client-side data catalog',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,

  // Deployed under https://docs.datannur.com/app/
  base: '/app/',

  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/app/icon.ico',
      },
    ],
  ],

  locales: Object.fromEntries(
    Object.entries(localeTexts).map(([key, text]) => [
      key,
      localeConfig(key, text),
    ]),
  ),

  themeConfig: {
    logo: '/icon.svg',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/datannur/datannur' },
    ],

    search: {
      provider: 'local',
      options: {
        locales: Object.fromEntries(
          Object.entries(localeTexts).map(([key, text]) => [
            key,
            searchLocale(text),
          ]),
        ),
      },
    },
  },
})
