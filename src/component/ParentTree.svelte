<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import Link from '@layout/Link.svelte'
  import type { RecursiveEntityName } from '@type'

  let {
    type: typeProp,
    elemId: elemIdProp,
    isSelf: isSelfProp = false,
  }: {
    type: RecursiveEntityName
    elemId: string | number
    isSelf?: boolean
  } = $props()

  const type = untrack(() => typeProp)
  const elemId = untrack(() => elemIdProp)
  const isSelf = untrack(() => isSelfProp)

  const elems = db.getParents(type, elemId)

  if (!isSelf) {
    const current = db.get(type, elemId)
    if (current) elems.push(current)
  }

  elems.reverse()
</script>

{#if elems && elems.length > 0}
  <div class="tree">
    {#each elems as elem, i (elem.id)}
      <Link href="{type}/{elem.id}" entity={type}>
        <div class="indented-text" style="padding-left: {i * 7}px;">
          {elem.name}
        </div>
      </Link>
    {/each}
  </div>
{/if}