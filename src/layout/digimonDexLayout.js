import { getEvolutionTreeBranches } from '../data/evolutionRules.js'
import { getDigimonThumbnailUrl } from '../data/digimonModels.js'
import { isPlayableDigimon } from '../data/speciesAvailability.js'
import { getCollectionStatus } from '../progression/digimonCollection.js'

// Follow the very same merged routes as the game, including item and Jogress
// routes. Discovery only changes a node's portrait, never the shape of its tree.
function buildEvolutionGraph(roots, lookup, eggRoot = null) {
  const nodes = eggRoot ? [eggRoot] : [], edges = [], found = new Set(), edgeKeys = new Set()
  const queue = []
  const connect = (from, to) => {
    const key = JSON.stringify([from, to])
    if (edgeKeys.has(key)) return
    edgeKeys.add(key)
    edges.push({ id: key, from, to })
  }
  const enqueue = name => {
    const species = lookup.get(name)
    if (!species || !isPlayableDigimon(species) || found.has(name)) return false
    found.add(name)
    nodes.push({ id: name, kind: 'digimon', name, imageName: species.imageName ?? species.이미지명 ?? name })
    queue.push(name)
    return true
  }
  for (const name of roots) {
    if (!lookup.has(name) || !isPlayableDigimon(lookup.get(name))) continue
    if (eggRoot) connect(eggRoot.id, name)
    enqueue(name)
  }
  for (let index = 0; index < queue.length; index++) {
    const name = queue[index]
    for (const branch of getEvolutionTreeBranches(name, lookup)) {
      if (!isPlayableDigimon(lookup.get(branch.name))) continue
      connect(name, branch.name)
      enqueue(branch.name)
    }
  }
  return { rootId: eggRoot?.id ?? nodes[0]?.id, nodes, edges }
}

export function buildEggEvolutionGraph(egg, lookup) {
  return buildEvolutionGraph(egg.부화가능 ?? [], lookup,
    { id: 'egg:' + egg.이름, kind: 'egg', name: egg.이름 })
}

// Some encounter-only families do not descend from any current hatch pool.
// Keep them in a separate forest, with their real onward routes and no invented
// egg links, so the encyclopedia still covers the entire playable catalog.
export function buildUnlinkedEvolutionGraph(eggs, lookup) {
  const covered = new Set(eggs.flatMap(egg => buildEggEvolutionGraph(egg, lookup).nodes)
    .filter(node => node.kind === 'digimon').map(node => node.id))
  const remaining = [...lookup.keys()].filter(name => !covered.has(name) && isPlayableDigimon(lookup.get(name)))
  const hasParent = new Set(remaining.flatMap(name => getEvolutionTreeBranches(name, lookup).map(branch => branch.name)))
  const roots = remaining.filter(name => !hasParent.has(name))
  const forest = buildEvolutionGraph(roots, lookup)
  const included = new Set(forest.nodes.map(node => node.id))
  // A future completely cyclic family may have no parentless entry.
  return buildEvolutionGraph([...roots, ...remaining.filter(name => !included.has(name))], lookup)
}

export function getDexNodeDisplay(node, collection) {
  if (node.kind === 'egg') return {
    known: true, label: node.name + '의 디지에그', imageUrl: '/아이템/디지에그/' + node.name + '.png',
  }
  if (getCollectionStatus(collection, node.name) === 'unknown') {
    return { known: false, label: '미발견 디지몬', imageUrl: '' }
  }
  return { known: true, label: node.name, imageUrl: getDigimonThumbnailUrl(node.imageName) }
}

export function getDexRelatedEdges(graph, nodeId) {
  if (!nodeId) return null
  const ancestors = new Set([nodeId]), descendants = new Set([nodeId])
  for (const [members, backwards] of [[ancestors, true], [descendants, false]]) {
    const queue = [nodeId]
    for (let i = 0; i < queue.length; i++) {
      for (const edge of graph.edges) {
        if ((backwards ? edge.to : edge.from) !== queue[i]) continue
        const next = backwards ? edge.from : edge.to
        if (!members.has(next)) { members.add(next); queue.push(next) }
      }
    }
  }
  return new Set(graph.edges.filter(edge =>
    (ancestors.has(edge.from) && ancestors.has(edge.to)) ||
    (descendants.has(edge.from) && descendants.has(edge.to))).map(edge => edge.id))
}

