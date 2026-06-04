<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'

  let { type }: { type: string | undefined } = $props()
</script>

{#if type}
  <tr>
    <td><Icon type="type" /> {t('column.type.title')}</td>
    <td>{type}</td>
  </tr>
{/if}
