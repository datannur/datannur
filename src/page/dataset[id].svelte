<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import { removeDuplicateById, getRelated, getFkRelated } from '@lib/db'
  import { tabsHelper } from '@tab/tabs-helper'
  import Tabs from '@tab/Tabs.svelte'
  import Title from '@layout/Title.svelte'
  import type { Modality } from '@type'

  let { id }: { id: string | number } = $props()
  const dataset = untrack(() => db.get('dataset', id))

  let variables = db.getAll('variable', { dataset })
  if (dataset) dataset.nbVariable = variables.length

  let modalities: Modality[] = variables.flatMap(
    variable => variable.modalities ?? [],
  )
  modalities = removeDuplicateById(modalities)

  let datasetPreview = dataset?.link ? dataset.id : false

  const modalitiesId = new Set(modalities.map(item => item.id))

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
        (evo.parentEntity === 'modality' &&
          evo.parentEntityId !== undefined &&
          modalitiesId.has(evo.parentEntityId)) ||
        (evo.entity === 'modality' &&
          evo.id !== undefined &&
          modalitiesId.has(evo.id)),
    )

  const stat = [
    { entity: 'doc', items: dataset?.docs },
    { entity: 'variable', items: variables },
    { entity: 'modality', items: modalities },
  ]

  let tabs = tabsHelper({
    dataset,
    docs: dataset?.docs,
    datasets,
    variables,
    modalities,
    datasetPreview,
    evolutions,
    stat,
  })
</script>

<section class="section">
  <Title type="dataset" name={dataset?.name ?? ''} id={dataset?.id} />
  <Tabs {tabs} />
</section>
