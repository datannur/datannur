import type Navigo from 'navigo'
import type { Component } from 'svelte'
import type { Match } from 'navigo'
import { isSpaHomepage } from '@lib/url'

export type RouteHandler = (ctx?: Match) => Promise<void> | void

export type RouteProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: Component<any>
  param?: string
}

export type RouterIndex = {
  [key: string]: RouteProps
}

export function registerRoutes(
  router: Navigo,
  routerIndex: RouterIndex,
  createRouteHandler: (entityName: string) => RouteHandler,
) {
  // Register homepage route
  if ('_index' in routerIndex) {
    router.on('/', createRouteHandler('_index'))
  }

  // Register all entity routes (datasets, folders, etc.)
  for (const [entityName, props] of Object.entries(routerIndex)) {
    if (['_index', '_error', '_loading'].includes(entityName)) continue

    const routeUrl =
      'param' in props ? `/${entityName}/:${props.param}` : `/${entityName}`

    router.on(routeUrl, createRouteHandler(entityName))
  }

  // Register 404 error handler
  if ('_error' in routerIndex) {
    router.notFound(createRouteHandler('_error'), {
      before: (done: unknown) => {
        if (isSpaHomepage()) router.resolve('/')
        ;(done as () => void)()
      },
    })
  }

  // Start router
  if (isSpaHomepage()) router.resolve('/')
  else router.resolve()
}
