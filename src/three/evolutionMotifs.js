import * as THREE from 'three'

// Model-space geometry, not painted overlays. All motion is sampled from the
// cinematic clock so seeking, pausing and replaying produce the same frame.
export const EVOLUTION_MOTIF_KINDS = Object.freeze([
  'magma', 'forge', 'resonance', 'crescent', 'crystal', 'tide', 'healing',
  'plasma', 'frost', 'drill', 'jet', 'assembly', 'scan', 'relic', 'stars',
  'thunder', 'forest', 'target', 'soul', 'deletion', 'program',
])

const TAU = Math.PI * 2
const clamp = THREE.MathUtils.clamp
const smooth = THREE.MathUtils.smoothstep
const fract = (x) => x - Math.floor(x)
const lerp = THREE.MathUtils.lerp

function polygon(points, depth = .04) {
  const shape = new THREE.Shape()
  points.forEach(([x, y], i) => shape[i ? 'lineTo' : 'moveTo'](x, y))
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  geometry.translate(0, 0, -depth / 2)
  return geometry
}

function star() {
  return polygon(Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .42 : 1
    return [Math.cos(a) * r, Math.sin(a) * r]
  }))
}

function heart() {
  const shape = new THREE.Shape()
  shape.moveTo(0, -.9)
  shape.bezierCurveTo(-1.5, .2, -.95, 1.35, 0, .5)
  shape.bezierCurveTo(.95, 1.35, 1.5, .2, 0, -.9)
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .18, bevelEnabled: false, curveSegments: 12 })
  geometry.translate(0, 0, -.09)
  return geometry
}

function leaf() {
  const shape = new THREE.Shape()
  shape.moveTo(0, -1)
  shape.quadraticCurveTo(-1.1, .1, 0, 1)
  shape.quadraticCurveTo(1.1, .1, 0, -1)
  return new THREE.ExtrudeGeometry(shape, { depth: .035, bevelEnabled: false, curveSegments: 10 })
}

function lightning() {
  const points = Array.from({ length: 10 }, (_, i) => new THREE.Vector3(
    i === 0 || i === 9 ? 0 : (i % 2 ? .065 : -.065), .5 - i / 9, 0))
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 36, .008, 4, false)
}

