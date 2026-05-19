<script lang="ts">
  import { headerOpen } from '@lib/store'
  import { isDesktopAppShell, isFullscreen } from '@lib/browser-utils'
  import { isSmallMobile } from '@lib/viewport-manager'
  import { currentRoute } from '@router/router-store'
  import Icon from '@layout/Icon.svelte'

  let initialRoute = $state<string | null>(null)

  $effect(() => {
    if ($currentRoute && initialRoute === null) {
      initialRoute = $currentRoute
    }
  })

  const canGoBack = $derived(
    initialRoute !== null && $currentRoute !== initialRoute,
  )

  const shouldShow = $derived(
    !$isSmallMobile && (isDesktopAppShell || $isFullscreen) && canGoBack,
  )

  function goBack() {
    $headerOpen = false
    window.history.back()
  }
</script>

{#if shouldShow}
  <button
    class="header-back-button"
    title="Retour"
    aria-label="Retour"
    onclick={goBack}
  >
    <Icon type="back" marginRight={false} />
  </button>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .header-back-button {
    position: fixed;
    top: 0px;
    left: 10px;
    z-index: 15000;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    color: $color-4;
    cursor: pointer;
    transition: $transition-basic-1;
    &:hover,
    &:focus-visible {
      color: $color-3;
    }
  }
</style>
