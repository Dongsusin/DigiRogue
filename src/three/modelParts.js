import { Box3, Matrix3, Matrix4, Vector3 } from 'three'

const topologyCache = new WeakMap()
const positionCache = new WeakMap()
const supportTopologyCache = new WeakMap()
const skinMatrixCache = new WeakMap()
const point = new Vector3(), a = new Vector3(), b = new Vector3(), cross = new Vector3()
const cofactor = new Matrix3()
const common = new Matrix4(), bone = new Matrix4(), combined = new Matrix4()
const attributeVersion = attribute => attribute?.data?.version ?? attribute?.version ?? 0

function topology(geometry) {
  let cached = topologyCache.get(geometry)
  const position = geometry.attributes.position, skinIndex = geometry.attributes.skinIndex, skinWeight = geometry.attributes.skinWeight
  if (cached && cached.position === position && cached.version === attributeVersion(position) &&
    cached.index === geometry.index && cached.indexVersion === attributeVersion(geometry.index) &&
    cached.skinIndex === skinIndex && cached.skinIndexVersion === attributeVersion(skinIndex) &&
    cached.skinWeight === skinWeight && cached.skinWeightVersion === attributeVersion(skinWeight)) return cached
  const count = geometry.index?.count ?? position.count
  const indices = new Uint32Array(count)
  const areas = new Float64Array(count)
  for (let i = 0; i < count; i++) indices[i] = geometry.index ? geometry.index.getX(i) : i
  for (let i = 0; i + 2 < count; i += 3) {
    point.fromBufferAttribute(position, indices[i])
    a.fromBufferAttribute(position, indices[i + 1]).sub(point)
    b.fromBufferAttribute(position, indices[i + 2]).sub(point)
    cross.crossVectors(a, b).toArray(areas, i)
  }
  // Decode normalized/interleaved attributes once. The hot loop then performs
  // the same linear blend as SkinnedMesh with one combined matrix per bone,
  // rather than constructing four matrices for every vertex on every frame.
  const vertices = new Float64Array(position.count * 3)
  for (let i = 0; i < position.count; i++) point.fromBufferAttribute(position, i).toArray(vertices, i * 3)
  let bones, weights, weightTotals
  if (skinIndex && skinWeight) {
    bones = new Uint32Array(position.count * 4); weights = new Float64Array(position.count * 4)
    weightTotals = new Float64Array(position.count)
    for (let i = 0; i < position.count; i++) for (let j = 0; j < 4; j++) {
      bones[i * 4 + j] = skinIndex.getComponent(i, j)
      weights[i * 4 + j] = skinWeight.getComponent(i, j)
      weightTotals[i] += weights[i * 4 + j]
    }
  }
  cached = { indices, areas, vertices, bones, weights, weightTotals, position, version: attributeVersion(position),
    index: geometry.index, indexVersion: attributeVersion(geometry.index), skinIndex, skinIndexVersion: attributeVersion(skinIndex),
    skinWeight, skinWeightVersion: attributeVersion(skinWeight) }
  topologyCache.set(geometry, cached)
  return cached
}

function supportVertices(mask, indices, count) {
  let cached = supportTopologyCache.get(mask)
  if (cached?.indices === indices) return cached
  const needed = new Uint8Array(count)
  const triangles = []
  for (let i = 0; i + 2 < indices.length; i += 3) {
    const ia = indices[i], ib = indices[i + 1], ic = indices[i + 2]
    if (!mask[ia] && !mask[ib] && !mask[ic]) continue
    triangles.push(i)
    needed[ia] = needed[ib] = needed[ic] = 1
  }
  const selected = []
  for (let i = 0; i < count; i++) if (needed[i]) selected.push(i)
  cached = { vertices: Uint32Array.from(selected), triangles: Uint32Array.from(triangles), indices }
  supportTopologyCache.set(mask, cached)
  return cached
}

function poseVertices(mesh, data, positions, needed) {
  // Morph targets still use Three's complete deformation path. Do not lose
  // facial/morph animation for future imported assets.
  const morphing = mesh.morphTargetInfluences?.some(weight => weight !== 0)
  if (morphing || (mesh.isSkinnedMesh && !data.weights)) {
    for (let i = 0; i < (needed ? needed.length : positions.length / 3); i++) {
      const vertex = needed ? needed[i] : i
      mesh.getVertexPosition(vertex, point).applyMatrix4(mesh.matrixWorld).toArray(positions, vertex * 3)
    }
    return
  }
  let matrices
  if (mesh.isSkinnedMesh) {
    const length = mesh.skeleton.bones.length * 16
    matrices = skinMatrixCache.get(mesh)
    if (!matrices || matrices.length !== length) {
      matrices = new Float64Array(length); skinMatrixCache.set(mesh, matrices)
    }
    common.multiplyMatrices(mesh.matrixWorld, mesh.bindMatrixInverse)
    for (let i = 0; i < length; i += 16) {
      // Three's CPU deformation uses double-precision world/inverse matrices.
      // The Float32 GPU bone buffer loses precision on large imported rigs.
      bone.multiplyMatrices(mesh.skeleton.bones[i / 16].matrixWorld, mesh.skeleton.boneInverses[i / 16])
      combined.multiplyMatrices(common, bone).multiply(mesh.bindMatrix).toArray(matrices, i)
    }
  }
  const world = mesh.matrixWorld.elements
  for (let i = 0; i < (needed ? needed.length : positions.length / 3); i++) {
    const vertex = needed ? needed[i] : i, offset = vertex * 3
    const x = data.vertices[offset], y = data.vertices[offset + 1], z = data.vertices[offset + 2]
    if (!matrices) {
      positions[offset] = world[0] * x + world[4] * y + world[8] * z + world[12]
      positions[offset + 1] = world[1] * x + world[5] * y + world[9] * z + world[13]
      positions[offset + 2] = world[2] * x + world[6] * y + world[10] * z + world[14]
      continue
    }
    let px = 0, py = 0, pz = 0
    for (let j = vertex * 4; j < vertex * 4 + 4; j++) {
      const weight = data.weights[j]
      if (!weight) continue
      const b = data.bones[j] * 16
      px += weight * (matrices[b] * x + matrices[b + 4] * y + matrices[b + 8] * z + matrices[b + 12])
      py += weight * (matrices[b + 1] * x + matrices[b + 5] * y + matrices[b + 9] * z + matrices[b + 13])
      pz += weight * (matrices[b + 2] * x + matrices[b + 6] * y + matrices[b + 10] * z + matrices[b + 14])
    }
    const remainder = 1 - data.weightTotals[vertex]
    positions[offset] = px + common.elements[12] * remainder
    positions[offset + 1] = py + common.elements[13] * remainder
    positions[offset + 2] = pz + common.elements[14] * remainder
  }
}

