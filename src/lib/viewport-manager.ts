import { writable, derived, get } from 'svelte/store'
import { isSsgRendering, isStaticMode } from 'svelte-fileapp'

export const chatPanelWidth = 420

export const breakpoints = {
  tinyMobile: 600,
  smallMobile: chatPanelWidth + 360, // chat width + min app width = 780px
  mobile: 1023,
} as const

export const windowBreakpoints = {
  smallMobile: 780,
  mobile: 1023,
} as const

class ViewportManager {
  private _chatWidth = writable(0)
  private _windowWidth = writable(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  )

  chatWidth = this._chatWidth
  appWidth = derived(
    [this._windowWidth, this._chatWidth],
    ([$windowWidth, $chatWidth]: [number, number]) => {
      if ($windowWidth <= windowBreakpoints.smallMobile) {
        return $windowWidth
      }
      return $windowWidth - $chatWidth
    },
  )

  isMobile = derived(
    this.appWidth,
    ($appWidth: number) => $appWidth <= breakpoints.mobile,
  )

  isDesktop = derived(
    this.appWidth,
    ($appWidth: number) => $appWidth > breakpoints.mobile,
  )

  isSmallMobile = derived(
    this.appWidth,
    ($appWidth: number) => $appWidth <= breakpoints.smallMobile,
  )

  isTinyMobile = derived(
    this.appWidth,
    ($appWidth: number) => $appWidth <= breakpoints.tinyMobile,
  )

  documentWidth = this.appWidth
  windowWidth = this._windowWidth

  private unsubscribe?: () => void
  private resizeHandler?: () => void

  constructor() {
    if (typeof window === 'undefined') return
    if (isSsgRendering || isStaticGenerationRender()) return

    this.unsubscribe = this.appWidth.subscribe(($appWidth: number) => {
      const $chatWidth = get(this._chatWidth)
      const $windowWidth = get(this._windowWidth)

      document.documentElement.style.setProperty(
        '--chat-panel-width',
        `${chatPanelWidth}px`,
      )
      document.documentElement.style.setProperty(
        '--chat-width',
        `${$chatWidth}px`,
      )
      // Only set --app-width when chat is open to avoid overriding CSS default (100vw)
      // This prevents static HTML generation from baking in a fixed pixel width
      if ($chatWidth > 0) {
        document.documentElement.style.setProperty(
          '--app-width',
          `${$appWidth}px`,
        )
      } else {
        document.documentElement.style.removeProperty('--app-width')
      }

      document.body.classList.toggle(
        'small-mobile',
        $appWidth <= breakpoints.smallMobile,
      )
      document.body.classList.toggle(
        'tiny-mobile',
        $appWidth <= breakpoints.tinyMobile,
      )
      document.body.classList.toggle('mobile', $appWidth <= breakpoints.mobile)
      document.body.classList.toggle('desktop', $appWidth > breakpoints.mobile)

      document.body.classList.toggle(
        'window-small-mobile',
        $windowWidth <= windowBreakpoints.smallMobile,
      )
      document.body.classList.add('viewport-managed')
      document.body.classList.toggle('chat-open', $chatWidth > 0)

      document.body.dataset.appWidth = String($appWidth)
    })

    this.resizeHandler = () => {
      this._windowWidth.set(window.innerWidth)
    }
    window.addEventListener('resize', this.resizeHandler)
  }

  destroy() {
    this.unsubscribe?.()
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
  }

  setChatWidth(width: number) {
    this._chatWidth.set(width)
  }
}

function isStaticGenerationRender() {
  const app = document.getElementById('app')

  return isStaticMode && (app?.children.length ?? 0) === 0
}

export const viewportManager = new ViewportManager()
export const {
  chatWidth,
  appWidth,
  isMobile,
  isDesktop,
  isSmallMobile,
  isTinyMobile,
  documentWidth,
  windowWidth,
} = viewportManager
