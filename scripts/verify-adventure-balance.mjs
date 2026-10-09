import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { normalizeRegionStatModifiers, mergeRegionStatModifier, prepareCombatantForStage, isStatModifierActive } from '../src/battle/regionModifiers.js'
import { getStageLevelCap, getStageEnemyLevelRange, getEnemyDifficultyModifiers, getAdventureExperienceMultiplier, pickWildEncounterNames } from '../src/progression/gameDifficulty.js'
import { tickBattleTimers, scoreSkill } from '../src/balance/combat.js'
import { getCombatantEffects } from '../src/battle/battleInfo.js'
import { BATTLE_CARDS, getBattleItemTargets, BATTLE_ITEM_LOOKUP, resolveBattleConsumable } from '../src/battle/battleItems.js'
import { getAdventureAttackModifiers } from '../src/data/adventureItems.js'
import { LORE_PROFILES, getLoreProfile } from '../src/balance/loreProfiles.js'
const engine = await loadBattleEngine()
const unit = (name, level = 50) => engine.createCombatant({ id: name, name, data: engine.allDigimonLookup.get(name), level })
const apply = (actor, target, skillName) => engine.applySupportEffectToTarget({ actor, target, skillData: engine.getSkillData(skillName, actor) }).nextTarget

test('every one of the 512 species has a coherent individual profile and legal signature/support skills', () => {
  assert.equal(engine.allDigimonLookup.size, 512)
  const fields = ['체력','공격','방어','특공','특방','스피드']
  for (const data of engine.allDigimonLookup.values()) {
    assert(LORE_PROFILES[data.이름], data.이름)
    assert.equal(fields.reduce((sum, key) => sum + data[key], 0), data.전투총합, data.이름)
    assert(fields.every(key => Number.isSafeInteger(data[key]) && data[key] > 0), data.이름)
    assert(Number.isSafeInteger(data.시작코스트) && data.시작코스트 >= 1)
    for (const name of data.기술) {
      const skill = data.기술설정[name]
      assert(skill, data.이름 + ':' + name)
      assert(skill.효과 || (skill.데미지 >= 30 && skill.데미지 <= 180 && skill.cooldown >= 0))
    }
    assert(data.어티치먼트.every(entry => engine.allSkillLookup.has(entry.기술)), data.이름)
  }
})
test('lore identities and exceptions survive tuning instead of uniform generation stats', () => {
  const guard = unit('가드로몬'), marine = unit('마린엔젤몬'), metal = unit('메탈가루몬'), angel = unit('엔젤몬')
  assert(guard.defense > guard.speed * 2)
  assert(marine.specialDefense > marine.attack * 2)
  assert(metal.specialAttack > metal.attack && metal.speed > metal.defense)
  assert(angel.attack > angel.specialAttack && angel.specialDefense > angel.defense)
  assert(getLoreProfile('루체몬').budget > getLoreProfile('그레이몬').budget)
  assert(getLoreProfile('루체몬').cost > 10)
  const war = unit('워그레이몬')
  assert.equal(engine.getSkillData('브레이브 토네이도', war).분류, '물리형')
  assert.equal(engine.getSkillData('가이아 포스', war).분류, '특수형')
})
test('classic caps, enemy levels and growth remain bounded through 200 and endless remains uncapped', () => {
  let lastCap = 0
  for (let stage = 1; stage <= 200; stage++) {
    const cap = getStageLevelCap(stage), [low, high] = getStageEnemyLevelRange(stage)
    assert(cap >= lastCap && low >= 1 && low <= high && high <= cap)
    assert(getEnemyDifficultyModifiers({ isBoss: true, enemyStage: stage }).hp > getEnemyDifficultyModifiers({ enemyStage: stage }).hp)
    assert(getAdventureExperienceMultiplier(stage) >= 1)
    lastCap = cap
  }
  assert.equal(lastCap, 200)
  assert.equal(getStageLevelCap(201, 'endless'), Infinity)
  assert(getStageEnemyLevelRange(501, 'endless')[0] > 200)
})
test('early wildlife excludes lore outliers, weighted encounters stay diverse and fallback never yields an empty party', () => {
  const pool = ['아구몬','팔몬','루체몬'], lookup = engine.allDigimonLookup
  assert.deepEqual(pickWildEncounterNames(pool, lookup, 3, 1, () => .9).sort(), ['아구몬','팔몬'].sort())
  assert(pickWildEncounterNames(pool, lookup, 3, 150, () => .9).includes('루체몬'))
  assert.deepEqual(pickWildEncounterNames(['루체몬'], lookup, 1, 1, () => 0), ['루체몬'])
  const seen = new Set()
  for (let i = 0; i < 100; i++) seen.add(pickWildEncounterNames(pool, lookup, 1, 1, () => i / 100)[0])
  assert.equal(seen.size, 2)
})
test('skill buffs/debuffs survive ten actions and same-map encounters, including reserves', () => {
  const actor = unit('그레이몬'), original = unit('가루몬')
  let boosted = apply(actor, original, '어택 차지')
  assert.equal(boosted.statModifiers.attack.duration, 'region')
  const attack = boosted.attack
  for (let i = 0; i < 10; i++) boosted = engine.resolveTurnEndCombatantEffects(boosted, { side: 'ally' }).nextCombatant
  assert.equal(boosted.attack, attack)
  boosted = prepareCombatantForStage(boosted, { mapChanged: false }, engine.refreshCombatantStats)
  assert.equal(boosted.attack, attack)
  const weakened = apply(actor, original, '크리티컬 바인드')
  assert(weakened.attack < original.attack)
  assert.equal(prepareCombatantForStage(weakened, {}, engine.refreshCombatantStats).attack, weakened.attack)
})
test('a map change clears every temporary stat, resets guards and cooldowns, restores fainted units and preserves permanent training', () => {
  let u = engine.refreshCombatantStats(unit('그레이몬'), { digiclones: { attack: 3 }, activeBuffs: { defense: 10 } })
  const trained = engine.refreshCombatantStats(u, { activeBuffs: {}, statModifiers: {} }).attack
  u = apply(u, u, '액셀 부스트')
  u = { ...u, currentHp: 0, statusEffect: { type: '독', turns: 0 }, battleGuards: { physical: 2 }, skillCooldowns: { attack: 3 } }
  const next = prepareCombatantForStage(u, { mapChanged: true }, engine.refreshCombatantStats)
  assert.equal(next.attack, trained)
  assert.equal(next.digiclones.attack, 3)
  assert.equal(next.currentHp, next.maxHp)
  assert(Object.values(next.statModifiers).every(value => value === null))
  assert(Object.values(next.activeBuffs).every(value => value === 0))
  assert.deepEqual(next.skillCooldowns, {})
  assert.deepEqual(next.battleGuards, {})
  assert.equal(next.statusEffect, null)
})
test('region buffs migrate only live legacy effects, do not stack, and descriptions display the map lifetime', () => {
  const old = normalizeRegionStatModifiers({ attack: { multiplier: 1.3, turns: 2 }, defense: { multiplier: 1.4, turns: 0 } })
  assert.equal(old.attack.duration, 'region'); assert.equal(old.defense, null)
  assert.deepEqual(mergeRegionStatModifier(old.attack, 1.2), old.attack)
  assert.equal(mergeRegionStatModifier(old.attack, .8).multiplier, .8)
  assert(isStatModifierActive(old.attack))
  const u = { ...unit('그레이몬'), statModifiers: old, activeBuffs: { defense: 10 } }
  const effects = getCombatantEffects(u).filter(e => e.id.startsWith('skill-') || e.id.startsWith('item-'))
  assert(effects.length === 2 && effects.every(e => e.duration === '맵 변경까지'))
  for (const card of BATTLE_CARDS.filter(card => card.effect.stats)) {
    assert.equal(card.effect.duration, 'region')
    assert(!/\d+(행동|턴)/.test(card.description))
  }
  assert(engine.getSkillData('어택 차지').효과설명.includes('맵 변경까지'))
})
test('duplicate cards are rejected, boss debuffs are halved, and cleanse still removes region debuffs', () => {
  const a = unit('아구몬'), enemy = { ...unit('그레이몬'), isBoss: true }
  let state = { party: [a], player: a, enemies: [enemy], activeAllyIds: [a.id], inventory: { 'card-attack': 2, 'card-laser-eye': 1, 'card-stop-fighting': 1 } }
  const use = (id, targetId) => resolveBattleConsumable(state, { itemId: id, actorId: a.id, targetId }, engine.refreshCombatantStats)
  state = use('card-attack', a.id).state
  assert.equal(getBattleItemTargets(state, BATTLE_ITEM_LOOKUP.get('card-attack'), a.id).length, 0)
  state = use('card-laser-eye', enemy.id).state
  assert.equal(state.enemies[0].statModifiers.defense.multiplier, .9)
  state.party[0] = { ...state.party[0], statModifiers: { attack: { multiplier: .8, duration: 'region' } } }
  state = use('card-stop-fighting', a.id).state
  assert(!state.party[0].statModifiers.attack)
})
test('guards, ailments and recovery cooldowns continue to use actions rather than map lifetime', () => {
  const a = unit('그레이몬')
  let guarded = apply(a, a, '어택 리플렉트')
  assert.equal(guarded.battleGuards.physical, 3)
  for (let i = 0; i < 3; i++) guarded = tickBattleTimers(guarded)
  assert.equal(guarded.battleGuards.physical, undefined)
  assert.equal(guarded.attack, a.attack)
})
test('enemy support decisions use visible effects and never spend actions repeating an existing region buff', () => {
  const a = unit('그레이몬'), enemy = unit('가루몬'), skill = engine.getSkillData('매직 차지')
  const fresh = scoreSkill(a, skill, [a], [enemy], () => 1)
  assert(fresh > 0)
  const boosted = apply(a, a, '매직 차지')
  assert.equal(scoreSkill(boosted, skill, [boosted], [enemy], () => 1), 0)
})

