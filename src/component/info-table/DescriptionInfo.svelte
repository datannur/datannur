<script lang="ts">
  import markdownRender from '@lib/markdown'
  import { safeHtml } from '@lib/html-sanitizer'
  import Icon from '@layout/Icon.svelte'

  let {
    description,
    insideTable = false,
  }: { description: string; insideTable?: boolean } = $props()

  let descriptionHtml = $state('')

  $effect(() => {
    if (description) {
      const result = markdownRender(description)
      if (result instanceof Promise) {
        result.then((html: string) => {
          descriptionHtml = html
        })
      } else {
        descriptionHtml = result
      }
    }
  })
</script>

{#if description}
  {#if insideTable}
    <tr>
      <td>
        <div style="font-weight: bold;">
          <Icon type="description" /> Description
        </div>
      </td>
      <td>
        <div class="content inside-table" use:safeHtml={descriptionHtml}></div>
      </td>
    </tr>
  {:else}
    <div class="description-wrapper" class:inside-table={insideTable}>
      <div style="font-weight: bold;">
        <Icon type="description" /> Description
      </div>
      <div class="content" use:safeHtml={descriptionHtml}></div>
    </div>
  {/if}
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .description-wrapper {
    width: calc(50% - 3px);
    padding: 1em 0.75em;
    box-sizing: border-box;
    display: inline-block;
  }
  .content {
    padding: 0.5em 2.5rem;
    max-width: 800px;
    word-wrap: break-word;
    box-sizing: border-box;
    &.inside-table {
      padding: 0;
      display: block;
      width: 100%;
    }
  }
  @include viewport-mobile {
    .description-wrapper {
      display: block;
      width: 100%;
      padding-top: 0;
    }
  }
  @include viewport-small-mobile {
    .description-wrapper {
      .content {
        padding-top: 0px;
        padding-right: 5px;
      }
    }
  }
</style>
