import { readFile } from 'node:fs/promises'
import process from 'node:process'

const target = process.argv[2] || 'desktop/plugin.js'
const source = await readFile(target, 'utf8')
const failures = []

for (const match of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
  if (!['@hermes/plugin-sdk', 'react', 'react/jsx-runtime'].includes(match[1])) {
    failures.push(`unsupported import: ${match[1]}`)
  }
}

for (const [label, pattern] of [
  ['Hermes app-internal import', /from\s*['"]@\//],
  ['raw Desktop bridge', /window\.hermesDesktop/],
  ['script injection', /innerHTML\s*=|insertAdjacentHTML|document\.write/]
]) {
  if (pattern.test(source)) failures.push(label)
}

if (!/export\s*\{[^}]*plugin_default\s+as\s+default/.test(source) && !/export\s+default/.test(source)) {
  failures.push('missing default plugin export')
}

if (failures.length) {
  console.error(`${target} failed Desktop surface verification:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`${target}: SDK-only Desktop surface verified`)
