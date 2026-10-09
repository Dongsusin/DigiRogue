import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { versionedResourceUrl } from '../src/data/resourceUrl.js'

// Run the actual component effects with browser boundaries replaced. No game
// catalogs, Firebase account or real music download is needed for this check.
const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const start = app.indexOf('const BackgroundMusic =')
const end = app.indexOf('\nconst ButtonClickSound', start)
const component = app.slice(start, end).replace(/return <audio[^>]*\/>/, 'return null')
function player({ volume = 1, hidden = false, online = true } = {}) {
  const timers = new Map(), effects = [], window = new EventTarget(), document = new EventTarget()
  let clock = 0, id = 0, firstRef = true, plays = 0
  document.hidden = hidden
  window.setTimeout = (fn, delay) => { const key = ++id; timers.set(key, { fn, at: clock + delay }); return key }
  window.clearTimeout = key => timers.delete(key)
  window.requestAnimationFrame = () => ++id
  window.cancelAnimationFrame = () => {}
  window.performance = { now: () => clock }
  const navigator = { onLine: online }
  const audio = new EventTarget()
  Object.assign(audio, { paused: true, currentTime: 0, duration: 100,
    pause() { this.paused = true }, play() { plays++; this.paused = false; return Promise.resolve() },
    removeAttribute(name) { if (name === 'src') delete this.src }, load() {},
  })
  const context = vm.createContext({ window, document, navigator, versionedResourceUrl, gameAudio: { getBgmDucking: () => 1 },
    BGM_FADE_IN_MS: 1800, BGM_FADE_OUT_MS: 2400, BGM_FADE_OUT_SECONDS: 3,
    sanitizeSettings: settings => settings, getEnabledBgmTracks: settings => settings.tracks,
    getEffectiveBgmVolume: settings => settings.volume, createShuffledBgmQueue: (_previous, tracks) => [...tracks],
    useRef: value => { const ref = { current: firstRef ? audio : value }; firstRef = false; return ref },
    useEffect: effect => effects.push(effect),
  })
  vm.runInContext(component + '\nBackgroundMusic({settings:{volume:' + volume + ',tracks:[{url:"/BGM/one.m4a"},{url:"/BGM/two.m4a"}]}})', context)
  const cleanup = effects.map(effect => effect()).filter(Boolean)
  const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }
  return { audio, window, document, navigator, timers, plays: () => plays,
    async gesture() { window.dispatchEvent(new Event('pointerdown')); await settle() },
    async advance(duration) {
      const target = clock + duration
      while (timers.size) {
        const [key, timer] = [...timers].sort((a, b) => a[1].at - b[1].at)[0]
        if (timer.at > target) break
        clock = timer.at; timers.delete(key); timer.fn(); await settle()
      }
      clock = target
    },
    dispose() { cleanup.forEach(stop => stop()) },
  }
}
const tests = [], test = (name, run) => tests.push({ name, run })
test('muted music never starts a download after a game click', async () => {
  const p = player({ volume: 0 }); await p.gesture(); assert.equal(p.plays(), 0); assert.equal(p.audio.src, undefined); p.dispose()
})
test('hidden and offline pages do not start music requests', async () => {
  for (const options of [{ hidden: true }, { online: false }]) {
    const p = player(options); await p.gesture(); assert.equal(p.plays(), 0); p.dispose()
  }
})
test('hiding pauses music and returning resumes the same track', async () => {
  const p = player(); await p.gesture(); const source = p.audio.src
  p.document.hidden = true; p.document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(p.audio.paused, true)
  p.document.hidden = false; p.document.dispatchEvent(new Event('visibilitychange')); await p.advance(0)
  assert.equal(p.audio.paused, false); assert.equal(p.audio.src, source); p.dispose()
})
test('duplicate errors schedule one retry with at least five seconds of backoff', async () => {
  const p = player(); await p.gesture()
  for (let i = 0; i < 100; i++) p.audio.dispatchEvent(new Event('error'))
  assert.equal(p.timers.size, 1)
  await p.advance(4999); assert.equal(p.plays(), 1)
  await p.advance(1); assert.equal(p.plays(), 2); p.dispose()
})
test('persistent failures stop after four retries rather than cycling the catalog forever', async () => {
  const p = player(); await p.gesture()
  for (let i = 0; i < 12; i++) { p.audio.dispatchEvent(new Event('error')); await p.advance(60_000) }
  assert.equal(p.plays(), 5); assert.equal(p.timers.size, 0); p.dispose()
})
test('pending retries are cancelled on hide and component cleanup', async () => {
  const p = player(); await p.gesture(); p.audio.dispatchEvent(new Event('error'))
  p.document.hidden = true; p.document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(p.timers.size, 0); await p.advance(60_000); assert.equal(p.plays(), 1)
  p.document.hidden = false; p.document.dispatchEvent(new Event('visibilitychange')); await p.advance(0)
  p.audio.dispatchEvent(new Event('error')); p.dispose(); assert.equal(p.timers.size, 0)
})
test('music does not preload an entire file before playback', () => {
  const markup = app.slice(start, end)
  assert(/<audio[^>]*preload="none"/.test(markup), 'Music must avoid eager full-file preloading')
})
let passed = 0
for (const { name, run } of tests) {
  try { await run(); passed++; console.log('PASS ' + name) }
  catch (error) { console.error('FAIL ' + name + ': ' + error.message); process.exitCode = 1 }
}
console.log(`Music network budget: ${passed}/${tests.length} checks passed`)
