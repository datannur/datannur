type LinkManifest = { [entity: string]: { [id: string]: 1 } }

let manifest: LinkManifest = {}
let loaded = false

export function loadLinkManifest() {
  if (loaded) return
  loaded = true
  const script = document.createElement('script')
  script.src = 'data/link.json.js'
  script.onload = () => {
    const data = window.jsonjs?.data as { link?: LinkManifest } | undefined
    manifest = data?.link ?? {}
  }
  script.onerror = () => {}
  document.head.appendChild(script)
}

export function hasLink(entity: string, id: string | number): boolean {
  return !!manifest[entity]?.[String(id)]
}
