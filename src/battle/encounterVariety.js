import { MAP_BOSS_ROUTES } from '../data/regionalBossProfiles.js'

export const MIN_REGIONAL_BOSS_SPECIES = 3
const speciesCount = (profiles, identify) => new Set(profiles.map(identify)).size

// Prefer local authored routes and the scheduled encounter style, but never
// reduce a healthy local pool to one or two species just to keep that style.
export function regionalEncounterPool(eligible, mapName, theme, preferred, identify, includeThematic = () => false) {
  const routes = MAP_BOSS_ROUTES[mapName] ?? []
  const local = eligible.filter(profile => routes.includes(profile.regionRoute ?? profile.id))
  const thematic = eligible.filter(profile => profile.themes.includes(theme))
  // Preserve existing fusion and mode encounters when adding local routes.
  const scheduled = thematic.filter(profile => preferred(profile) && includeThematic(profile))
  const regional = speciesCount(local, identify) >= MIN_REGIONAL_BOSS_SPECIES
    ? [...new Set([...local, ...scheduled])]
    : [...new Set([...local, ...(thematic.length ? thematic : eligible)])]
  const styled = regional.filter(preferred)
  return speciesCount(styled, identify) >= MIN_REGIONAL_BOSS_SPECIES ? styled
    : [...new Set([...styled, ...regional])]
}

// Keep the prepared pool intact. Selection balances actual starting species,
// so duplicate lineages/forms cannot multiply a monster's chance to appear.
// Least-recently-seen groups also avoid repeats when all three are in history.
export function pickVariedEncounter(candidates, identify, profileById, history = [], random = Math.random) {
  if (!candidates.length) return null
  const groups = new Map()
  for (const profile of candidates) {
    const name = identify(profile)
    const group = groups.get(name) ?? []
    group.push(profile); groups.set(name, group)
  }
  const recent = (Array.isArray(history) ? history : []).map(id => profileById.get(id)).filter(Boolean).map(identify)
  const score = name => recent.lastIndexOf(name)
  const oldest = Math.min(...[...groups.keys()].map(score))
  const choices = [...groups].filter(([name]) => score(name) === oldest)
  const pick = array => array[Math.min(array.length - 1, Math.max(0, Math.floor(random() * array.length)))]
  return pick(pick(choices)[1])
}
