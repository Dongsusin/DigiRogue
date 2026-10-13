import test from 'node:test'
import assert from 'node:assert/strict'
import { reorderBattleSkill } from '../src/battle/skillOrder.js'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'

const engine = await loadBattleEngine()
const makeUnit = (name, id = name) => engine.createCombatant({ id, name, data: engine.allDigimonLookup.get(name), level: 35 })
const makeState = () => {
  const ally = makeUnit('파피몬')
  ally.skillCooldowns = { [ally.skills[0]]: 2 }
  const reserve = makeUnit('아구몬')
  return { gameMode: 'classic', currentStage: 30, currentMap: '시작의마을',
    player: ally, party: [ally, reserve], enemies: [makeUnit('가드로몬')],
    activeAllyIds: [ally.id, reserve.id], actingAllyId: ally.id,
    actedAllyIds: [reserve.id], pendingAllyActions: [{ side: 'ally', actorId: reserve.id, skillName: reserve.skills[0], targetId: '가드로몬' }],
    inventory: { 'heal-20': 2 }, gold: 1234, trainerSkills: {}, runStats: { totalTurns: 4 } }
}

test('a learned skill can move to any of eight positions without losing the order of the others', () => {
  const state = makeState()
  state.player.skills = [...state.player.skills, '헤비 스트라이크 I']
  const names = state.player.skills
  assert.equal(names.length, 8)
  const moved = names[0]
  const next = reorderBattleSkill(state, state.player.id, moved, 7)
  assert.deepEqual(next.player.skills, [...names.slice(1), moved])
  assert.deepEqual(next.party[0].skills, next.player.skills)
  assert.deepEqual(engine.getCommandSkillNames(next.player, name => engine.getSkillData(name, next.player)), next.player.skills)
  const first = reorderBattleSkill(next, next.player.id, moved, 0)
  assert.deepEqual(first.player.skills, names)
})

test('reordering preserves turn commands, cooldowns, HP, items and every other unit and does not mutate inputs', () => {
  const state = makeState(), before = structuredClone(state)
  const next = reorderBattleSkill(state, state.player.id, state.player.skills[1], 0)
  assert.notEqual(next, state)
  assert.deepEqual(state, before)
  const { skills: oldSkills, ...oldUnit } = state.player
  const { skills: newSkills, ...newUnit } = next.player
  assert.deepEqual(newUnit, oldUnit)
  assert.equal(next.party[1], state.party[1])
  for (const key of Object.keys(state).filter(key => !['player', 'party'].includes(key))) assert.equal(next[key], state[key], key)
})

test('party member identity stays correct when another ally already has a queued action', () => {
  const state = makeState(), reserve = state.party[1]
  const next = reorderBattleSkill(state, reserve.id, reserve.skills[2], 0)
  assert.equal(next.player, state.player)
  assert.equal(next.party[0], state.party[0])
  assert.equal(next.party[1].skills[0], reserve.skills[2])
  assert.deepEqual(next.pendingAllyActions, state.pendingAllyActions)
})

test('synthetic fallback attacks, unknown members, eggs and malformed positions cannot change learned skills', () => {
  const state = makeState(), id = state.player.id, name = state.player.skills[0]
  for (const index of [-1, 8, 0.5, NaN, Infinity, '1']) assert.equal(reorderBattleSkill(state, id, name, index), state)
  assert.equal(reorderBattleSkill(state, id, name, 0), state)
  assert.equal(reorderBattleSkill(state, id, '기본 타격', 1), state)
  assert.equal(reorderBattleSkill(state, 'unknown', name, 1), state)
  const egg = { ...state, player: { ...state.player, isEgg: true } }
  assert.equal(reorderBattleSkill(egg, id, name, 1), egg)
  assert.equal(reorderBattleSkill(null, id, name, 1), null)
})

test('current player skills are authoritative when its party copy is older', () => {
  const state = makeState()
  state.party[0] = { ...state.player, skills: [...state.player.skills].reverse() }
  const next = reorderBattleSkill(state, state.player.id, state.player.skills[0], 2)
  assert.deepEqual(next.player.skills, [state.player.skills[1], state.player.skills[2], state.player.skills[0], ...state.player.skills.slice(3)])
  assert.equal(next.party[0], next.player)
})

test('manual resume, new stages and normal level-ups retain the learned skill order', () => {
  const state = makeState(), name = state.player.skills[0]
  const next = reorderBattleSkill(state, state.player.id, name, 5)
  const restored = engine.parseSavedGameState(JSON.stringify({ version: 1, kind: 'manual', gameState: next }))
  assert.ok(restored)
  assert.deepEqual(restored.player.skills, next.player.skills)
  assert.deepEqual(restored.party[0].skills, next.player.skills)
  assert.deepEqual(restored.pendingAllyActions, next.pendingAllyActions)
  const levelled = engine.levelUpCombatant(next.player, next.player.level + 1)
  assert.deepEqual(levelled.skills, next.player.skills)
  const refreshed = engine.refreshCombatantStats(restored.player)
  assert.deepEqual(refreshed.skills, next.player.skills)
  for (const mapChanged of [false, true]) {
    const staged = engine.prepareCombatantForStage(restored.player, { mapChanged }, engine.refreshCombatantStats)
    assert.deepEqual(staged.skills, next.player.skills)
  }
})
