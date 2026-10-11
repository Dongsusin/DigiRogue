import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { bgmTracks, getSceneBgmTracks } from '../src/audio/bgmCatalog.js'
import { BGM_SCHEMA_VERSION, createDefaultBgmSettings, sanitizeBgmSettings, getEnabledBgmTracks } from '../src/audio/bgmSettings.js'
import { resolveBgmScene } from '../src/audio/bgmScene.js'

const urls = tracks => tracks.map(track => track.url)
const scenes = ['title', 'exploration', 'battle', 'boss', 'rest']
const selected = enabledBgmUrls => sanitizeBgmSettings({ bgmSchemaVersion: BGM_SCHEMA_VERSION, enabledBgmUrls })
const firstCollection = bgmTracks.filter(track => track.introducedIn === 2)
const newCollection = bgmTracks.filter(track => track.introducedIn === 3)

test('ten original AI themes cover every scene with two real OGG assets', () => {
  assert.equal(bgmTracks.length, 10)
  assert.equal(new Set(urls(bgmTracks)).size, 10)
  assert.equal(firstCollection.length, 5)
  assert.equal(newCollection.length, 5)
  assert.deepEqual(new Set(bgmTracks.map(track => track.scene)), new Set(scenes))
  for (const scene of scenes) assert.equal(bgmTracks.filter(track => track.scene === scene).length, 2)
  for (const track of bgmTracks) {
    assert(track.title && track.description, track.url)
    assert(track.url.startsWith('/BGM/ai/'), track.url)
    const bytes = fs.readFileSync(new URL('../public' + track.url, import.meta.url))
    assert(bytes.length > 20_000, track.url + ': missing or trivial audio')
    assert.equal(bytes.subarray(0, 4).toString(), 'OggS', track.url + ': invalid OGG container')
  }
})

test('new and absent settings enable the complete original AI catalog', () => {
  for (const value of [undefined, null, {}, { masterVolume: 55 }]) {
    const settings = sanitizeBgmSettings(value)
    assert.equal(settings.bgmSchemaVersion, BGM_SCHEMA_VERSION)
    assert.deepEqual(urls(getEnabledBgmTracks(settings)), urls(bgmTracks))
  }
  assert.deepEqual(createDefaultBgmSettings(), { bgmSchemaVersion: BGM_SCHEMA_VERSION, enabledBgmUrls: urls(bgmTracks) })
})

test('legacy song and pack settings migrate to AI without reviving removed music', () => {
  for (const value of [
    { enabledBgmUrls: [] },
    { enabledBgmUrls: ['/BGM/Brave Heart.m4a', '/BGM/Butter-Fly.mp4'] },
    { bgmPack: 'digimon', enabledBgmUrls: ['/BGM/Brave Heart.m4a'] },
    { bgmPack: 'ai', enabledBgmUrls: [bgmTracks[0].url] },
  ]) {
    const migrated = sanitizeBgmSettings(value)
    assert.equal(migrated.bgmSchemaVersion, BGM_SCHEMA_VERSION)
    assert.deepEqual(migrated.enabledBgmUrls, urls(bgmTracks))
    assert(!Object.hasOwn(migrated, 'bgmPack'))
    assert(!JSON.stringify(migrated).includes('.m4a'))
  }
})

test('explicit all-off survives JSON save/load and remains silent in every scene', () => {
  const settings = selected([])
  const reloaded = sanitizeBgmSettings(JSON.parse(JSON.stringify(settings)))
  assert.deepEqual(reloaded, settings)
  assert.deepEqual(getEnabledBgmTracks(reloaded), [])
  for (const scene of scenes) assert.deepEqual(getEnabledBgmTracks(reloaded, scene), [])
})

test('five-theme users receive new music once without reviving disabled original songs', () => {
  const oldSelection = [firstCollection[1].url, firstCollection[4].url]
  const migrated = sanitizeBgmSettings({ bgmSchemaVersion: 2, enabledBgmUrls: oldSelection })
  assert.equal(migrated.bgmSchemaVersion, BGM_SCHEMA_VERSION)
  assert.deepEqual(migrated.enabledBgmUrls, [...oldSelection, ...urls(newCollection)])
  for (const disabled of firstCollection.filter(track => !oldSelection.includes(track.url))) {
    assert(!migrated.enabledBgmUrls.includes(disabled.url), 'Disabled original theme was restored: ' + disabled.url)
  }
  assert.deepEqual(sanitizeBgmSettings(migrated), migrated)
  assert.deepEqual(sanitizeBgmSettings(JSON.parse(JSON.stringify(migrated))), migrated)
})

test('version-two all-off remains off after adding five new themes', () => {
  const migrated = sanitizeBgmSettings({ bgmSchemaVersion: 2, enabledBgmUrls: [] })
  assert.deepEqual(migrated, { bgmSchemaVersion: BGM_SCHEMA_VERSION, enabledBgmUrls: [] })
  assert.deepEqual(getEnabledBgmTracks(migrated), [])
  for (const scene of scenes) assert.deepEqual(getEnabledBgmTracks(migrated, scene), [])
})

