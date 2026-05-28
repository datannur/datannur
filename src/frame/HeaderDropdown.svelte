<script lang="ts">
  import db from '@db'
  import { page } from '@router/router-store'
  import { whenAppReady } from '@lib/store'
  import type { Snippet } from 'svelte'

  let {
    title,
    pages = [],
    pageEntities = {},
    ifUse = null,
    children,
  }: {
    title: string
    pages?: string[]
    pageEntities?: { [page: string]: string }
    ifUse?: (keyof typeof db.use)[] | null
    children?: Snippet
  } = $props()

  let visible = $derived(!ifUse)
  let activeEntity = $derived(pageEntities[$page] ?? '')
  let hoveredEntity = $state('')
  let titleEntity = $derived(hoveredEntity || activeEntity)
  let closing = $state(false)
  let previousPage = $state<string | null>(null)
  let closingTimeout: number | undefined = undefined

  function closeDropdown() {
    closing = true
    if (closingTimeout) window.clearTimeout(closingTimeout)
    closingTimeout = window.setTimeout(() => {
      closing = false
      closingTimeout = undefined
    }, 260)
  }

  function getElementEntity(element: Element | null) {
    const classList = Array.from(element?.classList ?? [])
    return classList
      .find(className => className.startsWith('color-entity-'))
      ?.replace('color-entity-', '')
  }

  function updateHoveredEntity(event: Event) {
    const element = event.target instanceof Element ? event.target : null
    hoveredEntity =
      getElementEntity(element?.closest('.navbar-item') ?? null) ?? ''
  }

  function clearHoveredEntity() {
    hoveredEntity = ''
  }

  function trackHoveredEntity(node: HTMLElement) {
    node.addEventListener('mouseover', updateHoveredEntity)
    node.addEventListener('focusin', updateHoveredEntity)
    node.addEventListener('mouseleave', clearHoveredEntity)
    node.addEventListener('focusout', clearHoveredEntity)

    return {
      destroy() {
        node.removeEventListener('mouseover', updateHoveredEntity)
        node.removeEventListener('focusin', updateHoveredEntity)
        node.removeEventListener('mouseleave', clearHoveredEntity)
        node.removeEventListener('focusout', clearHoveredEntity)
      },
    }
  }

  $whenAppReady.then(() => {
    if (!ifUse) return
    for (const use of ifUse) {
      if (db.use[use]) visible = true
    }
  })

  $effect(() => {
    const currentPage = $page
    if (previousPage === null) {
      previousPage = currentPage
      return
    }
    if (currentPage !== previousPage) {
      previousPage = currentPage
      closeDropdown()
    }
  })
</script>

{#if visible}
  <div
    class="navbar-item has-dropdown"
    class:is-hoverable={!closing}
    class:is-closing={closing}
    class:has-title-entity={!!titleEntity}
    data-title-entity={titleEntity}
  >
    <div class="navbar-link" class:is-active={pages.includes($page)}>
      <span>{title}</span>
    </div>
    <div class="navbar-dropdown box-shadow" use:trackHoveredEntity>
      {@render children?.()}
    </div>
  </div>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .navbar-link::after {
    border-color: $color-3;
  }
  .navbar-link.is-active,
  .navbar-link:focus,
  .navbar-link:focus-within {
    color: $color-3;
    background: $background-1;
  }

  @each $entity in $entities {
    .navbar-item.has-dropdown.has-title-entity[data-title-entity='#{$entity}']:hover
      .navbar-link,
    .navbar-item.has-dropdown.has-title-entity[data-title-entity='#{$entity}']
      .navbar-link.is-active {
      color: #{color($entity)};
    }
  }

  .navbar-link {
    transition: $transition-basic-1;
  }

  .navbar-dropdown {
    border-top: 0;
    color: $color-3;
    background: $background-1;
  }

  .navbar-item.has-dropdown.is-closing .navbar-dropdown {
    display: none;
  }

  :global(.header-open) {
    .navbar-dropdown.box-shadow {
      box-shadow: none;
    }
  }

  :global(html.roundedDesign) {
    .navbar-dropdown {
      border-radius: $rounded-bottom;
    }
  }
</style>
