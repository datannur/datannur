<script lang="ts">
  import { t } from '@i18n/messages'
  import { setProxyCredentials } from '@llm/llm-config'

  let { onConfigured }: { onConfigured: () => void } = $props()

  let apiKey = $state('')
  let productId = $state('')
  let configError = $state('')
  let configSuccess = $state('')

  async function saveConfig() {
    if (!apiKey || !productId) return

    configError = ''
    configSuccess = ''

    const result = await setProxyCredentials(apiKey, productId)

    if (result.success) {
      configSuccess = result.message ?? t('llm.config.saved')
      apiKey = ''
      productId = ''
      onConfigured()
    } else {
      configError = result.error ?? t('llm.config.saveError')
    }
  }
</script>

<div class="config-form">
  <div class="config-header">
    <i class="fa-solid fa-key"></i>
    <h3>{t('llm.config.title')}</h3>
  </div>
  <p>
    {t('llm.config.intro')}
    <a
      href={t('llm.providerUrl')}
      target="_blank"
      rel="noopener noreferrer"
      class="config-link"
    >
      <i class="fa-solid fa-external-link"></i>
      {t('llm.config.getKeys')}
    </a>
  </p>
  <p class="config-note">
    <i class="fa-solid fa-info-circle"></i>
    {t('llm.config.note')}
  </p>

  {#if configError}
    <div class="config-message error">
      <i class="fa-solid fa-exclamation-triangle"></i>
      {configError}
    </div>
  {/if}

  {#if configSuccess}
    <div class="config-message success">
      <i class="fa-solid fa-check-circle"></i>
      {configSuccess}
    </div>
  {/if}

  <div class="input-group">
    <label>
      <span>{t('llm.config.apiKey')}</span>
      <input
        id="llm-api-key"
        name="apiKey"
        type="password"
        bind:value={apiKey}
        placeholder={t('llm.config.apiKeyPlaceholder')}
      />
    </label>

    <label>
      <span>{t('llm.config.productId')}</span>
      <input
        id="llm-product-id"
        name="productId"
        type="text"
        bind:value={productId}
        placeholder={t('llm.config.productIdPlaceholder')}
      />
    </label>
  </div>

  <button
    class="save-btn"
    onclick={saveConfig}
    disabled={!apiKey || !productId}
  >
    <i class="fa-solid fa-check"></i>
    {t('llm.config.save')}
  </button>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .config-form {
    flex: 1;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background: $background-1;

    .config-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;

      i {
        font-size: 1.5rem;
        color: $color-3;
      }

      h3 {
        margin: 0;
        color: $color-2;
        font-size: 1.2rem;
        font-weight: 600;
      }
    }

    p {
      margin: 0;
      color: $color-2;
      opacity: 0.8;
      font-size: 0.95rem;
      line-height: 1.5;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .config-link {
      color: $color-3;
      text-decoration: none;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      transition: all 0.2s;
      border: 1px solid transparent;

      &:hover {
        background: rgba($color-3, 0.1);
        border-color: rgba($color-3, 0.3);
      }

      i {
        font-size: 0.75rem;
      }
    }

    .config-note {
      padding: 0.75rem 1rem;
      background: rgba($color-3, 0.1);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;

      i {
        color: $color-3;
      }
    }

    .config-message {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;

      &.error {
        background: rgba(#e74c3c, 0.1);
        color: #e74c3c;
        border: 1px solid rgba(#e74c3c, 0.3);
      }

      &.success {
        background: rgba(#27ae60, 0.1);
        color: #27ae60;
        border: 1px solid rgba(#27ae60, 0.3);
      }

      i {
        font-size: 1rem;
      }
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      span {
        font-size: 0.9rem;
        font-weight: 600;
        color: $color-2;
      }

      input {
        padding: 0.85rem;
        border: 1px solid $color-5;
        border-radius: 8px;
        font-size: 0.95rem;
        background: $background-2;
        color: $color-1;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: $color-3;
          box-shadow: 0 0 0 3px rgba($color-3, 0.1);
        }

        &::placeholder {
          color: $color-4;
        }
      }
    }

    .save-btn {
      padding: 0.85rem 1.5rem;
      background: $color-3;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.95rem;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: opacity 0.2s;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        background: $color-4;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
  }
</style>
