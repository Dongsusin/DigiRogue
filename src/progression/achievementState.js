import { normalizeItemDiscoveries } from './itemCollection.js'
const ids = value => [...new Set((Array.isArray(value) ? value : []).filter(id => typeof id === 'string' && id.length > 0 && id.length <= 180))]
export function normalizeAchievementState(value) {
  const completed = Object.fromEntries(Object.entries(value?.completed ?? {}).filter(([id, at]) =>
    /^(trust|boss|rival|mode|collection):.{1,180}$/.test(id) && Number.isSafeInteger(at) && at >= 0))
  const items = Object.keys(normalizeItemDiscoveries(Object.fromEntries(ids(value?.items).map(id => [id, true]))))
  return { completed, bosses: ids(value?.bosses), rivals: ids(value?.rivals), items,
    legacyTownMigrated: value?.legacyTownMigrated === true }
}

export const ACHIEVEMENT_PENDING_STORAGE_KEY = 'digirogue-achievement-pending-v1'
export function mergeAchievementState(first, second) {
  const a = normalizeAchievementState(first), b = normalizeAchievementState(second)
  const completed = { ...a.completed, ...b.completed }
  for (const id of Object.keys(a.completed)) if (Object.hasOwn(b.completed, id)) completed[id] = Math.min(a.completed[id], b.completed[id])
  return normalizeAchievementState({ completed, bosses: [...a.bosses, ...b.bosses], rivals: [...a.rivals, ...b.rivals],
    items: [...a.items, ...b.items] })
}

export const ACHIEVEMENT_EVIDENCE_PREFIX = 'digirogue-achievement-evidence-v1:'