test('resuming a revision-3 save refreshes species stats and preserves HP ratio, inventory and active region changes', () => {
  const a = unit('아구몬', 30), enemy = unit('쿠라몬', 25)
  const old = { ...a, balanceRevision: 3, baseStats: { ...a.baseStats, attack: 999 }, currentHp: Math.floor(a.maxHp / 2),
    statModifiers: { attack: { multiplier: 1.3, turns: 2 } }, activeBuffs: { defense: 8 } }
  const state = { player: old, party: [old], enemies: [enemy], currentStage: 31, currentMap: '기어 포레스트',
    inventory: { 'heal-20': 2 }, trainerSkills: {}, gameMode: 'classic', activeAllyIds: [old.id] }
  const before = JSON.stringify(state)
  const resumed = engine.parseSavedGameState(JSON.stringify({ version: 1, gameState: state }))
  assert(resumed)
  assert.notEqual(resumed.party[0].baseStats.attack, 999)
  assert.equal(resumed.party[0].balanceRevision, 4)
  assert.equal(resumed.party[0].statModifiers.attack.duration, 'region')
  assert.equal(resumed.party[0].activeBuffs.defense, 1)
  assert(Math.abs(resumed.party[0].currentHp / resumed.party[0].maxHp - old.currentHp / old.maxHp) < .02)
  assert.equal(resumed.inventory['heal-20'], 2)
  assert.equal(JSON.stringify(state), before)
})
test('temporary region boosts cannot satisfy permanent evolution training requirements', () => {
  const a = unit('아구몬', 10), boosted = apply(a, a, '액셀 부스트')
  const before = engine.getEvolutionOptions(a).find(o => o.targetData.이름 === '그레이몬')
  const after = engine.getEvolutionOptions(boosted).find(o => o.targetData.이름 === '그레이몬')
  assert.deepEqual(after.requirements, before.requirements)
  assert.equal(after.canEvolve, before.canEvolve)
})

