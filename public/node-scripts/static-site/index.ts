// Core SSG functionality
export {
  generateStaticSite,
  capturePage,
  generateSitemap,
  createIndexFile,
  startServer,
  stopServer,
  initPage,
  waitUntilReady,
} from './ssg.ts'
export type { SsgConfig } from './ssg.ts'

// Jsonjsdb-specific SSG
export {
  generateJsonjsdbStaticSite,
  arrayToObject,
  getDbPathFromContent,
  getDbMetaPath,
  getEntitiesRoutes,
  createEntityDirs,
  loadSsgConfig,
} from './ssg-jsonjsdb.ts'
export type { JsonjsdbSsgConfig } from './ssg-jsonjsdb.ts'
