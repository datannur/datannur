<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'

  let { level }: { level: number | undefined } = $props()
</script>

{#if level !== undefined}
  <tr>
    <td><Icon type="level" /> {t('column.level.title')}</td>
    <td>{level}</td>
  </tr>
{/if}
