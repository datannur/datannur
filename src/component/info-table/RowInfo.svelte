<script lang="ts">
  import Render from '@lib/render'
  import Icon from '@layout/Icon.svelte'

  let { nbRow, sampleSize }: { nbRow?: number; sampleSize?: number } = $props()
</script>

{#if nbRow}
  <tr>
    <td><Icon type="nbRow" /> Lignes</td>
    <td>
      {Render.num(nbRow)}
      {#if sampleSize}
        <span class="text-secondary"
          >(échantillon : {Render.num(sampleSize)})</span
        >
      {/if}
    </td>
  </tr>
{/if}
