<script lang="ts">
  import logo from '@img/logo.png'
  import logoDark from '@img/logo-dark.png'
  import Head from '@frame/Head.svelte'
  import { t } from '@i18n/messages'

  const title = t('loading.title')
</script>

<Head {title} />

<img class="loading-logo logo-light" src={logo} alt="logo" />
<img class="loading-logo logo-dark" src={logoDark} alt="logo" />

<style lang="scss">
  .loading-logo {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 300px;
  }
  .logo-light {
    display: block;
  }
  .logo-dark {
    display: none;
  }
  :global(html.dark-mode) {
    .logo-light {
      display: none;
    }
    .logo-dark {
      display: block;
    }
  }
</style>
