import test from 'node:test'
import assert from 'node:assert/strict'
import { createBgmHarness } from './lib/bgm-player-harness.mjs'

test('playback waits for a gesture and uses one versioned media source', async () => {
  const p = createBgmHarness()
  assert.equal(p.audio.src, undefined)
  assert.equal(p.plays(), 0)
  await p.gesture()
  assert.equal(p.plays(), 1)
  assert.match(p.audio.src, /^\/BGM\/ai\/.+\.ogg\?v=[a-f0-9]{16}$/)
  assert.equal(p.assignments.length, 1)
  assert(p.statuses.some(status => status.state === 'playing'))
  await p.dispose()
})

test('ordinary rerenders, settings clicks, and volume edits do not reload playing music', async () => {
  const p = createBgmHarness(); await p.gesture()
  const source = p.audio.src
  await p.update({ tracks: [{ url: '/BGM/ai/one.ogg' }, { url: '/BGM/ai/two.ogg' }] })
  await p.update({ volume: 0.4 })
  for (let n = 0; n < 10; n++) await p.gesture()
  assert.equal(p.audio.src, source)
  assert.equal(p.assignments.length, 1)
  assert.equal(p.plays(), 1)
  assert.equal(p.audio.volume, 0.4)
  await p.dispose()
})

test('new scenes replace the current source and disabled songs cannot remain playing', async () => {
  const p = createBgmHarness(); await p.gesture()
  await p.update({ contextKey: 'battle', tracks: [{ url: '/BGM/ai/battle.ogg' }] })
  assert.equal(p.audio.src, '/BGM/ai/battle.ogg?v=0123456789abcdef')
  assert.equal(p.assignments.length, 2)
  await p.update({ tracks: [{ url: '/BGM/ai/rest.ogg' }] })
  assert.equal(p.audio.src, '/BGM/ai/rest.ogg?v=0123456789abcdef')
  assert.equal(p.assignments.length, 3)
  await p.dispose()
})

test('all-off stops media, removes its source, and ignores later gestures', async () => {
  const p = createBgmHarness(); await p.gesture()
  await p.update({ tracks: [] })
  assert.equal(p.audio.paused, true)
  assert.equal(p.audio.src, undefined)
  const plays = p.plays(); await p.gesture(); await p.advance(10_000)
  assert.equal(p.plays(), plays)
  assert.equal(p.statuses.at(-1).state, 'off')
  await p.dispose()
})

test('mute and visibility suspension retain the current song and resume without reloading', async () => {
  const p = createBgmHarness(); await p.gesture()
  const source = p.audio.src
  p.audio.currentTime = 25
  await p.update({ volume: 0 })
  assert(p.audio.paused)
  await p.gesture(); assert.equal(p.plays(), 1)
  await p.update({ volume: 0.5 })
  assert(!p.audio.paused)
  assert.equal(p.audio.src, source)
  assert.equal(p.audio.currentTime, 25)
  assert.equal(p.assignments.length, 1)
  await p.dispose()
})

test('preview uses the same audio element and restores the previous song position', async () => {
  const p = createBgmHarness(); await p.gesture()
  const source = p.audio.src; p.audio.currentTime = 32
  await p.update({ previewTrack: { url: '/BGM/ai/preview.ogg' } })
  assert.equal(p.audio.src, '/BGM/ai/preview.ogg?v=0123456789abcdef')
  assert.equal(p.audio.currentTime, 0)
  assert.equal(p.statuses.at(-1).isPreview, true)
  await p.emit(p.audio, 'ended')
  assert.equal(p.previews.length, 1)
  await p.update({ previewTrack: null })
  assert.equal(p.audio.src, source)
  assert.equal(p.audio.currentTime, 32)
  assert.equal(p.statuses.at(-1).isPreview, false)
  await p.dispose()
})

test('AI themes fade in, fade out near the end, and cycle using only enabled music', async () => {
  const p = createBgmHarness({ volume: 0.7 }); await p.gesture()
  assert.equal(p.audio.volume, 0)
  await p.advance(1200)
  assert(Math.abs(p.audio.volume - 0.7) < 0.001)
  const first = p.audio.src
  p.audio.currentTime = 98
  await p.emit(p.audio, 'timeupdate'); await p.advance(2100)
  assert.equal(p.audio.volume, 0)
  await p.emit(p.audio, 'ended')
  assert.notEqual(p.audio.src, first)
  assert.match(p.audio.src, /^\/BGM\/ai\/(one|two)\.ogg/)
  await p.dispose()
})

