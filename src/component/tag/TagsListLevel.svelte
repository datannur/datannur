<script lang="ts">
  import { untrack } from 'svelte'
  import TagsListLevel from '@component/tag/TagsListLevel.svelte'
  import Link from '@layout/Link.svelte'
  import type { TagWithChildren } from '@type'

  let {
    tag: tagProp,
  }: {
    tag: TagWithChildren | { children?: { [key: string]: TagWithChildren } }
  } = $props()

  const tag = untrack(() => tagProp)

  const tagChildrenData: TagWithChildren[] = Object.values(tag.children || {})

  tagChildrenData.sort((a, b) => {
    const aHasChildren = a.children && Object.keys(a.children).length > 0
    const bHasChildren = b.children && Object.keys(b.children).length > 0
    if (aHasChildren && !bHasChildren) return -1
    if (!aHasChildren && bHasChildren) return 1
    return (a.name ?? '').localeCompare(b.name ?? '')
  })

  const isTag = 'id' in tag && 'name' in tag

  const typedTag = isTag ? (tag as TagWithChildren) : null
</script>

<div class="main-tag-list-wrapper">
  {#if isTag && typedTag}
    <span>
      <Link href="tag/{typedTag.id}" entity="tag">{typedTag.name}</Link>
    </span>
  {/if}
  {#if tagChildrenData && tagChildrenData.length > 0}
    <div class="tags-list-level-wrapper" class:with-indent={isTag}>
      {#each tagChildrenData as childTag (childTag.id)}
        {#if childTag.children && Object.values(childTag.children).length > 0}
          <div class="tag-list-level-wrapper">
            <TagsListLevel tag={childTag} />
          </div>
        {:else}
          <span class="tag-last-level"><TagsListLevel tag={childTag} /></span>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .tag-list-level-wrapper,
  .tag-last-level {
    background: #{color('tag')}22;
    border-radius: 20px;
    padding: 5px 15px;
    margin: 2.5px;
  }

  .tag-list-level-wrapper {
    font-weight: bold;
  }
  .main-tag-list-wrapper {
    display: flex;
    flex-direction: column;
  }

  .tags-list-level-wrapper {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .tag-last-level {
    font-weight: normal;
    font-style: italic;
  }
</style>
