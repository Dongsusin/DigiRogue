export const GAME_ASSET_CACHE = 'digirogue-game-assets-v1'
export const GAME_MANIFEST_PATH = '/game-assets.json'
export const REVISION_HEADER = 'X-Digirogue-Revision'
const assetKey = (path, origin) => new URL(path.split('/').map(part => encodeURIComponent(part).replaceAll('%2B', '+')).join('/'), origin).href
const cacheKey = (asset, origin) => assetKey(asset.path, origin) + '?v=' + asset.revision

export function validateGameManifest(manifest, origin) {
  if (manifest?.schema !== 1 || !/^[a-f0-9]{16}$/.test(manifest.version) || !Array.isArray(manifest.assets) || !manifest.assets.length) throw new Error('게임 데이터 목록을 확인하지 못했습니다.')
  const paths = new Set()
  let total = 0
  for (const asset of manifest.assets) {
    if (typeof asset.path !== 'string' || !asset.path.startsWith('/') || asset.path.startsWith('//') || /[?#\\]/.test(asset.path)) throw new Error('게임 데이터 경로가 잘못되었습니다.')
    const key = new URL(assetKey(asset.path, origin)), download = new URL(asset.url, origin)
    if (key.origin !== origin || asset.path.split('/').some(part => part === '.' || part === '..') || download.origin !== origin || download.pathname !== key.pathname ||
      paths.has(key.href) || !/^[a-f0-9]{16}$/.test(asset.revision) || download.searchParams.get('v') !== asset.revision ||
      !Number.isSafeInteger(asset.bytes) || asset.bytes < 0 || !Number.isSafeInteger(asset.downloadBytes) || asset.downloadBytes < 0) throw new Error('게임 데이터 목록의 경로 또는 버전이 잘못되었습니다.')
    paths.add(key.href); total += asset.bytes
  }
  if (total !== manifest.totalBytes) throw new Error('게임 데이터 목록의 용량이 잘못되었습니다.')
  return manifest
}

// Persist files, not decoded Three.js scenes. The existing bounded model cache still owns RAM/GPU usage.
export async function downloadGameAssets(manifest, { cache, origin, fetcher = fetch, onProgress = () => {}, concurrency = 3, estimate } = {}) {
  validateGameManifest(manifest, origin)
  let completed = 0, reused = 0, savedBytes = 0, failed = null, cursor = 0
  const missing = [], active = new Map()
  const report = phase => onProgress({ phase, completed, reused, total: manifest.assets.length, totalBytes: manifest.totalBytes,
    loadedBytes: Math.min(manifest.totalBytes, savedBytes + [...active.values()].reduce((sum,size)=>sum+size,0)), downloadBytes: manifest.downloadBytes })
  report('checking')
  for (const asset of manifest.assets) {
    const cached = await cache.match(cacheKey(asset, origin))
    if (cached?.headers.get(REVISION_HEADER) === asset.revision && Number(cached.headers.get('Content-Length')) === asset.bytes) {
      completed++; reused++; savedBytes += asset.bytes
    } else missing.push(asset)
  }
  report('checking')
  if (missing.length && estimate) {
    const storage = await estimate().catch(() => null)
    const needed = missing.reduce((sum,a)=>sum+a.bytes,0)
    if (Number.isFinite(storage?.quota) && storage.quota - (storage.usage || 0) < needed + 16 * 1024 * 1024) throw new Error('게임 데이터를 저장할 공간이 부족합니다. 브라우저 저장 공간을 확보한 뒤 다시 시도해 주세요.')
  }
  report('downloading')
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), 4, missing.length) }, async () => {
    while (!failed && cursor < missing.length) {
      const asset = missing[cursor++], controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 90000)
      try {
        const result = await fetcher(new URL(asset.url, origin).href, { signal: controller.signal, cache: 'no-store' })
        if (!result.ok) throw new Error('게임 데이터 파일을 받지 못했습니다. (' + result.status + ')')
        if (result.headers.get('content-type')?.includes('text/html') && !asset.path.endsWith('.html')) throw new Error('게임 데이터 대신 잘못된 파일이 도착했습니다.')
        const chunks = []; let length = 0
        if (result.body) {
          const reader = result.body.getReader()
          try {
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              length += value.length
              if (length > asset.bytes) { await reader.cancel(); throw new Error('게임 데이터 파일 용량 검증에 실패했습니다.') }
              chunks.push(value); active.set(asset.path, length); report('downloading')
            }
          } finally { reader.releaseLock() }
        }
        const bytes = new Uint8Array(length); let offset = 0
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
        if (length !== asset.bytes) throw new Error('게임 데이터 파일이 끝까지 다운로드되지 않았습니다.')
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v=>v.toString(16).padStart(2,'0')).join('').slice(0,16)
        if (hash !== asset.revision) throw new Error('게임 데이터 파일 검증에 실패했습니다. 다시 시도해 주세요.')
        const headers = new Headers(result.headers)
        // fetch has already decompressed Brotli; cached bodies must not advertise encoded bytes.
        headers.delete('Content-Encoding'); headers.delete('Content-Length'); headers.delete('Vary')
        headers.set('Content-Length', String(length)); headers.set(REVISION_HEADER, asset.revision)
        await cache.put(cacheKey(asset, origin), new Response(bytes, { headers }))
        active.delete(asset.path); savedBytes += length; completed++; report('downloading')
      } catch (error) {
        active.delete(asset.path)
        failed ??= error.name === 'QuotaExceededError' ? new Error('게임 데이터를 저장할 공간이 부족합니다. 저장 공간을 확보한 뒤 다시 시도해 주세요.') : error
      } finally { clearTimeout(timeout) }
    }
  }))
  if (failed) throw failed
  report('ready')
  return { completed, reused, totalBytes: manifest.totalBytes }
}

