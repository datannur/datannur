/// <reference types="vite/client" />

import type Index from 'flexsearch'

declare global {
  interface Window {
    FlexSearch: typeof Index
    goToHref: (event: MouseEvent, href: string) => void
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
    /* eslint-disable-next-line @typescript-eslint/naming-convention */
    SpeechRecognition: {
      new (): SpeechRecognition
    }
  }

  interface SpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    onstart: (() => void) | null
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    start: () => void
    stop: () => void
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string
  }

  interface SpeechRecognitionResultList {
    length: number
    item: (index: number) => SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    length: number
    item: (index: number) => SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
    isFinal: boolean
  }

  interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
  }

  const __APP_VERSION__: string
}
