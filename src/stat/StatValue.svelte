<script lang="ts">
  import { getPercent } from '@lib/util'
  import { extendable } from '@lib/extendable'
  import { getCurrentLocale } from '@i18n/i18n'
  import Icon from '@layout/Icon.svelte'
  import Link from '@layout/Link.svelte'
  import type { ValueEntry } from './stat'

  let {
    value,
    totalValue,
    mainColor,
  }: { value: ValueEntry; totalValue: number; mainColor: string } = $props()

  const locale = getCurrentLocale()
  const percent = $derived(getPercent(value.count / totalValue))
</script>

<div class="value-box">
  <div class="value-text">
    <div
      class="cell readable extendable"
      onmouseenter={extendable.open}
      onmouseleave={extendable.closeOneLine}
      onkeydown={() => {}}
      role="button"
      tabindex="0"
    >
      {#if value.icon}
        <Icon type={value.icon} />
      {/if}
      {#if value.link}
        <Link href={value.link}>
          {value.readable}
        </Link>
      {:else}
        {value.readable}
      {/if}
    </div>
    <div class="cell count">{value.count?.toLocaleString(locale)}</div>
    <div class="cell percent">{percent}%</div>
  </div>
  <div
    class="percent-background"
    style="width: {percent}%; background: {mainColor};"
  ></div>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .value-box {
    position: relative;
    padding: 5px 10px;
    width: 100%;
    text-align: right;
    .percent-background {
      position: absolute;
      top: 2px;
      left: 0;
      bottom: 2px;
      z-index: 0;
      opacity: 0.5;
      border-radius: $rounded;
      pointer-events: none;
    }
    .value-text {
      position: relative;
      z-index: 2;
      .cell {
        display: inline-block;
        vertical-align: top;
        &.readable {
          text-align: left;
          max-width: calc(100% - 120px);
        }
        &.count {
          min-width: 50px;
        }
        &.percent {
          min-width: 60px;
        }
      }
    }
  }

  .extendable {
    width: auto;
    max-height: 25px;
    overflow-x: hidden;
    overflow-y: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: min(600px, calc(var(--app-width) - 220px));
    &:global(.open) {
      white-space: pre-wrap;
    }
  }
</style>
