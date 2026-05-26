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

function setTransitionOrigin(element?: HTMLElement) {
  const bounds = element?.getBoundingClientRect()
  if (!bounds) {
    return
  }

  document.documentElement.style.setProperty(
    '--dark-mode-transition-x',
    `${bounds.left + bounds.width / 2}px`,
  )
  document.documentElement.style.setProperty(
    '--dark-mode-transition-y',
    `${bounds.top + bounds.height / 2}px`,
  )
}

function clearTransitionOrigin() {
  document.documentElement.style.removeProperty('--dark-mode-transition-x')
  document.documentElement.style.removeProperty('--dark-mode-transition-y')
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

  static toggle(transitionElement?: HTMLElement) {
    const updateTheme = () => {
      document.documentElement.classList.toggle('dark-mode')
      darkModeTheme.update(theme => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        Options.set('darkMode', newTheme)
        setThemeColor()
        return newTheme
      })
    }

    if (!document.startViewTransition) {
      updateTheme()
      return
    }

    setTransitionOrigin(transitionElement)
    document
      .startViewTransition(updateTheme)
      .finished.finally(clearTransitionOrigin)
  }
}
