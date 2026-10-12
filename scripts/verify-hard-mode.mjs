import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as modes from '../src/progression/gameModes.js'
import { normalizeModeProgress, recordModeVictory, loadModeProgress, saveModeProgress } from '../src/progression/modeProgress.js'
import { getStageLevelCap, getStageEnemyLevelRange, getEnemyDifficultyModifiers } from '../src/progression/gameDifficulty.js'
import { getEventBattlePreview, buildEventBattle } from '../src/adventure/eventBattles.js'
import { applyTownStartingSupport, TOWN_BUILDINGS, normalizeTown } from '../src/progression/townProgress.js'
import { TRAINER_SKILLS, getTrainerCostLimit } from '../src/progression/trainerSkills.js'
import { writeSaveSlot, readSaveSlot } from '../src/progression/saveSlots.js'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
const e = await loadBattleEngine()
const ranks = Object.fromEntries(TRAINER_SKILLS.map(node => [node.id, node.maxRank]))
const unit = (name = '아구몬', level = 5) => e.createCombatant({ id: name, name, data: e.allDigimonLookup.get(name), level })
function storage() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } }
function battle(stage, mode = 'hard', map = e.getMapNameForStage(stage), extras = {}) {
  const pool = e.getMapEncounterGroups(map)[e.getEncounterGroupForStage(stage)] ?? []
  return e.buildEnemyParty(stage, pool, 2, e.getBossEncounterNamesForStage(map, stage), { mapName: map, gameMode: mode, ...extras })
}
const win = (mode, stage = 200) => ({ gameMode: mode, currentStage: stage, party: [unit()], enemies: [{ currentHp: 0 }] })

