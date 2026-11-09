import { readFile, writeFile } from 'node:fs/promises'

const version = process.argv[2]
if (!/^\d+\.\d+\.\d+$/.test(version || '')) throw new Error('Usage: node scripts/prepare-auto-release.mjs <major.minor.patch>')

for (const file of ['package.json', 'package-lock.json']) {
  const value = JSON.parse(await readFile(file, 'utf8'))
  value.version = version
  if (value.packages?.['']) value.packages[''].version = version
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const manifest = await readFile('plugin.yaml', 'utf8')
if (!/^version:\s*[^\r\n]+/m.test(manifest)) throw new Error('plugin.yaml has no version field')
await writeFile('plugin.yaml', manifest.replace(/^version:\s*[^\r\n]+/m, `version: ${version}`), 'utf8')
