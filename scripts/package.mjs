import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const index = process.argv.indexOf('--output')
const output = index >= 0 ? process.argv[index + 1] : 'dist/hermes-navigator.zip'
if (!output) throw new Error('--output requires a path')

mkdirSync(path.dirname(output), { recursive: true })
execFileSync('git', ['archive', '--format=zip', '--prefix=hermes-navigator/', '--output', path.resolve(output), 'HEAD'], {
  stdio: 'inherit'
})
console.log(path.resolve(output))
