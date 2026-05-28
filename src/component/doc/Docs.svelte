<script lang="ts">
  import { untrack } from 'svelte'
  import Column from '@lib/column'
  import Render from '@lib/render'
  import { link } from '@lib/url'
  import { getPercent } from '@lib/util'
  import Datatable from '@datatable/Datatable.svelte'
  import escapeHtml from 'escape-html'
  import type { Doc, Column as ColumnType } from '@type'

  let { docs: docsProp }: { docs: Doc[] } = $props()
  const docs = untrack(() => docsProp)

  let organizationMax = 0
  let folderMax = 0
  let datasetMax = 0
  let tagMax = 0
  for (const doc of docs) {
    organizationMax = Math.max(organizationMax, doc.nbOrganization ?? 0)
    folderMax = Math.max(folderMax, doc.nbFolder ?? 0)
    datasetMax = Math.max(datasetMax, doc.nbDataset ?? 0)
    tagMax = Math.max(tagMax, doc.nbTag ?? 0)
  }

  const docsSorted = [...docs]

  function sortDocs(toSort: Doc[]) {
    if (toSort.length === 0) return
    toSort.sort(
      (a, b) =>
        (b.inherited ?? '').localeCompare(a.inherited ?? '') ||
        a.name.localeCompare(b.name),
    )
  }
  sortDocs(docsSorted)

  let columns: ColumnType[] = [
    Column.favorite(),
    Column.name('doc', 'Doc'),
    Column.description(),
    {
      data: 'type',
      name: 'docType',
      title: Render.icon('type') + 'Type',
      defaultContent: '',
      filterType: 'select',
      tooltip: 'Type de fichier (markdown ou pdf)',
      render: (data, type) => {
        if (!data) return ''
        if (type !== 'display') return String(data)
        data = escapeHtml(data)
        return `${data} ${Render.icon(data)}`
      },
    },
    Column.docPath(),
    {
      data: 'lastUpdateDate',
      title: Render.icon('date') + 'Mise à jour',
      defaultContent: '',
      filterType: 'input',
      tooltip: 'Date de dernière mise à jour',
      render: (data, type, row) => Render.datetime(data, type, row),
    },
    Column.inherited(),
    {
      data: 'nbOrganization',
      title:
        Render.icon('organization') +
        "<span class='hidden'>nbOrganizations</span>",
      filterType: 'input',
      tooltip: "Nombre d'organisations",
      render: (data, type, row: Doc) => {
        if (!data) return ''
        const content = link(
          'doc/' + row.id + '?tab=organizations',
          escapeHtml(data),
        )
        const percent = getPercent(data / organizationMax)
        return `${Render.numPercent(content, percent, 'organization', type)}`
      },
    },
    {
      data: 'nbFolder',
      title: Render.icon('folder') + "<span class='hidden'>nbFolders</span>",
      filterType: 'input',
      tooltip: 'Nombre de dossiers',
      render: (data, type, row: Doc) => {
        if (!data) return ''
        const content = link('doc/' + row.id + '?tab=folders', escapeHtml(data))
        const percent = getPercent(data / folderMax)
        return `${Render.numPercent(content, percent, 'folder', type)}`
      },
    },
    {
      data: 'nbTag',
      title: Render.icon('tag') + "<span class='hidden'>nbTags</span>",
      filterType: 'input',
      tooltip: 'Nombre de mots clés',
      render: (data, type, row: Doc) => {
        if (!data) return ''
        const content = link('doc/' + row.id + '?tab=tags', escapeHtml(data))
        const percent = getPercent(data / tagMax)
        return `${Render.numPercent(content, percent, 'tag', type)}`
      },
    },
    {
      data: 'nbDataset',
      title: Render.icon('dataset') + "<span class='hidden'>nbDatasets</span>",
      filterType: 'input',
      tooltip: 'Nombre de datasets',
      render: (data, type, row: Doc) => {
        if (!data) return ''
        const content = link(
          'doc/' + row.id + '?tab=datasets',
          escapeHtml(data),
        )
        const percent = getPercent(data / datasetMax)
        return `${Render.numPercent(content, percent, 'dataset', type)}`
      },
    },
  ]
</script>

<Datatable entity="doc" data={docsSorted} {columns} />
