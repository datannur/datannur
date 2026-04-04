<script lang="ts">
  import { untrack } from 'svelte'
  import jQuery from 'jquery'
  import DataTable from 'datatables.net-bm'
  import JSZip from 'jszip'
  import type { Config, ConfigLanguage } from 'datatables.net'
  import 'datatables.net-buttons-bm'
  import 'datatables.net-buttons/js/buttons.html5.mjs'
  import 'datatables.net-fixedcolumns-bm'
  import 'datatables.net-fixedheader-bm'
  import 'datatables.net-scroller-bm'
  import { onMount, onDestroy } from 'svelte'
  import { isMobile } from 'svelte-fileapp'
  import { isBigLimit } from '@lib/constant'
  import { tabSelected, allTablesLoaded, allTabs } from '@lib/store'
  import { appWidth } from '@lib/viewport-manager'
  import { extendable } from '@lib/extendable'
  import { setCurrentTabData } from '@lib/tooltip-events'
  import Exporter from './exporter/exporter'
  import FilterHelper from './filter/filter-helper'
  import initFavorite from './favorite/init-favorite'
  import DatatablesTimer from './datatables-timer'
  import DatatablesLoading from './datatables-loading'
  import { defineColumns } from './define-columns'
  import {
    getTableId,
    getCleanData,
    isShortTable,
    elemHasClickable,
    getNbSticky,
    getNbItem,
    fixColumnsWidth,
  } from './dt-util'
  import { safeHtml } from '@lib/html-sanitizer'
  import Filter from './filter/Filter.svelte'
  import FilterInfoBox from './filter/FilterInfoBox.svelte'
  import Popup from '@layout/Popup.svelte'
  import SearchOptionInfo from './filter/SearchOptionInfo.svelte'
  import LoadingDot from '@layout/LoadingDot.svelte'
  import { entityNames } from '@lib/constant'
  import type { Api } from 'datatables.net'
  import type { Row, Column } from '@type'

  let {
    entity: entityProp,
    data: dataProp,
    columns: columnsProp,
    sortByName: sortByNameProp = false,
    keepAllCols: keepAllColsProp = false,
    metaPath: metaPathProp = undefined,
    isRecursive: isRecursiveProp = false,
    initied = () => {},
  }: {
    entity: string
    data: Row[]
    columns: Column[]
    sortByName?: boolean
    keepAllCols?: boolean
    metaPath?: string
    isRecursive?: boolean
    initied?: () => void
  } = $props()

  const entity = untrack(() => entityProp)
  const data = untrack(() => dataProp)
  const columns = untrack(() => columnsProp)
  const sortByName = untrack(() => sortByNameProp)
  const keepAllCols = untrack(() => keepAllColsProp)
  const metaPath = untrack(() => metaPathProp)
  const isRecursive = untrack(() => isRecursiveProp)

  let loading = $state(true)
  let shortTable = $state(false)
  let datatableUpdateDraw = $state(0)
  let nbActiveFilter = $state(0)
  let isPopupSearchOptionOpen = $state(false)

  DataTable.Buttons.jszip(JSZip)

  DatatablesTimer.start()
  DatatablesLoading.start()

  let datatable: Api | undefined = undefined
  let domTable: ReturnType<typeof jQuery> | null = null

  const isBig = data.length > isBigLimit
  const maxHeightValue = 275
  const maxHeight = `max(calc(100vh - ${maxHeightValue}px), 170px)`
  const maxHeightLoad = `max(calc(100vh - ${maxHeightValue - 82}px), 80px)`

  const tableId = getTableId(entity)
  const exporter = new Exporter(tableId)
  const filter = new FilterHelper(tableId, entity, currentNb => {
    nbActiveFilter = currentNb
  })

  const cleanData = getCleanData(data, sortByName, isRecursive, isBig)
  const nbRowLoading = Math.min(cleanData.length, 50)
  const columnsCopy = defineColumns(
    columns,
    cleanData,
    entity as keyof typeof entityNames,
    keepAllCols,
    metaPath,
    nbRowLoading,
  )
  let nbSticky = $state(getNbSticky(columnsCopy))

  const clickableRows = ![
    'value',
    'datasetPreview',
    'variablePreview',
    'preview',
    'log',
  ].includes(entity)

  $allTablesLoaded = false
  allTablesLoaded.subscribe(value => {
    if (value) {
      setTimeout(() => {
        datatableUpdateDraw += 1
      }, 1000)
    }
  })

  let buttons = exporter.getButtons()
  if (isBig) {
    buttons.push(
      filter.getBtnInfoPopup(() => {
        isPopupSearchOptionOpen = true
      }),
    )
  }

  onMount(() => {
    setTimeout(() => {
      datatable = new DataTable('table#' + tableId, {
        data: cleanData,
        columns: columnsCopy,
        scrollY: maxHeight,
        scrollX: true,
        scrollCollapse: true,
        pageLength: 100,
        paging: isBig,
        searching: isBig,
        deferRender: isBig,
        scroller: isBig ? { rowHeight: 65 } : false,
        autoWidth: false,
        fixedColumns: { leftColumns: nbSticky },
        stateSave: true,
        stateSaveParams: (
          settings: unknown,
          data: { columns: { search: { search: string } }[] },
        ) => {
          void settings
          for (const col of data.columns) {
            col.search.search = ''
          }
        },
        info: false,
        dom: '<"toolbar">ftB',
        order: [[0, 'asc']],
        buttons,
        destroy: true,
        language: {
          zeroRecords: '<span class="no-result">Aucun résultat</span>',
          buttons: exporter.getLanguage(),
        } as ConfigLanguage,
        initComplete: function () {
          if (!isBig) return
          filter.init(this.api())
        },
      } as Config)
      datatable.on('search.dt', () => {
        if ($allTabs[entity]) {
          $allTabs[entity].nb = getNbItem(datatable!, cleanData)
        }
        shortTable = isShortTable(datatable!)
      })
      datatable.on('draw.dt', () => {
        datatableUpdateDraw += 1
      })
      domTable = jQuery('table#' + tableId + '._datatables')
      if (domTable) {
        domTable.on('mouseenter', '.long-text', function () {
          extendable.open.call(this)
        })
        domTable.on('mouseleave', '.long-text', function () {
          extendable.closeTwoLines.call(this)
        })

        domTable.on('click', 'td', event => {
          const target = event.currentTarget as HTMLElement
          setTimeout(() => {
            const clickableElems =
              'a, button, input, select, .copyclip, .favorite'

            if (
              isMobile ||
              !domTable ||
              elemHasClickable(event.target, target, clickableElems)
            ) {
              return
            }
            jQuery(target).parent().find('.var-main-col')[0]?.click()
            jQuery(target).parent().find('.var-main-col a')[0]?.click()
          }, 1)
        })
      }

      initFavorite(tableId, datatable)
      initied()
      datatable.columns.adjust()
      datatableUpdateDraw += 1
      fixColumnsWidth(datatable)
      if ($allTabs[entity]) {
        $allTabs[entity].nb = getNbItem(datatable, cleanData)
      }
      shortTable = isShortTable(datatable)
      loading = false
      DatatablesTimer.end()
      DatatablesLoading.end()
      if (DatatablesLoading.finished) {
        $allTablesLoaded = true
      }
    }, 1)
  })

  function onResize() {
    datatable?.columns?.adjust()
  }

  $effect(() => {
    void $appWidth
    if (datatable) {
      const newNbSticky = getNbSticky(columnsCopy)

      if (newNbSticky !== nbSticky) {
        nbSticky = newNbSticky
        datatable.fixedColumns().left(newNbSticky)
      }
    }
  })

  const tabSelectedUnsubscribe = tabSelected.subscribe(tab => {
    if (tab && [tab.key, tab.icon].includes(entity)) {
      setTimeout(() => {
        datatable?.columns?.adjust()
        datatableUpdateDraw += 1
        setCurrentTabData(cleanData)
      }, 1)
    }
  })

  onDestroy(() => {
    if (datatable) datatable?.destroy()
    tabSelectedUnsubscribe()
    filter.destroy()
    jQuery('table#' + tableId + '._datatables *')?.off()
    domTable = null
  })
