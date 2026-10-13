import test from 'node:test'
import assert from 'node:assert/strict'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { createExplorationEvent, resolveExplorationChoice, upgradeExplorationEvent } from '../src/adventure/explorationEvents.js'
import { createAnomalyProgress, resolveAnomalyChoice, getRemodelCandidates, getRemodelEvolutionTargets,
  getPendingPortalDestination, PORTAL_EVENT, REMODEL_EVENT } from '../src/adventure/anomalyEvents.js'
import { getEvolutionRoute } from '../src/data/evolutionRules.js'
import { inferEvolutionMemory, hasEvolutionMemory } from '../src/progression/evolutionMemory.js'
import { recordGameCollection, normalizeCollection, getCollectionStatus } from '../src/progression/digimonCollection.js'
const e = await loadBattleEngine(), context = e.explorationContext
const unit = (name, id = name) => e.createCombatant({ id, name, data: e.allDigimonLookup.get(name), level: 1 })
const base = (party = [unit('아구몬'), unit('파피몬')]) => ({ party, player: party[0], enemies: [],
  currentStage: 5, currentMap: '시작의마을', gameMode: 'classic', trainerSkills: {}, inventory: { 'jogress-chip': 3 },
  activeAllyIds: [party[0].id], eventMemory: {}, gold: 999 })
const random = values => { let index = 0; return () => values[index++] ?? .9 }
const offer = (state, kind, rolls = {}) => ({ ...state, explorationEvent: { id: 'exploration-' + state.currentStage,
  version: 7, stage: state.currentStage, mapName: state.currentMap, kind, phase: 'choice', revision: 0, result: null,
  destination: context.mapNames.find(name => name !== state.currentMap), rolls: { success: .2, target: .1, egg: .5, ...rolls } } })
const command = (state, id = 'use', value = state.party[0].id) => ({ eventId: state.explorationEvent.id,
  revision: state.explorationEvent.revision, id, value })
const resolve = (state, id = 'use', value) => resolveExplorationChoice(state, command(state, id, value), e.refreshCombatantStats, context)

test('eligible exploration slots can offer both events; living enemies and non-event floors cannot', () => {
  const state = base()
  assert.equal(createExplorationEvent(state, { ...context, cleared: true, random: random([0, .5]) }).kind, PORTAL_EVENT)
  assert.equal(createExplorationEvent(state, { ...context, cleared: true, random: random([.9, 0, .2, .3, .4]) }).kind, REMODEL_EVENT)
  for (const stage of [1, 4, 6, 10, 200]) assert.equal(createExplorationEvent({ ...state, currentStage: stage }, { ...context, cleared: true }), null)
  assert.equal(createExplorationEvent(state, { ...context, cleared: false }), null)
  assert.equal(createExplorationEvent({ ...state, enemies: [unit('팔몬')] }, { ...context, cleared: true }), null)
  assert.equal(createExplorationEvent({ ...state, lastExplorationEventStage: 5 }, { ...context, cleared: true }), null)
})

test('portal offers occur near once per full run and cannot return after use or refusal', () => {
  let seed = 321, total = 0
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  for (let run = 0; run < 3000; run++) {
    let state = base(), count = 0
    for (let stage = 5; stage < 200; stage += 10) {
      state = { ...state, currentStage: stage, explorationEvent: null }
      const event = createExplorationEvent(state, { ...context, cleared: true, random: next })
      if (event.kind === PORTAL_EVENT) {
        count++
        state = resolve({ ...state, explorationEvent: event }, 'decline').state
      }
    }
    assert(count <= 1); total += count
  }
  assert(total / 3000 > .77 && total / 3000 < .85, 'offer frequency ' + total / 3000)
})

