<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import TagsList from '@component/tag/TagsList.svelte'
  import type { Tag } from '@type'

  let { tags, label = 'Mots clés' }: { tags: Tag[]; label?: string } = $props()
</script>

{#if tags && tags.length > 0}
  <tr>
    <td><Icon type="tag" /> {label}</td>
    <td><div><TagsList {tags} /></div></td>
  </tr>
{/if}

<style lang="scss">
  div {
    max-width: 600px;
  }
</style>
