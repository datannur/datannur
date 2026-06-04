<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'

  let { localisation }: { localisation: string | undefined } = $props()
</script>

{#if localisation}
  <tr>
    <td><Icon type="localisation" /> {t('column.location.title')}</td>
    <td>{localisation}</td>
  </tr>
{/if}