test('portal use stores a different real destination, without changing stage, cap, or party before transfer', () => {
  const state = offer({ ...base(), levelCap: 14 }, PORTAL_EVENT), before = structuredClone(state)
  const outcome = resolve(state)
  assert(outcome.ok); assert.equal(state.currentMap, before.currentMap)
  assert.equal(outcome.state.currentMap, state.currentMap); assert.equal(outcome.state.currentStage, 5)
  assert.equal(outcome.state.levelCap, 14); assert.deepEqual(outcome.state.party, state.party)
  assert.equal(getPendingPortalDestination(outcome.state, context.mapNames), state.explorationEvent.destination)
  assert.notEqual(state.explorationEvent.destination, state.currentMap)
  assert.deepEqual(state, before)
  assert.equal(resolve(outcome.state).ok, false)
  assert.equal(createAnomalyProgress({ ...outcome.state, explorationEvent: null }, { ...context, random: () => 0 })?.kind, REMODEL_EVENT)
})

test('declining portal leaves map, inventory, HP and pending transition untouched', () => {
  const state = offer(base(), PORTAL_EVENT), outcome = resolve(state, 'decline')
  assert(outcome.ok); assert.equal(outcome.state.currentMap, state.currentMap)
  assert.equal(outcome.state.pendingPortalMap, undefined)
  assert.deepEqual(outcome.state.party, state.party); assert.deepEqual(outcome.state.inventory, state.inventory)
  assert.equal(outcome.state.eventMemory.seen[PORTAL_EVENT], 1)
  assert.equal(getPendingPortalDestination(outcome.state, context.mapNames), null)
})

test('every destination supports the current encounter tiers and preserves map-specific bosses', () => {
  for (const map of context.mapNames) for (const stage of [6, 16, 56, 96, 156, 196]) {
    assert(e.getMapEncounterGroups(map)[e.getEncounterGroupForStage(stage)]?.length, map + ':' + stage)
    assert(e.getBossEncounterNamesForStage(map, stage + 4).length >= 3, map)
  }
})

test('machine covers every authored evolution branch, including all catalyst and fusion routes', () => {
  let count = 0, items = 0, fusions = 0
  for (const data of e.allDigimonLookup.values()) {
    const targets = getRemodelEvolutionTargets(unit(data.이름), e.allDigimonLookup)
    const expected = [...new Set(data.진화가능)].filter(name => e.allDigimonLookup.has(name) && getEvolutionRoute(data.이름, name, e.allDigimonLookup.get(name).stage))
    assert.deepEqual(targets.map(target => target.이름), expected, data.이름)
    for (const target of targets) {
      count++
      const route = getEvolutionRoute(data.이름, target.이름, target.stage)
      if (route.kind === 'item') items++
      if (route.kind === 'jogress') fusions++
    }
  }
  assert(count > 250); assert(items > 30); assert(fusions > 20)
})

for (const [source, target] of [['오메가몬','오메가몬[머시풀]'],['워그레이몬','오메가몬']]) {
  test(source + ' → ' + target + ': machine waives catalyst/fusion conditions and does not consume another party member', () => {
    const state = offer(base([unit(source), unit('아구몬')]), REMODEL_EVENT)
    const targets = getRemodelEvolutionTargets(state.party[0], e.allDigimonLookup)
    const index = targets.findIndex(data => data.이름 === target)
    assert(index >= 0)
    state.explorationEvent.rolls.target = (index + .5) / targets.length
    const outcome = resolve(state)
    assert(outcome.ok); assert.equal(outcome.state.party[0].name, target)
    assert.equal(outcome.state.party[0].level, 1)
    assert.equal(outcome.state.party.length, 2); assert.deepEqual(outcome.state.party[1], state.party[1])
    assert.deepEqual(outcome.state.inventory, state.inventory)
    assert.deepEqual(outcome.state.party[0].unpaidEvolutionSteps, [0])
    assert.deepEqual(inferEvolutionMemory(outcome.state.party), [])
    const loaded = e.parseSavedGameState(JSON.stringify({ version: 1, gameState: outcome.state }))
    assert(loaded); assert(!hasEvolutionMemory(loaded.evolutionMemory, [source], target))
    assert.deepEqual(inferEvolutionMemory(loaded.party), [])
    const reverted = e.createReturnedEvolutionCombatant(outcome.state.party[0])
    assert.equal(reverted.name, source); assert.deepEqual(reverted.unpaidEvolutionSteps, [])
    const ordinary = e.createEvolvedCombatant(reverted, e.allDigimonLookup.get(target))
    assert(inferEvolutionMemory([ordinary]).length > 0, 'later paid/ordinary route still infers correctly')
    const later = e.createEvolvedCombatant(outcome.state.party[0], e.allDigimonLookup.get('팔몬'))
    assert.deepEqual(later.unpaidEvolutionSteps, [0]); assert.deepEqual(inferEvolutionMemory([later]), [])
  })
}

