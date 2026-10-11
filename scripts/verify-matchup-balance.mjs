import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { getEventBattlePreview, buildEventBattle } from '../src/adventure/eventBattles.js'
import { scoreSkill } from '../src/balance/combat.js'
import { getEnemyDifficultyModifiers, pickWildEncounterNames } from '../src/progression/gameDifficulty.js'
const e = await loadBattleEngine()
const unit = (id, extra = {}) => ({ ...e.createCombatant({ id, name: '아구몬', data: e.allDigimonLookup.get('아구몬'), level: 50 }),
  passiveId: 'test-none', passiveState: {}, type: '무', attribute: '무', attack: 100, specialAttack: 100,
  defense: 100, specialDefense: 100, maxHp: 1000, currentHp: 1000, ...extra })
const move = (extra = {}) => ({ 기술명: '검증 공격', 분류: '물리형', 속성: '무', 데미지: 50, 명중률: '100%', ...extra })
const matchup = (a, s, d) => e.getMatchupResult({ attackerType: a.type, skillAttribute: s.속성, defenderType: d.type, defenderAttribute: d.attribute }).multiplier
const seeded = (seed = 17) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
const withRandom = (random, run) => { const old = Math.random; try { Math.random = random; return run() } finally { Math.random = old } }
const hit = (a, d, s) => withRandom(() => .5, () => e.resolveAttackAction({ attacker: a, defender: d, skillName: s.기술명, skillOverride: s, attackerSide: 'ally' }))

test('fire aliases hit vegetation and are resisted by water in actual damage', () => {
  const a = unit('a'), wood = unit('wood', { attribute: '나무' }), water = unit('water', { attribute: '물' }), plain = unit('plain')
  const fire = move({ 속성: '화염' })
  const neutral = hit(a, plain, fire).hitEffects[0].damage
  const strong = hit(a, wood, fire), resisted = hit(a, water, fire)
  assert.equal(strong.hitEffects[0].matchupMultiplier, 1.5)
  assert.equal(resisted.hitEffects[0].matchupMultiplier, .75)
  assert(strong.hitEffects[0].damage > neutral && resisted.hitEffects[0].damage < neutral)
  assert.equal(hit(a, wood, move({ 속성: '불' })).hitEffects[0].damage, strong.hitEffects[0].damage)
  assert.equal(matchup(a, move({ 속성: '물' }), unit('d', { attribute: '화염' })), 1.5)
})
test('type and element are independent, including opposing advantages and neutral moves', () => {
  const a = unit('a', { type: '백신' })
  assert.equal(matchup(a, move(), unit('d', { type: '바이러스' })), 2)
  assert.equal(matchup(a, move(), unit('d', { type: '데이터' })), .5)
  assert.equal(matchup(a, move({ 속성: '화염' }), unit('d', { type: '바이러스', attribute: '물' })), 1.5)
  assert.equal(matchup(a, move({ 속성: '화염' }), unit('d', { type: '데이터', attribute: '나무' })), .75)
  assert.equal(matchup(a, move({ 속성: '화염' }), unit('d', { type: '바이러스', attribute: '나무' })), 3)
  assert.equal(matchup(a, move({ 속성: '화염' }), unit('d', { type: '데이터', attribute: '물' })), .375)
  assert.equal(matchup(unit('a'), move(), unit('d')), 1)
})
test('a moderately overlevelled attacker loses its sweep advantage into a bad matchup', () => {
  const defender = unit('d', { type: '데이터', attribute: '물' }), fire = move({ 속성: '화염' })
  const invested = unit('invested', { type: '백신', level: 65, attack: 160 })
  const counter = unit('counter', { type: '바이러스', level: 50, attack: 100 })
  assert(hit(invested, defender, fire).hitEffects[0].damage < hit(counter, defender, move()).hitEffects[0].damage)
})
test('enemy skill selection and target agree on the vulnerable active opponent', () => {
  const enemy = unit('enemy', { type: '백신', skills: ['베이비 플레임'] })
  const party = [unit('resists', { type: '데이터', attribute: '물' }), unit('weak', { type: '바이러스', attribute: '나무' })]
  const actions = withRandom(() => 0, () => e.createEnemyBattleTurnActions({ enemies: [enemy], party, activeAllyIds: party.map(u => u.id) }))
  assert.equal(actions[0].targetId, 'weak')
  const taunting = [{ ...party[0], battleGuards: { taunt: 2 } }, party[1]]
  const tauntActions = withRandom(() => .99, () => e.createEnemyBattleTurnActions({ enemies: [enemy], party: taunting, activeAllyIds: party.map(u => u.id) }))
  assert.equal(tauntActions[0].targetId, 'resists')
})
test('physical/special defense and active barriers affect AI technique choice', () => {
  const a = unit('a'), d = unit('d', { defense: 60, specialDefense: 100, battleGuards: { physical: 2 } })
  assert(scoreSkill(a, move({ 분류: '특수형' }), [a], [d], matchup) > scoreSkill(a, move(), [a], [d], matchup))
  const armored = unit('armored', { defense: 220, specialDefense: 60 })
  assert(scoreSkill(a, move({ 분류: '특수형', 데미지: 40 }), [a], [armored], matchup) > scoreSkill(a, move({ 데미지: 70 }), [a], [armored], matchup))
})
test('status techniques earn utility only when their effect can help', () => {
  const a = unit('a'), d = unit('d'), toxic = move({ 데미지: 45, 상태이상: '독', 상태이상확률: '30%' })
  assert(scoreSkill(a, toxic, [a], [d], matchup) > scoreSkill(a, move(), [a], [d], matchup))
  const immune = { ...d, passiveId: 'venom-body' }, ward = { ...d, battleGuards: { status: 2 } }, afflicted = { ...d, statusEffect: { type: '독', turns: 3 } }
  for (const target of [immune, ward, afflicted]) assert(scoreSkill(a, toxic, [a], [target], matchup) < scoreSkill(a, move(), [a], [target], matchup))
})
test('ordinary enemy growth improves without changing boss, rival or quest modifiers', () => {
  const wild = getEnemyDifficultyModifiers({ enemyStage: 200, enemyGameMode: 'classic' })
  assert(wild.hp > 1.701 && wild.stats > 1.342)
  for (const [flags, hp, stats] of [[{ isBoss: true }, 3.135, 1.3875], [{ rivalEncounter: {} }, 2.475, 1.4], [{ specialQuest: true }, 3.3, 1.5]]) {
    const boss = getEnemyDifficultyModifiers({ ...flags, enemyStage: 200, enemyGameMode: 'classic' })
    assert(Math.abs(boss.hp - hp) < 1e-10)
    assert(Math.abs(boss.stats - stats) < 1e-10)
  }
})
test('wild-only level floor rises; the legacy boss/rival level source stays fixed', () => {
  assert(withRandom(() => 0, () => e.getEnemyLevelForStage(51, 'classic', true)) >= 50)
  assert.equal(withRandom(() => 0, () => e.getEnemyLevelForStage(51, 'classic')), 45)
  assert.equal(withRandom(() => 0, () => e.getEnemyLevelForStage(1, 'classic', true)), 3)
})
test('map-legal stronger wildlife is no longer almost excluded by squared weighting', () => {
  const lookup = new Map([['ordinary', { 전투총합: 300 }], ['strong', { 전투총합: 940 }]])
  const random = seeded(), seen = { ordinary: 0, strong: 0 }
  for (let i = 0; i < 3000; i++) seen[pickWildEncounterNames([...lookup.keys()], lookup, 1, 100, random)[0]]++
  assert(seen.strong > 600 && seen.ordinary > 1500, JSON.stringify(seen))
  assert.deepEqual(pickWildEncounterNames(['missing'], lookup, 2, 1, random), [])
})