// A spanning tree groups each branch. Extra incoming
// connections (e.g. two Jogress materials) remain real edges rather than copied
// Digimon. Longest-path columns keep same-generation form changes readable.
export function layoutDigimonDex(graph) {
  if (!graph.nodes.length) return { nodes: [], edges: [], width: 164, height: 164 }
  const size = 92, columnPitch = 174, rowPitch = 128, padding = 36
  const adjacency = new Map(graph.nodes.map(node => [node.id, []]))
  const incoming = new Map(graph.nodes.map(node => [node.id, 0]))
  for (const edge of graph.edges) {
    adjacency.get(edge.from)?.push(edge.to)
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1)
  }
  const rank = new Map([[graph.rootId, 0]])
  const queue = graph.nodes.filter(node => !incoming.get(node.id)).map(node => node.id)
  for (let i = 0; i < queue.length; i++) {
    const from = queue[i]
    for (const to of adjacency.get(from) ?? []) {
      rank.set(to, Math.max(rank.get(to) ?? 0, (rank.get(from) ?? 0) + 1))
      incoming.set(to, incoming.get(to) - 1)
      if (incoming.get(to) === 0) queue.push(to)
    }
  }
  // Cyclic data must never hang or hide a node. Actual game routes are a DAG;
  // this fallback puts future cyclic forms after their first discovered parent.
  const tree = new Map(), placed = new Set(), primary = new Set()
  const span = (id, depth = 0) => {
    placed.add(id)
    if (!rank.has(id) || incoming.get(id) > 0) rank.set(id, depth)
    const children = []
    for (const next of adjacency.get(id) ?? []) {
      if (placed.has(next)) continue
      children.push(next)
      primary.add(JSON.stringify([id, next]))
      span(next, (rank.get(id) ?? depth) + 1)
    }
    tree.set(id, children)
  }
  span(graph.rootId)
  for (const node of graph.nodes) if (!placed.has(node.id)) span(node.id)
  // Pack each column independently. Reserving whole subtrees would leave the
  // opening generations almost empty whenever a late form has many branches.
  const rows = new Map(), parent = new Map(), preorder = new Map()
  let order = 0
  const indexTree = id => {
    preorder.set(id, order++)
    for (const child of tree.get(id) ?? []) { parent.set(child, id); indexTree(child) }
  }
  indexTree(graph.rootId)
  for (const node of graph.nodes) if (!preorder.has(node.id)) indexTree(node.id)
  const columns = new Map()
  for (const node of graph.nodes) {
    const column = rank.get(node.id) ?? 0
    if (!columns.has(column)) columns.set(column, [])
    columns.get(column).push(node.id)
  }
  for (const column of [...columns.keys()].sort((a, b) => a - b)) {
    const members = columns.get(column)
    const preferred = id => rows.get(parent.get(id)) ?? 0
    members.sort((a, b) => preferred(a) - preferred(b) || preorder.get(a) - preorder.get(b))
    let previousRow = -1
    for (const id of members) {
      const row = Math.max(preferred(id), previousRow + 1)
      rows.set(id, row); previousRow = row
    }
  }
  const nodes = graph.nodes.map(node => ({ ...node, size,
    x: padding + (rank.get(node.id) ?? 0) * columnPitch,
    y: padding + rows.get(node.id) * rowPitch,
  }))
  const positions = new Map(nodes.map(node => [node.id, node]))
  const width = Math.max(...nodes.map(node => node.x + size), size) + padding
  let height = Math.max(...nodes.map(node => node.y + size), size) + padding
  let returnLane = 0
  const edges = graph.edges.map(edge => {
    const from = positions.get(edge.from), to = positions.get(edge.to)
    const startX = from.x + size, startY = from.y + size / 2
    const endX = to.x, endY = to.y + size / 2
    const branchX = startX + 18 + (rows.get(from.id) % 5) * 8
    let points
    if (endX <= startX) {
      const laneY = height + 20 + returnLane++ * 10
      points = [[startX, startY], [branchX, startY], [branchX, laneY], [endX - 20, laneY], [endX - 20, endY], [endX, endY]]
    } else {
      // Route a merge through the gaps between rows and columns if its direct
      // horizontal leg would cross another portrait.
      const blocked = nodes.some(node => node.id !== from.id && node.id !== to.id &&
        endY > node.y - 6 && endY < node.y + size + 6 && node.x < endX && node.x + size > branchX)
      points = blocked
        ? [[startX, startY], [branchX, startY], [branchX, from.y + size + 18], [endX - 24, from.y + size + 18], [endX - 24, endY], [endX, endY]]
        : [[startX, startY], [branchX, startY], [branchX, endY], [endX, endY]]
    }
    return { ...edge, primary: primary.has(edge.id), points,
      path: points.map(([x, y], i) => (i ? 'L' : 'M') + x + ',' + y).join(' '),
    }
  })
  height += returnLane ? 30 + returnLane * 10 : 0
  return { nodes, edges, width, height }
}
