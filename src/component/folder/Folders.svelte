<script lang="ts">
  import { untrack } from 'svelte'
  import { link } from '@lib/url'
  import { wrapLongText, getPercent, isHttpUrl } from '@lib/util'
  import { getParentPath } from '@lib/db'
  import Column from '@lib/column'
  import Render from '@lib/render'
  import Datatable from '@datatable/Datatable.svelte'
  import { t } from '@i18n/messages'
  import escapeHtml from 'escape-html'
  import type { Folder, Column as ColumnType } from '@type'

  let {
    folders: foldersProp,
    isMeta: isMetaProp = false,
  }: { folders: Folder[]; isMeta?: boolean } = $props()

  const folders = untrack(() => foldersProp)
  const isMeta = untrack(() => isMetaProp)

  const foldersSorted = [...folders]
  const folderPath = isMeta ? 'metaFolder/' : 'folder/'
  const metaPath = isMeta ? 'metaFolder' : undefined

  let variableMax = 0
  let datasetMax = 0
  let folderMax = 0
  let nbDocMax = 0
  let levelMax = 0
  let dataSizeMax = 0

  if (!isMeta) {
    for (const folder of folders) {
      folder.pathString = getParentPath(folder)
      datasetMax = Math.max(datasetMax, folder.nbDatasetRecursive ?? 0)
      variableMax = Math.max(variableMax, folder.nbVariableRecursive ?? 0)
      folderMax = Math.max(folderMax, folder.nbChildRecursive ?? 0)
      nbDocMax = Math.max(nbDocMax, folder.docsRecursive?.length ?? 0)
      levelMax = Math.max(levelMax, (folder.parents?.length ?? 0) + 1)
      dataSizeMax = Math.max(dataSizeMax, folder.dataSizeRecursive ?? 0)
    }
    foldersSorted.sort((a, b) =>
      (a.pathString ?? '').localeCompare(b.pathString ?? ''),
    )
  }

  if (isMeta) {
    for (const folder of folders) {
      datasetMax = Math.max(datasetMax, folder.nbDatasetRecursive ?? 0)
      variableMax = Math.max(variableMax, folder.nbVariableRecursive ?? 0)
    }
  }

  function defineColumns(): ColumnType[] {
    if (isMeta) {
      return [
        Column.name('folder', t('entityPlural.folder')),
        Column.description(),
        {
          data: 'nbDataset',
          title: Render.icon('dataset') + t('column.datasets.title'),
          tooltip: t('column.datasets.tooltip'),
          render: (data, type, row: Folder) => {
            if (!data) return ''
            const content = link(
              folderPath + row.id + '?tab=metaDatasets',
              escapeHtml(data),
            )
            const percent = getPercent(data / datasetMax)
            return `${Render.numPercent(content, percent, 'dataset', type)}`
          },
        },
        Column.nbVariable('folder', variableMax, {
          tab: 'metaVariables',
          linkPath: folderPath,
          showTitle: true,
        }),
      ]
    }

    return [
      Column.favorite(),
      Column.name('folder', t('entity.folder'), {
        withIndent: true,
        linkSameEntityTab: true,
      }),
      Column.description(),
      Column.folderType(),
      Column.nbChildRecursive('folder', folderMax, folderPath),
      Column.nbDatasetRecursive('folder', datasetMax),
      Column.nbVariable('folder', variableMax, {
        recursive: true,
      }),
      Column.dataSize(dataSizeMax, { recursive: true }),
      Column.nbDoc('folder', nbDocMax),
      Column.tag(),
      Column.lastUpdate(),
      Column.nextUpdate(),
      Column.updateFrequency(),
      Column.startDate(),
      Column.endDate(),
      Column.parents('folder'),
      Column.owner(),
      Column.manager(),
      Column.localisation(),
      {
        data: 'surveyType',
        title:
          Render.icon('surveyType') + t('column.surveyType.title'),
        defaultContent: '',
        tooltip: t('column.surveyType.tooltip'),
        render: Render.shortText,
      },
      Column.deliveryFormat(),
      Column.license(),
      {
        data: 'metadataPath',
        title:
          Render.icon('metadataPath') + t('column.metadata.title'),
        defaultContent: '',
        tooltip: t('column.metadata.tooltip'),
        render: (data: string, type) => {
          if (!data) return ''
          if (type !== 'display') return String(data)
          const escapedData = escapeHtml(data)
          if (isHttpUrl(data)) {
            const href = escapeHtml(data.trim())
            return wrapLongText(
              `<a href="${href}" target="_blank" rel="noreferrer">${escapedData}</a>`,
            )
          }
          return Render.copyCell(escapedData, type)
        },
      },
      Column.dataPath(),
      {
        data: 'gitCode',
        title: Render.icon('gitCode') + 'GIT code',
        defaultContent: '',
        tooltip: t('column.sourceCode.tooltip'),
        render: (data, type) => {
          if (!data) return ''
          if (type !== 'display') return String(data)
          data = escapeHtml(data)
          return wrapLongText(`<a href="${data}" target="_blanck">${data}</a>`)
        },
      },
      Column.level(levelMax),
    ]
  }

  const columns = $derived(defineColumns())
</script>

<Datatable
  entity="folder"
  data={foldersSorted}
  isRecursive={true}
  {columns}
  {metaPath}
/>
