<script lang="ts">
  import db from '@db'
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import TagInfo from '@info-table/TagInfo.svelte'
  import TagsInfo from '@info-table/TagsInfo.svelte'
  import DataSizeInfo from '@info-table/DataSizeInfo.svelte'
  import DeepLevelInfo from '@info-table/DeepLevelInfo.svelte'
  import type { Tag } from '@type'

  let { tag }: { tag: Tag } = $props()
</script>

<TableWrapper>
  <IdInfo id={tag.id} />
  {#if db.useRecursive.tag}
    {#if tag.parents}
      <DeepLevelInfo level={tag.parents?.length + 1} />
    {/if}
    {#if tag.parents?.length}
      <TagInfo tagId={tag.id} />
    {/if}
  {/if}
  <DataSizeInfo dataSize={tag.dataSizeRecursive} />
  <TagsInfo tags={tag.impliedTags ?? []} label="Implique aussi" />
  <TagsInfo tags={tag.impliedByTags ?? []} label="Est impliqué par" />
</TableWrapper>
{#if tag.description}
  <DescriptionInfo description={tag.description} />
{/if}
