import { advanceRunTurn, createRunStats } from '../src/progression/hallOfFame.js'
import { prepareCombatantForStage } from '../src/battle/regionModifiers.js'
import { pickWildEncounterNames } from '../src/progression/gameDifficulty.js'
import { isHardMode } from '../src/progression/gameModes.js'
import { attachRegionalSupport } from '../src/battle/regionalSupport.js'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { test } from 'node:test'
import { getEscapeChance, isEscapeBlocked, rollRunAttempt } from '../src/battle/escape.js'
import { createSwitchEvents, switchOpacity, SWITCH_OUT_MS, SWITCH_IN_DELAY_MS, SWITCH_TOTAL_MS } from '../src/three/switchPresentation.js'

const unit = (id, changes = {}) => ({ id, name: id, currentHp: 100, maxHp: 100, level: 10,
  attack: 40, defense: 40, specialAttack: 40, specialDefense: 40, speed: 40, ...changes })
const state = (changes = {}) => { const a = unit('a'); return { runStats: createRunStats(1000), currentStage: 1, party: [a], player: a,
  activeAllyIds: ['a'], enemies: [unit('e')], escapeAttempts: 0, actedAllyIds: [], pendingAllyActions: [], ...changes } }
const living = units => (units ?? []).filter(u => u && !u.isEgg && u.currentHp > 0)
const lookup = (units, id) => units.find(u => u.id === id)
const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
function appHandler(name, nextName, context) {
  const marker = '  const ' + name + ' ='
  const start = app.indexOf(marker), end = app.indexOf('  const ' + nextName + ' =', start)
  assert(start >= 0 && end > start, 'App handler missing: ' + name)
  context.advanceRunTurn ??= advanceRunTurn
  return vm.runInNewContext('(' + app.slice(start + marker.length, end).trim() + ')', context)
}

