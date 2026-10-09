// Korean names are checked against Digimon Web. Model paths are stable identities:
// old 모야몬 means Geremon, while the corrected 모야몬 means Nanimon.
import corrections from './digimonNameCorrections.json' with { type: 'json' }

export const DIGIMON_NAME_REVISION = corrections.revision
export const DIGIMON_NAME_CORRECTIONS = Object.freeze(corrections.corrections.map(row => Object.freeze(row)))
// Model consolidation is independent of the official-name revision. Existing
// revision-1 saves must not replay the ambiguous Geremon/Nanimon rename.
export const DIGIMON_MODEL_ALIASES = Object.freeze({ '매그너가루몬': '매그너가루몬[SV]' })
const legacyNames = new Map([...DIGIMON_NAME_CORRECTIONS.map(row => [row.from, row.to]), ...Object.entries(DIGIMON_MODEL_ALIASES)])
const ambiguousNames = new Set(DIGIMON_NAME_CORRECTIONS.filter(row => row.overlapsExistingName).map(row => row.to))
const currentAliases = new Map([...legacyNames].filter(([name]) => !ambiguousNames.has(name)))
const trimName = value => typeof value === 'string' ? value.trim().normalize('NFC') : value

export function canonicalDigimonName(value, { legacy = false } = {}) {
  const name = trimName(value)
  return (legacy ? legacyNames : currentAliases).get(name) ?? name
}

export function getDigimonNameAliases(value) {
  const name = canonicalDigimonName(value)
  return [name, ...[...currentAliases].filter(([, to]) => to === name).map(([from]) => from)]
}

// Only exact species strings/keys are changed. Combatant IDs, item IDs, URLs and
// arbitrary text keep their identity even when they contain a previous name.
const identityFields = new Set(['id', 'actorId', 'attackerId', 'targetId', 'combatantId', 'trainerRunId', 'actingAllyId', 'activeAllyIds', 'actedAllyIds', 'selectedTargetIds'])
function mergeProgress(left, right) {
  if (typeof left === 'number' && typeof right === 'number') return Math.max(left, right)
  if (typeof left === 'boolean' && typeof right === 'boolean') return left || right
  if (Array.isArray(left) && Array.isArray(right)) return [...new Set([...left, ...right])]
  if (left && right && typeof left === 'object' && typeof right === 'object') return Object.fromEntries([...new Set([...Object.keys(left), ...Object.keys(right)])].map(key => [key, key in left && key in right ? mergeProgress(left[key], right[key]) : right[key] ?? left[key]]))
  return right ?? left
}
export function migrateDigimonNames(value, { legacy = false } = {}) {
  const names = legacy ? legacyNames : currentAliases
  if (typeof value === 'string') return names.get(value) ?? value
  if (Array.isArray(value)) {
    const next = value.map(entry => migrateDigimonNames(entry, { legacy }))
    return next.some((entry, i) => entry !== value[i]) ? next : value
  }
  if (!value || typeof value !== 'object') return value
  const next = {}; let changed = false
  for (const [key, entry] of Object.entries(value)) {
    const name = names.get(key) ?? key
    const item = identityFields.has(key) ? entry : migrateDigimonNames(entry, { legacy })
    changed ||= name !== key || item !== entry
    next[name] = name in next ? mergeProgress(next[name], item) : item
  }
  return changed ? next : value
}

export function migrateSavedDigimonNames(state) {
  if (!state || typeof state !== 'object') return state
  if (state.digimonNameRevision === DIGIMON_NAME_REVISION) return migrateDigimonNames(state)
  const migrated = migrateDigimonNames(state, { legacy: true })
  const refreshSignature = unit => {
    if (!unit || unit.isEgg) return unit
    const replacements = unit.name === '프린스콩알몬' ? new Map([['로열 너츠', '스마일리 워헤드']])
      : unit.name === '치코몬' ? new Map([['홉 어택', '산성 거품']]) : null
    if (!replacements) return unit
    return { ...unit, skills: unit.skills?.map(skill => replacements.get(skill) ?? skill),
      ...(unit.skillCooldowns ? { skillCooldowns: Object.fromEntries(Object.entries(unit.skillCooldowns)
        .map(([skill, cooldown]) => [replacements.get(skill) ?? skill, cooldown])) } : {}) }
  }
  return { ...migrated, player: refreshSignature(migrated.player),
    ...(Array.isArray(migrated.party) ? { party: migrated.party.map(refreshSignature) } : {}),
    ...(Array.isArray(migrated.enemies) ? { enemies: migrated.enemies.map(refreshSignature) } : {}),
    digimonNameRevision: DIGIMON_NAME_REVISION }
}

export function canonicalEvolutionMemoryKey(key, { legacy = false } = {}) {
  if (typeof key !== 'string') return key
  const parts = key.split(' → ')
  if (parts.length !== 2) return key
  return `${parts[0].split(' + ').map(name => canonicalDigimonName(name, { legacy })).sort().join(' + ')} → ${canonicalDigimonName(parts[1], { legacy })}`
}