test('hard appears immediately after casual in the existing mode selector and remains a 200-stage adventure', () => {
  assert.equal(modes.getGameMode('classic').name, '캐주얼')
  assert.equal(modes.normalizeGameMode('hard'), 'hard')
  assert.equal(modes.getNextGameMode('classic'), 'hard')
  assert.equal(modes.getNextGameMode('hard', -1), 'classic')
  assert.equal(modes.getModeStageLimit('hard'), 200)
  assert.equal(modes.getEncounterProfileStage(200, 'hard'), 200)
  assert.equal(modes.getModeStageLimit('endless'), Infinity)
})
test('only a real casual stage-200 victory unlocks hard, daily and endless', () => {
  const initial = normalizeModeProgress(null)
  assert.equal(modes.canPlayGameMode('hard', initial), false)
  for (const state of [win('classic', 199), win('daily'), win('endless'), win('hard'),
    { ...win('classic'), explorationEvent: { phase: 'battle' } },
    { ...win('classic'), enemies: [{ currentHp: 1 }] }, { ...win('classic'), party: [{ ...unit(), currentHp: 0 }] }]) {
    assert.equal(modes.canPlayGameMode('hard', recordModeVictory(initial, state)), false)
  }
  const cleared = recordModeVictory(initial, win('classic'))
  for (const mode of ['hard', 'daily', 'endless']) assert(modes.canPlayGameMode(mode, cleared))
})
test('existing casual clear records and legacy final milestones unlock hard without resetting progress', () => {
  const store = storage()
  assert(saveModeProgress(store, { classicCleared: true, classicBest: 200, endlessBest: 246 }))
  const restored = loadModeProgress(store)
  assert(modes.canPlayGameMode('hard', restored))
  assert.equal(restored.endlessBest, 246)
  assert(modes.canPlayGameMode('hard', loadModeProgress(storage(), { milestones: { old: 2 ** 19 } })))
  assert.equal(modes.canPlayGameMode('hard', normalizeModeProgress({ classicCleared: 'true' })), false)
})
test('hard has independent best-stage and clear records and never overwrites casual or daily records', () => {
  let progress = normalizeModeProgress({ classicCleared: true, classicBest: 200, dailyRecords: { '2026-10-09': 80 } })
  progress = recordModeVictory(progress, win('hard', 80))
  assert.equal(progress.hardBest, 80); assert.equal(progress.hardCleared, false)
  progress = recordModeVictory(progress, win('hard'))
  assert.equal(progress.hardBest, 200); assert.equal(progress.hardCleared, true)
  progress = recordModeVictory(progress, win('hard', 40))
  assert.equal(progress.hardBest, 200); assert.equal(progress.classicBest, 200)
  assert.deepEqual(progress.dailyRecords, { '2026-10-09': 80 })
  assert.equal(normalizeModeProgress({ hardBest: 999 }).hardBest, 200)
})
test('hard keeps player caps unchanged and progressively allows enemy levels above them', () => {
  for (let stage = 1; stage <= 200; stage++) {
    assert.equal(getStageLevelCap(stage, 'hard'), getStageLevelCap(stage, 'classic'))
    const [low, high] = getStageEnemyLevelRange(stage, 'hard'), [classicLow, classicHigh] = getStageEnemyLevelRange(stage)
    assert(Number.isSafeInteger(low) && low >= classicLow && low <= high)
    assert(Number.isSafeInteger(high) && high > classicHigh)
  }
  assert(getStageEnemyLevelRange(200, 'hard')[1] > 200)
  assert.equal(getStageLevelCap(200, 'hard'), 200)
})
test('hard enemy bonuses are mode-specific and do not affect allies or other modes', () => {
  for (const flags of [{}, { isBoss: true }, { rivalEncounter: {} }, { specialQuest: true }]) {
    const base = getEnemyDifficultyModifiers({ ...flags, enemyStage: 100 })
    const hard = getEnemyDifficultyModifiers({ ...flags, enemyStage: 100, enemyGameMode: 'hard' })
    assert(hard.hp > base.hp && hard.stats > base.stats)
    const casual = getEnemyDifficultyModifiers({ ...flags, enemyStage: 100, enemyGameMode: 'classic' })
    assert(casual.hp > base.hp && casual.stats > base.stats)
    for (const mode of ['daily', 'endless']) assert.deepEqual(getEnemyDifficultyModifiers({ ...flags, enemyStage: 100, enemyGameMode: mode }), casual)
  }
  assert.deepEqual(getEnemyDifficultyModifiers({ enemyGameMode: 'hard' }), { hp: 1, stats: 1 })
})
test('wild, rival and boss encounters carry the hard mode through stat refresh without stacking', () => {
  for (const stage of [1, 8, 10, 35, 50, 100, 191, 200]) {
    const enemies = battle(stage)
    assert(enemies.length > 0)
    for (const enemy of enemies) {
      assert.equal(enemy.enemyGameMode, 'hard', stage + ':' + enemy.name)
      const refreshed = e.refreshCombatantStats(e.refreshCombatantStats(enemy))
      for (const key of ['maxHp','attack','defense','specialAttack','specialDefense','speed']) assert.equal(refreshed[key], enemy[key], stage + ':' + key)
      assert.equal(refreshed.currentHp, enemy.currentHp)
    }
  }
  assert(battle(200).some(enemy => enemy.level > getStageLevelCap(200)))
})
test('all maps retain valid hard wild encounters and segmented bosses', () => {
  for (const map of Object.keys(e.mapData)) {
    for (const stage of [1, 21, 61, 121, 191, 10, 50, 100, 200]) {
      const enemies = battle(stage, 'hard', map)
      assert(enemies.length > 0 && enemies.length <= 2, map + ':' + stage)
      assert(enemies.every(enemy => enemy.currentHp > 0 && enemy.currentHp === enemy.maxHp && Number.isFinite(enemy.attack) && enemy.enemyGameMode === 'hard'))
      if (stage % 10 === 0) assert(enemies.some(enemy => enemy.isBoss && enemy.bossHpSegmentCount >= 2))
    }
  }
})
test('boss evolution preserves above-cap levels and hard stat bonuses', () => {
  const boss = battle(200)[0], target = e.allDigimonLookup.get(boss.name === '워그레이몬' ? '메탈가루몬' : '워그레이몬')
  const evolved = e.evolveBossCombatant({ ...boss, currentHp: Math.floor(boss.maxHp * .5) }, target)
  assert.equal(evolved.enemyGameMode, 'hard'); assert.equal(evolved.level, boss.level)
  assert(evolved.level > 200); assert(evolved.isBoss)
  assert(Math.abs(evolved.currentHp / evolved.maxHp - .5) < .02)
  assert.equal(e.refreshCombatantStats(evolved).attack, evolved.attack)
})
test('automatic and all three manual saves retain hard mode, enemy levels and stat bonuses', () => {
  const ally = unit('아구몬', 230), enemies = battle(200)
  const state = { gameMode: 'hard', currentStage: 200, currentMap: e.getMapNameForStage(200), player: ally, party: [ally], enemies, activeAllyIds: [ally.id], inventory: {} }
  const store = storage()
  for (const slot of ['auto','manual-1','manual-2','manual-3']) {
    assert(writeSaveSlot(store, slot, state))
    const restored = readSaveSlot(store, slot, e.parseSavedGameState)
    assert.equal(restored.status, 'ready', slot)
    assert.equal(restored.state.gameMode, 'hard'); assert.equal(restored.state.maxStage, 200)
    assert.equal(restored.state.party[0].level, 200)
    assert.deepEqual(restored.state.enemies.map(enemy => [enemy.level, enemy.attack, enemy.maxHp, enemy.enemyGameMode]), enemies.map(enemy => [enemy.level, enemy.attack, enemy.maxHp, 'hard']))
  }
})
test('restoration derives enemy difficulty from the run mode rather than stale unit flags', () => {
  const ally = unit(), enemies = battle(100).map(enemy => ({ ...enemy, enemyGameMode: 'classic' }))
  const state = { gameMode: 'hard', currentStage: 100, currentMap: e.getMapNameForStage(100), player: ally, party: [ally], enemies, activeAllyIds: [ally.id], inventory: {} }
  const restored = e.parseSavedGameState(JSON.stringify({ version: 1, gameState: state }))
  assert(restored); assert(restored.enemies.every(enemy => enemy.enemyGameMode === 'hard'))
  assert(restored.party.every(ally => ally.enemyGameMode !== 'hard'))
})
test('hard event preview and actual enemies agree on above-cap levels and difficulty', () => {
  const ally = unit('아구몬', 200), spec = { opponents: ['그레이몬'], levelDelta: 8, specialQuest: true,
    waves: [{ opponents: ['그레이몬'], levelDelta: 8, specialQuest: true }, { opponents: ['메탈그레이몬'], levelDelta: 12, specialQuest: true }] }
  const state = { gameMode: 'hard', currentStage: 195, levelCap: 200, currentMap: '기어 포레스트', player: ally, party: [ally], enemies: [{ level: 215 }],
    explorationEvent: { id: 'hard-event', storyId: 'hard-trial', phase: 'battle', battle: { spec, routeId: 'fight', waveIndex: 0 } } }
  const preview = getEventBattlePreview(state, spec)
  assert(preview.level > 200 && preview.waves.every(wave => wave.level > 200))
  const result = buildEventBattle(state, { createCombatant: e.createCombatant, allDigimonLookup: e.allDigimonLookup, refreshCombatantStats: e.refreshCombatantStats,
    getActiveAllyIdsForParty: party => [party[0].id] })
  assert(result.ok); assert.equal(result.state.enemies[0].level, preview.waves[0].level)
  assert.equal(result.state.enemies[0].enemyGameMode, 'hard'); assert(result.state.enemies[0].specialQuest)
  assert.equal(getEventBattlePreview({ ...state, gameMode: 'classic' }, spec).level, 200)
})
test('hard retains scanning, eggs, max trainer ranks and the existing single town support choice', () => {
  assert(modes.allowsScanning({ gameMode: 'hard' }))
  assert(modes.isModeItemAllowed({ digiEggName: '용기' }, 'hard'))
  assert.equal(getTrainerCostLimit(ranks), 25)
  const town = normalizeTown({ version: 1, buildings: Object.fromEntries(TOWN_BUILDINGS.map(building => [building.id, 3])), selectedSupport: 'market' })
  const supported = applyTownStartingSupport({ gameMode: 'hard', currentStage: 1, inventory: {}, gold: 0 }, town)
  assert.equal(supported.gold, 450); assert.equal(supported.townSupport.level, 3)
  assert.equal(supported.townSupport.buildingId, 'market')
})


