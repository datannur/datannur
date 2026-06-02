<script lang="ts">
  import { onMount } from 'svelte'
  import { searchValue } from '@lib/store'
  import { UrlParam } from '@lib/url'
  import { pageContentLoaded } from '@router/router-store'
  import search, { searchReady } from '@search/search'
  import Head from '@frame/Head.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import SearchResult from '@search/SearchResult.svelte'
  import SearchHistory from '@search/search-history'
  import AboutFile from '@layout/AboutFile.svelte'
  import aboutSearch from '@markdown/search/about-search.md?raw'
  import noResult from '@markdown/search/no-result.md?raw'
  import noRecentSearch from '@markdown/search/no-recent-search.md?raw'
  import { currentLocale, translate } from '@i18n/i18n'
  import type { SearchResult as SearchResultType } from '@search/search'
  import type { Tab } from '@tab/tabs-helper'

  let isLoading = $state(true)
  let searchResultData: SearchResultType[] = $state([])
  let tabs: Tab[] = $state([])
  let tabKey = $state()

  let recentSearchChange = false

  function makeTab(name: string, icon: string, key: string, aboutFile: string) {
    return {
      name,
      icon,
      key,
      component: AboutFile,
      footerVisible: true,
      props: { aboutFile },
    }
  }
  let aboutTab = $derived(
    makeTab($translate('nav.about'), 'about', 'about', aboutSearch),
  )
  let noResultTab = $derived(
    makeTab($translate('page.search.result'), 'search', 'noResult', noResult),
  )
  let noRecentSearchTab = $derived(
    makeTab(
      $translate('page.search.recentSearches'),
      'search',
      'noRecentSearch',
      noRecentSearch,
    ),
  )

  SearchHistory.onChange('searchPage', () => searchInputChange())

  function setTabKey() {
    recentSearchChange = !recentSearchChange
    tabKey = recentSearchChange
  }

  function initSearchRecent() {
    searchResultData = SearchHistory.getRecentSearch()
    const tabName = $translate('page.search.recentSearches')
    setTabs(tabName)
    isLoading = false
  }

  async function searchInputChange() {
    if (!$searchReady) return
    const urlSearchValue = UrlParam.get('search')
    if (urlSearchValue !== $searchValue) {
      UrlParam.set('search', $searchValue)
    }
    if ($searchValue === '') {
      UrlParam.delete('search')
      initSearchRecent()
      return
    }
    const valueBefore = $searchValue
    const allSearchRaw = await search.find($searchValue)
    isLoading = false
    if ($searchValue !== valueBefore) return
    searchResultData = SearchHistory.putRecentFirst(allSearchRaw)
    setTabs()
  }

  function setTabs(name = $translate('page.search.result')) {
    setTabKey()
    if (searchResultData.length === 0) {
      tabs = [isEmptyInput ? noRecentSearchTab : noResultTab]
    } else {
      tabs = [
        {
          name,
          icon: 'search',
          key: 'search',
          component: SearchResult,
          nb: searchResultData.length,
          props: {
            searchResultData,
            searchValue: $searchValue,
          },
        },
      ]
    }
    tabs.push(aboutTab)
  }

  let isEmptyInput = $derived(['', undefined, null].includes($searchValue))

  const urlSearchValue = UrlParam.get('search')
  if (urlSearchValue) $searchValue = urlSearchValue

  setTabKey()

  onMount(() => {
    $pageContentLoaded = true
  })

  let searchTimeout: ReturnType<typeof setTimeout> | undefined = undefined

  $effect(() => {
    void $searchValue
    void $currentLocale
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      searchInputChange()
    }, 200)
  })
</script>

<Head
  title={$translate('page.search.title')}
  description={$translate('page.search.description')}
/>

<section class="section">
  <div>
    <p class="control has-icons-right">
      <input
        class="input"
        type="text"
        name="search-page-input"
        placeholder={$searchReady ? '' : $translate('search.preparing')}
        disabled={!$searchReady}
        bind:value={$searchValue}
        autocomplete="off"
        enterkeyhint="search"
      />
    </p>
  </div>
  {#if !isLoading}
    {#key tabKey}
      <Tabs {tabs} />
    {/key}
  {/if}
</section>

<style lang="scss">
  @use 'main.scss' as *;

  .section {
    margin-top: 13px;
  }

  .section :global(.searchHighlight) {
    border-radius: $rounded;
    background: rgba(255, 255, 0, 0.5);
  }

  p.control {
    margin-bottom: 25px;
    opacity: 0;
    .input {
      width: 100%;
      margin: auto;
      padding: 20px;
      padding-left: 3.3rem;
      box-sizing: border-box;
      &:disabled {
        cursor: wait;
        opacity: 0.7;
      }
    }
  }
</style>
