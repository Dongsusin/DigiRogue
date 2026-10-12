import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { buildEggEvolutionGraph, layoutDigimonDex,
  getDexNodeDisplay, getDexRelatedEdges } from '../src/layout/digimonDexLayout.js'
import { isPlayableDigimon } from '../src/data/speciesAvailability.js'
import { normalizeCollection } from '../src/progression/digimonCollection.js'
import connections from '../src/data/evolutionTreeConnections.json' with { type: 'json' }
import { JOGRESS_RECIPES } from '../src/data/evolutionRules.js'

const engine = await loadBattleEngine()
const { allDigimonLookup: lookup, getEvolutionRoute } = engine
const eggs = JSON.parse(await readFile(new URL('../data/디지몬/디지에그.json', import.meta.url), 'utf8'))
const eggGraphs = eggs.map(egg => buildEggEvolutionGraph(egg, lookup))
const allGraphs = eggGraphs
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

test('all playable species are reachable from a Digi-Egg without an Other family', () => {
  const included = new Set(eggGraphs.flatMap(graph => graph.nodes).filter(n => n.kind === 'digimon').map(n => n.name))
  const missing = playable.filter(name => !included.has(name))
  assert.deepEqual(missing, [], 'Missing egg descendants: ' + missing.join(', '))
  assert.equal(included.size, playable.length)
  assert.ok(!included.has('위그드라실 7D6'))
})

test('same-generation transformations and both Jogress parents remain connected', () => {
  const edges = new Set(allGraphs.flatMap(g => g.edges).map(e => e.id))
  for (const pair of [['워그레이몬', '오메가몬'], ['메탈가루몬', '오메가몬'], ['로제몬', '로제몬[버스트]']]) {
    assert.ok(edges.has(JSON.stringify(pair)), pair.join(' → '))
  }
  assert.ok(eggGraphs.some(g => g.nodes.some(n => n.name === '길몬')))
})

