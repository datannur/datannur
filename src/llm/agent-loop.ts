/**
 * Agent Loop for LLM Chat
 * Handles the conversation loop with tool calling support
 */

import { chatStream } from '@llm/llm-client'
import { getToolDefinitions, executeTool } from '@llm/llm-tools'
import { t } from '@i18n/messages'
import { getCurrentLocale } from '@i18n/i18n'
import type { ChatMessage, ToolCall } from '@llm/llm-client'

export type AgentLoopOptions = {
  systemPrompt: string
  model: string
  signal: AbortSignal
  maxLoops?: number
  maxMessages?: number
}

export type AgentLoopCallbacks = {
  getMessages: () => ChatMessage[]
  setMessages: (messages: ChatMessage[]) => void
  onChunk: (chunk: string) => void
}

/**
 * Run the agent loop with tool calling support
 * Continues until the LLM generates a text response without tool calls
 */
export async function runAgentLoop(
  options: AgentLoopOptions,
  callbacks: AgentLoopCallbacks,
): Promise<void> {
  const {
    systemPrompt,
    model,
    signal,
    maxLoops = 10,
    maxMessages = 20,
  } = options
  const { getMessages, setMessages, onChunk } = callbacks

  const systemMessage: ChatMessage = {
    role: 'system',
    content: systemPrompt,
  }

  let continueLoop = true
  let loopCount = 0

  while (continueLoop && loopCount < maxLoops) {
    loopCount++
    let hadToolCall = false

    let messages = getMessages()
    if (messages.length > maxMessages) {
      messages = messages.slice(-maxMessages)
      setMessages(messages)
    }

    const currentMessages = [systemMessage, ...messages.slice(0, -1)]
    const tools = getToolDefinitions(getCurrentLocale())

    await chatStream(
      currentMessages,
      (chunk: string) => {
        const messages = getMessages()
        const lastIndex = messages.length - 1
        setMessages([
          ...messages.slice(0, lastIndex),
          {
            ...messages[lastIndex]!,
            content: messages[lastIndex]!.content + chunk,
          },
        ])
        onChunk(chunk)
      },
      {
        model,
        signal,
        tools,
        onToolCall: async (toolCall: ToolCall) => {
          hadToolCall = true
          await handleToolCall(toolCall, getMessages, setMessages)
        },
      },
    )

    continueLoop = shouldContinueLoop(hadToolCall, getMessages())
  }

  if (loopCount >= maxLoops) {
    console.warn('[Agent Loop] Max iterations reached')
  }
}

async function handleToolCall(
  toolCall: ToolCall,
  getMessages: () => ChatMessage[],
  setMessages: (messages: ChatMessage[]) => void,
): Promise<void> {
  try {
    console.log('[Tool]', toolCall.function.name)

    const toolArgs = JSON.parse(toolCall.function.arguments) as Record<
      string,
      unknown
    >
    const result = await executeTool(toolCall.function.name, toolArgs)

    const messages = getMessages()
    const lastAssistantIndex = messages.length - 1

    // Update assistant message with tool_calls, add tool result, add new assistant message
    setMessages([
      ...messages.slice(0, lastAssistantIndex),
      {
        ...messages[lastAssistantIndex]!,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        tool_calls: [toolCall],
      },
      {
        role: 'tool',
        content: JSON.stringify(result),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
      },
      {
        role: 'assistant',
        content: '',
      },
    ])
  } catch (toolError) {
    console.error('Tool execution error:', toolError)
    const messages = getMessages()
    setMessages([
      ...messages,
      {
        role: 'assistant',
        content: t('llm.chat.toolExecutionError', {
          error:
            toolError instanceof Error ? toolError.message : String(toolError),
        }),
      },
    ])
    throw toolError
  }
}

function shouldContinueLoop(
  hadToolCall: boolean,
  messages: ChatMessage[],
): boolean {
  const lastMsg = messages[messages.length - 1]

  // If we had a tool call AND the message already has content, stop (parallel tool calling worked!)
  if (hadToolCall && lastMsg?.role === 'assistant' && lastMsg.content) {
    return false
  }
  // Continue if we had a tool call without content (need to get LLM response to the tool result)
  if (hadToolCall) {
    return true
  }
  // Stop if last message has content (LLM generated a text response)
  if (lastMsg?.role === 'assistant' && lastMsg.content) {
    return false
  }
  // Stop if last message is assistant without tool_calls (safety check)
  if (lastMsg?.role === 'assistant' && !lastMsg.tool_calls) {
    return false
  }
  return true
}
