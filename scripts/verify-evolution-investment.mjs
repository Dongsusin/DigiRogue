import test from 'node:test'
import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { getLoreProfile, createLoreStats } from '../src/balance/loreProfiles.js'
import { BALANCE_REVISION, balanceSignatureSkill } from '../src/balance/catalog.js'
import { ENDGAME_EVOLUTION_TUNING } from '../src/data/evolutionInvestment.js'
import { ITEM_EVOLUTION_REQUIREMENTS, JOGRESS_RECIPES, getEvolutionInvestment } from '../src/data/evolutionRules.js'
import { ITEM_EVOLUTION_REWARD_ITEMS } from '../src/data/evolutionItems.js'
import { rememberItemEvolution, hasEvolutionMemory } from '../src/progression/evolutionMemory.js'
import { getEnemyDifficultyModifiers } from '../src/progression/gameDifficulty.js'
import { buildItemDex } from '../src/data/itemDex.js'
const e = await loadBattleEngine()
const fields = ['체력','공격','방어','특공','특방','스피드']
const clones = { hp: 10, attack: 10, defense: 10, specialAttack: 10, specialDefense: 10, speed: 10 }
const unit = (name, level, extra = {}) => e.createCombatant({ id: name, name, data: e.allDigimonLookup.get(name), level, ...extra })
const stateOf = (party, inventory = {}) => ({ currentStage: 191, currentMap: '기어 포레스트', gameMode: 'classic',
  player: party[0], party, inventory, enemies: [], activeAllyIds: [party[0].id], trainerSkills: {} })
const setup = name => {
  const rule = ITEM_EVOLUTION_REQUIREMENTS[name] ?? { level: ENDGAME_EVOLUTION_TUNING[name].level }, recipe = JOGRESS_RECIPES.find(recipe => recipe.targetName === name)
  const party = (recipe?.materials ?? [rule.from[0]]).map(name => unit(name, rule.level, { digiclones: clones }))
  const item = ITEM_EVOLUTION_REWARD_ITEMS.find(item => item.evolutionItemFor === name)
  return { rule, recipe, party, item, state: stateOf(party, item ? { [item.id]: item.requiredCount + 1 } : {}) }
}

test('all playable profiles keep native identities and route rewards', () => {
  let tuned = 0
  for (const data of e.allDigimonLookup.values()) {
    const original = getLoreProfile(data.이름), investment = getEvolutionInvestment(data.이름)
    assert.equal(fields.reduce((sum, field) => sum + data[field], 0), data.전투총합)
    assert.equal(data.전투총합, Math.round(original.budget * (1 + investment.statBonus)), data.이름)
    assert.equal(data.전투역할, original.role)
    if (investment.statBonus) tuned++
    for (const name of data.기술) {
      const move = data.기술설정[name], old = data.야생전투설정.기술설정[name]
      if (move?.효과 || move?.분류 === '보조형') assert.deepEqual(move, old)
      else { assert(move.데미지 >= old.데미지, data.이름 + ':' + name); assert(move.데미지 <= 250) }
    }
  }
  assert(tuned > 40)
  assert.equal(getEvolutionInvestment('아구몬').statBonus, 0)
  assert(getEvolutionInvestment('아그니몬').statBonus > getEvolutionInvestment('마스테몬').statBonus)
  assert(getEvolutionInvestment('오메가몬[X항체]').statBonus > getEvolutionInvestment('오메가몬').statBonus)
  assert.equal(e.allDigimonLookup.get('아구몬').전투총합, 405)
})

for (const [name, tuning] of Object.entries(ENDGAME_EVOLUTION_TUNING).filter(([name]) => ITEM_EVOLUTION_REQUIREMENTS[name])) {
  test(name + ': stat reward, master catalyst and all required levels/stats are enforced and consumed atomically', async () => {
    const { rule, recipe, party, item, state } = setup(name)
    assert.equal(rule.level, tuning.level); assert.equal(item.rarity, 'master'); assert.equal(item.requiredCount, tuning.itemCount)
    await access(new URL('../public' + item.imageUrl, import.meta.url))
    const options = e.getEvolutionOptions(party[0], state.inventory, party)
    const selected = options.find(option => option.targetData.이름 === name)
    assert(selected && selected.canEvolve, name)
    assert.equal(selected.requirements.filter(rule => tuning.stats.includes(rule.key)).length, 3)
    assert.equal(selected.requirements.find(rule => rule.key === 'item').required, item.requiredCount)
    for (const [move, power] of Object.entries(tuning.skillPower)) assert.equal(e.getSkillData(move, { name }).데미지, power)
    const before = JSON.stringify(state)
    const insufficient = { ...state, inventory: { [item.id]: item.requiredCount - 1 } }
    assert.equal(e.resolveManualEvolution(insufficient, party[0].id, name), null)
    if (recipe) assert.equal(e.resolveJogressEvolution(insufficient, party, recipe, true), null, 'ordinary chip cannot bypass master catalyst')
    const result = e.resolveManualEvolution(state, party[0].id, name)
    assert(result); assert.equal(result.evolvedMember.name, name)
    assert.equal(result.nextGameState.inventory[item.id], 1)
    assert.equal(result.nextGameState.party.length, 1)
    assert.equal(result.evolvedMember.level, rule.level)
    assert(hasEvolutionMemory(result.nextGameState.evolutionMemory, recipe?.materials ?? [party[0].name], name))
    assert.equal(JSON.stringify(state), before)
    const low = party.map(member => e.refreshCombatantStats(member, { level: rule.level - 1 }))
    assert.equal(e.resolveManualEvolution(stateOf(low, state.inventory), low[0].id, name), null, 'clones never waive the level')
  })
}

