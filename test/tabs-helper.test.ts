import { describe, it, expect, vi, beforeEach } from 'vitest'

const StubComponent = (() => null) as unknown as import('svelte').Component

vi.mock('@tab/all-tabs', () => ({
  allTabs: {
    simple: { name: 'Simple', icon: 'i', component: StubComponent },
    async: {
      name: 'Async',
      icon: 'i',
      component: StubComponent,
      loadAsync: true,
    },
    noNum: {
      name: 'NoNum',
      icon: 'i',
      component: StubComponent,
      withoutNum: true,
      withoutProp: true,
      footerVisible: true,
    },
    aboutTab: {
      name: 'About',
      icon: 'i',
      component: StubComponent,
      useAboutFile: true,
    },
    metaDatasets: {
      name: 'Meta',
      icon: 'i',
      component: StubComponent,
      isMeta: true,
      metaKey: 'datasets',
    },
    stat: { name: 'Stat', icon: 'i', component: StubComponent },
  },
}))

vi.mock('@stat/attributs', () => ({
  default: {
    institution: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
    folder: [{ name: 'a' }, { name: 'b' }],
  },
}))

const { tabsHelper } = await import('@tab/tabs-helper')

describe('tabsHelper', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('builds a basic tab from an array value with nb = length', () => {
    const tabs = tabsHelper({ simple: [1, 2, 3] })
    expect(tabs).toHaveLength(1)
    expect(tabs[0]).toMatchObject({
      key: 'simple',
      nb: 3,
      props: { simple: [1, 2, 3] },
      footerVisible: false,
    })
  })

  it('skips unknown keys and logs an error', () => {
    const tabs = tabsHelper({ unknown: [1] })
    expect(tabs).toHaveLength(0)
    expect(console.error).toHaveBeenCalled()
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['false', false],
    ['empty array', []],
  ])('skips empty value: %s', (label, value) => {
    void label
    const tabs = tabsHelper({ simple: value })
    expect(tabs).toHaveLength(0)
  })

  it('keeps empty values when config has withoutProp', () => {
    const tabs = tabsHelper({ noNum: null })
    expect(tabs).toHaveLength(1)
    expect(tabs[0].props).toEqual({ noNum: null })
  })

  it('does not assign empty string to props but still creates the tab', () => {
    const tabs = tabsHelper({ simple: '' })
    expect(tabs).toHaveLength(1)
    expect(tabs[0].props).toEqual({})
    expect(tabs[0].nb).toBeUndefined()
  })

  it('handles isMeta: sets props.isMeta and uses metaKey', () => {
    const value = [{ id: 1 }, { id: 2 }]
    const tabs = tabsHelper({ metaDatasets: value })
    expect(tabs[0].props).toEqual({ isMeta: true, datasets: value })
    expect(tabs[0].nb).toBe(2)
  })

  it('forces nb to undefined when withoutNum is set', () => {
    const tabs = tabsHelper({ noNum: [1, 2, 3] })
    expect(tabs[0].nb).toBeUndefined()
  })

  it('forces nb to "?" when loadAsync is set', () => {
    const tabs = tabsHelper({ async: [1, 2] })
    expect(tabs[0].nb).toBe('?')
  })

  it('uses aboutFile prop when useAboutFile is set', () => {
    const tabs = tabsHelper({ aboutTab: 'path/to/file.md' })
    expect(tabs[0].props).toEqual({ aboutFile: 'path/to/file.md' })
  })

  it('inherits footerVisible from config when defined', () => {
    const tabs = tabsHelper({ noNum: null })
    expect(tabs[0].footerVisible).toBe(true)
  })

  it('skips stat tab when all entries have empty items', () => {
    const tabs = tabsHelper({
      stat: [
        { entity: 'institution', items: [] },
        { entity: 'folder', items: undefined },
      ],
    })
    expect(tabs).toHaveLength(0)
  })

  it('computes nb for stat as sum of attributs lengths over non-empty entries', () => {
    const tabs = tabsHelper({
      stat: [
        { entity: 'institution', items: [{}, {}] }, // 3 attributs
        { entity: 'folder', items: [{}] }, // 2 attributs
        { entity: 'institution', items: [] }, // ignored
      ],
    })
    expect(tabs[0].nb).toBe(5)
  })

  it('preserves input order across multiple tabs', () => {
    const tabs = tabsHelper({
      async: [1],
      simple: [1, 2],
      noNum: null,
    })
    expect(tabs.map(t => t.key)).toEqual(['async', 'simple', 'noNum'])
  })
})
