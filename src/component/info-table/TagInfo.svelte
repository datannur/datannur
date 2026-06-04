<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import ParentTree from '@component/ParentTree.svelte'
  import ExtendableText from '@layout/ExtendableText.svelte'
  import { t } from '@i18n/messages'

  let { tagId }: { tagId: string | number | undefined } = $props()

  const icon = 'folderTreeTag'
</script>

{#if tagId}
  <tr>
    <td><Icon type={icon} /> {t('column.partOf.title')}</td>
    <td>
      <ExtendableText>
        <ParentTree type="tag" elemId={tagId} isSelf={true} />
      </ExtendableText>
    </td>
  </tr>
{/if}
