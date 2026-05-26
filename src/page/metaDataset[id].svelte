<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import { getMetaDatasetBreadcrumbItems } from '@lib/breadcrumb'
  import { filterKeysWithLabels } from '@lib/db'
  import { getUserData } from '@lib/user-data'
  import { tabsHelper } from '@tab/tabs-helper'
  import Tabs from '@tab/Tabs.svelte'
  import Title from '@layout/Title.svelte'
  import type { Row, MetaDataset } from '@type'

  let { metaDataset: metaDatasetProp }: { metaDataset: MetaDataset } = $props()
  const metaDataset = untrack(() => metaDatasetProp)

  let metaVariables = db.getAll('metaVariable', { metaDataset })
  const breadcrumbItems = getMetaDatasetBreadcrumbItems(
    metaDataset.metaFolderId,
  )

  let datasetPreview: Row[] = []
  if (metaDataset.metaFolderId === 'data') {
    const datasetPreviewRaw = db.getAll(metaDataset.name)
    const keysToKeep = metaVariables.map(metaVariable => ({
      key: metaVariable.name,
      label: metaVariable.storageKey || metaVariable.name,
    }))
    datasetPreview = filterKeysWithLabels(datasetPreviewRaw, keysToKeep)
  } else if (metaDataset.metaFolderId === 'userData') {
    const userData = getUserData()
    datasetPreview = userData?.[metaDataset.name] ?? []
  }

  let tabs = tabsHelper({
    metaDataset,
    metaVariables,
    datasetPreview,
  })
</script>

<section class="section">
  <Title type="dataset" name={metaDataset.name} {breadcrumbItems} />
  <Tabs {tabs} />
</section>
