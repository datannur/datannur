import Navigo from 'navigo'
import { navigateWithEntityTitleTransition } from '@lib/page-transition'
import { appBasePath, useCleanRouting } from '@lib/url'
import { currentRoute } from './router-store'

const httpProtocol = 'http'
const mailtoProtocol = 'mailto'

export const router = new Navigo(useCleanRouting ? appBasePath : '/', {
  hash: !useCleanRouting,
}) as Navigo & { incrementReload?: () => void }

let currentRouteValue = ''
currentRoute.subscribe(value => (currentRouteValue = value))

declare global {
  interface Window {
    goToHref: (event: MouseEvent, href: string) => void
  }
}

window.goToHref = (event: MouseEvent, href: string) => {
  const navigate = () => {
    if (
      !href.startsWith(httpProtocol) &&
      !href.startsWith(mailtoProtocol) &&
      currentRouteValue === href.split('?')[0].replace(/\//g, '___')
    ) {
      router.navigate(href)
      router.incrementReload?.()
    } else {
      router.navigate(href)
    }
  }

  navigateWithEntityTitleTransition(event, href, navigate, currentRouteValue)
}
