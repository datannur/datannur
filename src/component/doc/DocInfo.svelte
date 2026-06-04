<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import TableWrapper from '@info-table/TableWrapper.svelte'
  import IdInfo from '@info-table/IdInfo.svelte'
  import DocPreview from './DocPreview.svelte'
  import LastUpdateInfo from '@info-table/LastUpdateInfo.svelte'
  import DescriptionInfo from '@info-table/DescriptionInfo.svelte'
  import { t } from '@i18n/messages'
  import type { Doc } from '@type'

  let { doc }: { doc: Doc } = $props()
</script>

<TableWrapper>
  <IdInfo id={doc.id} />
  {#if doc.type}
    <tr>
      <td><Icon type="type" /> {t('column.fileType.title')}</td>
      <td>{doc.type} <Icon type={doc.type} /></td>
    </tr>
  {/if}
  <tr>
    <td><Icon type="link" /> {t('column.docPath.title')}</td>
    <td>
      <a class="break-line" href={doc.path} target="_blanck">{doc.path}</a>
    </td>
  </tr>
  {#if doc.lastUpdateDate}
    <LastUpdateInfo lastUpdateDate={doc.lastUpdateDate} intraday={true} />
  {/if}
  {#if doc.description}
    <DescriptionInfo description={doc.description} insideTable={true} />
  {/if}
</TableWrapper>

<DocPreview {doc} />
