import eggs from '../../data/디지몬/디지에그.json' with { type: 'json' }

const validId = id => typeof id === 'string' && id.length > 0 && id.length < 200 && !['__proto__', 'constructor', 'prototype'].includes(id)
export function normalizeItemDiscoveries(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(Object.entries(raw).filter(([id, seen]) => validId(id) && seen === true))
}
export const hasDiscoveredItem = (collection, id) => Object.hasOwn(collection?.items ?? {}, id) && collection.items[id] === true

export function recordItemDiscoveries(collection, items = []) {
  const seen = { ...(collection.items ?? {}) }
  let changed = false
  for (const item of items) {
    const id = typeof item === 'string' ? item : item?.id
    if (!validId(id) || seen[id] === true) continue
    seen[id] = true; changed = true
  }
  return changed ? { ...collection, items: seen } : collection
}

// Recover discoveries from inventory/equipment in older saves as well as live
// play. A generated but unrevealed reward is deliberately not evidence.
export function getGameItemDiscoveries(state) {
  const ids = new Set()
  const addCounts = (counts, toId = key => key) => {
    for (const [key, count] of Object.entries(counts ?? {})) if (Number.isFinite(Number(count)) && Number(count) > 0) ids.add(toId(key))
  }
  addCounts(state?.inventory)
  const clones = { speed: 'a', defense: 'b', attack: 'c', specialDefense: 'd', specialAttack: 'e', hp: 's' }
  const buffs = { attack: 'attack', defense: 'defense', specialAttack: 'special-attack', specialDefense: 'special-defense', speed: 'speed', hp: 'hp' }
  for (const unit of [state?.player, ...(state?.party ?? [])].filter(unit => unit && !unit.regionalSupport)) {
    if (unit.isEgg) {
      const index = eggs.findIndex(egg => egg.이름 === unit.eggName)
      if (index >= 0) ids.add('digi-egg-' + (index + 1))
      continue
    }
    addCounts(unit.battleItems); addCounts(unit.recoveryPrograms)
    addCounts(unit.typePowerUps, key => 'type-up-' + key)
    const attributes = { 불: '화염', 전기: '번개', 땅: '흙', 금속: '강철' }
    addCounts(unit.attributePowerUps, key => 'attribute-up-' + (attributes[key] ?? key))
    addCounts(unit.digiclones, key => clones[key] ? 'digiclone-' + clones[key] : '')
    addCounts(unit.activeBuffs, key => buffs[key] ? 'buff-' + buffs[key] : '')
  }
  return [...ids].filter(validId)
}
