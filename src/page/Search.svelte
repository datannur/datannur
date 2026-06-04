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
  import aboutSearchEn from '@markdown/search/about-search.en.md?raw'
  import aboutSearchFr from '@markdown/search/about-search.fr.md?raw'
  import noResultEn from '@markdown/search/no-result.en.md?raw'
  import noResultFr from '@markdown/search/no-result.fr.md?raw'
  import noRecentSearchEn from '@markdown/search/no-recent-search.en.md?raw'
  import noRecentSearchFr from '@markdown/search/no-recent-search.fr.md?raw'
  import { localizedMarkdown } from '@i18n/markdown'
  import { t } from '@i18n/messages'
  import type { SearchResult as SearchResultType } from '@search/search'
  import type { Tab } from '@tab/tabs-helper'

  let isLoading = $state(true)
  let searchResultData: SearchResultType[] = $state([])
  let tabs: Tab[] = $state([])
  let tabKey = $state()

  let recentSearchChange = false
  const aboutSearch = localizedMarkdown({
    en: aboutSearchEn,
    fr: aboutSearchFr,
  })
  const noResult = localizedMarkdown({ en: noResultEn, fr: noResultFr })
  const noRecentSearch = localizedMarkdown({
    en: noRecentSearchEn,
    fr: noRecentSearchFr,
  })

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
    makeTab(t('nav.about'), 'about', 'about', aboutSearch),
  )
  let noResultTab = $derived(
    makeTab(t('page.search.result'), 'search', 'noResult', noResult),
  )
  let noRecentSearchTab = $derived(
    makeTab(
      t('page.search.recentSearches'),
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
    const tabName = t('page.search.recentSearches')
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

  function setTabs(name = t('page.search.result')) {
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
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      searchInputChange()
    }, 200)
  })
</script>

<Head
  title={t('page.search.title')}
  description={t('page.search.description')}
/>

<section class="section">
  <div>
    <p class="control has-icons-right">
      <input
        class="input"
        type="text"
        name="search-page-input"
        placeholder={$searchReady ? '' : t('search.preparing')}
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
