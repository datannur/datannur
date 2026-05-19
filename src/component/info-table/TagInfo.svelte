<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import ParentTree from '@component/ParentTree.svelte'
  import ExtendableText from '@layout/ExtendableText.svelte'

  let { tagId }: { tagId: string | number | undefined } = $props()

  const name = 'Partie de'
  const icon = 'folderTreeTag'
</script>

{#if tagId}
  <tr>
    <td><Icon type={icon} /> {name}</td>
    <td>
      <ExtendableText>
        <ParentTree type="tag" elemId={tagId} isSelf={true} />
      </ExtendableText>
    </td>
  </tr>
{/if}
