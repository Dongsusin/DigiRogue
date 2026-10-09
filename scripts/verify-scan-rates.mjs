import test from 'node:test'
import assert from 'node:assert/strict'
import { addAnalysis, getScanPreview, recordEncounterAnalysis, hatchAnalyzedDigimon } from '../src/battle/digimonAnalysis.js'
import { getTrainerScanGain } from '../src/progression/trainerSkills.js'
import { getItemScanGain } from '../src/data/adventureItems.js'
import { resolveBattleConsumable } from '../src/battle/battleItems.js'
import { getRegionalChoices, resolveRegionalChoice } from '../src/adventure/regionalEvents.js'
import { getStoryChoices, resolveStoryAction } from '../src/adventure/storyEvents.js'
import { saveScanProgress, loadScanProgress } from '../src/progression/scanProgress.js'
import { DIGIMON_STAGE_DATA } from '../src/data/digimonRoster.js'

const unit = (name, extra = {}) => ({ id: name, name, level: 5, speciesStage: '성장기', currentHp: 80, maxHp: 100, ...extra })
const state = (names, extra = {}) => { const player = unit('아구몬', { id: 'ally' }); return { trainerRunId: 'scan-rates', currentStage: 1, currentMap: '시작의마을', gameMode: 'classic', party: [player], player, activeAllyIds: ['ally'], actedAllyIds: [], enemies: names.map(name => unit(name)), inventory: { 'card-blue': 2 }, gold: 10000, digimonAnalysis: {}, unlockedSpecies: [], ...extra } }
const gain = name => addAnalysis({}, [name], 25).gains[0]?.gain ?? 0
const card = s => resolveBattleConsumable(s, { actorId: 'ally', itemId: 'card-blue' }, (u, changes) => ({ ...u, ...changes }))

test('weak early Digimon finish collection in fewer scans than a normal rookie', () => {
  let analysis = {}
  for (let i = 0; i < 3; i++) analysis = addAnalysis(analysis, ['추추몬'], 25).analysis
  assert.equal(analysis.추추몬, 100)
  assert(gain('깜몬') > gain('코로몬'))
  assert(gain('코로몬') > gain('추추몬'))
  assert(gain('추추몬') > gain('아구몬'))
})

test('strength distinguishes species even within the same generation', () => {
  assert(gain('추추몬') > gain('아구몬'))
  assert(gain('스카몬') > gain('그레이몬'))
  assert(gain('루체몬') < gain('그레이몬'))
  assert(gain('루체몬') <= 10)
})

test('higher and powerful generations require many more samples', () => {
  assert(gain('아구몬') > gain('그레이몬'))
  assert(gain('그레이몬') > gain('스컬그레이몬'))
  assert(gain('스컬그레이몬') > gain('워그레이몬'))
  assert(gain('워그레이몬') > gain('오메가몬'))
  assert(gain('지드밀레니엄몬') <= 3)
})

test('rare catalysts and Jogress are harder to collect than nearby ordinary forms', () => {
  assert(gain('매그너몬') < gain('카이젤그레이몬'))
  assert(gain('파일드라몬') < gain('스컬그레이몬'))
  assert(gain('듀크몬[X항체]') < gain('워그레이몬'))
})

test('encounter grants species-specific samples just once per battle and ignores duplicate or fallen enemies', () => {
  const s = state(['추추몬', '워그레이몬', '추추몬', '오메가몬'])
  s.enemies.push(unit('스카몬', { currentHp: 0 }))
  const encountered = recordEncounterAnalysis(s)
  assert.deepEqual(encountered.digimonAnalysis, { 추추몬: 16, 워그레이몬: 3, 오메가몬: 1 })
  assert.deepEqual(recordEncounterAnalysis(encountered).digimonAnalysis, encountered.digimonAnalysis)
  assert.deepEqual(s.digimonAnalysis, {})
})

test('blue-card prediction and real consumption give each species the displayed amount', () => {
  const s = state(['추추몬', '워그레이몬', '오메가몬', '추추몬'])
  const preview = getScanPreview(s.enemies, s.digimonAnalysis)
  assert.deepEqual(preview.map(e => [e.name, e.gain, e.count]), [['추추몬', 40, 2], ['워그레이몬', 8, 1], ['오메가몬', 3, 1]])
  const used = card(s)
  assert(used.ok)
  assert.deepEqual(used.state.digimonAnalysis, { 추추몬: 40, 워그레이몬: 8, 오메가몬: 3 })
  assert.equal(used.state.inventory['card-blue'], 1)
  assert(used.logs.some(line => line.includes('워그레이몬') && line.includes('0% → 8%')))
})

test('scanner and learned skills boost efficiency without erasing the species difficulty gap', () => {
  const s = state(['추추몬', '워그레이몬'], { inventory: { 'card-blue': 2, 'd-scanner': 1 }, trainerSkills: { 'growth-scan': 5, 'growth-scan-card': 3 } })
  const preview = getScanPreview(s.enemies, {}, target => getTrainerScanGain(s.trainerSkills, getItemScanGain(s.inventory, 25), target, 'card'))
  const used = card(s)
  assert(used.ok)
  assert.deepEqual(used.state.digimonAnalysis, { 추추몬: 64, 워그레이몬: 12 })
  assert.deepEqual(preview.map(e => e.after), [64, 12])
  assert(used.state.digimonAnalysis.워그레이몬 > 8)
  assert(used.state.digimonAnalysis.워그레이몬 < used.state.digimonAnalysis.추추몬 / 4)
})

