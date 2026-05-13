const staticRender = 'static_render'
const checkDb = 'check_db'
const spa = 'spa'
const appModeParam = 'app_mode'
const staticMetaSelector = 'meta[app-mode="static"]'
const hashPrefix = '#/'
const defaultHash = 'homepage'

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
    let hash = loc.hash.split('?')[0]
    if (hash === '') {
      hash = hashPrefix
      if (appMode === staticRender) hash = ''
    }
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
    if (appMode === staticRender) return ''
    let hash = loc.hash.split('?')[0]
    if (hash === '' && params.toString() !== '') {
      hash = hashPrefix
    }
    if (hash === hashPrefix && params.toString() === '') return ''
    return hash
  }

  static getAllParams() {
    let hash = window.location.hash
    if (appMode === staticRender) hash = window.location.href
    if (!hash.includes('?')) return {}
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
      hash = window.location.pathname.substring(1)
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

export const isSsgRendering =
  new URLSearchParams(window.location.search).get(appModeParam) === staticRender

export const isStaticMode = Boolean(document.querySelector(staticMetaSelector))

function getSubFolder() {
  const url = new URL(window.location.href)
  const pathname = url.pathname.split('/').filter(Boolean)
  return pathname.length > 0 ? pathname[0] : ''
}

const subfolder = getSubFolder()

export const urlPrefix = (() => {
  if (appMode === staticRender) return ''
  else if (isHttp && subfolder) return '/' + subfolder + '/#'
  return '#'
})()

export function getBaseLinkUrl() {
  if (appMode === staticRender) return '/'
  return hashPrefix
}

export function link(href: string, content: string, entity = '') {
  const base = getBaseLinkUrl()
  const onclick = `window.goToHref(event, '${href}')`
  let specialClass = ''
  if (entity) {
    specialClass = `class="color-entity-${entity}"`
  }
  return `<a href="${base}${href}" onclick="${onclick}" ${specialClass}>${content}</a>`
}

export function isSpaHomepage() {
  return (
    appMode !== staticRender &&
    (!window.location.hash || window.location.hash === '#')
  )
}
