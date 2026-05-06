<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import PreviewManager from '@lib/preview-manager'
  import { tabsHelper } from '@tab/tabs-helper'
  import { getRelated, getFkRelatedVariables } from '@lib/db'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import type { Variable } from '@type'

  let { variable: variableProp }: { variable: Variable } = $props()
  const variable = untrack(() => variableProp)

  const dataset = db.get('dataset', variable.datasetId)
  let variablePreview: false | { variable: string; datasetId: string } = false
  if (dataset && PreviewManager.hasPreview(dataset.hasPreview)) {
    variablePreview = {
      variable: variable.originalName || variable.name,
      datasetId: String(dataset.id),
    }
  }

  const variables = [
    ...getRelated('variable', variable, 'source'),
    ...getRelated('variable', variable, 'derived'),
    ...getFkRelatedVariables(variable),
  ]

  const evolutions = db
    .getAll('evolution')
    .filter(evo => evo.entity === 'variable' && evo.id === variable.id)

  const freqData = db.getAll('frequency', { variable })

  let tabs = tabsHelper({
    variable,
    variables,
    variableValues: variable.values,
    frequency: freqData,
    variablePreview,
    evolutions,
  })

  if (variable.isPattern) {
    const freqTab = tabs.find(t => t.key === 'frequency')
    if (freqTab) freqTab.props.isPattern = true
  }
  if (variable.sampleSize && variable.nbRow) {
    const freqTab = tabs.find(t => t.key === 'frequency')
    if (freqTab) freqTab.props.scale = variable.nbRow / variable.sampleSize
  }
</script>

<section class="section">
  <Title type="variable" name={variable.name} id={variable.id} />
  <Tabs {tabs} />
</section>
