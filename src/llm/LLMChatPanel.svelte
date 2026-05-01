<script lang="ts">
  import {
    transcribeFromMicrophone,
    cancelMicrophoneRecording,
    stopChromeRecognition,
    type STTError,
  } from '@llm/stt-client'
  import {
    isProxyAvailable,
    checkProxyStatus,
    isLocalProxy,
    createSession,
  } from '@llm/llm-config'
  import { runAgentLoop } from '@llm/agent-loop'
  import Options from '@lib/options'
  import {
    viewportManager,
    chatPanelWidth,
    windowBreakpoints,
    windowWidth,
  } from '@lib/viewport-manager'
  import type { ChatMessage } from '@llm/llm-client'
  import modelsConfig from './models.json'
  import sttEnginesConfig from './stt-engines.json'
  import { buildSystemPrompt } from '@llm/system-prompt'
  import LLMConfigForm from '@llm/LLMConfigForm.svelte'
  import LLMDropdownSelector from '@llm/LLMDropdownSelector.svelte'
  import LLMChatMessages from '@llm/LLMChatMessages.svelte'
  import LLMChatInput from '@llm/LLMChatInput.svelte'

  let {
    isOpen = $bindable(false),
    isProxyUp = $bindable(false), // eslint-disable-line no-useless-assignment
  }: {
    isOpen?: boolean
    isProxyUp?: boolean
  } = $props()

  let messages = $state<ChatMessage[]>([])
  let input = $state('')
  let loading = $state(false)
  let abortController = $state<AbortController | null>(null)

  let isConfigured = $state(false)
  let isSessionReady = $state(false)
  let isCreatingSession = $state(false)

  let isRecording = $state(false)
  let isProcessing = $state(false)
  let voiceConversationMode = $state(false)
  let textareaRef = $state<HTMLTextAreaElement | null>(null)
  let chatPanelRef = $state<HTMLElement | null>(null)

  type SelectableItem = { id: string; name: string; description: string }
  const models = modelsConfig as SelectableItem[]
  let selectedModel = $state(models[0])

  const sttEngines = sttEnginesConfig as SelectableItem[]
  let selectedSTT = $state(sttEngines[0])

  function resolveSavedModel(savedModelId: string): SelectableItem | undefined {
    const model = models.find(m => m.id === savedModelId)

    if (model) {
      return model
    }

    const defaultModel = models[0]
    if (defaultModel) {
      Options.set('llmModel', defaultModel.id)
    }

    return defaultModel
  }

  Options.loaded.then(() => {
    const savedModelId = Options.get('llmModel') as string | undefined
    if (savedModelId) {
      const model = resolveSavedModel(savedModelId)
      if (model) selectedModel = model
    }

    const savedSTTId = Options.get('sttEngine') as string | undefined
    if (savedSTTId) {
      const stt = sttEngines.find(s => s.id === savedSTTId)
      if (stt) selectedSTT = stt
    }
  })

  $effect(() => {
    checkConfiguration().catch(console.error)
  })

  // Create session only when chat is opened (avoids Turnstile noise at startup)
  let sessionCreated = false
  $effect(() => {
    if (isOpen && isConfigured && !isLocalProxy() && !sessionCreated) {
      sessionCreated = true
      isCreatingSession = true
      createSession()
        .then(success => {
          isSessionReady = success
        })
        .catch(() => {
          isSessionReady = false
        })
        .finally(() => {
          isCreatingSession = false
        })
    }
    // For local proxy, session is always ready
    if (isLocalProxy() && isConfigured) {
      isSessionReady = true
    }
  })

  $effect(() => {
    let width = 0
    const currentWindowWidth = $windowWidth
    if (isOpen) {
      if (currentWindowWidth <= windowBreakpoints.smallMobile) {
        width = currentWindowWidth
      } else {
        width = chatPanelWidth as number
      }
    }
    viewportManager.setChatWidth(width)
  })

  $effect(() => {
    if (isOpen && textareaRef) {
      setTimeout(() => textareaRef?.focus(), 100)
    }
  })

  $effect(() => {
    if (textareaRef) {
      textareaRef.style.height = 'auto'
      textareaRef.style.height = `${textareaRef.scrollHeight}px`
    }
  })

  async function checkConfiguration(): Promise<void> {
    if (!isProxyAvailable()) {
      isProxyUp = false
      isConfigured = false
      return
    }

    const status = await checkProxyStatus()
    isProxyUp = status.available
    isConfigured = status.configured
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = { role: 'user', content: input }
    messages = [...messages, userMessage]
    input = ''

    if (textareaRef) {
      textareaRef.style.height = 'auto'
    }

    loading = true
    abortController = new AbortController()

    const assistantMessage: ChatMessage = { role: 'assistant', content: '' }
    messages = [...messages, assistantMessage]

    try {
      await runAgentLoop(
        {
          systemPrompt: buildSystemPrompt(),
          model: selectedModel.id,
          signal: abortController.signal,
        },
        {
          getMessages: () => messages,
          setMessages: newMessages => {
            messages = newMessages
          },
          onChunk: () => {},
        },
      )
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error:', error)
        const lastIndex = messages.length - 1
        messages = [
          ...messages.slice(0, lastIndex),
          { ...messages[lastIndex]!, content: `Erreur: ${error}` },
        ]
      }
    } finally {
      loading = false
      abortController = null
      if (voiceConversationMode) {
        setTimeout(() => {
          startRecording()
        }, 500)
      } else {
        setTimeout(() => {
          textareaRef?.focus()
        }, 0)
      }
    }
  }

  async function startRecording() {
    try {
      const result = await transcribeFromMicrophone(
        selectedSTT.id as 'whisper' | 'chrome-native',
        {
          onRecordingStart: () => {
            isRecording = true
            isProcessing = false
          },
          onSilenceDetected: () => {
            isRecording = false
            isProcessing = true
          },
          onProcessingStart: () => {
            isProcessing = true
          },
        },
      )

      isRecording = false
      isProcessing = false

      const transcription = result.text.trim()
      if (transcription) {
        input = transcription
        await sendMessage()
      } else {
        handlePostRecording()
      }
    } catch (err) {
      console.error('Recording error:', err)
      isRecording = false
      isProcessing = false

      const sttError = err as STTError
      const isRecoverable = sttError.isRecoverable ?? false

      if (isRecoverable && voiceConversationMode) {
        setTimeout(() => startRecording(), 500)
      } else {
        voiceConversationMode = false
        alert(sttError.message)
        textareaRef?.focus()
      }
    }
  }

  function handlePostRecording() {
    if (voiceConversationMode) {
      setTimeout(() => startRecording(), 500)
    } else {
      textareaRef?.focus()
    }
  }

  function cancelRecording() {
    voiceConversationMode = false
    isRecording = false
    isProcessing = false

    if (selectedSTT.id === 'chrome-native') {
      stopChromeRecognition()
    } else {
      cancelMicrophoneRecording()
    }

    textareaRef?.focus()
  }

  function handleVoiceClick() {
    if (isRecording) {
      cancelRecording()
    } else {
      voiceConversationMode = true
      startRecording()
    }
  }

  function exitVoiceMode() {
    cancelRecording()
  }

  function resetChat() {
    messages = []
    input = ''
    voiceConversationMode = false
  }
