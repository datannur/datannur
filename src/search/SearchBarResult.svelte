<script lang="ts">
  import { onPageHomepage } from '@router/router-store'
  import { whenAppReady } from '@lib/store'
  import { appWidth } from '@lib/viewport-manager'
  import { debounce } from '@lib/util'
  import SearchBarResultRow from './SearchBarResultRow.svelte'
  import type { SearchResult } from './search'

  let {
    isOpen,
    nbResult,
    allSearch,
    searchValue,
    isFocusIn = $bindable(),
    selectInput,
  }: {
    isOpen: boolean
    nbResult: number
    allSearch: SearchResult[]
    searchValue: string
    isFocusIn: boolean
    selectInput: () => void
  } = $props()

  let tableWrapper: HTMLDivElement | undefined = $state()
  let height = $state(0)
  let hasScrollBar = $state(false)
  let dbLoaded = $state(false)

  const plural = $derived(nbResult > 1 ? 's' : '')

  function updateHeight() {
    if (!tableWrapper) return
    const realHeight = tableWrapper.offsetHeight + 20
    const percentHeight = $onPageHomepage ? 0.8 : 0.9
    const windowHeight = window.innerHeight * percentHeight
    hasScrollBar = realHeight > windowHeight
    height = Math.min(realHeight, windowHeight)
  }

  const debouncedUpdateHeight = debounce(updateHeight, 100)

  $effect(() => {
    void searchValue
    if (nbResult !== undefined) {
      debouncedUpdateHeight()
      setTimeout(() => debouncedUpdateHeight(), 200)
    }
  })

  $effect(() => {
    if ($onPageHomepage !== undefined) debouncedUpdateHeight()
  })

  $effect(() => {
    void $appWidth
    debouncedUpdateHeight()
  })

  $effect(() => {
    const handleResize = () => tableWrapper && debouncedUpdateHeight()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  })

  $whenAppReady.then(() => (dbLoaded = true))
</script>

<div id="search-bar-result-outer">
  <div
    id="search-bar-result-wrapper"
    class:is-open={isOpen}
    class:has-scroll-bar={hasScrollBar}
    style="--height: {height}px"
  >
    <div class="table-wrapper" bind:this={tableWrapper}>
      {#if dbLoaded}
        <table class="table is-striped">
          <tbody>
            {#if searchValue === '' && nbResult > 0}
              <tr>
                <td colspan="3">
                  <div class="nb-result">
                    {nbResult} recherche{plural} récente{plural}
                  </div>
                </td>
              </tr>
            {/if}

            {#if searchValue !== ''}
              <tr>
                <td colspan="3">
                  <div class="nb-result">
                    {nbResult} résultat{plural}
                  </div>
                </td>
              </tr>
            {/if}
            {#each allSearch as item (`${item.entity}/${item.id}`)}
              <SearchBarResultRow
                {item}
                {searchValue}
                {selectInput}
                bind:isFocusIn
              />
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  #search-bar-result-outer {
    position: relative;
    overflow: hidden;
  }

  #search-bar-result-wrapper {
    height: 0px;
    overflow-y: hidden;
    transition: height $transition-basic-1;
    @include scrollbar-light();
    &.is-open {
      height: var(--height);
    }
    &.has-scroll-bar {
      overflow-y: auto;
    }
    .table {
      margin: 10px;
      width: calc(100% - 20px);
      background: transparent;
      td {
        border: 0;
      }
    }
  }

  .nb-result {
    width: 100%;
    font-size: 14px;
  }
</style>
