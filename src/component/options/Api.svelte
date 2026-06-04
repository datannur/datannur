<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import { t } from '@i18n/messages'
  import type { ApiAvailability } from '@lib/api-availability'

  type AvailableApi = Extract<ApiAvailability, { available: true }>

  let { api }: { api: AvailableApi } = $props()
</script>

<div class="api-options">
  <section>
    <h5 class="title is-5">{t('api.title')}</h5>
    <p>{t('api.description')}</p>
  </section>

  <section class="api-links">
    <a class="button" href={api.docsUrl} target="_blank" rel="noreferrer">
      {t('api.documentation')}
      <Icon type="book" marginLeft={true} />
    </a>
    <a class="button" href={api.rawDocsUrl} target="_blank" rel="noreferrer">
      {t('api.rawApi')}
      <Icon type="database" marginLeft={true} />
    </a>
    <a
      class="button"
      href={api.restExampleUrl}
      target="_blank"
      rel="noreferrer"
    >
      {t('api.restExample')}
      <Icon type="code" marginLeft={true} />
    </a>
  </section>

  <section>
    <h5 class="title is-5">{t('api.noteTitle')}</h5>
    <ul>
      <li>{t('api.availableOnly')}</li>
      <li>{t('api.catalogStillUsable')}</li>
      <li>{t('api.directFileInactive')}</li>
    </ul>
  </section>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .api-options {
    padding: 3rem;
    max-width: 820px;
    margin: 0 auto;
  }

  section + section {
    margin-top: 2rem;
  }

  .title {
    text-align: left;
  }

  .api-links {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;

    .button {
      justify-content: center;
    }
  }

  ul {
    margin-left: 1.25rem;
  }

  @include viewport-small-mobile {
    .api-options {
      padding: 1rem;
    }
  }
</style>
