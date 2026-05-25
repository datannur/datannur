<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import type { ApiAvailability } from '@lib/api-availability'

  type AvailableApi = Extract<ApiAvailability, { available: true }>

  let { api }: { api: AvailableApi } = $props()
</script>

<div class="api-options">
  <section>
    <h5 class="title is-5">API disponibles</h5>
    <p>
      Ce catalogue expose ses métadonnées via une API en lecture seule. Elle
      permet de réutiliser les informations du catalogue dans d’autres outils,
      scripts ou portails de données.
    </p>
  </section>

  <section class="api-links">
    <a class="button" href={api.docsUrl} target="_blank" rel="noreferrer">
      Documentation <Icon type="book" marginLeft={true} />
    </a>
    <a class="button" href={api.rawDocsUrl} target="_blank" rel="noreferrer">
      Raw API <Icon type="database" marginLeft={true} />
    </a>
    <a
      class="button"
      href={api.restExampleUrl}
      target="_blank"
      rel="noreferrer"
    >
      Exemple REST <Icon type="code" marginLeft={true} />
    </a>
  </section>

  <section>
    <h5 class="title is-5">À savoir</h5>
    <ul>
      <li>L’API apparaît ici uniquement quand elle est disponible.</li>
      <li>Le catalogue reste utilisable même sans API.</li>
      <li>En ouverture directe du fichier, l’API n’est pas active.</li>
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
