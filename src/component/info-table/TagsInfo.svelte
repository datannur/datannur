<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import TagsList from '@component/tag/TagsList.svelte'
  import { t } from '@i18n/messages'
  import type { Tag } from '@type'

  let { tags, label }: { tags: Tag[]; label?: string } = $props()
  const labelText = $derived(label ?? t('column.tags.title'))
</script>

{#if tags && tags.length > 0}
  <tr>
    <td><Icon type="tag" /> {labelText}</td>
    <td><div><TagsList {tags} /></div></td>
  </tr>
{/if}

<style lang="scss">
  div {
    max-width: 600px;
  }
</style>
