/**
 * Speech-to-Text Client
 * Handles both Whisper API and Chrome native speech recognition
 */

import {
  getLLMConfig,
  getSessionToken,
  initializeLLMConfig,
  isLocalProxy,
} from './llm-config'
import { t } from '@i18n/messages'
import { getCurrentLocale } from '@i18n/i18n'

export type TranscriptionResponse = {
  text: string
}

export type STTError = Error & {
  code?: 'network' | 'not-allowed' | 'not-supported' | 'aborted' | 'unknown'
  isRecoverable?: boolean
}

let activeChromeRecognition: SpeechRecognition | null = null

type ErrorResponse = {
  error: string
}

const whisperLanguageByLocale = {
  en: 'en',
  fr: 'fr',
  de: 'de',
}

const speechRecognitionLanguageByLocale = {
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
}

function getTranscriptionLanguage() {
  const locale = getCurrentLocale()
  return {
    whisper: whisperLanguageByLocale[locale],
    speechRecognition: speechRecognitionLanguageByLocale[locale],
  }
}

/**
 * Create a typed STT error
 */
function createSTTError(
  message: string,
  code: STTError['code'],
  isRecoverable = false,
): STTError {
  const error = new Error(message) as STTError
  error.code = code
  error.isRecoverable = isRecoverable
  return error
}

/**
 * Check if browser is Chromium-based (Chrome, Edge, Brave, Opera, etc.)
 */
function isChromiumBrowser(): boolean {
  const ua = navigator.userAgent
  return (
    (/Chrome/.test(ua) && !/Edg/.test(ua)) || /Edg/.test(ua) || /OPR/.test(ua)
  )
}

/**
 * Check if Google Speech (Web Speech API) is available in this browser
 * Only works reliably on Chromium-based browsers
 */
export function isGoogleSpeechAvailable(): boolean {
  if (!isChromiumBrowser()) return false
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

/**
 * Test if Google Speech actually works (not just exists)
 * Returns a promise that resolves to true if working, false otherwise
 */
export async function testGoogleSpeechAvailability(): Promise<boolean> {
  if (!isGoogleSpeechAvailable()) return false

  return new Promise(resolve => {
    try {
      const speechRecognitionConstructor = (window.webkitSpeechRecognition ??
        window.SpeechRecognition) as { new (): SpeechRecognition }
      const recognition = new speechRecognitionConstructor()

      const timeout = setTimeout(() => {
        recognition.stop()
        resolve(false)
      }, 3000)

      recognition.onstart = () => {
        clearTimeout(timeout)
        recognition.stop()
        resolve(true)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        clearTimeout(timeout)
        if (event.error === 'network' || event.error === 'not-allowed') {
          resolve(false)
        } else {
          resolve(true)
        }
      }

      recognition.start()
    } catch {
      resolve(false)
    }
  })
}

/**
 * Transcribe audio using Whisper V3 (Infomaniak)
 */
async function transcribeWithWhisper(
  audioBlob: Blob,
): Promise<TranscriptionResponse> {
  await initializeLLMConfig()
  const config = getLLMConfig()

  if (!config.proxyURL) {
    throw new Error(
      'Proxy server required. Please start the local proxy server.',
    )
  }

  try {
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.webm')
    formData.append('model', 'whisper')
    formData.append('language', getTranscriptionLanguage().whisper)
    formData.append('response_format', 'text')

    // Build URL based on environment
    const url = config.isLocalProxy
      ? `${config.proxyURL}/api/audio/transcriptions`
      : `${config.proxyURL}/transcribe.php`

    const headers: { [key: string]: string } = {}

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
      body: formData,
    })

    if (!response.ok) {
      const error: ErrorResponse = (await response
        .json()
        .catch(() => ({ error: 'Transcription failed' }))) as ErrorResponse
      throw new Error(
        `Transcription Error: ${response.status} - ${JSON.stringify(error)}`,
      )
    }

    const result = (await response.json()) as { text: string }
    return { text: result.text ?? '' }
  } catch (error) {
    console.error('Whisper API Error:', error)
    throw error
  }
}

/**
 * Stop active Chrome native speech recognition
 */
export function stopChromeRecognition(): void {
  if (activeChromeRecognition) {
    try {
      activeChromeRecognition.stop()
      activeChromeRecognition = null
    } catch (err) {
      console.error('Error stopping recognition:', err)
    }
  }
}

/**
 * Transcribe audio using Chrome native speech recognition
 * Note: Chrome native ignores the audioBlob and listens directly from microphone
 */
function transcribeWithChromeNative(): Promise<TranscriptionResponse> {
  return new Promise((resolve, reject) => {
    if (!isGoogleSpeechAvailable()) {
      reject(
        createSTTError(t('llm.stt.googleUnsupported'), 'not-supported', false),
      )
      return
    }

    const speechRecognitionConstructor = (window.webkitSpeechRecognition ??
      window.SpeechRecognition) as { new (): SpeechRecognition }
    const recognition = new speechRecognitionConstructor()
    activeChromeRecognition = recognition

    recognition.lang = getTranscriptionLanguage().speechRecognition
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript =
        (event.results[0]?.[0]?.transcript as string | undefined) ?? ''
      recognition.stop()
      activeChromeRecognition = null
      resolve({ text: transcript })
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      recognition.stop()
      activeChromeRecognition = null

      if (event.error === 'no-speech') {
        resolve({ text: '' })
      } else if (event.error === 'network') {
        reject(createSTTError(t('llm.stt.googleUnavailable'), 'network', false))
      } else if (event.error === 'not-allowed') {
        reject(
          createSTTError(t('llm.stt.microphoneDenied'), 'not-allowed', false),
        )
      } else if (event.error === 'aborted') {
        reject(createSTTError(t('llm.stt.recognitionAborted'), 'aborted', true))
      } else {
        reject(
          createSTTError(
            t('llm.stt.recognitionError', { error: event.error }),
            'unknown',
            true,
          ),
        )
      }
    }

    try {
      recognition.start()
    } catch {
      reject(createSTTError(t('llm.stt.startError'), 'unknown', false))
    }
  })
}