test('all charts are deterministic, bounded and have non-overlapping portraits and connectors', () => {
  for (const graph of allGraphs) {
    const layout = layoutDigimonDex(graph)
    assert.deepEqual(layoutDigimonDex(graph), layout)
    assert.deepEqual(new Set(layout.nodes.map(node => node.sourceId)), new Set(graph.nodes.map(node => node.id)))
    assert.equal(new Set(layout.nodes.map(node => node.id)).size, layout.nodes.length)
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
  assert.deepEqual(new Set(layout.nodes.map(node => node.sourceId)), new Set(graph.nodes.map(node => node.id)))
  assert.equal(layout.nodes.length, 4)
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

// A converging route must not pull a connector across a sibling branch.
const branchFixture = {
  rootId: 'egg', nodes: ['egg', 'a', 'b', 'c', 'shared', 'next'].map(id => ({ id, name: id, kind: id === 'egg' ? 'egg' : 'digimon' })),
  edges: [['egg', 'a'], ['egg', 'b'], ['a', 'c'], ['c', 'shared'], ['b', 'shared'], ['shared', 'next']]
    .map(([from, to]) => ({ id: JSON.stringify([from, to]), from, to })),
}
test('egg trees flow downwards with one parent per portrait, including converging evolution routes', () => {
  const layout = layoutDigimonDex(branchFixture), positions = new Map(layout.nodes.map(node => [node.id, node]))
  const incoming = new Map()
  assert.deepEqual(new Set(layout.nodes.map(node => node.sourceId)), new Set(['egg', 'a', 'b', 'c', 'shared', 'next']))
  assert.deepEqual(new Set(layout.edges.map(edge => edge.id)), new Set(branchFixture.edges.map(edge => edge.id)))
  for (const edge of layout.edges) {
    const from = positions.get(edge.from), to = positions.get(edge.to)
    assert(to.y > from.y + from.size, edge.id + ' must descend below its parent')
    incoming.set(to.id, (incoming.get(to.id) ?? 0) + 1)
    assert.equal(edge.points[0][0], from.x + from.size / 2)
    assert.equal(edge.points[0][1], from.y + from.size)
    assert.equal(edge.points.at(-1)[0], to.x + to.size / 2)
    assert.equal(edge.points.at(-1)[1], to.y)
  }
  assert([...incoming.values()].every(count => count === 1))
  assert.equal(layout.nodes.filter(node => node.sourceId === 'shared').length, 2)
  assert.equal(layout.nodes.filter(node => node.referenceTo === 'shared').length, 1)
})

test('collapsing a branch hides only its descendants while keeping the egg and sibling routes', () => {
  const layout = layoutDigimonDex(branchFixture, { expandedIds: new Set(['egg', 'b']) })
  assert.deepEqual(new Set(layout.nodes.map(node => node.sourceId)), new Set(['egg', 'a', 'b', 'shared']))
  assert.deepEqual(new Set(layout.edges.map(edge => edge.id)), new Set(['["egg","a"]', '["egg","b"]', '["b","shared"]']))
  const a = layout.nodes.find(node => node.id === 'a'), b = layout.nodes.find(node => node.id === 'b')
  assert.equal(a.childCount, 1); assert.equal(a.expanded, false); assert.equal(b.expanded, true)
})

test('independent branches never cross each other; only a shared sibling bus may overlap', () => {
  for (const graph of allGraphs) {
    const layout = layoutDigimonDex(graph)
    for (let i = 0; i < layout.edges.length; i++) for (let j = i + 1; j < layout.edges.length; j++) {
      const first = layout.edges[i], second = layout.edges[j]
      if (first.from === second.from) continue
      for (let a = 1; a < first.points.length; a++) for (let b = 1; b < second.points.length; b++) {
        const [p, q] = [first.points[a - 1], first.points[a]], [r, s] = [second.points[b - 1], second.points[b]]
        const horizontal = p[1] === q[1], otherHorizontal = r[1] === s[1]
        let crosses
        if (horizontal === otherHorizontal) {
          const axis = horizontal ? 0 : 1, cross = 1 - axis
          crosses = p[cross] === r[cross] && Math.max(Math.min(p[axis], q[axis]), Math.min(r[axis], s[axis])) < Math.min(Math.max(p[axis], q[axis]), Math.max(r[axis], s[axis]))
        } else {
          const [h1,h2,v1,v2] = horizontal ? [p,q,r,s] : [r,s,p,q]
          crosses = v1[0] >= Math.min(h1[0],h2[0]) && v1[0] <= Math.max(h1[0],h2[0]) && h1[1] >= Math.min(v1[1],v2[1]) && h1[1] <= Math.max(v1[1],v2[1])
        }
        assert(!crosses, first.id + ' crosses ' + second.id)
      }
    }
  }
})

test('disconnected malformed input still stacks as separate downward trees', () => {
  const layout = layoutDigimonDex({ rootId: 'a', nodes: ['a','b','c','d'].map(id => ({ id, name: id, kind: 'digimon' })),
    edges: [{ id: 'ab', from: 'a', to: 'b' }, { id: 'cd', from: 'c', to: 'd' }] })
  const positions = new Map(layout.nodes.map(node => [node.id, node]))
  assert(positions.get('c').y > positions.get('b').y + positions.get('b').size)
  assert(positions.get('d').y > positions.get('c').y)
  assert(layout.width < 300)
})

test('known encyclopedia portraits use the existing front-facing model render from their first paint', () => {
  const display = getDexNodeDisplay({ kind: 'digimon', name: '팔몬', imageName: '팔몬' }, normalizeCollection(null))
  assert.equal(display.imageUrl, '/models/digimon/previews/palmon.webp')
})



test('new family routes are playable in the engine and retain level and training requirements', () => {
  for (const [from, targets] of Object.entries(connections.branches)) for (const to of targets) {
    assert(lookup.has(from) && lookup.has(to), from + ' → ' + to)
    assert(lookup.get(from).진화가능.includes(to), from + ' → ' + to + ' missing from gameplay')
    const source = engine.createCombatant({ id: from, name: from, data: lookup.get(from), level: 1 })
    const option = engine.getEvolutionOptions(source).find(option => option.targetData.이름 === to)
    assert(option, from + ' → ' + to + ' missing from the evolution selection')
    assert(option.requirements.some(rule => rule.key === 'level' && rule.required > 1))
    assert.equal(option.canEvolve, false, from + ' → ' + to + ' must not bypass its requirements')
  }
})

test('all species are obtainable even when every Jogress material is required, without circular dependencies', () => {
  const obtainable = new Set(eggs.flatMap(egg => egg.부화가능))
  let added = true
  while (added) {
    added = false
    for (const from of [...obtainable]) for (const to of lookup.get(from)?.진화가능 ?? []) {
      if (obtainable.has(to)) continue
      const route = getEvolutionRoute(from, to, lookup.get(to)?.stage)
      if (!route || (route.recipe && !route.recipe.materials.every(name => obtainable.has(name)))) continue
      obtainable.add(to); added = true
    }
  }
  assert.deepEqual(playable.filter(name => !obtainable.has(name)), [])
})

test('new Jogress routes require every matching leveled partner and fuse through the existing item flow', () => {
  for (const recipe of connections.jogress) {
    const members = recipe.materials.map(name => engine.createCombatant({ id: name, name, data: lookup.get(name), level: recipe.level }))
    const state = { currentStage: 191, currentMap: '기어 포레스트', gameMode: 'classic', player: members[0], party: members,
      activeAllyIds: [members[0].id], inventory: {}, trainerSkills: {} }
    const before = structuredClone(state)
    const result = engine.resolveJogressEvolution(state, members, recipe, true)
    assert(result, recipe.targetName + ' must work with the Jogress item')
    assert.equal(result.evolvedMember.name, recipe.targetName)
    assert.equal(result.nextGameState.party.length, 1)
    assert.deepEqual(state, before)
    assert.equal(engine.resolveJogressEvolution(state, members, recipe, false), null, 'no free first fusion')
    assert.equal(engine.resolveJogressEvolution(state, members.slice(0, -1), recipe, true), null, 'missing material')
    const lower = structuredClone(state); lower.party.at(-1).level = recipe.level - 1
    assert.equal(engine.resolveJogressEvolution(lower, lower.party, recipe, true), null, 'underleveled material')
    const options = engine.getEvolutionOptions(members[0], {}, members)
    const option = options.find(option => option.targetData.이름 === recipe.targetName)
    assert(option); assert.equal(option.partnerIds.length, members.length - 1)
    assert.equal(option.canEvolve, false, 'an unused Jogress route still needs its item')
    assert.equal(getEvolutionRoute('아구몬', recipe.targetName, lookup.get(recipe.targetName).stage), null, 'unrelated source')
  }
})

test('loading an older save refreshes its evolution list with the newly connected family routes', () => {
  const unit = engine.createCombatant({ id: 'old-koromon', name: '코로몬', data: lookup.get('코로몬'), level: 3 })
  unit.speciesData = { ...unit.speciesData, 진화가능: ['아구몬'] }
  const state = { currentStage: 1, currentMap: '시작의마을', gameMode: 'classic', player: unit, party: [unit],
    enemies: [], activeAllyIds: [unit.id], inventory: {}, trainerSkills: {} }
  const restored = engine.parseSavedGameState(JSON.stringify({ version: 1, gameState: state }))
  assert(restored)
  assert(restored.player.speciesData.진화가능.includes('길몬'))
  assert(restored.party[0].speciesData.진화가능.includes('샤우트몬'))
})


test('each branch grows to both sides of its centered parent, starting at the Digi-Egg root', () => {
  for (const graph of eggGraphs) {
    const layout = layoutDigimonDex(graph)
    for (const parent of layout.nodes) {
      const children = layout.nodes.filter(node => node.parentId === parent.id)
      if (!children.length) continue
      const left = Math.min(...children.map(node => node.x)), right = Math.max(...children.map(node => node.x))
      assert.equal(parent.x, (left + right) / 2, parent.id + ' must be centered above its children')
      if (children.length > 1) {
        assert(left < parent.x, parent.id + ' needs a left-hand branch')
        assert(right > parent.x, parent.id + ' needs a right-hand branch')
      }
      assert(children.every(node => node.y > parent.y + parent.size))
    }
  }
})
