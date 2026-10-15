import { ADVENTURE_UTILITY_ITEMS, ADVENTURE_CONSUMABLES } from '../data/adventureItems.js'
import { normalizeTrainerRanks, normalizeTrainerProgress, TRAINER_SKILL_LOOKUP, getTrainerSpent } from './trainerSkills.js'
export const LEGACY_TOWN_STORAGE_KEY = 'digirogue-town-v1'
export const DEPARTURE_SKILLS = Object.freeze({ market: 'growth-start-gold', farm: 'growth-start-food',
  clinic: 'growth-start-recovery', workshop: 'growth-start-tools', nursery: 'growth-egg-preparation' })
const supplyLimits = new Map([...ADVENTURE_UTILITY_ITEMS, ...ADVENTURE_CONSUMABLES].map(item => [item.id, item.maxOwned]))
const level = value => Math.max(0, Math.min(3, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 0))
// Preserve purchased facilities as paid skill ranks without changing spendable SP.
// The receipt lives in the same atomic trainer record as the granted ranks.
export function migrateTownSkills(value, town) {
  const progress = normalizeTrainerProgress(value)
  if (progress.achievements.legacyTownMigrated) return progress
  const learned = { ...progress.learned }, paid = { ...progress.paid }
  if (town?.version === 1) for (const [building, id] of Object.entries(DEPARTURE_SKILLS)) {
    const oldRank = learned[id] ?? 0, rank = Math.max(oldRank, level(town.buildings?.[building]))
    if (!rank) continue
    learned[id] = rank
    paid[id] = Array.from({ length: rank }, (_, index) => index < oldRank ? progress.paid[id][index] : TRAINER_SKILL_LOOKUP[id].rankCosts[index])
  }
  const addedCost = getTrainerSpent(learned, paid) - getTrainerSpent(progress.learned, progress.paid)
  return { ...progress, earned: Math.min(Number.MAX_SAFE_INTEGER, progress.earned + addedCost), learned, paid,
    achievements: { ...progress.achievements, legacyTownMigrated: true } }
}
export function applyTrainerStartingSupport(state) {
  if (!state || state.gameMode === 'daily' || state.currentStage !== 1 || state.startingSupport || state.townSupport) return state
  const ranks = normalizeTrainerRanks(state.trainerSkills), items = {}, add = (id, count = 1) => { items[id] = (items[id] ?? 0) + count }
  const food = ranks['growth-start-food'] ?? 0, clinic = ranks['growth-start-recovery'] ?? 0,
    tools = ranks['growth-start-tools'] ?? 0, nursery = ranks['growth-egg-preparation'] ?? 0
  if (food) add(['', 'food-fried-potato', 'food-hamburger', 'food-chicken-combo'][food], 2)
  if (clinic) { add('energy-pill-a', clinic); if (clinic === 3) add('charge-digisoul') }
  if (tools) { add('d-terminal'); if (tools >= 2) add('d-scanner'); if (tools >= 3) add('digivice-ic') }
  if (nursery >= 2) add('digivice-ic')
  const inventory = { ...state.inventory }
  for (const [id, count] of Object.entries(items)) inventory[id] = Math.min(supplyLimits.get(id) ?? Infinity, Math.max(0, Number(inventory[id]) || 0) + count)
  return { ...state, inventory, gold: (state.gold ?? 0) + (ranks['growth-start-gold'] ?? 0) * 150,
    startingSupport: { eggStageReduction: nursery === 3 ? 2 : nursery ? 1 : 0 } }
}
export const getTrainerEggStages = (stages, support) => Math.max(1, Math.floor(stages) - Math.min(2, level(support?.eggStageReduction)))
