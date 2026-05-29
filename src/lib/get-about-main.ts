import db from '@db'
import defaultBanner from '@markdown/main/banner.md?raw'
import defaultBody from '@markdown/main/body.md?raw'

function normalizeThemeBanner(banner: unknown) {
  const bannerText = String(banner)
  if (!bannerText.includes('main-banner{darkMode}')) return bannerText

  return bannerText
    .split('\n')
    .flatMap(line => {
      if (!line.includes('main-banner{darkMode}')) return line

      const lightBannerLine = line.replaceAll('{darkMode}', '')
      const darkBannerLine = line
        .replaceAll('{darkMode}', '-dark')
        .replace(/!\[([^\]]*)\]/, (markdownImage: string, alt: string) => {
          const darkAlt = alt.includes('dark-mode') ? alt : `${alt} dark-mode`
          return markdownImage.replace(alt, darkAlt)
        })
      return [lightBannerLine, darkBannerLine]
    })
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
