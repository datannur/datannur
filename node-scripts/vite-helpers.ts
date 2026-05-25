import {
  mkdirSync,
  readdirSync,
  writeFileSync,
  readFileSync,
  statSync,
} from 'fs'
import fs from 'fs/promises'
import path, { join } from 'path'
import type { Plugin } from 'vite'
import { packageDist } from './package-dist.ts'

interface TsConfig {
  compilerOptions: { paths: { [key: string]: string[] } }
}

function readSchemasRecursively(dir: string): unknown[] {
  const schemas: unknown[] = []
  const files = readdirSync(dir)
  for (const file of files) {
    if (file.startsWith('.')) continue
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    if (stat.isDirectory()) {
      schemas.push(...readSchemasRecursively(filePath))
    } else if (file.endsWith('.schema.json')) {
      const content = readFileSync(filePath, 'utf-8')
      schemas.push(JSON.parse(content))
    }
  }
  return schemas
}

function generateSchemasFile(schemasDir: string, outputFile: string): void {
  const schemas = readSchemasRecursively(schemasDir).sort((a, b) => {
    const aTitle = (a as { title?: string }).title ?? ''
    const bTitle = (b as { title?: string }).title ?? ''
    return aTitle.localeCompare(bTitle)
  })
  writeFileSync(outputFile, JSON.stringify(schemas, null, 2))
}

export function bundleSchemas(schemasDir: string, outputFile: string): Plugin {
  return {
    name: 'bundle-schemas',
    configResolved() {
      generateSchemasFile(schemasDir, outputFile)
    },
  }
}

export function htmlReplace(replacements: [string, string][]) {
  return {
    name: 'htmlReplace',
    transformIndexHtml: {
      handler: (html: string) => {
        for (const replacement of replacements) {
          html = html.replaceAll(replacement[0], replacement[1])
        }
        return html
      },
    },
  }
}

export function spaHtmlOptimizations() {
  return htmlReplace([
    [' crossorigin ', ' '],
    [` type="module" src="./`, ` defer src="./`],
  ])
}

export function devServerBaseHref() {
  return {
    name: 'dev-server-base-href',
    apply: 'serve' as const,
    transformIndexHtml(html: string) {
      return html.replace('<base href="" />', '<base href="/" />')
    },
  }
}

function getContentType(filePath: string): string | undefined {
  return contentTypes[path.extname(filePath)]
}

function isInsidePath(childPath: string, parentPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath)
  return (
    relativePath === '' ||
    (relativePath !== '..' &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath))
  )
}

async function getServedFilePath(
  sourcePath: string,
  suffix: string,
): Promise<string | undefined> {
  const resolvedSourcePath = path.resolve(sourcePath)
  const sourceStat = await fs.stat(resolvedSourcePath)

  if (sourceStat.isFile()) return suffix === '' ? resolvedSourcePath : undefined

  const filePath = path.resolve(resolvedSourcePath, suffix)
  if (!isInsidePath(filePath, resolvedSourcePath)) return undefined

  return filePath
}

const contentTypes: { [extension: string]: string } = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

export function servePublicPaths(
  servedPaths: [urlPath: string, sourcePath: string][],
): Plugin {
  return {
    name: 'serve-package-paths',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = request.url?.split('?')[0] ?? ''
        const servedPath = servedPaths.find(
          ([urlPath]) => url === urlPath || url.startsWith(`${urlPath}/`),
        )
        if (!servedPath) {
          next()
          return
        }

        const [urlPath, sourcePath] = servedPath
        const suffix = url.slice(urlPath.length).replace(/^\//, '')
        try {
          const filePath = await getServedFilePath(
            sourcePath,
            decodeURIComponent(suffix),
          )
          if (!filePath) {
            next()
            return
          }
          const stat = await fs.stat(filePath)
          if (!stat.isFile()) {
            next()
            return
          }
          const contentType = getContentType(filePath)
          if (contentType) response.setHeader('Content-Type', contentType)
          response.end(await fs.readFile(filePath))
        } catch {
          next()
        }
      })
    },
  }
}

export function packageDistAfterBuild(): Plugin {
  return {
    name: 'package-dist-after-build',
    apply: 'build' as const,
    closeBundle: packageDist,
  }
}

export function injectJsonjsdbConfig(appName: string, dbPath: string): Plugin {
  return {
    name: 'inject-jsonjsdb-config',
    transformIndexHtml(html) {
      const config = `<div id="jsonjsdb-config" style="display:none" data-app-name="${appName}" data-path="${dbPath}"></div>`
      return html.replace('</body>', `${config}</body>`)
    },
  }
}

export function updateRouterIndex(pageDir: string) {
  return {
    name: 'update-router-index',
    async buildStart() {
      const routerIndexFile = path.join(pageDir, '.router-index.ts')

      let imports = ''
      let type = `\nimport type { Component } from 'svelte'`
      type += `\ntype RouteConfig = { component: Component<any>; param?: string }\n`
      let content = `\nexport default {`

      const files = await fs.readdir(pageDir)
      for (const file of files) {
        if (!file.endsWith('.svelte')) continue
        const filename = file.replace('.svelte', '')
        const moduleName = filename.split('[')[0]
        const routeName =
          moduleName.charAt(0).toLowerCase() + moduleName.slice(1)
        let param = ''
        if (filename.includes('['))
          param = `, param: '${filename.split('[')[1].split(']')[0]}'`
        const modulePath = `./${filename}.svelte`
        imports += `import ${moduleName} from '${modulePath}'\n`
        content += `\n  ${routeName}: { component: ${moduleName}${param} },`
      }
      content += '\n} as const satisfies Record<string, RouteConfig>\n'
      await fs.writeFile(routerIndexFile, imports + type + content, 'utf8')
    },
  }
}

export async function getAliases(
  from: string,
): Promise<{ [key: string]: string }> {
  const {
    compilerOptions: { paths },
  } = JSON.parse(await fs.readFile(from, 'utf8')) as TsConfig
  return Object.fromEntries(
    Object.entries(paths).map(([find, [replacement]]) => [
      find.replace('/*', ''),
      path.resolve(replacement.replace('/*', '')),
    ]),
  )
}

export async function getAppVersion(): Promise<string> {
  const packageJson = await fs.readFile('package.json', 'utf8')
  const { version } = JSON.parse(packageJson) as { version: string }
  return version || '0.0.0'
}

interface BuildConfigOptions {
  tsconfigPath?: string
}

export async function initBuildConfig(options: BuildConfigOptions = {}) {
  const { tsconfigPath = 'tsconfig.json' } = options
  const [appVersion, aliases] = await Promise.all([
    getAppVersion(),
    getAliases(tsconfigPath),
  ])
  return { appVersion, aliases }
}

export async function copyPaths(pairs: [string, string][]) {
  return Promise.all(
    pairs.map(([from, to]) => {
      mkdirSync(path.dirname(to), { recursive: true })
      return fs.copyFile(from, to)
    }),
  )
}
