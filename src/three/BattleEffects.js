// 3D battle effects: casting auras, attribute projectiles, impacts, misses, damage numbers,
// defeat bursts and evolution light.
// Every effect is built from shared geometries/textures and removes itself when finished.
import * as THREE from 'three'
import { clamp01 } from './battle3dMath.js'
import { damageTextFrame, placeDamageText } from '../battle/damageFeedback.js'
import { createDamageTextCanvas } from './damageText.js'
import { createEvolutionMotif, sampleProgramRebuild } from './evolutionMotifs.js'
import { EXPANSION_EVOLUTION_SIGNATURES } from '../data/expansionEvolutionCinematics.js'

const TAU = Math.PI * 2
const easeOut = (t) => 1 - (1 - t) ** 3
const fadeTail = (t, from = 0.65) => (t < from ? 1 : 1 - (t - from) / (1 - from))

// Deterministic per-effect randomness keeps effects varied without Math.random in update loops.
function seeded(seed) {
  let value = seed >>> 0 || 1
  return () => {
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    return ((value >>> 0) % 100000) / 100000
  }
}

function canvasTexture(size, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  draw(canvas.getContext('2d'), size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeTextures() {
  const glow = canvasTexture(64, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    r.addColorStop(0, '#ffffff'); r.addColorStop(0.2, '#ffffffe6'); r.addColorStop(0.5, '#ffffff60'); r.addColorStop(1, '#ffffff00')
    g.fillStyle = r; g.fillRect(0, 0, s, s)
  })
  const spark = canvasTexture(64, (g, s) => {
    const c = s / 2
    const r = g.createRadialGradient(c, c, 0, c, c, c * 0.35)
    r.addColorStop(0, '#ffffff'); r.addColorStop(1, '#ffffff00')
    g.fillStyle = r; g.fillRect(0, 0, s, s)
    g.globalCompositeOperation = 'lighter'
    for (const angle of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]) {
      g.save(); g.translate(c, c); g.rotate(angle)
      const w = angle % (Math.PI / 2) === 0 ? 3 : 1.5
      const l = g.createLinearGradient(-c, 0, c, 0)
      l.addColorStop(0, '#ffffff00'); l.addColorStop(0.5, '#ffffff'); l.addColorStop(1, '#ffffff00')
      g.fillStyle = l; g.fillRect(-c, -w / 2, s, w); g.restore()
    }
  })
  const smoke = canvasTexture(64, (g, s) => {
    const random = seeded(7)
    for (let i = 0; i < 14; i++) {
      const x = s * (0.3 + random() * 0.4), y = s * (0.3 + random() * 0.4), r = s * (0.12 + random() * 0.18)
      const gradient = g.createRadialGradient(x, y, 0, x, y, r)
      gradient.addColorStop(0, '#ffffff38'); gradient.addColorStop(1, '#ffffff00')
      g.fillStyle = gradient; g.fillRect(0, 0, s, s)
    }
  })
  const leaf = canvasTexture(64, (g, s) => {
    g.translate(s / 2, s / 2); g.rotate(-0.6)
    g.fillStyle = '#ffffff'
    g.beginPath(); g.moveTo(0, -s * 0.42); g.quadraticCurveTo(s * 0.3, 0, 0, s * 0.42); g.quadraticCurveTo(-s * 0.3, 0, 0, -s * 0.42); g.fill()
    g.strokeStyle = '#00000055'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -s * 0.38); g.lineTo(0, s * 0.38); g.stroke()
  })
  const ring = canvasTexture(128, (g, s) => {
    const c = s / 2
    const r = g.createRadialGradient(c, c, c * 0.55, c, c, c)
    r.addColorStop(0, '#ffffff00'); r.addColorStop(0.72, '#ffffffcc'); r.addColorStop(0.82, '#ffffff'); r.addColorStop(1, '#ffffff00')
    g.fillStyle = r; g.fillRect(0, 0, s, s)
  })
  // Soft vertical light shaft: bright core across the width, fading toward the top.
  const beam = canvasTexture(64, (g, s) => {
    const across = g.createLinearGradient(0, 0, s, 0)
    across.addColorStop(0, '#ffffff00'); across.addColorStop(0.5, '#ffffff'); across.addColorStop(1, '#ffffff00')
    g.fillStyle = across; g.fillRect(0, 0, s, s)
    g.globalCompositeOperation = 'destination-in'
    const up = g.createLinearGradient(0, 0, 0, s)
    up.addColorStop(0, '#ffffff00'); up.addColorStop(0.35, '#ffffff99'); up.addColorStop(1, '#ffffff')
    g.fillStyle = up; g.fillRect(0, 0, s, s)
  })
  return { glow, spark, smoke, leaf, ring, beam }
}

// Per-attribute palette and shapes.
export const EFFECT_KINDS = Object.freeze({
  fire: { color: 0xff6a1a, core: 0xfff0a0, secondary: 0xff2a00 },
  ice: { color: 0x55d8ff, core: 0xeaffff, secondary: 0x2a7bff },
  electric: { color: 0xffe14a, core: 0xffffff, secondary: 0x7ad8ff },
  dark: { color: 0x9a4dff, core: 0xf0c8ff, secondary: 0x2a0a44 },
  light: { color: 0xfff1a8, core: 0xffffff, secondary: 0xffd35a },
  nature: { color: 0x5cf29a, core: 0xe0ffe8, secondary: 0x2f9a3a },
  earth: { color: 0xd9a066, core: 0xffe6b0, secondary: 0x7a4a24 },
  energy: { color: 0x5fb8ff, core: 0xe8f6ff, secondary: 0x2a5cff },
  physical: { color: 0xffffff, core: 0xffffff, secondary: 0xffc35a },
})

