import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { ITEM_RARITIES } from '../src/data/itemRarities.js'
import { ITEM_LUCK_GRADES, resolveItemLuck, getLuckRewardProbabilities, pickLuckRewardRarity } from '../src/progression/itemLuck.js'
import { ADVENTURE_BATTLE_ITEMS, getAdventureAttackModifiers, getItemHealingMultiplier } from '../src/data/adventureItems.js'
import { recoverAfterVictory } from '../src/balance/combat.js'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'

const masters = ADVENTURE_BATTLE_ITEMS.filter(item => item.rarity === 'master')
const unit = (id, extra = {}) => ({ id, name: id, speciesStage: '성장기', level: 10, currentHp: 40, maxHp: 100, speed: 20, battleItems: {}, statModifiers: {}, ...extra })
const modifiers = (attacker, defender, special = false) => getAdventureAttackModifiers({ attacker, defender,
  skillData: { 분류: special ? '특수형' : '물리형' }, matchup: 1, isCritical: false })
const close = (a, b, message) => assert(Math.abs(a - b) < 1e-12, message ?? (a + ' != ' + b))

test('exactly three master equipment items have original, distinct local art and one-copy caps', () => {
  assert.deepEqual(masters.map(item => item.id), ['d-ark-ultimate', 'digivice-v', 'xros-loader'])
  const manifest = JSON.parse(fs.readFileSync(new URL('../src/data/adventureItemArt.json', import.meta.url)))
  for (const item of masters) {
    assert.equal(item.battleItemKey, item.id); assert.equal(item.maxOwnedPerCombatant, 1)
    assert(!item.consumable && !item.cardCode)
    const bytes = fs.readFileSync(new URL('../public' + item.imageUrl, import.meta.url))
    assert.equal(bytes.readUInt32BE(0), 0x89504e47)
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), manifest[item.id].sha256)
    assert.equal(bytes.readUInt32BE(16), manifest[item.id].width)
    assert.equal(bytes.readUInt32BE(20), manifest[item.id].height)
  }
  assert.equal(new Set(masters.map(item => item.imageUrl)).size, 3)
})

test('master attack and defense bonuses work on physical and special attacks and keep existing aggregate caps', () => {
  const a = unit('a', { battleItems: { 'd-ark-ultimate': 1 } })
  const d = unit('d', { battleItems: { 'digivice-v': 1 } })
  for (const special of [false, true]) {
    close(modifiers(a, unit('d'), special).multiplier, 1.5)
    close(modifiers(unit('a'), d, special).multiplier, .65)
    close(modifiers(a, d, special).multiplier, .975)
  }
  a.currentHp = 20; a.battleItems['crest-courage'] = 1
  close(modifiers(a, unit('d')).multiplier, 1.65)
  d.battleItems['crest-sincerity'] = 1; d.currentHp = 100
  close(modifiers(unit('a'), d).multiplier, .55)
  assert(modifiers(a, d).battleLogs.some(line => line.includes('D-아크 얼티메이트')))
})

test('Xros Loader heals living active and reserve units after victory, never revives, and respects HP caps', () => {
  const gear = { 'xros-loader': 1 }
  const party = [unit('a', { battleItems: gear }), unit('reserve', { battleItems: gear }),
    unit('dead', { currentHp: 0, battleItems: gear }), unit('egg', { isEgg: true, battleItems: gear }),
    unit('full', { currentHp: 98, battleItems: gear })]
  const result = recoverAfterVictory(party, false, ['a'])
  assert.deepEqual(result.nextParty.map(member => member.currentHp), [73, 73, 0, 40, 100])
  assert(result.battleLogs.some(line => line.includes('크로스로더') && line.includes('25')))
  assert(!result.battleLogs.some(line => /reserve|dead|egg/.test(line)))
  assert.equal(party[0].currentHp, 40)
  close(getItemHealingMultiplier(unit('a'), party[0], 'single'), 1.5)
  close(getItemHealingMultiplier(unit('a'), unit('plain'), 'single'), 1)
})

test('all grades improve rare rewards and SS is exactly 50/26/15/8/1 percent', () => {
  // Hand-calculated percentages for the normal pool, in rarity order.
  const expected = {
    E: [66.66666666666667, 18, 9.944444444444445, 5.288888888888889, .1],
    D: [64, 19.84, 10.344533333333334, 5.61014448017149, .20532218649517683],
    C: [61.33333333333334, 21.46666666666667, 10.900355555555556, 5.974265666309396, .32537877813504823],
    B: [58.66666666666667, 22.88, 11.611911111111112, 6.381252447302608, .4601697749196141],
    A: [56, 24.08, 12.4792, 6.831104823151125, .6096951768488745],
    S: [53.33333333333334, 25.06666666666667, 13.502222222222224, 7.323822793854948, .7739549839228295],
    SS: [50, 26, 15, 8, 1],
  }
  let previous = { rare: 0, rogue: 0, master: 0 }
  for (const luck of ITEM_LUCK_GRADES) {
    const actual = getLuckRewardProbabilities(ITEM_RARITIES, luck)
    for (const [index, tier] of ITEM_RARITIES.entries()) close(actual[tier.key], expected[luck.grade][index] / 100, luck.grade + ':' + tier.key)
    close(Object.values(actual).reduce((a, b) => a + b, 0), 1)
    assert(actual.rare > previous.rare, 'Higher luck must improve the final rare chance')
    assert(actual.rogue > previous.rogue, 'Higher luck must improve the final rogue chance')
    assert(actual.master > previous.master, 'Higher luck must improve the final master chance')
    previous = actual
  }
  const ss = getLuckRewardProbabilities(ITEM_RARITIES, resolveItemLuck(16))
  close(ss.rare, .15)
  close(ss.rogue, .08)
  close(ss.master, .01)
})

