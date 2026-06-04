<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'

  let { deliveryFormat }: { deliveryFormat: string | undefined } = $props()
</script>

{#if deliveryFormat}
  <tr>
    <td><Icon type="deliveryFormat" /> {t('column.format.title')}</td>
    <td>{deliveryFormat}</td>
  </tr>
{/if}
