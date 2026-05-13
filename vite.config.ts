import autoprefixer from 'autoprefixer'
import { defineConfig } from 'vitest/config'
import { visualizer } from 'rollup-plugin-visualizer'
import { svelte, type Options } from '@sveltejs/vite-plugin-svelte'
import svelteConfig from './svelte.config.js'
import {
  bundleSchemas,
  copyFilesToOutDir,
  copyPaths,
  injectJsonjsdbConfig,
  initBuildConfig,
  spaHtmlOptimizations,
  updateRouterIndex,
} from './node-scripts/vite-helpers.ts'

const outDir = 'app'
const appName = 'datannur-app-v2'
const dbName = process.env.DB ?? 'db'

const { appVersion, aliases } = await initBuildConfig()

await copyPaths([
  [
    'node_modules/@mermaid-js/tiny/dist/mermaid.tiny.js',
    'public/assets/external/mermaid.tiny.js',
  ],
  [
    'node_modules/flexsearch/dist/flexsearch.bundle.min.js',
    'public/assets/external/flexsearch.js',
  ],
])

export default defineConfig({
  base: '',
  server: { port: 8080, origin: '', open: true },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  resolve: { alias: aliases },
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
    updateRouterIndex('src/page'),
    svelte(svelteConfig as Options),
    spaHtmlOptimizations(),
    copyFilesToOutDir(outDir, ['LICENSE', 'CHANGELOG.md', 'README.md']),
    injectJsonjsdbConfig(appName, dbName),
  ],
})
