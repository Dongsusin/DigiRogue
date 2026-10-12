import { getEvolutionTreeBranches } from '../data/evolutionRules.js'
import { getDigimonPreviewUrl } from '../data/digimonModels.js'
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

export function getDexNodeDisplay(node, collection) {
  if (node.kind === 'egg') return {
    known: true, label: node.name + '의 디지에그', imageUrl: '/아이템/디지에그/' + node.name + '.png',
  }
  if (getCollectionStatus(collection, node.name) === 'unknown') {
    return { known: false, label: '미발견 디지몬', imageUrl: '' }
  }
  return { known: true, label: node.name, imageUrl: getDigimonPreviewUrl(node.imageName) }
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

// Each portrait has one visible parent. A shared evolution gets a leaf reference
// in the other branch instead of a long crossing connector. The gameplay graph
// is untouched, and every real route still owns exactly one displayed edge.
export function layoutDigimonDex(graph, { expandedIds = null } = {}) {
  if (!graph.nodes.length) return { nodes: [], edges: [], width: 164, height: 164 }
  const size = 92, gap = 36, rowPitch = 174, padding = 36
  const source = new Map(graph.nodes.map(node => [node.id, node]))
  const outgoing = new Map(graph.nodes.map(node => [node.id, []])), incoming = new Set()
  for (const edge of graph.edges) {
    if (!source.has(edge.from) || !source.has(edge.to)) continue
    outgoing.get(edge.from).push(edge); incoming.add(edge.to)
  }
  const occurrences = new Map(), children = new Map(), treeEdges = [], roots = [], queue = []
  const place = (id, parentId = null, depth = 0) => {
    occurrences.set(id, { ...source.get(id), sourceId: id, parentId, depth })
    children.set(id, []); queue.push(id)
  }
  const addRoot = id => {
    if (!source.has(id) || occurrences.has(id)) return
    roots.push(id); place(id)
  }
  addRoot(graph.rootId)
  for (const node of graph.nodes) if (!incoming.has(node.id)) addRoot(node.id)
  let cursor = 0
  const drain = () => {
    for (; cursor < queue.length; cursor++) {
      const id = queue[cursor], parent = occurrences.get(id)
      for (const edge of outgoing.get(id)) {
        let childId = edge.to, reference = occurrences.has(childId)
        if (reference) {
          childId = 'reference:' + edge.id
          occurrences.set(childId, { ...source.get(edge.to), id: childId, sourceId: edge.to,
            parentId: id, depth: parent.depth + 1, referenceTo: edge.to })
          children.set(childId, [])
        } else place(childId, id, parent.depth + 1)
        children.get(id).push(childId)
        treeEdges.push({ ...edge, to: childId, primary: !reference })
      }
    }
  }
  drain()
  // A malformed cyclic forest still terminates and remains inspectable.
  for (const node of graph.nodes) if (!occurrences.has(node.id)) { addRoot(node.id); drain() }

  const widths = new Map(), visible = new Set()
  const measure = id => {
    visible.add(id)
    const branch = children.get(id), expanded = expandedIds === null || expandedIds.has(id)
    const widthsBelow = expanded ? branch.map(measure) : []
    const width = Math.max(size, widthsBelow.reduce((total, width) => total + width, 0) + Math.max(0, widthsBelow.length - 1) * gap)
    widths.set(id, width); return width
  }
  for (const root of roots) measure(root)
  const nodes = []
  const position = (id, left, top) => {
    const node = occurrences.get(id), branch = children.get(id).filter(child => visible.has(child))
    let nextLeft = left, bottom = top + node.depth * rowPitch + size
    for (const child of branch) { bottom = Math.max(bottom, position(child, nextLeft, top)); nextLeft += widths.get(child) + gap }
    const first = branch.length ? occurrences.get(branch[0]).x : left + widths.get(id) / 2 - size / 2
    const last = branch.length ? occurrences.get(branch.at(-1)).x : first
    // A branch forks around its parent rather than growing only to the right.
    // Single-child paths stay vertical; siblings keep their separate subtrees.
    Object.assign(node, { size, x: (first + last) / 2, y: top + node.depth * rowPitch,
      childCount: children.get(id).length, expanded: branch.length > 0 })
    nodes.push(node)
    return bottom
  }
  const width = Math.max(...roots.map(root => widths.get(root))) + padding * 2
  let top = padding
  for (const root of roots) top = position(root, (width - widths.get(root)) / 2, top) + 84
  nodes.sort((a, b) => a.depth - b.depth || a.x - b.x)
  const edges = treeEdges.filter(edge => visible.has(edge.from) && visible.has(edge.to)).map(edge => {
    const from = occurrences.get(edge.from), to = occurrences.get(edge.to)
    const startX = from.x + size / 2, startY = from.y + size
    const endX = to.x + size / 2, endY = to.y, branchY = (startY + endY) / 2
    const points = [[startX, startY], [startX, branchY], [endX, branchY], [endX, endY]]
    return { ...edge, points, path: points.map(([x, y], i) => (i ? 'L' : 'M') + x + ',' + y).join(' ') }
  })
  const height = Math.max(...nodes.map(node => node.y + size)) + padding
  return { nodes, edges, width, height }
}