test('a single scene theme loops without fading at its seam while previews still end', async () => {
  const p = createBgmHarness({ tracks: [{ url: '/BGM/ai/title.ogg' }], volume: 0.6 })
  await p.gesture(); await p.advance(1200)
  assert.equal(p.audio.loop, true)
  const source = p.audio.src
  p.audio.currentTime = 98
  await p.emit(p.audio, 'timeupdate'); await p.advance(2100)
  assert(Math.abs(p.audio.volume - 0.6) < 0.001, 'A loop seam must not fade to silence')
  assert.equal(p.assignments.length, 1)
  await p.update({ previewTrack: { url: '/BGM/ai/preview.ogg' } })
  assert.equal(p.audio.loop, false)
  await p.emit(p.audio, 'ended')
  assert.equal(p.previews.length, 1)
  await p.update({ previewTrack: null })
  assert.equal(p.audio.src, source)
  assert.equal(p.audio.loop, true)
  await p.dispose()
})

test('disabling all but the current theme restores its loop volume without reloading', async () => {
  const p = createBgmHarness({ volume: 0.7 }); await p.gesture(); await p.advance(1200)
  const url = p.audio.src.split('?')[0]
  p.audio.currentTime = 98
  await p.emit(p.audio, 'timeupdate'); await p.advance(600)
  assert(p.audio.volume < 0.7)
  await p.update({ tracks: [{ url }] })
  assert.equal(p.audio.loop, true)
  assert(Math.abs(p.audio.volume - 0.7) < 0.001)
  assert.equal(p.assignments.length, 1)
  await p.update({ tracks: [{ url }, { url: '/BGM/ai/another.ogg' }] })
  assert.equal(p.audio.loop, false)
  assert.equal(p.assignments.length, 1)
  await p.dispose()
})

test('a rejected autoplay request remains paused and can recover on a later user gesture', async () => {
  const p = createBgmHarness({ playError: Error('autoplay blocked') }); await p.gesture()
  assert(p.audio.paused)
  assert.equal(p.statuses.at(-1).state, 'blocked')
  const source = p.audio.src
  p.audio.play = function () { this.paused = false; return Promise.resolve() }
  await p.gesture()
  assert(!p.audio.paused)
  assert.equal(p.audio.src, source)
  assert.equal(p.assignments.length, 1)
  await p.dispose()
})

test('an explicit retry can recover after the automatic request budget is exhausted', async () => {
  const p = createBgmHarness(); await p.gesture()
  for (let n = 0; n < 5; n++) {
    await p.emit(p.audio, 'error'); await p.advance(60_000)
  }
  assert.equal(p.plays(), 5)
  assert.equal(p.timers.size, 0)
  p.player.retry(); await p.advance(0)
  assert.equal(p.plays(), 6)
  assert.equal(p.assignments.length, 6)
  assert.equal(p.statuses.at(-1).state, 'playing')
  await p.dispose()
})

test('late play completion cannot revive a disposed player or a previous scene', async () => {
  const p = createBgmHarness()
  const pending = []
  p.audio.play = function () { return new Promise(resolve => pending.push(resolve)) }
  await p.gesture()
  for (let n = 0; n < 5; n++) await p.gesture()
  await p.update({ volume: 0.8 })
  assert.equal(pending.length, 1, 'Repeated input must not duplicate a pending play request')
  await p.update({ contextKey: 'rest', tracks: [{ url: '/BGM/ai/rest.ogg' }] })
  assert.equal(pending.length, 2)
  pending[0](); await Promise.resolve(); await Promise.resolve()
  assert.equal(p.audio.src, '/BGM/ai/rest.ogg?v=0123456789abcdef')
  await p.dispose()
  pending[1](); await Promise.resolve(); await Promise.resolve()
  assert(p.audio.paused)
  assert.equal(p.timers.size, 0)
  assert.equal(p.frames.size, 0)
})