test('all sparse candidate pools normalize to 100% without inventing unavailable rarities', () => {
  for (let mask = 1; mask < 32; mask++) for (const luck of ITEM_LUCK_GRADES) {
    const weights = ITEM_RARITIES.filter((_, index) => mask & (1 << index))
    const probabilities = getLuckRewardProbabilities(weights, luck)
    close(Object.values(probabilities).reduce((a, b) => a + b, 0), 1)
    for (const tier of ITEM_RARITIES) if (!weights.some(entry => entry.key === tier.key)) assert.equal(probabilities[tier.key], 0)
  }
  assert(Object.values(getLuckRewardProbabilities([])).every(value => value === 0))
  assert.equal(pickLuckRewardRarity([], resolveItemLuck(), () => 0), null)
})

test('real draws retain the two-success ceiling and use revised master boundaries, including missing tiers', () => {
  const luck = resolveItemLuck(16)
  const roll = values => () => values.shift() ?? .99
  assert.equal(pickLuckRewardRarity(ITEM_RARITIES, luck, () => 0), 'rare')
  const rogueRoll = .959
  assert.equal(pickLuckRewardRarity(ITEM_RARITIES, luck, roll([rogueRoll, 36 / 311 - 1e-8])), 'master')
  assert.equal(pickLuckRewardRarity(ITEM_RARITIES, luck, roll([rogueRoll, 36 / 311])), 'rogue')
  const sparse = ITEM_RARITIES.filter(entry => ['common', 'master'].includes(entry.key))
  assert.equal(pickLuckRewardRarity(sparse, luck, roll([0, 9 / 4976 - 1e-8])), 'master')
  assert.equal(pickLuckRewardRarity(sparse, luck, roll([0, 9 / 4976])), 'common')
})

test('seeded draws match the displayed revised odds and SS master stays near one percent', () => {
  let seed = 39715
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const count = 200000, luck = resolveItemLuck(16), seen = Object.fromEntries(ITEM_RARITIES.map(tier => [tier.key, 0]))
  for (let index = 0; index < count; index++) seen[pickLuckRewardRarity(ITEM_RARITIES, luck, random)]++
  const expected = getLuckRewardProbabilities(ITEM_RARITIES, luck)
  for (const tier of ITEM_RARITIES) assert(Math.abs(seen[tier.key] / count - expected[tier.key]) < .004, tier.key)
  assert(Math.abs(seen.rare / count - .15) < .004, 'rare target: ' + seen.rare)
  assert(Math.abs(seen.rogue / count - .08) < .004, 'rogue target: ' + seen.rogue)
  assert(seen.master > 1800 && seen.master < 2200, 'master: ' + seen.master)
})

const engine = await loadBattleEngine()
const member = (name, id = name) => engine.createCombatant({ id, name, data: engine.allDigimonLookup.get(name), level: 10 })

test('real acquisition, equipment tooltip and save serialization preserve each master with a strict one-copy cap', () => {
  for (const item of masters) {
    const original = member('아구몬'), applied = engine.applyInstantRewardEffect(original, item)
    assert.equal(applied.shouldStore, false)
    assert.equal(applied.nextPlayer.battleItems[item.id], 1)
    assert.equal(engine.isRewardItemUsableByCombatant(item, applied.nextPlayer), false)
    assert.equal(engine.applyInstantRewardEffect(applied.nextPlayer, item).nextPlayer.battleItems[item.id], 1)
    const reloaded = JSON.parse(JSON.stringify(applied.nextPlayer))
    assert(engine.getCombatantEquippedItems(reloaded).some(equipped => equipped.id === item.id))
    assert.equal(original.battleItems[item.id], 0)
  }
})

test('real random rewards include exactly three eligible masters and exclude them when every party member has them', () => {
  assert.equal(engine.randomRewardItemPool.filter(item => item.rarity === 'master' && item.battleItemKey).length, 3)
  assert.equal(engine.fixedRewardItems.some(item => item.rarity === 'master'), false)
  const originalRandom = Math.random
  try {
    Math.random = () => .999999
    const a = member('아구몬'); a.currentHp = Math.max(1, Math.floor(a.maxHp / 2))
    const reward = engine.createRewardSelection({}, [a], Infinity, 10)
    assert.equal(reward.randomItems.length, 3)
    assert.equal(reward.randomItems[1].rarity, 'master')
    const equipped = { ...a, battleItems: Object.fromEntries(masters.map(item => [item.id, 1])) }
    const noMasters = engine.createRewardSelection({}, [equipped], Infinity, 10)
    assert(noMasters.randomItems.every(item => item.rarity !== 'master'))
  } finally { Math.random = originalRandom }
})

test('Jogress inherits new master items from both parents without exceeding the one-copy cap', () => {
  const parents = ['워그레이몬', '메탈가루몬'].map((name, index) => ({ ...member(name, String(index)),
    battleItems: Object.fromEntries(masters.map(item => [item.id, 1])) }))
  const fused = engine.createJogressCombatant(parents[0], [parents[1]], engine.allDigimonLookup.get('오메가몬'))
  for (const item of masters) assert.equal(fused.battleItems[item.id], 1)
})
