<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'

  let { license }: { license: string | undefined } = $props()
</script>

{#if license}
  <tr>
    <td><Icon type="license" /> {t('column.license.title')}</td>
    <td><span class="break-line">{license}</span></td>
  </tr>
{/if}
