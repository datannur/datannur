<script lang="ts">
  import { getBaseLinkUrl } from '@lib/url'
  import { router } from '@router/router.svelte'
  import type { Snippet } from 'svelte'

  let {
    href,
    className = '',
    click = () => {},
    isActive = () => false,
    alternativeAction = null,
    entity = '',
    children,
  }: {
    href: string
    className?: string
    click?: (event: MouseEvent) => void
    isActive?: () => boolean
    alternativeAction?: (() => void) | null
    entity?: string
    children?: Snippet
  } = $props()

  const base = $derived(href === '/' ? '' : getBaseLinkUrl())

  const entityClass = $derived(entity ? `color-entity-${entity}` : '')

  function goToHref(event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) return
    event.preventDefault()
    if (alternativeAction) {
      alternativeAction()
      return
    }
    router.navigate(href)
  }

  function onClickEvent(event: MouseEvent) {
    click(event)
    goToHref(event)
  }
</script>

<a
  href="{base}{href}"
  class="{className} {entityClass}"
  class:is-active={isActive()}
  onclick={onClickEvent}
>
  {@render children?.()}
</a>

<style lang="scss">
  @use 'main.scss' as *;

  a {
    text-decoration: none;
    transition: $transition-basic-1;
    &:hover,
    &:focus-within,
    &.is-active {
      color: $color-3 !important;
      background: initial !important;
    }
  }

  @each $entity in $entities {
    a.color-entity-#{$entity}:hover,
    a.color-entity-#{$entity}.is-active,
    a.color-entity-#{$entity}:focus-within {
      color: #{color($entity)} !important;
    }
  }
</style>
