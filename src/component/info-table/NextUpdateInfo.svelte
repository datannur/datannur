<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { getTimeAgo, getDatetime } from '@lib/time'
  import { t } from '@i18n/messages'

  let {
    nextUpdateDate,
    intraday = false,
    fromTimestamp = false,
  }: {
    nextUpdateDate: string | number
    intraday?: boolean
    fromTimestamp?: boolean
  } = $props()

  const nextUpdateDateReadable = $derived(
    fromTimestamp ? getDatetime(nextUpdateDate as number) : nextUpdateDate,
  )
  const timeAgo = $derived(
    getTimeAgo(nextUpdateDate, !fromTimestamp, !intraday),
  )
</script>

{#if nextUpdateDate}
  <tr>
    <td><Icon type="date" /> {t('column.nextUpdate.title')}</td>
    <td>{nextUpdateDateReadable}, {timeAgo}</td>
  </tr>
{/if}
