<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    value = $bindable(),
    change,
    slotPosition = 'right',
    treeSwitch = false,
    minimize = false,
    size = 'medium',
    children = undefined,
  }: {
    value?: boolean
    change?: (e: Event) => void
    slotPosition?: 'left' | 'right'
    treeSwitch?: boolean
    minimize?: boolean
    size?: 'small' | 'medium' | 'large'
    children?: Snippet
  } = $props()

  const id = $props.id()
</script>

<div class="field {slotPosition}">
  <input
    id="checkbox-{id}"
    type="checkbox"
    class="switch is-rounded is-outlined {size}"
    class:tree-switch={treeSwitch}
    class:minimize
    bind:checked={value}
    onchange={change}
  />
  <label for="checkbox-{id}">
    <div class="slot-wrapper">
      {@render children?.()}
    </div>
  </label>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .field.left {
    .slot-wrapper {
      position: absolute;
      left: 15px;
      top: 30px;
    }
  }

  .switch[type='checkbox'] {
    outline: 0;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    display: inline-block;
    position: absolute;
    opacity: 0;
  }
  .switch[type='checkbox'] + label {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 1rem;
    height: 2.5em;
    line-height: 1.5;
    padding-left: 3.5rem;
    padding-top: 0.2rem;
    cursor: pointer;
  }
  .switch[type='checkbox'].is-rounded + label::before,
  .switch[type='checkbox'].is-rounded + label:before {
    border-radius: $rounded;
  }
  .switch[type='checkbox'] + label::before,
  .switch[type='checkbox'] + label:before {
    position: absolute;
    display: block;
    top: calc(50% - 1.5rem * 0.5);
    left: 0;
    width: 3rem;
    height: 1.5rem;
    border: 0.1rem solid transparent;
    border-radius: 4px;
    background: #b5b5b5;
    content: '';
  }
  .switch[type='checkbox'].is-outlined + label::before,
  .switch[type='checkbox'].is-outlined + label:before {
    background-color: transparent;
    border-color: #b5b5b5;
  }
  .switch[type='checkbox'].is-outlined + label::after,
  .switch[type='checkbox'].is-outlined + label:after {
    background: #b5b5b5;
  }
  .switch[type='checkbox'].is-rounded + label::after,
  .switch[type='checkbox'].is-rounded + label:after {
    border-radius: 50%;
  }
  .switch[type='checkbox']:checked + label::after {
    left: 1.625rem;
  }
  .switch[type='checkbox'] + label::after,
  .switch[type='checkbox'] + label:after {
    display: block;
    position: absolute;
    top: calc(50% - 1rem * 0.5);
    left: 0.25rem;
    width: 1rem;
    height: 1rem;
    transform: translate3d(0, 0, 0);
    border-radius: 4px;
    background: #fff;
    color: #b5b5b5;
    transition: all 0.25s ease-out;
    content: '';
  }

  .switch[type='checkbox'].is-outlined:checked + label::before,
  .switch[type='checkbox'].is-outlined:checked + label:before {
    border-color: $color-3;
  }
  .switch[type='checkbox'].is-outlined:checked + label::after,
  .switch[type='checkbox'].is-outlined:checked + label:after {
    background: $color-3;
  }

  /* special tree-switch */

  .switch[type='checkbox'].tree-switch + label::after,
  .switch[type='checkbox'].tree-switch + label:after,
  .switch[type='checkbox'].tree-switch.minimize + label::after,
  .switch[type='checkbox'].tree-switch.minimize + label:after {
    background: transparent;
    content: '\f802';
    font-family: 'Font Awesome 7 Free';
    top: 8px;
    left: 0.5rem;
  }
  .switch[type='checkbox'].tree-switch.minimize + label::after,
  .switch[type='checkbox'].tree-switch.minimize + label:after {
    content: '\f78c';
  }

  .switch[type='checkbox'].tree-switch:checked + label::after,
  .switch[type='checkbox'].tree-switch:checked + label:after {
    left: 1.4rem;
    background: transparent;
    color: $color-3;
  }

  /* special size */
  .switch[type='checkbox'].small + label {
    padding-left: 2.8rem;
  }
  .switch[type='checkbox'].small + label::before,
  .switch[type='checkbox'].small + label:before {
    width: 2.5rem;
  }
  .switch[type='checkbox'].small.tree-switch:checked + label::after,
  .switch[type='checkbox'].small.tree-switch:checked + label:after {
    left: 1rem;
  }
</style>
