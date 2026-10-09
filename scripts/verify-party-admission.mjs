import test from 'node:test'
import assert from 'node:assert/strict'
import { PARTY_CAPACITY } from '../src/data/partyLimits.js'
import { STARTER_TEAM_LIMIT } from '../src/data/starterSelection.js'
import { admitPartyMember, getPartyReplacementError, queuePartyAdmission, dismissPartyAdmission, normalizePartyCapacity } from '../src/battle/partyAdmission.js'
import { hatchAnalyzedDigimon, restoreRewardCheckpoint } from '../src/battle/digimonAnalysis.js'
import { writeSaveSlot, readSaveSlot } from '../src/progression/saveSlots.js'

const unit = (id, extra = {}) => ({ id, name: '아구몬', currentHp: 30, maxHp: 30, level: 5, ...extra })
const egg = (id, extra = {}) => unit(id, { name: '용기 디지에그', isEgg: true, eggName: '용기', eggStagesRemaining: 5, currentHp: 0, ...extra })
const state = (count = 8, extra = {}) => {
  const party = Array.from({ length: count }, (_, i) => unit('ally-' + i))
  return { currentStage: 1, currentMap: '작은 숲', gameMode: 'classic', party, player: party[0], activeAllyIds: [party[0].id],
    actingAllyId: party[0].id, actedAllyIds: [], pendingAllyActions: [], gold: 500, inventory: {},
    digimonAnalysis: { 추추몬: 100, 워그레이몬: 30 }, unlockedSpecies: [], ...extra }
}
const scan = (current, replacementId) => hatchAnalyzedDigimon(current, '추추몬', (name, id) => unit(id, { name }), replacementId)
const storage = () => { const bank = new Map(); return { getItem: key => bank.get(key) ?? null, setItem: (key, value) => bank.set(key, value) } }

