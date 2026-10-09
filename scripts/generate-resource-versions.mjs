import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
const root = new URL('../', import.meta.url)
const versions = {}
for (const directory of ['/models/digimon', '/BGM']) {
  const names = (await fs.readdir(new URL('public' + directory + '/', root))).sort()
  for (const name of names) {
    if (!/\.(glb|m4a)$/.test(name)) continue
    const url = directory + '/' + name
    const bytes = await fs.readFile(new URL('public' + url, root))
    versions[url] = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
  }
}
await fs.writeFile(new URL('src/data/resourceVersions.json', root), JSON.stringify(versions, null, 2) + '\n')
console.log(JSON.stringify({ passed: true, versionedResources: Object.keys(versions).length }))
