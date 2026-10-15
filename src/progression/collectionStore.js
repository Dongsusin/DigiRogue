import { recordItemDiscoveries } from './itemCollection.js'
import { loadRegionalTrust, recordRegionalTrust, saveRegionalTrust } from './regionalTrustProgress.js'
import { COLLECTION_STORAGE_KEY, normalizeCollection, mergeCollections, collectionAnalysis, collectionUnlockedSpecies, recordGameCollection } from './digimonCollection.js'
import { createLocalStorage } from './localStorage.js'
import { migrateLegacyLocalProfile, recoverSavedCollection } from './localMigration.js'
import { saveScanProgress } from './scanProgress.js'
import { TRAINER_SKILLS_STORAGE_KEY, loadTrainerProgress, saveTrainerProgress } from './trainerSkills.js'
import { loadModeProgress } from './modeProgress.js'
import { LEGACY_TOWN_STORAGE_KEY, migrateTownSkills } from './startingSupport.js'
import { recordAchievements } from './achievements.js'
import { achievementDelta, hasAchievementEvidence, writeAchievementEvidence, readAchievementEvidence } from './achievementOutbox.js'
import { withTrainerTransaction } from './trainerTransactions.js'
import { ACHIEVEMENT_PENDING_STORAGE_KEY, normalizeAchievementState, mergeAchievementState } from './achievementState.js'
const parse = text => { try { return JSON.parse(text ?? 'null') } catch { return null } }

