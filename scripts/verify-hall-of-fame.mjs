import { importGuestProgress, accountStorageKey } from '../src/auth/profileStorage.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRunStats, resumeRunStats, advanceRunTurn, createClearRecord, rankHallRecords,
  queueHallRecord, readHallPending, markHallSynced, parseHallRecord } from '../src/progression/hallOfFame.js'

const member = { id: 'player', name: '아구몬', imageName: '아구몬', speciesStage: '성장기', type: '백신', attribute: '화염',
  level: 200, currentHp: 100, maxHp: 200, attack: 130, defense: 90, specialAttack: 100, specialDefense: 90, speed: 80,
  skills: ['베이비 플레임', '마하 잽'], battleItems: { courage: 1 } }
const win = (mode = 'classic', turns = 400) => ({ trainerRunId: 'run-valid-1234', gameMode: mode, currentStage: 200,
  currentMap: '무한 마운틴', runStats: { ...createRunStats(1000), totalTurns: turns, finalClear: true },
  party: [structuredClone(member)], enemies: [{ currentHp: 0 }] })
function storage() { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) } }
const record = (mode, turns, runId, clearedAt = 5000) => ({ ...createClearRecord(win(mode, turns), { now: clearedAt }), runId })

test('only tracked casual/hard stage-200 main victories qualify; old saves do not invent turn totals', () => {
  assert(createClearRecord(win(), { now: 5000 }))
  assert(createClearRecord(win('hard'), { now: 5000 }))
  for (const state of [win('daily'), win('endless'), { ...win(), currentStage: 199 },
    { ...win(), runStats: null }, { ...win(), enemies: [{ currentHp: 1 }] },
    { ...win(), explorationEvent: { phase: 'battle' } }, { ...win(), party: [{ ...member, currentHp: 0 }] }]) {
    assert.equal(createClearRecord(state, { now: 5000 }), null)
  }
  assert.equal(resumeRunStats(undefined), null)
  assert.equal(resumeRunStats({ ...createRunStats(1000), totalTurns: -1 }), null)
})

test('one resolved round adds one turn, survives save JSON, and does not mutate the previous state', () => {
  const initial = { runStats: createRunStats(1000), activeAllyIds: ['a', 'b'] }
  const next = advanceRunTurn(initial)
  assert.equal(next.runStats.totalTurns, 1)
  assert.equal(initial.runStats.totalTurns, 0)
  const resumed = { runStats: resumeRunStats(JSON.parse(JSON.stringify(next.runStats))) }
  assert.equal(advanceRunTurn(resumed).runStats.totalTurns, 2)
  assert.equal(advanceRunTurn({}).runStats, null)
})

test('clear snapshots preserve all final owned members, eggs, equipment quantities and skills independently', () => {
  const state = win()
  state.party.push({ id: 'egg', name: '용기의 디지에그', isEgg: true, eggName: '용기', eggStagesRemaining: 2 },
    { ...member, id: 'helper', regionalSupport: true })
  const result = createClearRecord(state, { now: 5000, itemsFor: () => [{ id: 'crest-courage', name: '용기의 문장', value: 1, imageUrl: 'https://untrusted.invalid' }] })
  const team = JSON.parse(result.team)
  assert.equal(team.length, 2)
  assert.equal(team[0].level, 200)
  assert.deepEqual(team[0].items, [{ id: 'crest-courage', name: '용기의 문장', count: 1 }])
  assert.equal(team[1].isEgg, true)
  state.party[0].skills[0] = '변경됨'
  state.party[0].level = 1
  assert.equal(JSON.parse(result.team)[0].skills[0], '베이비 플레임')
  assert.equal(JSON.parse(result.team)[0].level, 200)
  assert(!result.team.includes('https://'))
})

