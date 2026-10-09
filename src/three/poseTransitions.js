import * as THREE from 'three'
import { clamp01 } from './battle3dMath.js'

import { CLIP_BLEND_MS } from './animationTiming.js'
export { CLIP_BLEND_MS, ATTACK_RECOVERY_MS } from './animationTiming.js'

// Freeze the *displayed* pose before replacing an action. Cross-fading a reset
// action cannot preserve an interrupted/repeated take (or a manually sampled one).
// Bindings are cached once per rig, not looked up on every rendered frame.
function snapshotPose(actor) {
  actor.poseBindings ??= [...new Map(actor.clips.flatMap(clip => clip.tracks).map(track => [track.name, track])).values()]
    .map(track => ({ track, binding: new THREE.PropertyBinding(actor.mixer.getRoot(), track.name) }))
  const tracks = actor.poseBindings.map(({ track, binding }) => {
    const pose = new Array(track.getValueSize()).fill(NaN)
    binding.getValue(pose, 0)
    if (!pose.every(Number.isFinite)) throw Error(`Cannot snapshot animation binding: ${track.name}`)
    return new track.constructor(track.name, [0, 1], [...pose, ...pose])
  })
  return new THREE.AnimationClip('__pose_transition', 1, tracks)
}

export function clearPoseTransition(actor) {
  const blend = actor.clipBlend
  if (!blend) return
  blend.from.stop()
  actor.mixer.uncacheAction(blend.clip)
  actor.clipBlend = null
}

export function beginPoseTransition(actor, action, { startMs, durationMs = CLIP_BLEND_MS, speed = 1, floorOffset = 0 } = {}) {
  const snapshot = actor.action && durationMs > 0 ? snapshotPose(actor) : null
  const previousFloor = actor.poseFloorOffset ?? actor.clipFloorOffset ?? 0
  clearPoseTransition(actor)
  actor.mixer.stopAllAction()
  actor.finishToIdle = false
  if (snapshot) {
    const from = actor.mixer.clipAction(snapshot).play()
    from.timeScale = 0
    from.setEffectiveWeight(1)
    actor.clipBlend = { from, clip: snapshot, to: action, startMs, durationMs, speed,
      fromFloor: previousFloor, toFloor: floorOffset, progress: 0 }
  }
  actor.action = action
  actor.clipFloorOffset = snapshot ? previousFloor : floorOffset
  return Boolean(snapshot)
}

// Mixer dt is capped after a slow frame. Blend weights must still catch up to the
// same absolute clock as launch, impact and manually sampled attack/defeat poses.
export function updatePoseTransition(actor, now) {
  const blend = actor.clipBlend
  if (!blend) return
  const p = clamp01((now - blend.startMs) * blend.speed / blend.durationMs)
  const weight = p * p * (3 - 2 * p)
  blend.progress = weight
  blend.from.setEffectiveWeight(1 - weight)
  blend.to.setEffectiveWeight(weight)
  actor.clipFloorOffset = blend.fromFloor + (blend.toFloor - blend.fromFloor) * weight
  if (p >= 1) clearPoseTransition(actor)
}
