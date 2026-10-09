// Boss models remain in the full catalog for encounters and rendering, but never
// enter a player's roster. Retired species also reject data from older saves.
import { canonicalDigimonName } from './digimonNames.js'
import retiredAuthoredAttackSpecies from './retiredAuthoredAttackSpecies.json' with { type: 'json' }
export const BOSS_ONLY_SPECIES = Object.freeze(['위그드라실 7D6'])
export const AUTHORED_ATTACK_RETIRED_SPECIES = Object.freeze([...retiredAuthoredAttackSpecies])
export const RETIRED_SPECIES = Object.freeze(['플래티넘스카몬', '매그너가루몬', ...AUTHORED_ATTACK_RETIRED_SPECIES])
const unavailable = new Set([...BOSS_ONLY_SPECIES, ...RETIRED_SPECIES])

export function isPlayableDigimon(species) {
  const names = (typeof species === 'string' ? [species]
    : [species?.이름, species?.imageName, species?.speciesName, species?.speciesData?.이름, species?.name])
    .filter(name => typeof name === 'string' && name.trim())
  return names.length > 0 && names.every(name => !unavailable.has(canonicalDigimonName(name)))
}
