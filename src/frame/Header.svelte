<script lang="ts">
  import { whenAppReady, nbFavorite, headerOpen } from '@lib/store'
  import { isSsgRendering } from '@lib/url'
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

  let scrollY = $state(0)
  let loading = $state(true)

  const toggleHeader = () => ($headerOpen = !$headerOpen)
  const closeMenu = () => ($headerOpen = false)

  function clickOnMainLogo() {
    closeMenu()
    if (!$onPageHomepage) {
      router.navigate('/')
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

  $whenAppReady.then(() => (loading = false))
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
        ]}
        ifUse={['dataset', 'variable', 'enumeration']}
      >
        <HeaderLink standard="dataset" />
        <HeaderLink standard="variable" />
        <HeaderLink standard="enumeration" />
      </HeaderDropdown>

      <HeaderDropdown title="Filtre" ifUse={['filter']}>
        <MainFilter />
      </HeaderDropdown>

      <HeaderLink
        href="favorite"
        pages={['favorite']}
        icon="favorite"
        info="Favoris"
        ><span class="visible-on-mobile">Favoris</span><span
          class="num-style favorite-number">{$nbFavorite}</span
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
</style>
