<script lang="ts">
  import db from '@db'
  import { page } from '@router/router-store'
  import { whenAppReady, headerOpen } from '@lib/store'
  import { pluralize } from '@lib/util'
  import { entityNames } from '@lib/constant'
  import Link from '@layout/Link.svelte'
  import Icon from '@layout/Icon.svelte'
  import type { Snippet } from 'svelte'
  import type { MainEntityName } from '@type'

  let {
    href: hrefProp = '',
    icon: iconProp = '',
    className = 'navbar-item',
    pages: pagesProp = [],
    ifUse: ifUseProp = null,
    standard = '',
    info = '',
    children = null,
  }: {
    href?: string
    icon?: string
    className?: string
    pages?: string[]
    ifUse?: keyof typeof db.use | null
    standard?: MainEntityName | ''
    info?: string
    children?: Snippet | null
  } = $props()

  let loading = $state(true)
  let href = $derived(standard ? pluralize(standard) : hrefProp)
  let pages = $derived(standard ? [standard, pluralize(standard)] : pagesProp)
  let icon = $derived(standard ? standard : iconProp)
  let ifUse = $derived(standard ? standard : ifUseProp)
  let standardReadable = $derived(standard ? entityNames[standard] + 's' : '')

  const closeMenu = () => ($headerOpen = false)

  function click() {
    closeMenu()
    if (!href) {
      const elem = document.getElementsByClassName(
        'tab-select-btn',
      )[0] as HTMLElement | null
      elem?.click()
    }
  }

  $whenAppReady.then(() => (loading = false))
</script>

{#if !ifUse || (!loading && db.use[ifUse])}
  <Link
    {href}
    {click}
    {className}
    isActive={() => pages.includes($page)}
    entity={icon}
  >
    {#if icon}
      {#if info}
        <span class="break-line use-tooltip fix-on-mobile" title={info}>
          <Icon type={icon} />
        </span>
      {:else}
        <Icon type={icon} />
      {/if}
    {/if}

    {#if standard}
      <span>{standardReadable}</span>
    {:else}
      {@render children?.()}
    {/if}
  </Link>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  @include viewport-mobile {
    .fix-on-mobile {
      padding-left: 0.25em;
      padding-right: 0.75em;
    }
  }
</style>