test('equipment recognizes region-lifetime defense boosts and stat drops', () => {
  const attacker = { ...unit('아구몬'), battleItems: { 'steel-claw': 1, 'beast-spirit-ice': 1 } }
  const defender = { ...unit('그레이몬'), statModifiers: { defense: { multiplier: 1.3, duration: 'region' }, speed: { multiplier: .8, duration: 'region' } } }
  const result = getAdventureAttackModifiers({ attacker, defender, skillData: { 분류: '물리형' }, matchup: 1, isCritical: false })
  assert(result.multiplier > 1.3)
  assert.equal(result.battleLogs.length, 1)
})
test('all map encounter pools build valid battles throughout classic progression', () => {
  for (const map of Object.keys(engine.mapData)) {
    for (const stage of [1, 21, 61, 121, 191]) {
      const groups = engine.getMapEncounterGroups(map), pool = groups[engine.getEncounterGroupForStage(stage)] ?? []
      const enemies = engine.buildEnemyParty(stage, pool, 2, [], { mapName: map, gameMode: 'classic' })
      assert(enemies.length > 0 && enemies.length <= 2, map + ':' + stage)
      assert(enemies.every(u => u.currentHp > 0 && Number.isFinite(u.attack) && u.level <= getStageLevelCap(stage)), map + ':' + stage)
    }
    for (const stage of [10, 50, 100, 200]) {
      const enemies = engine.buildEnemyParty(stage, [], 1, engine.getBossEncounterNamesForStage(map, stage), { mapName: map, gameMode: 'classic' })
      assert(enemies.some(u => u.isBoss && u.currentHp > 0), map + ':' + stage)
    }
  }
})
