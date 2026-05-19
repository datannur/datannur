<script lang="ts">
  import ParentTree from '@component/ParentTree.svelte'
  import Icon from '@layout/Icon.svelte'
  import ExtendableText from '@layout/ExtendableText.svelte'
  import Link from '@layout/Link.svelte'

  let {
    folderId,
    isSelf = false,
    isMeta = false,
  }: {
    folderId: string | number | undefined
    isSelf?: boolean
    isMeta?: boolean
  } = $props()

  const name = $derived(isSelf ? 'Partie de' : 'Dossier')
  const icon = $derived(isSelf ? 'folderTreeFolder' : 'folder')
</script>

{#if folderId}
  <tr>
    <td><Icon type={icon} /> {name}</td>
    <td>
      {#if isMeta}
        <Link href="metaFolder/{folderId}">{folderId}</Link>
      {:else}
        <ExtendableText>
          <ParentTree type="folder" elemId={folderId} {isSelf} />
        </ExtendableText>
      {/if}
    </td>
  </tr>
{/if}
