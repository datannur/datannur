const staticRender = 'static_render'
const checkDb = 'check_db'
const spa = 'spa'
const appModeParam = 'app_mode'
const staticMetaSelector = 'meta[app-mode="static"]'
const cleanRoutingMetaSelector = 'meta[app-routing="clean"]'
const cleanRoutingCookie = 'datannur-routing=clean'
const hashPrefix = '#/'
const defaultHash = 'homepage'
const indexPage = '_index'
const supportedLocaleSegments = ['en', 'fr', 'de', 'it']

function stripLocaleSegment(path: string) {
  const segments = path.split('/').filter(Boolean)
  const localeIndex = segments.findIndex(segment =>
    supportedLocaleSegments.includes(segment),
  )
  if (localeIndex >= 0) return segments.slice(localeIndex + 1).join('/')
  return segments.join('/')
}

function getLocaleBasePath() {
  const segments = window.location.pathname.split('/').filter(Boolean)
  const localeIndex = segments.findIndex(segment =>
    supportedLocaleSegments.includes(segment),
  )
  if (localeIndex < 0) return undefined
  return '/' + segments.slice(0, localeIndex + 1).join('/') + '/'
}

export class UrlParam {
  static getAppMode() {
    return appMode
  }

  static get(key: string) {
    let hash = window.location.hash
    if (appMode === staticRender) hash = window.location.search
    if (!hash.includes('?')) {
      hash = window.location.search
      if (!hash.includes('?')) return false
    }
    const paramsString = hash.split('?')[1]
    if (!paramsString) return false
    const urlParams = new URLSearchParams(paramsString)
    return urlParams.get(key)
  }

  static set(key: string, value: string | null) {
    this.edit(key, value, 'set')
  }

  static delete(key: string) {
    this.edit(key, null, 'delete')
  }

  static reset() {
    const loc = window.location
    const hash = this.computeHash(loc, new URLSearchParams())
    const url = loc.protocol + '//' + loc.host + loc.pathname + hash
    window.history.replaceState(null, '', url)
  }

  static edit(key: string, value: string | null, mode: 'set' | 'delete') {
    const loc = window.location
    const paramsString = loc.href.split('?')[1]
    const params = new URLSearchParams(paramsString)
    if (mode === 'set') {
      params.set(key, String(value))
    } else if (mode === 'delete') {
      params.delete(key)
    }
    const hash = this.computeHash(loc, params)
    const url = loc.protocol + '//' + loc.host + loc.pathname + hash
    let urlWithParams = url
    if (params.toString() !== '') {
      urlWithParams += '?' + params.toString()
    }
    window.history.replaceState(null, '', urlWithParams)
  }

  private static computeHash(loc: Location, params: URLSearchParams): string {
    if (appMode === staticRender || useCleanRouting) return ''
    let hash = loc.hash.split('?')[0]
    if (hash === '' && params.toString() !== '') {
      hash = hashPrefix
    }
    if (hash === hashPrefix && params.toString() === '') return ''
    return hash
  }

  static getAllParams() {
    let hash = window.location.hash
    if (appMode === staticRender) hash = window.location.search
    if (!hash.includes('?')) {
      hash = window.location.search
      if (!hash.includes('?')) return {}
    }
    const paramsString = hash.split('?')[1]
    const urlParams = new URLSearchParams(paramsString)
    const paramsObj: Record<string, string> = {}
    urlParams.forEach((value, key) => {
      paramsObj[key] = value
    })
    return paramsObj
  }
}

export class UrlHash {
  static default = defaultHash

  static getAll() {
    let hash = window.location.hash
    if (UrlParam.getAppMode() === staticRender) {
      hash = stripLocaleSegment(window.location.pathname)
    }
    if (hash.includes(hashPrefix)) {
      hash = hash?.split(hashPrefix)[1]
    }
    hash = hash?.split('?')[0]
    if (!hash || hash === '') return this.default
    return hash
  }

  static getLevel1() {
    const hash = this.getAll()
    return hash.split('/')[0]
  }

  static getLevel2() {
    const hash = this.getAll()
    if (hash.split('/').length < 2) return ''
    return hash.split('/')[1]
  }
}

let appMode = spa
const urlAppMode = UrlParam.get(appModeParam)

if (urlAppMode === checkDb) {
  appMode = checkDb
} else if (urlAppMode === staticRender) {
  appMode = staticRender
} else if (document.querySelector(staticMetaSelector)) {
  appMode = staticRender
}

