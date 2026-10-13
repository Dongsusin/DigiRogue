import { normalizeItemDiscoveries, recordItemDiscoveries, getGameItemDiscoveries } from './itemCollection.js'
import manifest from '../data/digimonModelManifest.json' with { type: 'json' }
import { isPlayableDigimon } from '../data/speciesAvailability.js'
import { canonicalDigimonName, DIGIMON_NAME_REVISION } from '../data/digimonNames.js'

// 플루트몬 refers to the existing Salamon entry, named 플롯트몬 in this roster.
export const INITIAL_STARTER_SPECIES = Object.freeze(['아구몬', '파피몬', '팔몬', '파닥몬', '피요몬', '쉬라몬', '텐타몬', '플롯트몬'])
export const COLLECTION_STORAGE_KEY = 'digirogue-collection-v1'
const initial = new Set(INITIAL_STARTER_SPECIES)
const supported = new Set(Object.keys(manifest).filter(isPlayableDigimon))
const speciesName = unit => canonicalDigimonName(typeof unit === 'string' ? unit : unit?.name ?? unit?.speciesName ?? unit?.imageName)
const percent = value => Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.floor(Number(value)))) : 0
const revision = value => Number.isSafeInteger(value) && value >= 0 ? value : 0
const emptyRecord = () => ({ nameRevision: DIGIMON_NAME_REVISION, seen: false, unlocked: false, scan: { value: 0, revision: 0 } })
const mergeRecords = (left, right) => {
  if (!left) return right
  if (!right) return left
  const scan = left.scan.revision > right.scan.revision ? left.scan : right.scan.revision > left.scan.revision ? right.scan
    : { value: Math.min(left.scan.value, right.scan.value), revision: left.scan.revision }
  const unlocked = left.unlocked || right.unlocked
  return { nameRevision: DIGIMON_NAME_REVISION, seen: left.seen || right.seen, unlocked,
    scan: unlocked ? { ...scan, value: 0 } : scan }
}

export function normalizeCollection(raw) {
  const entries = new Map(INITIAL_STARTER_SPECIES.filter(name => supported.has(name)).map(name => [name,
    { nameRevision: DIGIMON_NAME_REVISION, seen: true, unlocked: true, scan: { value: 0, revision: 0 } }]))
  if (raw?.species && typeof raw.species === 'object' && !Array.isArray(raw.species)) {
    for (const [storedName, record] of Object.entries(raw.species)) {
      const name = canonicalDigimonName(storedName, { legacy: record?.nameRevision !== DIGIMON_NAME_REVISION })
      if (!supported.has(name) || !record || typeof record !== 'object') continue
      const unlocked = initial.has(name) || record.unlocked === true
      const value = unlocked ? 0 : percent(record.scan?.value)
      entries.set(name, mergeRecords(entries.get(name), { nameRevision: DIGIMON_NAME_REVISION,
        seen: unlocked || record.seen === true || value > 0, unlocked,
        scan: { value, revision: revision(record.scan?.revision) } }))
    }
  }
  return { version: 1, species: Object.fromEntries(entries), items: normalizeItemDiscoveries(raw?.items) }
}

export function getCollectionStatus(collection, name) {
  name = canonicalDigimonName(name)
  if (!supported.has(name)) return 'unknown'
  if (initial.has(name) || collection?.species?.[name]?.unlocked === true) return 'unlocked'
  return collection?.species?.[name]?.seen === true ? 'seen' : 'unknown'
}

export function collectionAnalysis(collection) {
  return Object.fromEntries(Object.entries(collection.species).filter(([, record]) => record.seen && !record.unlocked)
    .map(([name, record]) => [name, record.scan.value]))
}

export function collectionUnlockedSpecies(collection) {
  return Object.keys(collection.species).filter(name => collection.species[name].unlocked).sort()
}

export function mergeCollections(first, second) {
  const a = normalizeCollection(first), b = normalizeCollection(second)
  const species = {}
  for (const name of new Set([...Object.keys(a.species), ...Object.keys(b.species)])) {
    const left = a.species[name], right = b.species[name]
    // A spent 100% sample must not return when an older local save arrives.
    species[name] = mergeRecords(left, right)
  }
  return { version: 1, species, items: { ...a.items, ...b.items } }
}

export function recordGameCollection(collection, state, now = Date.now()) {
  if (!state) return collection
  const species = { ...collection.species }
  let changed = false
  const mark = (unit, unlocked = false) => {
    const name = speciesName(unit)
    if (unit?.isEgg || !supported.has(name) || !isPlayableDigimon(unit)) return
    const previous = species[name] ?? emptyRecord()
    if (!previous.seen || (unlocked && !previous.unlocked)) {
      species[name] = { ...previous, seen: true, unlocked: previous.unlocked || unlocked,
        scan: unlocked ? { value: 0, revision: Math.max(previous.scan.revision + 1, revision(Math.floor(now))) } : previous.scan }; changed = true
    }
  }
  for (const enemy of state.enemies ?? []) mark(enemy)
  const temporaryPartners = new Set((state.gameMode === 'daily' ? state.dailyStarterNames ?? [] : []).map(speciesName))
  for (const member of [state.player, ...(state.party ?? [])].filter(member => member && !member.regionalSupport)) {
    mark(member, !temporaryPartners.has(speciesName(member)))
    if (!member.isEgg) for (const name of member.evolutionHistory ?? []) mark(name, !temporaryPartners.has(speciesName(name)))
  }
  for (const name of state.unlockedSpecies ?? []) mark(name, true)
  for (const [storedName, value] of Object.entries(state.digimonAnalysis ?? {})) {
    const name = speciesName(storedName)
    if (!supported.has(name) || species[name]?.unlocked) continue
    const previous = species[name] ?? emptyRecord(), nextValue = Math.max(previous.scan.value, percent(value))
    if (nextValue !== previous.scan.value || !previous.seen) {
      species[name] = { ...previous, seen: true, scan: { value: nextValue,
        revision: Math.max(revision(previous.scan.revision) + 1, revision(Math.floor(now))) } }
      changed = true
    }
  }
  return recordItemDiscoveries(changed ? { ...collection, version: 1, species } : collection, getGameItemDiscoveries(state))
}
