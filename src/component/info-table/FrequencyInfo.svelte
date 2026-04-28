<script lang="ts">
  import Icon from '@layout/Icon.svelte'

  let { updateFrequency }: { updateFrequency: string | undefined } = $props()
</script>

{#if updateFrequency}
  <tr>
    <td><Icon type="updateFrequency" /> Fréquence</td>
    <td>{updateFrequency}</td>
  </tr>
{/if}