test('equal forces start at 7% and stronger enemies lower escape chance across every stat', () => {
  const s = state(), base = getEscapeChance(s)
  assert.equal(base, .07)
  for (const stat of ['level', 'maxHp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']) {
    assert(getEscapeChance({ ...s, enemies: [unit('e', { [stat]: s.enemies[0][stat] * 2 })] }) < base, stat)
  }
  assert(getEscapeChance({ ...s, enemies: [unit('weak', { level: 1, maxHp: 20, attack: 5, defense: 5,
    specialAttack: 5, specialDefense: 5, speed: 5 })] }) > base)
})
test('very fast or powerful runners can still fail and hopeless fights retain a bounded chance', () => {
  const fast = state({ party: [unit('a', { speed: 10000, level: 100 })] })
  assert.equal(getEscapeChance(fast), .1)
  assert.equal(rollRunAttempt(fast, () => .999), false)
  assert.equal(getEscapeChance(state({ enemies: [unit('e', { level: 10000, speed: 10000, maxHp: 100000 })] })), .01)
})
test('retry bonuses are bounded, preserve enemy-strength ordering, and never guarantee success', () => {
  const s = state(), strong = { ...s, enemies: [unit('e', { level: 50, attack: 200 })] }
  let previous = 0
  for (const attemptCount of [1, 2, 3, 4, 20, 100]) {
    const chance = getEscapeChance({ ...s, attemptCount })
    assert(chance >= previous && chance <= .1)
    assert(getEscapeChance({ ...strong, attemptCount }) < chance)
    assert.equal(rollRunAttempt({ ...s, attemptCount }, () => .999), false)
    previous = chance
  }
})
test('only deployed living allies count; reserves, eggs, fainted units and dead enemies do not inflate the chance', () => {
  const s = state(), base = getEscapeChance(s)
  assert.equal(getEscapeChance({ ...s, party: [...s.party, unit('reserve', { level: 1000, speed: 1000 })] }), base)
  assert.equal(getEscapeChance({ ...s, party: [...s.party, unit('egg', { isEgg: true, speed: 1000 }), unit('dead', { currentHp: 0, speed: 1000 })],
    activeAllyIds: ['a', 'egg', 'dead'], enemies: [...s.enemies, unit('dead-enemy', { currentHp: 0, level: 1000 })] }), base)
  assert.equal(getEscapeChance({ ...s, activeAllyIds: ['reserve'] }), 0)
})
test('bosses, rivals, support units and a fallen boss leader lock the whole encounter', () => {
  const flags = [{ isBoss: true }, { rivalEncounter: { leader: true } }, { rivalEncounter: { leader: false } },
    { bossEncounter: { kind: 'wild', leader: false } }, { bossEncounter: { kind: 'final' } }]
  for (const flag of flags) {
    const s = state({ enemies: [unit('boss', flag)] })
    assert(isEscapeBlocked(s)); assert.equal(getEscapeChance(s), 0)
    let rolls = 0
    assert.equal(rollRunAttempt(s, () => { rolls++; return 0 }), false)
    assert.equal(rolls, 0)
    assert(isEscapeBlocked({ ...s, enemies: [unit('boss', { ...flag, currentHp: 0 }), unit('minion')] }))
  }
})
test('empty fights cannot escape and probability checks never mutate HP, experience or items', () => {
  for (const s of [state({ enemies: [] }), state({ activeAllyIds: [] }), state({ party: [unit('a', { currentHp: 0 })] })]) {
    assert.equal(rollRunAttempt(s, () => 0), false)
  }
  const s = state({ inventory: { 'food-hamburger': 2 }, gold: 400 }), before = JSON.stringify(s)
  getEscapeChance(s); rollRunAttempt(s, () => 0)
  assert.equal(JSON.stringify(s), before)
})
test('seeded rolls match the chance threshold without automatic speed success', () => {
  const s = state(), chance = getEscapeChance(s)
  assert.equal(rollRunAttempt(s, () => chance - .000001), true)
  assert.equal(rollRunAttempt(s, () => chance), false)
  let successes = 0
  for (let i = 0; i < 1000; i++) if (rollRunAttempt(s, () => i / 1000)) successes++
  assert.equal(successes, 70)
})
test('escape never exceeds 10%, even with overwhelming stats or old-save retry counts', () => {
  for (const allyMultiplier of [.01, .1, 1, 10, 100, 10000]) {
    for (const enemyMultiplier of [.01, .1, 1, 10, 100, 10000]) {
      for (const attemptCount of [0, 1, 2, 4, 100, Number.MAX_SAFE_INTEGER]) {
        const stats = multiplier => Object.fromEntries(['level', 'maxHp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'].map(stat => [stat, 40 * multiplier]))
        const s = state({ party: [unit('a', stats(allyMultiplier))], enemies: [unit('e', stats(enemyMultiplier))], attemptCount })
        const chance = getEscapeChance(s)
        assert(chance >= .01 && chance <= .1)
        assert.equal(rollRunAttempt(s, () => .1), false)
      }
    }
  }
  const s = state({ party: [unit('a', { level: 10000, speed: 10000 })], attemptCount: 100 })
  assert.equal(getEscapeChance(s), .1)
  let successes = 0
  for (let i = 0; i < 1000; i++) if (rollRunAttempt(s, () => i / 1000)) successes++
  assert.equal(successes, 100)
})
test('switch cues cover every outgoing/incoming enemy when the formation changes', () => {
  let id = 0
  const cues = createSwitchEvents({ outgoing: [unit('old')], incoming: [unit('new1'), unit('new2')],
    side: 'enemy', startedAt: 100, speed: 2, nextId: () => 'cue-' + ++id })
  assert.deepEqual(cues.map(c => [c.outgoingId, c.incomingId]), [['old', 'new1'], [null, 'new2']])
  assert.equal(new Set(cues.map(c => c.id)).size, 2)
  assert(cues.every(c => c.side === 'enemy' && c.startedAt === 100 && c.speed === 2))
  assert.equal(switchOpacity('out', 1), 0); assert.equal(switchOpacity('in', 0), 0); assert.equal(switchOpacity('in', 1), 1)
  assert(SWITCH_IN_DELAY_MS > SWITCH_OUT_MS)
})

