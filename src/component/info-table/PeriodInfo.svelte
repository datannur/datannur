<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'

  let {
    period,
    periodDuration = false,
  }: { period: string; periodDuration?: string | false } = $props()
</script>

{#if period}
  <tr>
    <td><Icon type="dateRange" /> {t('column.period.title')}</td>
    <td>
      {period}
      {#if periodDuration}
        ({periodDuration})
      {/if}
    </td>
  </tr>
{/if}
