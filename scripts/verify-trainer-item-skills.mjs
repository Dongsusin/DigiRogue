import assert from 'node:assert/strict'
import test from 'node:test'
import { TRAINER_CATEGORIES, TRAINER_SKILLS, TRAINER_SKILLS_STORAGE_KEY, TRAINER_SKILL_LOOKUP,
  normalizeTrainerProgress, normalizeTrainerRanks, getTrainerPoints, getTrainerSpent,
  getTrainerLuck, learnTrainerSkill, loadTrainerProgress, saveTrainerProgress,
  pickTrainerRewardItem } from '../src/progression/trainerSkills.js'
import { drawBattleCardDrops } from '../src/battle/battleItems.js'
import { pickLuckRewardRarity } from '../src/progression/itemLuck.js'
import { ITEM_RARITIES } from '../src/data/itemRarities.js'

const removedIds = ['card', 'egg', 'growth', 'recovery', 'equipment'].map(group => 'items-find-' + group)
const retained = { 'items-good': 2, 'items-rare': 1, 'stats-attack': 2, 'cost-budget-1': 1 }
const retainedPaid = { 'items-good': [1, 1], 'items-rare': [2], 'stats-attack': [1, 1], 'cost-budget-1': [1] }
const oldProgress = (version = 2) => ({ version, earned: 100,
  learned: { ...retained, ...Object.fromEntries(removedIds.map(id => [id, 3])) },
  paid: { ...retainedPaid, ...Object.fromEntries(removedIds.map(id => [id, [1, 2, 3]])) },
  milestones: { 'finished-run': 3 }, endlessMilestones: { 'endless-run': [210] },
  evolutionMemory: ['아구몬>그레이몬'] })

test('item category only offers the four existing luck skills', () => {
  const nodes = TRAINER_SKILLS.filter(node => node.category === 'items' && node.price > 0)
  assert.deepEqual(nodes.map(node => node.id), ['items-good', 'items-rare', 'items-rogue', 'items-master'])
  assert(nodes.every(node => node.effect.kind === 'luck'))
  assert.equal(TRAINER_CATEGORIES.find(category => category.id === 'items').subtitle, '행운 등급')
  for (const id of removedIds) assert.equal(TRAINER_SKILL_LOOKUP[id], undefined)
})

test('existing variable-price purchases refund exactly their recorded costs and retain other skills', () => {
  const before = oldProgress()
  const migrated = normalizeTrainerProgress(before)
  assert.deepEqual(migrated.learned, normalizeTrainerRanks(retained))
  assert.deepEqual(migrated.paid, retainedPaid)
  assert.equal(migrated.earned, before.earned)
  assert.equal(getTrainerPoints(migrated), 93)
  assert.equal(getTrainerPoints(migrated) - (100 - 7 - 30), 30)
  assert.deepEqual(migrated.milestones, before.milestones)
  assert.deepEqual(migrated.endlessMilestones, before.endlessMilestones)
  assert.deepEqual(normalizeTrainerProgress(migrated), migrated)
})

test('legacy flat-price purchases keep their original retained costs and refund only removed skills', () => {
  const migrated = normalizeTrainerProgress(oldProgress(1))
  assert.deepEqual(migrated.learned, normalizeTrainerRanks(retained))
  assert.equal(getTrainerSpent(migrated.learned, migrated.paid), 6)
  assert.equal(getTrainerPoints(migrated), 94)
  assert.equal(getTrainerPoints(migrated) - (100 - 6 - 15), 15)
  assert.deepEqual(normalizeTrainerProgress(migrated), migrated)
})

test('load, save and reload remove obsolete ranks without repeatedly adding points', () => {
  const records = new Map([[TRAINER_SKILLS_STORAGE_KEY, JSON.stringify(oldProgress())]])
  const storage = { getItem: key => records.get(key), setItem: (key, value) => records.set(key, value) }
  const loaded = loadTrainerProgress(storage)
  assert.equal(getTrainerPoints(loaded), 93)
  assert.equal(saveTrainerProgress(loaded, storage), true)
  assert.deepEqual(loadTrainerProgress(storage), loaded)
  const saved = JSON.parse(records.get(TRAINER_SKILLS_STORAGE_KEY))
  for (const id of removedIds) { assert.equal(saved.learned[id], undefined); assert.equal(saved.paid[id], undefined) }
})

test('removed skills cannot be repurchased, including from old saved profiles', () => {
  for (const id of removedIds) assert.equal(learnTrainerSkill(oldProgress(), id).ok, false)
  const learned = learnTrainerSkill(oldProgress(), 'items-good')
  assert.equal(learned.ok, true)
  assert.equal(learned.progress.learned['items-good'], 3)
  assert.equal(getTrainerPoints(learned.progress), 91)
})

test('same-rarity items are chosen uniformly, including empty pools and edge rolls', () => {
  const pool = [{ id: 'card', cardCode: 'x' }, { id: 'egg', digiEggName: 'x' },
    { id: 'growth', levelUpAmount: 1 }, { id: 'recovery', healFull: true }, { id: 'equipment', battleItemKey: 'x' }]
  assert.equal(pickTrainerRewardItem([], () => 0), null)
  for (let index = 0; index < pool.length; index++) {
    for (const offset of [.001, .999]) assert.equal(pickTrainerRewardItem(pool, () => (index + offset) / pool.length), pool[index])
  }
})

test('old run ranks no longer alter drops while luck still reaches SS', () => {
  for (let seed = 1; seed <= 80; seed++) {
    assert.deepEqual(drawBattleCardDrops({}, 10, seed, oldProgress().learned), drawBattleCardDrops({}, 10, seed, retained))
  }
  const ranks = Object.fromEntries(TRAINER_SKILLS.filter(node => node.effect.kind === 'luck').map(node => [node.id, node.maxRank]))
  const luck = getTrainerLuck(ranks)
  assert.equal(luck.grade, 'SS')
  assert.equal(luck.points, 16)
  assert.equal(getTrainerLuck(oldProgress().learned).points, getTrainerLuck(retained).points)
  const base = ITEM_RARITIES.map(entry => ({ ...entry }))
  assert.equal(pickLuckRewardRarity(ITEM_RARITIES, getTrainerLuck({}), () => 0), 'common')
  assert.equal(pickLuckRewardRarity(ITEM_RARITIES, luck, () => 0), 'rare')
  assert.deepEqual(ITEM_RARITIES, base)
})
