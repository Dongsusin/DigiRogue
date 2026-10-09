import * as THREE from 'three'
import { CAPTURE_BIND_MS, CAPTURE_CONTAIN_MS, CAPTURE_RESULT_MS, CAPTURE_TOTAL_MS, captureEase } from './capturePresentation.js'

const TAU = Math.PI * 2
const clamp = value => Math.max(0, Math.min(1, value))
const NET_COLORS = { normal: 0x66e9ff, super: 0x78a7ff, hyper: 0xe0a2ff, master: 0xffd879 }

// A digital net surrounds the standing model, contracts into data, then either
// locks and returns to the tamer or breaks apart and releases the Digimon.
export class CaptureEffects {
  constructor(fx) { this.fx = fx }

  play({ target, origin, height, width, event }) {
    const fx = this.fx, group = new THREE.Group(), net = new THREE.Group()
    const color = NET_COLORS[event.tier] || NET_COLORS.normal
    const resultColor = event.success ? 0x79ffbc : 0xff956a
    const radius = Math.max(height * .52, width * .58)
    const center = height * .53
    group.name = 'capture-' + event.id
    group.add(net)
    const mesh = (geometry, tone, parent = group) => {
      const object = new THREE.Mesh(geometry, fx.additive(tone, 0))
      parent.add(object)
      return object
    }
    // Fine latitude/longitude lines read as a net, rather than an opaque shield.
    const wireGeometry = fx.geometries.captureWire ??= new THREE.TorusGeometry(1, .009, 4, 64)
    const bands = []
    for (let i = 0; i < 7; i++) {
      const ring = mesh(wireGeometry, color, net)
      const latitude = -.85 + i * 1.7 / 6
      ring.rotation.x = Math.PI / 2
      ring.position.y = latitude
      ring.scale.setScalar(Math.sqrt(1 - latitude * latitude))
      bands.push(ring)
    }
    for (let i = 0; i < 6; i++) {
      const ring = mesh(wireGeometry, color, net)
      ring.rotation.y = i * Math.PI / 6
      bands.push(ring)
    }
    const halo = mesh(new THREE.RingGeometry(.94, 1, 64), color)
    halo.rotation.x = -Math.PI / 2.6
    const scan = mesh(new THREE.TorusGeometry(1, .023, 6, 64), 0xe0ffff)
    scan.rotation.x = Math.PI / 2
    const core = mesh(fx.geometries.shard, color)
    const glow = fx.sprite(fx.textures.glow, color, height)
    group.add(glow)
    const throwTrail = Array.from({ length: 12 }, () => {
      const mote = fx.sprite(fx.textures.spark, color, height * .09)
      group.add(mote)
      return mote
    })
    const shards = Array.from({ length: 28 }, (_, i) => {
      const part = mesh(i % 3 ? fx.geometries.cube : fx.geometries.shard, resultColor)
      part.scale.setScalar(height * (.025 + (i % 3) * .012))
      return part
    })
    const seal = new THREE.Group()
    group.add(seal)
    const sealRing = mesh(new THREE.TorusGeometry(1, .02, 6, 6), resultColor, seal)
    const badge = new THREE.Mesh(new THREE.CircleGeometry(.72, 6), new THREE.MeshBasicMaterial({
      color: event.success ? 0x073328 : 0x471d19, transparent: true, opacity: 0, depthWrite: false,
    }))
    badge.rotation.z = Math.PI / 6
    seal.add(badge)
    const strokes = (event.success ? [[[-.38, .02], [-.1, -.28]], [[-.1, -.28], [.4, .32]]]
      : [[[-.27, -.27], [.27, .27]], [[-.27, .27], [.27, -.27]]]).map(([a, b]) => {
      const from = new THREE.Vector3(...a, .04), to = new THREE.Vector3(...b, .04)
      const line = new THREE.Mesh(new THREE.CylinderGeometry(.037, .037, from.distanceTo(to), 6),
        new THREE.MeshBasicMaterial({ color: resultColor, transparent: true, opacity: 0, depthWrite: false }))
      line.position.copy(from).add(to).multiplyScalar(.5)
      line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.sub(from).normalize())
      seal.add(line)
      return line
    })
    const resultRings = Array.from({ length: 2 }, () => mesh(new THREE.RingGeometry(.96, 1, 64), resultColor))
    const launch = new THREE.Vector3(), destination = new THREE.Vector3()

