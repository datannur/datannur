<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { getColor } from '@lib/util'
  import { translate } from '@i18n/i18n'
  import { getEntityLabelKey } from '@i18n/entity'
  import StatValue from './StatValue.svelte'
  import type { AttributWithValues } from './stat'
  import type { MainEntityName } from '@type'

  let {
    entity,
    attribut,
    fromPopup = false,
  }: {
    entity: MainEntityName | 'log'
    attribut: AttributWithValues
    fromPopup?: boolean
  } = $props()

  const totalValue = $derived(attribut.totalValue)
  const mainColor = $derived(getColor(entity))
  const entityLabel = $derived(
    entity === 'log'
      ? $translate('tab.log')
      : $translate(getEntityLabelKey(entity)),
  )
</script>

<div
  class="stat-box box-shadow box-shadow-color shadow-{entity}"
  class:from-popup={fromPopup}
  style="background: {mainColor}44;"
>
  <h2 class="title is-6">
    <Icon type={entity} />
    {entityLabel}
    <span class="separator"></span>
    <Icon type={attribut.icon ?? attribut.key ?? ''} />
    {attribut.name}
  </h2>
  <div class="values-wrapper">
    <div class="values">
      {#each attribut.values as value, i (i)}
        <StatValue {value} {totalValue} {mainColor} />
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  @use 'main.scss' as *;
  @use '../style/icon.scss' as *;

  .stat-box {
    :global {
      @include icon-color;
    }
  }

  .stat-box {
    position: absolute;
    min-height: 0;
    margin-bottom: 0;
    box-sizing: border-box;
    border-radius: 4px;
    overflow: hidden;
    &.from-popup {
      position: relative;
    }
    :global(html.roundedDesign) & {
      border-radius: $rounded;
    }
    .title {
      display: inline-block;
      text-align: center;
      width: 100%;
      margin: auto;
      line-height: 1.5;
      padding: 10px;
      .separator {
        margin: 0 5px;
      }
    }
    .values {
      overflow: auto;
      max-height: 400px;
      @include scrollbar-light();
    }
  }

  :global(html.pageShadowColored .box-shadow.box-shadow-color) {
    .stat-box {
      @each $entity in $entities {
        &.shadow-#{$entity} {
          border: 1px solid #{color($entity)};
        }
      }
    }
  }
</style>
