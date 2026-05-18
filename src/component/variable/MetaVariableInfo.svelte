<script lang="ts">
  import Link from '@layout/Link.svelte'
  import Icon from '@layout/Icon.svelte'
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import RowInfo from '@info-table/RowInfo.svelte'
  import TypeInfo from '@info-table/TypeInfo.svelte'
  import PercentBar from '@info-table/PercentBar.svelte'
  import MetaLocalisationInfo from '@info-table/MetaLocalisationInfo.svelte'
  import type { MetaVariable } from '@type'

  let { metaVariable }: { metaVariable: MetaVariable } = $props()
</script>

<TableWrapper>
  <IdInfo id={metaVariable.id} />
  <tr>
    <td>
      <Icon type="dataset" />
      Dataset
    </td>
    <td>
      <Link href="metaDataset/{metaVariable.datasetId}" entity="dataset"
        >{metaVariable.datasetName}</Link
      >
    </td>
  </tr>
  <TypeInfo type={metaVariable.typeClean} />
  {#if metaVariable.key}
    <tr>
      <td>
        <Icon type="key" />
        Clé
      </td>
      <td> Oui </td>
    </tr>
  {/if}
  {#if metaVariable.businessKey}
    <tr>
      <td>
        <Icon type="businessKey" />
        Clé métier
      </td>
      <td> Oui </td>
    </tr>
  {/if}
  <tr>
    <td>
      <Icon type="hashtag" />
      Position
    </td>
    <td>
      {metaVariable.num}
    </td>
  </tr>
  <RowInfo nbRow={metaVariable.nbRow} />
  {#if metaVariable.nbMissing}
    <tr>
      <td>
        <Icon type="missing" />
        Manquants
      </td>
      <td>
        <PercentBar
          type="missing"
          value={metaVariable.nbMissing}
          nbRow={metaVariable.nbRow}
        />
      </td>
    </tr>
  {/if}
  {#if metaVariable.nbDuplicate}
    <tr>
      <td>
        <Icon type="duplicate" />
        Doublons
      </td>
      <td>
        <PercentBar
          type="duplicate"
          value={metaVariable.nbDuplicate}
          nbRow={metaVariable.nbRow}
        />
      </td>
    </tr>
  {/if}
  {#if metaVariable.nbDistinct}
    <tr>
      <td>
        <Icon type="value" />
        Valeurs
      </td>
      <td>
        <PercentBar
          type="value"
          value={metaVariable.nbDistinct}
          nbRow={metaVariable.nbRow}
        />
      </td>
    </tr>
  {/if}
  {#if metaVariable.metaLocalisation}
    <MetaLocalisationInfo metaLocalisation={metaVariable.metaLocalisation} />
  {/if}
</TableWrapper>
{#if metaVariable.description}
  <DescriptionInfo description={metaVariable.description} />
{/if}
