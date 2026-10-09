import * as THREE from 'three'
import { getVisibleModelBounds } from './modelParts.js'
import { getModelGroundBounds, getModelGrounding } from './modelGrounding.js'
import { CLIP_ROLES, pickClip } from './battle3dMath.js'

const footprints = new WeakMap()
export function getBattleFootprint(asset, spec, prepared, side) {
  let cached = footprints.get(asset.scene)
  if (!cached) { cached = new Map(); footprints.set(asset.scene, cached) }
  const key = `${side}:${spec.rotationY || 0}:${spec.name || ''}`
  if (!cached.has(key)) cached.set(key, measureBattleFootprint(prepared.normalized, prepared.mixer, prepared.clips, side))
  return { ...cached.get(key) }
}

// Measure the entire idle cycle in battle orientation, before parenting into the
// scene. This excludes hidden attack parts and avoids rescaling on every breath.
export function measureBattleFootprint(normalized, mixer, clips, side) {
  const pivot = new THREE.Group()
  pivot.rotation.y = side === 'ally' ? Math.PI * .34 : -Math.PI * .34
  pivot.add(normalized)
  const idle = pickClip(clips, CLIP_ROLES.idle)
  let width = 0, height = 0, depth = 0
  for (let sample = 0; sample <= 16; sample++) {
    if (idle && mixer) mixer.setTime(idle.duration * sample / 16)
    pivot.updateMatrixWorld(true)
    const profile = getModelGrounding(normalized)
    const grounded = profile && profile.mode !== 'surface'
    const floorY = grounded ? getModelGroundBounds(normalized).min.y : -Infinity
    const bounds = getVisibleModelBounds(pivot, new THREE.Box3(), { floorY })
    width = Math.max(width, 2 * Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x)))
    height = Math.max(height, bounds.max.y - bounds.min.y)
    depth = Math.max(depth, 2 * Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z)))
  }
  if (mixer) mixer.setTime(0)
  pivot.remove(normalized)
  normalized.updateMatrixWorld(true)
  // Leave a small envelope for animation interpolation between sampled poses.
  const margin = idle && mixer ? 1.02 : 1
  return { width: Math.max(.01, width * margin), height: Math.max(.01, height * margin), depth: Math.max(.01, depth * margin) }
}
