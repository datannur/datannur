import autoprefixer from 'autoprefixer'
import { defineConfig } from 'vitest/config'
import { visualizer } from 'rollup-plugin-visualizer'
import { svelte, type Options } from '@sveltejs/vite-plugin-svelte'
import svelteConfig from './svelte.config.js'
import {
  bundleSchemas,
  devServerBaseHref,
  injectJsonjsdbConfig,
  initBuildConfig,
  packageDistAfterBuild,
  servePublicPaths,
  spaHtmlOptimizations,
  updateRouterIndex,
} from './node-scripts/vite-helpers.ts'

const outDir = 'dist'
const packageDir = 'package'
const packageAppDir = `${packageDir}/app`
const appName = 'datannur-app-v2'
const dbName = process.env.DB ?? 'db'
const dbPath = `data/${dbName}`
const sourcemap = process.env.SOURCE_MAP === 'true'

const { appVersion, aliases } = await initBuildConfig()

export default defineConfig({
  base: '',
  publicDir: false,
  server: { port: 8080, origin: '', open: '/' },
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
    assetsDir: 'app/assets',
    sourcemap,
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
    bundleSchemas(`${packageAppDir}/schemas`, 'src/assets/db-schema.json'),
    updateRouterIndex('src/page'),
    servePublicPaths([
      [`/app/assets`, `${packageAppDir}/assets`],
      [`/data`, `${packageDir}/data`],
      [`/app/manifest.json`, `${packageAppDir}/manifest.json`],
    ]),
    devServerBaseHref(),
    svelte(svelteConfig as Options),
    spaHtmlOptimizations(),
    injectJsonjsdbConfig(appName, dbPath),
    packageDistAfterBuild(),
  ],
})