// Several source rigs hide attack parts by collapsing their joints to 0 or 0.01.
// Box3 still counts those vertices, including invisible projectiles below the feet.
// Measure rendered triangles instead, keeping equipment whenever its animation reveals it.
export function getVisibleModelBounds(object, target = new Box3(), { vertexMasks, floorY = -Infinity } = {}) {
  target.makeEmpty()
  const clipped = Number.isFinite(floorY)
  object.updateMatrixWorld(true)
  object.traverseVisible((mesh) => {
    if (!mesh.isMesh || !mesh.geometry.attributes.position) return
    const mask = vertexMasks?.get(mesh)
    if (vertexMasks && !mask) return
    const geometry = mesh.geometry
    const data = topology(geometry)
    const { indices, areas } = data
    const count = geometry.attributes.position.count
    let positions = positionCache.get(mesh)
    if (!positions || positions.length !== count * 3) {
      positions = new Float64Array(count * 3)
      positionCache.set(mesh, positions)
    }
    const support = mask && supportVertices(mask, indices, count)
    poseVertices(mesh, data, positions, support?.vertices)
    // Cross products transform by the cofactor matrix, including nonuniform GLB quantization.
    cofactor.getNormalMatrix(mesh.matrixWorld).multiplyScalar(mesh.matrixWorld.determinant())
    const groups = Array.isArray(mesh.material) ? geometry.groups : [{ start: 0, count: indices.length, materialIndex: 0 }]
    for (const group of groups) {
      const material = Array.isArray(mesh.material) ? mesh.material[group.materialIndex] : mesh.material
      if (!material || material.visible === false) continue
      const start = Math.max(group.start, geometry.drawRange.start)
      const end = Math.min(indices.length, group.start + group.count, geometry.drawRange.start + geometry.drawRange.count)
      const selected = start % 3 === 0 ? support?.triangles : null
      for (let triangle = 0; triangle < (selected ? selected.length : Math.ceil((end - start) / 3)); triangle++) {
        const i = selected ? selected[triangle] : start + triangle * 3
        if (i < start || i + 2 >= end) continue
        if (mask && !selected && !mask[indices[i]] && !mask[indices[i + 1]] && !mask[indices[i + 2]]) continue
        const ia = indices[i] * 3, ib = indices[i + 1] * 3, ic = indices[i + 2] * 3
        point.fromArray(positions, ia)
        a.fromArray(positions, ib).sub(point)
        b.fromArray(positions, ic).sub(point)
        const posedArea = cross.crossVectors(a, b).lengthSq()
        const restArea = cross.fromArray(areas, i).applyMatrix3(cofactor).lengthSq()
        // 0.01 linear scale gives 1e-8 squared area; a visible 0.1 scale still counts.
        if (!(posedArea > Math.max(restArea * 1e-7, 1e-24))) continue
        if (!mask && (!clipped || Math.min(positions[ia + 1], positions[ib + 1], positions[ic + 1]) >= floorY)) {
          target.expandByPoint(point)
          target.expandByPoint(point.fromArray(positions, ib))
          target.expandByPoint(point.fromArray(positions, ic))
          continue
        }
        for (let corner = 0; corner < 3; corner++) {
          const index = indices[i + corner], offset = index * 3
          if (mask && !mask[index]) continue
          point.fromArray(positions, offset)
          if (point.y >= floorY) target.expandByPoint(point)
          if (!clipped) continue
          // Match the horizontal ground clipping plane, including triangles
          // crossing it. Below-ground weapons do not enlarge the visible frame.
          const next = indices[i + (corner + 1) % 3], nextOffset = next * 3
          if (mask && !mask[next]) continue
          const nextY = positions[nextOffset + 1]
          if ((point.y < floorY) === (nextY < floorY)) continue
          const fraction = (floorY - point.y) / (nextY - point.y)
          point.set(point.x + (positions[nextOffset] - point.x) * fraction, floorY,
            point.z + (positions[nextOffset + 2] - point.z) * fraction)
          target.expandByPoint(point)
        }
      }
    }
  })
  return target
}
