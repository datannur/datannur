<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import FolderInfo from '@info-table/FolderInfo.svelte'
  import OrganizationInfo from '@info-table/OrganizationInfo.svelte'
  import TagsInfo from '@info-table/TagsInfo.svelte'
  import LastUpdateInfo from '@info-table/LastUpdateInfo.svelte'
  import NextUpdateInfo from '@info-table/NextUpdateInfo.svelte'
  import FrequencyInfo from '@info-table/FrequencyInfo.svelte'
  import LocalisationInfo from '@info-table/LocalisationInfo.svelte'
  import PeriodInfo from '@info-table/PeriodInfo.svelte'
  import DataPathInfo from '@info-table/DataPathInfo.svelte'
  import LinkInfo from '@info-table/LinkInfo.svelte'
  import CopyText from '@layout/CopyText.svelte'
  import DeliveryFormatInfo from '@info-table/DeliveryFormatInfo.svelte'
  import DeepLevelInfo from '@info-table/DeepLevelInfo.svelte'
  import TypeInfo from '@info-table/TypeInfo.svelte'
  import DataSizeInfo from '@info-table/DataSizeInfo.svelte'
  import type { Folder } from '@type'

  let { folder }: { folder: Folder } = $props()
</script>

<TableWrapper>
  <IdInfo id={folder.id} />
  {#if folder.parents}
    <DeepLevelInfo level={folder.parents.length + 1} />
  {/if}
  {#if folder.parentId}
    <FolderInfo folderId={folder.id} isSelf={true} />
  {/if}
  <OrganizationInfo type="owner" organizationId={folder.ownerId} />
  <OrganizationInfo type="manager" organizationId={folder.managerId} />
  <TypeInfo type={folder.typeClean} />
  <DataSizeInfo dataSize={folder.dataSizeRecursive} />
  {#if folder.lastUpdateDate}
    <LastUpdateInfo lastUpdateDate={folder.lastUpdateDate} />
  {/if}
  {#if folder.nextUpdateDate}
    <NextUpdateInfo nextUpdateDate={folder.nextUpdateDate} />
  {/if}
  <FrequencyInfo updateFrequency={folder.updatingEach} />
  {#if folder.period}
    <PeriodInfo period={folder.period} periodDuration={folder.periodDuration} />
  {/if}
  <LocalisationInfo localisation={folder.localisation} />
  {#if folder.surveyType}
    <tr>
      <td><Icon type="surveyType" /> Type d'enquête</td>
      <td>{folder.surveyType}</td>
    </tr>
  {/if}
  <DeliveryFormatInfo deliveryFormat={folder.deliveryFormat} />
  {#if folder.metadataPath}
    <tr>
      <td><Icon type="metadataPath" /> Metadonnées</td>
      <td><CopyText text={folder.metadataPath} /></td>
    </tr>
  {/if}
  <DataPathInfo dataPath={folder.dataPath} />
  <LinkInfo link={folder.link} />
  {#if folder.gitCode}
    <tr>
      <td><Icon type="gitCode" /> GIT code</td>
      <td>
        <a href={folder.gitCode} target="_blanck" class="break-line">
          {folder.gitCode}
        </a>
      </td>
    </tr>
  {/if}
  {#if folder.tags}
    <TagsInfo tags={folder.tags} />
  {/if}
</TableWrapper>
{#if folder.description}
  <DescriptionInfo description={folder.description} />
{/if}
