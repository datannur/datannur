<script lang="ts">
  import db from '@db'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import aboutFile from '@markdown/about-enumeration.md?raw'

  const enumerations = db.getAll('enumeration')
  const evolutions = db
    .getAll('evolution')
    .filter(evo => evo.entity === 'enumeration' || evo.entity === 'value')

  const tabs = tabsHelper({
    enumerations,
    enumerationsCompare: enumerations.length > 1,
    evolutions,
    stat: [{ entity: 'enumeration', items: enumerations }],
    aboutFile,
  })
</script>

<section class="section">
  <Title type="enumeration" name="Énumérations" mode="mainTitle" />
  <Tabs {tabs} />
</section>