function runContext(s, randomValue) {
  const calls = { rolls: 0, enemyTurns: 0, advances: [], logs: [], states: [], timers: [], effects: [], resolved: [] }
  const context = { gameState: s, rewardState: null, mapSelectionState: null, battlePanelMode: 'commands',
    runAttemptInFlightRef: { current: false }, hitEffectTimeoutsRef: { current: [] },
    getBattleContext: () => ({ party: s.party, activeAllyIds: s.activeAllyIds, actingAlly: s.player }),
    getLivingCombatants: living, getFirstLivingPartyMember: units => living(units)[0], getCombatantById: lookup,
    isEscapeBlocked, rollRunAttempt: o => { calls.rolls++; return rollRunAttempt(o, () => randomValue) },
    setSelectedBattleCommand: () => {}, setHoveredEnemyTargetId: () => {}, setBattlePanelMode: mode => { context.battlePanelMode = mode },
    setGameState: value => calls.states.push(value), showImmediateBattleLogs: (...logs) => calls.logs.push(...logs),
    finishExplorationBattle: () => { calls.storyEscaped = true; return true },
    getGameDuration: value => value, RUN_STAGE_ADVANCE_DELAY_MS: 650,
    window: { setTimeout: (fn, ms) => { calls.timers.push({ fn, ms }); return calls.timers.length } },
    handleNextStage: (...args) => calls.advances.push(args),
    resolveNonAttackActionEnd: party => ({ nextParty: party, battleLogs: [], statusCues: [] }),
    createEnemyBattleTurnActions: () => { calls.enemyTurns++; return [{ side: 'enemy', actorId: 'e' }] },
    resolveBattleTurnActions: ({ party, enemies }) => ({ nextParty: party.map(u => ({ ...u, currentHp: u.currentHp - 20 })),
      nextEnemies: enemies, battleLogs: ['상대 공격!'], hitEffects: [{ damage: 20 }], skillLearnEvents: [] }),
    runAfterBattleAttackEffects: (effects, callback, options) => calls.effects.push({ effects, callback, options }),
    finishResolvedTurn: result => calls.resolved.push(result),
  }
  return { context, calls, handle: appHandler('handleRunAttempt', 'handleBattleCommandSelect', context) }
}
test('App rejects boss attempts without rolling, consuming a turn or damaging the party', () => {
  const s = state({ enemies: [unit('e', { isBoss: true })] }), before = JSON.stringify(s), { calls, handle, context } = runContext(s, 0)
  handle()
  assert.equal(calls.rolls, 0); assert.equal(calls.enemyTurns, 0); assert.equal(calls.advances.length, 0)
  assert.equal(context.runAttemptInFlightRef.current, false); assert.equal(JSON.stringify(s), before)
  assert(calls.logs.some(log => log.includes('도망칠 수 없습니다')))
})
test('App success advances once, preserves living enemy HP and grants no battle reward', () => {
  const s = state({ gold: 400, inventory: { 'food-hamburger': 2 } }), before = JSON.stringify(s), { calls, handle, context } = runContext(s, 0)
  handle(); handle()
  assert.equal(calls.rolls, 1); assert.equal(calls.enemyTurns, 0); assert.equal(calls.timers.length, 1)
  assert.equal(calls.advances.length, 0); assert(calls.logs.includes('무사히 도망쳤다!'))
  assert.equal(context.hitEffectTimeoutsRef.current.length, 1)
  calls.timers[0].fn()
  assert.equal(calls.advances.length, 1); assert.equal(calls.advances[0][0].runStats.totalTurns, 1); assert.equal(calls.advances[0][0].enemies[0].currentHp, 100)
  assert.equal(calls.advances[0][0].gold, 400); assert.equal(context.runAttemptInFlightRef.current, false)
  assert.equal(context.hitEffectTimeoutsRef.current.length, 0); assert.equal(JSON.stringify(s), before)
})
test('App failure consumes exactly one enemy turn, stays on the stage and records the failed attempt', () => {
  const { calls, handle, context } = runContext(state(), .999)
  handle(); handle()
  assert.equal(calls.rolls, 1); assert.equal(calls.enemyTurns, 1); assert.equal(calls.advances.length, 0)
  assert.equal(calls.effects.length, 1); assert(calls.effects[0].options.logs.includes('도망칠 수 없었다!'))
  calls.effects[0].callback()
  assert.equal(calls.resolved.length, 1); assert.equal(calls.resolved[0].nextEscapeAttempts, 1)
  assert.equal(calls.resolved[0].nextParty[0].currentHp, 80)
  assert.equal(context.runAttemptInFlightRef.current, false)
})
test('App treats a roll at 10% as failure and grants exactly one enemy response', () => {
  const { calls, handle } = runContext(state(), .1)
  handle()
  assert.equal(calls.rolls, 1)
  assert.equal(calls.enemyTurns, 1)
  assert.equal(calls.advances.length, 0)
  assert(calls.effects[0].options.logs.includes('도망칠 수 없었다!'))
})
test('App story escape follows the existing story result and does not skip an extra stage', () => {
  const { calls, handle, context } = runContext(state({ explorationEvent: { phase: 'battle' } }), 0)
  handle()
  assert(calls.storyEscaped); assert.equal(calls.advances.length, 0); assert.equal(calls.timers.length, 0)
  assert.equal(context.runAttemptInFlightRef.current, false)
})

