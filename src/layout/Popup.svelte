<script lang="ts">
  import { clickOutside } from '@lib/util'
  import BtnClearInput from '@layout/BtnClearInput.svelte'
  import type { Snippet } from 'svelte'

  let {
    isOpen = $bindable(false),
    onClose = () => {},
    children,
  }: { isOpen?: boolean; onClose?: () => void; children?: Snippet } = $props()

  function closePopup() {
    isOpen = false
    onClose()
  }
</script>

{#if isOpen}
  <div class="popup">
    <div class="popup-content" use:clickOutside={closePopup}>
      <div class="close-btn">
        <BtnClearInput click={closePopup} mode="normal" />
      </div>
      <div class="main-content">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  @use 'main.scss' as *;
  .popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }

  .popup-content {
    position: relative;
    background: $background-2;
    padding: 20px;
    border-radius: $rounded;
    text-align: center;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    max-width: 90%;
    max-height: 90%;
    overflow: auto;
    width: auto;
    height: auto;
    :global(html.dark-mode) & {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 1);
    }
  }

  .close-btn {
    position: absolute;
    top: 10px;
    right: 0px;
  }

  .main-content {
    margin-top: 10px;
  }
</style>
