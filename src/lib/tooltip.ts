import { sanitizeHtml } from '@lib/html-sanitizer'

let tooltipEl: HTMLDivElement | null = null
let hideTimeout: ReturnType<typeof setTimeout> | null = null

// Bounding box that encloses both the trigger and the tooltip (plus a margin).
// The tooltip stays visible as long as the pointer is inside this "safe area",
// so the user can move onto the tooltip from anywhere on the trigger — whatever
// the relative size/position of the two (wide header + narrow tooltip, gaps...).
type SafeRect = { left: number; top: number; right: number; bottom: number }
let safeRect: SafeRect | null = null
const safeMargin = 12
const hideDelay = 250

function createTooltip(): HTMLDivElement {
  const el = document.createElement('div')
  el.id = 'tooltip'
  el.setAttribute('role', 'tooltip')

  const content = document.createElement('div')
  content.className = 'tooltip-content'
  el.appendChild(content)

  const arrow = document.createElement('div')
  arrow.className = 'tooltip-arrow'
  el.appendChild(arrow)

  document.body.appendChild(el)
  return el
}

function getTooltipContent(): HTMLDivElement {
  const tooltip = getTooltip()
  return tooltip.querySelector('.tooltip-content') as HTMLDivElement
}

function getTooltip(): HTMLDivElement {
  if (!tooltipEl) {
    tooltipEl = createTooltip()
  }
  return tooltipEl
}

function positionTooltip(target: HTMLElement, tooltip: HTMLDivElement) {
  const rect = target.getBoundingClientRect()
  const isTop = target.classList.contains('tooltip-top')
  const gap = 8

  tooltip.style.left = `${rect.left + rect.width / 2}px`

  if (isTop) {
    // Position above the element with extra space for visual clarity
    tooltip.style.top = `${rect.top + window.scrollY - gap - 24}px`
    tooltip.classList.add('tooltip-top')
    tooltip.classList.remove('tooltip-bottom')
  } else {
    tooltip.style.top = `${rect.bottom + window.scrollY + gap}px`
    tooltip.classList.add('tooltip-bottom')
    tooltip.classList.remove('tooltip-top')
  }

  // Set the safe area synchronously so a mousemove arriving before the
  // requestAnimationFrame below never reads a stale rect from a prior tooltip.
  updateSafeArea(rect, tooltip)

  // Smart repositioning if overflowing
  requestAnimationFrame(() => {
    const tooltipRect = tooltip.getBoundingClientRect()

    // Check horizontal overflow
    if (tooltipRect.right > window.innerWidth - gap) {
      tooltip.style.left = `${window.innerWidth - tooltipRect.width - gap}px`
      tooltip.style.transform = 'none'
    } else if (tooltipRect.left < gap) {
      tooltip.style.left = `${gap}px`
      tooltip.style.transform = 'none'
    }

    // Check vertical overflow and flip if needed
    if (isTop && tooltipRect.top < gap) {
      tooltip.style.top = `${rect.bottom + window.scrollY + gap}px`
      tooltip.classList.remove('tooltip-top')
      tooltip.classList.add('tooltip-bottom')
    } else if (!isTop && tooltipRect.bottom > window.innerHeight) {
      tooltip.style.top = `${rect.top + window.scrollY - gap}px`
      tooltip.classList.remove('tooltip-bottom')
      tooltip.classList.add('tooltip-top')
    }

    // Recompute the safe area after any overflow repositioning above.
    updateSafeArea(target.getBoundingClientRect(), tooltip)
  })
}

// Safe area = bounding box enclosing both the trigger and the tooltip, plus a
// margin. The pointer can travel anywhere inside it without the tooltip hiding.
function updateSafeArea(targetRect: DOMRect, tooltip: HTMLDivElement) {
  const p = tooltip.getBoundingClientRect()
  safeRect = {
    left: Math.min(targetRect.left, p.left) - safeMargin,
    top: Math.min(targetRect.top, p.top) - safeMargin,
    right: Math.max(targetRect.right, p.right) + safeMargin,
    bottom: Math.max(targetRect.bottom, p.bottom) + safeMargin,
  }
}

function showTooltip(target: HTMLElement) {
  const title = target.getAttribute('title') || target.dataset.tooltip
  if (!title) return

  // Store and remove title to prevent native tooltip
  if (target.hasAttribute('title')) {
    target.dataset.tooltip = title
    target.removeAttribute('title')
  }

  cancelHide()

  const tooltip = getTooltip()
  const content = getTooltipContent()
  content.innerHTML = sanitizeHtml(title)
  tooltip.style.transform = 'translateX(-50%)'
  tooltip.classList.add('visible')

  positionTooltip(target, tooltip)
}

function cancelHide() {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

function hideTooltip() {
  getTooltip().classList.remove('visible')
  safeRect = null
}

function scheduleHide() {
  if (hideTimeout) return
  hideTimeout = setTimeout(() => {
    hideTimeout = null
    hideTooltip()
  }, hideDelay)
}

function isInSafeArea(x: number, y: number): boolean {
  return (
    !!safeRect &&
    x >= safeRect.left &&
    x <= safeRect.right &&
    y >= safeRect.top &&
    y <= safeRect.bottom
  )
}

export function initTooltips() {
  getTooltip()

  // Keep the tooltip open while the pointer stays inside the safe area that
  // spans both the trigger and the tooltip; hide it (after a short delay) once
  // the pointer leaves. This works regardless of their relative size/position.
  document.addEventListener('mousemove', e => {
    if (!safeRect) return
    if (isInSafeArea(e.clientX, e.clientY)) cancelHide()
    else scheduleHide()
  })

  // Show the tooltip when the pointer enters a trigger (event delegation).
  document.body.addEventListener(
    'mouseenter',
    e => {
      const target = (e.target as HTMLElement).closest?.(
        '.use-tooltip',
      ) as HTMLElement | null
      if (target) showTooltip(target)
    },
    true,
  )
}

export function updateTooltipText(text: string, isHtml = false) {
  const tooltip = getTooltip()
  if (tooltip.classList.contains('visible')) {
    const content = getTooltipContent()
    if (isHtml) {
      content.innerHTML = sanitizeHtml(text)
    } else {
      content.textContent = text
    }
  }
}
