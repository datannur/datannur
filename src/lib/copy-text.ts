import { updateTooltipText } from '@lib/tooltip'
import { t } from '@i18n/messages'

export const copyTextClasses = 'copyclip break-line use-tooltip'
export const getCopyTextMsg = () => t('copyText.copy')
const getCopyTextMsgCopied = () => t('copyText.copied')

export function copyTextListenClick() {
  document.addEventListener('click', async ({ target }) => {
    if (
      !(target instanceof HTMLElement) ||
      !target.classList.contains('copyclip')
    )
      return
    const text = target.textContent.trim()
    await navigator.clipboard.writeText(text)
    updateTooltipText(getCopyTextMsgCopied())
    setTimeout(() => updateTooltipText(getCopyTextMsg()), 1000)
  })
}
