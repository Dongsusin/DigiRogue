import { Box3, Plane, Vector3 } from 'three'
import { getVisibleModelBounds } from './modelParts.js'
import { MODEL_GROUNDING_OVERRIDES } from '../data/modelGroundingOverrides.js'

const profiles = new WeakMap()
const FOOT = /foot|toe|ank(?:le|lle)|hoof|ashikubi|(?:^|_)heel(?:[lr_\d]|$)|kakato/i
const WING = /wing|hane|羽/i
const EQUIPMENT = /weapon|sword|shield|buki|lance|spear|staff|item|arrow|gun|hammer|crossbow|longbow|shortbow|(?:^|_)bow(?:[lr_\d]|$)|blade|axe|mant|cloak/i

function hasJoint(bone, pattern) {
  for (let joint = bone; joint; joint = joint.parent) {
    if (joint.isBone && pattern.test(joint.name)) return true
  }
  return false
}

// Choose support from the actual skinned soles, never a joint's centre or the
// end of carried equipment. Keep winged rigs' original airborne presentation.
export function createModelGrounding(model, bounds, spec = {}) {
  const override = MODEL_GROUNDING_OVERRIDES[spec.name]
  if (override) return { mode: 'surface', reason: override, floor: bounds.min.y }
  let winged = false
  model.traverse(node => { if (node.isBone && WING.test(node.name)) winged = true })
  if (winged) return { mode: 'surface', reason: 'winged', floor: bounds.min.y }
  const feet = new WeakMap(), body = new WeakMap()
  let footVertices = 0, equipmentVertices = 0
  model.traverseVisible(mesh => {
    if (!mesh.isMesh || !mesh.geometry.attributes.position) return
    const { position, skinIndex, skinWeight } = mesh.geometry.attributes
    const footMask = new Uint8Array(position.count), bodyMask = new Uint8Array(position.count)
    let meshFootVertices = 0
    if (mesh.isSkinnedMesh && skinIndex && skinWeight) {
      const equipment = mesh.skeleton.bones.map(bone => hasJoint(bone, EQUIPMENT))
      const support = mesh.skeleton.bones.map((bone, index) => !equipment[index] && hasJoint(bone, FOOT))
      for (let vertex = 0; vertex < position.count; vertex++) {
        let footWeight = 0, bodyWeight = 0, equipmentWeight = 0
        for (let influence = 0; influence < skinIndex.itemSize; influence++) {
          const joint = skinIndex.getComponent(vertex, influence)
          const weight = skinWeight.getComponent(vertex, influence)
          if (support[joint]) footWeight += weight
          if (!equipment[joint]) bodyWeight += weight
          else equipmentWeight += weight
        }
        if (footWeight >= .5) { footMask[vertex] = 1; footVertices++; meshFootVertices++ }
        if (bodyWeight >= .5) bodyMask[vertex] = 1
        if (equipmentWeight >= .5) equipmentVertices++
      }
    } else if (!EQUIPMENT.test(mesh.name) && !hasJoint(mesh, EQUIPMENT)) bodyMask.fill(1)
    else equipmentVertices += position.count
    if (meshFootVertices) feet.set(mesh, footMask)
    body.set(mesh, bodyMask)
  })
  if (footVertices < 3) {
    // Older rigs call their leg joints by numbers, or combine the feet with the
    // body skin. In those rigs use the lowest visible body, excluding equipment.
    // Models without separate equipment retain the original support point.
    if (equipmentVertices >= 3) {
      const support = getVisibleModelBounds(model, new Box3(), { vertexMasks: body })
      const height = bounds.max.y - bounds.min.y
      if (Number.isFinite(support.min.y) && support.min.y <= bounds.min.y + height * .35) {
        return { mode: 'body', body, floor: support.min.y, footVertices: 0,
          idleGap: (support.min.y - bounds.min.y) / height }
      }
    }
    return { mode: 'surface', reason: 'no-soles', floor: bounds.min.y }
  }
  const soles = getVisibleModelBounds(model, new Box3(), { vertexMasks: feet })
  // Hidden feet and unusual hovering rigs are not safe standing anchors.
  const height = bounds.max.y - bounds.min.y
  if (!Number.isFinite(soles.min.y) || soles.min.y > bounds.min.y + height * .35) {
    return { mode: 'surface', reason: 'airborne-or-hidden-soles', floor: bounds.min.y }
  }
  return { mode: 'feet', feet, body, floor: soles.min.y, footVertices,
    idleGap: (soles.min.y - bounds.min.y) / height }
}

export function setModelGrounding(model, profile) { profiles.set(model, profile) }
export function getModelGrounding(model) { return profiles.get(model) }

export function getModelGroundBounds(model, target = new Box3(), { body = false } = {}) {
  const profile = getModelGrounding(model)
  if (!profile || profile.mode === 'surface') return getVisibleModelBounds(model, target)
  getVisibleModelBounds(model, target, { vertexMasks: body || profile.mode === 'body' ? profile.body : profile.feet })
  // A source animation can temporarily hide its soles. Do not invent an offset.
  return target.isEmpty() ? getVisibleModelBounds(model, target) : target
}

// Each actor owns its plane/materials; cached assets and other users of the same
// model must remain untouched. Clipping represents the painted map's foreground.
export function createGroundOcclusion(model, floorY = 0) {
  const profile = getModelGrounding(model)
  if (!profile || profile.mode === 'surface') return null
  const plane = new Plane(new Vector3(0, 1, 0), -floorY)
  const copies = new Map()
  const copy = source => {
    if (!source) return source
    let material = copies.get(source)
    if (!material) {
      material = source.clone()
      material.clippingPlanes = [...(source.clippingPlanes || []), plane]
      material.clipShadows = true
      copies.set(source, material)
    }
    return material
  }
  model.traverse(mesh => {
    if (mesh.isMesh) mesh.material = Array.isArray(mesh.material) ? mesh.material.map(copy) : copy(mesh.material)
  })
  let disposed = false
  return { plane, dispose() {
    if (disposed) return
    disposed = true
    for (const material of copies.values()) material.dispose()
  } }
}
