<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'

  let { updateFrequency }: { updateFrequency: string | undefined } = $props()
</script>

{#if updateFrequency}
  <tr>
    <td
      ><Icon type="updateFrequency" />
      {t('column.updateFrequency.title')}</td
    >
    <td>{updateFrequency}</td>
  </tr>
{/if}
