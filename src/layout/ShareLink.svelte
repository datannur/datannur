<script lang="ts">
  import { updateTooltipText } from '@lib/tooltip'

  let copied = $state(false)
  const tooltipMsg = 'Copier le lien de partage'
  const tooltipMsgCopied = 'Lien copié !'

  function getShareUrl(): string {
    return window.location.href.split('?')[0]
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

<button
  class="icon share-link use-tooltip"
  class:copied
  onclick={copyLink}
  aria-label="Copier le lien"
  title={tooltipMsg}
>
  <i class="fas fa-link"></i>
</button>

<style lang="scss">
  @use 'main.scss' as *;

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

  @include viewport-tiny-mobile {
    .share-link {
      display: none;
    }
  }
</style>
