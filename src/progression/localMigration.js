import { COLLECTION_STORAGE_KEY, normalizeCollection, recordGameCollection, collectionAnalysis } from './digimonCollection.js'
import { SCAN_PROGRESS_STORAGE_KEY, loadScanProgress } from './scanProgress.js'
import { migrateSavedDigimonNames, DIGIMON_NAME_REVISION } from '../data/digimonNames.js'
import { normalizeAnalysis } from '../battle/digimonAnalysis.js'

export const LOCAL_MIGRATION_KEY = 'digirogue-local-migration-v1'
export const LOCAL_PROGRESS_KEYS = Object.freeze([
  COLLECTION_STORAGE_KEY, SCAN_PROGRESS_STORAGE_KEY, 'digirogue-trainer-skills-v1', 'digirogue-modes-v1',
  'digirogue-save-v1', ...[1, 2, 3].map(index => `digirogue-save-slot-${index}-v1`), 'digirogue-settings-v1',
])
const object = value => value && typeof value === 'object' && !Array.isArray(value)
const isSave = key => key === 'digirogue-save-v1' || /^digirogue-save-slot-[1-3]-v1$/.test(key)
const parse = text => { try { return JSON.parse(text ?? 'null') } catch { return null } }
const valid = (key, data) => {
  if (!object(data)) return false
  if (isSave(key)) {
    const run = data.gameState ?? data
    return object(run) && Number.isSafeInteger(run.currentStage) && run.currentStage > 0 && Array.isArray(run.party)
  }
  if (key === COLLECTION_STORAGE_KEY) return data.version === 1 && object(data.species)
  if (key === SCAN_PROGRESS_STORAGE_KEY) return data.version === 1 && object(data.analysis)
  if (key === 'digirogue-trainer-skills-v1') return [1, 2].includes(data.version) && (object(data.learned) || object(data.ranks))
  if (key === 'digirogue-modes-v1') return data.version === 1
  return ['gameSpeed', 'masterVolume', 'sfxVolume', 'enabledBgmUrls'].some(field => Object.hasOwn(data, field))
}
function writeVerified(storage, key, text) {
  storage.setItem(key, text)
  if (storage.getItem(key) !== text) throw new Error('Local migration write was not retained')
}
function preserveInvalid(storage, key, text) {
  const base = `digirogue-local-recovery-v1:${key}`
  let backup = base, index = 0
  while (storage.getItem(backup) !== null && storage.getItem(backup) !== text) backup = `${base}:${++index}`
  writeVerified(storage, backup, text)
}

// Every saved party is evidence of an acquisition, including saves made before
// a dex existed. Restore these additive unlocks even if a valid but incomplete
// dex was already present. Old run scan values are deliberately not imported.
export function recoverSavedCollection(storage, collection, now = Date.now()) {
  let recovered = collection
  for (const key of LOCAL_PROGRESS_KEYS.filter(isSave)) {
    let data
    try { data = parse(storage.getItem(key)) } catch { continue }
    if (!valid(key, data)) continue
    const run = data.gameState ?? data
    const units = list => (Array.isArray(list) ? list : []).filter(object).map(unit => ({ ...unit,
      evolutionHistory: Array.isArray(unit.evolutionHistory) ? unit.evolutionHistory : [] }))
    const history = migrateSavedDigimonNames({ inventory: run.inventory, digimonNameRevision: run.digimonNameRevision,
      gameMode: run.gameMode, dailyStarterNames: Array.isArray(run.dailyStarterNames) ? run.dailyStarterNames : [],
      party: units(run.party), player: object(run.player) ? units([run.player])[0] : null,
      enemies: units(run.enemies), unlockedSpecies: Array.isArray(run.unlockedSpecies) ? run.unlockedSpecies : [] })
    recovered = recordGameCollection(recovered, history, now)
  }
  let bank
  try { bank = parse(storage.getItem(SCAN_PROGRESS_STORAGE_KEY)) } catch { return recovered }
  if (valid(SCAN_PROGRESS_STORAGE_KEY, bank)) {
    const analysis = normalizeAnalysis(bank.analysis, { legacy: bank.digimonNameRevision !== DIGIMON_NAME_REVISION })
    const species = { ...recovered.species }
    for (const [name, value] of Object.entries(analysis)) {
      const previous = species[name]
      if (previous?.unlocked || (previous?.seen && previous.scan.value === value)) continue
      species[name] = { nameRevision: DIGIMON_NAME_REVISION, seen: true, unlocked: false,
        scan: { value, revision: Math.max((previous?.scan.revision ?? 0) + 1, now) } }
    }
    // The permanent bank is authoritative even when it contains zero. Only
    // acquired species are removed; stale run snapshots never replenish it.
    recovered = normalizeCollection({ ...recovered, version: 1, species })
  }
  return recovered
}

