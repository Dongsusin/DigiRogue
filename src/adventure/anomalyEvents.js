import { getEvolutionRoute } from '../data/evolutionRules.js'
import { isPlayableDigimon } from '../data/speciesAvailability.js'
import { isDailyMode } from '../progression/gameModes.js'

export const PORTAL_EVENT = 'dimension-portal'
export const REMODEL_EVENT = 'data-remodel'
export const PORTAL_CHANCE = .08
export const REMODEL_CHANCE = .14
export const REMODEL_SUCCESS_CHANCE = .5
export const isAnomalyEvent = event => [PORTAL_EVENT, REMODEL_EVENT].includes(event?.kind)
const living = unit => unit && !unit.isEgg && !unit.regionalSupport && unit.currentHp > 0
const safeRoll = value => Number.isFinite(value) && value >= 0 && value < 1
const pick = (items, roll) => items[Math.min(items.length - 1, Math.floor(roll * items.length))]

export function getRemodelEvolutionTargets(member, speciesLookup) {
  if (!member || member.isEgg || member.regionalSupport || !isPlayableDigimon(member)) return []
  const source = speciesLookup?.get(member.name)
  return [...new Set(source?.진화가능 ?? [])].flatMap(name => {
    const target = speciesLookup.get(name)
    const route = target && getEvolutionRoute(member.name, name, target.stage)
    // Any authored branch can emerge, including catalysts and fusion. The
    // machine never charges an item or consumes a second party member.
    return name !== member.name && isPlayableDigimon(target) && route ? [target] : []
  })
}

export function getRemodelCandidates(state, speciesLookup) {
  const party = (state.party ?? []).filter(unit => !unit.regionalSupport)
  return party.map(member => {
    const targets = getRemodelEvolutionTargets(member, speciesLookup)
    const disabledReason = isDailyMode(state) ? '데일리에서는 개조할 수 없습니다.'
      : member.isEgg ? '디지에그는 개조할 수 없습니다.'
      : !targets.length ? '진화 가능한 형태가 없습니다.'
      : !party.some(unit => unit.id !== member.id && living(unit)) ? '전투 가능한 동료가 한 마리 더 필요합니다.' : ''
    return { member, targetCount: targets.length, disabledReason }
  })
}

// One offer at most. With twenty event stops, a full run has an 81% chance
// to encounter a portal; a declined portal also counts as the run's offer.
export function createAnomalyProgress(state, { speciesLookup, mapNames = [], random = Math.random } = {}) {
  const destinations = [...new Set(mapNames)].filter(name => name !== state.currentMap)
  if (!(state.eventMemory?.seen?.[PORTAL_EVENT] > 0) && destinations.length && random() < PORTAL_CHANCE) {
    return { version: 7, kind: PORTAL_EVENT, phase: 'choice', revision: 0, destination: pick(destinations, random()) }
  }
  if (!isDailyMode(state) && getRemodelCandidates(state, speciesLookup).some(option => !option.disabledReason) && random() < REMODEL_CHANCE) {
    return { version: 7, kind: REMODEL_EVENT, phase: 'choice', revision: 0,
      rolls: { success: random(), target: random(), egg: random() } }
  }
  return null
}

// Follow the actual family's reverse branches to prefer a related baby pool.
function getRemodelEggs(member, eggs, lookup) {
  const valid = (eggs ?? []).filter(egg => egg.부화가능?.some(name => isPlayableDigimon(lookup.get(name))))
  const ancestors = new Set([member.name, ...(member.evolutionHistory ?? [])])
  let frontier = new Set(ancestors)
  while (frontier.size) {
    const parents = new Set()
    for (const data of lookup.values()) {
      if (!ancestors.has(data.이름) && (data.진화가능 ?? []).some(name => frontier.has(name))) parents.add(data.이름)
    }
    for (const name of parents) ancestors.add(name)
    frontier = parents
  }
  const related = valid.filter(egg => egg.부화가능.some(name => ancestors.has(name)))
  return related.length ? related : valid
}

function finish(state, result, patch = {}) {
  const event = state.explorationEvent, memory = state.eventMemory ?? {}
  const entry = { stage: event.stage, mapName: event.mapName, storyId: event.kind,
    npc: event.kind === PORTAL_EVENT ? '차원의 통로' : '데이터 개조 기계',
    title: result.title, choiceTitle: result.choiceTitle, ending: result.ending }
  return { ok: true, logs: result.logs, sound: result.success === false ? 'debuff' : 'item',
    state: { ...state, ...patch, lastExplorationEventStage: event.stage,
      eventMemory: { ...memory, seen: { ...memory.seen, [event.kind]: (memory.seen?.[event.kind] ?? 0) + 1 },
        journal: [...(memory.journal ?? []), entry].slice(-20) },
      explorationEvent: { ...event, phase: 'result', revision: event.revision + 1, result } } }
}

