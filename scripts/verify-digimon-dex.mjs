import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { buildEggEvolutionGraph, buildUnlinkedEvolutionGraph, layoutDigimonDex,
  getDexNodeDisplay, getDexRelatedEdges } from '../src/layout/digimonDexLayout.js'
import { isPlayableDigimon } from '../src/data/speciesAvailability.js'
import { normalizeCollection } from '../src/progression/digimonCollection.js'

const { allDigimonLookup: lookup, getEvolutionRoute } = await loadBattleEngine()
const eggs = JSON.parse(await readFile(new URL('../data/디지몬/디지에그.json', import.meta.url), 'utf8'))
const eggGraphs = eggs.map(egg => buildEggEvolutionGraph(egg, lookup))
const allGraphs = [...eggGraphs, buildUnlinkedEvolutionGraph(eggs, lookup)]
const playable = [...lookup.keys()].filter(name => isPlayableDigimon(lookup.get(name)))

for (const [index, egg] of eggs.entries()) {
  test(egg.이름 + ': every hatch and reachable gameplay route is preserved exactly once', () => {
    const graph = eggGraphs[index], expectedNodes = new Set(), expectedEdges = new Set()
    const queue = [...egg.부화가능]
    for (let i = 0; i < queue.length; i++) {
      const name = queue[i], species = lookup.get(name)
      if (!species || !isPlayableDigimon(species) || expectedNodes.has(name)) continue
      expectedNodes.add(name)
      for (const next of species.진화가능 ?? []) {
        const target = lookup.get(next)
        if (!target || !isPlayableDigimon(target) || !getEvolutionRoute(name, next, target.stage)) continue
        expectedEdges.add(JSON.stringify([name, next])); queue.push(next)
      }
    }
    for (const name of egg.부화가능) if (expectedNodes.has(name)) expectedEdges.add(JSON.stringify([graph.rootId, name]))
    assert.deepEqual(new Set(graph.nodes.filter(n => n.kind === 'digimon').map(n => n.name)), expectedNodes)
    assert.deepEqual(new Set(graph.edges.map(e => e.id)), expectedEdges)
    assert.equal(graph.nodes.length, expectedNodes.size + 1)
    assert.equal(graph.edges.length, expectedEdges.size)
  })
}

test('egg families and the independent forest cover every playable Digimon without a fabricated egg link', () => {
  const included = new Set(allGraphs.flatMap(graph => graph.nodes).filter(n => n.kind === 'digimon').map(n => n.name))
  assert.deepEqual(included, new Set(playable))
  const forest = allGraphs.at(-1)
  assert.ok(forest.nodes.length)
  assert.ok(forest.nodes.every(n => n.kind === 'digimon'))
  for (const edge of forest.edges) assert.ok(getEvolutionRoute(edge.from, edge.to, lookup.get(edge.to).stage))
  assert.ok(!included.has('위그드라실 7D6'))
})

test('same-generation transformations and both Jogress parents remain connected', () => {
  const forest = allGraphs.at(-1), edges = new Set(allGraphs.flatMap(g => g.edges).map(e => e.id))
  for (const pair of [['워그레이몬', '오메가몬'], ['메탈가루몬', '오메가몬'], ['로제몬', '로제몬[버스트]']]) {
    assert.ok(edges.has(JSON.stringify(pair)), pair.join(' → '))
  }
  assert.ok(forest.nodes.some(n => n.name === '길몬'))
})

