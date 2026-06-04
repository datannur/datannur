<script lang="ts">
  import Render from '@lib/render'
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'

  let { dataSize }: { dataSize: number | undefined } = $props()
</script>

{#if dataSize}
  <tr>
    <td><Icon type="dataSize" /> {t('column.size.title')}</td>
    <td>{Render.dataSize(dataSize)}</td>
  </tr>
{/if}
