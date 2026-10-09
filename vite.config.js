import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
