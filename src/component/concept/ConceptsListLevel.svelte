<script lang="ts">
  import { untrack } from 'svelte'
  import ConceptsListLevel from '@component/concept/ConceptsListLevel.svelte'
  import Link from '@layout/Link.svelte'
  import type { ConceptWithChildren } from '@type'

  let {
    concept: conceptProp,
  }: {
    concept:
      | ConceptWithChildren
      | { children?: { [key: string]: ConceptWithChildren } }
  } = $props()

  const concept = untrack(() => conceptProp)

  const conceptChildrenData: ConceptWithChildren[] = Object.values(
    concept.children || {},
  )

  conceptChildrenData.sort((a, b) => {
    const aHasChildren = a.children && Object.keys(a.children).length > 0
    const bHasChildren = b.children && Object.keys(b.children).length > 0
    if (aHasChildren && !bHasChildren) return -1
    if (!aHasChildren && bHasChildren) return 1
    return (a.name ?? '').localeCompare(b.name ?? '')
  })

  const isConcept = 'id' in concept && 'name' in concept

  const typedConcept = isConcept ? (concept as ConceptWithChildren) : null
</script>

<div class="main-concept-list-wrapper">
  {#if isConcept && typedConcept}
    <span>
      <Link href="concept/{typedConcept.id}" entity="concept"
        >{typedConcept.name}</Link
      >
    </span>
  {/if}
  {#if conceptChildrenData && conceptChildrenData.length > 0}
    <div class="concepts-list-level-wrapper" class:with-indent={isConcept}>
      {#each conceptChildrenData as childConcept (childConcept.id)}
        {#if childConcept.children && Object.values(childConcept.children).length > 0}
          <div class="concept-list-level-wrapper">
            <ConceptsListLevel concept={childConcept} />
          </div>
        {:else}
          <span class="concept-last-level"
            ><ConceptsListLevel concept={childConcept} /></span
          >
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .concept-list-level-wrapper {
    background: #{color('concept')}22;
    border-radius: 20px;
    padding: 5px 15px;
    margin: 2.5px;
    font-weight: bold;
  }
  .main-concept-list-wrapper {
    display: flex;
    flex-direction: column;
  }

  .concepts-list-level-wrapper {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .concept-last-level {
    font-weight: normal;
    font-style: italic;
    padding-right: 20px;
    &:last-child {
      padding-right: 0;
    }
  }
</style>
