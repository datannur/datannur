import { sanitizeHtml } from '@lib/html-sanitizer'

let tooltipEl: HTMLDivElement | null = null
let hideTimeout: ReturnType<typeof setTimeout> | null = null
let isOverTrigger = false
let isOverTooltip = false

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
  })
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

function scheduleHide() {
  cancelHide()
  hideTimeout = setTimeout(() => {
    // Only hide if mouse is not on trigger or tooltip
    if (!isOverTrigger && !isOverTooltip) {
      const tooltip = getTooltip()
      tooltip.classList.remove('visible')
    }
  }, 150)
}

export function initTooltips() {
  const tooltip = getTooltip()

  // Tooltip mouse tracking
  tooltip.addEventListener('mouseenter', () => {
    isOverTooltip = true
    cancelHide()
  })

  tooltip.addEventListener('mouseleave', () => {
    isOverTooltip = false
    scheduleHide()
  })

  // Trigger mouse tracking using event delegation
  document.body.addEventListener(
    'mouseenter',
    e => {
      const target = (e.target as HTMLElement).closest?.(
        '.use-tooltip',
      ) as HTMLElement | null
      if (target) {
        isOverTrigger = true
        showTooltip(target)
      }
    },
    true,
  )

  document.body.addEventListener(
    'mouseleave',
    e => {
      const target = (e.target as HTMLElement).closest?.(
        '.use-tooltip',
      ) as HTMLElement | null
      if (target) {
        isOverTrigger = false
        scheduleHide()
      }
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
