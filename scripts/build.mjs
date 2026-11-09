import { build } from 'esbuild'
import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

const output = 'desktop/plugin.js'
const options = {
  entryPoints: ['desktop/src/plugin.tsx'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external: ['@hermes/plugin-sdk', 'react', 'react/jsx-runtime'],
  legalComments: 'none',
  write: false,
  banner: { js: '// Generated from desktop/src by scripts/build.mjs. Do not edit directly.' }
}

const result = await build(options)
const generated = new TextDecoder().decode(result.outputFiles[0].contents)

if (process.argv.includes('--check')) {
  const current = await readFile(output, 'utf8').catch(() => '')
  if (current !== generated) {
    console.error(`${output} is stale. Run npm run build.`)
    process.exit(1)
  }
} else {
  await writeFile(output, generated, 'utf8')
}
