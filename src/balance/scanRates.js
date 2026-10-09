import { DIGIMON_TRAINING_TRAITS } from '../data/digimonTrainingTraits.js'
import { canonicalDigimonName } from '../data/digimonNames.js'
import { getDigimonTrainingStage } from '../data/digimonStages.js'
import { ITEM_EVOLUTION_REQUIREMENTS, JOGRESS_RECIPES } from '../data/evolutionRules.js'
import { LORE_PROFILES } from './loreProfiles.js'

// Collection tuning reuses the same authored power budget as stats and base cost.
// Enemy levels, buffs and discounted starter costs never alter a species' rate.
const stageCaps = { 유아기: 60, 유년기: 45, 성장기: 40, 성숙기: 25, 완전체: 14, 궁극체: 8, 초궁극체: 4 }
const itemFactors = { common: 1, good: .85, rare: .65, rogue: .45, master: .35 }
const jogressTargets = new Set(JOGRESS_RECIPES.map(recipe => recipe.targetName))
const multipliers = Object.freeze(Object.fromEntries(Object.entries(DIGIMON_TRAINING_TRAITS).map(([name, traits]) => {
  const power = LORE_PROFILES[name]?.budget
  const stage = ['아머체', '하이브리드체'].includes(traits.stage) ? getDigimonTrainingStage(name, traits.stage) : traits.stage
  const item = ITEM_EVOLUTION_REQUIREMENTS[name]
  const difficulty = Math.min(item ? itemFactors[item.rarity] ?? .65 : 1, jogressTargets.has(name) ? .7 : 1)
  const cardGain = power > 0 ? Math.min(stageCaps[stage] ?? 25, 30 * (405 / power) ** 2) * difficulty : 0
  return [name, cardGain / 25]
})))

// Call once, after equipment and skill bonuses, for every acquisition source.
// A positive sample always yields at least 1%p, even for the rarest final forms.
export function getSpeciesScanGain(name, baseAmount) {
  const amount = Number(baseAmount), factor = multipliers[canonicalDigimonName(name)] ?? 0
  if (!Number.isFinite(amount) || amount <= 0 || factor <= 0) return 0
  return Math.max(1, Math.min(100, Math.round(amount * factor)))
}
