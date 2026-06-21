<script lang="ts">
  import { onMount } from 'svelte'
  import Title from '@layout/Title.svelte'
  import Icon from '@layout/Icon.svelte'
  import { currentLocale } from '@i18n/i18n'
  import { t } from '@i18n/messages'
  import {
    loadIsoExport,
    loadSemanticValidation,
    loadStacExport,
    semanticBasePath,
    type IsoExport,
    type LocalizedCount,
    type SemanticValidation,
    type StacExport,
    type ValidationResult,
    type ValidationStatus,
  } from '@lib/semantic-export'
  import type { TranslationKey } from '@i18n/types'

  const statusKeys: { [status in ValidationStatus]: TranslationKey } = {
    conforms: 'page.dcat.status.conforms',
    warnings: 'page.dcat.status.warnings',
    errors: 'page.dcat.status.errors',
    notValidated: 'page.dcat.status.notValidated',
  }
  const fileLabels: { [label: string]: string } = {
    ttl: 'Turtle',
    jsonld: 'JSON-LD',
    rdf: 'RDF/XML',
  }

  let report = $state<SemanticValidation | null>(null)
  let stac = $state<StacExport | null>(null)
  let iso = $state<IsoExport | null>(null)
  let loading = $state(true)
  let unavailable = $state(false)
  const dateLocale = $derived($currentLocale === 'fr' ? 'fr-CH' : 'en')

  const topWarnings = $derived(report?.validation.results.slice(0, 8) ?? [])
  const generatedAt = $derived(
    report?.generatedAt ?? stac?.generatedAt ?? iso?.generatedAt ?? '',
  )
  const formattedGeneratedAt = $derived(
    generatedAt ? formatTimestamp(generatedAt) : '',
  )
  const generatedFiles = $derived(
    Object.entries(report?.files ?? {}).filter(([label]) => label !== 'report'),
  )

  function getFileUrl(filename: string) {
    return semanticBasePath + filename
  }

  function formatTimestamp(value: string) {
    if (!value) return ''
    return new Intl.DateTimeFormat(dateLocale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  function getProfileGeneratedText() {
    return t('page.dcat.profileGenerated', {
      profile: report?.profile ?? '',
      date: formattedGeneratedAt,
    })
  }

  function getTopEntries(values: { [label: string]: number }, limit = 6) {
    return Object.entries(values).slice(0, limit)
  }

  function getTopLocalizedEntries(
    items: LocalizedCount[] | undefined,
    values: { [label: string]: number },
    limit = 6,
  ) {
    return (
      items?.slice(0, limit) ??
      getTopEntries(values, limit).map(([label, count]) => ({ label, count }))
    )
  }

  function getLocalizedCountLabel(item: LocalizedCount) {
    return item.labels?.[$currentLocale] ?? item.label
  }

  function getWarningLabel(warning: ValidationResult) {
    return warning.entityLabels?.[$currentLocale] ?? warning.entityLabel
  }

  function printReport() {
    window.print()
  }

  onMount(async () => {
    const [dcat, stacData, isoData] = await Promise.all([
      loadSemanticValidation(),
      loadStacExport(),
      loadIsoExport(),
    ])
    report = dcat
    stac = stacData
    iso = isoData
    if (!report && !stac && !iso) {
      unavailable = true
    }
    loading = false
  })
</script>

<section class="section dcat-page">
  <Title type="dcat" name={t('page.dcat.title')} mode="mainTitle" />

  {#if loading}
    <div class="notice">{t('page.dcat.loading')}</div>
  {:else if unavailable}
    <div class="notice warning">
      {t('page.dcat.unavailable')}
    </div>
  {:else}
    <div class="action-row app-only">
      <button class="primary-action" type="button" onclick={printReport}>
        <Icon type="print" />
        {t('page.dcat.exportPdf')}
      </button>
      <span>{t('page.dcat.lastGenerated')} {formattedGeneratedAt}</span>
    </div>

    <div class="report-export-area">
      <div class="print-heading">
        <h1>{t('page.dcat.reportTitle')}</h1>
        {#if report}
          <p>{getProfileGeneratedText()}</p>
        {/if}
      </div>

      {#if report}
        <h2 class="section-heading">{t('page.dcat.dcatSection')}</h2>
        <div class="summary-strip">
        <div>
          <span>{t('page.dcat.profile')}</span>
          <strong>{report.profile}</strong>
        </div>
        <div>
          <span>{t('page.dcat.validation')}</span>
          <strong class="status {report.validation.status}">
            {t(statusKeys[report.validation.status])}
          </strong>
        </div>
        <div>
          <span>{t('page.dcat.datasets')}</span>
          <strong>{report.counts.datasets}</strong>
        </div>
        <div>
          <span>{t('page.dcat.distributions')}</span>
          <strong>{report.counts.distributions}</strong>
        </div>
        <div>
          <span>{t('page.dcat.publishers')}</span>
          <strong>{report.counts.publishers}</strong>
        </div>
      </div>

      <div class="layout-grid">
        <section class="panel files-panel">
          <h2>{t('page.dcat.generatedFiles')}</h2>
          <div class="file-list">
            {#each generatedFiles as [label, filename] (label)}
              <a href={getFileUrl(filename)} target="_blank" rel="noreferrer">
                <span>{fileLabels[label] ?? label}</span>
                <small>{filename}</small>
              </a>
            {/each}
          </div>
        </section>

        <section class="panel">
          <h2>{t('page.dcat.requiredFieldsCoverage')}</h2>
          <table>
            <tbody>
              {#each Object.values(report.coverage) as item (item.label)}
                <tr>
                  <td>{item.label}</td>
                  <td>{item.count} / {item.total}</td>
                  <td>{item.percent}%</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </section>

        <section class="panel wide">
          <h2>{t('page.dcat.priorityWarnings')}</h2>
          <table>
            <thead>
              <tr>
                <th>{t('page.dcat.dataset')}</th>
                <th>{t('page.dcat.field')}</th>
                <th>{t('page.dcat.check')}</th>
              </tr>
            </thead>
            <tbody>
              {#each topWarnings as warning (`${warning.entityId}-${warning.code}-${warning.field}`)}
                <tr>
                  <td>{getWarningLabel(warning)}</td>
                  <td>{warning.field}</td>
                  <td>{warning.message}</td>
                </tr>
              {:else}
                <tr><td colspan="3">{t('page.dcat.noWarnings')}</td></tr>
              {/each}
            </tbody>
          </table>
        </section>

        <section class="panel">
          <h2>{t('page.dcat.formats')}</h2>
          <ul class="frequency-list">
            {#each getTopEntries(report.counts.formats) as [label, count] (label)}
              <li><span>{label}</span><strong>{count}</strong></li>
            {/each}
          </ul>
        </section>

        <section class="panel">
          <h2>{t('page.dcat.licenses')}</h2>
          <ul class="frequency-list">
            {#each getTopEntries(report.counts.licenses) as [label, count] (label)}
              <li><span>{label}</span><strong>{count}</strong></li>
            {/each}
          </ul>
        </section>

        <section class="panel wide">
          <h2>{t('page.dcat.mainThemes')}</h2>
          <ul class="theme-list">
            {#each getTopLocalizedEntries(report.counts.themeItems, report.counts.themes, 12) as item (item.label)}
              <li>
                <span>{getLocalizedCountLabel(item)}</span>
                <strong>{item.count}</strong>
              </li>
            {/each}
          </ul>
        </section>
        </div>
      {/if}

      {#if stac || iso}
        <h2 class="section-heading">{t('page.dcat.geoExports')}</h2>
        <div class="layout-grid">
          {#if stac}
            <section class="panel">
              <h2>{t('page.dcat.stacSection')}</h2>
              <ul class="frequency-list">
                <li>
                  <span>{t('page.dcat.items')}</span>
                  <strong>{stac.itemCount}</strong>
                </li>
                <li>
                  <span>{t('page.dcat.validation')}</span>
                  <strong class="status {stac.valid ? 'conforms' : 'errors'}">
                    {stac.valid ? t('page.dcat.valid') : t('page.dcat.invalid')}
                  </strong>
                </li>
              </ul>
              <div class="file-list">
                <a
                  href={getFileUrl(stac.files.catalog)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{t('page.dcat.openCatalog')}</span>
                  <small>{stac.files.catalog}</small>
                </a>
              </div>
              <p class="note">{t('page.dcat.stacNote')}</p>
            </section>
          {/if}

          {#if iso}
            <section class="panel">
              <h2>{t('page.dcat.isoSection')}</h2>
              <ul class="frequency-list">
                <li>
                  <span>{t('page.dcat.records')}</span>
                  <strong>{iso.recordCount}</strong>
                </li>
                <li>
                  <span>{t('page.dcat.profile')}</span>
                  <strong>{iso.profile}</strong>
                </li>
              </ul>
              <div class="file-list">
                {#each iso.records as record (record.id)}
                  <a
                    href={getFileUrl(record.file)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{record.id}</span>
                    <small>{record.file}</small>
                  </a>
                {/each}
              </div>
              <p class="note">{t('page.dcat.isoNote')}</p>
            </section>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</section>

<style lang="scss">
  @use 'main.scss' as *;

  .dcat-page {
    color: $color-1;
  }

  .notice {
    border: 1px solid $color-5;
    border-radius: 6px;
    padding: 1rem;
    background: $background-2;
    &.warning {
      border-color: #d8973c;
    }
  }

  .summary-strip,
  .panel,
  .action-row {
    border: 1px solid $color-5;
    background: $background-2;
  }

  .summary-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
    gap: 1px;
    border-radius: 6px;
    overflow: hidden;
    & > div {
      padding: 0.85rem 1rem;
      background: $background-1;
    }
    span {
      display: block;
      font-size: 0.78rem;
      text-transform: uppercase;
      color: $color-2;
    }
    strong {
      display: block;
      margin-top: 0.2rem;
      font-size: 1.15rem;
    }
  }

  .status {
    &.conforms {
      color: #167a45;
    }
    &.warnings,
    &.notValidated {
      color: #9a5b00;
    }
    &.errors {
      color: #b42318;
    }
  }

  .action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 6px;
    color: $color-2;
  }

  .primary-action {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid $color-3;
    border-radius: 4px;
    padding: 0.55rem 0.8rem;
    color: $color-3;
    background: transparent;
    font-weight: 700;
    font: inherit;
    text-decoration: none;
    cursor: pointer;
  }

  .print-heading {
    display: none;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .section-heading {
    margin: 1.5rem 0 0;
    font-size: 1.15rem;
    color: $color-1;
  }

  .panel {
    border-radius: 6px;
    padding: 1rem;
    min-width: 0;
    &.wide {
      grid-column: 1 / -1;
    }
    h2 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      color: $color-1;
    }
    .note {
      margin: 0.75rem 0 0;
      font-size: 0.82rem;
      color: $color-2;
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    th,
    td {
      border-bottom: 1px solid $color-5;
      padding: 0.5rem 0.35rem;
      text-align: left;
      vertical-align: top;
    }
    th {
      color: $color-2;
      font-weight: 700;
    }
  }

  .file-list {
    display: grid;
    gap: 0.5rem;
    a {
      display: flex;
      justify-content: space-between;
      gap: 0.8rem;
      border: 1px solid $color-5;
      border-radius: 4px;
      padding: 0.65rem 0.75rem;
      background: $background-1;
      color: $color-1;
      text-decoration: none;
    }
    small {
      color: $color-2;
    }
  }

  .frequency-list,
  .theme-list {
    list-style: none;
    margin: 0;
    padding: 0;
    li {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      border-bottom: 1px solid $color-5;
      padding: 0.45rem 0;
    }
    span {
      min-width: 0;
      overflow-wrap: anywhere;
    }
  }

  .theme-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0 1.25rem;
  }

  @include viewport-mobile {
    .layout-grid {
      grid-template-columns: 1fr;
    }
    .action-row {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media print {
    @page {
      margin: 18mm;
    }

    :global(header),
    :global(footer),
    :global(nav),
    :global(.navbar),
    :global(.breadcrumb),
    :global(.app-only) {
      display: none !important;
    }

    :global(html),
    :global(body) {
      background: #fff !important;
      border: 0 !important;
      box-shadow: none !important;
      height: auto !important;
      margin: 0 !important;
      overflow: visible !important;
      padding: 0 !important;
      width: auto !important;
    }

    :global(#app),
    :global(#wrapper),
    :global(.main-container) {
      border: 0 !important;
      box-shadow: none !important;
      display: block !important;
      height: auto !important;
      margin: 0 !important;
      min-height: 0 !important;
      overflow: visible !important;
      padding: 0 !important;
      width: auto !important;
    }

    :global(.main-container) {
      max-width: none !important;
      min-height: 0 !important;
      padding-top: 0 !important;
    }

    :global(*) {
      scrollbar-width: none !important;
    }

    :global(*::-webkit-scrollbar) {
      display: none !important;
      height: 0 !important;
      width: 0 !important;
    }

    :global(body *) {
      visibility: hidden !important;
    }

    .report-export-area,
    .report-export-area :global(*) {
      visibility: visible !important;
    }

    .dcat-page {
      border: 0;
      box-shadow: none;
      color: #111;
      margin: 0;
      overflow: visible;
      padding: 0;
    }

    .report-export-area {
      border: 0;
      box-shadow: none;
      left: 0;
      margin: 0;
      max-width: none;
      overflow: visible;
      padding: 0;
      position: absolute;
      top: 0;
      width: auto;
    }

    .dcat-page :global(.title) {
      display: none !important;
    }

    .print-heading {
      display: block;
      margin-bottom: 1rem;

      h1 {
        margin: 0 0 0.25rem;
        font-size: 1.6rem;
      }

      p {
        margin: 0;
        color: #555;
      }
    }

    .summary-strip,
    .panel {
      border-color: #ccc;
      background: #fff;
      break-inside: avoid;
    }

    .summary-strip {
      overflow: visible;

      & > div {
        background: #fff;
      }
    }

    .layout-grid {
      grid-template-columns: 1fr;
    }

    .file-list a,
    .frequency-list li,
    .theme-list li,
    table th,
    table td {
      border-color: #ddd;
    }

    a {
      color: #111;
      text-decoration: none;
    }
  }
</style>
