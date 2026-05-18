<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import { removeDuplicateById, getRelated, getFkRelated } from '@lib/db'
  import PreviewManager from '@lib/preview-manager'
  import { tabsHelper } from '@tab/tabs-helper'
  import Tabs from '@tab/Tabs.svelte'
  import Title from '@layout/Title.svelte'
  import type { Enumeration } from '@type'

  let { id }: { id: string | number } = $props()
  const dataset = untrack(() => db.get('dataset', id))

  let variables = db.getAll('variable', { dataset })
  if (dataset) {
    dataset.nbVariable = variables.length
    dataset.keyVariables = variables.filter(variable => variable.key)
    dataset.businessKeyVariables = variables.filter(
      variable => variable.businessKey,
    )
  }

  let enumerations: Enumeration[] = variables.flatMap(
    variable => variable.enumerations ?? [],
  )
  enumerations = removeDuplicateById(enumerations)

  let datasetPreview = PreviewManager.hasPreview(dataset?.hasPreview)
    ? String(dataset?.id)
    : false

  const enumerationsId = new Set(enumerations.map(item => item.id))

  const datasets = dataset
    ? [
        ...getRelated('dataset', dataset, 'source'),
        ...getRelated('dataset', dataset, 'derived'),
        ...getFkRelated(dataset),
      ]
    : []

  const evolutions = db
    .getAll('evolution')
    .filter(
      evo =>
        (evo.entity === 'dataset' && evo.id === dataset?.id) ||
        (evo.parentEntity === 'dataset' &&
          evo.parentEntityId === dataset?.id) ||
        (evo.parentEntity === 'enumeration' &&
          evo.parentEntityId !== undefined &&
          enumerationsId.has(evo.parentEntityId)) ||
        (evo.entity === 'enumeration' &&
          evo.id !== undefined &&
          enumerationsId.has(evo.id)),
    )

  const stat = [
    { entity: 'doc', items: dataset?.docs },
    { entity: 'variable', items: variables },
    { entity: 'enumeration', items: enumerations },
  ]

  let tabs = tabsHelper({
    dataset,
    docs: dataset?.docs,
    datasets,
    variables,
    enumerations,
    datasetPreview,
    evolutions,
    stat,
  })
</script>

<section class="section">
  <Title type="dataset" name={dataset?.name ?? ''} id={dataset?.id} />
  <Tabs {tabs} />
</section>
