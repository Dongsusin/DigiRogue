import test from 'node:test'
import assert from 'node:assert/strict'
import * as saves from '../src/progression/saveSlots.js'
import { createLocalStorage } from '../src/progression/localStorage.js'
import { createLauncherStorage } from '../src/progression/launcherStorage.js'
import { PROFILE_PROGRESS_KEYS } from '../src/auth/profileStorage.js'

const backend = () => {
  const values = new Map()
  return { get length() { return values.size }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key) }
}
const state = { currentStage: 12, currentMap: '미하라시 산', party: [{ id: 'a', name: '아구몬' }] }
const parse = raw => JSON.parse(raw).gameState
const seed = store => {
  for (const key of PROFILE_PROGRESS_KEYS) store.setItem(key, 'profile-' + key)
  for (const slot of saves.SAVE_SLOTS) assert.equal(saves.writeSaveSlot(store, slot.id, state), true)
}
const snapshot = store => Object.fromEntries(PROFILE_PROGRESS_KEYS.map(key => [key, store.getItem(key)]))

for (const target of saves.SAVE_SLOTS) test('deleting ' + target.id + ' empties only that snapshot and keeps profile progress', () => {
  const raw = backend(), store = createLocalStorage(raw)
  seed(store)
  const before = snapshot(store)
  assert.equal(saves.deleteSaveSlot?.(store, target.id), true)
  assert.equal(saves.readSaveSlot(store, target.id, parse).status, 'empty')
  for (const [key, value] of Object.entries(before)) assert.equal(store.getItem(key), key === target.key ? null : value)
  assert.equal(saves.deleteSaveSlot(store, target.id), true)
  assert.equal(saves.writeSaveSlot(store, target.id, state), true)
  assert.equal(saves.readSaveSlot(store, target.id, parse).status, 'ready')
})

test('invalid JSON saves can be cleared and stay empty when storage is reopened', () => {
  const raw = backend(), store = createLocalStorage(raw)
  store.setItem(saves.getSaveSlotKey('manual-1'), '{broken')
  assert.equal(saves.readSaveSlot(store, 'manual-1', parse).status, 'invalid')
  assert.equal(saves.deleteSaveSlot?.(store, 'manual-1'), true)
  assert.equal(saves.readSaveSlot(createLocalStorage(raw), 'manual-1', parse).status, 'empty')
})

test('unknown or omitted IDs never fall back to deleting automatic save or arbitrary keys', () => {
  const store = createLocalStorage(backend()); seed(store)
  const before = snapshot(store)
  for (const id of [undefined, null, '', 'manual-4', 'digirogue-trainer-skills-v1', '__proto__']) {
    assert.equal(saves.deleteSaveSlot?.(store, id), false)
    assert.deepEqual(snapshot(store), before)
  }
})

test('denied deletion reports failure without changing the previous snapshot', () => {
  const raw = backend(), store = createLocalStorage(raw); seed(store)
  const before = snapshot(store)
  raw.removeItem = () => { throw new Error('denied') }
  assert.equal(saves.deleteSaveSlot?.(store, 'manual-2'), false)
  assert.deepEqual(snapshot(store), before)
})

test('an ignored backend deletion is not announced as success', () => {
  const raw = backend(), store = createLocalStorage(raw); seed(store)
  const before = snapshot(store)
  raw.removeItem = () => {}
  assert.equal(saves.deleteSaveSlot?.(store, 'auto'), false)
  assert.deepEqual(snapshot(store), before)
})

test('missing and nonpersistent storage cannot report a successful deletion', () => {
  assert.equal(saves.deleteSaveSlot?.(null, 'auto'), false)
  const store = createLocalStorage(null)
  store.setItem(saves.getSaveSlotKey('auto'), 'memory-save')
  assert.equal(saves.deleteSaveSlot?.(store, 'auto'), false)
  assert.equal(store.getItem(saves.getSaveSlotKey('auto')), 'memory-save')
})

test('a Google account deletion preserves guest and other account saves', () => {
  const raw = backend(), guest = createLocalStorage(raw), a = createLocalStorage(raw, { accountId: 'a/one' }), b = createLocalStorage(raw, { accountId: 'b:two' })
  for (const store of [guest, a, b]) seed(store)
  const guestBefore = snapshot(guest), bBefore = snapshot(b)
  assert.equal(saves.deleteSaveSlot?.(a, 'manual-3'), true)
  assert.equal(a.getItem(saves.getSaveSlotKey('manual-3')), null)
  assert.deepEqual(snapshot(guest), guestBefore); assert.deepEqual(snapshot(b), bBefore)
})

test('launcher deletion persists through recreating both native and profile adapters', () => {
  let data = {}
  const bridge = { version: 1, gameId: 'digilog', readStorage: () => ({ ...data }),
    initializeStorage: value => (data = { ...value }), setItem: (key, value) => { data[key] = String(value) },
    removeItem: key => { delete data[key] } }
  const store = createLocalStorage(createLauncherStorage(bridge))
  seed(store); const before = snapshot(store)
  assert.equal(saves.deleteSaveSlot?.(store, 'auto'), true)
  const reopened = createLocalStorage(createLauncherStorage(bridge))
  for (const [key, value] of Object.entries(before)) assert.equal(reopened.getItem(key), key === saves.getSaveSlotKey('auto') ? null : value)
})