</script>

<svelte:window onresize={onResize} />

<Popup bind:isOpen={isPopupSearchOptionOpen}>
  <SearchOptionInfo />
</Popup>

{#if loading}
  <div class="datatable-main-wrapper dt-loading">
    <div class="datatables-outer visible dt-container dt-loading-outer">
      <div class="dt-scroll" style="--max-height: {maxHeightLoad}">
        <table
          class="_datatables table is-striped dataTable"
          class:short-table={shortTable}
        >
          <thead>
            <tr>
              {#each columnsCopy as column, i (`${column.data}/${column.title}`)}
                <th
                  class="sorting"
                  class:sorting-asc={i === 0}
                  class:first-col={i === 0}
                  style="min-width: {column.loadingWidth}px; 
                    width: {column.loadingMaxWidth}px;"
                >
                  <span use:safeHtml={column.title ?? ''}></span>
                  <span class="dt-column-order"></span>
                </th>
              {/each}
            </tr>
          </thead>
          {#if isBig}
            <thead class="loading-filter-wrapper">
              <Filter columns={columnsCopy} />
            </thead>
          {/if}
          <tbody>
            {#each Array(nbRowLoading).keys() as i (i)}
              <tr>
                {#each columnsCopy as column, j (`${column.data}/${column.title}`)}
                  <td class:first-col={j === 0} class:first-row={i === 0}>
                    {#if column.data === '_rowNum'}
                      {i + 1}
                    {:else if column.data === 'isFavorite'}
                      <span class="icon favorite">
                        <i class="fas fa-star"></i>
                      </span>
                    {:else}
                      <LoadingDot />
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}

<div class="datatable-main-wrapper">
  {#if data.length > 0}
    <div class="datatables-outer" class:visible={!loading}>
      <FilterInfoBox {nbActiveFilter} click={() => filter.removeAll()} />
      <table
        id={tableId}
        class="_datatables table is-striped"
        class:short-table={shortTable}
        class:clickable-rows={clickableRows}
      >
        <thead>
          <tr>
            {#each columnsCopy as column, i (`${column.data}/${column.title}`)}
              <th
                title={column.tooltip}
                class:first-col={i === 0}
                class="use-tooltip"
              ></th>
            {/each}
          </tr>
        </thead>

        {#if isBig}
          <thead>
            <Filter
              columns={columnsCopy}
              {tableId}
              {loading}
              {nbSticky}
              {datatableUpdateDraw}
            />
          </thead>
        {/if}
      </table>
    </div>
  {/if}
</div>

<style lang="scss">
  @use 'main.scss' as *;
  @use './exporter/exporter-popup.scss' as *;
  @use './exporter/exporter.scss' as *;
  @use '../style/icon.scss' as *;
  @use '../style/favorite.scss' as *;

  .datatable-main-wrapper {
    text-align: left;
    :global {
      .dt-scroll {
        :global(html.roundedDesign) & {
          border-radius: $rounded-bottom;
          border-top-right-radius: $rounded-size;
        }
        :global(html.roundedDesign .no-first-tab) & {
          border-top-left-radius: $rounded-size;
        }
      }
      .svg-icon {
        vertical-align: middle;
        svg {
          width: 1em;
          height: 1em;
          fill: currentColor;
        }
      }
    }
  }

  .dt-loading {
    .dt-scroll {
      max-height: var(--max-height);

      th {
        position: relative;
        padding-right: 28px;
      }
      td {
        height: 65px;
        vertical-align: middle;
        &.first-row {
          height: 67px;
          padding-top: 10px;
        }
      }
      .loading-filter-wrapper {
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
      }
      .dt-column-order {
        position: absolute;
        right: 12px;
        top: 0;
        bottom: 0;
        width: 12px;
        &::before,
        &::after {
          position: absolute;
          display: block;
          left: 0;
          opacity: 0.125;
          line-height: 9px;
          font-size: 0.8em;
        }
        &::before {
          bottom: 52%;
          content: '▲' / '';
        }
        &::after {
          top: 52%;
          content: '▼';
          content: '▼' / '';
        }
      }
    }
  }

  .datatable-main-wrapper {
    :global {
      .dt-scroll-foot {
        display: none;
      }
    }
  }

  .datatable-main-wrapper {
    :global {
      @include exporter-style;
      @include favorite-style;
      @include icon-color;

      table.dataTable th.dt-type-numeric,
      table.dataTable th.dt-type-date,
      table.dataTable td.dt-type-numeric,
      table.dataTable td.dt-type-date {
        text-align: left;
      }

      .datatables-outer {
        &:not(.visible) {
          opacity: 0;
          height: 0;
          overflow: hidden;
        }
      }
      div.dt-scroll div.dtfc-top-blocker,
      div.dt-scroll div.dtfc-bottom-blocker,
      div.dtfh-floatingparent div.dtfc-top-blocker,
      div.dtfh-floatingparent div.dtfc-bottom-blocker {
        z-index: -999;
      }
      .dt-scroll-footInner {
        border-top: 1px solid $color-5;
      }
      .dt-scroll {
        display: inline-block;
        vertical-align: top;
        width: auto;
        margin: auto;
        max-width: 100%;
      }
      .div.dt-scroll-body,
      div.dt-scroll-head,
      div.dt-scroll-headInner {
        text-align: left;
        margin: auto;
      }
      div.dt-container.dt-empty-footer div.dt-scroll-body {
        border-bottom: 0;
      }
      .dt-container {
        position: initial;

        table.dataTable.dtfc-scrolling-left tr > .dtfc-fixed-left::after {
          box-shadow: inset 10px 0 8px -8px rgba(0, 0, 0, 0.2);
          :global(html.dark-mode) & {
            box-shadow: inset 10px 0 8px -8px rgba(0, 0, 0, 1);
          }
        }
        .dt-filter {
          display: none;
        }
        .dt-scroll {
          position: static !important;
          overflow: hidden;
          .dt-scroll-body {
            width: auto !important;
            @include scrollbar-light();
          }
          .dt-scroll-body,
          .dt-scroll-body table {
            background: transparent;
          }
        }
        div.toolbar,
        .dt-search {
          display: none;
        }
        table.dataTable thead > tr > th.sorting {
          &::before {
            bottom: 55%;
          }
          &::after {
            top: 55%;
          }
        }

        table.dataTable thead > tr > th.dt-orderable-asc:hover,
        table.dataTable thead > tr > th.dt-orderable-desc:hover,
        table.dataTable thead > tr > td.dt-orderable-asc:hover,
        table.dataTable thead > tr > td.dt-orderable-desc:hover {
          outline: none;
        }

        th.dt-type-numeric div.dt-column-header,
        th.dt-type-date div.dt-column-header {
          flex-direction: row;
        }

        .dt-column-order {
          color: $color-3;
          &::before {
            bottom: 52%;
          }
          &::after {
            top: 52%;
          }
        }
        div > ._datatables {
          text-align: left;
        }
        .dt-scroll-head ._datatables {
          border-bottom: 2px $background-1 solid;
        }
        ._datatables {
          width: auto !important;
          text-align: left;
          margin: auto;
          margin-top: 0px !important;
          margin-bottom: 0px !important;
          background: $background-2;
          &.short-table {
            position: relative !important;
            + div {
              height: 0 !important;
            }
          }
          tbody tr {
            height: 65px;
          }
          tbody tr > .dtfc-fixed-left {
            z-index: 1;
          }
          tbody tr > .dtfc-fixed-left,
          > tbody > tr {
            background-color: $background-1;
            td {
              box-shadow: none !important;
            }
          }
          thead tr > .dtfc-fixed-start,
          thead > tr > th.sorting,
          > tbody > tr:nth-child(2n) > .dtfc-fixed-left,
          &.is-striped > tbody > tr:nth-child(2n) {
            background-color: $background-2;
          }
          tbody > tr:has(span.icon-add) > .dtfc-fixed-left {
            background-color: $background-green-filled;
          }
          tbody > tr:has(span.icon-delete) > .dtfc-fixed-left {
            background-color: $background-red-filled;
          }
          tbody > tr:has(span.icon-add) {
            background-color: $background-green-filled !important;
          }
          tbody > tr:has(span.icon-delete) {
            background-color: $background-red-filled !important;
          }
          thead td,
          thead th {
            border: none;
            .hidden {
              display: none;
            }
          }
          tbody > tr > td,
          th {
            white-space: nowrap;
            &.first-col {
              min-width: 50px;
            }
          }
          tbody > tr > td {
            border: 0;
            text-align: left;
            vertical-align: middle;
          }
          .ul-value {
            padding-left: 20px;
            list-style: initial;
            min-width: 100px;
          }
          .type-icon,
          .icon-type {
            font-weight: bold;
            color: $color-type;
          }
          .icon {
            width: auto;
            min-width: 1.5em;
          }
          .dt-empty {
            padding: 0.1px;
            .no-result {
              position: fixed;
              left: (calc(50% - 50px));
              margin-top: -12px;
              pointer-events: none;
            }
          }
          td {
            position: relative;
            @each $entity in $entities {
              a.color-entity-#{$entity}:hover,
              a.color-entity-#{$entity}.is-active,
              a.color-entity-#{$entity}:focus-within {
                color: #{color($entity)} !important;
              }
            }

            .num-percent-container {
              position: absolute;
              border-radius: $rounded;
              overflow: hidden;
              top: 10px;
              left: 5px;
              bottom: 10px;
              right: 5px;
            }
            .num-percent-value {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              top: 50%;
              transform: translateY(-50%);
              text-align: center;
            }
            .num-percent {
              position: absolute;
              top: 0px;
              left: 0;
              bottom: 0px;
              border-radius: $rounded;
              opacity: 0.3;
              pointer-events: none;
              &.placeholder {
                opacity: 0.1;
              }
            }
            .freq-item-container {
              position: relative;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 2px 8px;
              margin: 1px 0;
              border-radius: $rounded;
              overflow: hidden;

              .freq-background {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                border-radius: $rounded;
                opacity: 0.2;
                pointer-events: none;
                &.color-freq {
                  background: color('freq');
                }
              }

              .freq-value,
              .freq-number {
                position: relative;
              }

              .freq-percent {
                position: relative;
                z-index: 1;
                margin-left: auto;
              }
            }
            .num-percent {
              position: absolute;
              top: 0px;
              left: 0;
              bottom: 0px;
              border-radius: $rounded;
              opacity: 0.3;
              pointer-events: none;
              &.placeholder {
                opacity: 0.1;
              }
              &.color-missing {
                background: color('missing');
              }
              &.color-duplicate {
                background: color('duplicate');
              }
              &.color-freq {
                background: color('freq');
              }
              &.color-value {
                background: color('value');
              }
              &.color-institution {
                background: color('institution');
              }
              &.color-folder {
                background: color('folder');
              }
              &.color-tag {
                background: color('tag');
              }
              &.color-doc {
                background: color('doc');
              }
              &.color-dataset {
                background: color('dataset');
              }
              &.color-variable {
                background: color('variable');
              }
              &.color-nbRow {
                background: color('nbRow');
              }
              &.color-nbFiles {
                background: color('nbFiles');
              }
              &.color-dataSize {
                background: color('dataSize');
              }
              &.color-value {
                background: color('value');
              }
              &.color-nbSource {
                background: color('nbSource');
              }
              &.color-nbDerived {
                background: color('nbDerived');
              }
              &.color-key {
                background: color('key');
              }
              &.color-fk {
                background: color('fk');
              }
            }
          }
          td span.deleted {
            color: $color-2;
            font-style: italic;
            font-size: 14px;
          }
          td div.long-text-empty {
            width: 250px;
          }
          td span.highlight-diff-add {
            background: $background-green;
          }
          td span.highlight-diff-delete {
            background: $background-red;
          }
          td div.long-text {
            padding: 1px auto;
            display: -webkit-box;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            width: 250px;
            max-width: 250px;
            padding-right: 0px;
            text-overflow: ellipsis;
            white-space: normal;
            max-height: 50px;
            min-height: auto;
            overflow-x: hidden;
            overflow-y: hidden;
            word-wrap: break-word;
            scrollbar-gutter: stable;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: left;
            .indented-text {
              width: 100%;
              box-sizing: border-box;
              margin: auto;
            }
            a:nth-child(2) .indented-text {
              display: block;
            }
            &.open {
              white-space: normal;
              display: block;
            }
            &.open-full {
              overflow-y: auto;
            }
          }
          &.clickable-rows {
            tbody > tr:not(:has(.dt-empty)) {
              cursor: pointer;
            }
          }
          tbody > tr:hover > td:not(.dt-empty),
          tbody > tr:hover > td.dtfc-fixed-left {
            background: $color-6;
          }
          tbody > tr:hover:has(span.icon-delete) > td:not(.dt-empty),
          tbody > tr:hover:has(span.icon-delete) > td.dtfc-fixed-left {
            background: $background-red-filled;
          }
          tbody > tr:hover:has(span.icon-add) > td:not(.dt-empty),
          tbody > tr:hover:has(span.icon-add) > td.dtfc-fixed-left {
            background: $background-green-filled;
          }

          tbody > tr:hover > td .var-main-col,
          tbody > tr:hover > td .long-text:has(.var-main-col) {
            color: $color-3;
          }

          tbody > tr:hover > td .var-main-col,
          tbody > tr:hover > td .long-text:has(.var-main-col) {
            @each $entity in $entities {
              a.color-entity-#{$entity} {
                color: #{color($entity)} !important;
              }
            }
          }
        }

        div.dt-buttons .search-option {
          :global(body.small-mobile) & {
            position: fixed;
            top: 60px;
            right: calc(52px + var(--chat-width));
            z-index: 999;
          }
          :global(body.window-small-mobile) & {
            right: 52px;
          }
        }
      }
    }
  }
</style>
