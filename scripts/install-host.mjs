import { cp, mkdir, readdir, stat } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const REQUIRED_HERMES_COMMIT = '2bd378ed1b8d6bf2192cb26e0a55ff3091e6bd19'
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultHermesRoot = process.env.HERMES_HOME ? path.join(process.env.HERMES_HOME, 'hermes-agent') : ''
const args = process.argv.slice(2)
const force = args.includes('--force')
const positional = args.filter(argument => argument !== '--force')
const hermesRoot = path.resolve(positional[0] || defaultHermesRoot)

if (!positional[0] && !defaultHermesRoot) {
  throw new Error('Pass the Hermes Agent source checkout path, or set HERMES_HOME.')
}

const packageStat = await stat(path.join(hermesRoot, 'apps', 'desktop', 'package.json')).catch(() => null)
if (!packageStat?.isFile()) throw new Error(`${hermesRoot} is not a Hermes Agent source checkout.`)

const git = (...command) => execFileSync('git', command, { cwd: hermesRoot, encoding: 'utf8' }).trim()
const head = git('rev-parse', 'HEAD')
const dirty = git('status', '--porcelain')

if (!force && head !== REQUIRED_HERMES_COMMIT) {
  throw new Error(`Host overlay targets Hermes ${REQUIRED_HERMES_COMMIT}; found ${head}. Rebase the overlay or pass --force after review.`)
}
if (!force && dirty) throw new Error('Hermes checkout has local changes. Commit/stash them or pass --force after review.')

async function copyTree(source, destination) {
  await mkdir(destination, { recursive: true })
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name)
    const to = path.join(destination, entry.name)
    if (entry.isDirectory()) await copyTree(from, to)
    else await cp(from, to, { force: true })
  }
}

await copyTree(path.join(projectRoot, 'host-overlay'), hermesRoot)
await copyTree(path.join(projectRoot, 'desktop', 'src'), path.join(hermesRoot, 'apps', 'desktop', 'src', 'plugins', 'navigator'))

console.log(`Installed Hermes Navigator sources into ${hermesRoot}`)
console.log('Next: cd apps/desktop && npm run typecheck && npm run build')