test('species difficulty cannot be bypassed by level, temporary boss buffs or stale saved stats', () => {
  const inflated = unit('루체몬', { level: 9999, baseStatTotal: 1, speciesStage: '유아기', speciesData: { 이름: '루체몬', 시작코스트: 1 }, isBoss: true })
  assert.deepEqual(addAnalysis({}, [inflated], 25).analysis, { 루체몬: 8 })
  assert.equal(addAnalysis({}, ['루체몬'], 25).analysis.루체몬, 8)
})

test('regional choice previews include the same per-species gain committed to the bank', () => {
  const s = state([], { currentStage: 5, digimonAnalysis: { 추추몬: 90 }, explorationEvent: { id: 'region-5', stage: 5, mapName: '시작의마을', theme: 'town', species: ['추추몬', '워그레이몬'] } })
  const offer = getRegionalChoices(s).find(r => r.id === 'records')
  assert(offer.preview.includes('추추몬 90% → 100%'))
  assert(offer.preview.includes('워그레이몬 0% → 6%'))
  const used = resolveRegionalChoice(s, 'records', u => u)
  assert(used.ok)
  assert.deepEqual(used.state.digimonAnalysis, { 추추몬: 100, 워그레이몬: 6 })
})

test('story rewards show and award species-specific gains from named observations', () => {
  const s = state([], { currentStage: 5, explorationEvent: { id: 'story-5', storyId: 'palmon-garden', stage: 5, mapName: '기어 포레스트', theme: 'forest', phase: 'choice', revision: 0, questRoll: 0, species: ['추추몬', '워그레이몬'] } })
  const offer = getStoryChoices(s).find(r => r.id === 'sample')
  assert(offer.description.includes('추추몬 스캔 +40%p'))
  assert(offer.description.includes('워그레이몬 스캔 +8%p'))
  const used = resolveStoryAction(s, { id: 'resolve', value: 'sample', eventId: 'story-5', revision: 0 }, u => u)
  assert(used.ok)
  assert.deepEqual(used.state.digimonAnalysis, { 추추몬: 40, 워그레이몬: 8 })
})

test('all playable roster stages support positive bounded card and encounter gains', () => {
  for (const species of Object.values(DIGIMON_STAGE_DATA).flat()) {
    if (species.이름 === '위그드라실 7D6') continue
    const scanned = addAnalysis({}, [species.이름], 25).gains[0]
    assert(scanned?.gain >= 1 && scanned.gain <= 60, species.이름)
    assert(recordEncounterAnalysis(state([species.이름])).digimonAnalysis[species.이름] >= 1, species.이름)
  }
})

test('existing totals stay intact, cap at 100 and do not accrue data for unlocked or boss-only species', () => {
  const old = { 추추몬: 99, 워그레이몬: 72, 오메가몬: 100 }
  const updated = addAnalysis(old, ['추추몬', '워그레이몬', '오메가몬', '위그드라실 7D6'], 25, ['워그레이몬'])
  assert.deepEqual(updated.analysis, { 추추몬: 100, 오메가몬: 100 })
  assert.deepEqual(old, { 추추몬: 99, 워그레이몬: 72, 오메가몬: 100 })
  assert.deepEqual(updated.gains, [{ name: '추추몬', before: 99, after: 100, gain: 1 }])
})

test('daily still rejects scans and a completed sample still hatches exactly once', () => {
  const daily = state(['추추몬'], { gameMode: 'daily' })
  assert.deepEqual(recordEncounterAnalysis(daily).digimonAnalysis, {})
  assert(!card(daily).ok)
  const ready = state([], { digimonAnalysis: { 추추몬: 100, 워그레이몬: 8 } })
  const hatched = hatchAnalyzedDigimon(ready, '추추몬', (name, id) => unit(name, { id }))
  assert(hatched.ok)
  assert.deepEqual(hatched.state.digimonAnalysis, { 워그레이몬: 8 })
  assert(!hatchAnalyzedDigimon(hatched.state, '추추몬', (name, id) => unit(name, { id })).ok)
})

test('species-adjusted gains persist across a reload and zero-amount events grant nothing', () => {
  const bank = new Map(), storage = { getItem: key => bank.get(key) ?? null, setItem: (key, value) => bank.set(key, value) }
  const analysis = recordEncounterAnalysis(state(['추추몬', '워그레이몬'])).digimonAnalysis
  assert.deepEqual(analysis, { 추추몬: 16, 워그레이몬: 3 })
  assert(saveScanProgress(analysis, storage))
  assert.deepEqual(loadScanProgress(storage), { 추추몬: 16, 워그레이몬: 3 })
  assert.deepEqual(addAnalysis(analysis, ['워그레이몬'], 0).analysis, analysis)
  assert.deepEqual(addAnalysis(analysis, ['워그레이몬'], -25).analysis, analysis)
})