export function resolveAnomalyChoice(state, command, context = {}) {
  const event = state?.explorationEvent
  const error = message => ({ ok: false, state, error: message })
  if (!isAnomalyEvent(event) || event.result || event.phase !== 'choice' || event.stage !== state.currentStage ||
    event.mapName !== state.currentMap || (state.lastExplorationEventStage ?? 0) >= event.stage ||
    !command || command.eventId !== event.id || command.revision !== event.revision) return error('만료된 선택입니다.')
  if (command.id === 'decline') return finish(state, { choiceId: 'decline', choiceTitle: '이용하지 않는다',
    title: '여정을 계속합니다', ending: event.kind === PORTAL_EVENT ? '통로를 지나치고 현재 지역을 계속 탐험합니다.' : '기계를 끄고 여정을 계속합니다.',
    logs: [event.kind === PORTAL_EVENT ? '차원의 통로를 지나쳤다.' : '데이터 개조 기계를 사용하지 않았다.'] })
  if (command.id !== 'use') return error('알 수 없는 선택입니다.')
  if (event.kind === PORTAL_EVENT) {
    if (event.destination === state.currentMap || !context.mapNames?.includes(event.destination)) return error('이동할 수 없는 지역입니다.')
    return finish(state, { choiceId: 'use', choiceTitle: '이용한다', title: '차원의 통로를 열었습니다',
      ending: '다음 스테이지부터 낯선 지역을 탐험합니다.', destination: event.destination,
      logs: [event.destination + '(으)로 이어지는 차원의 통로를 열었다!'] },
    { pendingPortalMap: { eventId: event.id, from: state.currentMap, to: event.destination } })
  }
  const option = getRemodelCandidates(state, context.speciesLookup).find(entry => entry.member.id === command.value)
  if (!option || option.disabledReason) return error(option?.disabledReason || '개조할 디지몬을 선택하세요.')
  if (![event.rolls?.success, event.rolls?.target, event.rolls?.egg].every(safeRoll)) return error('개조 데이터를 읽을 수 없습니다. 이용하지 않기를 선택하세요.')
  const previous = option.member, success = event.rolls.success < REMODEL_SUCCESS_CHANCE
  let next
  if (success) {
    const target = pick(getRemodelEvolutionTargets(previous, context.speciesLookup), event.rolls.target)
    const evolved = context.evolve(previous, target)
    next = { ...evolved, unpaidEvolutionSteps: [...(previous.unpaidEvolutionSteps ?? []), evolved.evolutionHistory.length - 1] }
  } else {
    const egg = pick(getRemodelEggs(previous, context.eggs, context.speciesLookup), event.rolls.egg)
    if (!egg) return error('부화 가능한 디지에그가 없습니다.')
    // Construct a fresh egg, rather than spreading the old combatant: equipment,
    // moves, training, statuses and history must not survive a failed rebuild.
    next = context.createEgg({ id: previous.id, eggName: egg.이름, hatchPool: egg.부화가능,
      trainerSkills: state.trainerSkills, startingSupport: state.startingSupport ?? state.townSupport })
  }
  if (!next || next === previous) return error('개조할 수 없는 디지몬입니다.')
  const party = state.party.map(unit => unit.id === previous.id ? next : unit)
  const activeAllyIds = (state.activeAllyIds ?? []).filter(id => party.some(unit => unit.id === id && living(unit)))
  const player = party.find(unit => unit.id === state.player?.id && living(unit)) ?? party.find(living)
  if (!player) return error('전투 가능한 디지몬이 필요합니다.')
  if (!activeAllyIds.length) activeAllyIds.push(player.id)
  const ending = success ? previous.name + '이(가) ' + next.name + '(으)로 진화했습니다.'
    : previous.name + '의 데이터가 디지에그로 돌아갔습니다. 장착 아이템은 모두 사라졌습니다.'
  const outcome = finish(state, { choiceId: 'use', choiceTitle: previous.name + ' 개조', title: success ? '개조 성공' : '개조 실패',
    success, ending, logs: [ending], beforeName: previous.name, memberId: next.id, afterName: next.name,
    isEgg: Boolean(next.isEgg), imageUrl: next.imageUrl },
  { party, player, activeAllyIds, actingAllyId: player.id, actedAllyIds: [], pendingAllyActions: [], awaitingReplacement: false })
  if (success) outcome.evolution = { from: previous, to: next }
  return outcome
}

export function getPendingPortalDestination(state, mapNames) {
  const transfer = state.pendingPortalMap, event = state.explorationEvent
  return transfer && event?.kind === PORTAL_EVENT && event.result?.choiceId === 'use' &&
    transfer.eventId === event.id && transfer.from === state.currentMap && transfer.to !== state.currentMap && mapNames.includes(transfer.to)
    ? transfer.to : null
}
