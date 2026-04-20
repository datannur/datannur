import { writable } from 'svelte/store'
import Options from '@lib/options'

const colorSchemeDark = '(prefers-color-scheme: dark)'
type Theme = 'dark' | 'light'

const isSystemDark = window.matchMedia(colorSchemeDark).matches
const defaultTheme: Theme = isSystemDark ? 'dark' : 'light'
export const darkModeTheme = writable(defaultTheme)

function setThemeColor() {
  const themeColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--background-1')
    .trim()

  if (!themeColor) {
    return
  }

  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute('content', themeColor)
}

export class DarkMode {
  static init() {
    Options.loaded.then(() => {
      let theme: Theme = 'light'
      if (defaultTheme === 'dark') {
        document.documentElement.classList.add('dark-mode')
        theme = 'dark'
      }
      if (Options.get('darkMode') === 'dark') {
        document.documentElement.classList.add('dark-mode')
        theme = 'dark'
      } else if (Options.get('darkMode') === 'light') {
        document.documentElement.classList.remove('dark-mode')
        theme = 'light'
      }
      setThemeColor()
      darkModeTheme.set(theme)
    })
  }

  static toggle() {
    document.documentElement.classList.toggle('dark-mode')
    darkModeTheme.update(theme => {
      const newTheme = theme === 'dark' ? 'light' : 'dark'
      Options.set('darkMode', newTheme)
      setThemeColor()
      return newTheme
    })
  }
}
