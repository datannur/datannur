import { writable } from 'svelte/store'

export const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')

const datannurShellParam = 'datannur_shell'
const desktopAppShell = 'desktop_app'
const desktopAppShellStorageKey = 'datannur.shell'
const fullscreenDisplayModeQuery = '(display-mode: fullscreen)'
const fullscreenDisplayMode = window.matchMedia(fullscreenDisplayModeQuery)

function getInitialDesktopAppShell() {
  const url = new URL(window.location.href)
  const fromParam = url.searchParams.get(datannurShellParam) === desktopAppShell
  if (fromParam) {
    sessionStorage.setItem(desktopAppShellStorageKey, desktopAppShell)
    url.searchParams.delete(datannurShellParam)
    window.history.replaceState(null, '', url.toString())
  }
  return (
    fromParam ||
    sessionStorage.getItem(desktopAppShellStorageKey) === desktopAppShell
  )
}

export const isDesktopAppShell = getInitialDesktopAppShell()

function getIsFullscreen() {
  return Boolean(document.fullscreenElement) || fullscreenDisplayMode.matches
}

export const isFullscreen = writable(getIsFullscreen())

function getDocumentWidth() {
  return (
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth
  )
}

export const documentWidth = getDocumentWidth()

export function getIsMobile() {
  return getDocumentWidth() < 600
}

export const isMobile = getIsMobile()

export function getIsSmallMenu() {
  return getDocumentWidth() < 1023
}

export const isSmallMenu = writable(getIsSmallMenu())

export const hasTouchScreen =
  'ontouchstart' in window || navigator.maxTouchPoints > 0

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    isSmallMenu.set(getIsSmallMenu())
  })

  const updateFullscreen = () => isFullscreen.set(getIsFullscreen())

  document.addEventListener('fullscreenchange', updateFullscreen)
  fullscreenDisplayMode.addEventListener('change', updateFullscreen)
}
