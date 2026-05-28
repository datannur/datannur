import db from '@db'
import defaultBanner from '@markdown/main/banner.md?raw'
import defaultBody from '@markdown/main/body.md?raw'

function normalizeThemeBanner(banner: unknown) {
  const bannerText = String(banner)
  if (!bannerText.includes('main-banner')) return bannerText

  const bannerLines = bannerText.split('\n')
  const lightBannerLine = bannerLines.find(
    line => line.includes('main-banner') && !line.includes('dark-mode'),
  )
  if (!lightBannerLine) return bannerText

  const themeBannerLine = lightBannerLine.replace(
    /main-banner(\.\w+)(\?[^)]*)?/,
    'main-banner{darkMode}$1$2',
  )
  let themeBannerAdded = false
  return bannerLines
    .map(line => {
      if (!line.includes('main-banner')) return line
      if (themeBannerAdded) return null
      themeBannerAdded = true
      return themeBannerLine
    })
    .filter(line => line !== null)
    .join('\n')
}

export function getAboutMain() {
  const banner = db.exists('config', 'banner')
    ? db.getConfig('banner')
    : defaultBanner

  const body = db.exists('config', 'body') ? db.getConfig('body') : defaultBody

  const moreInfo = db.exists('config', 'more_info')
    ? '\n\n' + db.getConfig('more_info')
    : ''

  return normalizeThemeBanner(banner) + '\n' + body + moreInfo
}