function stageContext(s, newEnemies, speed) {
  const calls = { states: [], panels: [], cues: [], timers: [], audio: [], saved: [] }
  const context = { prepareCombatantForStage, attachRegionalSupport, allDigimonLookup: new Map(), createCombatant: () => { throw new Error('Ordinary escape must not create regional aid') },
    recordRivalVictory: x => x, getEncounterGroupForStage: () => 'growth',
    getEncounterCountForStage: () => newEnemies.length, getLevelCapForStage: () => 10,
    getMapEncounterGroups: () => ({ growth: ['e'] }), getBossEncounterNamesForStage: () => [], buildEnemyParty: () => newEnemies,
    isDailyMode: () => true, syncPartyMember: x => x, isMapMoveStage: () => false,
    refreshCombatantStats: x => x, enforceCombatantLevelCap: x => x, createPassiveState: () => ({}),
    getActiveAllyIdsForParty: () => ['a'], getBattleAllyLimit: () => newEnemies.length,
    getBattleContext: x => ({ activeAllies: x.party.filter(u => x.activeAllyIds.includes(u.id)) }),
    getLivingCombatants: living, getCombatantById: lookup, getFirstLivingPartyMember: units => living(units)[0],
    recordEncounterAnalysis: x => x, setGameState: x => calls.states.push(x), setRewardTab: () => {}, setHatchMessage: () => {},
    gameAudio: { situation: (...args) => calls.audio.push(args) }, gameSettings: { gameSpeed: speed },
    saveStageGameState: x => calls.saved.push(x), setIsPlayerExpBarVisible: () => {}, showImmediateBattleLogs: () => {},
    getBossIntroLogs: () => [], getRivalIntroLogs: () => [], getBattlePrompt: () => '', isBossStage: () => false,
    setSelectedBattleCommand: () => {}, setSelectedSkillIndex: () => {}, setBattlePanelMode: x => calls.panels.push(x),
    setRewardState: () => {}, setEvolutionState: () => {}, setMapSelectionState: () => {},
    hitEffectIdRef: { current: 0 }, hitEffectTimeoutsRef: { current: [] }, performance: { now: () => 100 },
    setSwitchEffects: update => { calls.cues = update(calls.cues) }, createSwitchEvents,
    SWITCH_OUT_MS, SWITCH_IN_DELAY_MS, SWITCH_TOTAL_MS, runAfterBattleLayout: callback => callback(),
    window: { setTimeout: (fn, ms) => { calls.timers.push({ fn, ms }); return calls.timers.length } },
  }
  context.runAfterBattleRecall = appHandler('runAfterBattleRecall', 'runAfterBattleSwitch', context)
  return { context, calls, start: appHandler('startNextStage', 'handleNextStage', context) }
}
for (const speed of [1, 2]) test('escape stage transition reuses enemy recall and delayed entry at speed ' + speed, () => {
  const b = unit('b'), s = state({ party: [unit('a'), b], activeAllyIds: ['a', 'b'], enemies: [unit('old1'), unit('old2')] }), incoming = [unit('new')]
  const { calls, start } = stageContext(s, incoming, speed)
  start({ currentGameState: s, currentPlayer: s.player, nextStageNum: 2, mapName: '시작의마을' })
  assert.equal(calls.states[0].currentStage, 2); assert.equal(calls.saved[0].enemies[0].id, 'new')
  const enemyCues = calls.cues.filter(c => c.side === 'enemy')
  assert.equal(enemyCues.length, 2); assert.equal(enemyCues[0].outgoingId, 'old1'); assert.equal(enemyCues[0].incomingId, 'new')
  assert.equal(enemyCues[1].outgoingId, 'old2'); assert.equal(enemyCues[1].incomingId, null)
  assert(calls.panels.includes('animating')); assert(!calls.panels.includes('commands'))
  const allyTimer = calls.timers.find(t => t.ms === SWITCH_OUT_MS / speed)
  allyTimer.fn(); assert(!calls.panels.includes('commands'), 'Enemy materialization still owns the command lock')
  const entry = calls.timers.find(t => t.ms === SWITCH_IN_DELAY_MS / speed); entry.fn()
  assert(calls.audio.some(([kind, o]) => kind === 'send-out' && o.side === 'enemy'))
  calls.timers.find(t => t.ms === SWITCH_TOTAL_MS / speed).fn()
  assert.equal(calls.panels.at(-1), 'commands'); assert.equal(calls.cues.length, 0)
  assert(s.enemies.every(e => e.currentHp === 100))
})
test('ordinary victories keep the existing KO path instead of recalling dead enemies', () => {
  const s = state({ enemies: [unit('old', { currentHp: 0 })] }), { calls, start } = stageContext(s, [unit('new')], 1)
  start({ currentGameState: s, currentPlayer: s.player, nextStageNum: 2, mapName: '시작의마을' })
  assert.equal(calls.cues.length, 0); assert.equal(calls.timers.length, 0); assert.equal(calls.panels.at(-1), 'commands')
})

test('the same species in consecutive stages receives distinct renderer identities', () => {
  const marker = 'const buildBaseEnemyParty =', start = app.indexOf(marker), end = app.indexOf('const applyEnemyDifficulty =', start)
  assert(start >= 0 && end > start)
  const make = vm.runInNewContext('(' + app.slice(start + marker.length, end).trim() + ')', {
    pickWildEncounterNames, isHardMode, normalizeGameMode: () => 'classic', getEncounterProfileStage: stage => stage, isBossStage: () => false,
    createRivalEncounter: () => [], getMapNameForStage: () => '시작의마을', getLevelCapForStage: () => 10,
    getEnemyLevelForStage: () => 3, allDigimonLookup: new Map([['프스몬', { stage: '유아기' }]]),
    shuffleItems: names => [...names], isPlayableDigimon: () => true, MAX_ENEMY_COMBATANTS: 2,
    createCombatant: spec => unit(spec.id, spec),
  })
  const first = make(1, ['프스몬'], 1)[0], second = make(2, ['프스몬'], 1)[0]
  assert.equal(first.name, second.name); assert.notEqual(first.id, second.id)
})
