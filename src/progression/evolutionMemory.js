import { ITEM_EVOLUTION_REQUIREMENTS, JOGRESS_RECIPES } from '../data/evolutionRules.js'
import { canonicalDigimonName, canonicalEvolutionMemoryKey } from '../data/digimonNames.js'

const signature = (sources, target) => `${sources.map(name => canonicalDigimonName(name)).sort().join(' + ')} → ${canonicalDigimonName(target)}`
const routes = new Set([
  ...Object.entries(ITEM_EVOLUTION_REQUIREMENTS).flatMap(([target, rule]) => rule.from.map(source => signature([source], target))),
  ...JOGRESS_RECIPES.map(recipe => signature(recipe.materials, recipe.targetName)),
])

export function normalizeEvolutionMemory(value) {
  return Array.isArray(value) ? [...new Set(value.map(key => routes.has(key) ? key : canonicalEvolutionMemoryKey(key, { legacy: true }))
    .filter(key => typeof key === 'string' && routes.has(key)))].sort() : []
}
export const mergeEvolutionMemory = (...values) => normalizeEvolutionMemory(values.flatMap(normalizeEvolutionMemory))
export const hasEvolutionMemory = (memory, sources, target) => normalizeEvolutionMemory(memory).includes(signature(sources, target))
export const rememberItemEvolution = (memory, sources, target) => normalizeEvolutionMemory([...normalizeEvolutionMemory(memory), signature(sources, target)])

export function inferEvolutionMemory(party) {
  let memory = []
  for (const unit of party ?? []) {
    if (!unit || unit.isEgg) continue
    const chain = [...(Array.isArray(unit.evolutionHistory) ? unit.evolutionHistory : []), unit.name]
    for (let index = 1; index < chain.length; index++) {
      const source = chain[index - 1], target = chain[index]
      if (ITEM_EVOLUTION_REQUIREMENTS[target]?.from.includes(source)) memory = rememberItemEvolution(memory, [source], target)
      const recipe = JOGRESS_RECIPES.find(entry => entry.targetName === target && entry.materials.includes(source))
      if (recipe) memory = rememberItemEvolution(memory, recipe.materials, target)
    }
  }
  return memory
}
