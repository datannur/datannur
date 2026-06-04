<script lang="ts">
  import fitty from 'fitty'
  import db from '@db'
  import { nbFavorite } from '@lib/store'
  import { mainEntityNames } from '@lib/constant'
  import { getEntityTitleTransitionName } from '@lib/page-transition'
  import { getBreadcrumbItems } from '@lib/breadcrumb'
  import { appWidth } from '@lib/viewport-manager'
  import Head from '@frame/Head.svelte'
  import Breadcrumb from '@component/Breadcrumb.svelte'
  import Icon from '@layout/Icon.svelte'
  import Favorite from '@favorite/Favorite.svelte'
  import ShareLink from '@layout/ShareLink.svelte'
  import { t } from '@i18n/messages'
  import { getEntityLabelKey } from '@i18n/entity'
  import { onMount } from 'svelte'
  import type { MouseEventHandler } from 'svelte/elements'
  import type { BreadcrumbItem } from '@lib/breadcrumb'
  import type { FavoritableEntityName, MainEntityName } from '@type'

  function isMainEntityName(value: string): value is MainEntityName {
    return value in mainEntityNames
  }

  let {
    type,
    name,
    mode = 'normal',
    id,
    transitionType = type,
    breadcrumbItems,
    info = '',
    toggleInfo = () => {},
    isFavoritePage = false,
  }: {
    type: string
    name: string
    mode?: string
    id?: string | number
    transitionType?: string
    breadcrumbItems?: BreadcrumbItem[]
    info?: string
    toggleInfo?: MouseEventHandler<HTMLButtonElement>
    isFavoritePage?: boolean
  } = $props()

  const separator = ' | '
  const entityName = $derived(
    isMainEntityName(type) ? t(getEntityLabelKey(type)) : '',
  )

  const title = $derived(
    mode !== 'mainTitle' ? entityName + separator + name : name,
  )

  const item = $derived(id ? db.get(type as MainEntityName, id) : undefined)
  const isFavorite = $derived(item?.isFavorite ?? false)
  const entityFavoritable = $derived(
    id ? (type as FavoritableEntityName) : undefined,
  )
  const breadcrumbType = $derived(isMainEntityName(type) ? type : undefined)
  const resolvedBreadcrumbItems = $derived(
    breadcrumbItems ??
      (breadcrumbType ? getBreadcrumbItems(breadcrumbType, id) : []),
  )

  const itemPage = $derived(id ? true : false)
  const titleTransitionName = $derived(
    id ? getEntityTitleTransitionName(transitionType, id) : undefined,
  )
  let fittyInstance: ReturnType<typeof fitty> | null = null

  onMount(() => {
    fittyInstance = fitty('.fitty', { minSize: 14, maxSize: 32 })
  })

  $effect(() => {
    if ($appWidth && fittyInstance) {
      for (const instance of fittyInstance) {
        instance.fit()
      }
    }
  })
</script>

<Head {title} />

<div class="fitty-wrapper">
  <div>
    <h1 class="title" class:not-item-page={!itemPage}>
      <Icon {type} mode="mainTitle" />
      {#if mode !== 'mainTitle'}
        <span>{entityName}</span>
        {#if info}
          <button class="title-info" onclick={toggleInfo}>{info}</button>
        {/if}
        <span class="title-actions">
          {#if id}
            <Favorite type={entityFavoritable!} {id} {isFavorite} />
          {/if}
          <ShareLink />
          {#if resolvedBreadcrumbItems.length > 0}
            <Breadcrumb items={resolvedBreadcrumbItems} />
          {/if}
        </span>
      {/if}
      <span
        class="title-name fitty"
        data-entity-title-transition={titleTransitionName}
        >{name}
        {#if isFavoritePage}
          <span class="num-style big">{$nbFavorite}</span>
        {/if}
      </span>
    </h1>
  </div>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .fitty-wrapper {
    box-sizing: border-box;
    width: 100%;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: left;
    & > div {
      width: 100%;
    }
    .fitty {
      margin: auto;
    }
  }
  .title-info {
    font-style: italic;
    cursor: pointer;
    margin: 0;
    padding: 0;
    font-size: 1.5rem;
  }
  .title-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: -4px;
    vertical-align: middle;

    :global(.favorite),
    :global(.share-link),
    :global(.breadcrumb-button) {
      width: 2.15rem;
      min-width: 2.15rem;
      height: 2.15rem;
      margin: 0;
      padding: 0;
      font-size: 1.8rem;
      line-height: 1;
    }

    :global(.breadcrumb-button) {
      font-size: 1.65rem;
    }
  }

  @include viewport-small-mobile {
    .fitty-wrapper {
      padding-left: 20px;
      padding-right: 20px;
      .fitty {
        padding: 0;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
      }
      .title {
        padding: 0;
      }
    }
    .title-name {
      display: block;
    }
    .title-info {
      font-size: 1rem;
    }
    .title-actions {
      gap: 6px;

      :global(.favorite),
      :global(.share-link),
      :global(.breadcrumb-button) {
        width: 1.75rem;
        min-width: 1.75rem;
        height: 1.75rem;
        font-size: 1.45rem;
      }

      :global(.breadcrumb-button) {
        font-size: 1.35rem;
      }
    }
    .title.not-item-page {
      :global(.icon) {
        margin-right: 0;
      }
    }
  }
</style>