export { appMode }

export const isHttp = window.location.protocol.startsWith('http')
export const useCleanRouting =
  appMode === staticRender ||
  Boolean(document.querySelector(cleanRoutingMetaSelector)) ||
  document.cookie.split('; ').includes(cleanRoutingCookie)

export const isSsgRendering =
  new URLSearchParams(window.location.search).get(appModeParam) === staticRender

export const isStaticMode = Boolean(document.querySelector(staticMetaSelector))
const staticAssetBasePath = isHttp ? computeAssetBasePath() : undefined
let currentAppBasePath = computeAppBasePath()

export const appBasePath = currentAppBasePath

export function getAppBasePath() {
  return currentAppBasePath
}

export function getPackageBasePath() {
  const pathSegments = window.location.pathname.split('/').filter(Boolean)
  const localeIndex = pathSegments.findIndex(segment =>
    supportedLocaleSegments.includes(segment),
  )
  const packageSegments =
    localeIndex >= 0
      ? pathSegments.slice(0, localeIndex)
      : getAppBasePath().split('/').filter(Boolean)
  return packageSegments.length === 0
    ? '/'
    : '/' + packageSegments.join('/') + '/'
}

export function setAppBasePathForPage(pageName: string) {
  const pageBasePath = computePageBasePath(pageName)
  if (pageBasePath) currentAppBasePath = pageBasePath
}

export function setAppBasePathForRoutes(routeNames: string[]) {
  const routeBasePath = computeRouteBasePath(routeNames)
  if (routeBasePath) currentAppBasePath = routeBasePath
}

function computeAppBasePath(pageName = document.body.getAttribute('page')) {
  if (!isHttp) return '/'

  return (
    computePageBasePath(pageName) ??
    getLocaleBasePath() ??
    staticAssetBasePath ??
    getDirectoryBasePath()
  )
}

function computePageBasePath(pageName: string | null) {
  if (!pageName || pageName === indexPage) return undefined
  return computeRouteBasePath([pageName])
}

function computeRouteBasePath(routeNames: string[]) {
  const segments = window.location.pathname.split('/').filter(Boolean)
  const routeIndex = segments.findIndex(segment => routeNames.includes(segment))
  if (routeIndex < 0) return undefined

  const baseSegments = segments.slice(0, routeIndex)
  return baseSegments.length === 0 ? '/' : '/' + baseSegments.join('/') + '/'
}

function getDirectoryBasePath() {
  return window.location.pathname.endsWith('/') ? window.location.pathname : '/'
}

function computeAssetBasePath() {
  const asset = document.querySelector<HTMLScriptElement | HTMLLinkElement>(
    'script[src*="/app/assets/"], link[rel="stylesheet"][href*="/app/assets/"]',
  )
  const assetUrl = asset instanceof HTMLScriptElement ? asset.src : asset?.href
  if (!assetUrl) return undefined

  const assetPath = new URL(assetUrl, window.location.href).pathname
  const assetPathStart = assetPath.indexOf('/app/assets/')
  return assetPathStart < 0 ? undefined : assetPath.slice(0, assetPathStart + 1)
}

const urlPrefix = (() => {
  if (appMode === staticRender) return ''
  return '#'
})()

export function getLinkUrl(href: string) {
  const cleanHref = href.replace(/^\/+/, '')
  if (appMode === staticRender) {
    if (!isHttp) return href
    if (isSsgRendering) return getSsgRelativeLinkUrl(cleanHref)
    return getAppBasePath() + cleanHref
  }

  if (useCleanRouting) return getAppBasePath() + cleanHref
  if (!href || href === '/') return ''
  return `${urlPrefix}/${cleanHref}`
}

function getSsgRelativeLinkUrl(cleanHref: string) {
  const routeDepth = window.location.pathname.split('/').filter(Boolean).length
  const prefix = routeDepth > 1 ? '../'.repeat(routeDepth - 1) : ''
  return prefix + cleanHref
}

export function link(href: string, content: string, entity = '') {
  const url = getLinkUrl(href)
  const onclick = `window.goToHref(event, '${href}')`
  let specialClass = ''
  if (entity) {
    specialClass = `class="color-entity-${entity}"`
  }
  return `<a href="${url}" onclick="${onclick}" ${specialClass}>${content}</a>`
}

export function isSpaHomepage() {
  return (
    appMode !== staticRender &&
    (!window.location.hash || window.location.hash === '#')
  )
}
