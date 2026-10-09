import * as THREE from 'three'
import profiles from '../data/attackProfiles.json' with { type: 'json' }

// Resolve after sampling the source animation and updating world matrices.
export function attackEmitter(actor, plan, target, shotIndex = 0) {
  const { role, bone, secondBone } = plan.emitter
  const selectedBone = shotIndex % 2 && secondBone ? secondBone : bone
  const joint = selectedBone && actor.model?.getObjectByName(selectedBone)
  const height = actor.height * (actor.modelHeight ?? 1)
  const localTip = shotIndex % 2 && secondBone ? plan.emitter.secondOffset : plan.emitter.offset
  if (joint && localTip) return joint.localToWorld(new THREE.Vector3(...localTip))
  const origin = joint ? joint.getWorldPosition(new THREE.Vector3()) : actor.root.position.clone().add(new THREE.Vector3(0,
    height * ({ mouth: .77, eyes: .83, head: .87, hand: .55, hands: .55, leftHand: .55, rightHand: .55, wings: .65, back: .66, tail: .3 }[role] ?? .56), 0))
  if (role === 'overhead') origin.y = Math.max(origin.y + height * .3, actor.root.position.y + height * 1.22)
  const direction = target.clone().sub(origin).normalize()
  const offset = role === 'shoulders' ? .065 : role === 'mouth' ? .18 : ['hand', 'hands', 'leftHand', 'rightHand', 'cannon', 'bow', 'weapon'].includes(role) ? .14 : .02
  return origin.addScaledVector(direction, height * offset)
}

// The body-to-head axis follows the sampled skeleton in world space, including
// native pitch, roll and mirrored facing, without assuming a bone's local basis.
export function attackBodyDirection(actor, plan) {
  const body = plan.bodyBone && actor.model?.getObjectByName(plan.bodyBone)
  const headName = profiles[plan.species || actor.spec?.name]?.anchors.head
  const head = headName && actor.model?.getObjectByName(headName)
  if (!body || !head) return null
  const direction = head.getWorldPosition(new THREE.Vector3()).sub(body.getWorldPosition(new THREE.Vector3()))
  const lengthSquared = direction.lengthSq()
  return Number.isFinite(lengthSquared) && lengthSquared > 1e-8 ? direction.normalize() : null
}
