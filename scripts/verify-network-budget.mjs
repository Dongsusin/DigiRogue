import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createBgmHarness as player } from './lib/bgm-player-harness.mjs'

// Run the shipping player with browser/media boundaries replaced. A separate
// browser check verifies codec decoding and the live React settings controls.
const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const start = app.indexOf('const BackgroundMusic =')
const end = app.indexOf('\nconst ButtonClickSound', start)
const tests = [], test = (name, run) => tests.push({ name, run })

test('muted music never starts a download after a game click', async () => {
  const p = player({ volume: 0 }); await p.gesture(); assert.equal(p.plays(), 0); assert.equal(p.audio.src, undefined); p.dispose()
})

test('hidden and offline pages do not start music requests', async () => {
  for (const options of [{ hidden: true }, { online: false }]) {
    const p = player(options); await p.gesture(); assert.equal(p.plays(), 0); assert.equal(p.audio.src, undefined); p.dispose()
  }
})

test('hiding pauses music and returning resumes the same track', async () => {
  const p = player(); await p.gesture(); const source = p.audio.src
  p.document.hidden = true; await p.emit(p.document, 'visibilitychange')
  assert.equal(p.audio.paused, true)
  p.document.hidden = false; await p.emit(p.document, 'visibilitychange')
  assert.equal(p.audio.paused, false); assert.equal(p.audio.src, source); assert.equal(p.assignments.length, 1); p.dispose()
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
  p.document.hidden = true; await p.emit(p.document, 'visibilitychange')
  assert.equal(p.timers.size, 0); await p.advance(60_000); assert.equal(p.plays(), 1)
  p.document.hidden = false; await p.emit(p.document, 'visibilitychange')
  p.audio.dispatchEvent(new Event('error')); p.dispose(); assert.equal(p.timers.size, 0); assert.equal(p.frames.size, 0)
})

test('music does not preload an entire file before playback', () => {
  const markup = app.slice(start, end)
  assert(/<audio[^>]*preload="none"/.test(markup), 'Music must avoid eager full-file preloading')
  assert(markup.includes('new BgmPlayer('), 'The live component must use the tested player')
})

let passed = 0
for (const { name, run } of tests) {
  try { await run(); passed++; console.log('PASS ' + name) }
  catch (error) { console.error('FAIL ' + name + ': ' + error.message); process.exitCode = 1 }
}
console.log(`Music network budget: ${passed}/${tests.length} checks passed`)
