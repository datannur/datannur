<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import CopyText from '@layout/CopyText.svelte'
  import { t } from '@i18n/messages'

  let { id }: { id: string | number | undefined } = $props()
</script>

<tr>
  <td><Icon type="internalId" /> {t('column.id.title')}</td>
  <td><CopyText text={id} /></td>
</tr>
