import { BOSS_MAP_THEMES } from '../data/bossProfiles.js'
import { RIVAL_PROFILES, RIVAL_PROFILE_BY_ID } from '../data/rivalProfiles.js'
import { JOGRESS_RECIPES } from '../data/evolutionRules.js'
import { DIGIMON_MODELS, missingRequiredClips } from '../data/digimonModels.js'
import { createBossPlan, normalizeEncounterPresentation } from './bossEncounters.js'
import { withBossSegments } from './bossPhases.js'
import { regionalEncounterPool, pickVariedEncounter } from './encounterVariety.js'

export const isRivalStage = stage => stage > 0 && stage < 200 && (stage % 20 === 8 || stage % 20 === 15)
const living = unit => unit && !unit.isEgg && unit.currentHp > 0
const memoryFor = (state, id) => {
  const record = state?.encounters?.[id] ?? (state?.profileId === id ? state : {})
  return { meetings: record?.meetings ?? 0, wins: record?.wins ?? 0, adaptation: record?.adaptation,
    lastSeenStage: record?.lastSeenStage, lastWonStage: record?.lastWonStage }
}
const completeModel = name => DIGIMON_MODELS[name] && !missingRequiredClips(DIGIMON_MODELS[name].clips).length

const startingName = (profile, stage) => profile.variant
  ? profile.formation?.[0] ?? profile.line[0] : createBossPlan(profile, stage).initialName

export function getRivalCandidates(stage, mapName, speciesLookup) {
  if (!isRivalStage(stage)) return []
  const candidates = RIVAL_PROFILES.filter(profile => stage >= profile.minStage && stage <= profile.maxStage &&
    [...profile.line, ...(profile.formation ?? [])].every(name => speciesLookup.has(name) && completeModel(name)))
  return regionalEncounterPool(candidates, mapName, BOSS_MAP_THEMES[mapName],
    profile => Boolean(profile.variant) === (stage % 20 === 15), profile => startingName(profile, stage),
    profile => Boolean(profile.variant))
}

function createRivalPlan(profile, stage, speciesLookup, ids, support = false) {
  const base = createBossPlan(profile, stage, { companionIds: support ? [ids[0]] : ids.slice(1), support: false })
  const name = profile.variant ? profile.formation?.[support ? 1 : 0] ?? profile.line[0] : base.initialName
  const nextName = profile.variant ? profile.line[1] : profile.line[profile.line.indexOf(name) + 1]
  // A single wild Digimon cannot perform a two-body fusion. Those routes have
  // their own encounters; unavailable/unchanging branches rally instead.
  const target = !support && nextName && (profile.variant ||
    (speciesLookup.get(name)?.진화가능?.includes(nextName) && !JOGRESS_RECIPES.some(recipe => recipe.targetName === nextName)))
    ? nextName : null
  const phases = support ? [] : [{ id: 'phase-1', atHp: profile.atHp ?? (target ? .6 : .35),
    ...(profile.atActions ? { atActions: profile.atActions } : {}),
    ...(profile.condition ? { condition: profile.condition } : {}), form: target,
    label: target ? profile.method ?? '진화' : '마지막 결의',
    effect: target ? profile.effect ?? {} : { stats: { attack: 1.12, specialAttack: 1.12 }, turns: 2 },
    ...(profile.fusion ? { fusion: { partners: ids.slice(1).map((id, index) => ({ id, name: profile.formation[index + 1] })) } } : {}),
  }]
  const rules = profile.fusion ? [{ id: 'broken-fusion', label: '동료의 결의',
    condition: { kind: 'partner-defeated' }, effect: { stats: { attack: 1.12, specialAttack: 1.12 }, turns: 2 } }] : []
  return withBossSegments({ ...base, id: `rival:${profile.id}`, kind: 'rival', title: '야생 라이벌',
    initialName: name, name, source: null, phases, rules, leader: !support,
    companionIds: support ? [ids[0]] : ids.slice(1) }, { line: target ? [name, target] : [name], segmented: !support })
}

