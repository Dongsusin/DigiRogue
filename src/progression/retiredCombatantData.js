import { canonicalItemId } from '../data/itemIdentity.js'
// Compatibility only: older snapshots can retain removed stat rolls, equipment
// or team bonuses. Strip them from every unit, reward and nested checkpoint.
const retiredItems = new Set(['iv-detector'])
const retiredFields = new Set(['ivs', 'teamSynergies', ...retiredItems])
const isRetiredId = value => typeof value === 'string' && (retiredItems.has(value) || canonicalItemId(value) === null)
const isRetiredItem = value => isRetiredId(value) || isRetiredId(value?.id) || isRetiredId(value?.itemId)

export function cleanCombatantFields(combatant) {
  return Object.fromEntries(Object.entries(combatant).filter(([key]) => !retiredFields.has(key) && !isRetiredId(key)))
}

export function removeRetiredCombatantData(value) {
  if (Array.isArray(value)) return value.filter(entry => !isRetiredItem(entry)).map(removeRetiredCombatantData)
  if (isRetiredItem(value)) return null
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(cleanCombatantFields(value))
    .map(([key, entry]) => [key, removeRetiredCombatantData(entry)]))
}
