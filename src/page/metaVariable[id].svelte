<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import { getMetaVariableBreadcrumbItems } from '@lib/breadcrumb'
  import { filterKeys } from '@lib/db'
  import { getUserData } from '@lib/user-data'
  import { tabsHelper } from '@tab/tabs-helper'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import type { MetaVariable } from '@type'

  let { metaVariable: metaVariableProp }: { metaVariable: MetaVariable } =
    $props()
  const metaVariable = untrack(() => metaVariableProp)

  const metaDataset = db.get('metaDataset', metaVariable.metaDatasetId)
  const breadcrumbItems = getMetaVariableBreadcrumbItems(metaVariable)
  let datasetPreview: Record<string, unknown>[] = []
  if (metaDataset?.metaFolderId === 'data') {
    datasetPreview = db.tables[metaDataset.name]
  } else if (metaDataset?.metaFolderId === 'userData') {
    const userData = getUserData()
    datasetPreview = userData?.[metaDataset.name] ?? []
  }
  const variablePreview = filterKeys(datasetPreview, [metaVariable.name])

  let tabs = tabsHelper({
    metaVariable,
    variableMetaValues: metaVariable.values,
    variablePreview,
  })
</script>

<section class="section">
  <Title
    type="variable"
    name={metaVariable.storageKey ? metaVariable.storageKey : metaVariable.name}
    {breadcrumbItems}
  />
  <Tabs {tabs} />
</section>
