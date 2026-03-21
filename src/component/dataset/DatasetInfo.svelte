<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import InstitutionInfo from '@info-table/InstitutionInfo.svelte'
  import FolderInfo from '@info-table/FolderInfo.svelte'
  import TagsInfo from '@info-table/TagsInfo.svelte'
  import RowInfo from '@info-table/RowInfo.svelte'
  import FrequencyInfo from '@info-table/FrequencyInfo.svelte'
  import LastUpdateInfo from '@info-table/LastUpdateInfo.svelte'
  import NextUpdateInfo from '@info-table/NextUpdateInfo.svelte'
  import LocalisationInfo from '@info-table/LocalisationInfo.svelte'
  import PeriodInfo from '@info-table/PeriodInfo.svelte'
  import DataPathInfo from '@info-table/DataPathInfo.svelte'
  import DeliveryFormatInfo from '@info-table/DeliveryFormatInfo.svelte'
  import Render from '@lib/render'
  import type { Dataset } from '@type'

  let { dataset }: { dataset: Dataset } = $props()
</script>

<TableWrapper>
  <IdInfo id={dataset.id} />
  <InstitutionInfo type="owner" institutionId={dataset.ownerId} />
  <InstitutionInfo type="manager" institutionId={dataset.managerId} />
  <FolderInfo folderId={dataset.folderId} />
  {#if dataset.typeClean}
    <tr>
      <td><Icon type="type" /> Type</td>
      <td>{dataset.typeClean}</td>
    </tr>
  {/if}
  <RowInfo nbRow={dataset.nbRow} />
  {#if dataset.nbFiles}
    <tr>
      <td><Icon type="nbFiles" /> Fichiers</td>
      <td>{Render.num(dataset.nbFiles)}</td>
    </tr>
  {/if}
  {#if dataset.lastUpdateDate}
    <LastUpdateInfo lastUpdateDate={dataset.lastUpdateDate} />
  {/if}

  {#if dataset.nextUpdateDate}
    <NextUpdateInfo nextUpdateDate={dataset.nextUpdateDate} />
  {/if}
  <FrequencyInfo frequency={dataset.updatingEach} />
  {#if dataset.period}
    <PeriodInfo
      period={dataset.period}
      periodDuration={dataset.periodDuration}
    />
  {/if}
  <LocalisationInfo localisation={dataset.localisation} />
  <DeliveryFormatInfo deliveryFormat={dataset.deliveryFormat} />
  <DataPathInfo dataPath={dataset.dataPath} />
  {#if dataset.link}
    <tr>
      <td><Icon type="downloadFile" /> Données</td>
      <td>
        <a href={dataset.link} target="_blanck" class="break-line">
          {dataset.link}
        </a>
      </td>
    </tr>
  {/if}
  {#if dataset.tags}
    <TagsInfo tags={dataset.tags} />
  {/if}
</TableWrapper>

{#if dataset.description}
  <DescriptionInfo description={dataset.description} />
{/if}
