<script lang="ts">
  import { untrack } from 'svelte'
  import { link } from 'svelte-fileapp'
  import { wrapLongText, getPercent } from '@lib/util'
  import { getParentPath } from '@lib/db'
  import Column from '@lib/column'
  import Render from '@lib/render'
  import Datatable from '@datatable/Datatable.svelte'
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
        Column.name('folder', 'Dossiers'),
        Column.description(),
        {
          data: 'nbDataset',
          title: Render.icon('dataset') + 'Datasets',
          tooltip: 'Nombre de datasets',
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
      Column.name('folder', 'Dossier', {
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
        title: Render.icon('surveyType') + "Type d'enquête",
        defaultContent: '',
        tooltip: "Type d'enquête",
        render: Render.shortText,
      },
      Column.deliveryFormat(),
      Column.license(),
      {
        data: 'metadataPath',
        title: Render.icon('metadataPath') + 'Metadonnées',
        defaultContent: '',
        tooltip: 'Emplacement des métadonnées',
        render: (data, type) => {
          if (!data) return ''
          if (type !== 'display') return String(data)
          return Render.copyCell(escapeHtml(data), type)
        },
      },
      Column.dataPath(),
      {
        data: 'gitCode',
        title: Render.icon('gitCode') + 'GIT code',
        defaultContent: '',
        tooltip: 'Code source des traitements',
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

  const columns = defineColumns()
</script>

<Datatable
  entity="folder"
  data={foldersSorted}
  isRecursive={true}
  {columns}
  {metaPath}
/>
