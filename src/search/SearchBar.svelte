<script lang="ts">
  import { onMount } from 'svelte'
  import search, { searchReady } from '@search/search'
  import { page, onPageSearch, onPageHomepage } from '@router/router-store'
  import { router } from '@router/router.svelte'
  import { isSmallMenu } from '@lib/browser-utils'
  import { whenAppReady, searchValue, headerOpen } from '@lib/store'
  import { clickOutside, debounce } from '@lib/util'
  import Logs from '@lib/logs'
  import BtnClearInput from '@layout/BtnClearInput.svelte'
  import SearchHistory from './search-history'
  import SearchBarResult from './SearchBarResult.svelte'
  import type { SearchResult } from './search'
  import type { MainEntityName } from '@src/type'

  let isFocusIn = $state(false)
  let inputElement: HTMLInputElement | undefined = $state()
  let nbResult = $state(0)
  let allSearch: SearchResult[] = $state([])
  let dbInitied = $state(false)
  let searchValueDebounced = $state($searchValue)

  let isOpen = $derived(
    isFocusIn && ($searchValue !== '' || nbResult > 0 || !dbInitied),
  )
  let isHiddenByMobileMenu = $derived($isSmallMenu && $headerOpen)
  let routerReady = $derived($page !== '')
  let searchDisabled = $derived(!$searchReady)

  const maxSearchResult = 100
  let navPosition = 0

  SearchHistory.onChange('searchBar', () => searchInputChange())

  function initSearchRecent() {
    allSearch = SearchHistory.getRecentSearch()
    nbResult = allSearch.length
  }

  async function searchInputChange() {
    if (searchDisabled) return
    if ($onPageSearch) return
    searchValueDebounced = $searchValue
    navPosition = 0
    if ($searchValue === '') {
      initSearchRecent()
      return
    }
    let allSearchRaw = await search.find($searchValue)
    if ($searchValue === '') return
    allSearchRaw = SearchHistory.putRecentFirst(allSearchRaw)
    nbResult = allSearchRaw.length
    allSearch = allSearchRaw.slice(0, maxSearchResult)
  }

  function clearInput() {
    $searchValue = ''
    searchValueDebounced = $searchValue
    selectInput()
    searchInputChange()
  }

  function focusin() {
    isFocusIn = true
  }

  function focusout() {
    isFocusIn = false
  }

  function goToPageSearch() {
    if (searchDisabled) return
    if ($onPageSearch) return
    router.navigate(`/search?search=${$searchValue}`)
    selectInput()
  }

  function applyToAllSearch(
    callback: (
      item: SearchResult,
      itemNum: number,
      entity: MainEntityName,
    ) => void,
  ) {
    let itemNum = 0
    for (const item of allSearch) {
      itemNum += 1
      callback(item, itemNum, item.entity)
    }
  }

  function keyup(e: KeyboardEvent) {
    isFocusIn = true
    if (e.key !== 'Enter') return
    if (navPosition === 0) {
      goToPageSearch()
    } else {
      applyToAllSearch((item, itemNum, entity) => {
        if (itemNum === navPosition) {
          router.navigate(`/${entity}/${item.id}`)
          SearchHistory.add(entity, item.id)
          isFocusIn = false
          Logs.add('searchBar', { entity, entityId: item.id })
        }
      })
    }
  }

  function keydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      updateNavPosition(1)
    } else if (e.key === 'ArrowUp') {
      updateNavPosition(-1)
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      isFocusIn = true
      e.preventDefault()
    }
  }

  function updateNavPosition(move: -1 | 1) {
    navPosition += move
    if (navPosition < 0) navPosition = 0
    if (navPosition > nbResult) navPosition = nbResult
    if (navPosition > maxSearchResult) navPosition = maxSearchResult
    applyToAllSearch((item, itemNum) => {
      item.navHover = itemNum === navPosition
    })
  }

  function onClick() {
    isFocusIn = true
  }

  function selectInput() {
    inputElement?.focus()
    isFocusIn = true
  }

  function windowKeydown(e: KeyboardEvent) {
    const focusedElement = window.document.activeElement
    const isInputFocused =
      focusedElement?.tagName === 'INPUT' ||
      focusedElement?.tagName === 'TEXTAREA' ||
      focusedElement?.tagName === 'SELECT'
    if (e.key === '/' && !isFocusIn && !isInputFocused && !$onPageSearch) {
      e.preventDefault()
      selectInput()
    }
  }

  onMount(() => {
    if ($onPageSearch) selectInput()
  })

  $whenAppReady.then(() => {
    initSearchRecent()
    dbInitied = true
  })

  SearchHistory.onClear(() => {
    initSearchRecent()
  })