test('boss companion wildlife retains its original modifiers instead of receiving the ordinary buff', () => {
  for (const [mode, hp, stats] of [['classic', 1.701, 1.342], ['hard', 1.5876, 1.21]]) {
    const companion = getEnemyDifficultyModifiers({ bossEncounter: { leader: false }, enemyStage: 200, enemyGameMode: mode })
    assert(Math.abs(companion.hp - hp) < 1e-10)
    assert(Math.abs(companion.stats - stats) < 1e-10)
  }
})

test('a barrier halves actual physical damage while special coverage bypasses it', () => {
  const a = unit('a'), plain = unit('d'), guarded = unit('d', { battleGuards: { physical: 2 } })
  const regular = hit(a, plain, move()).hitEffects[0].damage
  const blocked = hit(a, guarded, move()).hitEffects[0].damage
  const special = hit(a, guarded, move({ 분류: '특수형' })).hitEffects[0].damage
  assert(Math.abs(blocked - regular / 2) <= 1)
  assert.equal(special, regular)
})
test('status utility does not displace a finishing blow or reward impossible accuracy', () => {
  const a = unit('a'), target = unit('d', { currentHp: 8 })
  const attack = move(), toxic = move({ 상태이상: '독', 상태이상확률: '100%' })
  assert.equal(scoreSkill(a, toxic, [a], [target], matchup), scoreSkill(a, attack, [a], [target], matchup))
  assert.equal(scoreSkill(a, move({ 명중률: '0%' }), [a], [target], matchup), 0)
})
test('ordinary enemies choose their technique for a taunter instead of another target', () => {
  const enemy = unit('enemy', { skills: ['기본 타격', '기본 파동'] })
  const party = [unit('taunter', { specialDefense: 60, defense: 200, battleGuards: { taunt: 2 } }), unit('other', { specialDefense: 200, defense: 10 })]
  const actions = withRandom(() => 0, () => e.createEnemyBattleTurnActions({ enemies: [enemy], party, activeAllyIds: party.map(u => u.id) }))
  assert.equal(actions[0].targetId, 'taunter')
  assert.equal(actions[0].skillName, '기본 파동')
})

