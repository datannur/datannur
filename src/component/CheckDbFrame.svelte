<script lang="ts">
  import Loading from '@frame/Loading.svelte'

  const checkDbUrl = '?app_mode=check_db'
  let loading = $state(true)
</script>

<div class="check-db-frame">
  {#if loading}
    <div class="loading-state">
      <Loading type="tab" position="absolute" />
      <span>Chargement de la vérification...</span>
    </div>
  {/if}
  <iframe
    class:loaded={!loading}
    title="Vérification d'intégrité"
    src={checkDbUrl}
    onload={() => (loading = false)}
  ></iframe>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .check-db-frame {
    position: relative;
    height: min(760px, calc(100vh - 230px));
    min-height: 420px;
    overflow: hidden;
    background: $background-2;
  }

  .loading-state {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 2.25rem;
    color: $color-2;
    background: $background-2;
  }

  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    opacity: 0;
    background: $background-2;

    &.loaded {
      opacity: 1;
    }
  }

  @include viewport-small-mobile {
    .check-db-frame {
      height: calc(100vh - 190px);
      min-height: 360px;
    }
  }
</style>
