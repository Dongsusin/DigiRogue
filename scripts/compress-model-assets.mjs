import fs from 'node:fs/promises'
import { brotliCompress, brotliDecompressSync, constants } from 'node:zlib'
import { promisify } from 'node:util'
const compress = promisify(brotliCompress)
const directory = new URL('../dist/models/digimon/', import.meta.url)
const files = (await fs.readdir(directory)).filter(name => name.endsWith('.glb'))
if (!files.length) throw new Error('Build omitted the game models')
let index = 0, originalBytes = 0, compressedBytes = 0
await Promise.all(Array.from({ length: 4 }, async () => {
  while (index < files.length) {
    const name = files[index++]
    const original = await fs.readFile(new URL(name, directory))
    const compressed = await compress(original, { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } })
    if (!brotliDecompressSync(compressed).equals(original)) throw new Error('Model changed during compression: ' + name)
    await fs.writeFile(new URL(name + '.br', directory), compressed)
    originalBytes += original.length
    compressedBytes += compressed.length
  }
}))
console.log(JSON.stringify({ passed: true, losslessModels: files.length, originalBytes, compressedBytes,
  reducedPercent: Math.round((1 - compressedBytes / originalBytes) * 10000) / 100 }))
