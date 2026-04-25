import { allTabs } from '@tab/all-tabs'
import attributs from '@stat/attributs'
import type { Attribut } from '@stat/attributs-def'
import type { Row } from '@type'
import type { Component } from 'svelte'

export type TabConfig = {
  name: string
  icon: string
  /* eslint-disable-next-line */
  component: Component<any>
  isMeta?: boolean
  metaKey?: string
  withoutProp?: boolean
  loadAsync?: boolean
  withoutNum?: boolean
  useAboutFile?: boolean
  footerVisible?: boolean
}

export type Tab = TabConfig & {
  key: string
  props: Row
  nb?: number | string
  footerVisible?: boolean
}

type StatEntry = { entity: string; items?: unknown[] }

function getNbStat(
  stat: StatEntry[],
  attributs: Record<string, Attribut[]>,
): number {
  return stat.reduce((acc, entry) => {
    if (!entry.items?.length) return acc
    return acc + (attributs[entry.entity]?.length ?? 0)
  }, 0)
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

function getTab(key: string, value: unknown) {
  if (!(key in allTabs)) {
    console.error('tabsHelper():', key, 'not found')
    return false
  }
  const config = allTabs[key]

  if (isEmpty(value) && !config.withoutProp) return false

  if (key === 'stat') {
    const stat = (Array.isArray(value) ? value : []) as StatEntry[]
    const total = stat.reduce(
      (acc, entry) => acc + (entry.items?.length ?? 0),
      0,
    )
    if (total === 0) return false
  }

  const tab: Tab = { ...config, key, props: {} }

  if (Array.isArray(value)) tab.nb = value.length

  if (config.isMeta) {
    tab.props.isMeta = true
    tab.props[config.metaKey!] = value
  } else if (value !== '') {
    tab.props[key] = value
  }

  if (config.withoutNum) tab.nb = undefined
  if (config.loadAsync) tab.nb = '?'

  if (config.useAboutFile) tab.props = { aboutFile: value }

  if (key === 'stat') {
    tab.nb = getNbStat(value as StatEntry[], attributs)
  }

  tab.footerVisible ??= false

  return tab
}

export function tabsHelper(items: Row) {
  const tabs: Tab[] = []
  for (const [key, value] of Object.entries(items)) {
    const tab = getTab(key, value)
    if (!tab) continue
    tabs.push(tab)
  }
  return tabs
}
