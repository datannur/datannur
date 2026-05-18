<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import Link from '@layout/Link.svelte'
  import type { Variable } from '@type'

  let {
    variables,
    label = 'Variables',
    icon = 'variable',
  }: {
    variables?: Variable[]
    label?: string
    icon?: string
  } = $props()
</script>

{#if variables?.length}
  <tr>
    <td><Icon type={icon} /> {label}</td>
    <td>
      <nav class="breadcrumb has-bullet-separator" aria-label="breadcrumbs">
        <ul>
          {#each variables as variable (variable.id)}
            <li>
              <Link href="variable/{variable.id}" entity="variable">
                {variable.name}
              </Link>
            </li>
          {/each}
        </ul>
      </nav>
    </td>
  </tr>
{/if}
