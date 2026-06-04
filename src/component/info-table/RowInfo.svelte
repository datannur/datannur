<script lang="ts">
  import Render from '@lib/render'
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'

  let { nbRow, sampleSize }: { nbRow?: number; sampleSize?: number } = $props()
</script>

{#if nbRow}
  <tr>
    <td><Icon type="nbRow" /> {t('column.rows.title')}</td>
    <td>
      {Render.num(nbRow)}
      {#if sampleSize}
        <span class="text-secondary"
          >({t('column.sample')} : {Render.num(sampleSize)})</span
        >
      {/if}
    </td>
  </tr>
{/if}
