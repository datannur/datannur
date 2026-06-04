<script lang="ts">
  import { t } from '@i18n/messages'
  import type { TranslationKey } from '@i18n/types'
  import { clickOutside } from '@lib/util'
  import Options from '@lib/options'

  type Item = {
    id: string
    name: string
    description: string
    descriptionKey?: TranslationKey
  }

  let {
    icon,
    items,
    selected = $bindable(),
    optionKey,
    menuPosition = 'left',
  }: {
    icon: string
    items: Item[]
    selected: Item
    optionKey: string
    menuPosition?: 'left' | 'center'
  } = $props()

  let showMenu = $state(false)

  function selectItem(item: Item) {
    selected = item
    showMenu = false
    Options.set(optionKey, item.id)
  }
</script>

<button class="selector" onclick={() => (showMenu = !showMenu)}>
  <i class="fa-solid {icon}"></i>
  <span class="item-name">{selected.name}</span>
  <i class="fa-solid fa-chevron-down" class:rotated={showMenu}></i>
</button>

{#if showMenu}
  <div
    class="menu"
    class:center={menuPosition === 'center'}
    use:clickOutside={() => (showMenu = false)}
  >
    {#each items as item (item.id)}
      <button
        class="option"
        class:selected={item.id === selected.id}
        onclick={() => selectItem(item)}
      >
        <div class="option-content">
          <span class="option-name">{item.name}</span>
          <span class="option-description">
            {item.descriptionKey
              ? t(item.descriptionKey)
              : item.description}
          </span>
        </div>
        {#if item.id === selected.id}
          <i class="fa-solid fa-check"></i>
        {/if}
      </button>
    {/each}
  </div>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    margin: 0;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: rgba($color-3, 0.1);
    }

    i:first-child {
      font-size: 1rem;
      color: $color-3;
    }

    .item-name {
      font-size: 1rem;
      font-weight: 600;
      color: $color-1;

      @media (max-width: 420px) {
        display: none;
      }
    }

    i:last-child {
      font-size: 0.75rem;
      color: $color-4;
      transition: transform 0.2s ease;

      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

  .menu {
    position: absolute;
    top: 100%;
    left: 1.5rem;
    background: $background-2;
    border-radius: $rounded;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: 1001;
    min-width: 280px;
    max-height: 500px;
    overflow-y: auto;

    &.center {
      left: 50%;
      transform: translateX(-50%);
    }

    .option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      width: 100%;
      cursor: pointer;
      transition: background 0.15s ease;
      text-align: left;

      &:hover {
        background: rgba($color-3, 0.1);
      }

      &.selected {
        background: rgba($color-3, 0.15);
      }

      .option-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .option-name {
        font-size: 0.95rem;
        font-weight: 600;
        color: $color-1;
      }

      .option-description {
        font-size: 0.8rem;
        color: $color-2;
        opacity: 0.8;
      }

      i {
        color: $color-3;
        font-size: 0.9rem;
        flex-shrink: 0;
      }
    }
  }
</style>
