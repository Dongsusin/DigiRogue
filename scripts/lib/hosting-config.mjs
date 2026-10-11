export function createHostingConfig(entries) {
  // HTTP paths can arrive percent-encoded even when the public directory uses Korean names.
  const paths = [...new Set([...entries].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    .flatMap(entry => [entry.name, encodeURIComponent(entry.name)]
      .map(name => '/' + name + (entry.directory ? '/:path*' : ''))))]
  if (paths.some(path => /^\/(?:assets|__|api)(?:\/|$)/.test(path))) throw new Error('Public root conflicts with an application route')
  const cache = value => [{ key: 'Cache-Control', value }]
  return {
    version: 2, framework: 'vite', buildCommand: 'npm run build', installCommand: 'npm ci --no-audit --no-fund',
    outputDirectory: 'dist',
    rewrites: [{ source: '/:path*', destination: '/index.html' }],
    headers: [
      { source: '/assets/(.*)', headers: cache('public,max-age=31536000,immutable') },
      ...paths.map(source => ({ source, headers: cache('public, max-age=86400') })),
      { source: '/models/digimon/:file.glb.br', headers: [
        { key: 'Content-Encoding', value: 'br' }, { key: 'Content-Type', value: 'model/gltf-binary' },
      ] },
      ...['/models/:path*', '/BGM/:path*'].map(source => ({
        source, has: [{ type: 'query', key: 'v', value: '[a-f0-9]{16}' }],
        headers: cache('public, max-age=31536000, immutable'),
      })),
      ...['/game-assets.json', '/game-cache-sw.js'].map(source => ({ source, headers: cache('no-cache') })),
      { source: '/', headers: cache('no-cache') },
      { source: '/index.html', headers: cache('no-cache') },
    ],
    git: { deploymentEnabled: { main: false } },
  }
}