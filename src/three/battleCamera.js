import * as THREE from 'three'

// The 3D battle camera: a slightly raised JRPG side view. It is solved from the field size so
// that the HUD's floor line (logical px from the top) meets the ground at z = 0, and so that
// 10 world units span the field height at that line — the scale the formation and model sizes
// were authored in. The horizon then sits about a quarter of the way down the field.
export const BATTLE_CAMERA = Object.freeze({ fov: 30, pitch: 8 })

export function solveBattleCamera(camera, { width, height, floorY }) {
  const halfFov = THREE.MathUtils.degToRad(BATTLE_CAMERA.fov / 2)
  const pitch = THREE.MathUtils.degToRad(BATTLE_CAMERA.pitch)
  const tan = Math.tan(halfFov)
  const floorNdc = 1 - (2 * floorY) / height
  const below = Math.atan(-floorNdc * tan)
  const axisDepth = 5 / tan
  const distance = axisDepth / Math.cos(below)
  const down = pitch + below
  camera.fov = BATTLE_CAMERA.fov
  camera.aspect = width / height
  camera.near = 0.5
  camera.far = 800
  camera.position.set(0, distance * Math.sin(down), distance * Math.cos(down))
  camera.up.set(0, 1, 0)
  camera.lookAt(camera.position.x, camera.position.y - Math.sin(pitch), camera.position.z - Math.cos(pitch))
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld()
  return { axisDepth, axis: new THREE.Vector3(0, -Math.sin(pitch), -Math.cos(pitch)) }
}

// Depth along the view axis (what perspective divides by).
export function viewDepth(camera, point, axis) {
  return point.clone().sub(camera.position).dot(axis)
}