async function ensureWorker(navigator) {
  await navigator.serviceWorker.register('/game-cache-sw.js', { scope: '/', updateViaCache: 'none' })
  await navigator.serviceWorker.ready
  if (navigator.serviceWorker.controller) return
  await new Promise((resolve, reject) => {
    const finish = () => { clearTimeout(timeout); navigator.serviceWorker.removeEventListener('controllerchange', check) }
    const check = () => { if (navigator.serviceWorker.controller) { finish(); resolve() } }
    const timeout = setTimeout(() => { finish(); reject(new Error('다운로드한 데이터를 연결하지 못했습니다. 페이지를 새로고침해 주세요.')) }, 15000)
    navigator.serviceWorker.addEventListener('controllerchange', check); check()
  })
}

export async function prepareGameDownload({ onProgress = () => {}, environment = globalThis } = {}) {
  const { navigator, location, caches } = environment
  // Packaged launcher files are already installed on disk and do not need a web download.
  if (location.protocol === 'file:' || environment.auroraGame) return { installed: true }
  if (!caches || !navigator?.serviceWorker || !environment.crypto?.subtle) throw new Error('이 브라우저에서는 게임 데이터를 저장할 수 없습니다. 최신 Chrome 또는 Edge의 일반 창에서 실행해 주세요.')
  onProgress({ phase: 'checking', loadedBytes: 0, totalBytes: 0, completed: 0, total: 0 })
  await ensureWorker(navigator)
  const cache = await caches.open(GAME_ASSET_CACHE)
  const metadataKey = new URL(GAME_MANIFEST_PATH, location.origin).href
  let manifest
  try {
    const result = await environment.fetch(metadataKey, { cache: 'no-store', signal: AbortSignal.timeout(20000) })
    if (!result.ok) throw new Error('게임 데이터 목록을 받지 못했습니다.')
    manifest = validateGameManifest(await result.json(), location.origin)
  } catch (error) {
    const saved = await cache.match(metadataKey)
    if (!saved) throw error
    manifest = validateGameManifest(await saved.json(), location.origin)
  }
  // A login page left open across a deployment must enter through the matching code bundle.
  const entry = environment.document?.querySelector('script[type="module"][src]')?.src
  if (entry) {
    const entryPath = new URL(entry, location.origin).pathname
    if (entryPath.startsWith('/assets/') && !manifest.assets.some(asset => asset.path === entryPath)) {
      location.reload()
      throw new Error('게임이 업데이트되었습니다. 새로고침 후 다시 연결합니다.')
    }
  }
  const download = async () => {
    const result = await downloadGameAssets(manifest, { cache, origin: location.origin, fetcher: environment.fetch.bind(environment), onProgress,
      estimate: navigator.storage?.estimate?.bind(navigator.storage) })
    await cache.put(metadataKey, new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/json', 'X-Digirogue-Manifest': manifest.version } }))
    navigator.storage?.persist?.().catch(() => {})
    return result
  }
  // Concurrent tabs check the cache again after the first tab finishes.
  return navigator.locks ? navigator.locks.request(GAME_ASSET_CACHE, download) : download()
}

let state = { phase: 'checking', loadedBytes: 0, totalBytes: 0, completed: 0, total: 0 }, pending
const listeners = new Set()
let lastPublished = 0
const publish = next => {
  const now = Date.now()
  if (next.phase === 'downloading' && next.completed !== next.total && now - lastPublished < 80) return
  lastPublished = now; state = { ...next }; listeners.forEach(listener=>listener())
}
export const gameDownloadState = () => state
export const subscribeGameDownload = listener => { listeners.add(listener); return () => listeners.delete(listener) }
export function startGameDownload() {
  pending ??= prepareGameDownload({ onProgress: publish }).then(result => { publish({ ...state, phase: 'ready' }); return result }).catch(error => {
    publish({ ...state, phase: 'error', error: error.message || '다운로드 연결이 끊겼습니다. 다시 시도해 주세요.' }); pending = null
  })
  return pending
}
