import { completeStoryBattle } from '../src/adventure/storyEvents.js'
import { EVENT_STORIES } from '../src/adventure/eventStories.js'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import crypto from 'node:crypto'
import * as adventure from '../src/data/adventureItems.js'
import { BATTLE_CONSUMABLES, BATTLE_ITEM_LOOKUP, getBattleItemTargets, resolveBattleConsumable, drawBattleCardDrops } from '../src/battle/battleItems.js'
import { recoverAfterVictory } from '../src/balance/combat.js'
import { getCombatantEffects } from '../src/battle/battleInfo.js'

const supplyIds = ['food-fried-potato', 'food-hamburger', 'food-chicken-combo', 'food-pepperoni-pizza', 'food-meat-pizza', 'charge-digisoul', 'energy-pill-a']
const gearIds = ['steel-claw', 'd-3', 'd-ark', 'digivice-burst']
const unit = (id, changes = {}) => ({ id, name: id, speciesStage: '성장기', currentHp: 40, maxHp: 100,
  speed: 20, statModifiers: {}, battleItems: {}, skillCooldowns: {}, ...changes })
const state = () => { const a = unit('a'), b = unit('b'); return { party: [a, b], player: a, enemies: [unit('e')],
  activeAllyIds: ['a', 'b'], actedAllyIds: [], inventory: Object.fromEntries(supplyIds.map(id => [id, 2])) } }
