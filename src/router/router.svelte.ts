import Navigo from 'navigo'
import { appBasePath, useCleanRouting } from '@lib/url'
import { page } from './router-store'

const httpProtocol = 'http'
const mailtoProtocol = 'mailto'

export const router = new Navigo(appBasePath, {
  hash: !useCleanRouting,
}) as Navigo & { incrementReload?: () => void }

let pageValue = ''
page.subscribe(value => (pageValue = value))

declare global {
  interface Window {
    goToHref: (event: MouseEvent, href: string) => void
  }
}

window.goToHref = (event: MouseEvent, href: string) => {
  if (event.ctrlKey || event.metaKey) return
  event.preventDefault()

  if (
    !href.startsWith(httpProtocol) &&
    !href.startsWith(mailtoProtocol) &&
    pageValue === href.split('?')[0]
  ) {
    router.navigate(href)
    router.incrementReload?.()
  } else {
    router.navigate(href)
  }
}