</script>

<svelte:window onkeydown={windowKeydown} />

{#if routerReady}
  <div
    class="navbar-item header-search-item"
    class:hidden-by-mobile-menu={isHiddenByMobileMenu}
    use:clickOutside={focusout}
  >
    <div
      class="search-bar-container box-shadow-color shadow-search"
      class:box-shadow={isFocusIn}
      class:focus={isFocusIn}
      class:homepage={$onPageHomepage}
      class:page-search={$onPageSearch}
      class:search-disabled={searchDisabled}
    >
      <p class="control has-icons-right">
        <button
          class="icon is-small is-left"
          class:active={$searchValue !== '' &&
            $searchValue !== undefined &&
            isFocusIn &&
            nbResult > 0}
          onclick={goToPageSearch}
          aria-label="Rechercher"
        >
          <i class="fas fa-magnifying-glass"></i>
        </button>
        <input
          id="header-search-input"
          class="input"
          type="text"
          placeholder={searchDisabled
            ? 'Recherche en préparation...'
            : 'Rechercher...'}
          disabled={searchDisabled}
          bind:value={$searchValue}
          oninput={debounce(searchInputChange, 100)}
          onkeyup={keyup}
          onkeydown={keydown}
          onfocusin={focusin}
          onclick={onClick}
          bind:this={inputElement}
          autocomplete="off"
          enterkeyhint="search"
        />
        {#if $searchValue !== ''}
          <span class="btn-clear-input-wrapper">
            <BtnClearInput click={clearInput} />
          </span>
        {/if}
      </p>

      {#if !$onPageSearch}
        <SearchBarResult
          {isOpen}
          {nbResult}
          {allSearch}
          searchValue={searchValueDebounced}
          {selectInput}
          bind:isFocusIn
        />
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  $search-layout-transition: 780ms cubic-bezier(0.33, 1, 0.68, 1);

  .header-search-item {
    padding: 0;
    margin-right: 0px;
    position: initial;

    .search-bar-container {
      position: fixed;
      z-index: 2000;
      top: 2.5px;
      left: 680px;
      right: 3em;
      margin-right: 0px;
      overflow: hidden;
      background: $background-2;
      border: 1px solid;
      border-color: $background-3;
      transition:
        border-color $transition-basic-1,
        box-shadow $transition-basic-1,
        top $search-layout-transition,
        left $search-layout-transition,
        right $search-layout-transition;
      &.focus {
        border-color: $color-5;
      }
      &.search-disabled {
        opacity: 0.7;
      }
      &.homepage,
      &.page-search {
        top: 65px;
        left: 3em;
        z-index: 20;
        transition:
          border-color $transition-basic-1,
          box-shadow $transition-basic-1,
          top $search-layout-transition,
          left $search-layout-transition,
          right $search-layout-transition,
          z-index 0s $search-layout-transition;
      }
    }

    #header-search-input {
      position: relative;
      width: calc(var(--app-width) - 730px);
      margin: 0;
      padding-left: 3.3rem;
      background: transparent;
      border: none;
      box-shadow: none;
      transition:
        width $search-layout-transition,
        padding $search-layout-transition,
        color $transition-basic-1;
      &::placeholder {
        color: $color-4;
      }
      &:disabled {
        cursor: wait;
      }
    }
    .search-bar-container.homepage #header-search-input,
    .search-bar-container.page-search #header-search-input {
      width: 100%;
      max-width: 100%;
      padding: 10px 20px;
      padding-left: 3.3rem;
    }
    .btn-clear-input-wrapper {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 40px;
      padding-right: 0.75em;
      margin-right: 2px;
    }
    .icon {
      color: $color-2;
      pointer-events: all;
      left: 10px;
      cursor: pointer;
      transition: color $transition-basic-1;
      &:hover {
        color: color('search');
      }
      &.active {
        color: color('search');
        text-shadow: 0 0 10px;
      }
    }
  }

  .header-search-item .search-bar-container {
    right: calc(3em + var(--chat-width));
  }

  @mixin window-small-mobile-search-layout {
    .header-search-item .search-bar-container {
      right: 3em;
    }
  }

  :global(body.viewport-managed.window-small-mobile) {
    @include window-small-mobile-search-layout;
  }

  :global(html.roundedDesign) {
    .search-bar-container {
      border-radius: $rounded;
    }
  }

  :global(html.pageShadowColored) {
    .header-search-item {
      .search-bar-container.focus {
        border-color: color('search');
      }
    }
  }

  @mixin mobile-search-layout {
    .header-search-item .search-bar-container:not(.homepage):not(.page-search) {
      left: 200px;
      right: calc(50px + var(--chat-width));
    }
    .header-search-item #header-search-input {
      width: 100%;
    }
  }

  @mixin mobile-window-small-search-layout {
    .header-search-item .search-bar-container:not(.homepage):not(.page-search) {
      right: 50px;
    }
  }

  @mixin small-mobile-search-layout {
    .header-search-item .search-bar-container:not(.homepage):not(.page-search) {
      left: 200px;
      right: calc(50px + var(--chat-width));
    }
    .header-search-item #header-search-input {
      width: 100%;
    }
  }

  @mixin small-mobile-window-small-search-layout {
    .header-search-item .search-bar-container:not(.homepage):not(.page-search) {
      right: 50px;
    }
  }

  @mixin tiny-mobile-search-layout {
    .header-search-item .search-bar-container:not(.homepage):not(.page-search) {
      left: 10px;
      right: calc(50px + var(--chat-width));
    }
    .header-search-item #header-search-input {
      width: 100%;
    }
  }

  @mixin tiny-mobile-window-small-search-layout {
    .header-search-item .search-bar-container:not(.homepage):not(.page-search) {
      right: 50px;
    }
  }

  @mixin mobile-homepage-search-layout {
    .header-search-item .search-bar-container.homepage {
      left: 50px;
    }
  }

  @mixin small-mobile-homepage-search-layout {
    .header-search-item .search-bar-container.homepage,
    .header-search-item .search-bar-container.page-search {
      left: 10px;
      right: calc(10px + var(--chat-width));
      top: 80px;
    }
  }

  @mixin small-mobile-window-small-homepage-search-layout {
    .header-search-item .search-bar-container.homepage,
    .header-search-item .search-bar-container.page-search {
      right: 10px;
    }
  }

  :global(body.viewport-managed.mobile:not(.small-mobile)) {
    @include mobile-search-layout;
  }

  :global(body.viewport-managed.mobile:not(.small-mobile).window-small-mobile) {
    @include mobile-window-small-search-layout;
  }

  :global(body.viewport-managed.small-mobile:not(.tiny-mobile)) {
    @include small-mobile-search-layout;
  }

  :global(
    body.viewport-managed.small-mobile:not(.tiny-mobile).window-small-mobile
  ) {
    @include small-mobile-window-small-search-layout;
  }

  :global(body.viewport-managed.tiny-mobile) {
    @include tiny-mobile-search-layout;
  }

  :global(body.viewport-managed.tiny-mobile.window-small-mobile) {
    @include tiny-mobile-window-small-search-layout;
  }

  :global(body.viewport-managed.mobile) {
    @include mobile-homepage-search-layout;
  }

  :global(body.viewport-managed.small-mobile) {
    @include small-mobile-homepage-search-layout;
  }

  :global(body.viewport-managed.small-mobile.window-small-mobile) {
    @include small-mobile-window-small-homepage-search-layout;
  }

  @media (min-width: ($small-mobile-limit + 1px)) and (max-width: $menu-mobile-limit) {
    :global(body:not(.viewport-managed)) {
      @include mobile-search-layout;
      @include mobile-homepage-search-layout;
    }
  }

  @media (max-width: $small-mobile-limit) {
    :global(body:not(.viewport-managed)) {
      @include window-small-mobile-search-layout;
      @include small-mobile-window-small-homepage-search-layout;
    }
  }

  @media (min-width: ($tiny-mobile-limit + 1px)) and (max-width: $small-mobile-limit) {
    :global(body:not(.viewport-managed)) {
      @include small-mobile-search-layout;
      @include small-mobile-window-small-search-layout;
      @include mobile-homepage-search-layout;
      @include small-mobile-homepage-search-layout;
    }
  }

  @media (max-width: $tiny-mobile-limit) {
    :global(body:not(.viewport-managed)) {
      @include tiny-mobile-search-layout;
      @include tiny-mobile-window-small-search-layout;
      @include mobile-homepage-search-layout;
      @include small-mobile-homepage-search-layout;
    }
  }

  .header-search-item.hidden-by-mobile-menu {
    opacity: 0;
    pointer-events: none;
    transition: opacity $transition-basic-1;
  }
</style>
