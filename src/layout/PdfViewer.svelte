<script lang="ts">
  import { untrack } from 'svelte'
  import { hasTouchScreen } from 'svelte-fileapp'
  import Loading from '@frame/Loading.svelte'

  let { pdf: pdfProp }: { pdf: string } = $props()
  const pdf = untrack(() => pdfProp)

  let loading = $state(true)
  let urlMobile = $state(
    'https://drive.google.com/viewerng/viewer?embedded=true&url=',
  )

  let url = pdf + '#toolbar=1&view=FitH'
  urlMobile += window.location.origin + '/' + url
</script>

<div class="iframe-wrapper">
  {#if loading}
    <Loading position="relative" colorEntity="doc" />
  {/if}
  <object
    data={url}
    type="application/pdf"
    class="frame"
    class:loaded={!loading}
    title="pdf viewer"
    onload={() => (loading = false)}
  >
    {#if hasTouchScreen}
      <embed src={urlMobile} class="frame" />
    {/if}
  </object>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .iframe-wrapper {
    position: relative;
    padding: 0;
    overflow: hidden;
    width: 100%;
    height: 100%;
    margin: auto;
  }
  .frame {
    height: 0;
    width: 100%;
    border: none;
    &.loaded {
      height: 100%;
    }
  }

  @include viewport-small-mobile {
    .frame {
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }
  }
</style>