export function createRivalEncounter({ stage, mapName, rivalState, speciesLookup, createCombatant, level, random = Math.random, id }) {
  if (!isRivalStage(stage)) return []
  const candidates = getRivalCandidates(stage, mapName, speciesLookup, rivalState)
  // A remembered rival can return later, but never pins every future map to its lineage.
  const saved = id ? RIVAL_PROFILE_BY_ID.get(id) : null
  const eligibleSaved = saved && stage >= saved.minStage && stage <= saved.maxStage &&
    [...saved.line, ...(saved.formation ?? [])].every(name => speciesLookup.has(name) && completeModel(name))
  if (id && !eligibleSaved) return []
  const profile = eligibleSaved ? saved : pickVariedEncounter(candidates, profile => startingName(profile, stage),
    RIVAL_PROFILE_BY_ID, rivalState?.history, random)
  if (!profile) return []
  const memoryKey = stage % 20 === 15 && !profile.variant ? `regional:${profile.id}` : profile.id
  const memory = memoryFor(rivalState, memoryKey)
  const ids = [`rival-${stage}-${profile.id}`, ...(profile.formation ? [`rival-${stage}-${profile.id}-support`] : [])]
  return ids.map((id, index) => {
    const plan = createRivalPlan(profile, stage, speciesLookup, ids, index > 0)
    const unit = createCombatant({ id, name: plan.initialName, data: speciesLookup.get(plan.initialName), level })
    const markers = plan.phases.map(phase => phase.atHp)
    return normalizeEncounterPresentation({ ...unit,
      rivalEncounter: { profileId: profile.id, memoryKey, name: unit.name, variant: stage % 20 === 15 || Boolean(profile.variant),
        leader: index === 0, meeting: (memory.meetings ?? 0) + 1, stage, adaptation: memory.adaptation },
      bossEncounter: plan, battleGuards: memory.adaptation ? { [memory.adaptation]: 2 } : {},
      bossHpMarkers: markers, bossHpBreakpoints: markers, bossHpSegmentCount: markers.length + 1 })
  })
}

const encounterLeader = enemies => enemies?.find(unit => unit.rivalEncounter && unit.rivalEncounter.leader !== false)
  ?? enemies?.find(unit => unit.rivalEncounter)
export function recordRivalMeeting(state) {
  const encounter = encounterLeader(state.enemies)?.rivalEncounter
  if (!encounter || state.rivalState?.lastSeenStage === state.currentStage) return state
  const key = encounter.memoryKey ?? encounter.profileId
  const old = state.rivalState ?? {}, memory = memoryFor(old, key)
  const next = { ...memory, meetings: encounter.meeting, wins: memory.wins ?? 0, lastSeenStage: state.currentStage }
  // 8/28/... keeps the recurring lineage. 15/35/... stores separate regional memories.
  const primary = encounter.variant ? {} : { profileId: encounter.profileId, meetings: next.meetings,
    wins: next.wins, adaptation: next.adaptation }
  return { ...state, rivalState: { ...old, ...primary, lastSeenStage: state.currentStage,
    history: [...(old.history ?? []), encounter.profileId].slice(-12),
    encounters: { ...old.encounters, [key]: next } } }
}

export function recordRivalVictory(state) {
  const encounter = encounterLeader(state.enemies)?.rivalEncounter
  if (!encounter || state.enemies.some(living) || state.rivalState?.lastWonStage === state.currentStage) return state
  const key = encounter.memoryKey ?? encounter.profileId
  const old = state.rivalState ?? {}, memory = memoryFor(old, key)
  const active = state.party.filter(unit => state.activeAllyIds?.includes(unit.id))
  const physical = active.reduce((sum, unit) => sum + unit.attack, 0)
  const special = active.reduce((sum, unit) => sum + unit.specialAttack, 0)
  const observed = state.enemies.filter(unit => unit.rivalEncounter?.profileId === encounter.profileId)
    .reduce((total, unit) => { const hits = unit.rivalEncounter.observed ?? {}
      return { physical: total.physical + (hits.physical ?? 0), special: total.special + (hits.special ?? 0) }
    }, { physical: 0, special: 0 })
  const sawHits = observed.physical + observed.special > 0
  const adaptation = (sawHits ? observed.physical >= observed.special : physical >= special) ? 'physical' : 'special'
  const next = { ...memory, wins: (memory.wins ?? 0) + 1, lastWonStage: state.currentStage, adaptation }
  const primary = encounter.variant ? {} : { profileId: encounter.profileId, wins: next.wins, adaptation }
  return { ...state, rivalState: { ...old, ...primary, lastWonStage: state.currentStage,
    encounters: { ...old.encounters, [key]: next } } }
}

export function getRivalIntroLogs(enemies) {
  const unit = encounterLeader(enemies)
  if (!unit) return []
  const encounter = unit.rivalEncounter
  const names = enemies.filter(enemy => enemy.rivalEncounter?.profileId === encounter.profileId).map(enemy => enemy.name).join(' · ')
  return [encounter.meeting > 1 ? `전에 만났던 ${names}이(가) 다시 나타났다!` : `야생 ${names}이(가) 나타났다!`,
    ...(encounter.adaptation ? [`${unit.name}이(가) 지난 대결을 기억해 ${encounter.adaptation === 'physical' ? '물리' : '특수'} 방벽을 준비했다!`] : [])]
}
