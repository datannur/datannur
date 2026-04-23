<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    children: Snippet
    element?: HTMLDivElement
    id?: string
    class?: string
    fadeColor?: string
    fadeWidth?: string
  }

  let {
    children,
    element = $bindable(),
    id,
    class: scrollerClass = '',
    fadeColor = 'var(--background-1)',
    fadeWidth = '120px',
  }: Props = $props()

  let canScrollLeft = $state(false)
  let canScrollRight = $state(false)

  function horizontalScroll(node: HTMLElement) {
    const update = () => {
      canScrollLeft = node.scrollLeft > 1
      canScrollRight = node.scrollLeft + node.clientWidth < node.scrollWidth - 1
    }

    node.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    observer.observe(node)
    update()

    return {
      destroy() {
        node.removeEventListener('scroll', update)
        window.removeEventListener('resize', update)
        observer.disconnect()
      },
    }
  }

  function scrollToEdge(direction: 'left' | 'right') {
    if (!element) return
    element.scrollTo({
      left: direction === 'left' ? 0 : element.scrollWidth,
      behavior: 'smooth',
    })
  }
</script>

<div
  class="scrollable-row-wrapper"
  class:can-scroll-left={canScrollLeft}
  class:can-scroll-right={canScrollRight}
  style="--fade-color: {fadeColor}; --fade-width: {fadeWidth}"
>
  {#if canScrollLeft}
    <button
      type="button"
      class="scroll-arrow scroll-arrow-left"
      aria-label="Défiler vers la gauche"
      onclick={() => scrollToEdge('left')}
    >
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  {/if}
  {#if canScrollRight}
    <button
      type="button"
      class="scroll-arrow scroll-arrow-right"
      aria-label="Défiler vers la droite"
      onclick={() => scrollToEdge('right')}
    >
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  {/if}
  <div
    {id}
    class="scrollable-row-inner {scrollerClass}"
    bind:this={element}
    use:horizontalScroll
  >
    {@render children()}
  </div>
</div>

<style lang="scss">
  .scrollable-row-wrapper {
    position: relative;

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 1px;
      width: var(--fade-width);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 2;
    }
    &::before {
      left: 0;
      background: linear-gradient(
        to right,
        var(--fade-color),
        color-mix(in srgb, var(--fade-color), transparent 100%)
      );
    }
    &::after {
      right: 0;
      background: linear-gradient(
        to left,
        var(--fade-color),
        color-mix(in srgb, var(--fade-color), transparent 100%)
      );
    }
    &.can-scroll-left::before {
      opacity: 1;
    }
    &.can-scroll-right::after {
      opacity: 1;
    }
  }

  .scroll-arrow {
    position: absolute;
    top: 0;
    bottom: 1px;
    z-index: 3;
    width: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    color: var(--color-2);
    font-size: 1rem;
    transition: color 0.15s ease;

    &:hover,
    &:focus-visible {
      color: var(--color-1);
    }
    &:focus {
      outline: none;
    }
  }
  .scroll-arrow-left {
    left: 0;
  }
  .scroll-arrow-right {
    right: 0;
  }

  .scrollable-row-inner {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      width: 0;
      height: 0;
      display: none;
    }
  }
</style>