const refresh = (u, changes) => ({ ...u, ...changes })
const use = (s, id, targetId = 'b') => resolveBattleConsumable(s, { itemId: id, targetId, actorId: 'a' }, refresh)
const modifiers = (a = {}, d = {}, skill = {}) => adventure.getAdventureAttackModifiers({
  attacker: unit('a', a), defender: unit('e', d), skillData: { 분류: '물리형', ...skill }, matchup: 1, isCritical: false
})
test('11 additions are ordinary supplies or equipment, never cards', () => {
  assert.equal(adventure.ADVENTURE_CONSUMABLES?.length, 7)
  for (const id of supplyIds) { const item = BATTLE_ITEM_LOOKUP.get(id); assert(item, id); assert.equal(item.cardCode, undefined); assert(item.consumable && item.maxOwned > 0) }
  for (const id of gearIds) { const item = adventure.ADVENTURE_BATTLE_ITEMS.find(i => i.id === id); assert(item, id); assert.equal(item.maxOwnedPerCombatant, 1) }
  assert.equal(new Set(BATTLE_CONSUMABLES.map(i => i.id)).size, BATTLE_CONSUMABLES.length)
})
test('each added item has verified local original artwork and provenance', () => {
  const art = JSON.parse(fs.readFileSync(new URL('../src/data/adventureItemArt.json', import.meta.url)))
  for (const id of [...supplyIds, ...gearIds]) {
    const item = [...(adventure.ADVENTURE_CONSUMABLES ?? []), ...adventure.ADVENTURE_BATTLE_ITEMS].find(i => i.id === id)
    assert(item && art[id], id)
    assert.equal(item.imageUrl, art[id].url)
    const bytes = fs.readFileSync(new URL('../public' + item.imageUrl, import.meta.url))
    assert.equal(bytes.readUInt32BE(0), 0x89504e47)
    assert.equal(bytes.readUInt32BE(16), art[id].width); assert.equal(bytes.readUInt32BE(20), art[id].height)
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), art[id].sha256)
    if (art[id].crop) assert(art[id].sourceSha256 && art[id].sourceWidth >= art[id].crop.left + art[id].crop.width)
  }
})
test('foods heal and shorten skill plus shared cooldowns, consume one and preserve input', () => {
  for (const [id, hp, reduction] of [['food-fried-potato', 60, 1], ['food-hamburger', 75, 1],
    ['food-chicken-combo', 80, 2], ['food-pepperoni-pizza', 95, 1], ['food-meat-pizza', 65, 3]]) {
    const s = state(); s.party[1].skillCooldowns = { move: 5, '@burst': 2 }
    const result = use(s, id); assert(result.ok, id)
    assert.equal(result.state.party[1].currentHp, hp); assert.deepEqual(result.state.party[1].skillCooldowns,
      { move: 5 - reduction, ...((2 - reduction) > 0 ? { '@burst': 2 - reduction } : {}) })
    assert.equal(result.state.inventory[id], 1); assert.equal(s.party[1].currentHp, 40); assert.equal(s.inventory[id], 2)
    assert(result.logs.some(l => l.includes('회복'))); assert(!result.logs[0].includes('카드 슬래시'))
  }
})
test('charge restores ready skills even at full HP and never creates negative cooldowns', () => {
  const s = state(); s.party[1].currentHp = 100; s.party[1].skillCooldowns = { move: 2, '@group': 5 }
  const r = use(s, 'charge-digisoul'); assert(r.ok); assert.equal(r.state.party[1].currentHp, 100)
  assert.deepEqual(r.state.party[1].skillCooldowns, { '@group': 2 })
  assert.equal(use(state(), 'charge-digisoul').ok, false)
})
test('energy pill clears only stat drops, preserves boosts, and refreshes skills', () => {
  const s = state(); s.party[1].statModifiers = { attack: { multiplier: .6, turns: 2 }, speed: { multiplier: 1.2, turns: 3 } }
  s.party[1].skillCooldowns = { move: 2 }; s.party[1].statusEffect = { type: '독', turns: 0 }
  const r = use(s, 'energy-pill-a'); assert(r.ok); assert.equal(r.state.party[1].statModifiers.attack, undefined)
  assert.equal(r.state.party[1].statModifiers.speed.multiplier, 1.2); assert.equal(r.state.party[1].skillCooldowns.move, 1)
  assert.equal(r.state.party[1].statusEffect.type, '독'); assert(r.logs.some(l => l.includes('능력치 하락 해제')))
})
test('dead or egg targets and effectless or already acted uses do not consume supplies', () => {
  const s = state(); s.party[1].currentHp = 0
  for (const id of supplyIds) assert.equal(use(s, id).ok, false)
  s.party[1] = unit('b', { isEgg: true }); for (const id of supplyIds) assert.equal(use(s, id).ok, false)
  s.party[1] = unit('b', { currentHp: 100 }); for (const id of supplyIds) assert.equal(use(s, id).ok, false)
  s.party[1] = unit('b'); s.actedAllyIds = ['a']; assert.equal(use(s, 'food-hamburger').ok, false)
  assert.equal(s.inventory['food-hamburger'], 2)
})
test('ordinary supply use keeps formation, supports a living reserve and does not unlock species', () => {
  const s = state(); s.party.push(unit('reserve'))
  const r = use(s, 'food-hamburger', 'reserve'); assert(r.ok); assert.equal(r.state.party[2].currentHp, 75)
  assert.deepEqual(r.state.activeAllyIds, ['a', 'b']); assert.equal(r.state.digimonAnalysis, s.digimonAnalysis)
  assert.deepEqual(r.targetIds, ['reserve']); assert.equal(r.targetSide, 'ally')
  const self = use(s, 'food-hamburger', 'a'); assert(self.ok); assert.equal(self.state.player, self.state.party[0])
})
test('card-only event drops stay cards and obey every existing cap', () => {
  for (let seed = 1; seed <= 300; seed++) for (const id of drawBattleCardDrops({}, 5, seed)) assert(BATTLE_ITEM_LOOKUP.get(id).cardCode, id)
  const full = Object.fromEntries(BATTLE_CONSUMABLES.map(i => [i.id, i.maxOwned])); assert.deepEqual(drawBattleCardDrops(full, 3, 1), [])
})
test('steel claw halves positive physical-defense buffs, without affecting expired or special defense', () => {
  const a = { battleItems: { 'steel-claw': 1 } }, d = { statModifiers: { defense: { multiplier: 1.5, turns: 2 } } }
  assert.equal(modifiers(a, d).multiplier, 1.2); assert(modifiers(a, d).battleLogs.some(l => l.includes('강철손톱')))
  assert.equal(modifiers(a, d, { 분류: '특수형' }).multiplier, 1)
  d.statModifiers.defense.turns = 0; assert.equal(modifiers(a, d).multiplier, 1)
  d.statModifiers.defense = { multiplier: .8, turns: 2 }; assert.equal(modifiers(a, d).multiplier, 1)
})
test('D-3 bonus requires armor form and Burst device requires a boss or rival', () => {
  const d3 = { battleItems: { 'd-3': 1 }, speciesStage: '아머체' }
  assert.equal(modifiers(d3).multiplier, 1.15); assert.equal(modifiers({ ...d3, speciesStage: '성숙기' }).multiplier, 1)
  const burst = { battleItems: { 'digivice-burst': 1 } }
  assert.equal(modifiers(burst).multiplier, 1); assert.equal(modifiers(burst, { isBoss: true }).multiplier, 1.12)
  assert.equal(modifiers(burst, { rivalEncounter: { id: 'wild' } }).multiplier, 1.12)
})
test('D-Ark adds actual post-battle recovery, respects HP cap, fainting and visible logs', () => {
  const a = unit('a', { battleItems: { 'd-ark': 1 } }), reserve = unit('reserve', { battleItems: { 'd-ark': 1 } })
  const dead = unit('dead', { currentHp: 0, battleItems: { 'd-ark': 1 } })
  const r = recoverAfterVictory([a, reserve, dead], false, ['a'])
  assert.deepEqual(r.nextParty.map(u => u.currentHp), [53, 53, 0])
  assert(r.battleLogs.some(l => l.includes('D-아크') && l.includes('5')))
  assert(!r.battleLogs.some(l => l.includes('reserve') || l.includes('dead')))
  assert.equal(recoverAfterVictory([unit('cap', { currentHp: 98, battleItems: { 'd-ark': 1 } })], true, ['cap']).nextParty[0].currentHp, 100)
})
test('new equipment remains visible after local save serialization and aggregate bonuses are capped', () => {
  const a = JSON.parse(JSON.stringify(unit('a', { currentHp: 20, speciesStage: '아머체',
    battleItems: { 'steel-claw': 1, 'd-3': 1, 'd-ark': 1, 'digivice-burst': 1,
      'crest-courage': 1, 'beast-spirit-fire': 1 } })))
  const badges = getCombatantEffects(a); for (const id of gearIds) assert(badges.some(e => e.id === id && e.duration === '장비'), id)
  assert.equal(modifiers(a, { isBoss: true, statModifiers: { defense: { turns: 2, multiplier: 2 } } }).multiplier, 1.65)
})


