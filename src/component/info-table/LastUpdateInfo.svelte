<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'
  import {
    getTimeAgo,
    getDatetime,
    hasTimePrecision,
    formatDateTime,
  } from '@lib/time'

  let {
    lastUpdateDate,
    intraday = false,
    fromTimestamp = false,
  }: {
    lastUpdateDate: string | number
    intraday?: boolean
    fromTimestamp?: boolean
  } = $props()

  const hasTime = $derived(intraday || hasTimePrecision(lastUpdateDate))
  const lastUpdateDateReadable = $derived(
    fromTimestamp
      ? getDatetime(lastUpdateDate as number)
      : formatDateTime(lastUpdateDate),
  )
  const timeAgo = $derived(getTimeAgo(lastUpdateDate, !fromTimestamp, !hasTime))
</script>

{#if lastUpdateDate}
  <tr>
    <td><Icon type="date" /> {t('column.lastUpdate.title')}</td>
    <td>{lastUpdateDateReadable}, {timeAgo}</td>
  </tr>
{/if}
