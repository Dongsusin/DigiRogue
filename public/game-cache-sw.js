// Only downloaded, same-origin game assets are intercepted. Auth/API traffic stays on the network.
const GAME_CACHE = 'digirogue-game-assets-v1'
let installed, reading
async function installedAssets(cache) {
  const saved = await cache.match(self.location.origin + '/game-assets.json')
  if (!saved) return null
  const version = saved.headers.get('X-Digirogue-Manifest')
  if (version && installed?.version === version) return installed.urls
  if (version && reading?.version === version) return reading.promise
  const promise = saved.json().then(manifest => {
    const urls = new Map(manifest.assets.map(asset => {
      const url = new URL(asset.url, self.location.origin)
      return [url.pathname.replace(/%2B/gi, '+'), url.href]
    }))
    installed = { version: manifest.version, urls }
    return urls
  })
  reading = { version, promise }
  return promise
}
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()))
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.cache === 'no-store' || /^\/(?:api|__)(?:\/|$)/.test(url.pathname) ||
    url.pathname === '/game-assets.json' || !(/\.(?:glb(?:\.br)?|png|webp|jpe?g|gif|svg|ico|ogg|m4a|mp3|wav|mp4|webm|woff2?|ttf|json|js|css|html)$/i.test(url.pathname) || request.mode === 'navigate')) return
  event.respondWith((async () => {
    const cache = await caches.open(GAME_CACHE)
    const path = url.pathname.replace(/%2B/gi, '+')
    // Navigation checks for new releases. Offline fallback uses one completely installed release.
    if (request.mode === 'navigate') {
      try { return await fetch(request) } catch {
        const key = (await installedAssets(cache))?.get('/index.html')
        return (key && await cache.match(key)) || Response.error()
      }
    }
    const key = url.searchParams.has('v') ? url.origin + path + '?v=' + url.searchParams.get('v') : (await installedAssets(cache))?.get(path)
    const cached = key ? await cache.match(key) : null
    if (!cached || (url.searchParams.has('v') && url.searchParams.get('v') !== cached.headers.get('X-Digirogue-Revision'))) return fetch(request)
    const range = request.headers.get('Range')
    if (!range) return cached
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (!match || (!match[1] && !match[2])) return fetch(request)
    const data = await cached.arrayBuffer(), length = data.byteLength
    const start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]))
    const end = match[1] && match[2] ? Math.min(length - 1, Number(match[2])) : length - 1
    if (start > end || start >= length) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + length } })
    const headers = new Headers(cached.headers)
    headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + length)
    headers.set('Content-Length', String(end - start + 1)); headers.set('Accept-Ranges', 'bytes')
    return new Response(data.slice(start, end + 1), { status: 206, headers })
  })())
})
