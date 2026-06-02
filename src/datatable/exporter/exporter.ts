import Logs from '@lib/logs'
import type { TranslationKey } from '@i18n/types'

type Translate = (key: TranslationKey) => string

function applyToElements(selector: string, apply: (element: Element) => void) {
  document.querySelectorAll(selector).forEach(apply)
}

export default class Exporter {
  id: string
  constructor(id: string) {
    this.id = id
  }
  getLanguage(translate: Translate) {
    return {
      copyTitle: translate('datatable.copyTitle'),
      copySuccess: translate('datatable.copySuccess'),
    }
  }
  getButtons() {
    const filename = this.id
    return [
      {
        text: '<span class="icon icon-download main"><i class="fas fa-cloud-download-alt"></i></span>',
        action: () => this.toggleMainBtn(),
        footer: false,
      },
      {
        text: '<span class="icon icon-download"><i class="fas fa-copy"></i></span>copie',
        className: 'download-button',
        extend: 'copy',
        title: '',
        exportOptions: { orthogonal: 'export' },
        footer: false,
      },
      {
        text: '<span class="icon icon-download"><i class="fas fa-file-csv"></i></span>csv',
        className: 'download-button',
        extend: 'csvHtml5',
        fieldSeparator: ';',
        extension: '.csv',
        filename,
        bom: true,
        exportOptions: { orthogonal: 'export' },
        footer: false,
      },
      {
        text: '<span class="icon icon-download"><i class="fas fa-file-excel"></i></span>excel',
        className: 'download-button',
        extend: 'excelHtml5',
        filename,
        title: '',
        exportOptions: { orthogonal: 'export' },
        footer: false,
      },
    ]
  }

  toggleMainBtn() {
    const tableId = `#${this.id}_wrapper`
    const btns = `${tableId} .buttons-html5`
    const mainBtn = document.querySelector(`${tableId} .dt-buttons`)
    if (!mainBtn) return
    const isOpen = mainBtn.getAttribute('is-open')
    if (isOpen === 'true') {
      applyToElements(btns, element => element.classList.remove('open'))
      mainBtn.setAttribute('is-open', 'false')
      Logs.add('closeTableDownload')
    } else {
      applyToElements(btns, element => element.classList.add('open'))
      mainBtn.setAttribute('is-open', 'true')
      Logs.add('openTableDownload')
    }
  }
}
