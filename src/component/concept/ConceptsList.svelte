<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import ConceptsListLevel from '@component/concept/ConceptsListLevel.svelte'
  import type { Concept, ConceptWithChildren } from '@type'

  type ConceptTree = { [key: Concept['id']]: ConceptWithChildren }

  let { concepts: conceptsProp }: { concepts: Concept[] } = $props()
  const concepts = untrack(() => conceptsProp)

  function buildTree(concepts: Concept[]) {
    const conceptsTree: ConceptTree = {}
    concepts.forEach(concept => {
      if (!(concept.id in conceptsTree)) {
        conceptsTree[concept.id] = { ...concept, children: {} }
      }
    })
    if (!db.useRecursive.concept) {
      return conceptsTree
    }
    concepts.forEach(concept => {
      let currentLevel: ConceptTree = conceptsTree
      concept.parents?.forEach(parent => {
        if (!(parent.id in currentLevel)) {
          currentLevel[parent.id] = {
            ...parent,
            children: {},
          } as ConceptWithChildren
        }
        currentLevel = currentLevel[parent.id].children!
      })
      if (!(concept.id in currentLevel)) {
        currentLevel[concept.id] = conceptsTree[concept.id]
      } else {
        currentLevel[concept.id] = {
          ...conceptsTree[concept.id],
          children: { ...currentLevel[concept.id].children },
        }
      }
    })
    const rootConcepts: { [key: string]: ConceptWithChildren } = {}
    Object.keys(conceptsTree).forEach(conceptId => {
      if (conceptsTree[conceptId].parents?.length === 0) {
        rootConcepts[conceptId] = conceptsTree[conceptId]
      }
    })
    return rootConcepts
  }

  let conceptsTree = buildTree(concepts)
</script>

<div class="concepts-wrapper">
  <ConceptsListLevel concept={{ children: conceptsTree }} />
</div>

<style lang="scss">
  .concepts-wrapper {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
</style>
