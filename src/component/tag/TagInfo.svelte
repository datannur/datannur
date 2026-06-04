<script lang="ts">
  import db from '@db'
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import TagInfo from '@info-table/TagInfo.svelte'
  import TagsInfo from '@info-table/TagsInfo.svelte'
  import DataSizeInfo from '@info-table/DataSizeInfo.svelte'
  import DeepLevelInfo from '@info-table/DeepLevelInfo.svelte'
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'
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
  {#if tag.propagateToParents}
    <tr>
      <td
        ><Icon type="propagateToParents" />
        {t('column.propagates.title')}</td
      >
      <td>{t('column.propagates.parentTargets')}</td>
    </tr>
  {/if}
  <TagsInfo
    tags={tag.impliedTags ?? []}
    label={t('column.alsoImplies.title')}
  />
  <TagsInfo
    tags={tag.impliedByTags ?? []}
    label={t('column.impliedBy.title')}
  />
</TableWrapper>
{#if tag.description}
  <DescriptionInfo description={tag.description} />
{/if}
