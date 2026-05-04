<script lang="ts">
  import type { Snippet } from 'svelte'
  import { extendable } from '@lib/extendable'

  let { ...props }: { class?: string; children?: Snippet } = $props()
</script>

<div
  class={`extendable ${props.class}`}
  onmouseenter={extendable.open}
  onmouseleave={extendable.closeTwoLines}
  onkeydown={() => {}}
  role="button"
  tabindex="0"
>
  {@render props.children?.()}
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .extendable {
    display: -webkit-box;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    width: auto;
    max-height: 50px;
    overflow-x: hidden;
    overflow-y: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    white-space: normal;
    max-width: min(600px, calc(var(--app-width) - 220px));
    &:global(.open) {
      display: block;
      white-space: normal;
    }
    &:global(.open-full) {
      overflow-y: auto;
    }
  }

  @include viewport-small-mobile {
    .extendable {
      max-width: calc(var(--app-width) - 50px);
    }
  }
</style>
