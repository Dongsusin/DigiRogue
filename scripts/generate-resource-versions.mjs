import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
const root = new URL('../', import.meta.url)
const versions = {}
async function collect(directory) {
  const entries = (await fs.readdir(new URL('public' + directory + '/', root), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of entries) {
    const url = directory + '/' + entry.name
    if (entry.isDirectory()) { await collect(url); continue }
    if (!entry.isFile() || !/\.(glb|ogg)$/.test(entry.name)) continue
    const bytes = await fs.readFile(new URL('public' + url, root))
    versions[url] = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
  }
}
for (const directory of ['/models/digimon', '/BGM']) await collect(directory)
await fs.writeFile(new URL('src/data/resourceVersions.json', root), JSON.stringify(versions, null, 2) + '\n')
console.log(JSON.stringify({ passed: true, versionedResources: Object.keys(versions).length }))
