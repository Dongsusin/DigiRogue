import { normalizeCollection, mergeCollections, recordGameCollection } from '../src/progression/digimonCollection.js'
import { normalizeItemDiscoveries, recordItemDiscoveries } from '../src/progression/itemCollection.js'
import { createCollectionStore } from '../src/progression/collectionStore.js'
import { createLocalStorage } from '../src/progression/localStorage.js'
import { recoverSavedCollection } from '../src/progression/localMigration.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { buildItemDex, filterItemDex, getItemDexDisplay } from '../src/data/itemDex.js'
import { ITEM_RARITIES } from '../src/data/itemRarities.js'

const engine = await loadBattleEngine()
const source = [...engine.fixedRewardItems, ...engine.randomRewardItemPool]
const catalog = buildItemDex(source, engine.getRewardItemRarity)

test('catalog contains every real reward, shop, card, evolution item and egg exactly once', () => {
  assert.deepEqual(new Set(catalog.map(item => item.id)), new Set(source.map(item => item.id)))
  assert.equal(catalog.length, new Set(source.map(item => item.id)).size)
  for (const item of catalog) {
    assert(item.name && item.description && item.imageUrl, item.id)
    assert.equal(item.rarity, engine.getRewardItemRarity(source.find(original => original.id === item.id)))
  }
  for (const field of ['cardCode', 'digiEggName', 'evolutionItemFor', 'digicloneKey', 'typeUpKey', 'attributeUpKey', 'recoveryProgramKey']) {
    const originals = source.filter(item => item[field])
    assert(originals.length > 0, field)
    assert(originals.every(item => catalog.some(entry => entry.id === item.id)), field)
  }
})

test('all five grades partition the full catalog with the same lowered Jogress tier and three masters', () => {
  const groups = ITEM_RARITIES.map(tier => filterItemDex(catalog, tier.key))
  assert(groups.every(group => group.length > 0))
  assert.equal(groups.flat().length, catalog.length)
  assert.deepEqual(groups.flat().map(item => item.id), catalog.map(item => item.id))
  assert.equal(catalog.find(item => item.id === 'jogress-chip').rarity, 'good')
  assert.deepEqual(filterItemDex(catalog, 'master').map(item => item.id), ['d-ark-ultimate', 'digivice-v', 'xros-loader'])
})

test('repeated evolution items keep every target description without altering gameplay definitions', () => {
  const before = JSON.stringify(source)
  const built = buildItemDex(source, engine.getRewardItemRarity)
  for (const entry of built) for (const original of source.filter(item => item.id === entry.id)) {
    assert(entry.description.includes(original.description), entry.id + ': missing evolution target')
  }
  assert.equal(JSON.stringify(source), before)
  const synthetic = Object.freeze([
    Object.freeze({ id: 'shared', name: '공용 진화 아이템', description: 'A로 진화', rarity: 'rare' }),
    Object.freeze({ id: 'shared', name: '공용 진화 아이템', description: 'B로 진화', rarity: 'rare' }),
    Object.freeze({ id: 'shared', name: '공용 진화 아이템', description: 'A로 진화', rarity: 'rare' }),
  ])
  assert.equal(buildItemDex(synthetic)[0].description, 'A로 진화\n\nB로 진화')
})

test('name search stays inside the selected grade, ignores spacing and case, and handles empty results', () => {
  assert.deepEqual(filterItemDex(catalog, 'master', ' d-아크 얼티 메이트 ').map(item => item.id), ['d-ark-ultimate'])
  assert.deepEqual(filterItemDex(catalog, 'common', 'D-아크 얼티메이트'), [])
  assert.deepEqual(filterItemDex(catalog, 'rare', '없는아이템'), [])
  assert.deepEqual(filterItemDex(catalog, 'rogue', '  '), filterItemDex(catalog, 'rogue'))
})

test('every catalog image exists at its actual browser URL, including encoded percent revival chips', async () => {
  await Promise.all(catalog.map(async item => {
    assert(item.imageUrl.startsWith('/'), item.id)
    await access(new URL('../public' + item.imageUrl, import.meta.url))
  }))
})


test('undiscovered items expose only a question mark and are not revealed by name searches', () => {
  const item = catalog.find(item => item.id === 'xros-loader')
  const collection = normalizeCollection(null)
  const before = JSON.stringify(collection)
  assert.deepEqual(getItemDexDisplay(item, collection), { id: item.id, rarity: 'master', known: false, name: '?', imageUrl: '', description: '', kind: '', limit: '' })
  assert.deepEqual(filterItemDex(catalog, 'master', '크로스로더', collection), [])
  assert.equal(filterItemDex(catalog, 'master', '', collection).length, 3)
  assert.equal(JSON.stringify(collection), before, 'opening the archive must not discover anything')
  const seen = recordItemDiscoveries(collection, [item.id])
  assert.equal(getItemDexDisplay(item, seen).imageUrl, item.imageUrl)
  assert.equal(getItemDexDisplay(item, seen).description, item.description)
  assert.equal(filterItemDex(catalog, 'master', '크로스 로더', seen).length, 1)
})

