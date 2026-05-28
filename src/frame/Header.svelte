<script lang="ts">
  import { onMount } from 'svelte'
  import { whenAppReady, nbFavorite, headerOpen } from '@lib/store'
  import { getLinkUrl, isSsgRendering } from '@lib/url'
  import { checkApiAvailability } from '@lib/api-availability'
  import { checkSemanticExportAvailability } from '@lib/semantic-export'
  import { router } from '@router/router.svelte'
  import { onPageHomepage } from '@router/router-store'
  import { isMobile } from '@lib/viewport-manager'
  import logo from '@img/logo.png'
  import logoDark from '@img/logo-dark.png'
  import Loading from '@frame/Loading.svelte'
  import MainFilter from '@component/MainFilter.svelte'
  import HeaderBackButton from './HeaderBackButton.svelte'
  import HeaderDropdown from './HeaderDropdown.svelte'
  import HeaderLink from './HeaderLink.svelte'
  import Link from '@layout/Link.svelte'
  import Footer from '@frame/Footer.svelte'
  import type { ApiAvailability } from '@lib/api-availability'

  let scrollY = $state(0)
  let loading = $state(true)
  let apiAvailability = $state<ApiAvailability>({ available: false })
  let semanticExportAvailable = $state(false)

  const toggleHeader = () => ($headerOpen = !$headerOpen)
  const closeMenu = () => ($headerOpen = false)

  function clickOnMainLogo() {
    closeMenu()
    if (!$onPageHomepage) {
      const url = getLinkUrl('')
      router.navigate('/')
      if (url) window.history.replaceState(null, '', url)
      return
    }
    const elem: HTMLElement | null = document.querySelector(
      '.tabs-container-ul .tab-entity-about a.tab-select-btn',
    )
    elem?.click()
  }

  $effect(() => {
    if (!$isMobile && $headerOpen) {
      closeMenu()
    }
  })

  onMount(() => {
    checkApiAvailability().then(availability => {
      apiAvailability = availability
    })
  })

  $whenAppReady.then(() => {
    loading = false
    checkSemanticExportAvailability().then(available => {
      semanticExportAvailable = available
    })
  })
</script>

<svelte:window bind:scrollY />

<HeaderBackButton />

<nav
  class="navbar is-fixed-top"
  class:header-open={$headerOpen}
  class:header-on-top={scrollY < 10 || $headerOpen}
  class:box-shadow={scrollY >= 10 && !$headerOpen}
  style="max-height: 48px; min-height: 48px;"
