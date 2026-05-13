<script lang="ts">
  import { onMount } from 'svelte'
  import MdContent from '@layout/MdContent.svelte'
  import { onPageHomepage, pageContentLoaded } from '@router/router-store'
  import { darkModeTheme } from '@dark-mode/dark-mode'
  import Loading from '@frame/Loading.svelte'
  import { ensureMermaidLoaded } from '@lib/util'
  import { mdWithMermaidToHtml } from '@lib/mermaid'
  import { safeHtmlWithSvg } from '@lib/html-sanitizer'

  let { aboutFile }: { aboutFile: string } = $props()

  let htmlContent = $state('')
  let htmlContentLoaded = $state(false)

  let mdContent = $derived(
    aboutFile.replaceAll(
      '{darkMode}',
      $darkModeTheme === 'dark' ? '-dark' : '',
    ),
  )

  const useMermaid = $derived(aboutFile.includes('mermaid('))

  $effect(() => {
    if (useMermaid) {
      ensureMermaidLoaded().then(async () => {
        if (!mdContent) return
        htmlContent = await mdWithMermaidToHtml(mdContent)
        htmlContentLoaded = true
        $pageContentLoaded = true
      })
    }
  })

  onMount(() => {
    if (!useMermaid) $pageContentLoaded = true
  })
</script>

<div class="about-file-wrapper" class:homepage={$onPageHomepage}>
  {#if useMermaid}
    <div class="content" use:safeHtmlWithSvg={htmlContent}></div>
    {#if !htmlContentLoaded}
      <Loading position="absolute" />
    {/if}
  {:else}
    <MdContent content={mdContent} />
  {/if}
</div>

<style lang="scss">
  @use 'main.scss' as *;
  @use '../style/mermaid.scss' as *;
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
      @include mermaid-style;

      .mermaid-block {
        text-align: center;
        margin-bottom: 40px;
        .icon {
          margin-right: 0;
          &:first-child {
            margin-right: 5px;
          }
        }
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
