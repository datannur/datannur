<script lang="ts">
  import LLMChatPanel from '@llm/LLMChatPanel.svelte'
  import { isHttp } from 'svelte-fileapp'

  let isOpen = $state(false)
  let isProxyUp = $state(false)

  const toggleChat = () => {
    isOpen = !isOpen
  }
</script>

<LLMChatPanel bind:isOpen bind:isProxyUp />

{#if !isOpen && isHttp && isProxyUp}
  <button
    class="floating-chat-btn"
    onclick={toggleChat}
    title="Ouvrir le chat LLM"
  >
    <i class="fa-solid fa-comments"></i>
  </button>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .floating-chat-btn {
    position: fixed;
    bottom: 16px;
    right: calc(16px + var(--chat-width));
    width: 48px;
    height: 48px;
    margin: 0;
    border-radius: 50%;
    background: $color-3;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      filter: brightness(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  @include viewport-small-mobile {
    .floating-chat-btn {
      bottom: 12px;
      right: 12px;
      width: 44px;
      height: 44px;
      font-size: 18px;
    }
  }
</style>
