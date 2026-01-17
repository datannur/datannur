<script lang="ts">
  import Icon from '@layout/Icon.svelte'

  let { deliveryFormat }: { deliveryFormat: string | undefined } = $props()
</script>

{#if deliveryFormat}
  <tr>
    <td><Icon type="deliveryFormat" /> Format</td>
    <td>{deliveryFormat}</td>
  </tr>
{/if}
