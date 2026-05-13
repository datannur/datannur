import { writable } from 'svelte/store'

export const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')

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
}