test('new songs disabled after migration stay disabled on every later reload', () => {
  const migrated = sanitizeBgmSettings({ bgmSchemaVersion: 2, enabledBgmUrls: urls(firstCollection) })
  const saved = { ...migrated, enabledBgmUrls: [firstCollection[0].url, newCollection[2].url] }
  const reloaded = sanitizeBgmSettings(JSON.parse(JSON.stringify(saved)))
  assert.deepEqual(reloaded, saved)
  assert.deepEqual(urls(getEnabledBgmTracks(reloaded)), saved.enabledBgmUrls)
  assert.deepEqual(sanitizeBgmSettings(reloaded), reloaded)
})

test('current-schema song selections survive save/load without re-enabling other themes', () => {
  const initial = selected([bgmTracks[2].url, bgmTracks[4].url])
  const reloaded = sanitizeBgmSettings(JSON.parse(JSON.stringify(initial)))
  assert.deepEqual(reloaded, initial)
  assert.deepEqual(urls(getEnabledBgmTracks(reloaded)), [bgmTracks[2].url, bgmTracks[4].url])
})

test('corrupt settings reject unknown and removed URLs and deduplicate valid selections', () => {
  const settings = selected([bgmTracks[0].url, bgmTracks[0].url, '/BGM/unknown.ogg', '/BGM/Brave Heart.m4a', 1, null])
  assert.deepEqual(settings.enabledBgmUrls, [bgmTracks[0].url])
  for (const value of [0, 'corrupt', [], { bgmSchemaVersion: BGM_SCHEMA_VERSION, enabledBgmUrls: 'corrupt' }]) {
    const sanitized = sanitizeBgmSettings(value)
    assert.equal(sanitized.bgmSchemaVersion, BGM_SCHEMA_VERSION)
    assert(Array.isArray(sanitized.enabledBgmUrls))
    assert(sanitized.enabledBgmUrls.every(url => urls(bgmTracks).includes(url)))
  }
})

test('scene themes and fallback respect every disabled-song preference', () => {
  const defaults = createDefaultBgmSettings()
  for (const scene of scenes) {
    assert.deepEqual(getEnabledBgmTracks(defaults, scene).map(track => track.scene), [scene, scene])
    const enabled = bgmTracks.filter(track => track.scene !== scene)
    const result = getEnabledBgmTracks(selected(urls(enabled)), scene)
    assert.deepEqual(urls(result), urls(enabled))
    assert(result.every(track => track.scene !== scene))
  }
  assert.deepEqual(getSceneBgmTracks([], 'battle'), [])
})

test('normalization is idempotent and never mutates caller preferences', () => {
  const input = { bgmSchemaVersion: BGM_SCHEMA_VERSION, enabledBgmUrls: [bgmTracks[2].url, bgmTracks[1].url] }
  const before = JSON.stringify(input)
  const once = sanitizeBgmSettings(input)
  assert.equal(JSON.stringify(input), before)
  assert.deepEqual(sanitizeBgmSettings(once), once)
  const first = createDefaultBgmSettings(), second = createDefaultBgmSettings()
  first.enabledBgmUrls.length = 0
  assert.equal(second.enabledBgmUrls.length, 10)
})

test('the shipped BGM folder and resource manifest contain no legacy audio', () => {
  const files = fs.readdirSync(new URL('../public/BGM/', import.meta.url), { recursive: true })
  assert(!files.some(file => /\.(?:m4a|mp4)$/i.test(file)), 'Removed Digimon audio still ships')
  assert.equal(files.filter(file => file.endsWith('.ogg')).length, 10)
  const versions = JSON.parse(fs.readFileSync(new URL('../src/data/resourceVersions.json', import.meta.url)))
  const music = Object.keys(versions).filter(url => url.startsWith('/BGM/'))
  assert.deepEqual(music.sort(), urls(bgmTracks).sort())
})

test('menu and town select their scene themes before unrelated battle state', () => {
  assert.equal(resolveBgmScene({}), 'title')
  const gameState = { enemies: [{ isBoss: true, currentHp: 100 }] }
  assert.equal(resolveBgmScene({ screenMode: 'town', gameState }), 'rest')
  assert.equal(resolveBgmScene({ screenMode: 'collection', gameState }), 'title')
  assert.equal(resolveBgmScene({ screenMode: 'adventure', gameState, rewardState: {} }), 'rest')
  assert.equal(resolveBgmScene({ screenMode: 'adventure', gameState, mapSelectionState: {} }), 'exploration')
})

test('story choices use exploration or rest music while event battles use combat music', () => {
  const state = (theme, phase) => ({ screenMode: 'adventure', gameState: {
    enemies: [{ currentHp: 100 }], explorationEvent: { theme, phase },
  } })
  assert.equal(resolveBgmScene(state('town', 'choice')), 'rest')
  assert.equal(resolveBgmScene(state('quest', 'choice')), 'exploration')
  assert.equal(resolveBgmScene(state('town', 'battle')), 'battle')
  assert.equal(resolveBgmScene(state('quest', 'battle')), 'battle')
})

test('boss encounter music survives the leader defeat while companions remain', () => {
  for (const leader of [{ isBoss: true, currentHp: 0 }, { bossEncounter: { leader: true }, currentHp: 0 }]) {
    assert.equal(resolveBgmScene({ screenMode: 'adventure', gameState: {
      enemies: [leader, { currentHp: 100 }],
    } }), 'boss')
  }
})
