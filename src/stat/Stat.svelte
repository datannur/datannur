<script lang="ts">
  import MiniMasonry from 'minimasonry'
  import { onMount, onDestroy, untrack } from 'svelte'
  import { documentWidth } from '@lib/viewport-manager'
  import { getColor } from '@lib/util'
  import { entityNames } from '@lib/constant'
  import { allTabs } from '@lib/store'
  import attributs from './attributs'
  import { addValues } from './stat'
  import Icon from '@layout/Icon.svelte'
  import ScrollableRow from '@layout/ScrollableRow.svelte'
  import StatBox from './StatBox.svelte'
  import type { AttributWithValues } from './stat'
  import type { MainEntity, Log, MainEntityName } from '@type'

  interface MiniMasonryExtended extends MiniMasonry {
    conf: {
      baseWidth: number
      gutter: number
      ultimateGutter: number
      container: string | HTMLElement
      minify?: boolean
      surroundingGutter?: boolean
      direction?: 'ltr' | 'rtl'
      wedge?: boolean
    }
  }

  type Stat = {
    entity: MainEntityName | 'log'
    items: (MainEntity | Log)[]
    attributs?: AttributWithValues[]
  }

  let { stat: statProp }: { stat: Stat[] } = $props()
  const stat = untrack(() => statProp)

  let showAll = $state(true)
  let visible: { [key: string]: boolean } = $state({})
  let loading = $state(false)

  let masonry: MiniMasonryExtended | undefined = undefined

  onMount(() => {
    masonry = new MiniMasonry({
      container: '.all-stat-container',
      baseWidth: Math.min($documentWidth - 20, 300),
      gutter: 20,
      ultimateGutter: 20,
    }) as MiniMasonryExtended
    updateLayout()
  })

  onDestroy(() => {
    masonry?.destroy()
  })

  $effect(() => {
    void $documentWidth
    if (masonry) {
      masonry.conf.baseWidth = Math.min($documentWidth - 20, 300)
      updateLayout()
    }
  })

  function updateNbItemVisible(entities: Stat[]) {
    let nbItemVisible = 0
    for (const entity of entities) {
      if (visible[entity.entity] || showAll) {
        nbItemVisible += entity.attributs?.length ?? 0
      }
    }
    $allTabs.stat.nb = nbItemVisible
  }

  function updateLayout() {
    updateNbItemVisible(entities)
    loading = true
    setTimeout(() => {
      masonry?.layout()
      masonry?.layout()
      setTimeout(() => (loading = false), 100)
    }, 1)
  }

  function show(entity: MainEntityName | 'log') {
    for (const key in visible) {
      visible[key] = key === entity
    }
    showAll = false
    updateLayout()
  }

  function clickShowAll() {
    for (const key in visible) {
      visible[key] = false
    }
    showAll = true
    updateLayout()
  }

  const entities = stat.filter(x => x.items?.length > 0)
  entities.forEach(entity => {
    visible[entity.entity] = false
    entity.attributs = addValues(entity.items, attributs[entity.entity])
  })

  let hasBtns = entities.length > 1
</script>

{#if entities.length > 1}
  <ScrollableRow class="btns">
    <button
      class="button"
      class:box-shadow={showAll}
      class:box-shadow-color={showAll}
      style="color: {showAll ? getColor('entity') : ''}"
      onclick={clickShowAll}
    >
      <Icon type="entity" />
      <span class="btn-select-entity-name">Tout</span>
    </button>
    {#each entities as entity (entity.entity)}
      <button
        class="button shadow-{entity.entity}"
        class:active={visible[entity.entity]}
        class:box-shadow-color={visible[entity.entity]}
        style="color: {visible[entity.entity] ? getColor(entity.entity) : ''}"
        onclick={() => show(entity.entity)}
      >
        <Icon type={entity.entity} />
        <span class="btn-select-entity-name">
          {entityNames[entity.entity]}
        </span>
      </button>
    {/each}
  </ScrollableRow>
{/if}

<div class="main-wrapper">
  <div
    class="all-stat-container-wrapper"
    class:no-btns={!hasBtns}
    class:has-btns={hasBtns}
  >
    <div class="all-stat-container" class:loading>
      {#each entities as entity (entity.entity)}
        {#if visible[entity.entity] || showAll}
          {#each entity.attributs as attribut (attribut.key)}
            <StatBox entity={entity.entity} {attribut} />
          {/each}
        {/if}
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .all-stat-container-wrapper {
    position: relative;
    width: 100%;
    height: auto;
    max-height: max(calc(100vh - 270px), 80px);
    overflow: auto;
    background: $background-2;
    @include scrollbar-light();

    &.has-btns {
      background: $background-1;
    }
  }

  .all-stat-container {
    margin: 20px auto;
    position: relative;
    opacity: 1;
    transition: opacity $transition-basic-1;
    &.loading {
      opacity: 0;
      transition: opacity 0s;
    }
  }

  :global(.btns) {
    display: flex;
    flex-wrap: nowrap;
    text-align: left;
    padding: 4px 0;
    white-space: nowrap;
    .button {
      flex: none;
      margin: 5px;
      background: transparent;
      border-color: transparent !important;
      box-shadow: none;
      height: 0;
      padding: 10px;
      font-weight: 600;
      :global(.icon) {
        margin-left: 0;
        margin-right: 10px;
      }
      &:hover {
        text-shadow: 0 0 10px $color-4;
      }
    }
  }

  :global(html.roundedDesign) {
    .main-wrapper {
      overflow: hidden;
      border-bottom-right-radius: $rounded;
    }
    .all-stat-container-wrapper {
      border-bottom-left-radius: $rounded;
      &.no-btns {
        border-radius: $rounded;
      }
    }
  }

  :global(html.pageShadowColored .box-shadow.box-shadow-color .btns .button) {
    @each $entity in $entities {
      &.active.shadow-#{$entity} {
        text-shadow: 0 0 10px #{color($entity)};
      }
    }
  }

  :global(body.mobile) {
    .all-stat-container-wrapper {
      max-height: max(calc(100vh - 250px), 80px);
    }
  }

  :global(body.small-mobile .btns) {
    padding-left: 10px;
    .button {
      padding-left: 0;
      padding-right: 0;
      margin-left: 0;
      margin-right: 0;
      .btn-select-entity-name {
        display: none;
      }
    }
  }
</style>
