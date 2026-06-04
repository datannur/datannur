<script lang="ts">
  import { allTabs, tabSelected } from '@lib/store'
  import Icon from '@layout/Icon.svelte'
  import Loading from '@frame/Loading.svelte'
  import Number from '@layout/Number.svelte'
  import { t } from '@i18n/messages'
  import type { Tab } from './tabs-helper'

  let {
    tab,
    activeTab = $bindable(),
    selectTab,
  }: { tab: Tab; activeTab: string; selectTab: (tab: Tab) => void } = $props()

  let tabNb = $derived(tab.nb)

  function toPercent(value: string) {
    const separator = '|'
    const splited = String(value).split(separator)
    if (splited.length === 1) return 0
    return parseFloat(splited[1].split('%')[0]) || 0
  }

  $effect(() => {
    if (activeTab === tab.key) tabNb = $allTabs[tab.icon].nb
  })
</script>

<li
  class="tab-li-{tab.key} tab-entity-{tab.icon} shadow-{$tabSelected.icon}"
  class:is-active={activeTab === tab.key}
  class:not-active={activeTab !== tab.key}
>
  <div class="rounded-wrapper left">
    <div class="rounded left"></div>
  </div>
  <div class="rounded-wrapper right">
    <div class="rounded right"></div>
  </div>

  <a href={null} onclick={() => selectTab(tab)} class="tab-select-btn">
    <div>
      {#if tabNb !== undefined}
        {#if tabNb === '...'}
          <Loading type="tab" colorEntity={tab.icon} />
        {:else if tabNb === (typeof tabNb === 'number' ? tabNb : parseInt(tabNb))}
          <span class="num-style tab-visible" data-tab-transition={tab.key}>
            <Number number={tabNb} />
          </span>
        {:else}
          <span class="num-style tab-visible" data-tab-transition={tab.key}
            >{tabNb}</span
          >
        {/if}
      {/if}
    </div>

    <div>
      <span class="tab-visible icon-wrapper">
        <Icon type={tab.icon} marginRight={false} mode="compact" />
      </span>
      <span>
        {#if tabNb !== undefined && tabNb !== '...' && tabNb !== (typeof tabNb === 'number' ? tabNb : parseInt(tabNb))}
          <span class="percent-wrapper">
            <span
              class="percent"
              style="width: {100 - toPercent(String(tabNb))}%"
            ></span>
          </span>
        {/if}
        <span class="tab-visible tab-name">
          {tab.nameKey ? t(tab.nameKey) : (tab.name ?? '')}
        </span>
      </span>
    </div>
  </a>
</li>

<style lang="scss">
  @use 'main.scss' as *;

  .tab-visible {
    position: relative;
    z-index: 2;
  }

  li {
    border: 1px solid transparent;
    border-bottom: 0;
    height: 38px;
    &.is-active {
      border-color: $color-5;
      a.tab-select-btn {
        background: $background-2;
        z-index: 2;
        .percent-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          opacity: 0.2;
          overflow: hidden;
        }
        .percent {
          float: right;
          height: 100%;
          background-image: linear-gradient(0deg, $background-2, $background-1);
          background: $background-1;
          opacity: 1;
        }
      }
    }
  }
  a.tab-select-btn {
    position: relative;
    border: 0;
    justify-content: left;
    padding-left: 0;
    padding-right: 8px;
    padding-top: 10px;
    font-size: 14px;
    flex-direction: column;
    .num-style {
      font-size: 12px;
      display: block;
      line-height: 0px;
      margin-top: -2px;
      padding-left: 8px;
      text-align: center;
    }
    .icon-wrapper {
      height: 24px;
      :global(.icon) {
        margin-left: 8px;
        margin-right: 0;
      }
    }
    &:hover,
    .is-active & {
      color: $color-3;
      background: transparent;
    }
  }

  li {
    @each $entity in $entities {
      &.tab-entity-#{$entity} {
        a.tab-select-btn:hover {
          color: #{color($entity)} !important;
        }
      }
    }
  }
  li.is-active {
    @each $entity in $entities {
      &.tab-entity-#{$entity} {
        a.tab-select-btn {
          color: #{color($entity)} !important;
        }
      }
    }
  }

  @each $entity in $entities {
    .tab-entity-#{$entity} {
      .percent-wrapper {
        background: #{color($entity)};
      }
    }
  }

  :global(html.roundedDesign) {
    a.tab-select-btn {
      border-radius: $rounded-top;
    }
    li.not-active a.tab-select-btn:hover {
      border-radius: $rounded-size;
      border-bottom-color: transparent;
    }

    li.is-active {
      position: relative;
      border-radius: $rounded-top;
      .rounded-wrapper {
        content: '';
        position: absolute;
        height: 20px;
        width: 20px;
        bottom: 0;
        background: $background-2;
        z-index: 1;
        &.left {
          left: -20px;
          border-top-left-radius: 20px;
        }
        &.right {
          right: -20px;
          border-top-right-radius: 20px;
        }
        .rounded {
          height: 20px;
          width: 20px;
          background: $background-1;
          border-bottom: 1px solid $color-5;
          &.left {
            border-radius: 20px 0 20px 0;
            border-right: 1px solid $color-5;
          }
          &.right {
            border-radius: 0 20px 0 20px;
            border-left: 1px solid $color-5;
          }
        }
      }

      a.tab-select-btn {
        .percent-wrapper {
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
        }
      }
    }
    :global(.tabs:not(.no-first-tab)) {
      li.is-active .rounded-wrapper.left {
        display: none;
      }
    }
    :global(.tabs.is-last-tab) {
      li.is-active .rounded-wrapper.right {
        display: none;
      }
    }
  }

  :global(html.pageShadowColored) {
    li {
      @each $entity in $entities {
        &.tab-entity-#{$entity} {
          a.tab-select-btn:hover {
            color: #{color($entity)} !important;
          }
        }

        &.shadow-#{$entity} {
          &.is-active {
            border-color: #{color($entity)};

            a.tab-select-btn {
              color: #{color($entity)};
            }
            .rounded-wrapper .rounded,
            .rounded-wrapper .rounded.left,
            .rounded-wrapper .rounded.right {
              border-color: #{color($entity)};
            }
          }
        }
      }
    }
  }

  @include viewport-small-mobile {
    .tab-name {
      display: none;
    }
  }
</style>
