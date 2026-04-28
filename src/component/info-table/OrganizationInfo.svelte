<script lang="ts">
  import { entityNames } from '@lib/constant'
  import Icon from '@layout/Icon.svelte'
  import Breadcrumb from '@component/Breadcrumb.svelte'
  import ExtendableText from '@layout/ExtendableText.svelte'

  let {
    organizationId,
    type = 'organization',
    isSelf = false,
  }: {
    organizationId: string | number | undefined
    type?: 'organization' | 'owner' | 'manager'
    isSelf?: boolean
  } = $props()

  const name = $derived(isSelf ? 'Partie de' : entityNames[type])
  const icon = $derived(isSelf ? 'folderTreeOrganization' : 'organization')
</script>

{#if organizationId}
  <tr>
    <td><Icon type={icon} /> {name}</td>
    <td>
      <ExtendableText>
        <Breadcrumb type="organization" elemId={organizationId} {isSelf} />
      </ExtendableText>
    </td>
  </tr>
{/if}
