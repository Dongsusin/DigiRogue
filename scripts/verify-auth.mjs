import test from 'node:test'
import assert from 'node:assert/strict'
import { createLocalStorage } from '../src/progression/localStorage.js'
import { migrateLegacyLocalProfile } from '../src/progression/localMigration.js'
import { PROFILE_PROGRESS_KEYS, accountStorageKey, importGuestProgress, authErrorMessage } from '../src/auth/profileStorage.js'
const backend = () => { const map = new Map(); return { get length() { return map.size }, key: i => [...map.keys()][i] ?? null,
  getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) } }
test('every progression key is isolated across guest and two Google accounts', () => {
  const raw = backend(), guest = createLocalStorage(raw, { accountIsolation: true }), a = createLocalStorage(raw, { accountId: 'google/a' }), b = createLocalStorage(raw, { accountId: 'google:b' })
  for (const key of PROFILE_PROGRESS_KEYS) { guest.setItem(key, 'guest-' + key); a.setItem(key, 'a-' + key); b.setItem(key, 'b-' + key) }
  for (const key of PROFILE_PROGRESS_KEYS) { assert.equal(guest.getItem(key), 'guest-' + key); assert.equal(a.getItem(key), 'a-' + key); assert.equal(b.getItem(key), 'b-' + key) }
  a.removeItem('digirogue-save-v1'); assert.equal(a.getItem('digirogue-save-v1'), null); assert.equal(b.getItem('digirogue-save-v1'), 'b-digirogue-save-v1'); assert.equal(guest.getItem('digirogue-save-v1'), 'guest-digirogue-save-v1')
  assert.equal(a.key('digirogue-town-v1'), accountStorageKey('google/a', 'digirogue-town-v1'))
})
test('linking a new Google account copies complete guest progress without deleting originals', () => {
  const raw = backend(); for (const key of PROFILE_PROGRESS_KEYS) raw.setItem(key, JSON.stringify({ key, value: 42 }))
  const result = importGuestProgress(raw, 'new-google'); assert.equal(result.copied, true); assert.equal(result.keys.length, PROFILE_PROGRESS_KEYS.length)
  for (const key of PROFILE_PROGRESS_KEYS) assert.equal(raw.getItem(accountStorageKey('new-google', key)), raw.getItem(key))
})
test('linking an existing account never mixes guest data into it', () => {
  const raw = backend(); raw.setItem('digirogue-save-v1', 'guest-save'); raw.setItem(accountStorageKey('old-google', 'digirogue-trainer-skills-v1'), 'owned-skills')
  assert.deepEqual(importGuestProgress(raw, 'old-google'), { copied: false, reason: 'existing-account' }); assert.equal(raw.getItem(accountStorageKey('old-google', 'digirogue-save-v1')), null); assert.equal(raw.getItem('digirogue-save-v1'), 'guest-save')
})
test('a rejected migration write rolls back copied values and preserves guest', () => {
  const raw = backend(); raw.setItem('digirogue-collection-v1', 'guest-dex'); raw.setItem('digirogue-save-v1', 'guest-save'); const write = raw.setItem
  raw.setItem = (key, value) => { if (key === accountStorageKey('quota', 'digirogue-save-v1')) throw new Error('quota'); write(key, value) }
  assert.throws(() => importGuestProgress(raw, 'quota'), /quota/); assert.equal(raw.getItem(accountStorageKey('quota', 'digirogue-collection-v1')), null); assert.equal(raw.getItem('digirogue-collection-v1'), 'guest-dex'); assert.equal(raw.getItem('digirogue-save-v1'), 'guest-save')
})
test('guest recovery does not import another Google account', () => {
  const raw = backend(); raw.setItem(accountStorageKey('other', 'digirogue-trainer-skills-v1'), JSON.stringify({ version: 2, earned: 999, ranks: {} }))
  const guest = createLocalStorage(raw, { accountIsolation: true }); assert.equal(migrateLegacyLocalProfile(guest).ok, true); assert.equal(guest.getItem('digirogue-trainer-skills-v1'), null)
})
test('account migration never scans or changes other profiles', () => {
  const raw = backend(); raw.setItem('digirogue-save-v1', 'guest-save'); const account = createLocalStorage(raw, { accountId: 'a', accountIsolation: true }); assert.equal(migrateLegacyLocalProfile(account).migrated, false); assert.equal(raw.getItem('digirogue-save-v1'), 'guest-save')
})
test('OAuth cancellation and domain errors have actionable player-facing messages', () => {
  assert.match(authErrorMessage({ code: 'auth/popup-closed-by-user' }), /취소/); assert.match(authErrorMessage({ code: 'auth/popup-blocked' }), /팝업/); assert.match(authErrorMessage({ code: 'auth/unauthorized-domain' }), /주소/)
})
