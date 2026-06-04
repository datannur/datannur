<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'

  let { metaLocalisation }: { metaLocalisation: string | undefined } = $props()
</script>

{#if metaLocalisation}
  <tr>
    <td
      ><Icon type="localisation" />
      {t('column.metaLocation.title')}</td
    >
    <td>{metaLocalisation}</td>
  </tr>
{/if}
