<script lang="ts">
  import { onMount } from 'svelte'
  import MdContent from '@layout/MdContent.svelte'
  import { onPageHomepage, pageContentLoaded } from '@router/router-store'
  import { darkModeTheme } from '@dark-mode/dark-mode'
  import { mdWithSimpleDiagramToHtml } from '@lib/simple-diagram'
  import { safeHtmlWithSvg } from '@lib/html-sanitizer'

  let { aboutFile }: { aboutFile: string } = $props()

  let htmlContent = $state('')

  let mdContent = $derived(
    aboutFile.replaceAll(
      '{darkMode}',
      $darkModeTheme === 'dark' ? '-dark' : '',
    ),
  )

  const useSimpleDiagram = $derived(aboutFile.includes('mermaid('))

  $effect(() => {
    if (useSimpleDiagram) {
      htmlContent = mdWithSimpleDiagramToHtml(mdContent)
      $pageContentLoaded = true
    }
  })

  onMount(() => {
    if (!useSimpleDiagram) $pageContentLoaded = true
  })
</script>

<div class="about-file-wrapper" class:homepage={$onPageHomepage}>
  {#if useSimpleDiagram}
    <div class="content" use:safeHtmlWithSvg={htmlContent}></div>
  {:else}
    <MdContent content={mdContent} />
  {/if}
</div>

<style lang="scss">
  @use 'main.scss' as *;
  @use '../style/simple-diagram.scss' as *;
  @use '../style/icon.scss' as *;

  .about-file-wrapper {
    :global {
      p img {
        width: 100%;
      }
    }
    &.homepage {
      max-height: max(calc(100vh - 225px), 80px);
    }
  }

  .content {
    max-width: 900px;
    padding: 3.5rem 3.75rem;
    margin: auto;

    :global {
      @include icon-color;
      @include simple-diagram-style;

      .simple-diagram-block {
        text-align: center;
        margin-bottom: 40px;
      }
    }
  }

  @include viewport-mobile {
    .about-file-wrapper.homepage {
      max-height: max(calc(100vh - 175px), 80px);
    }
  }

  @include viewport-small-mobile {
    .content {
      padding: 1.5rem 1.75rem;
    }
  }
</style>
