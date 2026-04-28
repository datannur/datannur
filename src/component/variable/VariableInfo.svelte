<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import OrganizationInfo from '@info-table/OrganizationInfo.svelte'
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
    <OrganizationInfo type="owner" organizationId={dataset.ownerId} />
    <OrganizationInfo type="manager" organizationId={dataset.managerId} />
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
  {#if variable.fkVarId}
    <tr>
      <td>
        <Icon type="fk" />
        Clé étrangère
      </td>
      <td>
        {#if variable.fkVarName}
          <Link href="dataset/{variable.fkDatasetId}" entity="dataset"
            >{variable.fkDatasetName}</Link
          >&ensp;→&ensp;<Link
            href="variable/{variable.fkVarId}"
            entity="variable">{variable.fkVarName}</Link
          >
        {:else}
          {variable.fkVarId}
        {/if}
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
  {#if variable.enumerations?.length}
    <tr>
      <td>
        <Icon type="enumeration" />
        Énumérations
      </td>
      <td>
        <nav class="breadcrumb has-bullet-separator" aria-label="breadcrumbs">
          <ul>
            {#each variable.enumerations as enumeration (enumeration.id)}
              <li>
                <Link href="enumeration/{enumeration.id}" entity="enumeration">
                  {enumeration.name}
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
{#if variable.description || variable.concept}
  <div class="side-panels">
    {#if variable.description}
      <DescriptionInfo description={variable.description} />
    {/if}
    {#if variable.concept}
      <div class="concept-wrapper">
        <div style="font-weight: bold;">
          <Icon type="concept" /> Concept
        </div>
        <div class="concept-content">
          <Link href="concept/{variable.conceptId}" entity="concept"
            >{variable.concept.name}</Link
          >
          {#if variable.concept.description}
            <div class="concept-description">
              {variable.concept.description}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .breadcrumb {
    :global(a) {
      color: $color-1;
    }
  }

  .side-panels {
    width: calc(50% - 3px);
    display: inline-block;
    vertical-align: top;

    :global(.description-wrapper) {
      width: 100%;
      display: block;
    }
  }

  .concept-wrapper {
    padding: 1em 0.75em;
    box-sizing: border-box;
  }

  .concept-content {
    padding: 0.5em 2.5rem;
    max-width: 800px;
    word-wrap: break-word;
    box-sizing: border-box;
  }

  .concept-description {
    margin-top: 0.5em;
    font-size: 0.875em;
  }

  :global(body.mobile) {
    .side-panels {
      display: block;
      width: 100%;
    }
  }

  :global(body.small-mobile) {
    .side-panels {
      .concept-content {
        padding-top: 0;
        padding-right: 5px;
      }
    }
  }
</style>