</script>

<div class="llm-chat-panel" class:open={isOpen} bind:this={chatPanelRef}>
  <div class="chat-header">
    <LLMDropdownSelector
      icon="fa-robot"
      items={models}
      bind:selected={selectedModel}
      optionKey="llmModel"
    />

    <LLMDropdownSelector
      icon="fa-microphone"
      items={sttEngines}
      bind:selected={selectedSTT}
      optionKey="sttEngine"
      menuPosition="center"
    />

    <div class="header-actions">
      {#if isConfigured && messages.length > 0}
        {#if voiceConversationMode}
          <button
            class="exit-voice-btn"
            onclick={exitVoiceMode}
            aria-label="Quitter mode vocal"
          >
            <i class="fa-solid fa-microphone-slash"></i>
          </button>
        {:else}
          <button
            class="new-chat-btn use-tooltip"
            onclick={resetChat}
            aria-label="Nouveau chat"
            title="Nouveau chat"
          >
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
        {/if}
      {/if}
      <button
        class="close-btn"
        onclick={() => (isOpen = false)}
        aria-label="Fermer"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  </div>

  {#if !isConfigured}
    <LLMConfigForm onConfigured={() => (isConfigured = true)} />
  {:else}
    <LLMChatMessages {messages} {loading} />

    <LLMChatInput
      bind:input
      bind:textareaRef
      {isRecording}
      {isProcessing}
      {loading}
      {isCreatingSession}
      {voiceConversationMode}
      showSessionError={!isSessionReady && !isLocalProxy() && isConfigured}
      onSend={sendMessage}
      onVoiceClick={handleVoiceClick}
      onCancelRecording={cancelRecording}
      onStopGeneration={() => abortController?.abort()}
    />
  {/if}
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .llm-chat-panel {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: var(--chat-panel-width);
    background: $background-2;
    display: flex;
    flex-direction: column;
    z-index: 100;
    border-left: 1px solid $color-5;
    overflow: hidden;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    overscroll-behavior: contain;

    &.open {
      transform: translateX(0);
    }
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1.5rem;
    background: $background-1;
    position: relative;
    height: 47px;
    z-index: 1;
    box-shadow: 0 8px 8px $background-1;

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .exit-voice-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      width: 36px;
      height: 36px;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      color: $color-2;
      transition: all 0.2s;

      i {
        font-size: 1.1rem;
      }

      &:hover {
        background: rgba(#ef4444, 0.1);
        color: #ef4444;
      }
    }

    .new-chat-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      width: 36px;
      height: 36px;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      color: $color-2;
      transition: all 0.2s;

      i {
        font-size: 1.1rem;
      }

      &:hover {
        background: $background-3;
        color: $color-3;
      }
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      width: 36px;
      height: 36px;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      color: $color-2;
      transition: all 0.2s;

      i {
        font-size: 1.25rem;
      }

      &:hover {
        background: $background-3;
        color: $color-3;
      }
    }
  }

  :global(body.window-small-mobile) {
    .llm-chat-panel {
      left: 0;
      width: 100%;
      border: 0;
      top: calc(3.25rem + 116px);
      border-top: 1px solid $color-5;
      border-top-left-radius: $rounded;
      border-top-right-radius: $rounded;
    }
  }
</style>
