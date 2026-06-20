<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import Render from '@lib/render'
  import { t } from '@i18n/messages'
  import type { Dataset } from '@type'

  let { dataset }: { dataset: Dataset } = $props()

  const geoDetails = $derived(
    [
      dataset.crs,
      dataset.spatialResolution != null
        ? `${Render.num(dataset.spatialResolution)} m`
        : undefined,
    ]
      .filter(Boolean)
      .join(', '),
  )
</script>

{#if dataset.geoType}
  <tr>
    <td><Icon type="geo" /> {t('column.geo.title')}</td>
    <td>
      {dataset.geoType}
      {#if geoDetails}
        ({geoDetails})
      {/if}
    </td>
  </tr>
{/if}
