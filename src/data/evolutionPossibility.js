// Answers "can this evolution actually happen in DigiRogue?" from the same rules the game uses.
import { DIGIMON_STAGE_DATA } from './digimonRoster.js'
import { DIGIMON_STAGES } from './digimonStages.js'
import { JOGRESS_RECIPES, getEvolutionTargets } from './evolutionRules.js'
import { getDigimonModel } from './digimonModels.js'

export const STAGE_ORDER = DIGIMON_STAGES
const stages = DIGIMON_STAGE_DATA

const rawByName = new Map(Object.entries(stages).flatMap(([stage, list]) =>
  (Array.isArray(list) ? list : Object.values(list)).map((raw) => [raw.이름, { ...raw, stage }])))

/** Element (속성), type (타입) and stage of a Digimon, for choosing its evolution scene. */
export function getDigimonProfile(name) {
  const raw = rawByName.get(name)
  return { element: raw?.속성 ?? '무', type: raw?.타입 ?? '데이터', stage: raw?.stage ?? '성숙기' }
}

export function getPossibleEvolutionTargets(name) {
  return getEvolutionTargets(rawByName.get(name) ?? { 이름: name })
}

export function isPossibleEvolution(fromNames, toName) {
  if (fromNames.length > 1) {
    const recipe = JOGRESS_RECIPES.find((entry) => entry.targetName === toName)
    return Boolean(recipe) && recipe.materials.length === fromNames.length && fromNames.every((name) => recipe.materials.includes(name))
  }
  return fromNames.length === 1 && getPossibleEvolutionTargets(fromNames[0]).includes(toName)
}

/** Every evolution the game can play: one entry per route, jogress listed once with all its partners. */
export function listAllEvolutionRoutes() {
  const hasModel = (name) => Boolean(getDigimonModel({ name }))
  const jogress = new Map(JOGRESS_RECIPES.map((recipe) => [recipe.targetName, recipe.materials]))
  const routes = []
  const seen = new Set()
  for (const name of rawByName.keys()) {
    if (!hasModel(name)) continue
    for (const target of getPossibleEvolutionTargets(name)) {
      if (!hasModel(target)) continue
      const from = jogress.has(target) ? jogress.get(target) : [name]
      const key = from.join('+') + '>' + target
      if (seen.has(key) || !from.every(hasModel)) continue
      seen.add(key)
      routes.push({ from, to: target, stage: getDigimonProfile(target).stage })
    }
  }
  return routes.sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || a.to.localeCompare(b.to, 'ko'))
}
