const entityRoutePattern = /^([^/?#]+)\/([^/?#]+)$/
const transitionNamePrefix = 'entity-title'
const animationDuration = 780
const titleBounceDistance = 8

type Navigate = () => void
type TextStyleSnapshot = {
  color: string
  font: string
  lineHeight: string
}

function cleanTransitionPart(value: string | number) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '-')
}

function getEntityRoute(href: string) {
  const route = href.replace(/^\/+/, '').split('?')[0]
  const match = route.match(entityRoutePattern)
  if (!match) return undefined

  return {
    entity: match[1],
    id: match[2],
    route,
    routeKey: route.replace(/\//g, '___'),
  }
}

export function getEntityTitleTransitionName(
  entity: string,
  id: string | number,
) {
  return `${transitionNamePrefix}-${cleanTransitionPart(entity)}-${cleanTransitionPart(id)}`
}

function getTitleTarget(route: ReturnType<typeof getEntityRoute>) {
  if (!route) return undefined
  const transitionName = getEntityTitleTransitionName(route.entity, route.id)
  return document.querySelector<HTMLElement>(
    `[data-entity-title-transition="${transitionName}"]`,
  )
}

function getTextSource(source: HTMLElement) {
  return (
    source.querySelector<HTMLElement>('.long-text') ??
    source.querySelector<HTMLElement>('.var-main-col a') ??
    source.querySelector<HTMLElement>('a') ??
    source
  )
}

function getTextRect(element: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(element)
  const rect = range.getBoundingClientRect()
  range.detach()
  return rect.width > 0 && rect.height > 0
    ? rect
    : element.getBoundingClientRect()
}

function createTextClone(
  text: string,
  rect: DOMRect,
  style: TextStyleSnapshot,
) {
  const clone = document.createElement('span')
  clone.textContent = text

  Object.assign(clone.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: 'max-content',
    margin: '0',
    zIndex: '10000',
    pointerEvents: 'none',
    transformOrigin: 'top left',
    color: style.color,
    font: style.font,
    lineHeight: style.lineHeight,
    whiteSpace: 'nowrap',
    background: 'transparent',
  })

  return clone
}

function getTitleBounceOffset(delta: number) {
  if (delta === 0) return 0
  return (
    Math.sign(delta) * Math.min(Math.abs(delta) * 0.04, titleBounceDistance)
  )
}

function animateTitleClone(text: string, target: HTMLElement, from: DOMRect) {
  const to = getTextRect(target)
  if (
    from.width === 0 ||
    from.height === 0 ||
    to.width === 0 ||
    to.height === 0
  )
    return

  const targetStyle = getComputedStyle(target)
  const clone = createTextClone(text, from, targetStyle)

  document.body.append(clone)
  target.style.visibility = 'hidden'

  const deltaX = to.left - from.left
  const deltaY = to.top - from.top
  const bounceX = getTitleBounceOffset(deltaX)
  const bounceY = getTitleBounceOffset(deltaY)

  const animation = clone.animate(
    [
      {
        transform: 'translate(0, 0) scale(1)',
      },
      {
        offset: 0.86,
        transform: `translate(${deltaX + bounceX}px, ${deltaY + bounceY}px) scale(1)`,
      },
      {
        offset: 0.94,
        transform: `translate(${deltaX - bounceX * 0.35}px, ${deltaY - bounceY * 0.35}px) scale(1)`,
      },
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(1)`,
      },
    ],
    {
      duration: animationDuration,
      easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
      fill: 'forwards',
    },
  )

  void animation.finished
    .catch(() => {})
    .finally(() => {
      clone.remove()
      target.style.visibility = ''
    })
}

function animateAfterNavigation(
  text: string,
  sourceBounds: DOMRect,
  route: ReturnType<typeof getEntityRoute>,
) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const target = getTitleTarget(route)
      if (!target) return
      animateTitleClone(text, target, sourceBounds)
    })
  })
}

export function navigateWithEntityTitleTransition(
  event: MouseEvent,
  href: string,
  navigate: Navigate,
  currentPage = '',
) {
  if (event.ctrlKey || event.metaKey) return

  event.preventDefault()

  const route = getEntityRoute(href)
  const source = event.currentTarget

  if (
    !route ||
    route?.route === currentPage ||
    route?.routeKey === currentPage ||
    !(source instanceof HTMLElement)
  ) {
    navigate()
    return
  }
  const textSource = getTextSource(source)
  const sourceBounds = textSource.getBoundingClientRect()
  const text = textSource.textContent?.trim() ?? ''

  navigate()
  if (text) animateAfterNavigation(text, sourceBounds, route)
}
