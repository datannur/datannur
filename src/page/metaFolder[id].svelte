<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import Title from '@layout/Title.svelte'
  import type { MetaFolder } from '@type'

  let { metaFolder: metaFolderProp }: { metaFolder: MetaFolder } = $props()
  const metaFolder = untrack(() => metaFolderProp)

  let metaDatasets = db.getAll('metaDataset', { metaFolder })

  const metaVariables = metaDatasets.flatMap(metaDataset =>
    db.getAll('metaVariable', { metaDataset }),
  )

  const tabs = tabsHelper({ metaFolder, metaDatasets, metaVariables })
</script>

<section class="section">
  <Title
    type="folder"
    name={metaFolder.name}
    id={metaFolder.id}
    transitionType="metaFolder"
  />
  <Tabs {tabs} />
</section>
