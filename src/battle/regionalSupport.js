import { getSkillCooldown } from '../balance/combat.js'
import { REGIONAL_SUPPORT_BY_MAP, REGIONAL_SUPPORT_MIN_TRUST } from '../data/regionalSupportProfiles.js'

const alive = unit => unit && !unit.isEgg && unit.currentHp > 0
const bounded = value => Math.min(3, Math.max(0, Math.floor(Number(value) || 0)))
export const isRegionalSupport = unit => unit?.regionalSupport === true
export const ownedBattleUnits = party => (party ?? []).filter(unit => !isRegionalSupport(unit))
export const hasLivingOwnedAlly = (party, activeIds) => ownedBattleUnits(party).some(unit => alive(unit) && (!activeIds || activeIds.includes(unit.id)))
export function getRegionalTrust(state, mapName = state?.currentMap) {
  return bounded(state?.eventMemory?.regions?.[mapName]?.trust)
}
export function updateRegionalTrust(memory = {}, mapName, delta) {
  if (!REGIONAL_SUPPORT_BY_MAP.has(mapName)) return memory
  const previous = memory.regions?.[mapName] ?? {}
  return { ...memory, regions: { ...memory.regions, [mapName]: { ...previous, trust: bounded(bounded(previous.trust) + delta) } } }
}
export function getRegionalAid(state) {
  const profile = REGIONAL_SUPPORT_BY_MAP.get(state?.currentMap)
  const trust = getRegionalTrust(state)
  const used = Boolean(state?.eventMemory?.regions?.[state?.currentMap]?.aidUsed)
  const support = state?.regionalSupport
  return { profile, trust, used, ready: Boolean(profile && trust >= REGIONAL_SUPPORT_MIN_TRUST && !used),
    active: Boolean(support && support.stage === state?.currentStage && support.mapName === state?.currentMap && !support.finished && !support.defeated && alive(support.unit)) }
}
export function attachRegionalSupport(state, { speciesLookup, createCombatant, refreshStats }) {
  const aid = getRegionalAid(state)
  // Duo bosses/minions retain their original encounter; the promise waits for a solo boss.
  if (aid.active || !aid.ready || state.regionalSupport || state.explorationEvent?.phase === 'battle' || state.enemies?.length !== 1 ||
      !state.enemies.some(unit => alive(unit) && (unit.isBoss || unit.bossEncounter || unit.rivalEncounter)) ||
      !hasLivingOwnedAlly(state.party)) return state
  const data = speciesLookup.get(aid.profile.name)
  if (!data) return state
  const owned = ownedBattleUnits(state.party)
  const frontId = (state.activeAllyIds ?? []).find(id => alive(owned.find(unit => unit.id === id))) ?? owned.find(alive)?.id
  const bossLevel = Math.max(1, Math.round((state.enemies[0].level || state.player?.level || 1) * (aid.trust === 3 ? 1.1 : 1)))
  const id = 'regional-support-' + aid.profile.id + '-' + state.currentStage
  let unit = createCombatant({ id, name: aid.profile.name, data, level: bossLevel })
  unit = refreshStats({ ...unit, regionalSupport: true, trainerSkills: {}, enemyStage: null }, { preserveMaxHpDelta: true })
  unit = { ...unit, regionalSupport: true }
  const region = state.eventMemory?.regions?.[state.currentMap] ?? {}
  return { ...state, party: owned, activeAllyIds: [frontId], actingAllyId: frontId,
    eventMemory: { ...state.eventMemory, regions: { ...state.eventMemory?.regions, [state.currentMap]: { ...region, aidUsed: true, aidStage: state.currentStage } } },
    regionalSupport: { mapName: state.currentMap, stage: state.currentStage, unit, originalActiveIds: state.activeAllyIds ?? [frontId], finished: false } }
}
export function regionalBattleContext(state, ownedParty, activeIds) {
  const support = state?.regionalSupport
  if (!support || support.finished || support.stage !== state.currentStage || support.mapName !== state.currentMap) return { party: ownedParty, activeAllyIds: activeIds }
  const unit = (ownedParty ?? []).find(isRegionalSupport) ?? support.unit
  if (!isRegionalSupport(unit)) return { party: ownedParty, activeAllyIds: activeIds }
  // Keep a fainted human slot intact so manual replacement is still required.
  const humanId = activeIds.find(id => ownedBattleUnits(ownedParty).some(member => member.id === id)) ?? ownedParty.find(alive)?.id
  return { party: [...ownedBattleUnits(ownedParty), unit], activeAllyIds: [humanId, ...(alive(unit) && !support.defeated ? [unit.id] : [])].filter(Boolean) }
}
export function commitRegionalBattleState(state, { finished = false } = {}) {
  const helper = (state.party ?? []).find(isRegionalSupport)
  const party = ownedBattleUnits(state.party)
  const support = state.regionalSupport
  const activeAllyIds = (state.activeAllyIds ?? []).filter(id => party.some(unit => unit.id === id))
  const ended = finished || support?.finished || false
  return { ...state, party,
    player: isRegionalSupport(state.player) ? party.find(unit => activeAllyIds.includes(unit.id) && alive(unit)) ?? party[0] : state.player,
    activeAllyIds,
    actedAllyIds: (state.actedAllyIds ?? []).filter(id => party.some(unit => unit.id === id)),
    pendingAllyActions: (state.pendingAllyActions ?? []).filter(action => party.some(unit => unit.id === action.actorId)),
    ...(support ? { regionalSupport: { ...support, unit: helper ?? support.unit, defeated: Boolean(support.defeated || !alive(helper ?? support.unit)), finished: ended } } : {}) }
}
export function getRegionalSupportSkill(actor, getSkill, evaluate = () => 1) {
  if (!alive(actor) || !isRegionalSupport(actor)) return null
  const options = (actor.skills ?? []).map(name => ({ name, skill: getSkill(name, actor) }))
    .filter(({ skill }) => skill && !skill.효과 && skill.분류 !== '보조형' &&
      getSkillCooldown(actor, skill) === 0)
    .map(option => ({ ...option, score: evaluate(option.skill) }))
    .sort((a, b) => b.score - a.score)
  return options[0]?.name ?? ((actor.specialAttack ?? 0) > (actor.attack ?? 0) ? '기본 파동' : '기본 타격')
}
