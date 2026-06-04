import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const separatorIndex = process.argv.indexOf('--')
const commandArgs =
  separatorIndex >= 0
    ? process.argv.slice(separatorIndex + 1)
    : process.argv.slice(2)

if (commandArgs.length === 0) {
  console.error(
    'Usage: npm run node:ts node-scripts/run-command-summary.ts -- <command> [args...]',
  )
  process.exit(2)
}

const [command, ...args] = commandArgs
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const logDir = join(tmpdir(), 'datannur-test-logs')
const logPath = join(
  logDir,
  `${timestamp}-${command.replace(/[^a-zA-Z0-9_-]/g, '_')}.log`,
)
const outputChunks: string[] = []

mkdirSync(logDir, { recursive: true })

function appendOutput(chunk: Buffer | string) {
  outputChunks.push(chunk.toString())
}

function getOutputLines() {
  return outputChunks.join('').replace(/\r\n/g, '\n').split('\n')
}

function importantLine(line: string) {
  return /\b(error|failed|failure|fail|timeout|traceback|assertion|expected|got|exception)\b|ERR_|EADDRINUSE|not found/i.test(
    line,
  )
}

function selectedSummaryLines(lines: string[]) {
  const selected = new Set<number>()
  for (const [index, line] of lines.entries()) {
    if (!importantLine(line)) continue
    for (let offset = -2; offset <= 5; offset += 1) {
      const lineIndex = index + offset
      if (lineIndex >= 0 && lineIndex < lines.length) selected.add(lineIndex)
    }
  }
  return [...selected].sort((a, b) => a - b).map(index => lines[index])
}

console.log(`Running: ${[command, ...args].join(' ')}`)
console.log(`Full log: ${logPath}`)

const child = spawn(command, args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
})

child.stdout.on('data', appendOutput)
child.stderr.on('data', appendOutput)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    child.kill(signal)
  })
}

child.on('close', code => {
  const output = outputChunks.join('')
  writeFileSync(logPath, output)

  const lines = getOutputLines()
  const summaryLines = selectedSummaryLines(lines)
  const tailLines = lines.slice(-80)

  console.log(`\nExit code: ${code ?? 1}`)
  console.log(`Full log: ${logPath}`)

  if (summaryLines.length > 0) {
    console.log('\nImportant lines:')
    console.log(summaryLines.join('\n'))
  } else {
    console.log('\nNo obvious error lines matched the summary filter.')
  }

  console.log('\nLast 80 lines:')
  console.log(tailLines.join('\n'))

  process.exit(code ?? 1)
})
