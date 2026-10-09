import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { getVisibleModelBounds } from './modelParts.js'
import { createModelGrounding, setModelGrounding } from './modelGrounding.js'
import { CLIP_ROLES, pickClip } from './battle3dMath.js'

// Long bodies (serpents, dragons) are fitted by their horizontal extent as well as height.
const HORIZONTAL_FIT = 0.55

// Clones a loaded model, poses it in its idle clip and scales it to unit height with the feet
// on the ground. Bounds come from the posed, skinned vertices, because several rips keep attack
// parts (vines, wings) extended in their bind pose.
export function prepareModel(asset, spec = {}) {
  const model = cloneSkeleton(asset.scene)
  const orientation = new THREE.Group()
  orientation.add(model)
  orientation.rotation.y = spec.rotationY || 0
  const clips = (asset.animations || []).filter((clip) => clip.duration > 0.05)
  const mixer = clips.length ? new THREE.AnimationMixer(model) : null
  const idle = mixer && pickClip(clips, CLIP_ROLES.idle)
  if (idle) { mixer.clipAction(idle).play(); mixer.update(0) }
  orientation.updateMatrixWorld(true)
  const box = getVisibleModelBounds(orientation)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  if (!Number.isFinite(size.y) || size.y < 0.00001) throw new Error('Empty model bounds')
  const grounding = createModelGrounding(model, box, spec)
  orientation.position.set(-center.x, -grounding.floor, -center.z)
  const normalized = new THREE.Group()
  normalized.add(orientation)
  setModelGrounding(normalized, grounding)
  const extent = Math.max(size.y, HORIZONTAL_FIT * Math.max(size.x, size.z))
  normalized.scale.setScalar(1 / extent)
  normalized.userData.idleBounds = box.clone().translate(new THREE.Vector3(-center.x, -grounding.floor, -center.z))
  normalized.userData.idleBounds.min.multiplyScalar(1 / extent)
  normalized.userData.idleBounds.max.multiplyScalar(1 / extent)
  return { normalized, model, mixer, clips, height: (box.max.y - grounding.floor) / extent }
}