>
  <div class="navbar-brand">
    <Link href="" className="navbar-item" alternativeAction={clickOnMainLogo}>
      <img src={logo} class="header-logo logo-light" alt="logo" />
      <img src={logoDark} class="header-logo logo-dark" alt="logo" />
    </Link>

    <div class="mobile-right-btn">
      <button
        class="navbar-burger"
        class:is-active={$headerOpen}
        aria-label="menu"
        onclick={toggleHeader}
      >
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>

  <div
    class="navbar-menu"
    class:box-shadow={$headerOpen}
    class:is-active={$headerOpen}
  >
    <div class="navbar-start">
      {#if loading}
        <div class="navbar-item">
          <Loading type="mini" />
        </div>
      {/if}

      <HeaderDropdown
        title="Contexte"
        pages={[
          'organization',
          'organizations',
          'folder',
          'folders',
          'tag',
          'tags',
          'concept',
          'concepts',
          'doc',
          'docs',
        ]}
        pageEntities={{
          organization: 'organization',
          organizations: 'organization',
          folder: 'folder',
          folders: 'folder',
          tag: 'tag',
          tags: 'tag',
          concept: 'concept',
          concepts: 'concept',
          doc: 'doc',
          docs: 'doc',
        }}
        ifUse={['organization', 'folder', 'tag', 'concept', 'doc']}
      >
        <HeaderLink standard="organization" />
        <HeaderLink standard="folder" />
        <HeaderLink standard="tag" />
        <HeaderLink standard="concept" />
        <HeaderLink standard="doc" />
      </HeaderDropdown>

      <HeaderDropdown
        title="Données"
        pages={[
          'dataset',
          'datasets',
          'variable',
          'variables',
          'enumeration',
          'enumerations',
          'openapi',
          'dcat',
        ]}
        pageEntities={{
          dataset: 'dataset',
          datasets: 'dataset',
          variable: 'variable',
          variables: 'variable',
          enumeration: 'enumeration',
          enumerations: 'enumeration',
          openapi: 'openapi',
          dcat: 'dcat',
        }}
        ifUse={['dataset', 'variable', 'enumeration']}
      >
        <HeaderLink standard="dataset" />
        <HeaderLink standard="variable" />
        <HeaderLink standard="enumeration" />
        {#if apiAvailability.available}
          <HeaderLink href="openapi" pages={['openapi']} icon="openapi">
            <span>OpenAPI</span>
          </HeaderLink>
        {/if}

        {#if semanticExportAvailable}
          <HeaderLink href="dcat" pages={['dcat']} icon="dcat">
            <span>DCAT</span>
          </HeaderLink>
        {/if}
      </HeaderDropdown>

      <HeaderDropdown title="Filtre" ifUse={['configFilter']}>
        <MainFilter />
      </HeaderDropdown>

      <HeaderLink
        href="favorite"
        pages={['favorite']}
        icon="favorite"
        info="Favoris"
        ><span class="visible-on-mobile">Favoris</span><span
          class="num-style favorite-number"
          data-favorite-counter>{$nbFavorite}</span
        ></HeaderLink
      >

      <HeaderLink href="about" pages={['about']} icon="about" info="A propos">
        <span class="visible-on-mobile">A propos</span>
      </HeaderLink>

      <HeaderLink
        href="options"
        pages={['options']}
        icon="option"
        info="Options"
      >
        <span class="visible-on-mobile">Options</span>
      </HeaderLink>
    </div>

    <div class="navbar-end">
      {#if $isMobile && !isSsgRendering}
        <Footer menuMobile={true} />
      {/if}
    </div>
  </div>
</nav>

<style lang="scss">
  @use 'main.scss' as *;

  .navbar {
    background: $background-1;
    border-bottom: 1px solid $color-5;
    border-color: $color-5;
    z-index: 2000;
    transition:
      border-color $transition-basic-1,
      box-shadow $transition-basic-1;
    &.header-on-top {
      border-color: $background-1;
    }
    .navbar-brand {
      min-height: auto;
      height: 47px;
      padding-left: 3rem;
      justify-content: space-between;
      .mobile-right-btn {
        display: flex;
      }
      :global(a:nth-child(1)) {
        padding-left: 0;
        padding-top: 0;
      }
      img {
        height: 20px;
        transition: $transition-basic-1;
      }
      .logo-light {
        display: block;
      }
      .logo-dark {
        display: none;
      }
      :global(html.dark-mode) & {
        .logo-light {
          display: none;
        }
        .logo-dark {
          display: block;
        }
      }
      .navbar-burger:hover {
        background: none;
      }
    }
    .navbar-menu {
      background: $background-1;
      .navbar-end {
        padding-right: 0;
        margin-left: 10px;
      }
      &.is-active .navbar-end {
        margin-left: auto;
      }
    }
    .favorite-number {
      padding-left: 8px;
      height: 1rem;
    }
  }

  :global(html.roundedDesign) {
    .navbar-menu.is-active {
      border-radius: $rounded-bottom;
    }
  }

  @mixin small-mobile-header-layout {
    .navbar .navbar-brand {
      padding-left: 15px;
      padding-right: 0;
      .mobile-right-btn {
        padding-right: 0;
      }
    }
    .navbar-menu {
      padding-left: 3px;
      padding-right: 3px;
      margin-left: 0;
      margin-right: 0;
    }
  }

  @mixin mobile-header-layout {
    .visible-on-mobile {
      display: initial;
    }
  }

  :global(body.viewport-managed.small-mobile) {
    @include small-mobile-header-layout;
  }

  @media (max-width: $small-mobile-limit) {
    :global(body:not(.viewport-managed)) {
      @include small-mobile-header-layout;
    }
  }

  @include viewport-mobile {
    @include mobile-header-layout;
  }

  .visible-on-mobile {
    display: none;
  }

  :global(.favorite-fly-star) {
    color: color('favorite');
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
  }

  .favorite-number {
    display: inline-block;
    transform-origin: center;
  }

  :global(.favorite-number.favorite-counter-hit) {
    animation: favorite-counter-hit 260ms cubic-bezier(0.2, 0, 0, 1);
  }

  :global(.favorite-number.favorite-counter-remove) {
    animation: favorite-counter-remove 220ms cubic-bezier(0.2, 0, 0, 1);
  }

  @keyframes favorite-counter-hit {
    45% {
      transform: scale(1.25);
    }
  }

  @keyframes favorite-counter-remove {
    45% {
      opacity: 0.65;
      transform: scale(0.82);
    }
  }
</style>
