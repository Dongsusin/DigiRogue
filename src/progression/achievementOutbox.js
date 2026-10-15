import { ACHIEVEMENT_EVIDENCE_PREFIX, normalizeAchievementState, mergeAchievementState } from './achievementState.js'
export function achievementDelta(before, after) {
  const a = normalizeAchievementState(before), b = normalizeAchievementState(after)
  return normalizeAchievementState({ completed: Object.fromEntries(Object.entries(b.completed).filter(([id]) => !Object.hasOwn(a.completed, id))),
    bosses: b.bosses.filter(id => !a.bosses.includes(id)), rivals: b.rivals.filter(id => !a.rivals.includes(id)), items: b.items.filter(id => !a.items.includes(id)) })
}
export const hasAchievementEvidence = value => Object.keys(value.completed).length > 0 || value.bosses.length > 0 || value.rivals.length > 0 || value.items.length > 0
export function writeAchievementEvidence(storage, evidence) {
  const id = globalThis.crypto?.randomUUID?.() ?? Date.now() + '-' + Math.random().toString(36).slice(2)
  const key = ACHIEVEMENT_EVIDENCE_PREFIX + id, raw = JSON.stringify({ version: 1, ...evidence })
  try { storage.setItem(key, raw); return storage.getItem(key) === raw ? key : null } catch { return null }
}
export function readAchievementEvidence(storage) {
  const all = storage.logicalKeys?.(ACHIEVEMENT_EVIDENCE_PREFIX) ?? storage.keys?.() ??
    Array.from({ length: storage.length ?? 0 }, (_, index) => storage.key(index))
  const keys = all.filter(key => typeof key === 'string' && key.startsWith(ACHIEVEMENT_EVIDENCE_PREFIX))
  let evidence = normalizeAchievementState(null)
  for (const key of keys) { try { evidence = mergeAchievementState(evidence, JSON.parse(storage.getItem(key))) } catch { /* Ignore malformed evidence, never invent a completion. */ } }
  return { keys, evidence }
}
