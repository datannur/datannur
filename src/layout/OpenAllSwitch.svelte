<script lang="ts">
  import Switch from '@layout/Switch.svelte'
  import Options from '@lib/options'

  let { onChange = () => {} }: { onChange: () => void } = $props()

  let openAllRecursive = $state(Options.get('openAllRecursive') as boolean)

  function updateOpenAllRecursive() {
    Options.set('openAllRecursive', openAllRecursive, () => onChange())
  }
</script>

<div
  class="open-all-wrapper use-tooltip"
  title="Afficher les éléments imbriqués"
>
  <Switch
    bind:value={openAllRecursive}
    change={updateOpenAllRecursive}
    slotPosition="left"
    treeSwitch={true}
    size="small"
  ></Switch>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .open-all-wrapper {
    position: absolute;
    top: 135px;
    right: 0px;
    z-index: 2;
  }

  @include viewport-small-mobile {
    .open-all-wrapper {
      top: 40px;
      left: 5px;
      right: auto;
    }
  }
</style>
