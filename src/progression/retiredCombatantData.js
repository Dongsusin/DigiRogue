// Compatibility only: older snapshots can retain removed stat rolls, equipment
// or team bonuses. Strip them from every unit, reward and nested checkpoint.
const retiredItems = new Set(['iv-detector', 'xros-loader'])
const retiredFields = new Set(['ivs', 'teamSynergies', ...retiredItems])
const isRetiredItem = value => retiredItems.has(value) || retiredItems.has(value?.id) || retiredItems.has(value?.itemId)

export function cleanCombatantFields(combatant) {
  return Object.fromEntries(Object.entries(combatant).filter(([key]) => !retiredFields.has(key)))
}

export function removeRetiredCombatantData(value) {
  if (Array.isArray(value)) return value.filter(entry => !isRetiredItem(entry)).map(removeRetiredCombatantData)
  if (isRetiredItem(value)) return null
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(cleanCombatantFields(value))
    .map(([key, entry]) => [key, removeRetiredCombatantData(entry)]))
}
