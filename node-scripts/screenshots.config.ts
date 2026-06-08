import type { ScreenshotSuiteConfig } from './capture-screenshots.ts'

const config: ScreenshotSuiteConfig = {
  baseUrl: 'https://suisse.datannur.com/',
  outDir: 'tmp/about-page-screenshots',
  browserChannel: 'chrome',
  format: 'jpeg',
  quality: 60,
  locales: ['fr', 'en'],
  timeoutMs: 10000,
  viewports: {
    desktop: { width: 1600, height: 900, deviceScaleFactor: 2 },
    mobile: { width: 390, height: 700, deviceScaleFactor: 2 },
  },
  seed: {
    appName: 'datannur-app-suisse',
    favorites: [
      { entity: 'dataset', entityId: '006843da-cc2f-4660-a8f1-1d14cb8e7795' },
      { entity: 'dataset', entityId: '00c0ac2f-9aca-42cf-9629-12982495d53a' },
      { entity: 'folder', entityId: 'heal' },
      { entity: 'folder', entityId: 'soci' },
      { entity: 'folder', entityId: '8039d848-78ec-4b59-8197-7f027e653eee' },
      { entity: 'folder', entityId: 'e5f270e9-5c61-4404-bb5e-6b5680ed8fc0' },
      { entity: 'folder', entityId: '0f1001e1-5231-44c4-bcdb-dcf3727d6ae9' },
      { entity: 'tag', entityId: 'thematique---heal' },
      {
        entity: 'variable',
        entityId: '006843da-cc2f-4660-a8f1-1d14cb8e7795---total',
      },
    ],
    searchHistory: [
      { entity: 'dataset', entityId: '006843da-cc2f-4660-a8f1-1d14cb8e7795' },
      { entity: 'folder', entityId: 'heal' },
      { entity: 'tag', entityId: 'thematique---heal' },
      { entity: 'dataset', entityId: '00c0ac2f-9aca-42cf-9629-12982495d53a' },
      {
        entity: 'variable',
        entityId: '00c0ac2f-9aca-42cf-9629-12982495d53a---geo_name',
      },
      { entity: 'dataset', entityId: '4f8792b5-ceb1-4771-bd53-c0b878167fa6' },
      { entity: 'tag', entityId: 'sante-animale' },
    ],
    logs: [
      {
        action: 'searchBar',
        entity: 'dataset',
        entityId: '006843da-cc2f-4660-a8f1-1d14cb8e7795',
      },
      {
        action: 'addFav',
        entity: 'dataset',
        entityId: '006843da-cc2f-4660-a8f1-1d14cb8e7795',
      },
      { action: 'searchBar', entity: 'tag', entityId: 'thematique---heal' },
      { action: 'addFav', entity: 'folder', entityId: 'heal' },
    ],
  },
  pages: [
    {
      name: 'search-bar-open',
      path: 'organization/autres',
      viewport: 'desktop',
      actions: [{ type: 'search', value: 'santé' }],
    },
    {
      name: 'about-page-diagramm',
      path: 'about?tab=aboutStructure',
      viewport: 'desktop',
      actions: ['scrollBottom'],
    },
    {
      name: 'dataset-preview',
      path: 'dataset/5f020c98-284c-4857-ba1d-8c56e974e147?tab=datasetPreview',
      viewport: 'desktop',
    },
    {
      name: 'dataset-mobile',
      path: 'dataset/142af638-f9d8-450f-b01e-e206470a2ebe',
      viewport: 'mobile',
    },
    {
      name: 'doc-pdf',
      path: 'doc/doc---pdf---e75a5ef0ad5a7baa',
      viewport: 'desktop',
      actions: [{ type: 'wait', ms: 3000 }],
    },
    {
      name: 'folder-about-tab',
      path: 'folder/2be419d8-0dc5-4881-8e93-963d5a5cc772',
      viewport: 'desktop',
    },
    {
      name: 'folder-page-folder-tab',
      path: 'folder/gove?tab=folders',
      viewport: 'desktop',
    },
    {
      name: 'enumeration-compare',
      path: 'enumerations?tab=enumerationsCompare&tab_compare_11=58',
      viewport: 'desktop',
      waitFor:
        '.datatable-main-wrapper:not(.dt-loading) .datatables-outer.visible table._datatables.dataTable tbody tr',
    },
    {
      name: 'favorite-page',
      path: 'favorite',
      viewport: 'desktop',
    },
    {
      name: 'search-page',
      path: 'search?search=sant%C3%A9',
      viewport: 'desktop',
    },
    {
      name: 'organization-page-folder-tab-mobile',
      path: 'organization/ssd?tab=folders&tab_folder_2=na',
      viewport: 'mobile',
    },
    {
      name: 'options',
      path: 'options',
      viewport: 'desktop',
    },
    {
      name: 'stat-tab',
      path: '?tab=stat',
      viewport: 'desktop',
    },
  ],
}

export default config
