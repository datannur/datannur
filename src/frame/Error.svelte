<script lang="ts">
  import { untrack } from 'svelte'
  import Head from '@frame/Head.svelte'
  import Link from '@layout/Link.svelte'
  import { t } from '@i18n/messages'
  import type { TranslationKey } from '@i18n/types'

  let { type = 'page' }: { type?: string } = $props()
  const initialType = untrack(() => type)

  const itemMap: { [key: string]: TranslationKey } = {
    page: 'error.item.page',
    dataset: 'error.item.dataset',
    organization: 'error.item.organization',
    folder: 'error.item.folder',
    tag: 'error.item.tag',
    doc: 'error.item.doc',
    variable: 'error.item.variable',
    enumeration: 'error.item.enumeration',
  }

  const item = t(itemMap[initialType] ?? 'error.item.element')
  const title = item + ' ' + t('error.missingSuffix')
  const description =
    t('error.descriptionPrefix') +
    ' ' +
    item +
    ' ' +
    t('error.descriptionMiddle')
</script>

<Head {title} {description} />

<div class="section _center">
  <div class="_error">
    <div class="_number">4</div>
    <div class="_illustration">
      <div class="_circle"></div>
      <div class="_clip">
        <div class="_paper">
          <div class="_face">
            <div class="_eyes">
              <div class="_eye _eye-left"></div>
              <div class="_eye _eye-right"></div>
            </div>
            <div class="_rosyCheeks _rosyCheeks-left"></div>
            <div class="_rosyCheeks _rosyCheeks-right"></div>
            <div class="_mouth"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="_number">4</div>
  </div>
  <div class="_text">{description}</div>
  <Link href="" className="button">{t('error.homeLink')}</Link>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  ._center {
    --error-page-color: #{$color-3};
    height: 100%;
    min-height: calc(100vh - 110px);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    font-size: 1.5rem;
    color: var(--error-page-color);
  }

  ._error {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-content: center;
  }

  ._text {
    text-align: center;
    padding: 5px;
  }

  ._number {
    font-weight: 100;
    font-size: 15rem;
    line-height: 1;
  }

  ._illustration {
    position: relative;
    width: 12.2rem;
    margin: 0 2.1rem;
  }

  ._circle {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 12.2rem;
    height: 11.4rem;
    border-radius: 50%;
    background-color: var(--error-page-color);
  }

  ._clip {
    position: absolute;
    bottom: 0.3rem;
    left: 50%;
    transform: translateX(-50%);
    overflow: hidden;
    width: 12.5rem;
    height: 13rem;
    border-radius: 0 0 50% 50%;
  }

  ._paper {
    position: absolute;
    bottom: -0.3rem;
    left: 50%;
    transform: translateX(-50%);
    width: 9.2rem;
    height: 12.4rem;
    border: 0.3rem solid var(--error-page-color);
    background-color: white;
    border-radius: 0.8rem;
  }

  ._face {
    position: relative;
    margin-top: 2.3rem;
  }

  ._eyes {
    position: absolute;
    top: 0;
    left: 2.4rem;
    width: 4.6rem;
    height: 0.8rem;
  }

  ._eye {
    position: absolute;
    bottom: 0;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background-color: var(--error-page-color);
    animation-name: _eye;
    animation-duration: 4s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  }

  ._eye-left {
    left: 0;
  }

  ._eye-right {
    right: 0;
  }

  @keyframes _eye {
    0% {
      height: 0.8rem;
    }
    50% {
      height: 0.8rem;
    }
    52% {
      height: 0.1rem;
    }
    54% {
      height: 0.8rem;
    }
    100% {
      height: 0.8rem;
    }
  }

  ._rosyCheeks {
    position: absolute;
    top: 1.6rem;
    width: 1rem;
    height: 0.2rem;
    border-radius: 50%;
    background-color: #fdabaf;
  }

  ._rosyCheeks-left {
    left: 1.4rem;
  }

  ._rosyCheeks-right {
    right: 1.4rem;
  }

  ._mouth {
    position: absolute;
    top: 3.1rem;
    left: 50%;
    width: 1.6rem;
    height: 0.2rem;
    border-radius: 0.1rem;
    transform: translateX(-50%);
    background-color: var(--error-page-color);
  }

  @include viewport-small-mobile {
    ._error {
      transform: scale(0.5);
    }
  }
</style>