test('discovery normalization and merging are additive without disturbing species or scan records', () => {
  const a = recordItemDiscoveries(normalizeCollection(null), ['heal-20', 'xros-loader'])
  const b = recordItemDiscoveries(normalizeCollection(null), ['jogress-chip'])
  const merged = mergeCollections(a, b)
  assert.deepEqual(merged.items, { 'heal-20': true, 'xros-loader': true, 'jogress-chip': true })
  assert.deepEqual(merged.species, a.species)
  assert.deepEqual(normalizeCollection(merged), merged)
  assert.equal(recordItemDiscoveries(merged, ['heal-20']), merged)
  const raw = JSON.parse('{"safe":true,"false":false,"string":"true","__proto__":true,"constructor":true}')
  assert.deepEqual(normalizeItemDiscoveries(raw), { safe: true })
  assert.deepEqual(normalizeItemDiscoveries(['heal-20']), {})
})

test('inventory, applied equipment and eggs recover discoveries while generated rewards and enemy gear stay hidden', () => {
  const unit = { name: '아구몬', battleItems: { 'd-ark-ultimate': 1, 'digivice-v': 0 }, typePowerUps: { 백신: 1 },
    attributePowerUps: { 전기: 2 }, digiclones: { speed: 1 }, recoveryPrograms: { 'recovery-program-m': 1 }, activeBuffs: { specialAttack: 1 } }
  const state = { player: unit, party: [unit, { isEgg: true, eggName: '용기' }], inventory: { 'card-blue': 2, 'card-necrophobia': 0 },
    enemies: [{ battleItems: { 'xros-loader': 1 } }], rewardCheckpoint: { randomItemIds: ['xros-loader'] } }
  const next = recordGameCollection(normalizeCollection(null), state)
  assert.deepEqual(new Set(Object.keys(next.items)), new Set(['d-ark-ultimate', 'type-up-백신', 'attribute-up-번개', 'digiclone-a',
    'recovery-program-m', 'buff-special-attack', 'digi-egg-1', 'card-blue']))
  assert.equal(next.items['xros-loader'], undefined)
  assert.equal(recordGameCollection(next, { party: [], inventory: {} }), next, 'using or losing an item cannot erase discovery')
})

test('revealed item discoveries survive store restart and remain isolated by account', () => {
  const raw = memoryBackend()
  const storage = createLocalStorage(raw, { accountId: 'item-dex-player-a', accountIsolation: true })
  const a = createCollectionStore({ storage }); a.start()
  assert.equal(a.recordItems([{ id: 'heal-20' }, { id: 'd-ark-ultimate' }]), true)
  a.stop()
  const restarted = createCollectionStore({ storage }); restarted.start()
  assert.equal(restarted.getSnapshot().collection.items['d-ark-ultimate'], true)
  assert.equal(restarted.recordGame({ inventory: {}, party: [] }), true)
  assert.equal(restarted.getSnapshot().collection.items['heal-20'], true)
  const b = createCollectionStore({ storage: createLocalStorage(raw, { accountId: 'item-dex-player-b', accountIsolation: true }) }); b.start()
  assert.deepEqual(b.getSnapshot().collection.items, {})
  b.stop(); restarted.stop()
})

test('legacy autosave and manual slots restore item evidence without losing it during scan-bank migration', () => {
  const storage = createLocalStorage(null)
  for (const [index, id] of ['card-blue', 'jogress-chip'].entries()) storage.setItem(index ? 'digirogue-save-slot-1-v1' : 'digirogue-save-v1',
    JSON.stringify({ version: 1, gameState: { currentStage: 10, inventory: { [id]: 1 }, party: [] } }))
  storage.setItem('digirogue-scan-progress-v1', JSON.stringify({ version: 1, analysis: {} }))
  const recovered = recoverSavedCollection(storage, recordItemDiscoveries(normalizeCollection(null), ['xros-loader']))
  assert.deepEqual(recovered.items, { 'xros-loader': true, 'card-blue': true, 'jogress-chip': true })
})

function memoryBackend() {
  const values = new Map()
  return { get length() { return values.size }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }
}


test('item recovery never restores stale run scan progress after its permanent sample was spent', () => {
  const storage = createLocalStorage(null)
  const original = recordGameCollection(normalizeCollection(null), { enemies: [{ name: '길몬' }], digimonAnalysis: { 길몬: 0 } }, 100)
  storage.setItem('digirogue-save-v1', JSON.stringify({ version: 1, gameState: { currentStage: 10, party: [], inventory: { 'card-blue': 1 }, digimonAnalysis: { 길몬: 100 } } }))
  const recovered = recoverSavedCollection(storage, original, 200)
  assert.equal(recovered.species.길몬.scan.value, 0)
  assert.equal(recovered.items['card-blue'], true)
})
