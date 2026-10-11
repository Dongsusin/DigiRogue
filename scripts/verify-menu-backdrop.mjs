import test from 'node:test'
import assert from 'node:assert/strict'
import { createMenuBackgroundRotation, pickNextBackgroundIndex, loadMenuBackground, MAP_ROTATION_MS, MAP_FADE_MS } from '../src/components/menuBackdrop.js'

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }
function clock() {
  let now = 0, id = 0
  const timers = new Map()
  return {
    setTimer(fn, delay) { const key = ++id; timers.set(key, { at: now + delay, fn }); return key },
    clearTimer(key) { timers.delete(key) },
    async advance(ms) {
      const end = now + ms
      while (true) {
        const next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0]
        if (!next || next[1].at > end) break
        now = next[1].at; timers.delete(next[0]); next[1].fn(); await flush()
      }
      now = end; await flush()
    },
  }
}
function fixture(options = {}) {
  const time = clock(), changes = [], requests = []
  const rotation = createMenuBackgroundRotation({ urls: ['a', 'b', 'c'], initialIndex: 0,
    onChange: state => changes.push(state), loadImage: url => { requests.push(url); return true },
    random: () => 0, ...time, ...options })
  return { time, changes, requests, rotation }
}

test('rotation chooses another map without a retry loop even at random endpoints', () => {
  assert.equal(pickNextBackgroundIndex(0), 0)
  assert.equal(pickNextBackgroundIndex(1, 0), 0)
  for (let current = 0; current < 34; current++) {
    for (const sample of [0, .5, 1]) {
      const next = pickNextBackgroundIndex(34, current, () => sample)
      assert(next >= 0 && next < 34)
      assert.notEqual(next, current)
    }
  }
})
test('preloads during the dwell, fades only after decode, and rotates continuously', async () => {
  let ready
  const f = fixture({ loadImage: () => new Promise(resolve => { ready = resolve }) })
  await flush(); await f.time.advance(MAP_ROTATION_MS)
  assert.equal(f.changes.length, 0)
  ready(true); await flush()
  assert.deepEqual(f.changes[0], { previousIndex: 0, activeIndex: 1, isFading: true })
  await f.time.advance(MAP_FADE_MS)
  assert.deepEqual(f.changes[1], { previousIndex: 1, activeIndex: 1, isFading: false })
  ready(true); await flush(); await f.time.advance(MAP_ROTATION_MS)
  assert.deepEqual(f.changes[2], { previousIndex: 1, activeIndex: 0, isFading: true })
  f.rotation.dispose()
})
test('failed map loading retains the last good background and retries next cycle', async () => {
  let success = false
  const f = fixture({ loadImage: () => success })
  await flush(); await f.time.advance(MAP_ROTATION_MS)
  assert.equal(f.changes.length, 0)
  success = true; await f.time.advance(MAP_ROTATION_MS * 2)
  assert(f.changes.some(state => state.isFading))
  f.rotation.dispose()
})
test('hidden tabs stop rotation and return to a fresh full dwell when visible', async () => {
  const f = fixture()
  await flush(); await f.time.advance(5000)
  f.rotation.setPaused(true)
  await f.time.advance(60000)
  assert.equal(f.changes.length, 0)
  f.rotation.setPaused(false); await flush()
  await f.time.advance(MAP_ROTATION_MS - 1); assert.equal(f.changes.length, 0)
  await f.time.advance(1); assert.equal(f.changes[0].isFading, true)
  f.rotation.dispose()
})
test('pausing a fade settles the visible map and ignores obsolete image loads', async () => {
  const f = fixture()
  await flush(); await f.time.advance(MAP_ROTATION_MS)
  f.rotation.setPaused(true)
  assert.deepEqual(f.changes.at(-1), { previousIndex: 1, activeIndex: 1, isFading: false })
  await f.time.advance(60000); assert.equal(f.changes.length, 2)
  f.rotation.dispose()
  let ready
  const pending = fixture({ loadImage: () => new Promise(resolve => { ready = resolve }) })
  await flush(); await pending.time.advance(MAP_ROTATION_MS)
  pending.rotation.setPaused(true); ready(true); await flush()
  assert.equal(pending.changes.length, 0); pending.rotation.dispose()
})
test('unmount cancels pending decode and fade callbacks', async () => {
  let ready
  const f = fixture({ loadImage: () => new Promise(resolve => { ready = resolve }) })
  await flush(); await f.time.advance(MAP_ROTATION_MS)
  f.rotation.dispose(); ready(true); await flush(); await f.time.advance(60000)
  assert.equal(f.changes.length, 0)
  const fading = fixture(); await flush(); await fading.time.advance(MAP_ROTATION_MS)
  fading.rotation.dispose(); await fading.time.advance(60000)
  assert.equal(fading.changes.length, 1)
})
test('one-map menus need no rotation timer or duplicate download', async () => {
  const f = fixture({ urls: ['a'] })
  await f.time.advance(60000)
  assert.deepEqual(f.requests, []); assert.deepEqual(f.changes, []); f.rotation.dispose()
})
test('image loader waits for decoding, rejects errors and bounds stalled requests', async () => {
  let instance, finishDecode
  class FakeImage {
    constructor() { instance = this; this.naturalWidth = 640 }
    decode() { return new Promise(resolve => { finishDecode = resolve }) }
  }
  const loading = loadMenuBackground('map.png', { ImageClass: FakeImage })
  let loaded = false; loading.then(() => { loaded = true })
  instance.onload(); await flush(); assert.equal(loaded, false)
  finishDecode(); assert.equal(await loading, true)
  const failing = loadMenuBackground('bad.png', { ImageClass: FakeImage })
  instance.onerror(); assert.equal(await failing, false)
  assert.equal(await loadMenuBackground('stalled.png', { ImageClass: FakeImage, timeoutMs: 10 }), false)
})