// One-time, non-destructive import of records that older versions placed under
// a login UID. Original records remain intact; current local records win.
export function migrateLegacyLocalProfile(storage, now = Date.now) {
  if (!storage?.persistent || storage.namespace) return { ok: true, migrated: false }
  try {
    if (parse(storage.getItem(LOCAL_MIGRATION_KEY))?.version === 1) return { ok: true, migrated: false }
    const hasUnscopedHistory = LOCAL_PROGRESS_KEYS.some(key =>
      (isSave(key) || key === SCAN_PROGRESS_STORAGE_KEY) && valid(key, parse(storage.getItem(key))))
    const rebuildUnscopedDex = hasUnscopedHistory && !valid(COLLECTION_STORAGE_KEY, parse(storage.getItem(COLLECTION_STORAGE_KEY)))
    const groups = new Map()
    for (const fullKey of storage.accountIsolation ? [] : storage.keys()) {
      const match = /^digirogue-account:([^:]+):(.+)$/.exec(fullKey)
      if (!match || !LOCAL_PROGRESS_KEYS.includes(match[2])) continue
      let oldId
      try { oldId = decodeURIComponent(match[1]) } catch { continue }
      // Developer fixtures were never a player's progress.
      if (/(?:^|-)qa(?:-|$)|^entry-fixture(?:-|$)/i.test(oldId)) continue
      const text = storage.getItem(fullKey), data = parse(text)
      if (!valid(match[2], data)) continue
      const prefix = `digirogue-account:${match[1]}:`
      if (!groups.has(prefix)) groups.set(prefix, { records: new Map(), latestSave: 0, progress: 0, prefix })
      const group = groups.get(prefix)
      group.records.set(match[2], text)
      if (isSave(match[2])) group.latestSave = Math.max(group.latestSave, Date.parse(data.savedAt) || 0)
      if (match[2] === COLLECTION_STORAGE_KEY) group.progress += Object.keys(data.species).length
      if (match[2] === 'digirogue-trainer-skills-v1') group.progress += Number(data.earned) || 0
    }
    // Use a single former profile so skill ranks/SP and save decisions are not
    // assembled from different play histories. Ties are deterministic.
    const source = [...groups.values()].sort((a, b) => b.latestSave - a.latestSave || b.progress - a.progress || a.prefix.localeCompare(b.prefix))[0]
    const copiedKeys = []
    for (const [key, text] of source?.records ?? []) {
      // A fresh login's empty dex/bank must not erase the earlier local run's
      // discoveries. Rebuild its missing dex from that run and scan bank instead.
      if (rebuildUnscopedDex && [COLLECTION_STORAGE_KEY, SCAN_PROGRESS_STORAGE_KEY].includes(key)) continue
      const current = storage.getItem(key)
      if (valid(key, parse(current))) continue
      if (current !== null) preserveInvalid(storage, key, current)
      writeVerified(storage, key, text)
      copiedKeys.push(key)
    }
    // Pre-login saves had scan data and party history but no dex. Rebuild only
    // the missing dex, using the permanent scan bank (including spent zeroes).
    if (!valid(COLLECTION_STORAGE_KEY, parse(storage.getItem(COLLECTION_STORAGE_KEY)))) {
      const current = storage.getItem(COLLECTION_STORAGE_KEY)
      if (current !== null) preserveInvalid(storage, COLLECTION_STORAGE_KEY, current)
      let collection = recoverSavedCollection(storage, normalizeCollection(null), now())
      const scan = loadScanProgress(storage)
      collection = recordGameCollection(collection, { digimonAnalysis: scan }, now())
      writeVerified(storage, COLLECTION_STORAGE_KEY, JSON.stringify(collection))
      // Unlocks never leave redundant scan entries behind.
      writeVerified(storage, SCAN_PROGRESS_STORAGE_KEY, JSON.stringify({ version: 1,
        digimonNameRevision: DIGIMON_NAME_REVISION, analysis: collectionAnalysis(collection) }))
    }
    writeVerified(storage, LOCAL_MIGRATION_KEY, JSON.stringify({ version: 1, completedAt: now(), copiedKeys }))
    return { ok: true, migrated: true, copiedKeys }
  } catch { return { ok: false, migrated: false } }
}
