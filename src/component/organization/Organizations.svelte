<script lang="ts">
  import { untrack } from 'svelte'
  import { wrapLongText } from '@lib/util'
  import { getParentPath } from '@lib/db'
  import Column from '@lib/column'
  import Render from '@lib/render'
  import Datatable from '@datatable/Datatable.svelte'
  import escapeHtml from 'escape-html'
  import type { Organization, Column as ColumnType } from '@type'

  let { organizations: organizationsProp }: { organizations: Organization[] } =
    $props()
  const organizations = untrack(() => organizationsProp)

  const isRecursive = true

  let organizationMax = 0
  let folderMax = 0
  let datasetMax = 0
  let nbDocMax = 0
  let variableMax = 0
  let dataSizeMax = 0
  let levelMax = 0
  for (const organization of organizations) {
    organization.pathString = getParentPath(organization)
    organizationMax = Math.max(
      organizationMax,
      organization.nbChildRecursive ?? 0,
    )
    folderMax = Math.max(folderMax, organization.nbFolderRecursive ?? 0)
    datasetMax = Math.max(datasetMax, organization.nbDatasetRecursive ?? 0)
    nbDocMax = Math.max(nbDocMax, organization.docsRecursive?.length ?? 0)
    variableMax = Math.max(variableMax, organization.nbVariableRecursive ?? 0)
    dataSizeMax = Math.max(dataSizeMax, organization.dataSizeRecursive ?? 0)
    levelMax = Math.max(levelMax, (organization.parents?.length ?? 0) + 1)
  }

  const organizationsSorted = [...organizations]
  organizationsSorted.sort((a, b) =>
    (a.pathString ?? '').localeCompare(b.pathString ?? ''),
  )

  const columns: ColumnType[] = [
    Column.favorite(),
    Column.name('organization', 'Organisation', {
      withIndent: true,
      linkSameEntityTab: true,
    }),
    Column.description(),
    Column.nbChildRecursive('organization', organizationMax),
    Column.nbFolderRecursive('organization', folderMax),
    Column.nbDatasetRecursive('organization', datasetMax),
    Column.nbVariable('organization', variableMax, {
      recursive: true,
    }),
    Column.dataSize(dataSizeMax, { recursive: true }),
    Column.nbDoc('organization', nbDocMax),
    Column.tag(),
    Column.parents('organization'),
    {
      data: 'email',
      defaultContent: '',
      title: Render.icon('email') + 'Email',
      tooltip: 'Email de contact',
      render: (data, type) => {
        if (!data) return ''
        if (type !== 'display') return String(data)
        data = escapeHtml(data)
        return wrapLongText(
          `<a href="mailto:${data}" target="_blanck" >${data}</a>`,
        )
      },
    },
    {
      data: 'phone',
      defaultContent: '',
      title: Render.icon('phone') + 'Téléphone',
      tooltip: 'Téléphone de contact',
      render: (data, type) => {
        if (!data) return ''
        if (type !== 'display') return String(data)
        data = escapeHtml(data)
        return `<a href="tel:${data}" target="_blanck" >${data}</a>`
      },
    },
    Column.startDate(),
    Column.endDate(),
    Column.level(levelMax),
  ]
</script>

<Datatable
  entity="organization"
  data={organizationsSorted}
  {isRecursive}
  {columns}
/>
