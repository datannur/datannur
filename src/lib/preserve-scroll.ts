import { tick } from 'svelte'

const scrollPositions: { [key: string]: number } = {}

type PreserveScrollKey = string | number | undefined

function keyToString(key: PreserveScrollKey): string | undefined {
  if (key === undefined) return
  return String(key)
}

function restoreScroll(node: HTMLElement, key: PreserveScrollKey) {
  const scrollKey = keyToString(key)
  if (scrollKey === undefined) return
  const scrollTop = scrollPositions[scrollKey] ?? 0

  tick().then(() => {
    if (keyToString(key) !== scrollKey) return
    node.scrollTop = scrollTop
    requestAnimationFrame(() => {
      if (keyToString(key) !== scrollKey) return
      node.scrollTop = scrollTop
    })
  })
}

function saveScroll(node: HTMLElement, key: PreserveScrollKey) {
  const scrollKey = keyToString(key)
  if (scrollKey === undefined) return
  if (node.scrollHeight === 0 && node.clientHeight === 0) {
    return
  }
  scrollPositions[scrollKey] = node.scrollTop
}

export function preserveScroll(node: HTMLElement, key: PreserveScrollKey) {
  restoreScroll(node, key)

  function onScroll() {
    saveScroll(node, key)
  }

  function saveCurrentScroll() {
    saveScroll(node, key)
  }

  node.addEventListener('scroll', onScroll, { passive: true })
  node.addEventListener('click', saveCurrentScroll, { capture: true })
  window.addEventListener('popstate', saveCurrentScroll)
  window.addEventListener('pagehide', saveCurrentScroll)

  return {
    update(nextKey: PreserveScrollKey) {
      saveScroll(node, key)
      key = nextKey
      restoreScroll(node, key)
    },
    destroy() {
      saveScroll(node, key)
      node.removeEventListener('scroll', onScroll)
      node.removeEventListener('click', saveCurrentScroll, { capture: true })
      window.removeEventListener('popstate', saveCurrentScroll)
      window.removeEventListener('pagehide', saveCurrentScroll)
    },
  }
}
