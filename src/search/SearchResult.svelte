<script lang="ts">
  import jQuery from 'jquery'
  import { link } from '@lib/url'
  import { wrapLongText } from '@lib/util'
  import Render from '@lib/render'
  import SearchHistory from './search-history'
  import { searchHighlight } from './search'
  import Datatable from '@datatable/Datatable.svelte'
  import Column from '@lib/column'
  import escapeHtml from 'escape-html'
  import type { Column as ColumnType, MainEntityName } from '@type'
  import type { SearchResult as SearchResultType } from '@search/search'

  let {
    searchValue,
    searchResultData,
  }: { searchValue: string; searchResultData: SearchResultType[] } = $props()

  function initied() {
    const tableId = 'search___search'
    const datatableSearch = jQuery('table#' + tableId + '._datatables')
    datatableSearch.on(
      'click',
      '.remove-search-item',
      function (this: HTMLElement) {
        const elem = jQuery(this)
        const entityName = elem.data('entity-name') as MainEntityName
        const itemId = elem.data('item-id') as string
        SearchHistory.remove(entityName, itemId)
      },
    )
  }

  const columns: ColumnType[] = [
    Column.favorite(),
    Column.entity(),
    {
      data: 'name',
      title: Render.icon('name') + 'Nom',
      defaultContent: '',
      name: 'name',
      tooltip: 'Nom',
      render: (data, type, row: SearchResultType) => {
        if (type !== 'display') return String(data)
        return wrapLongText(
          `<strong class="var-main-col">` +
            link(
              row._entity + '/' + row.id + '?from_search=true',
              `${searchHighlight(data, searchValue)}`,
              row._entity,
            ) +
            `</strong>`,
        )
      },
    },
    {
      data: 'description',
      title: Render.icon('description') + 'Description',
      defaultContent: '',
      tooltip: 'Description',
      render: (data, type) => {
        if (type !== 'display') return String(data)
        if ([null, undefined].includes(data)) return wrapLongText()
        return wrapLongText(searchHighlight(data, searchValue))
      },
    },
    {
      data: 'folderId',
      title: Render.icon('folder') + 'Dossier',
      defaultContent: '',
      tooltip: 'Dossier',
      render: (data, type, row: SearchResultType) => {
        if (type !== 'display') return String(data)
        if (!data) return wrapLongText()
        return wrapLongText(link('folder/' + data, escapeHtml(row.folderName)))
      },
    },
    {
      data: 'id',
      title: "<span class='hidden'>Recent search</span>",
      name: 'searchRecent',
      defaultContent: '',
      filterType: 'none',
      width: '20px',
      render: (data, type, row: SearchResultType) => {
        if (type === 'sort' || type === 'export') {
          return row.isRecent ? '1' : '0'
        }
        return !row.isRecent
          ? ''
          : `<button style="cursor: pointer; margin: 0;" 
              class="remove-search-item" 
              data-entity-name="${row._entity}"
              data-item-id="${escapeHtml(String(row.id))}"
            >
              <i class="fa-solid fa-xmark close"></i>
              <i class="fa-solid fa-clock-rotate-left recent"></i>
            </button>`
      },
    },
  ]
</script>

{#if searchResultData.length > 0}
  <div class="search-page-result-wrapper">
    <Datatable entity="search" data={searchResultData} {columns} {initied} />
  </div>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .search-page-result-wrapper {
    :global(.remove-search-item) {
      margin: 0;
      position: relative;
      width: 16px;
      height: 16px;
      vertical-align: middle;
      color: $color-2;
    }
    :global(.remove-search-item > .fa-solid) {
      transition: opacity $transition-basic-1;
      position: absolute;
      top: 0;
      left: 0;
      margin: auto;
    }
    :global(.remove-search-item > .recent) {
      opacity: 1;
    }
    :global(.remove-search-item > .close) {
      opacity: 0;
      padding-right: 1px;
    }
    :global(tr:hover .remove-search-item > .recent) {
      opacity: 0;
    }
    :global(tr:hover .remove-search-item > .close) {
      opacity: 1;
    }
    :global(.remove-search-item:hover > .close) {
      text-shadow: 0 0 10px;
    }
  }
</style>
