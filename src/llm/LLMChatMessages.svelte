<script lang="ts">
  import { t } from '@i18n/messages'
  import markdownRender from '@lib/markdown'
  import type { ChatMessage } from '@llm/llm-client'
  import LLMChatMessage from '@llm/LLMChatMessage.svelte'
  import LLMEmptyState from '@llm/LLMEmptyState.svelte'

  let {
    messages,
    loading,
  }: {
    messages: ChatMessage[]
    loading: boolean
  } = $props()

  let chatContainer = $state<HTMLElement | null>(null)
  let shouldAutoScroll = $state(true)
  let lastAssistantMessageRef = $state<HTMLElement | null>(null)
  let lastAssistantMessageHeight = $state(0)
  let chatContainerHeight = $state(0)

  let messagesWithHtml = $derived(
    messages.map(msg => {
      if (msg.role === 'assistant' && msg.content) {
        const result = markdownRender(msg.content)
        return {
          ...msg,
          html: result instanceof Promise ? '' : (result as string),
        }
      }
      return { ...msg, html: '' }
    }),
  )

  let isExecutingTool = $derived.by(() => {
    if (!loading) return false
    const lastMsg = messages[messages.length - 1]
    return (
      lastMsg?.role === 'assistant' &&
      lastMsg.tool_calls &&
      lastMsg.tool_calls.length > 0
    )
  })

  let showLoadingDots = $derived(
    loading &&
      !isExecutingTool &&
      messagesWithHtml.length > 0 &&
      !messagesWithHtml[messagesWithHtml.length - 1]?.content,
  )

  let spacerHeight = $derived(
    Math.max(0, chatContainerHeight - lastAssistantMessageHeight - 130),
  )

  $effect(() => {
    if (loading) {
      shouldAutoScroll = true
    }
  })

  $effect(() => {
    if (shouldAutoScroll && chatContainer && loading) {
      requestAnimationFrame(() => {
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
      })
    }
  })

  $effect(() => {
    if (!chatContainer) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        chatContainerHeight = entry.contentRect.height
      }
    })

    observer.observe(chatContainer)

    return () => {
      observer.disconnect()
    }
  })

  $effect(() => {
    if (!lastAssistantMessageRef) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        lastAssistantMessageHeight = entry.contentRect.height
      }
    })

    observer.observe(lastAssistantMessageRef)

    return () => {
      observer.disconnect()
    }
  })

  function handleScroll(): void {
    if (!chatContainer) return
    const threshold = 100
    const isNearBottom =
      chatContainer.scrollHeight -
        chatContainer.scrollTop -
        chatContainer.clientHeight <
      threshold
    shouldAutoScroll = isNearBottom
  }
</script>

<div class="chat-container-wrapper">
  <div class="chat-container" bind:this={chatContainer} onscroll={handleScroll}>
    {#if messagesWithHtml.length === 0}
      <LLMEmptyState />
    {/if}

    <div>
      {#each messagesWithHtml as message, i (i)}
        {#if message.role === 'user'}
          <LLMChatMessage role="user" content={message.content} />
        {:else if message.role === 'tool'}
          <LLMChatMessage
            role="tool"
            content={message.content}
            name={message.name}
          />
        {:else if message.role === 'assistant' && !message.tool_calls && message.content}
          <LLMChatMessage
            role="assistant"
            content={message.content}
            html={message.html}
            bind:elementRef={lastAssistantMessageRef}
          />
        {/if}
      {/each}

      {#if isExecutingTool}
        <div class="message assistant">
          <div class="tool-indicator">
            <i class="fa-solid fa-database"></i>
            <span>{t('llm.chat.queryingDatabase')}</span>
          </div>
        </div>
      {/if}

      {#if showLoadingDots}
        <div class="message assistant">
          <div class="loading-indicator">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    {#if messages.length > 0}
      <div class="dynamic-spacer" style="min-height: {spacerHeight}px;"></div>
    {/if}
  </div>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .chat-container-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: $background-1;
  }

  .chat-container {
    height: 100%;
    padding: 1.5rem;
    overflow-y: auto;
    background: $background-1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overscroll-behavior: contain;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: $color-5;
      border-radius: 3px;
    }
  }

  .dynamic-spacer {
    min-height: 50vh;
    flex-shrink: 0;
  }

  .message {
    padding: 0 0.5rem;
    margin-bottom: 0;
    animation: slideIn 0.2s ease-out;

    &.assistant {
      background: transparent;
    }

    .tool-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: $background-2;
      border-radius: $rounded;
      color: $color-3;
      font-size: 0.9em;
      opacity: 0.8;
      animation: pulse 1.5s ease-in-out infinite;

      i {
        font-size: 0.85em;
      }
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.75rem;

      .loading-dots {
        display: flex;
        gap: 0.4rem;

        span {
          width: 8px;
          height: 8px;
          background: $color-3;
          border-radius: 50%;
          animation: bounce 1.4s ease-in-out infinite;

          &:nth-child(1) {
            animation-delay: 0s;
          }

          &:nth-child(2) {
            animation-delay: 0.2s;
          }

          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }
    }
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    40% {
      transform: translateY(-10px);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
