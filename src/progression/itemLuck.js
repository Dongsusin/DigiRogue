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
// With the normal 9000-weight pool, SS master mass is
// 9 + (476 * .25 + 895 * .25 ** 2) * (144 / 311) = 90 (1%).
export const MASTER_LUCK_PROMOTION_FACTOR = 144 / 311

export function resolveItemLuck(value = 0) {
  const points = Number.isFinite(value) ? Math.max(0, Math.min(ITEM_LUCK_MAX, Math.floor(value))) : 0
  const index = ITEM_LUCK_GRADES.findLastIndex(entry => entry.points <= points)
  const current = ITEM_LUCK_GRADES[index], next = ITEM_LUCK_GRADES[index + 1]
  return { ...current, points, index, nextGrade: next?.grade ?? null, nextAt: next?.points ?? null,
    remaining: next ? next.points - points : 0 }
}

const availableRarities = weights => weights.map(entry => ({ ...entry, index: ITEM_RARITIES.findIndex(rarity => rarity.key === entry.key) }))
  .filter(entry => entry.index >= 0 && Number.isFinite(entry.weight) && entry.weight > 0)
  .sort((a, b) => a.index - b.index)

const promotionChance = (from, to, luck) => {
  const chance = Math.max(0, Math.min(.25, Number(luck?.upgradeChance) || 0))
  return chance ** (to.index - from.index) * (to.key === 'master' ? MASTER_LUCK_PROMOTION_FACTOR : 1)
}

// Both the draw and the displayed odds share the same sparse-tier promotion rule.
export function getLuckRewardProbabilities(weights, luck = resolveItemLuck()) {
  const available = availableRarities(weights)
  const probabilities = Object.fromEntries(ITEM_RARITIES.map(entry => [entry.key, 0]))
  const total = available.reduce((sum, entry) => sum + entry.weight, 0)
  const visit = (index, mass, attempts) => {
    const current = available[index], next = available[index + 1]
    const chance = next && attempts < ITEM_LUCK_MAX_UPGRADES ? promotionChance(current, next, luck) : 0
    probabilities[current.key] += mass * (1 - chance)
    if (chance > 0) visit(index + 1, mass * chance, attempts + 1)
  }
  available.forEach((entry, index) => visit(index, entry.weight / total, 0))
  return probabilities
}

// Skipping a missing tier requires consecutive successes; failure ends the chain.
export function pickLuckRewardRarity(weights, luck = resolveItemLuck(), random = Math.random) {
  const available = availableRarities(weights)
  if (!available.length) return null
  const rollUnit = () => Math.max(0, Math.min(1 - Number.EPSILON, random()))
  let roll = rollUnit() * available.reduce((total, entry) => total + entry.weight, 0)
  let selected = available.at(-1)
  for (const entry of available) {
    roll -= entry.weight
    if (roll <= 0) { selected = entry; break }
  }
  if (!(Number(luck?.upgradeChance) > 0)) return selected.key
  for (let attempt = 0; attempt < ITEM_LUCK_MAX_UPGRADES; attempt++) {
    const next = available.find(entry => entry.index > selected.index)
    if (!next || rollUnit() >= promotionChance(selected, next, luck)) break
    selected = next
  }
  return selected.key
}