function snowflake() {
  const points = []
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6, x = Math.cos(a), y = Math.sin(a)
    points.push(0, 0, 0, x, y, 0)
    for (const side of [-1, 1]) {
      const b = a + side * Math.PI / 3
      points.push(x * .58, y * .58, 0, x * .58 - Math.cos(b) * .3, y * .58 - Math.sin(b) * .3, 0)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  return geometry
}

// Unlike jogress, DigiXros scans the partners on their own marks, then transfers
// their data along separate assembly lanes. No partner is shown dying or spinning.
export function sampleXrosAssembly(cinematic, elapsed, index, count, reducedMotion = false) {
  const { charge, transform, reveal } = cinematic.beats
  const scan = smooth(elapsed, charge, charge + 650)
  const transfer = smooth(elapsed, charge + 850 + index * 180, transform - 150)
  const baseX = (index - (count - 1) / 2) * 3
  return {
    x: baseX * (1 - transfer),
    y: (reducedMotion ? .08 : .35) * scan * (1 - transfer),
    z: -.2 * transfer,
    scale: 1 - transfer * .65,
    opacity: 1 - smooth(elapsed, transform - 650, transform),
    scan,
    transfer,
    assembled: smooth(elapsed, transform, reveal - 100),
  }
}

// The administrator program has no ordinary evolution route. Its existing boss
// reinforcement cue uses this compact reconstruction rather than biological evolution.
export function sampleProgramRebuild(progress) {
  const p = clamp(progress, 0, 1)
  return {
    charge: smooth(p, 0, .55) * (1 - smooth(p, .7, 1)),
    assemble: smooth(p, .25, .75),
    burst: smooth(p, .5, .7) * (1 - smooth(p, .8, 1)),
    nameCard: smooth(p, .8, 1),
  }
}

export function createEvolutionMotif(kind, palette, { variant, sourcePalettes = [], reducedMotion = false } = {}) {
  if (!EVOLUTION_MOTIF_KINDS.includes(kind)) throw new RangeError(`Unknown evolution motif: ${kind}`)
  const root = new THREE.Group()
  root.name = `evolution-motif:${kind}${variant ? ':' + variant : ''}`
  const parts = [], materials = []
  const density = (n) => reducedMotion ? Math.max(4, Math.ceil(n / 3)) : n
  const add = (geometry, role, i, color = palette[i % 2], { solid = false, line = false, opacity = .55 } = {}) => {
    const properties = { color, transparent: true, opacity: 0, depthWrite: false, fog: false }
    const material = line ? new THREE.LineBasicMaterial(properties)
      : solid ? new THREE.MeshStandardMaterial({ ...properties, metalness: .45, roughness: .3, emissive: color, emissiveIntensity: .25 })
        : new THREE.MeshBasicMaterial({ ...properties, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    const mesh = line ? new THREE.LineSegments(geometry, material) : new THREE.Mesh(geometry, material)
    mesh.name = `${role}:${i}`
    root.add(mesh); materials.push(material)
    parts.push({ mesh, role, i, opacity, seed: fract((i + 1) * .61803398875) })
    return mesh
  }
  const rings = (n, role = 'ring', color = palette[0]) => {
    const geometry = new THREE.TorusGeometry(1, .012, 6, 64)
    for (let i = 0; i < n; i++) add(geometry, role, i, color)
  }
  const cloud = (geometry, n, role, options) => {
    for (let i = 0; i < density(n); i++) add(geometry, role, i, undefined, options)
  }

  switch (kind) {
    case 'magma':
      cloud(new THREE.IcosahedronGeometry(1, 0), 32, 'ember', { solid: true, opacity: .85 })
      rings(3, 'lava', '#ff963b'); break
    case 'forge': {
      const gear = polygon(Array.from({ length: 64 }, (_, i) => {
        const a = i * TAU / 64, r = i % 4 < 2 ? 1 : .8
        return [Math.cos(a) * r, Math.sin(a) * r]
      }), .12)
      cloud(gear, 12, 'gear', { solid: true, opacity: .7 }); rings(2, 'scan'); break
    }
    case 'resonance': rings(reducedMotion ? 4 : 8, 'wave'); break
    case 'crescent': {
      const geometry = new THREE.TorusGeometry(1, .04, 8, 80, Math.PI * 1.4)
      for (let i = 0; i < 4; i++) add(geometry, 'moon', i, palette[1], { solid: true })
      cloud(star(), 12, 'spark', { solid: true }); break
    }
    case 'crystal': cloud(new THREE.OctahedronGeometry(1, 0), 24, 'crystal', { solid: true, opacity: .72 }); rings(2); break
    case 'tide': cloud(new THREE.SphereGeometry(1, 12, 8), 28, 'bubble', { opacity: .2 }); rings(4, 'ripple'); break
    case 'healing': cloud(heart(), 14, 'heart', { solid: true, opacity: .75 }); cloud(star(), 12, 'spark', { solid: true }); rings(2, 'ripple'); break
    case 'plasma': cloud(lightning(), 14, 'arc'); rings(3, 'orbit'); break
    case 'frost': cloud(snowflake(), 28, 'snow', { line: true, opacity: .75 }); cloud(new THREE.OctahedronGeometry(1), 12, 'ice', { solid: true }); rings(2, 'ripple'); break
    case 'drill': {
      const points = Array.from({ length: 161 }, (_, i) => {
        const t = i / 160, a = t * TAU * 5, radius = .08 + t * .7
        return new THREE.Vector3(Math.cos(a) * radius, 1.4 - t * 1.35, Math.sin(a) * radius)
      })
      const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 160, .018, 6, false)
      add(geometry, 'drill', 0, palette[0]); cloud(new THREE.TetrahedronGeometry(1), 20, 'earth', { solid: true }); break
    }
    case 'jet': cloud(new THREE.ConeGeometry(.035, 1, 6), 20, 'contrail'); rings(3, 'gate'); break
    case 'assembly': {
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const count = Math.max(2, sourcePalettes.length)
      for (let i = 0; i < count; i++) {
        const color = sourcePalettes[i]?.[0] ?? palette[i % 2]
        add(new THREE.TorusGeometry(.65, .016, 6, 4), 'port', i, color)
        for (let j = 0; j < (reducedMotion ? 4 : 10); j++) add(geometry, 'packet', i * 10 + j, color, { solid: true, opacity: .7 })
      }
      rings(3, 'blueprint')
      if (variant === 'sword') {
        const sword = new THREE.Group()
        const blade = add(new THREE.BoxGeometry(.035, 1.05, .03), 'weapon', 0, palette[1], { solid: true })
        const guard = add(star(), 'weapon', 1, palette[1], { solid: true })
        sword.add(blade, guard); root.add(sword)
      } else if (variant === 'launcher') {
        const gun = new THREE.CylinderGeometry(.08, .08, .65, 12, 1, true); gun.rotateX(Math.PI / 2)
        add(gun, 'weapon', 0, palette[0], { solid: true })
        add(gun, 'weapon', 1, palette[0], { solid: true })
      } else if (variant === 'wing') {
        const fin = polygon([[0, 0], [.85, .38], [.5, -.15]], .03)
        add(fin, 'weapon', 0, palette[1], { solid: true }); add(fin, 'weapon', 1, palette[1], { solid: true })
      } else if (variant === 'drill') {
        add(new THREE.ConeGeometry(.19, .65, 12), 'weapon', 0, palette[0], { solid: true })
      }
      break
    }
    case 'scan': rings(4, 'scan'); cloud(new THREE.BoxGeometry(1, 1, 1), 18, 'pixel', { solid: true }); break
    case 'relic': {
      const pyramid = new THREE.ConeGeometry(.95, 1.4, 4, 1, true)
      add(pyramid, 'pyramid', 0, palette[1], { opacity: .32 })
      cloud(new THREE.BoxGeometry(.3, 1, .08), 16, 'glyph', { solid: true }); rings(3, 'ripple'); break
    }
    case 'stars': cloud(star(), 22, 'star', { solid: true, opacity: .8 }); rings(3, 'orbit'); break
    case 'thunder': cloud(lightning(), 14, 'thunder'); rings(3, 'halo', palette[1]); break
    case 'forest': cloud(leaf(), 24, 'leaf', { solid: true, opacity: .7 }); rings(2, 'ripple'); break
    case 'target': rings(3, 'bullseye'); cloud(new THREE.ConeGeometry(.018, .45, 4), 12, 'dart', { solid: true }); break
    case 'soul': cloud(new THREE.SphereGeometry(1, 12, 8), 22, 'soul', { opacity: .3 }); rings(3, 'vortex'); break
    case 'deletion': cloud(new THREE.BoxGeometry(1, 1, 1), 40, 'erased', { solid: true }); rings(3, 'vortex'); break
    case 'program': rings(5, 'hex'); cloud(new THREE.OctahedronGeometry(1), 30, 'node', { solid: true, opacity: .65 }); break
  }

  function update(frame, seconds, height = 2.6) {
    const motion = reducedMotion ? .12 : 1
    const time = seconds * motion
    const fade = (1 - frame.nameCard) * clamp(.15 + frame.charge * .8 + frame.burst, 0, 1)
    root.scale.setScalar(height)
    root.visible = fade > .001
    for (const { mesh, role, i, seed, opacity } of parts) {
      const angle = i * 2.39996323 + time * .4
      const radius = .7 + seed * .4
      const life = fract(seed + time * .22)
      const y = .15 + life * 1.4
      const burst = frame.burst * (.25 + seed * .4)
      mesh.position.set(Math.cos(angle) * (radius + burst), y, Math.sin(angle) * (radius + burst))
      mesh.rotation.set(0, angle, time * .45 + seed * TAU)
      mesh.scale.setScalar(.04 + seed * .065)
      let visibility = 1
      switch (role) {
        case 'ember': mesh.position.y = life * (1.2 + frame.charge * .7); mesh.scale.setScalar(.02 + seed * .045); break
        case 'lava': case 'ripple': {
          mesh.position.set(0, .025 + i * .035, 0); mesh.rotation.set(Math.PI / 2, 0, 0)
          mesh.scale.setScalar(.5 + fract(time * .35 + i / 4) * .7 + burst)
          visibility = .65; break
        }
        case 'gear': mesh.scale.setScalar(.12 + seed * .12); mesh.rotation.z = time * (i % 2 ? -1 : 1); break
        case 'wave': {
          const v = fract(time * .4 + i / parts.length)
          mesh.position.set(0, .48, 0); mesh.rotation.set(-Math.PI / 2 + .12, 0, 0)
          mesh.scale.set(1 + v * .65, 1 + v * .65, .3)
          visibility = (1 - v) * .7; break
        }
        case 'moon': mesh.position.set(0, .65, -.35); mesh.scale.setScalar(.6 + i * .16); mesh.rotation.set(i * .2, 0, time * .2 + i * Math.PI / 2); break
        case 'spark': mesh.scale.setScalar(.025 + seed * .04); break
        case 'crystal': mesh.scale.set(.06, .13 + seed * .2, .06); mesh.position.y = .1 + seed * .95; break
        case 'bubble': mesh.scale.setScalar(.04 + seed * .08); break
        case 'heart': mesh.scale.setScalar(.05 + seed * .06); mesh.rotation.set(0, Math.sin(time + i) * .35, Math.sin(time * .6 + i) * .12); break
        case 'arc': mesh.scale.setScalar(.35 + seed * .35); mesh.rotation.set(.3, angle, Math.PI / 2); break
        case 'orbit': mesh.position.set(0, .4 + i * .22, 0); mesh.scale.setScalar(.7 + i * .15); mesh.rotation.set(.4 + i * .45, time * .3, 0); break
        case 'snow': mesh.rotation.set(0, 0, time * .2 + seed * TAU); mesh.position.y = 1.5 - life * 1.4; break
        case 'ice': mesh.position.y = .1 + seed * .15; mesh.scale.set(.045, .12 + seed * .15, .045); break
        case 'drill': mesh.position.set(0, 0, 0); mesh.scale.setScalar(.85); mesh.rotation.set(0, time * 3, 0); break
        case 'earth': mesh.position.y = .03 + seed * .3 + burst; mesh.scale.setScalar(.04 + seed * .035); break
        case 'contrail': mesh.scale.set(.65, .25 + seed * .5, .65); mesh.rotation.set(Math.PI / 2, 0, -.4); mesh.position.z = -2 + life * 3; break
        case 'gate': mesh.position.set(0, .6, -1.5 + i * .65); mesh.rotation.set(0, 0, 0); mesh.scale.setScalar(.85 + i * .08); break
        case 'port': {
          const side = i % 2 ? 1 : -1
          mesh.position.set(side * .75, .5, -.15); mesh.rotation.set(0, side * Math.PI / 2, Math.PI / 4)
          mesh.scale.setScalar(1 - frame.assemble * .6); visibility = 1 - frame.assemble; break
        }
        case 'packet': {
          const lane = Math.floor(i / 10), side = lane % 2 ? 1 : -1
          const k = smooth(frame.assemble, seed * .35, .65 + seed * .3)
          mesh.position.set(lerp(side * (1.3 + seed), side * .12, k), lerp(.3 + seed, .18 + seed * .7, k), (seed - .5) * .3)
          mesh.rotation.set(0, 0, 0); mesh.scale.set(.065, .025 + seed * .035, .035)
          visibility = frame.charge * (1 - smooth(k, .85, 1)); break
        }
        case 'blueprint': mesh.position.set(0, .2 + i * .35, 0); mesh.rotation.set(Math.PI / 2, 0, 0); mesh.scale.setScalar(.9 - frame.assemble * .4); visibility = frame.charge; break
        case 'weapon': {
          const side = i % 2 ? 1 : -1, k = frame.assemble
          mesh.position.set(side * (.35 + (1 - k) * .8), .65, -.25)
          mesh.rotation.set(0, 0, variant === 'sword' ? -.5 : 0); mesh.scale.setScalar(variant === 'sword' && i === 1 ? .12 : 1)
          if (variant === 'sword' && i === 1) mesh.position.y = .28
          if (variant === 'wing' && i === 1) mesh.scale.x *= -1
          visibility = smooth(k, .1, .6) * (1 - smooth(k, .9, 1)); break
        }
        case 'scan': mesh.position.set(0, .12 + fract(time * .3 + i / 4) * 1.15, 0); mesh.rotation.set(Math.PI / 2, 0, Math.PI / 4); mesh.scale.setScalar(.75); break
        case 'pixel': mesh.scale.setScalar(.025); mesh.position.y = .15 + Math.floor(seed * 9) * .13; break
        case 'pyramid': mesh.position.set(0, .7, -.4); mesh.rotation.set(0, Math.PI / 4 + time * .12, 0); mesh.scale.setScalar(1); break
        case 'glyph': mesh.scale.set(.08, .08 + seed * .04, .08); mesh.position.y = .2 + seed * 1.1; break
        case 'star': mesh.position.y = .65 + Math.sin(time + i) * .3; mesh.scale.setScalar(.04 + seed * .065); mesh.rotation.set(0, 0, time * .25 + i); break
        case 'thunder': mesh.position.set(Math.cos(angle) * radius, 1.2, Math.sin(angle) * radius); mesh.scale.set(.5, .9 + seed * .5, .5); mesh.rotation.set(0, angle, 0); visibility = .35 + frame.burst * .6; break
        case 'halo': mesh.position.set(0, 1.15 + i * .09, 0); mesh.rotation.set(Math.PI / 2, 0, 0); mesh.scale.setScalar(.7 + i * .2); break
        case 'leaf': mesh.position.y = 1.5 - life * 1.4; mesh.scale.setScalar(.045 + seed * .035); mesh.rotation.set(.5, time + i, time * .3); break
        case 'bullseye': mesh.position.set(0, .6, -.6); mesh.rotation.set(0, 0, 0); mesh.scale.setScalar(.25 + i * .25); break
        case 'dart': mesh.position.set(Math.cos(angle) * (1.8 - life * .8), .5 + seed * .3, -life * .4); mesh.rotation.set(0, 0, angle + Math.PI / 2); mesh.scale.setScalar(.6); break
        case 'soul': {
          const k = smooth(frame.charge, .3, .95)
          mesh.position.set(lerp(Math.cos(angle) * radius, -.35, k), lerp(y, .65, k), lerp(Math.sin(angle) * radius, .4, k))
          mesh.scale.setScalar(.025 + seed * .05); visibility = 1 - k * .8; break
        }
        case 'vortex': mesh.position.set(0, .4 + i * .3, -.6); mesh.rotation.set(.15, .25, -time); mesh.scale.setScalar(.8 + i * .15 - frame.charge * .25); break
        case 'erased': {
          const k = smooth(frame.charge, seed * .5, .55 + seed * .4)
          mesh.position.set(lerp(Math.cos(angle) * radius, 0, k), lerp(.12 + seed * 1.3, .6, k), lerp(Math.sin(angle) * radius, -.6, k))
          mesh.rotation.set(0, 0, 0); mesh.scale.setScalar(Math.max(.001, .055 * (1 - k)))
          visibility = 1 - k; break
        }
        case 'hex': mesh.position.set(0, .12 + i * .25, 0); mesh.rotation.set(Math.PI / 2, 0, time * .1 + i * .2); mesh.scale.setScalar(.45 + .28 * Math.sin(Math.PI * i / 5)); break
        case 'node': {
          const k = smooth(frame.charge, seed * .3, .55 + seed * .4), a = Math.floor(i / 5) * TAU / 6
          mesh.position.set(Math.cos(a) * lerp(1.3, .5, k), .15 + i % 5 * .23, Math.sin(a) * lerp(1.3, .5, k))
          mesh.scale.setScalar(.035 + k * .01); mesh.rotation.set(0, time * .1, 0); break
        }
      }
      mesh.material.opacity = opacity * fade * visibility
      mesh.visible = mesh.material.opacity > .001
    }
    root.updateMatrixWorld(true)
  }
  return { root, parts, materials, update }
}
