<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import Link from '@layout/Link.svelte'
  import Logs from '@lib/logs'
  import SearchHistory from './search-history'
  import { searchHighlight } from './search'
  import { safeHtml } from '@lib/html-sanitizer'
  import Favorite from '@favorite/Favorite.svelte'
  import type { MainEntityName } from '@type'
  import type { SearchResult } from './search'

  let {
    item,
    searchValue,
    isFocusIn = $bindable(), // eslint-disable-line no-useless-assignment
    selectInput,
  }: {
    item: SearchResult
    searchValue: string
    isFocusIn: boolean
    selectInput: () => void
  } = $props()

  function clickLink(entityName: MainEntityName, itemId: string | number) {
    setTimeout(() => {
      SearchHistory.add(entityName, itemId)
      Logs.add('searchBar', { entity: entityName, entityId: itemId })
      isFocusIn = false
    }, 10)
  }

  function removeItem(entityName: MainEntityName, itemId: string | number) {
    SearchHistory.remove(entityName, itemId)
    selectInput()
  }

  function clickRow(event: MouseEvent) {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.closest('a, button, input, textarea, select, label')) return

    const row = event.currentTarget
    if (!(row instanceof HTMLTableRowElement)) return

    const link = row.querySelector('a')
    if (!(link instanceof HTMLAnchorElement)) return

    link.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
      }),
    )
  }
</script>

<tr
  class="search-result-row color-entity-{item.entity}"
  class:nav-hover={item.navHover}
  onclick={clickRow}
>
  <td style="width: 20px;">
    <div>
      <Icon type={item.entity} />
    </div>
  </td>
  <td style="width: 20px;">
    <div>
      <Favorite
        type={item.entity}
        id={item.id}
        isFavorite={item.isFavorite}
        noMargin={true}
      />
    </div>
  </td>
  <td>
    <Link
      href="{item.entity}/{item.id}"
      click={() => clickLink(item.entity, item.id)}
      entity={item.entity}
    >
      <div class="long-text">
        {#if searchValue === ''}
          {item.name}
        {:else}
          <span use:safeHtml={searchHighlight(item.name, searchValue)}></span>
        {/if}
      </div>
    </Link>
  </td>
  {#if searchValue === '' || item.isRecent}
    <td style="width: 20px;">
      <button
        class="btn-delete-item"
        style="cursor: pointer;"
        onclick={() => removeItem(item.entity, item.id)}
        aria-label="Remove item from recent search"
      >
        <i class="fa-solid fa-xmark close"></i>
        <i class="fa-solid fa-clock-rotate-left recent"></i>
      </button>
    </td>
  {/if}
</tr>

<style lang="scss">
  @use 'main.scss' as *;

  td {
    border: 0;
    background: transparent;
    transition: background-color $transition-basic-1;
  }

  .search-result-row {
    cursor: pointer;
  }

  .search-result-row :global(a),
  .search-result-row button {
    cursor: pointer;
  }

  .search-result-row.nav-hover :global(a),
  .search-result-row:hover :global(a) {
    color: $color-3 !important;
  }

  @each $entity in $entities {
    .search-result-row.color-entity-#{$entity}.nav-hover :global(a),
    .search-result-row.color-entity-#{$entity}:hover :global(a) {
      color: #{color($entity)} !important;
    }
  }

  tr.nav-hover > td,
  tr:hover > td {
    background: $color-6;
  }

  :global(html.roundedDesign) {
    tr > td:first-child {
      border-top-left-radius: $rounded;
      border-bottom-left-radius: $rounded;
    }

    tr > td:last-child {
      border-top-right-radius: $rounded;
      border-bottom-right-radius: $rounded;
    }
  }

  .long-text {
    word-break: break-word;
    width: 100%;
    :global(.searchHighlight) {
      border-radius: $rounded;
      background: rgba(255, 255, 0, 0.5);
    }
  }

  .btn-delete-item {
    margin: 0;
    position: relative;
    width: 20px;
    height: 16px;
    vertical-align: middle;
    color: $color-2;

    .fa-solid {
      transition:
        opacity $transition-basic-1,
        transform $transition-basic-1;
      position: absolute;
      top: 0;
      left: 0;
      margin: auto;
    }

    .recent {
      opacity: 1;
      transform: scale(1);
    }

    .close {
      opacity: 0;
      padding-right: 1px;
      transform: scale(0.92);
    }

    tr.nav-hover &,
    tr:hover & {
      .recent {
        opacity: 0;
        transform: scale(0.92);
      }

      .close {
        opacity: 1;
        transform: scale(1);
      }
    }

    &:hover {
      text-shadow: 0 0 10px;
    }
  }
</style>
