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

  function horizontalScroll(node: HTMLElement) {
    const update = () => {
      const canLeft = node.scrollLeft > 1
      const canRight = node.scrollLeft + node.clientWidth < node.scrollWidth - 1
      node.dataset.canScrollLeft = canLeft ? 'true' : 'false'
      node.dataset.canScrollRight = canRight ? 'true' : 'false'
    }

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0 || event.deltaX !== 0) return
      if (node.scrollWidth <= node.clientWidth) return
      event.preventDefault()
      node.scrollLeft += event.deltaY
    }

    node.addEventListener('scroll', update, { passive: true })
    node.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    observer.observe(node)
    update()

    return {
      destroy() {
        node.removeEventListener('scroll', update)
        node.removeEventListener('wheel', onWheel)
        window.removeEventListener('resize', update)
        observer.disconnect()
      },
    }
  }
</script>

<div
  class="scrollable-row-wrapper"
  style="--fade-color: {fadeColor}; --fade-width: {fadeWidth}"
>
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
    &:has(:global([data-can-scroll-left='true']))::before {
      opacity: 1;
    }
    &:has(:global([data-can-scroll-right='true']))::after {
      opacity: 1;
    }
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