/**
 * Main transcription function - routes to the appropriate engine
 */
export async function transcribeAudio(
  audioBlob: Blob,
  engine: 'whisper' | 'chrome-native' = 'whisper',
): Promise<TranscriptionResponse> {
  if (engine === 'chrome-native') {
    return transcribeWithChromeNative()
  }
  return transcribeWithWhisper(audioBlob)
}

type MicrophoneRecorderState = {
  mediaRecorder: MediaRecorder | null
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  audioChunks: Blob[]
  silenceTimeout: number | null
  isCancelled: boolean
}

const recorderState: MicrophoneRecorderState = {
  mediaRecorder: null,
  audioContext: null,
  analyser: null,
  audioChunks: [],
  silenceTimeout: null,
  isCancelled: false,
}

/**
 * Cancel any active microphone recording
 */
export function cancelMicrophoneRecording(): void {
  recorderState.isCancelled = true

  if (recorderState.mediaRecorder?.state !== 'inactive') {
    const tracks = recorderState.mediaRecorder?.stream.getTracks()
    tracks?.forEach(track => track.stop())
    recorderState.mediaRecorder?.stop()
  }

  if (recorderState.audioContext) {
    recorderState.audioContext.close()
    recorderState.audioContext = null
  }

  if (recorderState.silenceTimeout) {
    clearTimeout(recorderState.silenceTimeout)
    recorderState.silenceTimeout = null
  }

  recorderState.audioChunks = []
  recorderState.analyser = null
  recorderState.mediaRecorder = null
}

/**
 * Detect silence and auto-stop recording
 */
function detectSilence(onSilenceDetected: () => void): void {
  if (!recorderState.analyser) return

  const bufferLength = recorderState.analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  let hasDetectedSpeech = false

  const checkAudio = () => {
    if (!recorderState.analyser || recorderState.isCancelled) return

    recorderState.analyser.getByteTimeDomainData(dataArray)

    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      const value = (dataArray[i] ?? 128) - 128
      sum += value * value
    }
    const rms = Math.sqrt(sum / bufferLength)

    if (rms > 3) {
      hasDetectedSpeech = true
      if (recorderState.silenceTimeout) {
        clearTimeout(recorderState.silenceTimeout)
        recorderState.silenceTimeout = null
      }
    } else if (hasDetectedSpeech) {
      if (!recorderState.silenceTimeout) {
        recorderState.silenceTimeout = window.setTimeout(() => {
          onSilenceDetected()
        }, 1500)
      }
    }

    if (
      !recorderState.isCancelled &&
      recorderState.mediaRecorder?.state === 'recording'
    ) {
      requestAnimationFrame(checkAudio)
    }
  }

  checkAudio()
}

/**
 * Record from microphone with automatic silence detection and transcription
 * Unified API for both Whisper and Chrome native engines
 */
export function transcribeFromMicrophone(
  engine: 'whisper' | 'chrome-native',
  callbacks: {
    onRecordingStart?: () => void
    onSilenceDetected?: () => void
    onProcessingStart?: () => void
  } = {},
): Promise<TranscriptionResponse> {
  // Chrome native handles everything internally
  if (engine === 'chrome-native') {
    callbacks.onRecordingStart?.()
    return transcribeWithChromeNative()
  }

  // Whisper: need to record audio first
  return new Promise((resolve, reject) => {
    recorderState.isCancelled = false
    recorderState.audioChunks = []

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(stream => {
        recorderState.audioContext = new AudioContext()
        recorderState.analyser = recorderState.audioContext.createAnalyser()
        const source =
          recorderState.audioContext.createMediaStreamSource(stream)
        source.connect(recorderState.analyser)
        recorderState.analyser.fftSize = 2048

        const options = { mimeType: 'audio/webm;codecs=opus' }
        recorderState.mediaRecorder = new MediaRecorder(stream, options)

        recorderState.mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            recorderState.audioChunks.push(event.data)
          }
        }

        recorderState.mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop())

          if (recorderState.audioContext) {
            recorderState.audioContext.close()
            recorderState.audioContext = null
          }

          if (recorderState.silenceTimeout) {
            clearTimeout(recorderState.silenceTimeout)
            recorderState.silenceTimeout = null
          }

          if (
            recorderState.isCancelled ||
            recorderState.audioChunks.length === 0
          ) {
            recorderState.isCancelled = false
            resolve({ text: '' })
            return
          }

          callbacks.onProcessingStart?.()

          try {
            const audioBlob = new Blob(recorderState.audioChunks, {
              type: 'audio/webm',
            })
            const result = await transcribeWithWhisper(audioBlob)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }

        recorderState.mediaRecorder.start()
        callbacks.onRecordingStart?.()

        detectSilence(() => {
          callbacks.onSilenceDetected?.()
          if (recorderState.mediaRecorder?.state !== 'inactive') {
            recorderState.mediaRecorder?.stop()
          }
        })
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          reject(new Error(t('llm.stt.microphoneDenied')))
        } else {
          reject(
            new Error(
              t('llm.stt.microphoneAccessError', {
                error: (err as Error).message,
              }),
            ),
          )
        }
      })
  })
}
