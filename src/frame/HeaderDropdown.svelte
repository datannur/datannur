<script lang="ts">
  import db from '@db'
  import { page } from '@router/router-store'
  import { whenAppReady } from '@lib/store'
  import type { Snippet } from 'svelte'

  let {
    title,
    pages = [],
    ifUse = null,
    children,
  }: {
    title: string
    pages?: string[]
    ifUse?: (keyof typeof db.use)[] | null
    children?: Snippet
  } = $props()

  let visible = $derived(!ifUse)

  $whenAppReady.then(() => {
    if (!ifUse) return
    for (const use of ifUse) {
      if (db.use[use]) visible = true
    }
  })
</script>

{#if visible}
  <div class="navbar-item has-dropdown is-hoverable">
    <div class="navbar-link" class:is-active={pages.includes($page)}>
      <span>{title}</span>
    </div>
    <div class="navbar-dropdown box-shadow">
      {@render children?.()}
    </div>
  </div>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .navbar-link::after {
    border-color: $color-3;
  }
  .navbar-item.has-dropdown:hover .navbar-link,
  .navbar-link.is-active,
  .navbar-link:focus,
  .navbar-link:focus-within,
  .navbar-link:hover {
    color: $color-3;
    background: $background-1;
  }

  .navbar-link {
    transition: $transition-basic-1;
  }

  .navbar-dropdown {
    border-top: 0;
    color: $color-3;
    background: $background-1;
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
