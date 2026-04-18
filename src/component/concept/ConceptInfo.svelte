<script lang="ts">
  import db from '@db'
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import TagsInfo from '@info-table/TagsInfo.svelte'
  import DeepLevelInfo from '@info-table/DeepLevelInfo.svelte'
  import type { Concept } from '@type'

  let { concept }: { concept: Concept } = $props()
</script>

<TableWrapper>
  <IdInfo id={concept.id} />
  {#if db.useRecursive.concept}
    {#if concept.parents}
      <DeepLevelInfo level={concept.parents?.length + 1} />
    {/if}
  {/if}
  {#if concept.tags?.length}
    <TagsInfo tags={concept.tags} />
  {/if}
</TableWrapper>
{#if concept.description}
  <DescriptionInfo description={concept.description} />
{/if}