export class BattleEffects {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    this.effects = []
    this.textures = makeTextures()
    this.geometries = {
      sphere: new THREE.IcosahedronGeometry(1, 2),
      shard: new THREE.OctahedronGeometry(1, 0),
      spike: new THREE.ConeGeometry(0.35, 1, 5, 1, false).translate(0, 0.5, 0),
      rock: new THREE.DodecahedronGeometry(1, 0),
      knot: new THREE.TorusKnotGeometry(0.55, 0.16, 64, 8),
      torus: new THREE.TorusGeometry(1, 0.06, 8, 48),
      plane: new THREE.PlaneGeometry(1, 1),
      arc: new THREE.RingGeometry(0.78, 1, 40, 1, 0, Math.PI * 1.25),
      cylinder: new THREE.CylinderGeometry(1, 1, 1, 24, 1, true).translate(0, 0.5, 0),
      cube: new THREE.BoxGeometry(1, 1, 1),
    }
    this.shake = 0
    this.serial = 1
  }

  get count() { return this.effects.length }

  // ---------- building blocks ----------
  additive(color, opacity = 1, map = null) {
    return new THREE.MeshBasicMaterial({ color, map, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  }

  sprite(texture, color, size, blending = THREE.AdditiveBlending) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color, transparent: true, depthWrite: false, blending }))
    sprite.scale.setScalar(size)
    return sprite
  }

  // A small particle pool rendered as sprites (few dozen per effect).
  particles(group, count, { texture, color, size, blending = THREE.AdditiveBlending, colors }) {
    const list = []
    for (let i = 0; i < count; i++) {
      const sprite = this.sprite(texture, colors ? colors[i % colors.length] : color, size, blending)
      group.add(sprite)
      list.push({ sprite, velocity: new THREE.Vector3(), origin: new THREE.Vector3(), life: 1, delay: 0, spin: 0, size })
    }
    return list
  }

  // Camera-facing ribbon through points (lightning, beams).
  ribbon(points, width, material) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points.length * 2 * 3), 3))
    const index = []
    for (let i = 0; i < points.length - 1; i++) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
    geometry.setIndex(index)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    mesh.userData.width = width
    this.updateRibbon(mesh, points)
    return mesh
  }

  updateRibbon(mesh, points) {
    const position = mesh.geometry.attributes.position
    const view = new THREE.Vector3()
    this.camera.getWorldDirection(view)
    const side = new THREE.Vector3()
    for (let i = 0; i < points.length; i++) {
      const next = points[Math.min(i + 1, points.length - 1)]
      const previous = points[Math.max(i - 1, 0)]
      side.subVectors(next, previous).cross(view).normalize().multiplyScalar(mesh.userData.width * (i === 0 || i === points.length - 1 ? 0.35 : 1))
      position.setXYZ(i * 2, points[i].x + side.x, points[i].y + side.y, points[i].z + side.z)
      position.setXYZ(i * 2 + 1, points[i].x - side.x, points[i].y - side.y, points[i].z - side.z)
    }
    position.needsUpdate = true
    mesh.geometry.computeBoundingSphere()
  }

  zigzag(from, to, segments, jitter, random) {
    const points = []
    const axis = new THREE.Vector3().subVectors(to, from)
    const normalA = new THREE.Vector3(-axis.y, axis.x, 0).normalize()
    const normalB = new THREE.Vector3().crossVectors(axis, normalA).normalize()
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const point = from.clone().lerp(to, t)
      if (i > 0 && i < segments) {
        const amount = jitter * Math.sin(t * Math.PI)
        point.addScaledVector(normalA, (random() - 0.5) * 2 * amount).addScaledVector(normalB, (random() - 0.5) * 2 * amount)
      }
      points.push(point)
    }
    return points
  }

  add(effect) {
    this.scene.add(effect.group)
    this.effects.push(effect)
    return effect
  }

  // ---------- public API ----------
  // Charging aura at the caster before a projectile leaves.
  cast(position, style, start, duration, scale = 1) {
    const palette = EFFECT_KINDS[style.kind] || EFFECT_KINDS.energy
    const group = new THREE.Group()
    group.position.copy(position)
    const ring = new THREE.Mesh(this.geometries.plane, this.additive(palette.color, 0.9, this.textures.ring))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = -position.y + 0.03
    group.add(ring)
    const core = this.sprite(this.textures.glow, palette.core, 0.4 * scale)
    group.add(core)
    const random = seeded(this.serial++ * 7919)
    const motes = this.particles(group, 16, { texture: this.textures.spark, color: palette.color, size: 0.16 * scale })
    for (const mote of motes) {
      const angle = random() * TAU, radius = (0.7 + random() * 0.5) * scale
      mote.origin.set(Math.cos(angle) * radius, (random() - 0.3) * scale, Math.sin(angle) * radius)
      mote.delay = random() * 0.35
    }
    return this.add({
      group, start, duration,
      update: (p) => {
        ring.scale.setScalar((0.6 + easeOut(p) * 1.4) * scale)
        ring.material.opacity = 0.85 * fadeTail(p, 0.5)
        ring.rotation.z = p * 3
        core.scale.setScalar((0.3 + Math.sin(p * Math.PI) * 0.7) * scale)
        core.material.opacity = Math.sin(p * Math.PI)
        for (const mote of motes) {
          const t = clamp01((p - mote.delay) / (1 - mote.delay))
          mote.sprite.position.copy(mote.origin).multiplyScalar(1 - easeOut(t))
          mote.sprite.material.opacity = t > 0 ? Math.sin(t * Math.PI) : 0
        }
      },
    })
  }

  projectile(from, to, style, start, duration, { critical = false } = {}) {
    const kind = style.kind in EFFECT_KINDS ? style.kind : 'energy'
    const palette = EFFECT_KINDS[kind]
    // Projectiles read at battle distance only when they are roughly a third of a rookie's height.
    const scale = (critical ? 1.35 : 1) * 1.8
    const group = new THREE.Group()
    const head = new THREE.Group()
    group.add(head)
    const random = seeded(this.serial++ * 104729)
    const glow = this.sprite(this.textures.glow, palette.color, 1.2 * scale)
    head.add(glow)
    const parts = { spin: [] }
    if (kind === 'fire') {
      const core = new THREE.Mesh(this.geometries.sphere, this.additive(palette.core, 0.95))
      core.scale.setScalar(0.18 * scale); head.add(core)
      const shell = new THREE.Mesh(this.geometries.sphere, this.additive(palette.color, 0.55))
      shell.scale.setScalar(0.3 * scale); head.add(shell); parts.pulse = shell
    } else if (kind === 'ice') {
      for (let i = 0; i < 5; i++) {
        const shard = new THREE.Mesh(this.geometries.shard, new THREE.MeshStandardMaterial({ color: palette.core, emissive: palette.color, emissiveIntensity: 0.9, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.92 }))
        shard.scale.set(0.07, 0.24, 0.07).multiplyScalar(scale)
        shard.position.set((random() - 0.5) * 0.2, (random() - 0.5) * 0.2, (random() - 0.5) * 0.2)
        shard.rotation.set(random() * TAU, random() * TAU, random() * TAU)
        head.add(shard); parts.spin.push(shard)
      }
    } else if (kind === 'electric') {
      const orb = new THREE.Mesh(this.geometries.sphere, this.additive(palette.core, 0.95))
      orb.scale.setScalar(0.13 * scale); head.add(orb)
      parts.bolt = this.ribbon(this.zigzag(from, from.clone().add(new THREE.Vector3(0.01, 0, 0)), 12, 0.2, random), 0.05 * scale, this.additive(palette.core, 1))
      group.add(parts.bolt)
      parts.boltGlow = this.ribbon(this.zigzag(from, from.clone().add(new THREE.Vector3(0.01, 0, 0)), 12, 0.2, random), 0.16 * scale, this.additive(palette.color, 0.45))
      group.add(parts.boltGlow)
    } else if (kind === 'dark') {
      const knot = new THREE.Mesh(this.geometries.knot, this.additive(palette.color, 0.85))
      knot.scale.setScalar(0.2 * scale); head.add(knot); parts.spin.push(knot)
      const orbiters = []
      for (let i = 0; i < 3; i++) { const orb = this.sprite(this.textures.glow, palette.core, 0.18 * scale); head.add(orb); orbiters.push(orb) }
      parts.orbiters = orbiters
    } else if (kind === 'light') {
      parts.beam = new THREE.Mesh(this.geometries.cylinder, this.additive(palette.color, 0.55))
      group.add(parts.beam)
      const star = this.sprite(this.textures.spark, palette.core, 0.9 * scale); head.add(star); parts.star = star
    } else if (kind === 'nature') {
      const orb = new THREE.Mesh(this.geometries.sphere, this.additive(palette.color, 0.8))
      orb.scale.setScalar(0.12 * scale); head.add(orb)
      const leaves = this.particles(head, 8, { texture: this.textures.leaf, colors: [palette.color, palette.secondary, 0xb8ff6a], size: 0.2 * scale, blending: THREE.NormalBlending })
      leaves.forEach((leaf, i) => { leaf.spin = (i / leaves.length) * TAU; leaf.origin.set(0.2 + random() * 0.12, (random() - 0.5) * 0.2, 0) })
      parts.leaves = leaves
    } else if (kind === 'earth') {
      for (let i = 0; i < 4; i++) {
        const rock = new THREE.Mesh(this.geometries.rock, new THREE.MeshStandardMaterial({ color: palette.secondary, emissive: palette.color, emissiveIntensity: 0.25, roughness: 0.9, flatShading: true }))
        rock.scale.setScalar((i === 0 ? 0.16 : 0.07) * scale)
        rock.position.set(i ? (random() - 0.5) * 0.35 : 0, i ? (random() - 0.5) * 0.25 : 0, i ? (random() - 0.5) * 0.3 : 0)
        head.add(rock); parts.spin.push(rock)
      }
    } else {
      const core = new THREE.Mesh(this.geometries.sphere, this.additive(palette.core, 0.95))
      core.scale.setScalar(0.14 * scale); head.add(core)
      const rings = [0, 1].map((i) => { const torus = new THREE.Mesh(this.geometries.torus, this.additive(palette.color, 0.8)); torus.scale.setScalar(0.24 * scale); torus.rotation.x = i ? Math.PI / 2 : 0; head.add(torus); return torus })
      parts.spin.push(...rings)
    }
    // Trail: smoke for fire/dark/earth, sparkles otherwise.
    const trailTexture = kind === 'fire' || kind === 'dark' || kind === 'earth' ? this.textures.smoke : this.textures.spark
    const trailBlend = kind === 'dark' || kind === 'earth' ? THREE.NormalBlending : THREE.AdditiveBlending
    const trailColor = kind === 'earth' ? palette.color : kind === 'dark' ? palette.secondary : palette.color
    const trail = this.particles(group, 16, { texture: trailTexture, color: trailColor, size: (kind === 'fire' ? 0.42 : 0.22) * scale, blending: trailBlend })
    trail.forEach((particle, i) => { particle.delay = i / trail.length; particle.origin.set((random() - 0.5) * 0.12, (random() - 0.5) * 0.12, (random() - 0.5) * 0.12) })
    const arcHeight = kind === 'earth' ? 0.9 : kind === 'light' || kind === 'electric' ? 0.05 : 0.4
    const pathPoint = (t, target) => target.lerpVectors(from, to, t).setY(from.y + (to.y - from.y) * t + Math.sin(t * Math.PI) * arcHeight)
    return this.add({
      group, start, duration,
      update: (p, dt, now) => {
        const travel = clamp01((p - 0.1) / 0.9)
        pathPoint(easeOut(travel) * 0.85 + travel * 0.15, head.position)
        head.visible = p >= 0.1
        const appear = Math.min(1, p * 10)
        glow.material.opacity = appear * (0.75 + Math.sin(now * 0.03) * 0.25)
        for (const mesh of parts.spin) { mesh.rotation.x += dt * 7; mesh.rotation.y += dt * 9 }
        if (parts.pulse) parts.pulse.scale.setScalar((0.28 + Math.sin(now * 0.04) * 0.05) * scale)
        if (parts.orbiters) parts.orbiters.forEach((orb, i) => { const a = now * 0.012 + (i * TAU) / 3; orb.position.set(Math.cos(a) * 0.3 * scale, Math.sin(a * 1.3) * 0.1, Math.sin(a) * 0.3 * scale) })
        if (parts.leaves) parts.leaves.forEach((leaf) => { const a = leaf.spin + now * 0.015; leaf.sprite.position.set(Math.cos(a) * leaf.origin.x, leaf.origin.y + Math.sin(a * 2) * 0.05, Math.sin(a) * leaf.origin.x); leaf.sprite.material.rotation = a * 2 })
        if (parts.bolt) {
          const points = this.zigzag(from, head.position, 12, 0.22 * scale, random)
          this.updateRibbon(parts.bolt, points); this.updateRibbon(parts.boltGlow, points)
          const flicker = head.visible ? (Math.sin(now * 0.09) > -0.4 ? 1 : 0.25) : 0
          parts.bolt.material.opacity = flicker; parts.boltGlow.material.opacity = flicker * 0.45
        }
        if (parts.beam) {
          const length = head.position.distanceTo(from)
          parts.beam.position.copy(from)
          parts.beam.scale.set(0.07 * scale, Math.max(0.001, length), 0.07 * scale)
          parts.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), head.position.clone().sub(from).normalize())
          parts.beam.material.opacity = head.visible ? 0.45 + Math.sin(now * 0.05) * 0.15 : 0
          parts.star.material.rotation = now * 0.006
        }
        for (const particle of trail) {
          const t = travel - particle.delay * 0.25
          if (t <= 0 || !head.visible) { particle.sprite.material.opacity = 0; continue }
          pathPoint(easeOut(t) * 0.85 + t * 0.15, particle.sprite.position).add(particle.origin)
          particle.sprite.material.opacity = (1 - particle.delay) * 0.8 * appear
          particle.sprite.scale.setScalar(particle.size * (1 - particle.delay * 0.6))
        }
      },
    })
  }

  impact(position, style, start, duration, { critical = false, physical = false, groundY = 0, height = 1 } = {}) {
    const kind = physical ? 'physical' : style.kind in EFFECT_KINDS ? style.kind : 'energy'
    const palette = physical ? { ...EFFECT_KINDS.physical, color: style.color ?? 0xffffff } : EFFECT_KINDS[kind]
    const scale = (critical ? 1.45 : 1) * THREE.MathUtils.clamp(height, 0.7, 2.2) * 0.8
    const group = new THREE.Group()
    group.position.copy(position)
    const random = seeded(this.serial++ * 1299709)
    const flash = this.sprite(this.textures.glow, palette.core, 1.6 * scale)
    group.add(flash)
    const wave = new THREE.Mesh(this.geometries.plane, this.additive(palette.color, 0.9, this.textures.ring))
    wave.quaternion.copy(this.camera.quaternion)
    group.add(wave)
    const ground = new THREE.Mesh(this.geometries.plane, this.additive(palette.color, 0.7, this.textures.ring))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = groundY - position.y + 0.03
    group.add(ground)
    const burst = this.particles(group, critical ? 34 : 24, { texture: this.textures.spark, colors: [palette.color, palette.core, palette.secondary], size: 0.18 * scale })
    burst.forEach((particle, i) => {
      const angle = (i / burst.length) * TAU + random() * 0.4
      const lift = kind === 'fire' ? 0.6 + random() : (random() - 0.35) * 1.4
      particle.velocity.set(Math.cos(angle), lift, Math.sin(angle)).normalize().multiplyScalar((1.4 + random() * 1.6) * scale)
      particle.delay = random() * 0.12
    })
    const extras = []
    if (physical) {
      for (let i = 0; i < (critical ? 3 : 2); i++) {
        const slash = new THREE.Mesh(this.geometries.arc, this.additive(0xffffff, 1))
        slash.quaternion.copy(this.camera.quaternion)
        slash.rotateZ(-0.8 + i * 1.3 + random() * 0.3)
        slash.userData.delay = i * 0.08
        group.add(slash); extras.push({ type: 'slash', mesh: slash })
      }
    }
    if (kind === 'fire') {
      const ball = new THREE.Mesh(this.geometries.sphere, this.additive(palette.color, 0.8))
      group.add(ball); extras.push({ type: 'expand', mesh: ball, to: 0.75 * scale })
      const inner = new THREE.Mesh(this.geometries.sphere, this.additive(palette.core, 0.9))
      group.add(inner); extras.push({ type: 'expand', mesh: inner, to: 0.45 * scale })
      const smoke = this.particles(group, 10, { texture: this.textures.smoke, color: 0x3a2a22, size: 0.6 * scale, blending: THREE.NormalBlending })
      smoke.forEach((puff) => { puff.velocity.set((random() - 0.5) * 0.6, 0.8 + random() * 0.6, (random() - 0.5) * 0.6).multiplyScalar(scale); puff.delay = 0.15 + random() * 0.15 })
      extras.push({ type: 'rise', list: smoke })
    } else if (kind === 'ice') {
      for (let i = 0; i < 7; i++) {
        const spike = new THREE.Mesh(this.geometries.spike, new THREE.MeshStandardMaterial({ color: palette.core, emissive: palette.color, emissiveIntensity: 0.7, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.95 }))
        const angle = (i / 7) * TAU + random() * 0.5
        spike.position.set(Math.cos(angle) * 0.35 * scale, groundY - position.y, Math.sin(angle) * 0.35 * scale)
        spike.rotation.set(Math.sin(angle) * 0.5, 0, -Math.cos(angle) * 0.5)
        spike.userData.size = (0.35 + random() * 0.4) * scale
        group.add(spike); extras.push({ type: 'spike', mesh: spike, delay: random() * 0.12 })
      }
    } else if (kind === 'electric') {
      for (let i = 0; i < 4; i++) {
        const top = new THREE.Vector3((random() - 0.5) * 1.2 * scale, 2.6 * scale, (random() - 0.5) * 0.6)
        const bottom = new THREE.Vector3((random() - 0.5) * 0.3, -0.1, (random() - 0.5) * 0.3)
        const bolt = this.ribbon(this.zigzag(top, bottom, 12, 0.35 * scale, random), 0.06 * scale, this.additive(palette.core, 1))
        const glowBolt = this.ribbon(this.zigzag(top, bottom, 12, 0.35 * scale, random), 0.18 * scale, this.additive(palette.color, 0.5))
        group.add(bolt, glowBolt); extras.push({ type: 'bolt', meshes: [bolt, glowBolt], top, bottom, delay: i * 0.07 })
      }
    } else if (kind === 'dark') {
      for (let i = 0; i < 3; i++) {
        const vortex = new THREE.Mesh(this.geometries.torus, this.additive(i === 1 ? palette.core : palette.color, 0.85))
        vortex.rotation.x = Math.PI / 2 + (random() - 0.5) * 0.6
        group.add(vortex); extras.push({ type: 'implode', mesh: vortex, from: (0.9 + i * 0.3) * scale, delay: i * 0.06 })
      }
      const smoke = this.particles(group, 12, { texture: this.textures.smoke, color: palette.secondary, size: 0.7 * scale, blending: THREE.NormalBlending })
      smoke.forEach((puff) => { puff.velocity.set((random() - 0.5) * 1.2, (random() - 0.2) * 0.8, (random() - 0.5) * 1.2).multiplyScalar(scale) })
      extras.push({ type: 'rise', list: smoke })
    } else if (kind === 'light') {
      const pillar = new THREE.Mesh(this.geometries.cylinder, this.additive(palette.color, 0.6))
      pillar.position.y = groundY - position.y
      group.add(pillar); extras.push({ type: 'pillar', mesh: pillar, radius: 0.45 * scale, height: 4 * scale })
      const star = this.sprite(this.textures.spark, palette.core, 2.2 * scale)
      group.add(star); extras.push({ type: 'star', sprite: star })
    } else if (kind === 'nature') {
      const leaves = this.particles(group, 22, { texture: this.textures.leaf, colors: [palette.color, palette.secondary, 0xc6ff6a], size: 0.36 * scale, blending: THREE.NormalBlending })
      leaves.forEach((leaf, i) => { const a = (i / leaves.length) * TAU; leaf.velocity.set(Math.cos(a), 0.4 + random() * 0.8, Math.sin(a)).multiplyScalar((1 + random()) * scale); leaf.spin = (random() - 0.5) * 12 })
      extras.push({ type: 'leaves', list: leaves })
    } else if (kind === 'earth') {
      for (let i = 0; i < 8; i++) {
        const rock = new THREE.Mesh(this.geometries.rock, new THREE.MeshStandardMaterial({ color: palette.secondary, emissive: palette.color, emissiveIntensity: 0.2, roughness: 0.95, flatShading: true }))
        const angle = (i / 8) * TAU + random() * 0.4
        rock.userData.velocity = new THREE.Vector3(Math.cos(angle) * (0.8 + random()), 2.2 + random() * 1.4, Math.sin(angle) * (0.8 + random())).multiplyScalar(scale)
        rock.userData.spin = new THREE.Vector3(random() * 8, random() * 8, random() * 8)
        rock.scale.setScalar((0.08 + random() * 0.1) * scale)
        rock.position.set(0, groundY - position.y + 0.05, 0)
        group.add(rock); extras.push({ type: 'rock', mesh: rock })
      }
      const dust = this.particles(group, 10, { texture: this.textures.smoke, color: palette.color, size: 0.8 * scale, blending: THREE.NormalBlending })
      dust.forEach((puff) => { puff.velocity.set((random() - 0.5) * 1.6, 0.3 + random() * 0.4, (random() - 0.5) * 1.6).multiplyScalar(scale); puff.origin.set(0, groundY - position.y + 0.1, 0) })
      extras.push({ type: 'rise', list: dust })
    }
    this.shake = Math.max(this.shake, critical ? 0.16 : physical ? 0.08 : 0.06)
    const gravity = new THREE.Vector3(0, -3.2, 0)
    return this.add({
      group, start, duration,
      update: (p, dt) => {
        const fade = Math.pow(1 - p, 1.5)
        flash.scale.setScalar((0.8 + easeOut(Math.min(1, p * 3)) * 1.8) * scale)
        flash.material.opacity = Math.max(0, 1 - p * 2.6)
        wave.scale.setScalar((0.3 + easeOut(p) * 2.6) * scale)
        wave.material.opacity = 0.9 * fade
        ground.scale.setScalar((0.4 + easeOut(p) * 2.4) * scale)
        ground.material.opacity = 0.65 * fade
        for (const particle of burst) {
          const t = Math.max(0, p - particle.delay)
          particle.sprite.position.copy(particle.velocity).multiplyScalar(t).addScaledVector(gravity, t * t * 0.5)
          particle.sprite.material.opacity = t > 0 ? fade : 0
        }
        for (const extra of extras) {
          if (extra.type === 'slash') {
            const t = clamp01((p - extra.mesh.userData.delay) / 0.35)
            extra.mesh.scale.setScalar((0.35 + easeOut(t) * 0.55) * scale)
            extra.mesh.material.opacity = t > 0 ? Math.max(0, 1 - t) : 0
            extra.mesh.rotateZ(dt * 5)
          } else if (extra.type === 'expand') {
            extra.mesh.scale.setScalar(Math.max(0.001, easeOut(Math.min(1, p * 2.2)) * extra.to))
            extra.mesh.material.opacity = 0.85 * Math.max(0, 1 - p * 1.6)
          } else if (extra.type === 'rise' || extra.type === 'leaves') {
            for (const puff of extra.list) {
              const t = Math.max(0, p - puff.delay)
              puff.sprite.position.copy(puff.origin).addScaledVector(puff.velocity, t)
              if (extra.type === 'leaves') { puff.sprite.position.addScaledVector(gravity, t * t * 0.15); puff.sprite.material.rotation += dt * puff.spin }
              puff.sprite.scale.setScalar(puff.size * (1 + t * (extra.type === 'rise' ? 1.4 : 0)))
              puff.sprite.material.opacity = t > 0 ? fade * (extra.type === 'rise' ? 0.75 : 1) : 0
            }
          } else if (extra.type === 'spike') {
            const t = clamp01((p - extra.delay) / 0.2)
            extra.mesh.scale.set(extra.mesh.userData.size * 0.5, Math.max(0.001, easeOut(t) * extra.mesh.userData.size * 1.6), extra.mesh.userData.size * 0.5)
            extra.mesh.material.opacity = 0.95 * fadeTail(p, 0.6)
          } else if (extra.type === 'bolt') {
            const visible = p > extra.delay && p < extra.delay + 0.45
            if (visible && Math.floor(p * 40) % 2 === 0) {
              const points = this.zigzag(extra.top, extra.bottom, 12, 0.35 * scale, random)
              for (const mesh of extra.meshes) this.updateRibbon(mesh, points)
            }
            extra.meshes[0].material.opacity = visible ? 1 : 0
            extra.meshes[1].material.opacity = visible ? 0.5 : 0
          } else if (extra.type === 'implode') {
            const t = clamp01((p - extra.delay) / 0.7)
            extra.mesh.scale.setScalar(Math.max(0.001, extra.from * (1 - easeOut(t))))
            extra.mesh.rotation.z += dt * 9
            extra.mesh.material.opacity = t > 0 ? 0.85 * (1 - t) : 0
          } else if (extra.type === 'pillar') {
            const grow = easeOut(Math.min(1, p * 3))
            extra.mesh.scale.set(extra.radius * (1 - p * 0.6), extra.height * grow, extra.radius * (1 - p * 0.6))
            extra.mesh.material.opacity = 0.6 * fade
          } else if (extra.type === 'star') {
            extra.sprite.material.rotation += dt * 2
            extra.sprite.material.opacity = Math.max(0, 1 - p * 1.8)
          } else if (extra.type === 'rock') {
            const t = p * duration / 1000
            extra.mesh.position.copy(extra.mesh.userData.velocity).multiplyScalar(t).addScaledVector(gravity, t * t * 1.5)
            extra.mesh.position.y = Math.max(groundY - position.y, extra.mesh.position.y + groundY - position.y + 0.05)
            extra.mesh.rotation.x += dt * extra.mesh.userData.spin.x
            extra.mesh.rotation.y += dt * extra.mesh.userData.spin.y
            extra.mesh.visible = p < 0.92
          }
        }
      },
    })
  }

  // Dodge: a swish of air streaks where the attack passed.
  miss(position, start, duration, direction = 1) {
    const group = new THREE.Group()
    group.position.copy(position)
    const streaks = []
    for (let i = 0; i < 4; i++) {
      const streak = new THREE.Mesh(this.geometries.plane, this.additive(0xdff6ff, 0.8, this.textures.glow))
      streak.quaternion.copy(this.camera.quaternion)
      streak.position.set(0, (i - 1.5) * 0.18, 0)
      group.add(streak); streaks.push(streak)
    }
    return this.add({
      group, start, duration,
      update: (p) => {
        streaks.forEach((streak, i) => {
          const t = clamp01((p - i * 0.06) / 0.6)
          streak.scale.set(0.3 + easeOut(t) * 2.2, 0.09, 1)
          streak.position.x = direction * (easeOut(t) * 1.4 - 0.4)
          streak.material.opacity = t > 0 ? 0.8 * (1 - t) : 0
        })
      },
    })
  }

  // Recall/materialization uses a soft scanning halo; no collapse, debris or camera shake.
  switch(position, height, start, duration, entering) {
    const group = new THREE.Group()
    group.position.copy(position)
    const color = entering ? 0x8bf3e3 : 0x69cfff
    const halo = new THREE.Mesh(this.geometries.plane, this.additive(color, 0, this.textures.ring))
    halo.quaternion.copy(this.camera.quaternion)
    halo.position.y = height * .5
    const flash = this.sprite(this.textures.glow, 0xd8faff, height * 1.1)
    flash.position.y = height * .5
    group.add(halo, flash)
    const particles = this.particles(group, 18, { texture: this.textures.spark, color, size: height * .09 })
    return this.add({ group, start, duration, update: p => {
      const wave = Math.sin(Math.PI * p)
      const phase = entering ? p : 1 - p
      halo.scale.setScalar(height * (.55 + phase * .85))
      halo.rotation.z = p * (entering ? 1 : -1)
      halo.material.opacity = wave * .8
      flash.scale.setScalar(height * (.45 + wave * .85))
      flash.material.opacity = wave * .6
      for (const [i, particle] of particles.entries()) {
        const angle = i * Math.PI * 2 / particles.length + p * 2
        const radius = height * (.1 + phase * .65)
        particle.sprite.position.set(Math.cos(angle) * radius, height * (.5 + Math.sin(angle) * phase * .48), .15)
        particle.sprite.material.opacity = wave * .85
        particle.sprite.scale.setScalar(height * (.035 + wave * .055))
      }
    } })
  }

  // Defeat: the body breaks into rising data cubes.
  defeat(position, height, start, duration) {
    const group = new THREE.Group()
    group.position.copy(position)
    const random = seeded(this.serial++ * 15485863)
    const cubes = []
    for (let i = 0; i < 26; i++) {
      const cube = new THREE.Mesh(this.geometries.cube, this.additive(i % 3 ? 0x6ae4ff : 0xb8f4ff, 0.9))
      cube.scale.setScalar((0.04 + random() * 0.07) * height)
      cube.position.set((random() - 0.5) * 0.7 * height, random() * height, (random() - 0.5) * 0.5 * height)
      cube.userData = { speed: (0.6 + random()) * height, drift: (random() - 0.5) * 0.4, delay: random() * 0.35, base: cube.position.clone() }
      group.add(cube); cubes.push(cube)
    }
    const ring = new THREE.Mesh(this.geometries.plane, this.additive(0x6ae4ff, 0.8, this.textures.ring))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.03
    group.add(ring)
    return this.add({
      group, start, duration,
      update: (p, dt) => {
        ring.scale.setScalar((0.5 + easeOut(p) * 1.8) * height)
        ring.material.opacity = 0.8 * (1 - p)
        for (const cube of cubes) {
          const t = clamp01((p - cube.userData.delay) / (1 - cube.userData.delay))
          cube.position.copy(cube.userData.base)
          cube.position.y += t * t * cube.userData.speed * 1.4
          cube.position.x += cube.userData.drift * t
          cube.rotation.x += dt * 3; cube.rotation.y += dt * 4
          cube.material.opacity = t > 0 ? 0.9 * (1 - t) : 0
        }
      },
    })
  }

  // Number, matchup and critical badge move together above the models.
  damageNumber(position, feedback, start, duration) {
    const group = new THREE.Group()
    const canvas = createDamageTextCanvas(feedback)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const aspect = canvas.width / canvas.height
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })
    const label = new THREE.Sprite(material)
    label.renderOrder = 20
    group.add(label)
    const height = feedback.scale * canvas.height / 134
    const viewPoint = position.clone().applyMatrix4(this.camera.matrixWorldInverse)
    const bounds = { left: this.camera.left / this.camera.zoom, right: this.camera.right / this.camera.zoom,
      bottom: this.camera.bottom / this.camera.zoom, top: this.camera.top / this.camera.zoom }
    const placement = placeDamageText({ x: viewPoint.x, y: viewPoint.y + 0.325,
      width: height * aspect * feedback.pop, height: height * feedback.pop + 0.65, bounds },
    this.effects.filter(effect => effect.kind === 'damage').map(effect => effect.bounds))
    return this.add({
      group, start, duration, kind: 'damage', bounds: placement, textures: [texture],
      update: (p) => {
        const frame = damageTextFrame(p, feedback)
        label.scale.set(height * aspect * frame.scale * placement.fit, height * frame.scale * placement.fit, 1)
        group.position.set(placement.x, placement.y + (frame.rise - 0.325) * placement.fit, viewPoint.z)
          .applyMatrix4(this.camera.matrixWorld)
        material.opacity = frame.opacity
      },
    })
  }

  programRebuild(position, height, start, duration) {
    const direction = EXPANSION_EVOLUTION_SIGNATURES['위그드라실 7D6']
    const motif = createEvolutionMotif('program', direction.palette)
    motif.root.position.copy(position)
    return this.add({
      group: motif.root, start, duration, kind: 'program-rebuild',
      update: (p) => motif.update(sampleProgramRebuild(p), p * 4, height),
    })
  }

  // Evolution light. 'charge' pulls data motes into a spinning shaft of light around the body;
  // 'burst' releases it as a flash, a shockwave and scattering sparks.
  evolution(position, height, phase, start, duration) {
    const group = new THREE.Group()
    group.position.copy(position)
    const random = seeded(this.serial++ * 49979687)
    const colors = [0x9fe8ff, 0xfff1a8, 0xffffff, 0x7ab8ff]
    const floorRing = new THREE.Mesh(this.geometries.plane, this.additive(0x9fe8ff, 0, this.textures.ring))
    floorRing.rotation.x = -Math.PI / 2
    floorRing.position.y = 0.03
    group.add(floorRing)
    const core = this.sprite(this.textures.glow, 0xffffff, height)
    core.position.y = height * 0.5
    group.add(core)
    if (phase === 'burst') {
      const wave = new THREE.Mesh(this.geometries.plane, this.additive(0xbff2ff, 0.9, this.textures.ring))
      wave.position.y = height * 0.45
      group.add(wave)
      const sparks = this.particles(group, 44, { texture: this.textures.spark, colors, size: 0.2 * height })
      for (const spark of sparks) {
        const angle = random() * TAU, lift = random() * 1.6 - 0.4
        spark.velocity.set(Math.cos(angle), lift, Math.sin(angle)).normalize().multiplyScalar((0.8 + random() * 1.2) * height)
        spark.origin.set(0, height * (0.3 + random() * 0.4), 0)
        spark.delay = random() * 0.12
      }
      return this.add({
        group, start, duration,
        update: (p) => {
          core.scale.setScalar(height * (1.2 + easeOut(clamp01(p / 0.2)) * 1.6))
          core.material.opacity = 1 - clamp01(p / 0.35)
          wave.scale.setScalar(height * (0.6 + easeOut(clamp01(p / 0.5)) * 2.6))
          wave.quaternion.copy(this.camera.quaternion)
          wave.material.opacity = 0.9 * (1 - clamp01(p / 0.5))
          floorRing.scale.setScalar(height * (0.4 + easeOut(clamp01(p / 0.6)) * 2.4))
          floorRing.material.opacity = 0.9 * (1 - clamp01(p / 0.6))
          for (const spark of sparks) {
            const t = clamp01((p - spark.delay) / 0.7)
            spark.sprite.position.copy(spark.origin).addScaledVector(spark.velocity, easeOut(t))
            spark.sprite.position.y -= t * t * height * 0.25
            spark.sprite.material.opacity = t > 0 ? 1 - t : 0
          }
        },
      })
    }
    const shafts = [0, 1, 2].map((i) => {
      const shaft = new THREE.Mesh(this.geometries.plane, this.additive(0xbff2ff, 0, this.textures.beam))
      shaft.rotation.y = (i * Math.PI) / 3
      shaft.position.y = height * 0.9
      group.add(shaft)
      return shaft
    })
    const motes = this.particles(group, 42, { texture: this.textures.spark, colors, size: 0.14 * height })
    for (const mote of motes) {
      mote.origin.set(random() * TAU, random() * height * 0.9, 0.9 + random() * 0.5)
      mote.delay = random()
      mote.spin = 2.5 + random() * 2
    }
    const helix = []
    for (let i = 0; i < 28; i++) {
      const cube = new THREE.Mesh(this.geometries.cube, this.additive(i % 2 ? 0x6ae4ff : 0xfff1a8, 0))
      cube.scale.setScalar(0.05 * height)
      group.add(cube)
      helix.push(cube)
    }
    return this.add({
      group, start, duration,
      update: (p, dt, now) => {
        const build = easeOut(clamp01(p / 0.85))
        floorRing.scale.setScalar(height * (1.1 + Math.sin(now * 0.008) * 0.06))
        floorRing.rotation.z = p * 6
        floorRing.material.opacity = 0.35 + build * 0.55
        for (const [i, shaft] of shafts.entries()) {
          const width = height * (0.25 + build * 0.9)
          shaft.scale.set(width, height * 1.8, 1)
          shaft.rotation.y = (i * Math.PI) / 3 + p * 2
          shaft.material.opacity = clamp01((p - 0.2) / 0.5) * 0.55
        }
        for (const mote of motes) {
          const t = (p * 3 + mote.delay) % 1
          const angle = mote.origin.x + t * mote.spin
          const radius = mote.origin.z * height * (1 - easeOut(t))
          mote.sprite.position.set(Math.cos(angle) * radius, mote.origin.y + t * height * 0.35, Math.sin(angle) * radius)
          mote.sprite.material.opacity = Math.sin(t * Math.PI) * (0.4 + build * 0.6)
        }
        helix.forEach((cube, i) => {
          const strand = i % 2, step = Math.floor(i / 2)
          const angle = step * 0.9 + strand * Math.PI + now * 0.004
          const y = ((step / 14 + p * 0.6) % 1) * height * 1.2
          cube.position.set(Math.cos(angle) * height * 0.48, y, Math.sin(angle) * height * 0.48)
          cube.rotation.set(now * 0.003, now * 0.004, 0)
          cube.material.opacity = clamp01(p / 0.25) * 0.85 * Math.sin((y / (height * 1.2)) * Math.PI)
        })
        const flash = clamp01((p - 0.82) / 0.18)
        core.scale.setScalar(height * (0.4 + build * 0.5 + flash * 1.6))
        core.material.opacity = 0.25 + build * 0.35 + flash * 0.4
      },
    })
  }

  update(now, dt) {
    this.effects = this.effects.filter((effect) => {
      const p = clamp01((now - effect.start) / effect.duration)
      if (now >= effect.start && effect.update(p, dt, now) === false) { this.remove(effect); return false }
      effect.group.visible = now >= effect.start
      if (p >= 1) { this.remove(effect); return false }
      return true
    })
    this.shake = Math.max(0, this.shake - dt * 0.6)
  }

  // Small camera offset for hit impact; the renderer adds it to the camera each frame.
  shakeOffset(now) {
    if (this.shake <= 0) return null
    return new THREE.Vector3(Math.sin(now * 0.09) * this.shake, Math.cos(now * 0.11) * this.shake * 0.6, 0)
  }

  remove(effect) {
    this.scene.remove(effect.group)
    for (const texture of effect.textures || []) texture.dispose()
    const geometries = new Set(), materials = new Set()
    const shared = new Set(Object.values(this.geometries))
    effect.group.traverse((child) => {
      if (child.geometry && !shared.has(child.geometry)) geometries.add(child.geometry)
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) if (material) materials.add(material)
    })
    for (const geometry of geometries) geometry.dispose()
    for (const material of materials) material.dispose()
  }

  dispose() {
    for (const effect of this.effects) this.remove(effect)
    this.effects = []
    for (const geometry of Object.values(this.geometries)) geometry.dispose()
    for (const texture of Object.values(this.textures)) texture.dispose()
  }
}