test('starters and acquired party members share the same eight-slot capacity', () => {
  assert.equal(PARTY_CAPACITY, 8)
  assert.equal(STARTER_TEAM_LIMIT, PARTY_CAPACITY)
})
test('a seventh member can receive an eighth egg without a release', () => {
  const current = state(7)
  const result = admitPartyMember(current, egg('new'))
  assert(result.ok)
  assert.equal(result.state.party.length, 8)
  assert.equal(result.state.party[7].isEgg, true)
  assert.equal(current.party.length, 7)
  assert.equal(result.state.gold, 500)
})
test('eggs count toward capacity and a ninth egg never enters the party', () => {
  const current = state(8)
  current.party[7] = egg('old-egg')
  const result = admitPartyMember(current, egg('new'))
  assert(!result.ok && result.requiresReplacement)
  assert.equal(result.state, current)
  assert.equal(current.party.length, 8)
})
test('confirmed egg replacement keeps the selected slot and every other member', () => {
  const current = state()
  const result = admitPartyMember(current, egg('new'), 'ally-6')
  assert(result.ok)
  assert.equal(result.state.party.length, 8)
  assert.equal(result.state.party[6].id, 'new')
  assert.equal(result.released.id, 'ally-6')
  assert.equal(result.state.party[7], current.party[7])
})
test('one egg can replace another egg', () => {
  const current = state()
  current.party[7] = egg('old-egg')
  const result = admitPartyMember(current, egg('new'), 'old-egg')
  assert(result.ok)
  assert.equal(result.state.party[7].id, 'new')
})
test('an egg cannot replace the last living owned Digimon', () => {
  const current = state(1)
  current.party.push(...Array.from({ length: 7 }, (_, i) => egg('egg-' + i)))
  assert.match(getPartyReplacementError(current, egg('new'), current.player.id), /마지막/)
  const result = admitPartyMember(current, egg('new'), current.player.id)
  assert(!result.ok)
  assert.equal(result.state, current)
  assert(admitPartyMember(current, egg('new'), 'egg-6').ok)
})
test('a living scanned Digimon may replace the last living owned Digimon', () => {
  const current = state(1)
  current.party.push(...Array.from({ length: 7 }, (_, i) => egg('egg-' + i)))
  const result = scan(current, current.player.id)
  assert(result.ok)
  assert.equal(result.state.player.name, '추추몬')
  assert.deepEqual(result.state.activeAllyIds, [result.member.id])
})
test('releasing the player updates player, acting member and queued commands', () => {
  const current = state(8, { actedAllyIds: ['ally-0', 'ally-1'], pendingAllyActions: [{ actorId: 'ally-0' }, { actorId: 'ally-1' }] })
  const result = admitPartyMember(current, unit('new'), 'ally-0')
  assert(result.ok)
  assert.equal(result.state.player.id, 'new')
  assert.equal(result.state.actingAllyId, 'new')
  assert.deepEqual(result.state.activeAllyIds, ['new'])
  assert.deepEqual(result.state.actedAllyIds, ['ally-1'])
  assert.deepEqual(result.state.pendingAllyActions, [{ actorId: 'ally-1' }])
})
test('releasing an active member for an egg selects a living reserve instead of an egg', () => {
  const result = admitPartyMember(state(), egg('new'), 'ally-0')
  assert(result.ok)
  assert.equal(result.state.player.id, 'ally-1')
  assert.deepEqual(result.state.activeAllyIds, ['ally-1'])
})
test('unknown release IDs and duplicate incoming IDs cannot change the roster', () => {
  const current = state()
  assert(!admitPartyMember(current, egg('new'), 'missing').ok)
  assert(!admitPartyMember(current, unit('ally-0'), 'ally-1').ok)
  assert.equal(current.party.length, 8)
})
test('temporary regional support neither occupies an owned slot nor can be released', () => {
  const current = state(7)
  current.party.push(unit('helper', { regionalSupport: true }))
  current.regionalSupport = { unit: current.party.at(-1) }
  const result = admitPartyMember(current, egg('new'))
  assert(result.ok)
  assert.equal(result.state.party.length, 8)
  assert.equal(result.state.regionalSupport, current.regionalSupport)
  assert(!admitPartyMember(result.state, egg('next'), 'helper').ok)
  assert(!admitPartyMember(current, unit('new-helper', { regionalSupport: true })).ok)
})
test('full-party scan leaves the 100% sample, count and unlocks untouched', () => {
  const current = state()
  const result = scan(current)
  assert(!result.ok && result.requiresReplacement)
  assert.equal(result.state, current)
  assert.equal(current.digimonAnalysis.추추몬, 100)
  assert.equal(current.scanHatchCount, undefined)
  assert.deepEqual(current.unlockedSpecies, [])
})
test('confirmed scan replacement consumes the sample and unlocks the species exactly once', () => {
  const result = scan(state(), 'ally-7')
  assert(result.ok)
  assert.equal(result.state.party.length, 8)
  assert.equal(result.state.party[7].name, '추추몬')
  assert.equal(result.state.scanHatchCount, 1)
  assert.deepEqual(result.state.digimonAnalysis, { 워그레이몬: 30 })
  assert.deepEqual(result.state.unlockedSpecies, ['추추몬'])
  assert(!scan(result.state, 'ally-6').ok)
})
test('invalid scan replacement leaves progress untouched', () => {
  const current = state()
  const result = scan(current, 'not-owned')
  assert(!result.ok)
  assert.equal(result.state, current)
  assert.equal(result.state.digimonAnalysis.추추몬, 100)
})
test('cancelling a pending egg or scan only removes that request', () => {
  for (const kind of ['egg', 'scan']) {
    const current = state()
    const queued = queuePartyAdmission(current, { kind, member: kind === 'egg' ? egg('new') : unit('new', { name: '추추몬' }), itemId: 'egg-reward' })
    assert.equal(queued.party.length, 8)
    assert.equal(queued.pendingPartyAdmissions.length, 1)
    const cancelled = dismissPartyAdmission(queued, 'new')
    assert.deepEqual(cancelled.pendingPartyAdmissions, [])
    for (const field of ['party', 'gold', 'inventory', 'digimonAnalysis', 'unlockedSpecies', 'currentStage']) assert.deepEqual(cancelled[field], current[field])
  }
})
test('duplicate recruitment clicks and stale decisions do not append or discard requests', () => {
  const queued = queuePartyAdmission(state(), { kind: 'egg', member: egg('new') })
  assert.equal(queuePartyAdmission(queued, { kind: 'egg', member: egg('other') }), queued)
  assert.equal(dismissPartyAdmission(queued, 'other'), queued)
  const decided = dismissPartyAdmission(queued, 'new')
  assert.equal(dismissPartyAdmission(decided, 'new'), decided)
})
test('legacy overflow keeps active members and all excess members in a durable queue', () => {
  const current = state(12)
  current.party[7] = egg('egg-7')
  current.player = current.party[11]
  current.actingAllyId = current.player.id
  current.activeAllyIds = ['ally-10', 'ally-11']
  const normalized = normalizePartyCapacity(current)
  assert.equal(normalized.party.length, 8)
  assert.equal(normalized.pendingPartyAdmissions.length, 4)
  assert(normalized.party.some(unit => unit.id === 'ally-10'))
  assert(normalized.party.some(unit => unit.id === 'ally-11'))
  const ids = [...normalized.party, ...normalized.pendingPartyAdmissions.map(request => request.member)].map(unit => unit.id).sort()
  assert.deepEqual(ids, current.party.map(unit => unit.id).sort())
  assert.deepEqual(normalizePartyCapacity(normalized), normalized)
})
test('legacy migration retains a living member even when the current member is fainted', () => {
  const current = state(10)
  current.party.forEach(unit => { unit.currentHp = 0 })
  current.party[9].currentHp = 30
  const normalized = normalizePartyCapacity(current)
  assert(normalized.party.some(unit => unit.currentHp > 0))
  assert.equal(normalized.party.length, 8)
})
test('legacy excess decisions can be accepted or released one by one and never exceed eight', () => {
  let current = normalizePartyCapacity(state(10))
  const first = current.pendingPartyAdmissions[0]
  const admitted = admitPartyMember(current, first.member, 'ally-7')
  assert(admitted.ok)
  current = dismissPartyAdmission(admitted.state, first.member.id)
  assert.equal(current.party.length, 8)
  assert.equal(current.pendingPartyAdmissions.length, 1)
  current = dismissPartyAdmission(current, current.pendingPartyAdmissions[0].member.id)
  assert.equal(current.party.length, 8)
  assert.equal(current.pendingPartyAdmissions.length, 0)
})
test('automatic and manual saves preserve a pending recruitment without spending its resources', () => {
  const bank = storage()
  const current = queuePartyAdmission(state(), { kind: 'scan', member: unit('new', { name: '추추몬' }), scanName: '추추몬' })
  for (const slot of ['auto', 'manual-1', 'manual-2', 'manual-3']) {
    assert(writeSaveSlot(bank, slot, current))
    const restored = readSaveSlot(bank, slot, raw => normalizePartyCapacity(JSON.parse(raw).gameState))
    assert.equal(restored.status, 'ready')
    assert.equal(restored.state.party.length, 8)
    assert.equal(restored.state.pendingPartyAdmissions[0].member.id, 'new')
    assert.equal(restored.state.digimonAnalysis.추추몬, 100)
    assert.deepEqual(restored.state.unlockedSpecies, [])
  }
})
test('pending egg saves keep the same offered reward and recover it after reload', () => {
  const current = queuePartyAdmission(state(8, { enemies: [{ currentHp: 0 }], rewardCheckpoint: { stage: 1, itemIds: ['digi-egg-1'], rerollCount: 0, rerollCost: 80 } }),
    { kind: 'egg', member: egg('new'), itemId: 'digi-egg-1', source: 'random' })
  const bank = storage()
  assert(writeSaveSlot(bank, 'auto', current))
  const restored = readSaveSlot(bank, 'auto', raw => normalizePartyCapacity(JSON.parse(raw).gameState)).state
  const reward = restoreRewardCheckpoint(restored, new Map([['digi-egg-1', { id: 'digi-egg-1', digiEggName: '용기' }]]))
  assert.equal(reward.randomItems[0].id, 'digi-egg-1')
  assert.equal(restored.pendingPartyAdmissions[0].member.id, 'new')
  assert.equal(restored.party.length, 8)
})
test('daily mode still forbids scan recruitment even with a replacement selection', () => {
  const current = state(2, { gameMode: 'daily' })
  assert(!scan(current, current.player.id).ok)
  assert.equal(current.party.length, 2)
})

test('a pending decision cannot be bypassed by another recruitment', () => {
  const current = queuePartyAdmission(state(), { kind: 'egg', member: egg('pending') })
  const blocked = admitPartyMember(current, unit('other'), 'ally-7')
  assert(!blocked.ok)
  assert.equal(blocked.state, current)
  assert(admitPartyMember(current, current.pendingPartyAdmissions[0].member, 'ally-7').ok)
})
test('legacy saves without a formation still allow the loader to restore the encounter formation', () => {
  const current = state(10)
  delete current.activeAllyIds
  const normalized = normalizePartyCapacity(current)
  assert.equal(normalized.activeAllyIds, undefined)
  assert.equal(normalized.party.length, 8)
  assert.equal(normalized.pendingPartyAdmissions.length, 2)
})
