<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import OrganizationInfo from '@info-table/OrganizationInfo.svelte'
  import TagsInfo from '@info-table/TagsInfo.svelte'
  import DeepLevelInfo from '@info-table/DeepLevelInfo.svelte'
  import DataSizeInfo from '@info-table/DataSizeInfo.svelte'
  import PeriodInfo from '@info-table/PeriodInfo.svelte'
  import type { Organization } from '@type'

  let { organization }: { organization: Organization } = $props()
</script>

<TableWrapper>
  <IdInfo id={organization.id} />
  {#if organization.parents}
    <DeepLevelInfo level={organization.parents.length + 1} />
  {/if}
  {#if organization.parentId}
    <OrganizationInfo organizationId={organization.id} isSelf={true} />
  {/if}
  {#if organization.email}
    <tr>
      <td><Icon type="email" /> Email</td>
      <td>
        <a href="mailto:{organization.email}" target="_blanck">
          {organization.email}
        </a>
      </td>
    </tr>
  {/if}
  {#if organization.phone}
    <tr>
      <td><Icon type="phone" /> Téléphone</td>
      <td>
        <a href="tel:{organization.phone}" target="_blanck">
          {organization.phone}
        </a>
      </td>
    </tr>
  {/if}
  <DataSizeInfo dataSize={organization.dataSizeRecursive} />
  {#if organization.period}
    <PeriodInfo
      period={organization.period}
      periodDuration={organization.periodDuration}
    />
  {/if}
  {#if organization.tags}
    <TagsInfo tags={organization.tags} />
  {/if}
</TableWrapper>
{#if organization.description}
  <DescriptionInfo description={organization.description} />
{/if}
