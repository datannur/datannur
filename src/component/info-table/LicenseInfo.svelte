<script lang="ts">
  import Icon from '@layout/Icon.svelte'

  let { license }: { license: string | undefined } = $props()
</script>

{#if license}
  <tr>
    <td><Icon type="license" /> Licence</td>
    <td>{license}</td>
  </tr>
{/if}
