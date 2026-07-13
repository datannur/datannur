<script lang="ts">
  import db from '@db'
  import { whenAppReady, footerVisible } from '@lib/store'
  import { hasTouchScreen } from '@lib/browser-utils'
  import { UrlParam, getPackageBasePath, isHttp } from '@lib/url'
  import { isMobile } from '@lib/viewport-manager'
  import GenericRouter from '@router/GenericRouter.svelte'
  import routerIndex from '@page/.router-index'
  import Logs from '@lib/logs'
  import SearchHistory from '@search/search-history'
  import Options from '@lib/options'
  import { DarkMode, darkModeTheme } from '@dark-mode/dark-mode'
  import { copyTextListenClick } from '@lib/copy-text'
  import { initTooltips, initColumnStatBtn } from '@lib/tooltip-events'
  import Header from '@frame/Header.svelte'
  import Footer from '@frame/Footer.svelte'
  import Popup from '@layout/Popup.svelte'
  import StatBox from '@stat/StatBox.svelte'
  import SearchBar from '@search/SearchBar.svelte'
  import FloatingChatButton from '@llm/FloatingChatButton.svelte'
  import { initApp, ensureMetaReady } from '@src/app-mode/app-init'
  import { initI18n } from '@i18n/i18n'
  import { t } from '@i18n/messages'
  import type { AttributWithValues } from '@stat/stat'
  import type { MainEntityName, EntityName } from '@src/type'

  let errorLoadingDb = $state(false)

  let isPopupColumnStatOpen = $state(false)
  let columnStatEntity: MainEntityName | 'log' | undefined = $state()
  let columnStatAttribut: AttributWithValues | undefined = $state()
  let hasCustomBanner = $state(false)

  Options.init({
    entityTitleTransition: true,
    roundedDesign: true,
    openAllRecursive: true,
    evolutionSummary: false,
    pageShadowColored: false,
    language: 'auto',
  })

  const i18nReady = initI18n()
  DarkMode.init()

  const manifestHref = `${getPackageBasePath()}app/manifest.json?v=7`

  $whenAppReady = (async () => {
    try {
      await i18nReady
      await initApp()
    } catch (e) {
      console.error(e)
      errorLoadingDb = true
    }
  })()

  if (hasTouchScreen) {
    document.documentElement.classList.toggle('has-touch-screen')
  }

  const isDark = $derived($darkModeTheme === 'dark')

  initTooltips()
  initColumnStatBtn((entity, attribut) => {
    columnStatEntity = entity
    columnStatAttribut = attribut
    isPopupColumnStatOpen = true
  })

  copyTextListenClick()

  function getBannerSrc(bannerMarkdown: string) {
    const bannerLines = bannerMarkdown
      .split('\n')
      .filter(line => line.includes('main-banner'))
    const themedBannerLine =
      bannerLines.find(line => line.includes('dark-mode') === isDark) ??
      bannerLines[0] ??
      bannerMarkdown
    return themedBannerLine.split('(')[1]?.split(')')[0] ?? ''
  }

  function getThemedBannerSrc(bannerMarkdown: string) {
    return getBannerSrc(bannerMarkdown).replaceAll(
      '{darkMode}',
      isDark ? '-dark' : '',
    )
  }

  $effect(() => {
    const cssVarStyle = document.documentElement.style

    if (hasCustomBanner) {
      const mainBanner = new Image()
      mainBanner.src = getThemedBannerSrc(db.getConfig('banner') as string)
      mainBanner.onload = () => {
        cssVarStyle.setProperty(
          '--main-banner-width',
          mainBanner.width.toString(),
        )
        cssVarStyle.setProperty(
          '--main-banner-height',
          mainBanner.height.toString(),
        )
      }
      return
    }

    cssVarStyle.setProperty('--main-banner-width', isDark ? '732' : '734')
    cssVarStyle.setProperty('--main-banner-height', '140')
  })

  $whenAppReady.then(() => {
    hasCustomBanner = db.exists('config', 'banner')

    console.log('db (Jsonjsdb):', db)
  })

  function handleRouteChange(ctx: {
    entity: string
    params: Record<string, unknown>
    entityId: string
  }) {
    setTimeout(() => {
      const fromSearch = UrlParam.get('from_search')
      if (fromSearch) {
        const { entityId } = ctx
        if (entityId) {
          SearchHistory.add(ctx.entity as MainEntityName, entityId)
          Logs.add('searchBar', { entity: ctx.entity, entityId })
          UrlParam.delete('from_search')
          UrlParam.delete('search')
        }
      }
    }, 1)

    setTimeout(
      () =>
        Logs.add('loadPage', {
          entity: ctx.entity,
          ...(ctx.entityId && { entityId: ctx.entityId }),
        }),
      10,
    )
  }
</script>

<svelte:head>
  {#if isHttp}
    <link href={manifestHref} rel="manifest" />
  {/if}
</svelte:head>

{#await Options.loaded then}
  <div class="main-container">
    <Header />
    <div id="wrapper" class:no-footer={!$footerVisible}>
      {#if errorLoadingDb}
        <div class="error-loading-db">
          <h2 class="title">{t('error.loadingTitle')}</h2>
          <p>{t('error.loadingDatabase')}</p>
          <p>{t('error.loadingRetry')}</p>
          <p>{t('error.loadingSupport')}</p>
        </div>
      {:else}
        <SearchBar />
        <GenericRouter
          {routerIndex}
          whenAppReady={$whenAppReady}
          onRouteChange={handleRouteChange}
          beforeRoute={(entity: string) =>
            entity.startsWith('meta') ? ensureMetaReady() : undefined}
          getEntityData={(entity: string, id: string) =>
            db.get(entity as EntityName, id)}
        />
      {/if}
    </div>
    {#if !$isMobile}
      <Footer />
    {/if}
  </div>
{/await}

<Popup bind:isOpen={isPopupColumnStatOpen}>
  {#if columnStatEntity && columnStatAttribut}
    <StatBox
      entity={columnStatEntity}
      attribut={columnStatAttribut}
      fromPopup={true}
    />
  {/if}
</Popup>

<FloatingChatButton />

<style lang="scss">
  @use 'main.scss' as *;

  .main-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    max-width: var(--app-width);
    width: 100%;
    padding-top: 3.25rem;

    :global(body.chat-open) & {
      height: 100vh;
      overflow-y: auto;
    }
  }

  .error-loading-db {
    position: absolute;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 700px;
    h2 {
      color: $color-3;
    }
    p {
      margin: 0.5em 0;
    }
  }
</style>
