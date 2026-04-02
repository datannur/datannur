<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import { tabsHelper } from '@tab/tabs-helper'
  import { getLineage } from '@lib/db'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import type { Variable } from '@type'

  let { variable: variableProp }: { variable: Variable } = $props()
  const variable = untrack(() => variableProp)

  const dataset = db.get('dataset', variable.datasetId)
  let variablePreview: false | object = false
  if (dataset?.link) {
    variablePreview = {
      variable: variable.name,
      datasetId: dataset.link ? dataset.id : false,
    }
  }

  const variables = [
    ...getLineage('variable', variable, 'source'),
    ...getLineage('variable', variable, 'derived'),
  ]

  const evolutions = db
    .getAll('evolution')
    .filter(evo => evo.entity === 'variable' && evo.id === variable.id)

  const freqData = db.getAll('freq', { variable })

  let tabs = tabsHelper({
    variable,
    variables,
    variableValues: variable.values,
    freq: freqData,
    variablePreview,
    evolutions,
  })

  if (variable.sampleSize && variable.nbRow) {
    const freqTab = tabs.find(t => t.key === 'freq')
    if (freqTab) freqTab.props.scale = variable.nbRow / variable.sampleSize
  }
</script>

<section class="section">
  <Title type="variable" name={variable.name} id={variable.id} />
  <Tabs {tabs} />
</section>
