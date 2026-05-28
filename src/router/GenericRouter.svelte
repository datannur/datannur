<script lang="ts" generics="T extends string">
  import { tick, untrack } from 'svelte'
  import type { Component } from 'svelte'
  import type { Match } from 'navigo'
  import { router } from './router.svelte'
  import { registerRoutes, type RouterIndex } from './router-registration'
  import {
    getInitialPage,
    getInitialComponent,
    updateRouteComponent,
  } from './router-helpers'
  import {
    isStaticMode,
    isSsgRendering,
    useCleanRouting,
    getAppBasePath,
    setAppBasePathForPage,
    setAppBasePathForRoutes,
  } from '@lib/url'
  import {
    currentRoute,
    page,
    pageContentLoaded,
    pageLoadedRoute,
  } from './router-store'

  interface Props<T extends string> {
    routerIndex: RouterIndex
    whenAppReady: Promise<void>
    onRouteChange?: (ctx: {
      entity: T
      params: Record<string, unknown>
      entityId: string
    }) => void
    getEntityData?: (entity: string, id: string) => unknown
    errorPage?: T
    loadingPage?: T
  }

  let {
    routerIndex: routerIndexProp,
    whenAppReady: whenAppReadyProp,
    onRouteChange,
    getEntityData,
    errorPage = '_error' as T,
    loadingPage: loadingPageProp = '_loading' as T,
  }: Props<T> = $props()

  const routerIndex = untrack(() => routerIndexProp)
  const whenAppReady = untrack(() => whenAppReadyProp)
  const loadingPage = untrack(() => loadingPageProp)

  setAppBasePathForRoutes(Object.keys(routerIndex))
  router.root = useCleanRouting ? getAppBasePath() : '/'

  let entityGlobal = $state('')
  let params = $state({})
  let entityId = $state('')
  let reloadIncrement = $state(0)
  let pageKey = $derived(`${entityGlobal}___${entityId}___${reloadIncrement}`)
  let routerInitialized = $state(false)
  let lastRouteKey = ''

  const initialPage = getInitialPage(routerIndex, loadingPage)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let route = $state<Component<any>>(
    getInitialComponent(routerIndex, initialPage, loadingPage),
  )

  if (isStaticMode && !isSsgRendering) {
    whenAppReady.then(() => {
      if (initialPage !== loadingPage && initialPage in routerIndex) {
        route = routerIndex[initialPage].component
      }
    })
  }

  function updateRoute(
    entity: T,
    newParams: Record<string, unknown> | null = null,
  ) {
    if (newParams) params = newParams
    pageContentLoaded.set(false)
    const routeKey = entityId ? `${entity}___${entityId}` : entity
    const shouldScrollToTop = lastRouteKey !== '' && lastRouteKey !== routeKey
    lastRouteKey = routeKey

    route = updateRouteComponent(
      routerIndex,
      entity,
      initialPage,
      routerInitialized,
      route,
    )

    page.set(entity)
    currentRoute.set(routeKey)

    if (shouldScrollToTop) {
      tick().then(() => window.scrollTo({ top: 0, left: 0 }))
    }

    setTimeout(() => {
      const route = window.location.hash
        ? (window.location.hash.split('#/')[1]?.split('?')[0] ?? '')
        : window.location.pathname.substring(1)
      pageLoadedRoute.set(route.replace(/\//g, '___'))
    }, 1)
  }

  function setRoute(entity: T) {
    return async (ctx?: Match) => {
      if (routerInitialized || !isStaticMode) {
        if (loadingPage in routerIndex) {
          route = routerIndex[loadingPage].component
        }
        params = {}
        entityId = ''
      }

      window.document.body.setAttribute('page', entity)
      setAppBasePathForPage(entity)

      if (!routerInitialized) {
        await whenAppReady
        routerInitialized = true
      }

      if (!ctx?.data) {
        if (!ctx) return
        ctx.data = {}
      }

      if (ctx.data.id === undefined) {
        if (ctx.data[0]) ctx.data = {}
        updateRoute(entity, ctx.data)
        onRouteChange?.({ entity, params: ctx.data, entityId: '' })
        return
      }

      entityId = ctx.data.id
      const entityData = getEntityData?.(entity, entityId)
      if (entityData) {
        updateRoute(entity, { [entity]: entityData, id: entityId })
        onRouteChange?.({
          entity,
          params: { [entity]: entityData, id: entityId },
          entityId,
        })
      } else {
        updateRoute(errorPage, { entity })
        onRouteChange?.({ entity: errorPage, params: { entity }, entityId: '' })
      }
    }
  }

  registerRoutes(router, routerIndex, entityName => setRoute(entityName as T))

  // Expose reload function globally for router.svelte.ts
  router.incrementReload = () => {
    reloadIncrement++
  }

  const SvelteComponent = $derived(route)
  const useKey = $derived(routerInitialized || !isStaticMode)
</script>

{#if useKey}
  {#key pageKey}
    <SvelteComponent {...params} />
  {/key}
{:else}
  <SvelteComponent {...params} />
{/if}

{#await whenAppReady then}
  <div id="db-loaded" style="display: none;"></div>
{/await}
<div id="page-loaded-route-{$pageLoadedRoute}" style="display: none;"></div>
