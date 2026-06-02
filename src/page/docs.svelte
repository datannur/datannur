<script lang="ts">
  import db from '@db'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import aboutFile from '@markdown/about-doc.md?raw'
  import { translate } from '@i18n/i18n'

  const docs = db.getAll('doc')

  const evolutions = db.getAll('evolution').filter(evo => evo.entity === 'doc')

  const tabs = tabsHelper({
    docs,
    evolutions,
    stat: [{ entity: 'doc', items: docs }],
    aboutFile,
  })
</script>

<section class="section">
  <Title type="doc" name={$translate('entityPlural.doc')} mode="mainTitle" />
  <Tabs {tabs} />
</section>
