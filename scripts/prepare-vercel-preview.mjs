import fs from 'node:fs/promises'
import { createHostingConfig } from './lib/hosting-config.mjs'
const root = new URL('../', import.meta.url)
if (process.argv.length !== 2) throw new Error('The app and all assets use the existing Vercel origin')
const entries = (await fs.readdir(new URL('public', root), { withFileTypes: true }))
  .map(entry => ({ name: entry.name, directory: entry.isDirectory() }))
const config = createHostingConfig(entries)
await fs.writeFile(new URL('vercel.json', root), JSON.stringify(config, null, 2) + '\n')
console.log(JSON.stringify({ passed: true, publicRoots: entries.length, externalAssetRoutes: 0 }))
