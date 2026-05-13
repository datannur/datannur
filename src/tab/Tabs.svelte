<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { tabSelected, footerVisible, allTabs } from '@lib/store'
  import { getIsMobile } from '@lib/browser-utils'
  import { UrlParam } from '@lib/url'
  import { isBigLimit } from '@lib/constant'
  import ScrollableRow from '@layout/ScrollableRow.svelte'
  import Logs from '@lib/logs'
  import TabsBody from '@tab/TabsBody.svelte'
  import TabTitle from '@tab/TabTitle.svelte'
  import type { Tab } from './tabs-helper'

  let { tabs: tabsProp }: { tabs: Tab[] } = $props()
  const tabs = untrack(() => tabsProp)

  let isMobile = getIsMobile()
  let allKeys: unknown[] = []

  let activeTab = $state(tabs[0]?.key)
  let activeTabBody = $state(tabs[0]?.key)
  let tabsLoaded: { [key: string]: number } = $state({ activeTab: 1 })
  let tabsTitleKey = $state(isMobile)
  let ul: HTMLDivElement | undefined = $state()
  let isLastTab = $state(false)

  let noFirstTab = $derived(activeTab !== tabs[0]?.key)

  function getWidth(selector: string) {
    const elem: HTMLElement | null = document.querySelector(selector)
    return elem?.offsetWidth ?? 0
  }

  function isTabsOverflow() {
    return getWidth('.tabs-container-ul') + 30 > getWidth('#tabs-container')
  }

  function checkIfLastTab() {
    return (
      tabs.length > 0 &&
      activeTab === tabs[tabs.length - 1].key &&
      isTabsOverflow()
    )
  }

  function onResize() {
    isLastTab = checkIfLastTab()
    isMobile = getIsMobile()
    if (!tabsTitleKey && isMobile) {
      tabsTitleKey = true
    }
  }

  function loadTab(tabKey: string) {
    if (!allKeys.includes(tabKey)) return
    activeTab = tabKey
    activeTabBody = tabKey
    if (!(tabKey in tabsLoaded)) {
      tabsLoaded[tabKey] = 0
    }
    tabsLoaded[tabKey] += 1
  }

  function selectTab(tab: Tab) {
    const tabKey = tab.key
    loadTab(tabKey)
    setFooter(tab)
    $tabSelected = tab
    Logs.add('selectTab', { entity: tabKey })
    if (tabs[0].key === tabKey) {
      UrlParam.delete('tab')
    } else {
      UrlParam.set('tab', tabKey)
    }
  }

  function setFooter(tab: Tab) {
    if (tab.footerVisible === false) {
      $footerVisible = false
      return
    }
    $footerVisible =
      tab.footerVisible || (typeof tab.nb === 'number' && tab.nb < isBigLimit)
  }

  function centerActiveTab(tabKey?: string) {
    const key = tabKey ?? activeTab
    if (!key || !ul) return
    const li: HTMLLIElement | null = document.querySelector(
      `#tabs-container ul.tabs-container-ul li.tab-li-${key}`,
    )
    if (!li) return
    const position = ul.offsetWidth / 2 - li.offsetWidth / 2
    ul.scrollTo({
      left: 0 - (position - li.offsetLeft),
      behavior: 'smooth',
    })
  }

  function setupTabs() {
    for (const tab of tabs) {
      allKeys.push(tab.key)
      $allTabs[tab.icon] = { ...tab }
    }
  }

  function loadTabFromUrlParam() {
    const urlParamTab = UrlParam.get('tab')
    if (urlParamTab) {
      loadTab(urlParamTab)
    }
  }

  function setupActiveTab() {
    for (const tab of tabs) {
      if (activeTabBody === tab.key) {
        setFooter(tab)
        $tabSelected = tab
      }
    }
  }

  function handleExternalTabChange(event: CustomEvent<string>) {
    const tabKey = event.detail
    const tab = tabs.find(t => t.key === tabKey)
    if (tab) {
      selectTab(tab)
    }
  }

  function handlePopState() {
    const urlTabKey = UrlParam.get('tab') ?? tabs[0]?.key
    if (urlTabKey && urlTabKey !== activeTab) {
      const tab = tabs.find(t => t.key === urlTabKey)
      if (tab) {
        loadTab(urlTabKey)
        setFooter(tab)
        $tabSelected = tab
        centerActiveTab()
      }
    }
  }

  onMount(() => {
    centerActiveTab()
    window.addEventListener(
      'llm-tab-change',
      handleExternalTabChange as EventListener,
    )
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener(
        'llm-tab-change',
        handleExternalTabChange as EventListener,
      )
      window.removeEventListener('popstate', handlePopState)
    }
  })

  $effect(() => {
    void activeTab
    isLastTab = checkIfLastTab()
  })

  setupTabs()
  loadTabFromUrlParam()
  setupActiveTab()
</script>

<svelte:window onresize={onResize} />

<div class="tabs-wrapper">
  <ScrollableRow
    bind:element={ul}
    id="tabs-container"
    class={`tabs is-boxed${noFirstTab ? ' no-first-tab' : ''}${isLastTab ? ' is-last-tab' : ''}`}
  >
    {#key tabsTitleKey}
      <ul class="tabs-container-ul">
        {#each tabs as tab (tab.key)}
          <TabTitle {tab} bind:activeTab {selectTab} />
        {/each}
      </ul>
    {/key}
  </ScrollableRow>
</div>

<TabsBody {tabs} {noFirstTab} {isLastTab} {activeTabBody} {tabsLoaded} />

<style lang="scss">
  @use 'main.scss' as *;

  .tabs-wrapper {
    max-width: var(--app-width);
  }

  :global(.tabs) {
    margin-bottom: -1px;
    z-index: 1;
    position: relative;

    & > :global(ul) {
      flex-grow: 0;
      border-bottom-width: 0;
      z-index: 1;
    }
  }
</style>