    return fx.add({ group, start: event.startedAt, duration: CAPTURE_TOTAL_MS / event.speed,
      update: p => {
        const ms = p * CAPTURE_TOTAL_MS
        group.position.copy(target())
        destination.set(0, center, 0)
        launch.copy(origin()).sub(group.position)
        const bind = captureEase((ms - CAPTURE_BIND_MS) / 300)
        const contract = captureEase((ms - 1050) / (CAPTURE_CONTAIN_MS - 1050))
        const result = clamp((ms - CAPTURE_RESULT_MS) / (CAPTURE_TOTAL_MS - CAPTURE_RESULT_MS))
        const decided = ms >= CAPTURE_RESULT_MS
        const tail = 1 - captureEase((result - .7) / .3)
        const pulse = Math.exp(-(((ms - 1530) / 70) ** 2)) + Math.exp(-(((ms - 1830) / 70) ** 2))
        net.position.copy(destination)
        net.rotation.y = ms * .001
        const netScale = (1 - contract * .8) * (1 + pulse * .15)
        net.scale.set(radius * netScale, height * .58 * netScale, radius * netScale)
        net.visible = ms >= CAPTURE_BIND_MS
        if (decided) net.scale.multiplyScalar(event.success ? 1 - captureEase(result * 2) : 1 + result * 5)
        for (const ring of bands) {
          ring.material.color.setHex(decided ? resultColor : color)
          ring.material.opacity = decided ? (1 - clamp(result * 3)) * .85 : bind * (.6 + pulse * .4)
        }
        halo.position.set(0, .025, .06)
        halo.scale.setScalar(radius * (1 + pulse * .1))
        halo.rotation.z = -ms * .0015
        halo.material.opacity = bind * (decided ? 1 - result : .65)
        scan.visible = ms >= CAPTURE_BIND_MS && ms < CAPTURE_CONTAIN_MS
        scan.position.set(0, height * (1 - clamp((ms - CAPTURE_BIND_MS) / 950)), 0)
        scan.scale.setScalar(radius * (.95 - contract * .7))
        scan.material.opacity = .9 * bind
        const travel = clamp(ms / CAPTURE_BIND_MS)
        core.position.copy(launch).lerp(destination, captureEase(travel))
        core.position.y += Math.sin(travel * Math.PI) * height * .7
        core.rotation.set(ms * .003, ms * .004, Math.PI / 4)
        core.scale.setScalar(height * (ms < CAPTURE_BIND_MS ? .055 : .08 + contract * .08 + pulse * .015))
        core.material.color.setHex(decided ? resultColor : color)
        core.material.opacity = (ms < CAPTURE_BIND_MS ? 1 : contract) * (decided && !event.success ? 1 - clamp(result * 4) : tail)
        if (decided && event.success) core.position.lerp(launch, captureEase((result - .32) / .6))
        glow.position.copy(core.position)
        glow.scale.setScalar(height * (.35 + contract * .35 + pulse * .16 + (decided ? Math.sin(result * Math.PI) * .45 : 0)))
        glow.material.color.copy(core.material.color)
        glow.material.opacity = core.material.opacity * .6
        throwTrail.forEach((mote, i) => {
          const t = clamp(travel - i * .025)
          mote.position.copy(launch).lerp(destination, captureEase(t))
          mote.position.y += Math.sin(t * Math.PI) * height * .7
          mote.material.opacity = ms < CAPTURE_BIND_MS && t > 0 ? (1 - i / 12) * .6 : 0
        })
        seal.visible = decided
        seal.position.copy(destination).add(new THREE.Vector3(0, height * .17, radius * .25))
        seal.scale.setScalar(height * (.25 + captureEase(result * 5) * .12))
        sealRing.rotation.z = event.success ? Math.PI / 6 : -result * .7
        sealRing.material.opacity = tail * captureEase(result * 8)
        badge.material.opacity = sealRing.material.opacity * .9
        for (const line of strokes) line.material.opacity = sealRing.material.opacity
        resultRings.forEach((ring, i) => {
          const t = clamp(result * 1.6 - i * .18)
          ring.position.copy(destination)
          ring.scale.setScalar(height * (.18 + t * .75))
          ring.material.opacity = decided && t > 0 ? (1 - t) * .8 : 0
        })
        shards.forEach((part, i) => {
          const angle = i * 2.39996
          if (event.success) {
            const t = clamp(result * 1.25 - (i % 7) * .025)
            part.position.copy(destination).lerp(launch, captureEase(t))
            const spiral = height * Math.sin(t * Math.PI) * .3
            part.position.add(new THREE.Vector3(Math.cos(angle + t * TAU) * spiral, Math.sin(angle + t * TAU) * spiral, .1))
          } else {
            const spread = radius * (.18 + result * (1 + (i % 7) * .13))
            part.position.set(Math.cos(angle) * spread, center + Math.sin(angle) * spread * .8 - result * result * height * .3, Math.sin(i * 8) * spread * .35)
          }
          part.rotation.set(angle + result * 5, result * 7, angle)
          part.material.opacity = decided ? Math.sin(Math.PI * clamp(result * 1.15)) * tail : 0
        })
      },
    })
  }
}
