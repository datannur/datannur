<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { footerVisible } from '@lib/store'
  import {
    checkApiAvailability,
    type ApiAvailability,
  } from '@lib/api-availability'

  let apiAvailability = $state<ApiAvailability>({ available: false })
  let loading = $state(true)

  onMount(() => {
    const previousFooterVisible = get(footerVisible)
    $footerVisible = false

    checkApiAvailability().then(availability => {
      apiAvailability = availability
      loading = false
    })

    return () => {
      $footerVisible = previousFooterVisible
    }
  })
</script>

<section class="openapi-page">
  {#if loading}
    <div class="notice">Chargement de la documentation OpenAPI...</div>
  {:else if !apiAvailability.available}
    <div class="notice warning">
      Aucune API locale ou intégrée n'est disponible pour ce catalogue.
    </div>
  {:else}
    <div class="openapi-frame-shell">
      <iframe
        title="Documentation OpenAPI"
        src={apiAvailability.docsUrl}
        loading="lazy"
      ></iframe>
    </div>
  {/if}
</section>

<style lang="scss">
  @use 'main.scss' as *;

  .openapi-page {
    position: fixed;
    inset: 48px 0 0;
    color: $color-1;
    width: 100%;
    height: calc(100vh - 48px);
    padding: 0;
  }

  .notice {
    margin: 1rem;
    border: 1px solid $color-5;
    border-radius: 6px;
    padding: 1rem;
    background: $background-2;
    &.warning {
      border-color: #d8973c;
    }
  }

  .openapi-frame-shell {
    width: 100%;
    height: 100%;
  }

  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: white;
  }
</style>
