import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { simulationMoves, simulationSwitch, applySimulationSwitch } from './lib/adventure-simulation-policy.mjs'
const e = await loadBattleEngine()
const unit = (id, extra = {}) => ({ ...e.createCombatant({ id, name: '아구몬', data: e.allDigimonLookup.get('아구몬'), level: 50 }),
  passiveId: 'test-none', passiveState: {}, maxHp: 1000, currentHp: 1000, attack: 100, specialAttack: 100,
  defense: 100, specialDefense: 100, type: '무', attribute: '무', skills: ['기본 타격'], ...extra })
const fixedRandom = run => { const old = Math.random; try { Math.random = () => .5; return run() } finally { Math.random = old } }
test('a stalled healing benchmark tries damage instead of censoring an endless self-heal loop', () => {
  const ally = unit('ally', { currentHp: 300, skills: ['오라', '기본 타격'] }), enemy = unit('enemy', { defense: 5000 })
  assert.equal(simulationMoves(e, ally, [ally], [enemy])[0].name, '오라')
  assert.equal(simulationMoves(e, ally, [ally], [enemy], 24)[0].name, '기본 타격')
})
test('a stalled benchmark can switch to a living counter and cannot loop through the same reserves', () => {
  const ally = unit('ally', { type: '백신' }), reserve = unit('reserve', { type: '바이러스', attack: 300 }), dead = unit('dead', { currentHp: 0, attack: 9999 })
  const enemy = unit('enemy', { type: '데이터' }), state = { party: [ally, reserve, dead], activeIds: [ally.id], enemies: [enemy], stalledTurns: 12, usedIncomingIds: new Set([ally.id]) }
  assert.deepEqual(simulationSwitch(e, state), { outgoingId: ally.id, incomingId: reserve.id })
  assert.equal(simulationSwitch(e, { ...state, stalledTurns: 0 }), null)
  assert.equal(simulationSwitch(e, { ...state, usedIncomingIds: new Set([ally.id, reserve.id]) }), null)
})
test('a simulated manual switch ticks the incoming status once and consumes its attack while the enemy acts', () => {
  const ally = unit('ally'), reserve = unit('reserve', { statusEffect: { type: '독', turns: 2 } }), enemy = unit('enemy')
  const switched = applySimulationSwitch(e, [ally, reserve], [ally.id], { outgoingId: ally.id, incomingId: reserve.id })
  assert.deepEqual(switched.activeIds, [reserve.id]); assert.equal(switched.actedId, reserve.id)
  const afterSwitch = switched.party.find(u => u.id === reserve.id)
  assert(afterSwitch.currentHp < reserve.currentHp)
  const result = fixedRandom(() => {
    const actions = e.createEnemyBattleTurnActions({ enemies: [enemy], party: switched.party, activeAllyIds: switched.activeIds })
    return e.resolveBattleTurnActions({ party: switched.party, enemies: [enemy], activeAllyIds: switched.activeIds, actions, levelCap: 100 })
  })
  assert.equal(result.nextEnemies[0].currentHp, enemy.currentHp)
  assert(result.nextParty.find(u => u.id === reserve.id).currentHp < afterSwitch.currentHp)
  assert.equal(result.nextParty.find(u => u.id === ally.id).currentHp, ally.currentHp)
})
test('simulated switching rejects an active, dead or missing incoming member', () => {
  const ally = unit('ally'), dead = unit('dead', { currentHp: 0 })
  for (const incomingId of ['ally', 'dead', 'missing']) assert.throws(() => applySimulationSwitch(e, [ally, dead], ['ally'], { outgoingId: 'ally', incomingId }))
})

test('after 24 stalled turns a ready damaging move wins over an unused non-healing support', () => {
  const ally = unit('ally', { skills: ['어택 차지', '기본 타격'] }), enemy = unit('enemy', { defense: 5000 })
  assert.equal(simulationMoves(e, ally, [ally], [enemy])[0].name, '어택 차지')
  assert.equal(simulationMoves(e, ally, [ally], [enemy], 24)[0].name, '기본 타격')
})
test('allied support follows automatic player targeting and skips a buff that cannot improve its actor', () => {
  const ally = unit('ally', { skills: ['어택 차지', '기본 타격'], statModifiers: { attack: { multiplier: 1.3, duration: 'region' } } })
  const partner = unit('partner'), enemy = unit('enemy')
  const moves = simulationMoves(e, ally, [ally, partner], [enemy])
  assert.equal(moves.find(m => m.name === '어택 차지').targetId, null)
  assert.equal(moves.find(m => m.name === '어택 차지').score, 0)
  assert.equal(moves[0].name, '기본 타격')
})
test('a duo switch keeps the partner attack and charges exactly one incoming poison tick', () => {
  const outgoing = unit('outgoing'), partner = unit('partner'), incoming = unit('incoming', { statusEffect: { type: '독', turns: 0 } })
  const enemies = [unit('enemy-a'), unit('enemy-b')]
  const result = fixedRandom(() => {
    const switched = applySimulationSwitch(e, [outgoing, partner, incoming], ['outgoing', 'partner'], { outgoingId: 'outgoing', incomingId: 'incoming' })
    const actions = switched.activeIds.filter(id => id !== switched.actedId).map(id => e.createBattleTurnAction({ side: 'ally', actor: switched.party.find(u => u.id === id), skillName: '기본 타격', targetId: 'enemy-a' }))
    actions.push(...e.createEnemyBattleTurnActions({ enemies, party: switched.party, activeAllyIds: switched.activeIds, startOrder: actions.length }))
    return e.resolveBattleTurnActions({ party: switched.party, enemies, activeAllyIds: switched.activeIds, actions, levelCap: 100 })
  })
  assert(result.nextEnemies[0].currentHp < enemies[0].currentHp)
  assert.equal(result.nextEnemies[1].currentHp, enemies[1].currentHp)
  assert.equal(result.nextParty.find(u => u.id === 'incoming').statusEffect.turns, 1)
  assert.equal(result.nextParty.find(u => u.id === 'outgoing').currentHp, outgoing.currentHp)
})
test('a null-target allied heal uses the actual lowest-HP active ally and never heals a reserve', () => {
  const actor = unit('actor', { skills: ['힐', '기본 타격'] }), partner = unit('partner', { currentHp: 100 }), reserve = unit('reserve', { currentHp: 1 }), enemy = unit('enemy')
  const move = simulationMoves(e, actor, [actor, partner], [enemy], 0, [actor, partner, reserve])[0]
  assert.equal(move.name, '힐'); assert.equal(move.targetId, null)
  const result = fixedRandom(() => e.resolveBattleTurnActions({ party: [actor, partner, reserve], enemies: [enemy], activeAllyIds: ['actor', 'partner'],
    actions: [e.createBattleTurnAction({ side: 'ally', actor, skillName: move.name, targetId: move.targetId })], levelCap: 100 }))
  assert(result.nextParty[1].currentHp > partner.currentHp)
  assert.equal(result.nextParty[0].currentHp, actor.currentHp)
  assert.equal(result.nextParty[2].currentHp, reserve.currentHp)
})
