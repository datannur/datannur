import autoprefixer from 'autoprefixer'
import alias from '@rollup/plugin-alias'
import { defineConfig } from 'vitest/config'
import { visualizer } from 'rollup-plugin-visualizer'
import { svelte, type Options } from '@sveltejs/vite-plugin-svelte'
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
    alias({ entries: aliases }),
    svelte(svelteConfig as Options),
    spaHtmlOptimizations(),
    copyFilesToOutDir(outDir, ['LICENSE', 'CHANGELOG.md', 'README.md']),
    {
      name: 'inject-jsonjsdb-config',
      transformIndexHtml(html) {
        const config = `<div id="jsonjsdb-config" style="display:none" data-app-name="datannur-app-v2" data-path="data/${dbName}"></div>`
        return html.replace('</body>', `${config}</body>`)
      },
    },
  ],
})
