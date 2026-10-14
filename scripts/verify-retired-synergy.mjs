import test from 'node:test'
import assert from 'node:assert/strict'
import { removeRetiredCombatantData } from '../src/progression/retiredCombatantData.js'
import { SAVE_SLOTS, writeSaveSlot, readSaveSlots } from '../src/progression/saveSlots.js'
import { getPassiveStatusChance, getPassiveStatusDamageMultiplier } from '../src/battle/passives.js'
import { getStatusConditionInfo } from '../src/battle/statusConditions.js'
import { ADVENTURE_BATTLE_ITEMS, getAdventureAttackModifiers } from '../src/data/adventureItems.js'
import { getCombatantEffects } from '../src/battle/battleInfo.js'

const unit = (id, extra = {}) => ({ id, name: '아구몬', passiveId: 'flame', level: 20,
  maxHp: 100, currentHp: 70, battleItems: { 'd-ark': 1, 'xros-loader': 1, 'iv-detector': 1 },
  teamSynergies: ['nature', 'deep', 'holy', 'nightmare', 'beast'], ...extra })
const legacyRun = () => {
  const player = unit('a')
  return { currentStage: 21, currentMap: '시작의마을', gold: 1234, player,
    party: [player, unit('reserve'), unit('egg', { isEgg: true, eggHatchPool: ['아구몬'] })],
    enemies: [unit('enemy')], regionalSupport: { unit: unit('helper') }, activeAllyIds: ['a'],
    inventory: { 'xros-loader': 1, 'iv-detector': 1, 'food-hamburger': 2 },
    rewardCheckpoint: { stage: 21, itemIds: ['iv-detector', 'food-hamburger'] } }
}

test('old active, reserve, egg, enemy and helper snapshots lose retired tags and gear without losing run progress', () => {
  const input = legacyRun(), original = JSON.stringify(input)
  const result = removeRetiredCombatantData(input)
  for (const member of [result.player, ...result.party, ...result.enemies, result.regionalSupport.unit]) {
    assert.equal(member.teamSynergies, undefined)
    assert.equal(member.battleItems['iv-detector'], undefined)
    assert.equal(member.battleItems['xros-loader'], 1)
    assert.equal(member.battleItems['d-ark'], 1)
    assert.equal(member.currentHp, 70)
  }
  assert.equal(result.currentStage, 21); assert.equal(result.gold, 1234)
  assert.deepEqual(result.activeAllyIds, ['a']); assert.deepEqual(result.party[2].eggHatchPool, ['아구몬'])
  assert.deepEqual(result.inventory, { 'xros-loader': 1, 'food-hamburger': 2 })
  assert.deepEqual(result.rewardCheckpoint.itemIds, ['food-hamburger'])
  assert.equal(JSON.stringify(input), original)
})

test('automatic and three manual saves remove retired reward selections and keep all current items', () => {
  const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  const state = legacyRun()
  const resumeUi = { stage: 21, reward: { tab: 'items', checkpoint: state.rewardCheckpoint,
    selectedRandomItemId: 'iv-detector', pendingTarget: { source: 'random', itemId: 'iv-detector', selectedTargetIds: ['a'] } } }
  for (const slot of SAVE_SLOTS) assert.equal(writeSaveSlot(storage, slot.id, state, resumeUi), true)
  const slots = readSaveSlots(storage, raw => JSON.parse(raw).gameState)
  assert.equal(slots.length, 4)
  for (const slot of slots) {
    assert.equal(slot.status, 'ready')
    assert.equal(slot.state.player.teamSynergies, undefined)
    assert.deepEqual(slot.state.inventory, { 'xros-loader': 1, 'food-hamburger': 2 })
    assert.equal(slot.state.currentStage, 21); assert.equal(slot.state.gold, 1234)
    if (!slot.automatic) {
      assert.equal(slot.resumeUi.reward.selectedRandomItemId, null)
      assert.equal(slot.resumeUi.reward.pendingTarget, null)
      assert.deepEqual(slot.resumeUi.reward.checkpoint.itemIds, ['food-hamburger'])
    }
  }
})

test('stale team tags no longer alter status chance, poison damage or the visible status tooltip', () => {
  const actor = unit('actor'), target = unit('target')
  assert.equal(getPassiveStatusChance(actor, 60, target), 60)
  assert.equal(getPassiveStatusChance({ ...actor, passiveId: 'venom-art' }, 60, target), 75)
  assert.equal(getPassiveStatusDamageMultiplier(actor), 1)
  assert.equal(getPassiveStatusDamageMultiplier({ ...actor, passiveId: 'clean-body' }), .5)
  const info = getStatusConditionInfo({ ...target, statusEffect: { type: '독', turns: 0 } })
  assert.match(info.detail, /현재 기준 HP 6 피해/)
  assert(!info.detail.includes('해류의 공명'))
  const protectedInfo = getStatusConditionInfo({ ...target, passiveId: 'clean-body', statusEffect: { type: '독', turns: 0 } })
  assert.match(protectedInfo.detail, /특성으로 상태이상 피해가 50% 감소/)
  assert.match(protectedInfo.detail, /현재 기준 HP 3 피해/)
})

test('retired synergy tags stay inactive while the repurposed master healing equipment remains usable', () => {
  assert(ADVENTURE_BATTLE_ITEMS.some(item => item.id === 'xros-loader' && item.rarity === 'master'))
  assert(!ADVENTURE_BATTLE_ITEMS.some(item => item.id === 'iv-detector'))
  const actor = unit('actor'), defender = unit('defender')
  const result = getAdventureAttackModifiers({ attacker: actor, defender,
    skillData: { 분류: '물리형', 속성: '화염' }, matchup: 1, isCritical: false })
  assert.equal(result.multiplier, 1); assert.deepEqual(result.battleLogs, [])
  assert(getCombatantEffects(actor).some(effect => effect.id === 'xros-loader'))
  assert(getCombatantEffects(actor).some(effect => effect.id === 'd-ark'))
})
