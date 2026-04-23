import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

type DeployConfig = {
  name: string
  host: string
  port: number
  username: string
  remotePath: string
  privateKeyPath: string
  syncOption?: {
    delete?: boolean
  }
}

const thisDirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = join(thisDirname, '..')

const configPath = join(thisDirname, 'deploy.config.json')
const distPath = join(docsRoot, '.vitepress', 'dist')

if (!existsSync(configPath)) {
  console.error('❌ No deploy config found!')
  console.log('📝 Create deploy.config.json from deploy.config.template.json')
  process.exit(1)
}

if (!existsSync(distPath)) {
  console.error('❌ No build output found!')
  console.log('📝 Run `npm run build` first')
  process.exit(1)
}

const config = JSON.parse(readFileSync(configPath, 'utf8')) as DeployConfig

console.log(`🚀 Deploying docs to ${config.name}`)

try {
  const deleteFlag = config.syncOption?.delete ? '--delete' : ''
  const sshCmd = `ssh -i ${config.privateKeyPath} -p ${config.port}`
  // Trailing slash on source: copy contents of dist/, not dist/ itself
  execSync(
    `rsync -avz ${deleteFlag} -e "${sshCmd}" "${distPath}/" ${config.username}@${config.host}:${config.remotePath}/`,
    { stdio: 'inherit' },
  )
  console.log('✅ Docs deployed')
} catch {
  console.error('❌ Deploy failed')
  process.exit(1)
}
