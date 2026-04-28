<script lang="ts">
  import Icon from '@layout/Icon.svelte'

  let {
    link,
    label = 'Lien',
  }: {
    link: string | undefined
    label?: string
  } = $props()
</script>

{#if link}
  <tr>
    <td><Icon type="link" /> {label}</td>
    <td>
      <a href={link} target="_blank" rel="noreferrer" class="break-line">
        {link}
      </a>
    </td>
  </tr>
{/if}
