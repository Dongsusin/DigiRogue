// Compression finishes before the manifest records the shipped representations.
await import('./compress-model-assets.mjs')
const { createGameAssetManifest } = await import('./lib/game-asset-manifest.mjs')
const fs = await import('node:fs/promises')
const directory = new URL('../dist/', import.meta.url)
const manifest = await createGameAssetManifest(directory, { compressedModels: true })
await fs.writeFile(new URL('game-assets.json', directory), JSON.stringify(manifest))
console.log(JSON.stringify({ passed: true, downloadManifest: manifest.version, files: manifest.assets.length,
  totalBytes: manifest.totalBytes, downloadBytes: manifest.downloadBytes }))
