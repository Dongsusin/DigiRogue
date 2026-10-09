import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vercel serves large game assets through the Firebase preview CDN.
  publicDir: process.env.VERCEL === '1' ? false : 'public',
  build: {
    manifest: true,
    sourcemap: false,
    rolldownOptions: { output: { codeSplitting: {
      groups: [{ name: 'three-engine', test: /node_modules[\\/]three[\\/]/, priority: 20 }],
    } } },
  },
})
