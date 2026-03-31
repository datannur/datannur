<script lang="ts">
  import Render from '@lib/render'
  import Icon from '@layout/Icon.svelte'

  let { dataSize }: { dataSize: number | undefined } = $props()
</script>

{#if dataSize}
  <tr>
    <td><Icon type="dataSize" /> Taille</td>
    <td>{Render.dataSize(dataSize)}</td>
  </tr>
{/if}
