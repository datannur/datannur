import db from '@db'
import defaultBannerEn from '@markdown/main/banner.en.md?raw'
import defaultBannerFr from '@markdown/main/banner.fr.md?raw'
import defaultBannerDe from '@markdown/main/banner.de.md?raw'
import defaultBodyEn from '@markdown/main/body.en.md?raw'
import defaultBodyFr from '@markdown/main/body.fr.md?raw'
import defaultBodyDe from '@markdown/main/body.de.md?raw'
import { localizedField } from '@i18n/data'
import { localizedMarkdown } from '@i18n/markdown'

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

function getConfigValue(id: string) {
  const config = db.get('config', id)
  if (!config) return ''
  return String(localizedField(config, 'value') ?? '')
}

export function getAboutMain() {
  const defaultBanner = localizedMarkdown({
    en: defaultBannerEn,
    fr: defaultBannerFr,
    de: defaultBannerDe,
  })
  const defaultBody = localizedMarkdown({
    en: defaultBodyEn,
    fr: defaultBodyFr,
    de: defaultBodyDe,
  })
  const banner = db.exists('config', 'banner')
    ? getConfigValue('banner')
    : defaultBanner

  const body = db.exists('config', 'body')
    ? getConfigValue('body')
    : defaultBody

  const moreInfo = db.exists('config', 'more_info')
    ? '\n\n' + getConfigValue('more_info')
    : ''

  return normalizeThemeBanner(banner) + '\n' + body + moreInfo
}
