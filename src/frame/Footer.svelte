<script lang="ts">
  import db from '@db'
  import { whenAppReady, footerVisible } from '@lib/store'
  import { getDatetime, getTimeAgo } from '@lib/time'
  import Loading from '@frame/Loading.svelte'
  import Icon from '@layout/Icon.svelte'
  import DarkModeSwitch from '@dark-mode/DarkModeSwitch.svelte'
  import LanguageSelect from '@i18n/LanguageSelect.svelte'
  import { currentLocale, translate } from '@i18n/i18n'
  import HeaderLink from '@frame/HeaderLink.svelte'

  let { menuMobile = false }: { menuMobile?: boolean } = $props()
  let contactEmail = $state('loading')
  const lastUpdate = $state({
    state: 'loading',
    value: 0,
    relative: '',
    absolute: '',
  })
  const year = new Date().getFullYear()

  let currentInterval: ReturnType<typeof setInterval> | undefined = undefined
  let interval = 1000
  function updateLastModif() {
    const timestamp = lastUpdate.value * 1000
    lastUpdate.relative = getTimeAgo(
      timestamp,
      false,
      false,
      new Date(),
      $currentLocale,
    )
    const secondsAgo = Math.abs(Date.now() - timestamp) / 1000
    if (interval === 1000 && secondsAgo >= 60) {
      clearInterval(currentInterval)
      interval = 60000
      currentInterval = setInterval(updateLastModif, interval)
    }
  }

  $whenAppReady.then(() => {
    contactEmail = db.getConfig('contact_email') as string
    lastUpdate.state = 'loaded'
    const lastModifTimestamp = db.getLastModifTimestamp()
    if (lastModifTimestamp) lastUpdate.value = lastModifTimestamp
    if (lastUpdate.value) {
      const timestamp = lastUpdate.value * 1000
      lastUpdate.relative = getTimeAgo(
        timestamp,
        false,
        false,
        new Date(),
        $currentLocale,
      )
      lastUpdate.absolute = getDatetime(timestamp)
      currentInterval = setInterval(updateLastModif, interval)
    } else {
      lastUpdate.state = 'notFound'
    }
  })

  $effect(() => {
    const locale = $currentLocale
    if (lastUpdate.state === 'loaded' && lastUpdate.value) {
      lastUpdate.relative = getTimeAgo(
        lastUpdate.value * 1000,
        false,
        false,
        new Date(),
        locale,
      )
    }
  })
</script>

{#if $footerVisible || menuMobile}
  <footer class="footer" class:main-footer={!menuMobile}>
    <div class="footer-content">
      <div>
        <a href="https://datannur.com" target="_blanck">
          © {year} dat<span class="main-color">a</span>nnur
        </a>
      </div>
      {#if __APP_VERSION__}
        <div>
          <a
            href="https://github.com/datannur/datannur/releases/tag/v{__APP_VERSION__}"
            target="_blanck"
          >
            v{__APP_VERSION__}
          </a>
        </div>
      {/if}
      <div>
        <a
          href="https://github.com/datannur/datannur"
          target="_blanck"
          aria-label="GitHub"
          title="GitHub"
        >
          <Icon type="github" marginRight={false} />
        </a>
      </div>
      <div>
        <HeaderLink
          href="meta"
          pages={['meta', 'metaFolder', 'metaDataset', 'metaVariable']}
          className=""
        >
          <Icon type="internalView" marginRight={false} />
          {$translate('nav.internal')}
        </HeaderLink>
      </div>
      <div>
        <DarkModeSwitch />
      </div>
      <div>
        <LanguageSelect />
      </div>
      {#if lastUpdate.state === 'loading'}
        <div>
          <Loading type="mini" position="relative" />
        </div>
      {:else if lastUpdate.state === 'loaded'}
        <div>
          <span
            class="break-line use-tooltip tooltip-top"
            title={lastUpdate.absolute}
          >
            {$translate('footer.updated')}
            {lastUpdate.relative}
          </span>
        </div>
      {/if}

      {#if contactEmail}
        <div>
          {#if contactEmail === 'loading'}
            <Loading type="mini" position="relative" />
          {:else}
            <a href="mailto:{contactEmail}" target="_blanck">{contactEmail}</a>
          {/if}
        </div>
      {/if}
    </div>
  </footer>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .footer {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.3rem 3rem;
    background-color: transparent;
    color: $color-2;
    .footer-content {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      min-height: 2.65rem;
      & > div {
        margin: 0.3rem 0.75rem;
      }

      .main-color {
        color: $color-3;
      }
    }
  }

  @include viewport-small-mobile {
    .footer {
      padding-left: 0.75rem;
      padding-right: 0.75rem;
    }
  }

  @include viewport-mobile {
    .main-footer {
      display: none;
    }
  }
</style>
