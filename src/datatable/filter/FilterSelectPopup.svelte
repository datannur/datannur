<script lang="ts">
  import Popup from '@layout/Popup.svelte'
  import type { FilterSelectPopupRequest } from './filter-select-popup'

  let {
    request = undefined,
    onClose,
  }: {
    request?: FilterSelectPopupRequest
    onClose: () => void
  } = $props()

  function close() {
    onClose()
  }

  function selectValue(value: string) {
    request?.onSelect(value)
    close()
  }
</script>

<Popup isOpen={request !== undefined} onClose={close}>
  {#if request}
    <div class="filter-select-popup" role="listbox">
      {#each request.options as option (`${option.value}/${option.label}`)}
        <button
          type="button"
          class:selected={option.value === request.value}
          role="option"
          aria-selected={option.value === request.value}
          onclick={() => selectValue(option.value)}
        >
          <span>{option.label}</span>
          {#if option.value === request.value}
            <i class="fa-solid fa-check"></i>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</Popup>

<style lang="scss">
  @use 'main.scss' as *;

  .filter-select-popup {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: min(320px, 75vw);
    max-width: min(520px, 85vw);
    max-height: min(420px, 70vh);
    overflow: auto;
    padding-top: 12px;
    text-align: left;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    min-height: 36px;
    padding: 8px 12px;
    color: $color-1;
    background: transparent;
    border: 0;
    border-radius: $rounded;
    cursor: pointer;
    text-align: left;

    &:hover,
    &:focus,
    &.selected {
      background: $background-3;
      outline: none;
    }

    span {
      overflow-wrap: anywhere;
    }

    i {
      flex: none;
      color: $color-3;
    }
  }
</style>
