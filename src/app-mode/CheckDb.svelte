<script lang="ts">
  import db from '@db'

  type IntegrityResult = Awaited<ReturnType<typeof db.checkIntegrity>>
  type IssueSection = {
    key: keyof IntegrityResult
    title: string
    description: string
    count: number
    entries: [string, unknown][]
  }
  type DisplayField = {
    name: string
    values: string[]
  }

  const labels: {
    [key in keyof IntegrityResult]: { title: string; description: string }
  } = {
    emptyId: {
      title: 'Identifiants vides',
      description: 'Des lignes existent sans identifiant utilisable.',
    },
    duplicateId: {
      title: 'Identifiants dupliqués',
      description: 'Un même identifiant est utilisé plusieurs fois.',
    },
    parentIdNotFound: {
      title: 'Parents introuvables',
      description: 'Des lignes référencent un parent absent de la base.',
    },
    parentIdSame: {
      title: 'Parents circulaires',
      description: 'Des lignes se référencent elles-mêmes comme parent.',
    },
    foreignIdNotFound: {
      title: 'Références introuvables',
      description: 'Des clés étrangères pointent vers des éléments absents.',
    },
  }

  let result = $state<IntegrityResult | null>(null)
  let loading = $state(true)

  const issueSections = $derived.by(() => {
    const integrityResult = result
    if (!integrityResult) return []

    return Object.entries(labels)
      .map(([key, label]) => {
        const typedKey = key as keyof IntegrityResult
        const value = integrityResult[typedKey]
        const entries = Array.isArray(value)
          ? value.map(
              (item, index) => [String(index + 1), item] as [string, unknown],
            )
          : Object.entries(value as Record<string, unknown>)
        return {
          key: typedKey,
          title: label.title,
          description: label.description,
          count: entries.length,
          entries,
        } satisfies IssueSection
      })
      .filter(section => section.count > 0)
  })
  const hasIssues = $derived(issueSections.length > 0)

  function formatFieldValue(value: unknown) {
    if (value === null) return 'null'
    if (value === undefined) return ''
    return String(value)
  }

  function getDisplayFields(value: unknown): DisplayField[] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [{ name: 'Valeur', values: [formatFieldValue(value)] }]
    }

    return Object.entries(value).map(([name, fieldValue]) => ({
      name,
      values: Array.isArray(fieldValue)
        ? fieldValue.map(formatFieldValue)
        : [formatFieldValue(fieldValue)],
    }))
  }

  db.checkIntegrity().then(res => {
    result = res
    loading = false
  })
</script>

<section class="section check-db-page">
  <h1 class="title">Vérification d'intégrité</h1>

  {#if loading}
    <div class="status-card neutral">Analyse de la base en cours...</div>
  {:else if !hasIssues}
    <div class="status-card ok">
      <strong>Tout est en ordre.</strong>
      <span
        >Aucune anomalie d'identifiant, de parent ou de référence n'a été
        détectée.</span
      >
    </div>
  {:else}
    <div class="status-card error">
      <strong
        >{issueSections.length} type{issueSections.length > 1 ? 's' : ''} d'anomalie
        détecté{issueSections.length > 1 ? 's' : ''}.</strong
      >
      <span
        >Les éléments ci-dessous doivent être corrigés dans les données sources.</span
      >
    </div>

    <div class="issue-list">
      {#each issueSections as section (section.key)}
        <section class="issue-section">
          <header>
            <div>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>
            <strong>{section.count}</strong>
          </header>
          <div class="issue-entries">
            {#each section.entries as [key, value] (`${section.key}-${key}`)}
              <article>
                <span>{key}</span>
                <div class="issue-fields">
                  {#each getDisplayFields(value) as field (field.name)}
                    <div class="issue-field">
                      <strong>{field.name}</strong>
                      <div>
                        {#each field.values as fieldValue, index (`${field.name}-${index}-${fieldValue}`)}
                          <code>{fieldValue}</code>
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              </article>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {/if}
</section>

<style lang="scss">
  @use 'main.scss' as *;

  .check-db-page {
    color: $color-1;
    min-height: 100vh;
    width: 100%;
    margin: 0 auto;
    padding: 4rem 2rem 2.5rem;
    background: $background-2;
  }

  .title {
    color: $color-3;
    font-size: 1.45rem;
    margin-bottom: 1rem;
    margin-top: 50px;
  }

  .status-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    border: 1px solid $color-5;
    border-radius: $rounded;
    padding: 1rem;
    background: $background-2;

    &.ok {
      border-color: #167a45;
      color: #167a45;
    }

    &.error {
      border-color: #b42318;
      color: #b42318;
    }

    &.neutral {
      color: $color-2;
    }
  }

  .issue-list {
    display: grid;
    gap: 1rem;
    margin-top: 1rem;
  }

  .issue-section {
    border: 1px solid $color-5;
    border-radius: $rounded;
    overflow: hidden;
    background: $background-2;

    header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid $color-5;

      h2 {
        margin: 0;
        font-size: 1rem;
        color: #b42318;
      }

      p {
        margin: 0.2rem 0 0;
        color: $color-2;
      }

      strong {
        color: #b42318;
      }
    }
  }

  .issue-entries {
    display: grid;
    gap: 1px;
    background: $color-5;

    article {
      display: grid;
      grid-template-columns: minmax(120px, 220px) 1fr;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: $background-2;

      span {
        font-weight: 700;
        color: $color-2;
      }

      .issue-fields {
        display: grid;
        gap: 0.4rem;
      }

      .issue-field {
        display: grid;
        grid-template-columns: minmax(90px, 140px) 1fr;
        gap: 0.75rem;
        align-items: start;

        strong {
          color: $color-2;
          font-weight: 600;
        }

        div {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        code {
          border: 1px solid $color-5;
          border-radius: $rounded;
          padding: 0.1rem 0.35rem;
          background: $background-1;
          color: $color-1;
          font-family: inherit;
          font-size: 0.9rem;
        }
      }
    }
  }

  @include viewport-small-mobile {
    .check-db-page {
      padding: 3rem 1rem 1.5rem;
    }

    .issue-entries article {
      grid-template-columns: 1fr;
    }

    .issue-field {
      grid-template-columns: 1fr;
    }
  }
</style>
