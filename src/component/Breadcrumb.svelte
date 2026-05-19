<script lang="ts">
  import { tick } from 'svelte'
  import Icon from '@layout/Icon.svelte'
  import Link from '@layout/Link.svelte'
  import type { BreadcrumbItem } from '@lib/breadcrumb'

  let {
    items,
  }: {
    items: BreadcrumbItem[]
  } = $props()

  let isOpen = $state(false)
  let buttonElement = $state<HTMLButtonElement>()
  let popoverElement = $state<HTMLSpanElement>()
  let popoverLeft = $state(0)
  let popoverTop = $state(0)
  let arrowLeft = $state(20)

  async function open() {
    isOpen = true
    await tick()
    positionPopover()
  }

  function close() {
    isOpen = false
  }

  function toggle(event: MouseEvent) {
    event.stopPropagation()
    if (isOpen) close()
    else open()
  }

  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') close()
  }

  function positionPopover() {
    if (!buttonElement || !popoverElement || !isOpen) return

    const viewportPadding = 16
    const buttonRect = buttonElement.getBoundingClientRect()
    const popoverRect = popoverElement.getBoundingClientRect()
    const maxLeft = window.innerWidth - popoverRect.width - viewportPadding
    const targetLeft = buttonRect.left - 20

    popoverLeft = Math.max(viewportPadding, Math.min(targetLeft, maxLeft))
    popoverTop = buttonRect.bottom + 12
    arrowLeft = buttonRect.left + buttonRect.width / 2 - popoverLeft
  }
</script>

<svelte:window
  onclick={close}
  onkeydown={closeOnEscape}
  onresize={positionPopover}
/>

{#if items.length > 0}
  <span class="breadcrumb-wrapper" class:is-open={isOpen}>
    <button
      bind:this={buttonElement}
      class="icon breadcrumb-button"
      type="button"
      aria-label="Afficher le chemin"
      aria-expanded={isOpen}
      onclick={toggle}
      onmouseenter={open}
      onfocus={open}
    >
      <i class="fas fa-folder-tree"></i>
    </button>
    <span
      bind:this={popoverElement}
      class="breadcrumb-popover box-shadow"
      role="tooltip"
      style:left="{popoverLeft}px"
      style:top="{popoverTop}px"
      style:--arrow-left="{arrowLeft}px"
      onmouseleave={close}
    >
      {#each items as item, i (`${item.type}-${item.id}`)}
        <Link
          href={item.href ?? `${item.type}/${item.id}`}
          entity={item.type}
          click={close}
        >
          <span class="breadcrumb-item">
            <Icon type={item.type} mode="compact" />
            <span class="breadcrumb-name">{item.name}</span>
          </span>
        </Link>
        {#if i < items.length - 1}
          <span class="breadcrumb-separator" aria-hidden="true"></span>
        {/if}
      {/each}
    </span>
  </span>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .breadcrumb-wrapper {
    display: inline-flex;
    position: relative;
    vertical-align: middle;
  }

  .breadcrumb-button {
    width: 1.8rem;
    min-width: 1.8rem;
    height: 1.8rem;
    margin: 0;
    margin-top: -4px;
    padding: 0;
    color: var(--link-color);
    font-size: 1.35rem;
    line-height: 1;
    opacity: 0.6;
    cursor: pointer;
    transition: opacity 0.2s;

    i {
      line-height: 1;
    }

    &:hover,
    &:focus {
      opacity: 1;
    }
  }

  .breadcrumb-popover {
    position: fixed;
    z-index: 50;
    box-sizing: border-box;
    width: max-content;
    min-width: 260px;
    max-width: min(680px, calc(100vw - 32px));
    padding: 10px;
    display: none;
    flex-direction: column;
    gap: 2px;
    border: 1px solid $color-5;
    border-radius: $rounded;
    background: $background-2;
    font-size: 1rem;
    line-height: 1.3;
    white-space: normal;

    &::before,
    &::after {
      content: '';
      position: absolute;
      left: calc(var(--arrow-left) - 8px);
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
    }

    &::before {
      top: -9px;
      border-bottom: 9px solid $color-5;
    }

    &::after {
      top: -8px;
      border-bottom: 9px solid $background-2;
    }
  }

  .breadcrumb-wrapper:hover .breadcrumb-popover,
  .breadcrumb-wrapper:focus-within .breadcrumb-popover,
  .breadcrumb-wrapper.is-open .breadcrumb-popover {
    display: inline-flex;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
    padding: 6px 8px;
    border-radius: $rounded;
  }

  .breadcrumb-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .breadcrumb-separator {
    width: 1px;
    height: 8px;
    margin-left: 19px;
    background: $color-5;
    opacity: 0.8;
  }

  @include viewport-tiny-mobile {
    .breadcrumb-popover {
      left: 12px !important;
      right: 12px;
      width: auto;
      max-width: none;

      &::before,
      &::after {
        display: none;
      }
    }
  }
</style>
