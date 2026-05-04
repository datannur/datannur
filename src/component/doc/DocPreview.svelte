<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import PdfViewer from '@layout/PdfViewer.svelte'
  import MdFileDynamic from '@layout/MdFileDynamic.svelte'
  import type { Doc } from '@type'

  let { doc }: { doc: Doc } = $props()
</script>

<div
  class="doc-content-wrapper"
  class:has-pdf-format={doc.type === 'pdf'}
  class:has-md-format={doc.type === 'md'}
>
  <div style="font-weight: bold;">
    <Icon type="search" /> Aperçu
  </div>

  <div class="doc-content-box">
    <div class="doc-content">
      {#if doc.type === 'pdf' && doc.path}
        <PdfViewer pdf={doc.path} />
      {:else if doc.type === 'md' && typeof doc.id === 'string'}
        <MdFileDynamic docId={doc.id} mode="noPadding" />
      {:else}
        <div style="text-align: center; padding-top: 20px;">
          <p>Impossible de charger le fichier</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .doc-content-wrapper {
    width: calc(50% - 3px);
    padding: 1em 0.75em;
    box-sizing: border-box;
    display: inline-block;
    .doc-content-box {
      margin-top: 10px;
      overflow: hidden;
    }

    &.has-pdf-format {
      .doc-content-box {
        border: 1px solid $color-5;
        .doc-content {
          overflow: auto;
          height: max(100vh - 301px, 170px);
        }
      }
    }

    &.has-md-format {
      .doc-content {
        float: left;
        max-width: 100%;
      }
    }
  }

  :global(html.roundedDesign) {
    .doc-content-box {
      border-radius: $rounded-size;
    }
  }

  @include viewport-mobile {
    .doc-content-wrapper {
      display: block;
      width: 100%;
      padding-top: 0;
    }
  }
  @include viewport-small-mobile {
    .doc-content-wrapper {
      padding: 10px;
    }
  }
</style>
