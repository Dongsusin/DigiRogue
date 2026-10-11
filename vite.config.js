import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createGameAssetManifest } from './scripts/lib/game-asset-manifest.mjs'

// Local development uses raw GLBs; production downloads the losslessly compressed files.
const gameDownloads = {
  name: 'game-download-manifest',
  configureServer(server) {
    // Vite's static server preserves encoded plus signs; filenames use literal plus.
    server.middlewares.use((request, _response, next) => { request.url = request.url.replace(/%2B/gi, '+'); next() })
    server.middlewares.use('/game-assets.json', async (_request, response, next) => {
      try {
        const manifest = await createGameAssetManifest(server.config.publicDir)
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        response.end(JSON.stringify(manifest))
      } catch (error) { next(error) }
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      request.url = request.url.replace(/%2B/gi, '+')
      if (/\.glb\.br(?:\?|$)/.test(request.url)) {
        response.setHeader('Content-Encoding', 'br')
        response.setHeader('Content-Type', 'model/gltf-binary')
      }
      next()
    })
  },
}

export default defineConfig({
  plugins: [react(), gameDownloads],
  // Models, music and pictures are served by this deployment; Firebase is Auth only.
  publicDir: 'public',
  build: {
    manifest: true,
    sourcemap: false,
    rolldownOptions: { output: { codeSplitting: {
      groups: [{ name: 'three-engine', test: /node_modules[\\/]three[\\/]/, priority: 20 }],
    } } },
  },
})
