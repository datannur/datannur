import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'

const distDir = 'dist'
const packageDir = 'package'
const appDir = path.join(distDir, 'app')
const appDocs = ['LICENSE', 'README.md', 'CHANGELOG.md']

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function removeIfExists(filePath: string): Promise<void> {
  await fs.rm(filePath, { recursive: true, force: true })
}

async function cleanPackageOutputs(): Promise<void> {
  const packageEntries = await fs.readdir(packageDir)
  const packageOutputPaths = packageEntries
    .map(entry => path.join(distDir, entry))
    .filter(outputPath => outputPath !== appDir)
  const appOutputPaths = (await fs.readdir(path.join(packageDir, 'app')))
    .map(entry => path.join(appDir, entry))
    .filter(outputPath => outputPath !== path.join(appDir, 'assets'))
  const appAssetPaths = (
    await fs.readdir(path.join(packageDir, 'app/assets'))
  ).map(entry => path.join(appDir, 'assets', entry))
  const appDocPaths = appDocs.map(file => path.join(appDir, file))
  await Promise.all(
    [
      ...packageOutputPaths,
      ...appOutputPaths,
      ...appAssetPaths,
      ...appDocPaths,
    ].map(removeIfExists),
  )
}

async function mergePath(from: string, to: string): Promise<void> {
  if (!(await pathExists(from))) return
  await fs.mkdir(to, { recursive: true })
  await fs.cp(from, to, { recursive: true, filter: shouldCopyPath })
}

async function copyFile(from: string, to: string): Promise<void> {
  if (!(await pathExists(from))) return
  if (!shouldCopyPath(from)) return
  await fs.mkdir(path.dirname(to), { recursive: true })
  await fs.copyFile(from, to)
}

function shouldCopyPath(filePath: string): boolean {
  const basename = path.basename(filePath)
  return basename !== '.DS_Store' && basename !== '__pycache__'
}

async function runCommand(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv = {},
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...env },
    })
    child.on('error', reject)
    child.on('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))
    })
  })
}

export async function packageDist(): Promise<void> {
  const pythonEnv: NodeJS.ProcessEnv = {}
  pythonEnv['PYTHONDONTWRITEBYTECODE'] = '1'

  await fs.mkdir(appDir, { recursive: true })
  await cleanPackageOutputs()

  await Promise.all([
    mergePath(packageDir, distDir),
    ...appDocs.map(file => copyFile(file, path.join(appDir, file))),
  ])

  await runCommand(
    'python3',
    [path.join(appDir, 'scripts/python/build_db_source.py')],
    pythonEnv,
  )
  await removeIfExists(path.join(appDir, 'scripts/python/__pycache__'))
}
