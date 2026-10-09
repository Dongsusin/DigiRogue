import { TOWN_STORAGE_KEY, loadTown, saveTown, recordTownProgress, applyTownAction } from './townProgress.js'
import { loadRegionalTrust, recordRegionalTrust, saveRegionalTrust } from './regionalTrustProgress.js'
import { COLLECTION_STORAGE_KEY, normalizeCollection, mergeCollections, collectionAnalysis, collectionUnlockedSpecies, recordGameCollection } from './digimonCollection.js'
import { createLocalStorage } from './localStorage.js'
import { migrateLegacyLocalProfile, recoverSavedCollection } from './localMigration.js'
import { saveScanProgress } from './scanProgress.js'

export function createCollectionStore({ storage = createLocalStorage(), now = Date.now } = {}) {
  let migration = migrateLegacyLocalProfile(storage, now)
  const read = () => { try { return JSON.parse(storage.getItem(COLLECTION_STORAGE_KEY) ?? 'null') } catch { return null } }
  const collection = recoverSavedCollection(storage, normalizeCollection(read()), now())
  let snapshot = { namespace: storage.namespace, town: loadTown(storage), regionalTrust: loadRegionalTrust(storage), collection, analysis: collectionAnalysis(collection), unlockedSpecies: collectionUnlockedSpecies(collection), ready: true }
  let running = false
  let recoverTrustEncounters = true
  const listeners = new Set()
  const persist = next => {
    try {
      const raw = JSON.stringify(next)
      if (storage.getItem(COLLECTION_STORAGE_KEY) !== raw) storage.setItem(COLLECTION_STORAGE_KEY, raw)
      return storage.getItem(COLLECTION_STORAGE_KEY) === raw && saveScanProgress(collectionAnalysis(next), storage)
    } catch { return false }
  }
  const publish = next => {
    if (next === snapshot.collection || JSON.stringify(next) === JSON.stringify(snapshot.collection)) return persist(next)
    const saved = persist(next)
    snapshot = { ...snapshot, collection: next, analysis: collectionAnalysis(next), unlockedSpecies: collectionUnlockedSpecies(next) }
    listeners.forEach(listener => listener())
    return saved
  }
  const publishTrust = state => {
    const latest = loadRegionalTrust(storage, { recoverEncounters: recoverTrustEncounters })
    const next = state ? recordRegionalTrust(latest, state) : latest
    if (!saveRegionalTrust(storage, next)) return false
    recoverTrustEncounters = false
    if (JSON.stringify(next) !== JSON.stringify(snapshot.regionalTrust)) {
      snapshot = { ...snapshot, regionalTrust: next }
      listeners.forEach(listener => listener())
    }
    return true
  }
  const latestTown = () => storage.getItem(TOWN_STORAGE_KEY) === null ? snapshot.town : loadTown(storage)
  const publishTown = state => {
    const latest = latestTown()
    const next = state ? recordTownProgress(latest, state) : latest
    if (!saveTown(storage, next)) return false
    if (JSON.stringify(next) !== JSON.stringify(snapshot.town)) {
      snapshot = { ...snapshot, town: next }
      listeners.forEach(listener => listener())
    }
    return true
  }
  return {
    actTown(command) {
      if (!running) return { ok: false, reason: '마을을 준비하고 있습니다.' }
      const result = applyTownAction(latestTown(), loadRegionalTrust(storage), command)
      if (!result.ok) return result
      if (!saveTown(storage, result.town)) return { ok: false, reason: '마을을 저장하지 못했습니다. 저장 공간을 확인한 뒤 다시 시도해 주세요.' }
      snapshot = { ...snapshot, town: result.town }
      listeners.forEach(listener => listener())
      return result
    },
    storage, getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    start() {
      running = true
      if (!migration.ok) migration = migrateLegacyLocalProfile(storage, now)
      publishTrust()
      publishTown()
      if (migration.ok) publish(mergeCollections(snapshot.collection, read()))
    },
    recordGame(state) { return running && publishTrust(state) && publishTown(state) ? publish(recordGameCollection(snapshot.collection, state, now())) : false },
    reloadLocal() { if (running) { publishTrust(); publishTown(); publish(mergeCollections(snapshot.collection, read())) } },
    stop() { running = false },
  }
}
