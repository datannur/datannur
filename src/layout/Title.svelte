<script lang="ts">
  import fitty from 'fitty'
  import db from '@db'
  import { nbFavorite } from '@lib/store'
  import { entityNames } from '@lib/constant'
  import { appWidth } from '@lib/viewport-manager'
  import Head from '@frame/Head.svelte'
  import Icon from '@layout/Icon.svelte'
  import Favorite from '@favorite/Favorite.svelte'
  import ShareLink from '@layout/ShareLink.svelte'
  import { onMount } from 'svelte'
  import type { MouseEventHandler } from 'svelte/elements'
  import type { FavoritableEntityName, MainEntityName } from '@type'

  let {
    type,
    name,
    mode = 'normal',
    id,
    info = '',
    toggleInfo = () => {},
    isFavoritePage = false,
  }: {
    type: string
    name: string
    mode?: string
    id?: string | number
    info?: string
    toggleInfo?: MouseEventHandler<HTMLButtonElement>
    isFavoritePage?: boolean
  } = $props()

  const separator = ' | '
  const entityName = $derived(entityNames[type as MainEntityName])

  const title = $derived(
    mode !== 'mainTitle' ? entityName + separator + name : name,
  )

  const item = $derived(id ? db.get(type as MainEntityName, id) : undefined)
  const isFavorite = $derived(item?.isFavorite ?? false)
  const entityFavoritable = $derived(
    id ? (type as FavoritableEntityName) : undefined,
  )

  const itemPage = $derived(id ? true : false)
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
        {#if id}
          <Favorite type={entityFavoritable!} {id} {isFavorite} />
          <ShareLink />
        {:else}
          <span class="separator">{separator}</span>
        {/if}
      {/if}
      <span class="title-name fitty"
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
    .title.not-item-page {
      :global(.icon) {
        margin-right: 0;
      }
    }
  }
</style>
