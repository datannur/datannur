<script lang="ts">
  import Options from '@lib/options'
  import { setLanguageOption, translate } from '@i18n/i18n'
  import { isLanguageOption } from '@i18n/locale'
  import type { LanguageOption } from '@i18n/types'

  let { label = '' }: { label?: string } = $props()

  const savedLanguage = Options.get('language')
  let language = $state<LanguageOption>(
    isLanguageOption(savedLanguage) ? savedLanguage : 'auto',
  )
  let languageLabel = $derived(language.toUpperCase())

  function updateLanguage(value: LanguageOption) {
    language = value
    setLanguageOption(language)
  }

  function updateLanguageFromSelect(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value
    if (isLanguageOption(value)) updateLanguage(value)
  }
</script>

<div class="language-option">
  <div class="language-select-wrap">
    <span class="language-select-value">
      {#if language === 'auto'}
        <i class="fas fa-globe" title={$translate('language.auto')}></i>
      {:else}
        {languageLabel}
      {/if}
    </span>
    <select
      aria-label={$translate('language.label')}
      bind:value={language}
      onchange={updateLanguageFromSelect}
    >
      <option value="auto">Auto</option>
      <option value="en">EN</option>
      <option value="fr">FR</option>
    </select>
  </div>
  {#if label}
    <span>{label}</span>
  {/if}
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .language-option {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 2.5em;
  }

  .language-select-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 3rem;
    height: 1.5rem;
    border: 0.1rem solid currentColor;
    border-radius: $rounded;
    color: inherit;
    background: transparent;
    opacity: 0.75;
    transition: opacity 0.15s ease;

    &:hover {
      opacity: 1;
    }

    &::after {
      position: absolute;
      right: 0.28rem;
      top: 50%;
      width: 0;
      height: 0;
      border-left: 0.16rem solid transparent;
      border-right: 0.16rem solid transparent;
      border-top: 0.22rem solid currentColor;
      content: '';
      transform: translateY(-35%);
      pointer-events: none;
    }
  }

  .language-select-value {
    min-width: 2rem;
    padding-left: 0.5rem;
    padding-right: 0.85rem;
    font-size: 0.95rem;
    line-height: 1;
    text-align: center;
    pointer-events: none;
  }

  .language-select-wrap select {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    background: transparent;
    border: 0;
    appearance: none;
    cursor: pointer;
    outline: 0;
  }
</style>
