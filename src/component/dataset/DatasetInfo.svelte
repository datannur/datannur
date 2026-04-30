<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import OrganizationInfo from '@info-table/OrganizationInfo.svelte'
  import FolderInfo from '@info-table/FolderInfo.svelte'
  import TagsInfo from '@info-table/TagsInfo.svelte'
  import RowInfo from '@info-table/RowInfo.svelte'
  import FrequencyInfo from '@info-table/FrequencyInfo.svelte'
  import LastUpdateInfo from '@info-table/LastUpdateInfo.svelte'
  import NextUpdateInfo from '@info-table/NextUpdateInfo.svelte'
  import LocalisationInfo from '@info-table/LocalisationInfo.svelte'
  import PeriodInfo from '@info-table/PeriodInfo.svelte'
  import DataPathInfo from '@info-table/DataPathInfo.svelte'
  import LinkInfo from '@info-table/LinkInfo.svelte'
  import DeliveryFormatInfo from '@info-table/DeliveryFormatInfo.svelte'
  import LicenseInfo from '@info-table/LicenseInfo.svelte'
  import DataSizeInfo from '@info-table/DataSizeInfo.svelte'
  import Render from '@lib/render'
  import type { Dataset } from '@type'

  let { dataset }: { dataset: Dataset } = $props()
</script>

<TableWrapper>
  <IdInfo id={dataset.id} />
  <OrganizationInfo type="owner" organizationId={dataset.ownerId} />
  <OrganizationInfo type="manager" organizationId={dataset.managerId} />
  <FolderInfo folderId={dataset.folderId} />
  {#if dataset.typeClean}
    <tr>
      <td><Icon type="type" /> Type</td>
      <td>{dataset.typeClean}</td>
    </tr>
  {/if}
  <RowInfo nbRow={dataset.nbRow} sampleSize={dataset.sampleSize} />
  {#if dataset.nbResources}
    <tr>
      <td><Icon type="nbResources" /> Ressources</td>
      <td>{Render.num(dataset.nbResources)}</td>
    </tr>
  {/if}
  <DataSizeInfo dataSize={dataset.dataSize} />
  {#if dataset.lastUpdateDate}
    <LastUpdateInfo lastUpdateDate={dataset.lastUpdateDate} />
  {/if}

  {#if dataset.nextUpdateDate}
    <NextUpdateInfo nextUpdateDate={dataset.nextUpdateDate} />
  {/if}
  <FrequencyInfo updateFrequency={dataset.updatingEach} />
  {#if dataset.period}
    <PeriodInfo
      period={dataset.period}
      periodDuration={dataset.periodDuration}
    />
  {/if}
  <LocalisationInfo localisation={dataset.localisation} />
  <DeliveryFormatInfo deliveryFormat={dataset.deliveryFormat} />
  <LicenseInfo license={dataset.license} />
  <DataPathInfo dataPath={dataset.dataPath} />
  <LinkInfo link={dataset.link} />
  {#if dataset.tags}
    <TagsInfo tags={dataset.tags} />
  {/if}
</TableWrapper>

{#if dataset.description}
  <DescriptionInfo description={dataset.description} />
{/if}
