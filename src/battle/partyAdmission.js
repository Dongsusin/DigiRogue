import { PARTY_CAPACITY } from '../data/partyLimits.js'
import { isRegionalSupport, ownedBattleUnits } from './regionalSupport.js'

const alive = unit => Boolean(unit && !unit.isEgg && unit.currentHp > 0)
const pending = state => state?.pendingPartyAdmissions ?? []

export function getPartyReplacementError(state, incoming, replacementId) {
  const party = ownedBattleUnits(state?.party)
  if (!party.some(unit => unit.id === replacementId)) return '교체할 보유 디지몬을 선택해 주세요.'
  if (!alive(incoming) && !party.some(unit => unit.id !== replacementId && alive(unit))) {
    return '싸울 수 있는 마지막 디지몬은 디지에그와 교체할 수 없습니다.'
  }
  return ''
}

// Keep the player and stored formation attached to owned members after a release.
function withParty(state, party, releasedId, incoming) {
  const byId = new Map(party.map(unit => [unit.id, unit]))
  const player = byId.get(state.player?.id) ?? (alive(incoming) ? incoming : null) ?? party.find(alive) ?? party.find(unit => !unit.isEgg) ?? null
  const activeAllyIds = [...new Set((state.activeAllyIds ?? [state.player?.id]).flatMap(id => {
    if (id === releasedId) return alive(incoming) ? [incoming.id] : []
    return byId.has(id) ? [id] : []
  }))]
  if (player && !activeAllyIds.length && alive(player)) activeAllyIds.push(player.id)
  const actingAllyId = byId.has(state.actingAllyId) ? state.actingAllyId : player?.id ?? null
  return { ...state, party, player, activeAllyIds, actingAllyId,
    actedAllyIds: (state.actedAllyIds ?? []).filter(id => byId.has(id)),
    pendingAllyActions: (state.pendingAllyActions ?? []).filter(action => byId.has(action.actorId)) }
}

export function admitPartyMember(state, member, replacementId = null) {
  const party = ownedBattleUnits(state?.party)
  if (!member?.id || isRegionalSupport(member) || party.some(unit => unit.id === member.id)) {
    return { ok: false, state, error: '이 디지몬을 영입할 수 없습니다.' }
  }
  if (pending(state).length && pending(state)[0].member.id !== member.id) return { ok: false, state, error: '먼저 영입 대기 중인 디지몬을 선택해 주세요.' }
  if (party.length > PARTY_CAPACITY) return { ok: false, state, error: '먼저 초과한 보유 디지몬을 정리해 주세요.' }
  if (party.length === PARTY_CAPACITY && !replacementId) return { ok: false, requiresReplacement: true, state, member }
  if (replacementId) {
    const error = getPartyReplacementError(state, member, replacementId)
    if (error) return { ok: false, state, member, error }
  }
  const released = party.find(unit => unit.id === replacementId) ?? null
  const nextParty = released ? party.map(unit => unit.id === released.id ? member : unit) : [...party, member]
  return { ok: true, member, released, state: withParty(state, nextParty, released?.id, member) }
}

export function queuePartyAdmission(state, request) {
  if (!request?.member?.id || pending(state).length || (state.party ?? []).some(unit => unit.id === request.member.id)) return state
  return { ...state, pendingPartyAdmissions: [{ ...request, stage: state.currentStage }] }
}

export function dismissPartyAdmission(state, memberId) {
  // Only the currently displayed request can be resolved (also blocks stale clicks).
  if (pending(state)[0]?.member?.id !== memberId) return state
  return { ...state, pendingPartyAdmissions: pending(state).slice(1) }
}

// Old saves may already exceed the limit. Preserve every excess member in a
// durable decision queue rather than silently deleting them during migration.
export function normalizePartyCapacity(state) {
  const seen = new Set()
  const party = ownedBattleUnits(state.party).filter(unit => {
    if (!unit?.id || seen.has(unit.id)) return false
    seen.add(unit.id)
    return true
  })
  if (state.player?.id && !isRegionalSupport(state.player) && !seen.has(state.player.id)) party.unshift(state.player)
  const priority = new Set([state.player?.id, ...(state.activeAllyIds ?? []), party.find(alive)?.id].filter(id => party.some(unit => unit.id === id)))
  const retainedIds = new Set([...new Set([...priority, ...party.map(unit => unit.id)])].slice(0, PARTY_CAPACITY))
  const retained = party.filter(unit => retainedIds.has(unit.id))
  const excess = party.filter(unit => !retainedIds.has(unit.id))
  const queuedIds = new Set(retainedIds)
  const requests = [...pending(state), ...excess.map(member => ({ kind: 'overflow', member, stage: state.currentStage }))]
    .filter(request => {
      const id = request?.member?.id
      if (!id || isRegionalSupport(request.member) || queuedIds.has(id)) return false
      queuedIds.add(id)
      return true
    })
  const normalized = { ...withParty(state, retained), pendingPartyAdmissions: requests }
  // Let the save loader reconstruct older formations with the encounter's limit.
  if (!Array.isArray(state.activeAllyIds)) delete normalized.activeAllyIds
  return normalized
}
