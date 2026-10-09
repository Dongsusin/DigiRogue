import * as THREE from 'three'

// Procedural evolution "capsules": modelled per evolution kind and coloured from the
// evolving Digimon's own palette, instead of pasting the flat inventory item art.
export const CAPSULE_KINDS = ['digimental', 'spirit', 'xantibody', 'mode', 'crest', 'digivice']

const metal = (color, emissive, extra = {}) => new THREE.MeshStandardMaterial({
  color, emissive, emissiveIntensity: 0.55, metalness: 0.85, roughness: 0.22, transparent: true, ...extra,
})
const glow = (color, extra = {}) => new THREE.MeshBasicMaterial({
  color: color.clone().multiplyScalar(1.3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, ...extra,
})

// Egg profile for a digimental, unit height centred on the origin.
function eggProfile() {
  const points = []
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    const y = -0.5 + t
    const r = Math.sin(Math.PI * t) * (0.42 - 0.12 * t) + 0.001
    points.push(new THREE.Vector2(r, y))
  }
  return points
}

function digimental([a, b, c]) {
  // Two shell halves (split on the vertical axis) so it can open around its partner.
  const halves = [0, 1].map((half) => {
    const group = new THREE.Group()
    const start = half * Math.PI
    group.add(new THREE.Mesh(new THREE.LatheGeometry(eggProfile(), 40, start, Math.PI), metal(a, c, { side: THREE.DoubleSide })))
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.42, 20, 1, false, start, Math.PI), metal(b, a))
    horn.position.y = 0.66
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 10, 40, Math.PI), metal(b, b, { emissiveIntensity: 0.9 }))
    band.rotation.x = Math.PI / 2; band.rotation.z = start; band.position.y = -0.04
    const crest = new THREE.Mesh(new THREE.CircleGeometry(0.11, 6), glow(b, { side: THREE.DoubleSide }))
    crest.position.set(Math.sin(start + Math.PI / 2) * 0.39, 0.06, Math.cos(start + Math.PI / 2) * 0.39)
    crest.lookAt(crest.position.clone().multiplyScalar(2))
    group.add(horn, band, crest)
    return group
  })
  return { parts: halves, split: true }
}

function spirit([a, b]) {
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), metal(a, a, { emissiveIntensity: 0.9, metalness: 0.4 }))
  core.scale.y = 1.7
  const parts = [core]
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5 + i * 0.12, 0.018, 8, 64), glow(i ? b : a))
    ring.rotation.set(Math.PI / 2 + (i ? 0.5 : -0.5), 0, 0)
    parts.push(ring)
  }
  for (let i = 0; i < 4; i++) {
    const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(0.08), glow(b))
    const angle = i * Math.PI / 2
    shard.position.set(Math.cos(angle) * 0.62, (i % 2 ? 0.25 : -0.25), Math.sin(angle) * 0.62)
    parts.push(shard)
  }
  return { parts, split: false }
}

function xantibody([a, , c]) {
  const parts = [-1, 1].map((side) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.17, 1.15, 0.17), metal(a, c, { emissiveIntensity: 0.6, metalness: 0.6 }))
    bar.rotation.z = side * 0.62
    return bar
  })
  parts.push(new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), glow(a)))
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.02, 8, 6), metal(c, a, { emissiveIntensity: 1 }))
  parts.push(ring)
  return { parts, split: false }
}

function mode([a, b, c]) {
  const main = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), metal(a, c, { metalness: 0.6, roughness: 0.12 }))
  main.scale.set(0.8, 1.6, 0.8)
  const parts = [main]
  for (let i = 0; i < 3; i++) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), metal(b, a, { emissiveIntensity: 0.8 }))
    const angle = i * Math.PI * 2 / 3
    shard.position.set(Math.cos(angle) * 0.45, -0.25 + i * 0.2, Math.sin(angle) * 0.45)
    shard.scale.y = 1.8
    shard.rotation.z = Math.cos(angle) * 0.4
    parts.push(shard)
  }
  return { parts, split: false }
}

function crest([a, b]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 12, 64), metal(a, a, { emissiveIntensity: 0.7 }))
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), glow(b))
  const parts = [ring, heart]
  for (let i = 0; i < 4; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 12), metal(b, a))
    const angle = i * Math.PI / 2
    spike.position.set(Math.cos(angle) * 0.58, Math.sin(angle) * 0.58, 0)
    spike.rotation.z = angle - Math.PI / 2
    parts.push(spike)
  }
  return { parts, split: false }
}

function digivice([a, b, c]) {
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 6), metal(c.clone().lerp(new THREE.Color('#ffffff'), 0.6), a))
  body.rotation.x = Math.PI / 2
  const screen = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), glow(b, { side: THREE.DoubleSide }))
  screen.position.z = 0.09
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 6), metal(a, a, { emissiveIntensity: 0.9 }))
  return { parts: [body, screen, rim], split: false }
}

const BUILDERS = { digimental, spirit, xantibody, mode, crest, digivice }

/** Returns { root, parts, split, materials } for the given capsule kind and [primary, light, deep] palette. */
export function createEvolutionCapsule(kind, palette) {
  const colors = palette.map((value) => new THREE.Color(value))
  const { parts, split } = (BUILDERS[kind] ?? mode)(colors)
  const root = new THREE.Group()
  parts.forEach((part) => root.add(part))
  const materials = new Set()
  root.traverse((node) => { if (node.material) materials.add(node.material) })
  return { root, parts, split, materials: [...materials] }
}
