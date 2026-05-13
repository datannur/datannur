<script lang="ts">
  import { onMount } from 'svelte'
  import { pageContentLoaded } from '@router/router-store'
  import { footerVisible } from '@lib/store'
  import Error from '@frame/Error.svelte'

  let { entity = 'page' }: { entity?: string } = $props()

  $footerVisible = true

  onMount(() => ($pageContentLoaded = true))
</script>

<Error type={entity} />
