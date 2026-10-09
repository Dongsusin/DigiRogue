import { accountStorageKey } from '../auth/profileStorage.js'
import { createLauncherStorage, ensureLocalGuest } from './launcherStorage.js'

let launcherStorage = null
export function initializeLauncherStorage() {
  let previous
  try { previous = window.localStorage } catch { /* Native saves can work without a browser migration source. */ }
  if (window.auroraGame && !launcherStorage) launcherStorage = createLauncherStorage(window.auroraGame, previous)
  ensureLocalGuest(launcherStorage ?? previous)
}
export function browserStorage() {
  if (typeof window === 'undefined') return null
  if (window.auroraGame) {
    if (!launcherStorage) throw new Error('로컬 저장 파일을 준비하고 있습니다.')
    return launcherStorage
  }
  try { return window.localStorage } catch { return null }
}

// A synchronous Storage backend can later be supplied by the launcher. The game
// keeps guest keys intact; Google accounts have independent UID-scoped records.
export function createLocalStorage(storage = browserStorage(), { namespace = null, accountId = null, accountIsolation = false } = {}) {
  const memory = new Map(), listeners = new Set()
  const key = name => namespace ? `digirogue-preview:${encodeURIComponent(namespace)}:${name}` : accountId ? accountStorageKey(accountId, name) : name
  return {
    namespace: namespace ?? (accountId ? `account:${accountId}` : null),
    accountIsolation,
    persistent: Boolean(storage),
    key,
    keys() {
      if (!storage) return [...memory.keys()]
      return Array.from({ length: storage.length ?? 0 }, (_, index) => storage.key(index)).filter(Boolean)
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    getItem(name) {
      try {
        const value = storage ? storage.getItem(key(name)) : memory.get(name) ?? null
        if (value === null) memory.delete(name)
        else memory.set(name, value)
        return value
      } catch { return memory.get(name) ?? null }
    },
    setItem(name, value) {
      const text = String(value)
      // Do not cache or announce a rejected write as a successful save.
      if (storage) storage.setItem(key(name), text)
      memory.set(name, text)
      listeners.forEach(listener => listener(name))
    },
    removeItem(name) {
      if (storage) storage.removeItem(key(name))
      memory.delete(name)
      listeners.forEach(listener => listener(name))
    },
  }
}