test('item routes and every fusion material need permanent training; battle buffs cannot qualify', () => {
  for (const name of ['오메가몬[머시풀]', '얼티메이트카오스몬', '알파몬[왕룡검]']) {
    const { party, rule, item, recipe } = setup(name)
    for (let index = 0; index < party.length; index++) {
      const untrained = party.map((member, slot) => slot !== index ? member : unit(member.name, rule.level,
        { activeBuffs: { attack: 1, specialAttack: 1 }, statModifiers: { attack: { multiplier: 10, duration: 'region' } } }))
      const state = stateOf(untrained, item ? { [item.id]: item.requiredCount } : {})
      const option = e.getEvolutionOptions(untrained[0], state.inventory, untrained).find(option => option.targetData.이름 === name)
      assert(option && !option.conditionsMet, name + ': parent ' + index)
      assert.equal(e.resolveManualEvolution(state, untrained[0].id, name), null)
      if (recipe) assert.equal(e.resolveJogressEvolution(state, untrained, recipe, true), null)
    }
  }
})

test('remembered evolution waives catalyst counts but not partner training or levels', () => {
  const name = '얼티메이트카오스몬', { party, recipe, item } = setup(name)
  const memory = rememberItemEvolution([], recipe.materials, name)
  const trained = party.map(member => ({ ...member, trainerSkills: { 'stats-evolution-memory': 1 } }))
  const state = { ...stateOf(trained), evolutionMemory: memory }
  const result = e.resolveManualEvolution(state, trained[0].id, name)
  assert(result); assert.deepEqual(result.nextGameState.inventory, {})
  const bad = [...trained]; bad[1] = unit(bad[1].name, recipe.level, { trainerSkills: { 'stats-evolution-memory': 1 } })
  assert.equal(e.resolveManualEvolution({ ...state, party: bad, player: bad[0] }, bad[0].id, name), null)
  assert(!Object.hasOwn(result.nextGameState.inventory, item.id))
})

test('all evolution catalysts require exactly one copy, including every master and ordinary tier', () => {
  for (const item of ITEM_EVOLUTION_REWARD_ITEMS) {
    assert.equal(item.requiredCount, 1, item.id)
    assert.match(item.description, /1개를 소모/)
  }
})

test('existing catalyst IDs stay usable and all promoted/new catalysts appear in the master item encyclopedia', () => {
  const oldIds = ['item-evolution-자비의 빛', 'item-evolution-블랙 디지트론', 'item-evolution-파괴의 인장', 'item-evolution-오메가몬의 X항체', 'item-evolution-오메가 블레이드']
  const catalog = buildItemDex([...e.fixedRewardItems, ...e.randomRewardItemPool], e.getRewardItemRarity)
  for (const id of oldIds) assert(catalog.some(item => item.id === id && item.rarity === 'master'), id)
  assert.deepEqual(new Set(catalog.filter(item => item.kind === '진화' && item.rarity === 'master').map(item => item.id)), new Set(ITEM_EVOLUTION_REWARD_ITEMS.filter(item => item.rarity === 'master').map(item => item.id)))
  assert.equal(catalog.find(item => item.id === 'jogress-chip').rarity, 'good')
})

test('old saves receive player stat upgrades once while retaining HP ratio, items and skill order', () => {
  const name = '오메가몬[머시풀]', current = unit(name, 150), original = current.speciesData.야생전투설정
  const base = { hp: original.체력, attack: original.공격, defense: original.방어,
    specialAttack: original.특공, specialDefense: original.특방, speed: original.스피드 }
  let old = e.refreshCombatantStats({ ...current, baseStats: base, balanceRevision: 4 })
  old = { ...old, currentHp: Math.floor(old.maxHp / 2) }
  const state = stateOf([old], { 'item-evolution-자비의 빛': 2 })
  const loaded = e.parseSavedGameState(JSON.stringify({ version: 1, gameState: state }))
  assert(loaded); assert.equal(loaded.player.balanceRevision, BALANCE_REVISION)
  assert(loaded.player.maxHp > old.maxHp)
  assert(Math.abs(loaded.player.currentHp / loaded.player.maxHp - old.currentHp / old.maxHp) < .01)
  assert.deepEqual(loaded.inventory, state.inventory); assert.deepEqual(loaded.player.skills, old.skills)
  const twice = e.parseSavedGameState(JSON.stringify({ version: 1, gameState: loaded }))
  assert.equal(twice.player.maxHp, loaded.player.maxHp); assert.equal(twice.player.currentHp, loaded.player.currentHp)
})

test('bosses, rivals and ordinary enemies retain the prior authored stats and signature powers', () => {
  for (const name of Object.keys(ENDGAME_EVOLUTION_TUNING)) for (const flags of [{ isBoss: true, bossStage: 200 }, { enemyStage: 195, rivalEncounter: {} }, { enemyStage: 195 }]) {
    const original = getLoreProfile(name), data = e.allDigimonLookup.get(name)
    assert.deepEqual(Object.fromEntries(fields.map(field => [field, data.야생전투설정[field]])), createLoreStats(original))
    const enemy = e.refreshCombatantStats({ ...unit(name, 150), ...flags, enemyGameMode: 'classic' })
    const difficulty = getEnemyDifficultyModifiers(enemy)
    assert.equal(enemy.maxHp, Math.floor((Math.floor(2 * data.야생전투설정.체력 * 150 / 100) + 150 + 10) * difficulty.hp))
    for (const name of data.기술) assert.deepEqual(e.getSkillData(name, enemy), balanceSignatureSkill(e.allSkillLookup.get(name), original))
  }
})
