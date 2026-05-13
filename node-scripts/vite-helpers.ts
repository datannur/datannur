import { readdirSync, writeFileSync, readFileSync, statSync } from 'fs'
import fs from 'fs/promises'
import path, { join } from 'path'
import type { Plugin } from 'vite'

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

export function injectJsonjsdbConfig(appName: string, dbName: string): Plugin {
  return {
    name: 'inject-jsonjsdb-config',
    transformIndexHtml(html) {
      const config = `<div id="jsonjsdb-config" style="display:none" data-app-name="${appName}" data-path="data/${dbName}"></div>`
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

export function copyFilesToOutDir(outDir: string, files: string[]) {
  return {
    name: 'copyFilesToOutDir',
    apply: 'build' as const,
    closeBundle: async () => {
      await Promise.all(
        files.map(file => fs.copyFile(file, `${outDir}/${file}`)),
      )
    },
  }
}

export function afterBuild(callback: () => void | Promise<void>) {
  return {
    name: 'afterBuild',
    apply: 'build' as const,
    closeBundle: callback,
  }
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
  return Promise.all(pairs.map(([from, to]) => fs.copyFile(from, to)))
}
