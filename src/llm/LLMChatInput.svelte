<script lang="ts">
  import { t } from '@i18n/messages'

  let {
    input = $bindable(''),
    isRecording,
    isProcessing,
    loading,
    isCreatingSession,
    showSessionError,
    voiceConversationMode,
    onSend,
    onVoiceClick,
    onCancelRecording,
    onStopGeneration,
    textareaRef = $bindable<HTMLTextAreaElement | null>(null),
  }: {
    input: string
    isRecording: boolean
    isProcessing: boolean
    loading: boolean
    isCreatingSession: boolean
    showSessionError: boolean
    voiceConversationMode: boolean
    onSend: () => void
    onVoiceClick: () => void
    onCancelRecording: () => void
    onStopGeneration: () => void
    textareaRef?: HTMLTextAreaElement | null
  } = $props()

  let placeholder = $derived.by(() => {
    if (isRecording) return `🎙️ ${t('llm.chat.recording')}`
    if (isProcessing) return `⏳ ${t('llm.chat.transcribing')}`
    if (voiceConversationMode) return `🎙️ ${t('llm.chat.voiceMode')}`
    return t('llm.chat.placeholder')
  })

  let disabled = $derived(isRecording || isProcessing)

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  function handleInput() {
    if (textareaRef) {
      textareaRef.style.height = 'auto'
      textareaRef.style.height = `${textareaRef.scrollHeight}px`
    }
  }
</script>

<div class="chat-input">
  {#if isCreatingSession}
    <div class="session-loading">
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span>{t('llm.chat.checking')}</span>
    </div>
  {:else if showSessionError}
    <div class="session-error">
      <i class="fa-solid fa-exclamation-triangle"></i>
      <span>{t('llm.chat.sessionError')}</span>
    </div>
  {:else}
    <div class="input-wrapper">
      <textarea
        id="llm-chat-input"
        name="chatInput"
        bind:this={textareaRef}
        bind:value={input}
        onkeydown={handleKeyDown}
        oninput={handleInput}
        {placeholder}
        {disabled}
        rows="1"
      ></textarea>
      <div class="input-buttons">
        {#if isRecording}
          <button
            type="button"
            onclick={onVoiceClick}
            aria-label={t('llm.chat.stopRecording')}
            class="stop-btn"
          >
            <i class="fa-solid fa-stop"></i>
          </button>
          <button
            type="button"
            onclick={onCancelRecording}
            aria-label={t('llm.chat.cancel')}
            class="cancel-btn"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        {:else if isProcessing}
          <button
            type="button"
            class="voice-btn processing"
            disabled
            aria-label={t('llm.chat.processing')}
          >
            <i class="fa-solid fa-spinner fa-spin"></i>
          </button>
        {:else if loading}
          <button
            type="button"
            onclick={onStopGeneration}
            aria-label={t('llm.chat.stop')}
            class="stop-btn"
          >
            <i class="fa-solid fa-stop"></i>
          </button>
        {:else}
          <button
            type="button"
            class="voice-btn"
            onclick={onVoiceClick}
            disabled={loading}
            aria-label={t('llm.chat.speechRecognition')}
          >
            <i class="fa-solid fa-microphone"></i>
          </button>
          <button
            type="button"
            class="send-btn"
            onclick={onSend}
            disabled={!input.trim() || loading}
            aria-label={t('llm.chat.send')}
          >
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: flex-end;
  }

  textarea {
    flex: 1;
    padding: 0.75rem 5rem 0.75rem 1rem;
    border: 1px solid transparent;
    border-radius: 24px;
    font-size: 0.95rem;
    font-family: inherit;
    background: $background-2;
    color: $color-1;
    transition: all 0.15s ease;
    min-height: 44px;
    max-height: 200px;
    height: 44px;
    resize: none;
    overflow-y: auto;
    field-sizing: content;
    box-sizing: border-box;

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: $color-4;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba($background-3, 0.5);
    }

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: $color-5;
      border-radius: 3px;
    }
  }

  .input-buttons {
    position: absolute;
    right: 0.25rem;
    bottom: 0;
    top: 0;
    display: flex;
    gap: 0.25rem;
    align-items: center;
    padding: 0.25rem;
  }

  .voice-btn {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    padding: 0;
    background: transparent;
    color: $color-2;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 1.1rem;
    }

    &:hover:not(:disabled) {
      background: rgba($color-3, 0.1);
    }

    &.processing {
      background: #f59e0b;
      color: white;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }
  }

  .stop-btn,
  .cancel-btn {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    padding: 0;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 1.1rem;
    }

    &:hover {
      background: #dc2626;
    }
  }

  .send-btn {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    padding: 0;
    padding-top: 2px;
    padding-right: 2px;
    background: $color-3;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 0.9rem;
    }

    &:hover:not(:disabled) {
      opacity: 0.9;
      transform: scale(1.05);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    &:disabled {
      background: $color-4;
      cursor: not-allowed;
      opacity: 0.4;
    }
  }

  .chat-input {
    padding: 0.5rem 1.5rem;
    background: $background-1;
  }

  .session-loading,
  .session-error {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    color: $color-3;
    font-size: 0.9rem;
  }

  .session-error {
    color: #e67e22;
    i {
      font-size: 1.1rem;
    }
  }

  .loading-dots {
    display: flex;
    gap: 0.3rem;

    span {
      width: 6px;
      height: 6px;
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

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    40% {
      transform: translateY(-5px);
      opacity: 1;
    }
  }
</style>
