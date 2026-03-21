<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import InstitutionInfo from '@info-table/InstitutionInfo.svelte'
  import FolderInfo from '@info-table/FolderInfo.svelte'
  import Link from '@layout/Link.svelte'
  import Icon from '@layout/Icon.svelte'
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import RowInfo from '@info-table/RowInfo.svelte'
  import TypeInfo from '@info-table/TypeInfo.svelte'
  import PercentBar from '@info-table/PercentBar.svelte'
  import PeriodInfo from '@info-table/PeriodInfo.svelte'
  import TagsInfo from '@info-table/TagsInfo.svelte'
  import { safeHtml } from '@lib/html-sanitizer'
  import type { Variable } from '@type'

  let { variable: variableProp }: { variable: Variable } = $props()
  const variable = untrack(() => variableProp)

  const dataset = db.get('dataset', variable.datasetId)
</script>

<TableWrapper>
  <IdInfo id={variable.id} />
  {#if variable.originalName}
    <tr>
      <td>
        <Icon type="name" />
        Nom d'origine
      </td>
      <td>
        {variable.originalName}
      </td>
    </tr>
  {/if}
  {#if dataset}
    <InstitutionInfo type="owner" institutionId={dataset.ownerId} />
    <InstitutionInfo type="manager" institutionId={dataset.managerId} />
    <FolderInfo folderId={dataset.folderId} />
  {/if}
  <tr>
    <td>
      <Icon type="dataset" />
      Dataset
    </td>
    <td>
      <Link href="dataset/{variable.datasetId}" entity="dataset"
        >{variable.datasetName}</Link
      >
    </td>
  </tr>
  <TypeInfo type={variable.typeClean} />
  {#if variable.key}
    <tr>
      <td>
        <Icon type="key" />
        Clé
      </td>
      <td>
        {variable.key}
      </td>
    </tr>
  {/if}
  <tr>
    <td>
      <Icon type="hashtag" />
      Position
    </td>
    <td>
      {variable.num}
    </td>
  </tr>
  {#if variable.period}
    <PeriodInfo
      period={variable.period}
      periodDuration={variable.periodDuration}
    />
  {/if}
  <RowInfo nbRow={variable.nbRow} />
  {#if variable.statsPreview}
    <tr>
      <td>
        <Icon type="stat" />
        Stats
      </td>
      <td>
        <span use:safeHtml={variable.statsPreview}></span>
      </td>
    </tr>
  {/if}
  {#if variable.nbMissing}
    <tr>
      <td>
        <Icon type="missing" />
        Manquants
      </td>
      <td>
        <PercentBar
          type="missing"
          value={variable.nbMissing}
          nbRow={variable.nbRow}
        />
      </td>
    </tr>
  {/if}
  {#if variable.nbDuplicate}
    <tr>
      <td>
        <Icon type="duplicate" />
        Doublons
      </td>
      <td>
        <PercentBar
          type="duplicate"
          value={variable.nbDuplicate}
          nbRow={variable.nbRow}
        />
      </td>
    </tr>
  {/if}
  {#if variable.nbDistinct}
    <tr>
      <td>
        <Icon type="value" />
        Valeurs
      </td>
      <td>
        <PercentBar
          type="value"
          value={variable.nbDistinct}
          nbRow={variable.nbRow}
        />
      </td>
    </tr>
  {/if}
  {#if variable.modalities?.length}
    <tr>
      <td>
        <Icon type="modality" />
        Modalités
      </td>
      <td>
        <nav class="breadcrumb has-bullet-separator" aria-label="breadcrumbs">
          <ul>
            {#each variable.modalities as modality (modality.id)}
              <li>
                <Link href="modality/{modality.id}" entity="modality">
                  {modality.name}
                </Link>
              </li>
            {/each}
          </ul>
        </nav>
      </td>
    </tr>
  {/if}
  {#if variable.tags?.length}
    <TagsInfo tags={variable.tags} />
  {/if}
</TableWrapper>
{#if variable.description}
  <DescriptionInfo description={variable.description} />
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .breadcrumb {
    :global(a) {
      color: $color-1;
    }
  }
</style>