test('all charts are deterministic, bounded and have non-overlapping portraits and connectors', () => {
  for (const graph of allGraphs) {
    const layout = layoutDigimonDex(graph)
    assert.deepEqual(layoutDigimonDex(graph), layout)
    assert.equal(layout.nodes.length, graph.nodes.length)
    assert.equal(layout.edges.length, graph.edges.length)
    for (const node of layout.nodes) {
      assert.ok(Number.isFinite(node.x + node.y))
      assert.ok(node.x >= 0 && node.y >= 0 && node.x + node.size <= layout.width && node.y + node.size <= layout.height)
      for (const other of layout.nodes) if (node.id !== other.id) {
        assert.ok(node.x + node.size <= other.x || other.x + other.size <= node.x ||
          node.y + node.size <= other.y || other.y + other.size <= node.y, node.name + ' overlaps ' + other.name)
      }
    }
    for (const edge of layout.edges) for (let i = 1; i < edge.points.length; i++) {
      const [a, b] = [edge.points[i - 1], edge.points[i]]
      assert.ok(a[0] === b[0] || a[1] === b[1], 'connectors must be orthogonal')
      for (const node of layout.nodes) {
        if (node.id === edge.from || node.id === edge.to) continue
        const horizontal = a[1] === b[1] && a[1] > node.y && a[1] < node.y + node.size &&
          Math.max(a[0], b[0]) > node.x && Math.min(a[0], b[0]) < node.x + node.size
        const vertical = a[0] === b[0] && a[0] > node.x && a[0] < node.x + node.size &&
          Math.max(a[1], b[1]) > node.y && Math.min(a[1], b[1]) < node.y + node.size
        assert.ok(!horizontal && !vertical, edge.from + ' → ' + edge.to + ' crosses ' + node.name)
      }
    }
  }
})

test('undiscovered nodes expose neither a portrait URL nor a species name; seen and unlocked show portraits', () => {
  const node = { kind: 'digimon', name: '니드몬', imageName: '니드몬' }
  const collection = normalizeCollection(null), snapshot = JSON.stringify(collection)
  assert.deepEqual(getDexNodeDisplay(node, collection), { known: false, label: '미발견 디지몬', imageUrl: '' })
  for (const record of [{ seen: true }, { unlocked: true }]) {
    const display = getDexNodeDisplay(node, { species: { 니드몬: record } })
    assert.equal(display.label, '니드몬'); assert.ok(display.known); assert.match(display.imageUrl, /\.webp$/)
  }
  assert.equal(JSON.stringify(collection), snapshot, 'viewing must not discover anything')
  assert.equal(getDexNodeDisplay({ kind: 'digimon', name: '팔몬', imageName: '팔몬' }, collection).known, true)
})

test('all known portraits and all ten egg images exist locally', async () => {
  const collection = { species: Object.fromEntries(playable.map(name => [name, { seen: true }])) }
  const nodes = new Map(allGraphs.flatMap(graph => graph.nodes).map(n => [n.id, n]))
  await Promise.all([...nodes.values()].map(async node => {
    const display = getDexNodeDisplay(node, collection)
    assert.ok(display.imageUrl, node.name)
    await access(new URL('../public' + display.imageUrl, import.meta.url))
  }))
})

test('duplicate/missing hatch names and a cyclic route cannot duplicate nodes or hang', () => {
  const synthetic = new Map([
    ['A', { 이름: 'A', stage: '성장기', 진화가능: ['B', 'missing'] }],
    ['B', { 이름: 'B', stage: '성숙기', 진화가능: ['A'] }],
  ])
  const graph = buildEggEvolutionGraph({ 이름: 'test', 부화가능: ['A', 'A', 'missing'] }, synthetic)
  assert.equal(graph.nodes.length, 3); assert.equal(graph.edges.length, 3)
  const layout = layoutDigimonDex(graph)
  assert.equal(layout.nodes.length, 3)
  assert.ok(layout.edges.every(e => e.points.every(p => p.every(Number.isFinite))))
  assert.equal(getDexRelatedEdges(graph, 'A').size, 3)
})

test('tracing a branch does not highlight an unrelated sibling', () => {
  const graph = { edges: [
    { id: 'ra', from: 'root', to: 'a' }, { id: 'rb', from: 'root', to: 'b' },
    { id: 'ac', from: 'a', to: 'c' },
  ] }
  assert.deepEqual(getDexRelatedEdges(graph, 'a'), new Set(['ra', 'ac']))
  assert.equal(getDexRelatedEdges(graph, null), null)
})
