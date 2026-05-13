import { mount, hydrate } from 'svelte'
import type { Component } from 'svelte'
import { isStaticMode, isSsgRendering } from '@lib/url'

export function removeStaticOnlyHeadElements() {
  ;[
    'meta[name="description"]',
    'link[rel="shortcut icon"]',
    'link[rel="manifest"]',
  ].forEach(el => document.querySelector(el)?.remove())
}

export async function bootstrapApp(
  AppComponent: Component,
  targetId = 'app',
  initFn?: () => Promise<void>,
) {
  const target = document.getElementById(targetId)
  if (!target) {
    throw new Error(`Could not find target element with id '${targetId}'`)
  }

  const hasStaticContent = target.children.length > 0

  removeStaticOnlyHeadElements()

  if (isStaticMode && hasStaticContent) {
    if (!isSsgRendering && initFn) {
      try {
        await initFn()
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }

    return hydrate(AppComponent, { target })
  } else {
    target.innerHTML = ''
    return mount(AppComponent, { target })
  }
}
