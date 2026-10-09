import { ITEM_RARITIES } from '../data/itemRarities.js'

export const ITEM_LUCK_GRADES = Object.freeze([
  { grade: 'E', points: 0, upgradeChance: 0 },
  { grade: 'D', points: 1, upgradeChance: .04 },
  { grade: 'C', points: 3, upgradeChance: .08 },
  { grade: 'B', points: 6, upgradeChance: .12 },
  { grade: 'A', points: 9, upgradeChance: .16 },
  { grade: 'S', points: 12, upgradeChance: .20 },
  { grade: 'SS', points: 16, upgradeChance: .25 },
].map(Object.freeze))
export const ITEM_LUCK_MAX = ITEM_LUCK_GRADES.at(-1).points
export const ITEM_LUCK_MAX_UPGRADES = 2

export function resolveItemLuck(value = 0) {
  const points = Number.isFinite(value) ? Math.max(0, Math.min(ITEM_LUCK_MAX, Math.floor(value))) : 0
  const index = ITEM_LUCK_GRADES.findLastIndex(entry => entry.points <= points)
  const current = ITEM_LUCK_GRADES[index], next = ITEM_LUCK_GRADES[index + 1]
  return { ...current, points, index, nextGrade: next?.grade ?? null, nextAt: next?.points ?? null,
    remaining: next ? next.points - points : 0 }
}

// Base rarity weights never change. Luck gets at most two promotion attempts.
// Skipping an unavailable rarity requires the equivalent consecutive successes,
// so a sparse pool cannot turn a common item straight into a frequent master.
export function pickLuckRewardRarity(weights, luck = resolveItemLuck(), random = Math.random) {
  const available = weights.map(entry => ({ ...entry, index: ITEM_RARITIES.findIndex(rarity => rarity.key === entry.key) }))
    .filter(entry => entry.index >= 0 && Number.isFinite(entry.weight) && entry.weight > 0)
    .sort((a, b) => a.index - b.index)
  if (!available.length) return null
  const rollUnit = () => Math.max(0, Math.min(1 - Number.EPSILON, random()))
  let roll = rollUnit() * available.reduce((total, entry) => total + entry.weight, 0)
  let selected = available.at(-1)
  for (const entry of available) {
    roll -= entry.weight
    if (roll <= 0) { selected = entry; break }
  }
  const chance = Math.max(0, Math.min(.25, Number(luck?.upgradeChance) || 0))
  if (!chance) return selected.key
  for (let attempt = 0; attempt < ITEM_LUCK_MAX_UPGRADES; attempt++) {
    const next = available.find(entry => entry.index > selected.index)
    if (!next || rollUnit() >= chance ** (next.index - selected.index)) break
    selected = next
  }
  return selected.key
}
