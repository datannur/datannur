<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import InstitutionInfo from '@info-table/InstitutionInfo.svelte'
  import TagsInfo from '@info-table/TagsInfo.svelte'
  import DeepLevelInfo from '@info-table/DeepLevelInfo.svelte'
  import DataSizeInfo from '@info-table/DataSizeInfo.svelte'
  import PeriodInfo from '@info-table/PeriodInfo.svelte'
  import type { Institution } from '@type'

  let { institution }: { institution: Institution } = $props()
</script>

<TableWrapper>
  <IdInfo id={institution.id} />
  {#if institution.parents}
    <DeepLevelInfo level={institution.parents.length + 1} />
  {/if}
  {#if institution.parentId}
    <InstitutionInfo institutionId={institution.id} isSelf={true} />
  {/if}
  {#if institution.email}
    <tr>
      <td><Icon type="email" /> Email</td>
      <td>
        <a href="mailto:{institution.email}" target="_blanck">
          {institution.email}
        </a>
      </td>
    </tr>
  {/if}
  {#if institution.phone}
    <tr>
      <td><Icon type="phone" /> Téléphone</td>
      <td>
        <a href="tel:{institution.phone}" target="_blanck">
          {institution.phone}
        </a>
      </td>
    </tr>
  {/if}
  <DataSizeInfo dataSize={institution.dataSizeRecursive} />
  {#if institution.period}
    <PeriodInfo
      period={institution.period}
      periodDuration={institution.periodDuration}
    />
  {/if}
  {#if institution.tags}
    <TagsInfo tags={institution.tags} />
  {/if}
</TableWrapper>
{#if institution.description}
  <DescriptionInfo description={institution.description} />
{/if}
