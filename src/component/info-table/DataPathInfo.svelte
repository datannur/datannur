<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import CopyText from '@layout/CopyText.svelte'
  import { t } from '@i18n/messages'
  import { isHttpUrl } from '@lib/util'

  let { dataPath }: { dataPath: string | undefined } = $props()
</script>

{#if dataPath}
  <tr>
    <td><Icon type="dataPath" /> {t('column.path.title')}</td>
    <td>
      {#if isHttpUrl(dataPath)}
        <a
          href={dataPath.trim()}
          target="_blank"
          rel="noreferrer"
          class="break-line"
        >
          {dataPath}
        </a>
      {:else}
        <CopyText text={dataPath} />
      {/if}
    </td>
  </tr>
{/if}
