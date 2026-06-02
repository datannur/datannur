<script lang="ts">
  import { getLocalFilter } from '@lib/db'
  import MainFilter from '@lib/main-filter'
  import Switch from '@layout/Switch.svelte'
  import Button from '@layout/Button.svelte'
  import { translate } from '@i18n/i18n'
  import type { ConfigFilter } from '@type'

  let filters: ConfigFilter[] = $state([])

  filters.push(...MainFilter.applySavedState(getLocalFilter()))

  function updateFilterState() {
    MainFilter.save(filters)
  }
</script>

{#each filters as filter (filter.id)}
  <div class="navbar-item">
    <Switch bind:value={filter.isActive} change={updateFilterState}>
      {filter.name}
    </Switch>
  </div>
{/each}

<div class="navbar-item">
  <Button onclick={() => window.location.reload()}
    >{$translate('filter.apply')}</Button
  >
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .navbar-item {
    :global(.switch[type='checkbox'] + label) {
      font-size: 0.875rem;
      color: $color-2;
    }
    :global(.button) {
      font-size: 0.875rem;
      color: $color-2;
      margin: auto;
    }
  }
</style>
