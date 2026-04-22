<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { tabSelected, footerVisible, allTabs } from '@lib/store'
  import { UrlParam, getIsMobile } from 'svelte-fileapp'
  import { isBigLimit } from '@lib/constant'
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
  let canScrollLeft = $state(false)
  let canScrollRight = $state(false)

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

  function updateScrollState() {
    if (!ul) return
    canScrollLeft = ul.scrollLeft > 1
    canScrollRight = ul.scrollLeft + ul.clientWidth < ul.scrollWidth - 1
  }

  function onScroll() {
    updateScrollState()
  }

  function onWheel(event: WheelEvent) {
    if (!ul) return
    if (event.deltaY === 0 || event.deltaX !== 0) return
    if (ul.scrollWidth <= ul.clientWidth) return
    event.preventDefault()
    ul.scrollLeft += event.deltaY
  }

  function onResize() {
    isLastTab = checkIfLastTab()
    updateScrollState()
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
    centerActiveTab()
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

  function centerActiveTab() {
    setTimeout(() => {
      const liActive = '#tabs-container ul.tabs-container-ul li.is-active'
      const li: HTMLLIElement | null = document.querySelector(liActive)
      if (!li || !ul) return
      const position = ul.offsetWidth / 2 - li.offsetWidth / 2
      ul.scrollLeft = 0 - (position - li.offsetLeft)
      updateScrollState()
    }, 1)
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

<div
  class="tabs-wrapper"
  class:can-scroll-left={canScrollLeft}
  class:can-scroll-right={canScrollRight}
>
  <div
    id="tabs-container"
    class="tabs is-boxed"
    class:no-first-tab={noFirstTab}
    class:is-last-tab={isLastTab}
    bind:this={ul}
    onscroll={onScroll}
    onwheel={onWheel}
  >
    {#key tabsTitleKey}
      <ul class="tabs-container-ul">
        {#each tabs as tab (tab.key)}
          <TabTitle {tab} bind:activeTab {selectTab} />
        {/each}
      </ul>
    {/key}
  </div>
</div>

<TabsBody {tabs} {noFirstTab} {isLastTab} {activeTabBody} {tabsLoaded} />

<style lang="scss">
  @use 'main.scss' as *;

  .tabs-wrapper {
    position: relative;
    max-width: var(--app-width);

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 1px;
      width: 120px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 2;
    }
    &::before {
      left: 0;
      background: linear-gradient(
        to right,
        var(--background-1),
        color-mix(in srgb, var(--background-1), transparent 100%)
      );
    }
    &::after {
      right: 0;
      background: linear-gradient(
        to left,
        var(--background-1),
        color-mix(in srgb, var(--background-1), transparent 100%)
      );
    }
    &.can-scroll-left::before {
      opacity: 1;
    }
    &.can-scroll-right::after {
      opacity: 1;
    }
  }

  .tabs {
    margin-bottom: -1px;
    overflow-x: auto;
    z-index: 1;
    position: relative;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      width: 0;
      height: 0;
      display: none;
    }

    & > ul {
      flex-grow: 0;
      border-bottom-width: 0;
      z-index: 1;
    }
  }
</style>
