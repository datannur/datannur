import { isStaticMode, isSsgRendering } from '@lib/url'
import type { RouterIndex } from './router-registration'
import type { Component } from 'svelte'

/**
 * Get the initial page name based on static mode and body attribute
 */
export function getInitialPage<T extends string>(
  routerIndex: RouterIndex,
  loadingPageName: T,
): T {
  if (isStaticMode) {
    const bodyPage = document.body.getAttribute('page')
    if (bodyPage && bodyPage in routerIndex) {
      return bodyPage as T
    }
  }
  return loadingPageName
}

/**
 * Get the initial component to render based on static mode and SSG rendering
 * In static mode (not SSG), start with _loading to avoid flash, then hydrate to actual page
 */
export function getInitialComponent<T extends string>(
  routerIndex: RouterIndex,
  initialPage: T,
  loadingPageName: T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Component<any> {
  if (isStaticMode && !isSsgRendering) {
    return routerIndex[loadingPageName].component
  }
  return routerIndex[initialPage].component
}

/**
 * Update route with hydration-aware component loading
 * In static mode before first navigation, skip component reload for hydration
 */
export function updateRouteComponent<T extends string>(
  routerIndex: RouterIndex,
  entity: T,
  initialPage: T,
  routerInitialized: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentRoute: Component<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Component<any> {
  // In static mode before first navigation, don't reload the component (for hydration)
  if (isStaticMode && !routerInitialized && entity === initialPage) {
    return currentRoute
  }
  // Normal route change: load new component
  return routerIndex[entity].component
}
