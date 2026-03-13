<script lang="ts">
  import { isHttp, isSsgRendering } from 'svelte-fileapp'
  import { updateTooltipText } from '@lib/tooltip'

  let {
    type,
    id,
  }: {
    type: string
    id: string | number
  } = $props()

  let copied = $state(false)
  const tooltipMsg = 'Copier le lien de partage'
  const tooltipMsgCopied = 'Lien copié !'

  function getShareUrl(): string {
    const currentUrl = window.location.href
    const baseUrl = currentUrl.split('index.html')[0]
    return `${baseUrl}data/link/${type}/${id}.html`
  }

  async function copyLink() {
    const url = getShareUrl()
    await navigator.clipboard.writeText(url)
    copied = true
    updateTooltipText(tooltipMsgCopied)
    setTimeout(() => {
      copied = false
      updateTooltipText(tooltipMsg)
    }, 1500)
  }
</script>

{#if !isHttp && !isSsgRendering}
  <button
    class="icon share-link use-tooltip"
    class:copied
    onclick={copyLink}
    aria-label="Copier le lien"
    title={tooltipMsg}
  >
    <i class="fas fa-link"></i>
  </button>
{/if}

<style lang="scss">
  .share-link {
    margin-left: 5px;
    margin-right: 10px;
    margin-bottom: 0;
    color: var(--link-color);
    opacity: 0.6;
    transition:
      opacity 0.2s,
      transform 0.2s;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }

    &.copied {
      opacity: 1;
      color: var(--success-color, #48c774);
      transform: scale(1.1);
    }
  }
</style>