test('hard pressure stays above casual for every stage and enemy role at the same level', () => {
  for (const flags of [{}, { isBoss: true }, { rivalEncounter: {} }, { specialQuest: true }, { bossEncounter: { leader: false } }]) {
    let previous
    for (let stage = 1; stage <= 200; stage++) {
      const enemy = { ...flags, enemyStage: stage }
      const hard = getEnemyDifficultyModifiers({ ...enemy, enemyGameMode: 'hard' })
      const casual = getEnemyDifficultyModifiers({ ...enemy, enemyGameMode: 'classic' })
      assert(hard.hp > casual.hp && hard.stats > casual.stats, JSON.stringify({ stage, flags, hard, casual }))
      if (previous) assert(hard.hp >= previous.hp && hard.stats >= previous.stats)
      previous = hard
      assert.deepEqual(getEnemyDifficultyModifiers({ ...enemy, enemyGameMode: 'hard',
        trainerSkills: ranks, townSupport: { buildingId: 'market', level: 3 }, wins: 999, losses: 999 }), hard)
    }
  }
})

test('hard boss companions share ordinary hard pressure instead of an obsolete weaker curve', () => {
  for (const stage of [1, 50, 100, 150, 200]) {
    const enemy = { enemyStage: stage, enemyGameMode: 'hard' }
    assert.deepEqual(getEnemyDifficultyModifiers({ ...enemy, bossEncounter: { leader: false } }), getEnemyDifficultyModifiers(enemy))
  }
})

