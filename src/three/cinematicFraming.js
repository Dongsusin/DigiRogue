import * as THREE from 'three'

const corner = new THREE.Vector3()
const direction = new THREE.Vector3()

// Retain the authored camera angle and aim, but pull back enough for wide wings,
// finishing poses and both DigiXros partners. Frame-space bounds already measured
// for grounding are reused; this does not rescan skinned geometry every frame.
// Tight shots may also move closer, while keeping every corner inside the frame.
export function fitCinematicCamera(camera, bounds, padding = .88, { tight = false } = {}) {
  camera.updateMatrixWorld(true)
  const halfY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / camera.zoom
  const halfX = halfY * camera.aspect
  let extra = tight ? -Infinity : 0
  for (const box of bounds) {
    if (!box || box.isEmpty()) continue
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
      corner.applyMatrix4(camera.matrixWorldInverse)
      extra = Math.max(extra, Math.abs(corner.x) / (halfX * padding) + corner.z, Math.abs(corner.y) / (halfY * padding) + corner.z,
        corner.z + camera.near * 1.5)
    }
  }
  if (Number.isFinite(extra) && extra !== 0) {
    camera.position.addScaledVector(camera.getWorldDirection(direction), -extra)
    camera.updateMatrixWorld(true)
  }
  return Number.isFinite(extra) ? extra : 0
}