test('the introductory wild stat profile and early rarity weights stay at their previous baseline', () => {
  const early = getEnemyDifficultyModifiers({ enemyStage: 1, enemyGameMode: 'classic' })
  assert(Math.abs(early.hp - 1.1016) < 1e-10)
  assert(Math.abs(early.stats - 1.0201) < 1e-10)
  const lookup = new Map([['ordinary', { 전투총합: 300 }], ['strong', { 전투총합: 440 }]])
  const random = seeded(), counts = { ordinary: 0, strong: 0 }
  for (let i = 0; i < 3000; i++) counts[pickWildEncounterNames([...lookup.keys()], lookup, 1, 1, random)[0]]++
  assert(counts.strong >= 200 && counts.strong <= 300)
})

test('weaker coverage techniques can beat a stronger neutral or resisted technique', () => {
  const a = unit('a'), wood = unit('wood', { attribute: '나무' }), water = unit('water', { attribute: '물' })
  assert(hit(a, wood, move({ 속성: '화염', 데미지: 50 })).hitEffects[0].damage > hit(a, wood, move({ 데미지: 70 })).hitEffects[0].damage)
  assert(hit(a, water, move({ 속성: '번개', 데미지: 60 })).hitEffects[0].damage > hit(a, water, move({ 속성: '화염', 데미지: 70 })).hitEffects[0].damage)
})


test('raising ordinary encounters never raises a subsequent story trial or its saved preview', () => {
  for (const mode of ['classic', 'daily', 'hard', 'endless']) for (const stage of [45, 85, 145, 185]) {
    const ally = unit('ally'), map = e.getMapNameForStage(stage, mode)
    const enemies = withRandom(() => .37, () => e.buildEnemyParty(stage, ['아구몬'], 1, [], { gameMode: mode, mapName: map }))
    assert(enemies.length && enemies.every(u => !u.isBoss && !u.rivalEncounter))
    const legacyLevel = withRandom(() => .37, () => e.getEnemyLevelForStage(stage, mode))
    const spec = { opponents: ['그레이몬'], levelDelta: 8, specialQuest: true }
    const state = { gameMode: mode, currentStage: stage, currentMap: map, levelCap: 200, player: ally, party: [ally],
      enemies: JSON.parse(JSON.stringify(enemies)), explorationEvent: { id: 'trial', storyId: 'trial', phase: 'battle', battle: { routeId: 'fight', spec } } }
    const baseline = { ...state, enemies: [{ level: legacyLevel }] }
    assert.deepEqual(getEventBattlePreview(state, spec), getEventBattlePreview(baseline, spec), mode + ':' + stage)
    const deps = { createCombatant: e.createCombatant, allDigimonLookup: e.allDigimonLookup, refreshCombatantStats: e.refreshCombatantStats, getActiveAllyIdsForParty: () => [ally.id] }
    const actual = buildEventBattle(state, deps), expected = buildEventBattle(baseline, deps)
    assert(actual.ok && expected.ok)
    for (const key of ['level','maxHp','attack','defense','specialAttack','specialDefense','speed'])
      assert.equal(actual.state.enemies[0][key], expected.state.enemies[0][key], mode + ':' + stage + ':' + key)
  }
})

test('ordinary status skills bypass an immune taunter and apply to a valid second target', () => {
  const enemy = unit('caster', { skills: ['베놈 트랩'] })
  const party = [unit('warded', { battleGuards: { taunt: 2, status: 2 } }), unit('vulnerable')]
  const activeAllyIds = party.map(u => u.id)
  const actions = withRandom(() => 0, () => e.createEnemyBattleTurnActions({ enemies: [enemy], party, activeAllyIds }))
  assert.equal(actions[0].skillName, '베놈 트랩')
  assert.equal(actions[0].targetId, 'vulnerable')
  const result = withRandom(() => 0, () => e.resolveBattleTurnActions({ party, enemies: [enemy], activeAllyIds, actions, levelCap: 200 }))
  assert.equal(result.nextParty[0].statusEffect, null)
  assert.equal(result.nextParty[1].statusEffect?.type, '독')
})
