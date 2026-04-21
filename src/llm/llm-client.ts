/**
 * Infomaniak LLM API Client
 * Handles streaming chat completions and tool calls
 */

import {
  getLLMConfig,
  getSessionToken,
  initializeLLMConfig,
  isLocalProxy,
} from './llm-config'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  tool_calls?: ToolCall[]
  // eslint-disable-next-line @typescript-eslint/naming-convention
  tool_call_id?: string
}

export type ToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export type ToolDefinition = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: {
        [key: string]: { type: string; description: string; enum?: string[] }
      }
      required: string[]
    }
  }
}

export type ChatCompletionOptions = {
  model?: string
  messages: ChatMessage[]
  tools?: ToolDefinition[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
  signal?: AbortSignal
  onChunk?: (chunk: string) => void
  onToolCall?: (toolCall: ToolCall) => Promise<unknown>
}

type SSEDelta = {
  content?: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  tool_calls?: Array<{
    index?: number
    id?: string
    function?: {
      name?: string
      arguments?: string
    }
  }>
}

type SSEParsed = {
  id?: string
  model?: string
  choices?: Array<{
    delta?: SSEDelta
    // eslint-disable-next-line @typescript-eslint/naming-convention
    finish_reason?: string
  }>
  usage?: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    prompt_tokens?: number
    // eslint-disable-next-line @typescript-eslint/naming-convention
    completion_tokens?: number
    // eslint-disable-next-line @typescript-eslint/naming-convention
    total_tokens?: number
    // eslint-disable-next-line @typescript-eslint/naming-convention
    prompt_tokens_details?: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      cached_tokens?: number
    }
  }
}

type ErrorResponse = {
  error: string
}

export type ChatCompletionResponse = {
  id: string
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    // eslint-disable-next-line @typescript-eslint/naming-convention
    finish_reason: string
  }>
  usage?: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    prompt_tokens: number
    // eslint-disable-next-line @typescript-eslint/naming-convention
    completion_tokens: number
    // eslint-disable-next-line @typescript-eslint/naming-convention
    total_tokens: number
    // eslint-disable-next-line @typescript-eslint/naming-convention
    prompt_tokens_details?: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      cached_tokens: number
    }
  }
}

/**
 * Call Infomaniak LLM API with streaming support
 */
export async function chatCompletion(
  options: ChatCompletionOptions,
): Promise<ChatCompletionResponse | null> {
  await initializeLLMConfig()
  const config = getLLMConfig()

  const {
    model = config.models.text,
    messages,
    tools,
    temperature = config.temperature,
    maxTokens = config.maxTokens,
    stream = true,
    signal,
    onChunk,
    onToolCall,
  } = options

  const payload = {
    model,
    messages,
    ...(tools && tools.length > 0
      ? {
          tools,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          parallel_tool_calls: true,
        }
      : {}),
    temperature,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    max_tokens: maxTokens,
    stream,
    user: 'datannur-user',
  }

  const useProxy = !!config.proxyURL

  if (!useProxy) {
    throw new Error(
      'Proxy server required. Please start the local proxy server.',
    )
  }

  // Build URL based on environment
  const url = config.isLocalProxy
    ? `${config.proxyURL}/api/chat/completions`
    : `${config.proxyURL}/index.php`

  try {
    const contentType = 'application/json'
    const accept = stream ? 'text/event-stream' : 'application/json'

    const headers: { [key: string]: string } = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': contentType,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: accept,
    }

    // Add session token for online mode
    if (!isLocalProxy()) {
      const token = getSessionToken()
      if (!token) {
        throw new Error('Session required. Please reopen the chat panel.')
      }

      headers['X-Session-Token'] = token
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal,
    })

    if (!response.ok) {
      const error: ErrorResponse = (await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))) as ErrorResponse
      throw new Error(
        `API Error: ${response.status} - ${JSON.stringify(error)}`,
      )
    }

    if (stream) {
      return await handleStreamingResponse(response, onChunk, onToolCall)
    } else {
      return (await response.json()) as ChatCompletionResponse
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    console.error('LLM API Error:', error)
    throw error
  }
}

/**
 * Handle Server-Sent Events (SSE) streaming response
 */
async function handleStreamingResponse(
  response: Response,
  onChunk?: (chunk: string) => void,
  onToolCall?: (toolCall: ToolCall) => Promise<unknown>,
): Promise<ChatCompletionResponse | null> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''
  const currentToolCalls: ToolCall[] = []
  let responseMetadata: Partial<ChatCompletionResponse> = {}

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (value) {
        buffer += decoder.decode(value, { stream: !done })
      }

      const lines = buffer.split('\n')
      buffer = done ? '' : (lines[lines.length - 1] ?? '')
      const linesToProcess = done ? lines : lines.slice(0, -1)

      for (const line of linesToProcess) {
        if (!line.startsWith('data: ')) continue

        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data) as SSEParsed

          if (!responseMetadata.id) {
            responseMetadata = {
              id: parsed.id ?? 'unknown',
              model: parsed.model ?? 'unknown',
            }
          }

          if (parsed.usage?.prompt_tokens !== undefined) {
            responseMetadata.usage = {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              prompt_tokens: parsed.usage.prompt_tokens,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              completion_tokens: parsed.usage.completion_tokens ?? 0,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              total_tokens: parsed.usage.total_tokens ?? 0,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              prompt_tokens_details: parsed.usage.prompt_tokens_details
                ? {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    cached_tokens:
                      parsed.usage.prompt_tokens_details.cached_tokens ?? 0,
                  }
                : undefined,
            }
          }

          const delta = parsed.choices?.[0]?.delta
          const finishReason = parsed.choices?.[0]?.finish_reason

          if (delta?.content) {
            fullText += delta.content
            onChunk?.(delta.content)
          }

          if (delta?.tool_calls) {
            for (const toolCallDelta of delta.tool_calls) {
              const index: number = toolCallDelta.index ?? 0

              if (!currentToolCalls[index]) {
                currentToolCalls[index] = {
                  id: toolCallDelta.id ?? '',
                  type: 'function',
                  function: {
                    name: toolCallDelta.function?.name ?? '',
                    arguments: '',
                  },
                }
              }

              const existingCall = currentToolCalls[index]
              if (toolCallDelta.function?.arguments && existingCall) {
                existingCall.function.arguments +=
                  toolCallDelta.function.arguments
              }
            }
          }

          if (finishReason === 'tool_calls' && onToolCall) {
            for (const toolCall of currentToolCalls) {
              await onToolCall(toolCall)
            }
          }
        } catch (e) {
          console.warn('Failed to parse SSE line:', line, e)
        }
      }

      if (done) break
    }

    const response: ChatCompletionResponse = {
      id: responseMetadata.id ?? 'unknown',
      model: responseMetadata.model ?? 'unknown',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: fullText,
            ...(currentToolCalls.length > 0
              ? // eslint-disable-next-line @typescript-eslint/naming-convention
                { tool_calls: currentToolCalls }
              : {}),
          },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          finish_reason: currentToolCalls.length > 0 ? 'tool_calls' : 'stop',
        },
      ],
      ...(responseMetadata.usage ? { usage: responseMetadata.usage } : {}),
    }

    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    console.error('Streaming error:', error)
    throw error
  } finally {
    reader.releaseLock()
  }
}

/**
 * Streaming chat with callback
 */
export async function chatStream(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  options?: Partial<ChatCompletionOptions>,
): Promise<string> {
  let fullText = ''

  await chatCompletion({
    messages,
    stream: true,
    onChunk: chunk => {
      fullText += chunk
      onChunk(chunk)
    },
    ...options,
  })

  return fullText
}
