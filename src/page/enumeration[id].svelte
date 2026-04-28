<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import Title from '@layout/Title.svelte'
  import type { Enumeration } from '@type'

  let { enumeration: enumerationProp }: { enumeration: Enumeration } = $props()
  const enumeration = untrack(() => enumerationProp)

  const variables = db.getAll('variable', { enumeration })
  const values = enumeration.values

  const evolutions = db
    .getAll('evolution')
    .filter(
      evo =>
        (evo.entity === 'enumeration' && evo.id === enumeration.id) ||
        (evo.parentEntity === 'enumeration' && evo.parentEntityId === enumeration.id),
    )

  const tabs = tabsHelper({ enumeration, values, variables, evolutions })
</script>

<section class="section">
  <Title type="enumeration" name={enumeration.name} id={enumeration.id} />
  <Tabs {tabs} />
</section>
