const favoriteCounterSelector = '[data-favorite-counter]'
const animationDuration = 520
const removeAnimationDuration = 220

function getFavoriteCounter() {
  return document.querySelector<HTMLElement>(favoriteCounterSelector)
}

function pulseFavoriteCounter(className: string, duration: number) {
  const target = getFavoriteCounter()
  if (!target) return

  target.classList.remove(className)
  requestAnimationFrame(() => {
    target.classList.add(className)
    window.setTimeout(() => target.classList.remove(className), duration)
  })
}

function getStarSource(source: HTMLElement) {
  return source.querySelector<HTMLElement>('i') ?? source
}

function getCenter(rect: DOMRect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

export function animateFavoriteToHeader(source: HTMLElement) {
  const target = getFavoriteCounter()
  if (!target) return

  const sourceRect = getStarSource(source).getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  if (
    sourceRect.width === 0 ||
    sourceRect.height === 0 ||
    targetRect.width === 0 ||
    targetRect.height === 0
  )
    return

  const from = getCenter(sourceRect)
  const to = getCenter(targetRect)
  const star = document.createElement('i')
  star.className = 'fas fa-star favorite-fly-star'

  Object.assign(star.style, {
    position: 'fixed',
    left: `${from.x}px`,
    top: `${from.y}px`,
    zIndex: '3000',
    pointerEvents: 'none',
    color: 'currentColor',
    transform: 'translate(-50%, -50%) scale(1)',
  })

  document.body.append(star)
  target.classList.remove('favorite-counter-hit')

  const animation = star.animate(
    [
      {
        opacity: 1,
        transform: 'translate(-50%, -50%) scale(1)',
      },
      {
        opacity: 0.95,
        offset: 0.72,
        transform: `translate(calc(-50% + ${to.x - from.x}px), calc(-50% + ${to.y - from.y}px)) scale(0.72)`,
      },
      {
        opacity: 0,
        transform: `translate(calc(-50% + ${to.x - from.x}px), calc(-50% + ${to.y - from.y}px)) scale(0.42)`,
      },
    ],
    {
      duration: animationDuration,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      fill: 'forwards',
    },
  )

  window.setTimeout(() => target.classList.add('favorite-counter-hit'), 360)

  void animation.finished
    .catch(() => {})
    .finally(() => {
      star.remove()
      window.setTimeout(() => {
        target.classList.remove('favorite-counter-hit')
      }, 260)
    })
}

export function animateFavoriteRemoval() {
  pulseFavoriteCounter('favorite-counter-remove', removeAnimationDuration)
}