test('each mode ranks by total turns and caps at 10, with one best record per player', () => {
  const rows = Array.from({ length: 14 }, (_, i) => ({ ...record('classic', 500 - i, 'run-' + i), playerKey: 'user-' + i }))
  rows.push({ ...record('classic', 999, 'worse'), playerKey: 'user-13' }, { ...record('hard', 1, 'hard'), playerKey: 'hard-user' })
  const ranked = rankHallRecords(rows, 'classic')
  assert.equal(ranked.length, 10)
  assert.deepEqual(ranked.map(x => x.totalTurns), [487,488,489,490,491,492,493,494,495,496])
  assert.equal(rankHallRecords(rows, 'hard').length, 1)
})

test('malformed remote records and unsafe unbounded snapshots are rejected', () => {
  const good = record('classic', 400, 'run-good')
  assert(parseHallRecord(good))
  for (const bad of [{ ...good, totalTurns: 0 }, { ...good, totalTurns: 1.5 }, { ...good, team: 'not-json' },
    { ...good, team: JSON.stringify(Array(9).fill(member)) }, { ...good, mode: 'daily' }, { ...good, stage: 199 }]) {
    assert.equal(parseHallRecord(bad), null)
  }
})

test('pending best clears retry safely, deduplicate a replayed final save, and never drop a newer pending result', () => {
  const store = storage(), first = record('classic', 400, 'run-first'), better = record('classic', 350, 'run-better')
  assert(queueHallRecord(store, first))
  assert.equal(queueHallRecord(store, first), false)
  assert.equal(queueHallRecord(store, record('classic', 450, 'run-worse')), false)
  assert(queueHallRecord(store, better))
  markHallSynced(store, first)
  assert.equal(readHallPending(store)[0].runId, 'run-better')
  markHallSynced(store, better)
  assert.deepEqual(readHallPending(store), [])
  assert.equal(queueHallRecord(store, first), false)
  assert.equal(queueHallRecord(store, better), false)
  assert(queueHallRecord(store, record('hard', 500, 'run-hard')))
})

test('remote snapshots reject malformed member fields and invalid Date values before rendering', () => {
 const good=record('classic',400,'run-good'), team=JSON.parse(good.team)[0]
 for(const unit of [{...team,type:{}},{...team,attribute:[]},{...team,imageName:{}},{...team,speciesStage:7},{...team,attack:{}},{...team,isEgg:'yes'},{name:'알',isEgg:true,eggName:{},eggStagesRemaining:0},{name:'알',isEgg:true,eggName:'용기',eggStagesRemaining:-1}]) assert.equal(parseHallRecord({...good,team:JSON.stringify([unit])}),null)
 assert.equal(parseHallRecord({...good,clearedAt:Number.MAX_SAFE_INTEGER}),null)
})

test('linking a guest requeues inherited best for the destination Google UID',()=>{
 const store=storage(),best=record('classic',400,'guest-clear')
 queueHallRecord(store,best);markHallSynced(store,best)
 assert.deepEqual(readHallPending(store),[])
 assert(importGuestProgress(store,'google-user').copied)
 const target={getItem:k=>store.getItem(accountStorageKey('google-user',k)),setItem:(k,v)=>store.setItem(accountStorageKey('google-user',k),v)}
 assert.equal(readHallPending(target)[0].runId,'guest-clear')
 assert.deepEqual(readHallPending(store),[])
})

test('visual HP reaching zero before the final round commits cannot register an unfinished clear',()=>{
 const state=win();state.runStats.finalClear=false
 assert.equal(createClearRecord(state,{now:5000}),null)
 const committed=advanceRunTurn(state);committed.runStats.finalClear=true
 assert.equal(createClearRecord(committed,{now:5000}).totalTurns,401)
 assert.equal(resumeRunStats(JSON.parse(JSON.stringify(committed.runStats))).finalClear,true)
})

test('an older acknowledgement cannot discard an improved replay of the same run',()=>{
 const store=storage(),first=record('classic',400,'same-run'),better=record('classic',350,'same-run')
 queueHallRecord(store,first);queueHallRecord(store,better);markHallSynced(store,first)
 assert.equal(readHallPending(store)[0].totalTurns,350)
 markHallSynced(store,better);assert.deepEqual(readHallPending(store),[])
})