test('D-Ark recovery also follows completed story battles, appears in results, and cannot be collected twice', () => {
  const story = EVENT_STORIES.find(s => s.id === 'town-block-challenge')
  const route = story.routes.find(r => r.id === 'fight')
  const a = unit('a', { battleItems: { 'd-ark': 1 } })
  const reserve = unit('reserve', { battleItems: { 'd-ark': 1 } })
  const dead = unit('dead', { currentHp: 0, battleItems: { 'd-ark': 1 } })
  const plain = unit('plain'), egg = unit('egg', { isEgg: true, battleItems: { 'd-ark': 1 } })
  const capped = unit('capped', { currentHp: 98, battleItems: { 'd-ark': 1 } })
  const s = { currentStage: 5, currentMap: '시작의마을', party: [a, reserve, dead, plain, egg, capped], player: a,
    activeAllyIds: ['a'], enemies: [unit('e', { currentHp: 0 })], gold: 0, inventory: {},
    explorationEvent: { id: 'story-5', storyId: story.id, stage: 5, mapName: '시작의마을', phase: 'battle', revision: 1,
      battle: { routeId: route.id, spec: route.battle, enemyIds: ['e'], goldReward: 100 } } }
  const r = completeStoryBattle(s, refresh)
  assert(r.ok); assert.deepEqual(r.state.party.map(u => u.currentHp), [45, 45, 0, 40, 40, 100])
  assert.equal(r.state.player, r.state.party[0]); assert.equal(s.party[0].currentHp, 40)
  assert(r.logs.some(l => l.includes('D-아크') && l.includes('5')))
  assert(!r.logs.some(l => l.includes('reserve') || l.includes('dead')))
  assert(r.state.explorationEvent.result.logs.some(l => l.includes('D-아크')))
  assert.deepEqual(r.recoveryLogs, r.logs.filter(l => l.includes('D-아크')))
  assert(r.state.explorationEvent.result.changes.some(c => c.label.includes('D-아크') && c.value.includes('45')))
  assert.equal(completeStoryBattle(r.state, refresh).ok, false)
})

test('D-Ark heals after a dungeon final wave but never during intermediate waves, escapes or unresolved fights', () => {
  const story = EVENT_STORIES.find(s => s.routes.some(r => r.battle?.dungeon))
  const route = story.routes.find(r => r.battle?.dungeon)
  const a = unit('a', { battleItems: { 'd-ark': 1 } })
  const s = { currentStage: 5, currentMap: '시작의마을', party: [a], player: a, activeAllyIds: ['a'],
    enemies: [unit('e', { currentHp: 0 })], gold: 0, inventory: {},
    explorationEvent: { id: 'dungeon-5', storyId: story.id, stage: 5, mapName: '시작의마을', phase: 'battle', revision: 1,
      battle: { routeId: route.id, spec: { waves: [{}, {}] }, waveIndex: 0, enemyIds: ['e'], goldReward: 100 } } }
  const middle = completeStoryBattle(s, refresh); assert(middle.continueBattle); assert.equal(middle.state.party[0].currentHp, 40)
  const escaped = completeStoryBattle(s, refresh, { escaped: true }); assert(escaped.ok); assert.equal(escaped.state.party[0].currentHp, 40)
  const unresolved = { ...s, enemies: [unit('e')] }; assert.equal(completeStoryBattle(unresolved, refresh).ok, false)
  const final = { ...s, explorationEvent: { ...s.explorationEvent, battle: { ...s.explorationEvent.battle, waveIndex: 1 } } }
  const r = completeStoryBattle(final, refresh); assert(r.ok); assert.equal(r.state.party[0].currentHp, 45)
  assert(r.logs.some(l => l.includes('D-아크'))); assert.equal(s.party[0].currentHp, 40)
})
