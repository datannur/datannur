<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import { makeParentsRelative, addMinimumDeep } from '@lib/db'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import Title from '@layout/Title.svelte'
  import type { Concept, Doc, Variable } from '@type'

  let { concept: conceptProp }: { concept: Concept } = $props()
  const concept = untrack(() => conceptProp)

  const variables: Variable[] = db.getAll('variable', { concept })
  const docs: Doc[] = concept.docs ?? []

  const childConcepts = db.getAllChilds('concept', concept.id)

  let allVariables = [...variables]
  for (const child of childConcepts) {
    const childVariables = db.getAll('variable', { concept: child })
    allVariables = allVariables.concat(childVariables)
  }

  if (db.useRecursive.concept) {
    makeParentsRelative(concept.id, childConcepts)
    addMinimumDeep(childConcepts)
  }

  const evolutions = db
    .getAll('evolution')
    .filter(
      evo =>
        (evo.entity === 'concept' && evo.id === concept.id) ||
        (evo.parentEntity === 'concept' && evo.parentEntityId === concept.id),
    )

  const stat = [
    { entity: 'concept', items: childConcepts },
    { entity: 'doc', items: docs },
    { entity: 'variable', items: allVariables },
  ]

  const tabs = tabsHelper({
    concept,
    concepts: childConcepts,
    variables: allVariables,
    docs,
    evolutions,
    stat,
  })
</script>

<section class="section">
  <Title type="concept" name={concept.name} id={concept.id} />
  <Tabs {tabs} />
</section>