export function createCollectionStore({ storage = createLocalStorage(), now = Date.now, itemCatalog = [] } = {}) {
  let migration = migrateLegacyLocalProfile(storage, now)
  const read = () => parse(storage.getItem(COLLECTION_STORAGE_KEY))
  const collection = recoverSavedCollection(storage, normalizeCollection(read()), now())
  let snapshot = { namespace: storage.namespace, regionalTrust: loadRegionalTrust(storage), collection, analysis: collectionAnalysis(collection),
    unlockedSpecies: collectionUnlockedSpecies(collection), trainerProgress: loadTrainerProgress(storage), ready: true }
  let running = false, recoverTrustEncounters = true, recoverAchievementHistory = true, writingTrainer = false, unsubscribeTrainer
  let pendingEvidence = normalizeAchievementState(parse(storage.getItem(ACHIEVEMENT_PENDING_STORAGE_KEY)))
  const queuedFingerprints = new Set()
  const listeners = new Set()
  const notify = () => listeners.forEach(listener => listener())
  const refreshTrainer = () => {
    const next = loadTrainerProgress(storage)
    if (JSON.stringify(next) !== JSON.stringify(snapshot.trainerProgress)) { snapshot = { ...snapshot, trainerProgress: next }; notify() }
  }
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
    notify()
    return saved
  }
  const publishTrust = state => {
    const latest = loadRegionalTrust(storage, { recoverEncounters: recoverTrustEncounters })
    const next = state ? recordRegionalTrust(latest, state) : latest
    if (!saveRegionalTrust(storage, next)) return false
    recoverTrustEncounters = false
    if (JSON.stringify(next) !== JSON.stringify(snapshot.regionalTrust)) { snapshot = { ...snapshot, regionalTrust: next }; notify() }
    return true
  }
  const writeTrainer = progress => {
    writingTrainer = true
    let saved
    try { saved = saveTrainerProgress(progress, storage) } finally { writingTrainer = false }
    if (saved) refreshTrainer()
    return saved
  }
  const updateTrainerProgress = update => withTrainerTransaction(storage, () => {
    const latest = loadTrainerProgress(storage), result = update(latest)
    if (!result?.ok || !result.progress) return result
    if (JSON.stringify(latest) !== JSON.stringify(result.progress) && !writeTrainer(result.progress)) {
      return { ok: false, error: '스킬 정보를 저장하지 못했습니다. 다시 시도해 주세요.', progress: latest }
    }
    refreshTrainer()
    return result
  })
  const publishAchievements = (state, acquiredItems = []) => {
    // Capture the event when observed, before an asynchronous lock wait can see
    // a later stage or a trust decrease. Only SP calculation reads fresh state.
    const context = { state, acquiredItems, collection: snapshot.collection, trust: snapshot.regionalTrust, itemCatalog, now: now() }
    const states = recoverAchievementHistory ? ['digirogue-save-v1', ...[1, 2, 3].map(n => 'digirogue-save-slot-' + n + '-v1')]
      .map(key => parse(storage.getItem(key))?.gameState).filter(game => Array.isArray(game?.party)) : []
    const observed = recordAchievements(snapshot.trainerProgress, { ...context, states, modes: loadModeProgress(storage, snapshot.trainerProgress) })
    const delta = achievementDelta(snapshot.trainerProgress.achievements, observed.progress.achievements)
    if (hasAchievementEvidence(delta)) {
      pendingEvidence = mergeAchievementState(pendingEvidence, delta)
      const fingerprint = JSON.stringify([Object.keys(delta.completed).sort(), delta.bosses.slice().sort(), delta.rivals.slice().sort(), delta.items.slice().sort()])
      if (!queuedFingerprints.has(fingerprint) && writeAchievementEvidence(storage, delta)) queuedFingerprints.add(fingerprint)
    }
    return withTrainerTransaction(storage, () => {
      const latest = loadTrainerProgress(storage)
      const migrated = migrateTownSkills(latest, parse(storage.getItem(LEGACY_TOWN_STORAGE_KEY)))
      const observedOutbox = readAchievementEvidence(storage)
      const pending = mergeAchievementState(mergeAchievementState(pendingEvidence, parse(storage.getItem(ACHIEVEMENT_PENDING_STORAGE_KEY))), observedOutbox.evidence)
      const result = recordAchievements(migrated, { ...context, states, pending, modes: loadModeProgress(storage, latest) })
      if (JSON.stringify(latest) !== JSON.stringify(result.progress)) {
        pendingEvidence = mergeAchievementState(pending, result.progress.achievements)
        // If the trainer write fails or the page closes, this small outbox keeps
        // the attained condition. The trainer receipt still owns payment once.
        try { storage.setItem(ACHIEVEMENT_PENDING_STORAGE_KEY, JSON.stringify({ version: 1, ...pendingEvidence })) } catch { /* Keep the in-memory retry when storage is full. */ }
        if (!writeTrainer(result.progress)) return false
      }
      pendingEvidence = normalizeAchievementState(null)
      try {
        storage.removeItem(ACHIEVEMENT_PENDING_STORAGE_KEY)
        for (const key of observedOutbox.keys) storage.removeItem(key)
      } catch { /* Paid trainer receipts make a retained outbox harmless. */ }
      recoverAchievementHistory = false
      refreshTrainer()
      return true
    })
  }

  return {
    storage, updateTrainerProgress, getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    configureAchievements(catalog) { itemCatalog = catalog ?? []; return running ? publishAchievements() : true },
    start() {
      if (running) return
      running = true
      unsubscribeTrainer = storage.subscribe?.(key => { if (key === TRAINER_SKILLS_STORAGE_KEY && !writingTrainer) refreshTrainer() })
      if (!migration.ok) migration = migrateLegacyLocalProfile(storage, now)
      publishTrust()
      if (migration.ok) publish(mergeCollections(snapshot.collection, read()))
      publishAchievements()
    },
    recordItems(items, { acquired = false } = {}) {
      return running && publish(recordItemDiscoveries(snapshot.collection, items)) && publishAchievements(null, acquired ? items : [])
    },
    recordGame(state) { return running && publishTrust(state) && publish(recordGameCollection(snapshot.collection, state, now())) && publishAchievements(state) },
    reloadLocal() { if (running) { publishTrust(); publish(mergeCollections(snapshot.collection, read())); publishAchievements() } },
    stop() { running = false; unsubscribeTrainer?.(); unsubscribeTrainer = null },
  }
}