test('hard balance updates rehydrate an existing save once and preserve HP ratios and player progress', () => {
  const ally = unit('아구몬', 100), enemies = battle(100).map(enemy => ({ ...enemy,
    maxHp: Math.max(10, Math.floor(enemy.maxHp * .7)), currentHp: Math.max(1, Math.floor(enemy.maxHp * .28)), attack: 1, specialAttack: 1 }))
  const state = { gameMode: 'hard', currentStage: 100, currentMap: e.getMapNameForStage(100),
    player: ally, party: [ally], enemies, activeAllyIds: [ally.id], inventory: { 'heal-20': 2 }, gold: 1250 }
  const before = JSON.stringify(state)
  const restored = e.parseSavedGameState(JSON.stringify({ version: 1, gameState: state }))
  assert(restored)
  for (let i = 0; i < enemies.length; i++) {
    const enemy = restored.enemies[i], old = enemies[i]
    assert.equal(enemy.maxHp, e.refreshCombatantStats(enemy).maxHp)
    assert(enemy.attack > old.attack)
    assert(Math.abs(enemy.currentHp / enemy.maxHp - old.currentHp / old.maxHp) < .02)
  }
  assert.equal(restored.party[0].attack, ally.attack)
  assert.equal(restored.party[0].level, ally.level)
  assert.deepEqual(restored.inventory, state.inventory)
  assert.equal(restored.gold, state.gold)
  const again = e.parseSavedGameState(JSON.stringify({ version: 1, gameState: restored }))
  assert.deepEqual(again.enemies.map(u => [u.maxHp, u.attack, u.currentHp]), restored.enemies.map(u => [u.maxHp, u.attack, u.currentHp]))
  assert.equal(JSON.stringify(state), before)
})


test('a pre-tuning hard boss snapshot retains its rolled level while migrating stats and damage ratio', () => {
  // WarGreymon boss at stage 100 from profile in 0f35cbe (Lv.117, HP969, attack439).
  const ally = unit('아구몬', 100)
  const oldBoss = { ...unit('워그레이몬', 117), isBoss: true, enemyStage: 100, bossStage: 100, enemyGameMode: 'hard',
    maxHp: 969, currentHp: 387, attack: 439, defense: 331, specialAttack: 410, specialDefense: 315, speed: 260 }
  const state = { gameMode: 'hard', currentStage: 100, currentMap: e.getMapNameForStage(100),
    player: ally, party: [ally], enemies: [oldBoss], activeAllyIds: [ally.id], inventory: {} }
  const restored = e.parseSavedGameState(JSON.stringify({ version: 1, gameState: state }))
  assert(restored)
  const boss = restored.enemies[0]
  assert.equal(boss.level, 117)
  assert(boss.maxHp > oldBoss.maxHp && boss.attack > oldBoss.attack)
  assert(Math.abs(boss.currentHp / boss.maxHp - 387 / 969) < .002)
})
