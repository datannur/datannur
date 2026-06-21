import { getAppBasePath, isHttp } from '@lib/url'

declare global {
  interface Window {
    datannurWorldMap?: string
  }
}

// The world geometry (~110 KB) is shipped as a classic JS asset and pulled in
// on demand via a <script> tag — not an ESM import() — so it also works under
// the file:// protocol, where module loading and fetch are blocked.
const scriptId = 'datannur-world-map-json-js'
const basePath = isHttp ? `${getAppBasePath()}data/` : 'data/'

let worldMapPromise: Promise<string | null> | null = null

function injectWorldMapScript(): Promise<string | null> {
  if (window.datannurWorldMap) return Promise.resolve(window.datannurWorldMap)

  return new Promise(resolve => {
    if (document.getElementById(scriptId)) {
      resolve(window.datannurWorldMap ?? null)
      return
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = `${basePath}world-map.json.js`
    script.onload = () => resolve(window.datannurWorldMap ?? null)
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })
}

// Loads the world map at most once, then reuses it across every map instance.
export function loadWorldMap(): Promise<string | null> {
  worldMapPromise ??= injectWorldMapScript()
  return worldMapPromise
}
