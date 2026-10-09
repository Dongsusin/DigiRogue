import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { writeSaveSlot, readSaveSlot } from '../src/progression/saveSlots.js'

const engine = await loadBattleEngine()
const allSkills = [...engine.allSkillLookup.keys()]
const initialSkills = allSkills.slice(0, 8)
const ninth = allSkills[8], tenth = allSkills[9], eleventh = allSkills[10]
function member(level = 9, options = {}) {
  const data = { ...engine.allDigimonLookup.get('아구몬'), 기술: initialSkills,
    어티치먼트: [{ 레벨: 10, 기술: ninth }, { 레벨: 12, 기술: tenth }, { 레벨: 14, 기술: eleventh }, ...(options.attachments ?? [])] }
  const unit = engine.createCombatant({ id: options.id ?? 'learner', name: '아구몬', data, level })
  return { ...unit, skills: [...(options.skills ?? initialSkills)] }
}
function advance(unit) {
  return engine.applyExperienceAmount({ combatant: unit, experienceAmount: unit.experienceToNext - unit.experience, levelCap: 200 })
}
function storage() {
  const bank = new Map()
  return { getItem: key => bank.get(key) ?? null, setItem: (key, value) => bank.set(key, value) }
}

test('a ninth skill is offered once at its exact unlock level', () => {
  const result = advance(member())
  assert.equal(result.nextCombatant.level, 10)
  assert.deepEqual(result.skillLearnEvents.map(e => [e.newSkillName, e.level]), [[ninth, 10]])
  assert.equal(result.nextCombatant.skills.length, 8)
})
test('declining a full-roster offer does not repeat it at the next level', () => {
  const first = advance(member())
  const next = advance(first.nextCombatant)
  assert.equal(next.nextCombatant.level, 11)
  assert.deepEqual(next.skillLearnEvents, [])
  assert.deepEqual(next.nextCombatant.skills, initialSkills)
})
test('later unlocks are still offered after an earlier skill was declined', () => {
  const first = advance(member())
  const second = advance(advance(first.nextCombatant).nextCombatant)
  assert.deepEqual(second.skillLearnEvents.map(e => [e.newSkillName, e.level]), [[tenth, 12]])
})
test('replacing a skill does not offer the forgotten earlier skill again', () => {
  const first = advance(member())
  const learned = { ...first.nextCombatant, skills: [ninth, ...initialSkills.slice(1)] }
  const next = advance(learned)
  assert.deepEqual(next.skillLearnEvents, [])
  assert.deepEqual(next.nextCombatant.skills, learned.skills)
})
test('one experience gain crossing several levels offers each due skill at its own level', () => {
  const start = member()
  let amount = 0
  for (let level = 9; level < 14; level++) amount += engine.levelUpCombatant(start, level).experienceToNext
  const result = engine.applyExperienceAmount({ combatant: start, experienceAmount: amount, levelCap: 200 })
  assert.equal(result.nextCombatant.level, 14)
  assert.deepEqual(result.skillLearnEvents.map(e => [e.newSkillName, e.level]), [[ninth, 10], [tenth, 12], [eleventh, 14]])
})
test('single and party level-up item ranges do not re-offer a past unlock', () => {
  const declined = member(10)
  assert.deepEqual(engine.getSkillLearnEventsForLevelRange(declined, 10, 11), [])
  assert.deepEqual(engine.getSkillLearnEventsForLevelRange(declined, 10, 14).map(e => [e.newSkillName, e.level]), [[tenth, 12], [eleventh, 14]])
})
test('level-up items preserve free slots for newly reached skills instead of past declines', () => {
  const declined = member(10, { skills: initialSkills.slice(0, 7) })
  const next = engine.applyLevelUpRewardEffect(declined, 2, 200)
  assert.deepEqual(next.skills, [...declined.skills, tenth])
  assert(!next.skills.includes(ninth))
  assert.deepEqual(engine.getSkillLearnEventsForLevelRange(declined, 10, 12), [])
})
test('a regular stat refresh does not silently learn an already missed skill', () => {
  const declined = member(11, { skills: initialSkills.slice(0, 7) })
  const next = engine.refreshCombatantStats(declined)
  assert.deepEqual(next.skills, declined.skills)
})
test('duplicate learnset rows do not offer the same skill again at another level', () => {
  const declined = member(11, { attachments: [{ 레벨: 12, 기술: ninth }] })
  assert.deepEqual(engine.getNewSkillLearnNamesForLevel(declined, 12), [tenth])
})
test('automatic learning still fills free slots at the correct unlock level and logs it', () => {
  const start = member(9, { skills: initialSkills.slice(0, 7) })
  const result = advance(start)
  assert.deepEqual(result.nextCombatant.skills, [...start.skills, ninth])
  assert.deepEqual(result.skillLearnEvents, [])
  assert(result.battleLogs.some(line => line.includes(ninth) && line.includes('배웠다')))
})
test('multiple skills at one unlock level use free slots before prompting for the rest', () => {
  const start = member(9, { skills: initialSkills.slice(0, 7), attachments: [{ 레벨: 10, 기술: eleventh }] })
  const result = advance(start)
  assert.deepEqual(result.nextCombatant.skills, [...start.skills, ninth])
  assert.deepEqual(result.skillLearnEvents.map(e => [e.newSkillName, e.level]), [[eleventh, 10]])
})
test('no growth at the cap and a non-increasing item range cannot prompt for a skill', () => {
  const start = member(10)
  const result = engine.applyExperienceAmount({ combatant: start, experienceAmount: 100000, levelCap: 10 })
  assert.deepEqual(result.skillLearnEvents, [])
  assert.deepEqual(engine.getSkillLearnEventsForLevelRange(start, 10, 10), [])
  assert.deepEqual(engine.getNewSkillLearnNamesForLevel(start, 10), [])
})
test('legacy automatic and all three manual saves retain the level checkpoint after declining', () => {
  const data = [...engine.allDigimonLookup.values()].find(data => new Set([...(data.기술 ?? []), ...(data.어티치먼트 ?? []).map(entry => entry.기술)]).size > 8)
  assert(data)
  const level = Math.max(1, ...(data.어티치먼트 ?? []).map(entry => Number(entry.레벨) || 0))
  const start = engine.createCombatant({ id: 'saved-learner', name: data.이름, data, level })
  const state = { currentStage: 191, currentMap: '기어 포레스트', gameMode: 'classic', player: start, party: [start], enemies: [], activeAllyIds: [start.id], inventory: {}, trainerSkills: {} }
  const store = storage()
  for (const slot of ['auto', 'manual-1', 'manual-2', 'manual-3']) {
    assert(writeSaveSlot(store, slot, state))
    const snapshot = readSaveSlot(store, slot, engine.parseSavedGameState)
    assert.equal(snapshot.status, 'ready')
    assert.equal(snapshot.state.player.level, level)
    assert.deepEqual(advance(snapshot.state.player).skillLearnEvents, [], slot)
  }
})
test('separate party members each receive their own once-per-level learning opportunity', () => {
  const first = advance(member(9, { id: 'first' }))
  const second = advance(member(9, { id: 'second' }))
  assert.equal(first.skillLearnEvents[0].combatantId, 'first')
  assert.equal(second.skillLearnEvents[0].combatantId, 'second')
  assert.deepEqual(advance(first.nextCombatant).skillLearnEvents, [])
  assert.deepEqual(advance(second.nextCombatant).skillLearnEvents, [])
})

test('all 512 real species stop proposing missing past skills after their final unlock', () => {
  assert.equal(engine.allDigimonLookup.size, 512)
  for (const data of engine.allDigimonLookup.values()) {
    const level = Math.max(1, ...(data.어티치먼트 ?? []).map(entry => Number(entry.레벨) || 0))
    const start = engine.createCombatant({ id: data.이름, name: data.이름, data, level })
    assert.deepEqual(advance(start).skillLearnEvents, [], data.이름)
    assert.deepEqual(engine.getSkillLearnEventsForLevelRange(start, level, level + 3), [], data.이름)
  }
})
