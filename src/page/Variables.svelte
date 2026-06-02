<script lang="ts">
  import db from '@db'
  import { makeParentsRelative, addMinimumDeep } from '@lib/db'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import aboutFile from '@markdown/about-variable.md?raw'
  import { translate } from '@i18n/i18n'

  const variables = db.getAll('variable')
  const tags = db.getAll('tag').filter(tag => !!tag.nbVariable)
  if (db.useRecursive.tag) {
    makeParentsRelative(false, tags)
    addMinimumDeep(tags, true, true)
  }

  const evolutions = db
    .getAll('evolution')
    .filter(evo => evo.entity === 'variable')

  const tabs = tabsHelper({
    variables,
    tags,
    evolutions,
    stat: [{ entity: 'variable', items: variables }],
    aboutFile,
  })
</script>

<section class="section">
  <Title
    type="variable"
    name={$translate('entityPlural.variable')}
    mode="mainTitle"
  />
  <Tabs {tabs} />
</section>
