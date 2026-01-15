import autoprefixer from 'autoprefixer'
import alias from '@rollup/plugin-alias'
import FullReload from 'vite-plugin-full-reload'
import { defineConfig } from 'vitest/config'
import { visualizer } from 'rollup-plugin-visualizer'
import { svelte, type Options } from '@sveltejs/vite-plugin-svelte'
import { initJsonjsdbBuilder } from 'jsonjsdb-builder'
import svelteConfig from './svelte.config.js'
import {
  bundleSchemas,
  updateRouterIndex,
  spaHtmlOptimizations,
  initBuildConfig,
  copyFilesToOutDir,
  copyPaths,
} from 'svelte-fileapp/vite'

const outDir = 'app'

const { appVersion, aliases } = await initBuildConfig()

await copyPaths([
  [
    'node_modules/mermaid/dist/mermaid.min.js',
    'public/assets/external/mermaid.min.js',
  ],
  [
    'node_modules/flexsearch/dist/flexsearch.bundle.min.js',
    'public/assets/external/flexsearch.js',
  ],
])

const builder = await initJsonjsdbBuilder(
  {
    dbPath: 'public/data/db',
    dbSourcePath: 'public/data/db-source',
    previewPath: 'public/data/dataset',
    mdPath: 'public/data/md',
    configPath: 'public/data/jsonjsdb-config.html',
  },
  { isDevelopment: process.env.NODE_ENV === 'development' },
)

export default defineConfig({
  base: '',
  server: { port: 8080, origin: '', open: true },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  test: { include: ['test/**/*.test.ts'], alias: aliases },
  css: {
    postcss: { plugins: [autoprefixer] },
    preprocessorOptions: { scss: { loadPaths: ['src'] } },
    devSourcemap: true,
  },
  build: {
    outDir,
    sourcemap: true,
    modulePreload: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      plugins: [
        process.env.BUNDLE_VIEW === 'true' &&
          visualizer({ open: true, filename: 'bundle-view.html' }),
      ],
    },
  },
  plugins: [
    bundleSchemas('public/schemas', 'src/assets/db-schema.json'),
    builder.getVitePlugins(FullReload),
    updateRouterIndex('src/page'),
    alias({ entries: aliases }),
    svelte(svelteConfig as Options),
    spaHtmlOptimizations(),
    copyFilesToOutDir(outDir, ['LICENSE', 'CHANGELOG.md', 'README.md']),
  ],
})