test('successful remodeling ignores level/stats/items, preserves equipment, and unlocks evolved form', () => {
  const initial = { ...unit('아구몬'), typePowerUps: { 백신: 2 }, attributePowerUps: { 화염: 1 },
    digiclones: { attack: 3 }, recoveryPrograms: { 'rest-hp': 1 }, battleItems: { 'critical-claw': 1 },
    currentHp: 7, maxHp: 14 }
  const state = offer(base([initial, unit('파피몬')]), REMODEL_EVENT)
  assert(e.getEvolutionOptions(initial, {}, state.party).every(option => !option.canEvolve))
  const outcome = resolve(state)
  assert(outcome.ok); const evolved = outcome.state.party[0]
  assert.equal(evolved.level, 1); assert.notEqual(evolved.name, initial.name)
  assert.deepEqual(evolved.evolutionHistory, ['아구몬'])
  assert(evolved.currentHp > 0 && evolved.currentHp < evolved.maxHp)
  for (const key of ['typePowerUps', 'attributePowerUps', 'digiclones', 'recoveryPrograms', 'battleItems'])
    assert.deepEqual(evolved[key], e.createEvolvedCombatant(initial, evolved.speciesData)[key])
  assert.deepEqual(outcome.state.inventory, state.inventory); assert.equal(outcome.state.gold, state.gold)
  assert.equal(outcome.evolution.to.name, evolved.name)
  const collection = recordGameCollection(normalizeCollection(), outcome.state)
  assert.equal(getCollectionStatus(collection, evolved.name), 'unlocked')
})

test('failed remodeling creates a fresh hatchable egg and deletes all equipped gear and old combat data', () => {
  const previous = { ...unit('아구몬'), level: 50, evolutionHistory: ['깜몬','코로몬'],
    typePowerUps: { 백신: 2 }, attributePowerUps: { 화염: 2 }, digiclones: { attack: 15 },
    recoveryPrograms: { 'rest-hp': 1 }, battleItems: { 'critical-claw': 1 },
    inheritedSkills: ['쁘띠 파이어'], pendingJogressSkills: ['쁘띠 썬더'],
    statusEffect: { kind: 'poison' }, skillCooldowns: { test: 4 } }
  const state = offer(base([previous, unit('파피몬')]), REMODEL_EVENT, { success: .5 })
  const outcome = resolve(state); assert(outcome.ok)
  const egg = outcome.state.party[0]
  assert(egg.isEgg); assert.equal(egg.id, previous.id); assert.equal(egg.level, 1)
  assert(egg.eggHatchPool.length && egg.eggStagesRemaining > 0)
  for (const key of ['typePowerUps','attributePowerUps','digiclones','recoveryPrograms','battleItems'])
    assert(Object.values(egg[key]).every(value => value === 0 || value === null), key)
  assert.deepEqual(egg.skills, []); assert.equal(egg.statusEffect, null)
  for (const key of ['inheritedSkills','pendingJogressSkills','evolutionHistory','skillCooldowns','unpaidEvolutionSteps']) assert.equal(egg[key], undefined)
  assert.equal(outcome.state.player.name, '파피몬'); assert.deepEqual(outcome.state.activeAllyIds, ['파피몬'])
  assert.deepEqual(outcome.state.party[1], state.party[1]); assert.deepEqual(outcome.state.inventory, state.inventory)
  let party = outcome.state.party
  for (let stage = 0; stage < egg.eggStagesRemaining; stage++) party = e.progressDigiEggPartyByStage(party).nextParty
  assert(!party[0].isEgg); assert(party[0].currentHp > 0); assert.equal(party.length, 2)
})

