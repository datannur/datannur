<script lang="ts">
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import TypeInfo from '@info-table/TypeInfo.svelte'
  import FolderInfo from '@info-table/FolderInfo.svelte'
  import type { Enumeration } from '@type'

  let { enumeration }: { enumeration: Enumeration } = $props()
</script>

<TableWrapper>
  <IdInfo id={enumeration.id} />
  <TypeInfo type={enumeration.typeClean} />
  <FolderInfo folderId={enumeration.folderId} />
</TableWrapper>
{#if enumeration.description}
  <DescriptionInfo description={enumeration.description} />
{/if}
