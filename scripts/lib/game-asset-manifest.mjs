import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
const revision = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 16)
export async function createGameAssetManifest(directory, { compressedModels = false } = {}) {
  directory = directory instanceof URL ? fileURLToPath(directory) : directory
  const files = []
  async function walk(folder, prefix = '') {
    for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const relative = prefix + entry.name
      if (entry.isDirectory()) await walk(path.join(folder, entry.name), relative + '/')
      else if (entry.isFile() && !['game-assets.json', 'game-cache-sw.js'].includes(relative)) files.push(relative)
    }
  }
  await walk(directory)
  const available = new Set(files), assets = []
  for (const relative of files.sort()) {
    if (relative.endsWith('.glb') && compressedModels && available.has(relative + '.br')) continue
    if (relative.endsWith('.glb.br') && (!compressedModels || !available.has(relative.slice(0, -3)))) continue
    const disk = path.join(directory, relative)
    const data = await fs.readFile(relative.endsWith('.glb.br') ? disk.slice(0, -3) : disk)
    const hash = revision(data)
    const downloadBytes = relative.endsWith('.glb.br') ? (await fs.stat(disk)).size : data.length
    const assetPath = '/' + relative.replaceAll(path.sep, '/')
    assets.push({ path: assetPath, url: assetPath.split('/').map(encodeURIComponent).join('/') + '?v=' + hash, revision: hash, bytes: data.length, downloadBytes })
  }
  if (!assets.length) throw new Error('Game assets are missing')
  return { schema: 1, version: revision(JSON.stringify(assets)), totalBytes: assets.reduce((sum,a)=>sum+a.bytes,0),
    downloadBytes: assets.reduce((sum,a)=>sum+a.downloadBytes,0), assets }
}
