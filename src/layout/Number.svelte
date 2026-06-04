<script lang="ts">
  import { getCurrentLocale } from '@i18n/i18n'

  let { number }: { number: number } = $props()

  const locale = getCurrentLocale()
  let formattedNumber = $derived(number?.toLocaleString(locale))
</script>

<span>{formattedNumber}</span>

<style>
  span {
    font-variant-numeric: tabular-nums;
  }
</style>
