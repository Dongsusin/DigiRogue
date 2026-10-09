import * as THREE from 'three'
import { getStatusEffectDefinition, STATUS_IMPACT_MS } from '../battle/statusConditions.js'

const TAU = Math.PI * 2
const makeStar = () => {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? .43 : 1
    if (!i) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  shape.closePath()
  return new THREE.ExtrudeGeometry(shape, { depth: .2, bevelEnabled: false }).translate(0, 0, -.1)
}
const makeZ = () => {
  const points = [[-.12, .13, 0], [.12, .13, 0], [-.12, -.13, 0], [.12, -.13, 0]].map(p => new THREE.Vector3(...p))
  const curve = new THREE.CurvePath()
  for (let i = 1; i < points.length; i++) curve.add(new THREE.LineCurve3(points[i - 1], points[i]))
  return new THREE.TubeGeometry(curve, 12, .026, 4, false)
}

// Status feedback lives in world space and follows the affected actor. Geometry and
// materials are owned by BattleEffects, which also removes them after the cue ends.
export class StatusEffects {
  constructor(fx) { this.fx = fx; fx.geometries.statusStar ??= makeStar() }

  impact(event, pose, start, speed = 1) {
    const definition = getStatusEffectDefinition(event.statusType), durationMs = STATUS_IMPACT_MS[event.phase]
    if (!definition || !durationMs) return null
    const fx = this.fx, group = new THREE.Group(), pieces = [], bolts = []
    const color = event.phase === 'cleared' ? 0x9affd3 : new THREE.Color(definition.color).getHex()
    const mesh = (geometry, scale, position = [0, 0, 0]) => {
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .8,
        depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
      const child = new THREE.Mesh(geometry, material)
      child.scale.set(...scale); child.position.set(...position); group.add(child); pieces.push(child)
      return child
    }
    const glow = fx.sprite(fx.textures.glow, color, .85)
    glow.material.toneMapped = false
    group.add(glow); glow.position.y = .48
    const floor = mesh(fx.geometries.torus, [.4, .4, .4], [0, .025, 0]); floor.rotation.x = -Math.PI / 2
    const kind = event.phase === 'cleared' ? 'cleared' : definition.icon
    if (kind === 'paralysis') {
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * TAU
        const points = Array.from({ length: 9 }, (_, n) => {
          const t = n / 8, radius = .32 + Math.sin(t * Math.PI * 5 + i) * .1
          return new THREE.Vector3(Math.cos(angle) * radius, .08 + t * .85, Math.sin(angle) * radius)
        })
        const bolt = fx.ribbon(points, .032, fx.additive(i % 2 ? 0xffffdc : color, .9))
        bolt.material.toneMapped = false
        group.add(bolt); bolts.push({ bolt, points, angle })
      }
    } else if (['poison', 'toxic'].includes(kind)) {
      const count = kind === 'toxic' ? 12 : 8
      for (let i = 0; i < count; i++) {
        const angle = i / count * TAU, radius = .24 + (i % 3) * .075
        const bubble = mesh(fx.geometries.sphere, [.045, .06, .045], [Math.cos(angle) * radius, .12 + (i % 4) * .12, Math.sin(angle) * radius])
        bubble.userData.index = i
      }
      const mist = fx.sprite(fx.textures.smoke, color, 1.15)
      mist.position.y = .28; group.add(mist); pieces.push(mist)
    } else if (kind === 'burn') {
      for (let i = 0; i < 9; i++) {
        const angle = i / 9 * TAU
        const flame = mesh(fx.geometries.spike, [.15, .3, .15], [Math.cos(angle) * .25, .18, Math.sin(angle) * .25])
        flame.userData.index = i
      }
    } else if (kind === 'confusion') {
      const orbit = mesh(fx.geometries.torus, [.36, .36, .36], [0, 1.02, 0]); orbit.rotation.x = Math.PI / 2
      for (let i = 0; i < 5; i++) {
        const star = mesh(fx.geometries.statusStar, [.075, .075, .075], [0, 1.02, 0])
        star.userData.orbit = i / 5 * TAU
      }
    } else if (kind === 'sleep') {
      for (let i = 0; i < 3; i++) {
        const z = mesh(makeZ(), [1, 1, 1], [.18, 1 + i * .15, 0])
        z.userData.sleep = i
      }
    } else if (kind === 'disabled') {
      for (let i = 0; i < 3; i++) {
        const band = mesh(fx.geometries.torus, [.34, .34, .34], [0, .22 + i * .23, 0])
        band.rotation.set(Math.PI / 2, i * .2, i * .4)
      }
      for (let i = 0; i < 4; i++) {
        const angle = i / 4 * TAU
        mesh(fx.geometries.cube, [.035, .4, .035], [Math.cos(angle) * .34, .48, Math.sin(angle) * .34])
      }
    } else {
      for (let i = 0; i < 8; i++) {
        const star = mesh(fx.geometries.shard, [.045, .045, .045], [0, .5, 0])
        star.userData.orbit = i / 8 * TAU
      }
    }
    group.userData.statusType = event.statusType; group.userData.phase = event.phase
    return fx.add({ group, start, duration: durationMs / Math.max(.1, speed), update: p => {
      const current = pose()
      if (!current) return false
      group.position.copy(current.position)
      const height = Math.max(.45, Math.min(2.8, current.height))
      group.scale.setScalar(height)
      const envelope = Math.sin(p * Math.PI) ** .65
      glow.material.opacity = envelope * (kind === 'paralysis' ? .42 : .22)
      glow.scale.setScalar(.75 + Math.sin(p * Math.PI) * .45)
      for (const child of pieces) {
        child.material.opacity = envelope * (child.isSprite ? .25 : .85)
        if (child.userData.index != null) {
          const i = child.userData.index
          child.position.y = .12 + (i % 4) * .08 + p * (kind === 'burn' ? .4 : .58)
          if (kind === 'burn') child.scale.y = .3 * (.7 + Math.sin(p * TAU + i) * .3)
        }
        if (child.userData.orbit != null) {
          const angle = child.userData.orbit + p * TAU * .65
          child.position.set(Math.cos(angle) * (.34 + (kind === 'cleared' ? p * .3 : 0)),
            kind === 'cleared' ? .3 + p * .7 : 1.03 + Math.sin(angle * 2) * .06, Math.sin(angle) * .34)
          child.rotation.set(p * 2, p * 3, angle)
        }
        if (child.userData.sleep != null) {
          const i = child.userData.sleep
          child.position.set(.15 + p * .18 + i * .12, .93 + i * .18 + p * .2, 0)
          child.quaternion.copy(fx.camera.quaternion)
          child.scale.setScalar(.55 + i * .18)
        }
      }
      for (const { bolt, points, angle } of bolts) {
        const shifted = points.map((point, i) => point.clone().add(new THREE.Vector3(
          Math.cos(angle) * Math.sin(p * TAU * 2 + i * 2) * .04, 0,
          Math.sin(angle) * Math.sin(p * TAU * 2 + i * 2) * .04)))
        bolt.userData.width = .032 * (.75 + Math.sin(p * Math.PI) * .5)
        fx.updateRibbon(bolt, shifted)
        bolt.material.opacity = envelope * .95
      }
      floor.scale.setScalar(.36 + p * .13); floor.material.opacity = envelope * .4
    } })
  }
}
