import { normalizeAnalysis } from '../battle/digimonAnalysis.js'
import { DIGIMON_NAME_REVISION } from '../data/digimonNames.js'

export const SCAN_PROGRESS_STORAGE_KEY = 'digirogue-scan-progress-v1'
const LEGACY_RUN_KEY = 'digirogue-save-v1'
const browserStorage = () => {
  try { return typeof window !== 'undefined' ? window.localStorage : null } catch { return null }
}

export function saveScanProgress(analysis, storage = browserStorage()) {
  if (!storage) return false
  try {
    const value = JSON.stringify({ version: 1, digimonNameRevision: DIGIMON_NAME_REVISION, analysis: normalizeAnalysis(analysis) })
    if (storage.getItem(SCAN_PROGRESS_STORAGE_KEY) !== value) storage.setItem(SCAN_PROGRESS_STORAGE_KEY, value)
    return true
  } catch { return false }
}

export function loadScanProgress(storage = browserStorage(), legacyAnalysis = {}) {
  let migrated = normalizeAnalysis(legacyAnalysis)
  if (!storage) return migrated
  try {
    const stored = JSON.parse(storage.getItem(SCAN_PROGRESS_STORAGE_KEY) ?? 'null')
    if (stored?.version === 1 && stored.analysis && typeof stored.analysis === 'object' && !Array.isArray(stored.analysis)) {
      // The permanent bank is authoritative, including zero after a hatch. An older run
      // must never replenish already-spent scan data on Continue.
      const analysis = normalizeAnalysis(stored.analysis, { legacy: stored.digimonNameRevision !== DIGIMON_NAME_REVISION })
      if (stored.digimonNameRevision !== DIGIMON_NAME_REVISION) saveScanProgress(analysis, storage)
      return analysis
    }
  } catch { /* Recover a malformed profile from the old run if available. */ }
  try {
    const legacy = JSON.parse(storage.getItem(LEGACY_RUN_KEY) ?? 'null')
    const previous = normalizeAnalysis(legacy?.gameState?.digimonAnalysis,
      { legacy: legacy?.gameState?.digimonNameRevision !== DIGIMON_NAME_REVISION })
    for (const [name, value] of Object.entries(previous)) {
      Object.defineProperty(migrated, name, { value: Math.max(value, migrated[name] ?? 0), enumerable: true, configurable: true, writable: true })
    }
  } catch { /* A missing/invalid run does not prevent a fresh collection. */ }
  saveScanProgress(migrated, storage)
  return migrated
}