test('all eight party members including eggs remain visible; eggs, last fighter and forms without routes are disabled', () => {
  const egg = e.createDigiEggCombatant({ id: 'egg', eggName: '용기', hatchPool: ['깜몬'] })
  const party = [unit('아구몬'), ...Array.from({ length: 7 }, (_, i) => ({ ...egg, id: 'egg-' + i }))]
  const options = getRemodelCandidates(base(party), e.allDigimonLookup)
  assert.equal(options.length, 8); assert(options.every(option => option.disabledReason))
  assert.equal(resolve(offer(base(party), REMODEL_EVENT)).ok, false)
  assert.equal(resolve(offer(base(), REMODEL_EVENT), 'use', 'not-owned').ok, false)
  const terminal = [...e.allDigimonLookup.values()].find(data => !data.진화가능?.length)
  assert(getRemodelCandidates(base([unit(terminal.이름), unit('파피몬')]), e.allDigimonLookup)[0].disabledReason)
})

test('daily excludes egg-reset machine while allowing portals', () => {
  const state = { ...base(), gameMode: 'daily' }
  assert.equal(createAnomalyProgress(state, { ...context, random: () => 0 }).kind, PORTAL_EVENT)
  assert.equal(createAnomalyProgress(state, { ...context, random: () => .1 }), null)
  assert.equal(resolve(offer(state, REMODEL_EVENT)).ok, false)
  assert.equal(resolve(offer(state, REMODEL_EVENT), 'decline').ok, true)
})

test('machine can be declined without any party, item or currency change', () => {
  const state = offer(base(), REMODEL_EVENT), outcome = resolve(state, 'decline')
  assert(outcome.ok); assert.deepEqual(outcome.state.party, state.party)
  assert.deepEqual(outcome.state.inventory, state.inventory); assert.equal(outcome.state.gold, state.gold)
  assert.equal(outcome.evolution, undefined)
})

test('pending events and frozen random outcomes survive actual save parsing and cannot be claimed twice', () => {
  for (const kind of [PORTAL_EVENT, REMODEL_EVENT]) for (const success of [.1, .9]) {
    const state = offer(base(), kind, { success })
    const reloaded = e.parseSavedGameState(JSON.stringify({ version: 1, kind: 'auto', gameState: state }))
    assert(reloaded); assert.deepEqual(reloaded.explorationEvent, state.explorationEvent)
    assert.equal(upgradeExplorationEvent(state), state)
    const first = resolve(state), second = resolve(reloaded)
    assert(first.ok && second.ok); assert.deepEqual(first.state.explorationEvent.result, second.state.explorationEvent.result)
    const finished = e.parseSavedGameState(JSON.stringify({ version: 1, kind: 'auto', gameState: first.state }))
    assert(finished); assert.deepEqual(finished.explorationEvent.result, first.state.explorationEvent.result)
    assert.equal(resolve(finished).ok, false)
    if (kind === PORTAL_EVENT) assert.equal(getPendingPortalDestination(finished, context.mapNames), state.explorationEvent.destination)
  }
})

test('stale, invalid, duplicate and cross-stage commands cannot mutate state', () => {
  const state = offer(base(), REMODEL_EVENT), before = structuredClone(state)
  for (const patch of [{ eventId: 'other' }, { revision: 99 }, { id: 'anything' }, { value: 'other' }])
    assert.equal(resolveAnomalyChoice(state, { ...command(state), ...patch }, context).ok, false)
  assert.equal(resolve({ ...state, currentStage: 6 }).ok, false)
  assert.equal(resolve({ ...state, currentMap: '미하라시 산' }).ok, false)
  assert.equal(resolve(offer(base(), REMODEL_EVENT, { success: null })).ok, false)
  assert.deepEqual(state, before)
})
