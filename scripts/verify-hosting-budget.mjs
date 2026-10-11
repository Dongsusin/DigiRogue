import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { createHostingConfig } from './lib/hosting-config.mjs'
import { bgmTracks } from '../src/audio/bgmCatalog.js'

const root = new URL('../', import.meta.url)
const config = JSON.parse(fs.readFileSync(new URL('vercel.json', root)))
const entries = fs.readdirSync(new URL('public', root), { withFileTypes: true })
const tests = [], test = (name, run) => tests.push({ name, run })
test('checked-in hosting routes match the regeneration tool', () => {
  assert.deepEqual(config, createHostingConfig(entries.map(entry => ({ name: entry.name, directory: entry.isDirectory() }))))
})
test('Vercel serves app and assets without forwarding any traffic to Firebase Hosting', () => {
  assert(!(config.rewrites ?? []).some(rule => /^https?:/.test(rule.destination)))
  assert.equal((config.redirects ?? []).length, 0)
  assert(!JSON.stringify(config).includes('.web.app'))
  assert(config.rewrites?.some(rule => rule.destination === '/index.html'))
})
test('Vercel build includes every public resource and source uploads do not exclude them', () => {
  const vite = fs.readFileSync(new URL('vite.config.js', root), 'utf8')
  assert(!/publicDir:.*false/.test(vite), 'Vercel builds still omit public files')
  const ignored = fs.readFileSync(new URL('.vercelignore', root), 'utf8').split(/\r?\n/)
  assert(!ignored.includes('public') && !ignored.includes('public/**'))
})
test('app entry and compiled bundles stay at the existing Google/guest save origin', () => {
  assert.equal((config.redirects ?? []).length, 0)
  for (const source of ['/', '/index.html']) {
    assert(config.headers.some(rule => rule.source === source && rule.headers.some(h => h.key === 'Cache-Control' && h.value === 'no-cache')))
  }
})
test('percent-encoded Korean asset paths receive the same daily browser cache as ASCII assets', () => {
  const koreanRoots = entries.filter(entry => encodeURIComponent(entry.name) !== entry.name)
  assert(koreanRoots.length > 0, 'Expected real Korean asset roots')
  for (const entry of koreanRoots) {
    const source = '/' + encodeURIComponent(entry.name) + (entry.isDirectory() ? '/:path*' : '')
    assert(config.headers.some(rule => rule.source === source && !rule.has
      && rule.headers.some(header => header.key === 'Cache-Control' && header.value === 'public, max-age=86400')),
    'The percent-encoded HTTP asset path has no daily cache rule')
  }
})
test('only explicitly versioned models and music receive immutable browser caching', () => {
  for (const source of ['/models/:path*', '/BGM/:path*']) {
    const rules = config.headers.filter(rule => rule.source === source)
    assert(rules.some(rule => !rule.has && rule.headers.some(h => h.value === 'public, max-age=86400')))
    assert(rules.some(rule => rule.has?.some(h => h.type === 'query' && h.key === 'v' && h.value === '[a-f0-9]{16}')
      && rule.headers.some(h => h.value === 'public, max-age=31536000, immutable')))
  }
  assert(!config.headers.some(rule => /^\/(?:api|__)/.test(rule.source)))
})
test('precompressed GLB files have an explicit encoding and preserve the GLB media type', () => {
  const rule = config.headers.find(rule => rule.source === '/models/digimon/:file.glb.br')
  assert(rule, 'Precompressed model response policy is missing')
  assert(rule.headers.some(h => h.key === 'Content-Encoding' && h.value === 'br'))
  assert(rule.headers.some(h => h.key === 'Content-Type' && h.value === 'model/gltf-binary'))
})
test('model and music URLs carry a content revision while unrelated URLs stay untouched', async () => {
  const { versionedResourceUrl } = await import('../src/data/resourceUrl.js')
  const versions = JSON.parse(fs.readFileSync(new URL('src/data/resourceVersions.json', root)))
  assert.equal(versionedResourceUrl('/models/digimon/guardromon.glb'), '/models/digimon/guardromon.glb.br?v=' + versions['/models/digimon/guardromon.glb'])
  assert.equal(versionedResourceUrl('/models/digimon/guardromon.glb', { compressedModels: false }), '/models/digimon/guardromon.glb?v=' + versions['/models/digimon/guardromon.glb'])
  const theme = bgmTracks[0].url
  assert.equal(versionedResourceUrl(theme + '?download=1#track'), theme + '?download=1&v=' + versions[theme] + '#track')
  for (const url of ['/api/account', '/unknown.glb', 'https://example.com/model.glb', 'blob:local', 'data:model']) assert.equal(versionedResourceUrl(url), url)
})
test('all model/music revisions match the actual files and no player data is versioned', () => {
  const versions = JSON.parse(fs.readFileSync(new URL('src/data/resourceVersions.json', root)))
  const files = ['/models/digimon', '/BGM'].flatMap(dir => fs.readdirSync(new URL('public' + dir + '/', root), { recursive: true })
    .filter(name => /\.(glb|m4a|ogg)$/.test(name)).map(name => dir + '/' + name.replaceAll('\\', '/')))
  assert.deepEqual(Object.keys(versions).sort(), files.sort())
  for (const url of files) {
    const bytes = fs.readFileSync(new URL('public' + url, root))
    assert.equal(versions[url], createHash('sha256').update(bytes).digest('hex').slice(0, 16), url)
  }
})
test('the live model loader and every music start use the versioned URL helper', () => {
  const loader = fs.readFileSync(new URL('src/three/sharedModelAssets.js', root), 'utf8')
  assert(/loadAsync\(versionedResourceUrl\(url\)\)/.test(loader))
  const app = fs.readFileSync(new URL('src/App.jsx', root), 'utf8')
  const music = fs.readFileSync(new URL('src/audio/BgmPlayer.js', root), 'utf8')
  const wrapper = app.slice(app.indexOf('const BackgroundMusic ='), app.indexOf('\nconst ButtonClickSound'))
  assert(wrapper.includes('new BgmPlayer('), 'The live music component must use the validated player')
  assert.equal((music.match(/audio.src = nextTrack.url/g) ?? []).length, 0)
  assert(music.includes('this.versionUrl('), 'Every music URL must go through the injected revision helper')
  assert(wrapper.includes('versionUrl: versionedResourceUrl'), 'The live player must inject the content revision helper')
})
test('Firebase legacy asset URLs redirect to Vercel without touching reserved authentication', () => {
  const plan = JSON.parse(fs.readFileSync(new URL('hosting-redirects.json', root)))
  for (const entry of entries) {
    const source = '/' + entry.name + (entry.isDirectory() ? '/:path*' : '')
    const route = plan.redirects.find(rule => rule.glob === source)
    assert(route, 'Missing legacy resource redirect')
    assert.equal(route.location, 'https://digirouge.co.kr/' + entry.name + (entry.isDirectory() ? '/:path' : ''))
    assert.equal(route.statusCode, 301)
  }
  assert(!plan.redirects.some(rule => rule.glob === '/**' || rule.glob.startsWith('/__')))
  assert(!plan.headers.some(rule => rule.headers['Cache-Control'] && (rule.glob === '/**' || rule.glob.startsWith('/__'))))
})
let passed = 0
for (const { name, run } of tests) {
  try { await run(); passed++; console.log('PASS ' + name) }
  catch (error) { console.error('FAIL ' + name + ': ' + error.message.replace(/[^\x00-\x7F]/g, '?')); process.exitCode = 1 }
}
console.log(`Hosting network budget: ${passed}/${tests.length} checks passed`)
