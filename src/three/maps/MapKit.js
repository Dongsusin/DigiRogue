// Procedural toolkit for 3D battle maps. Every map module receives a kit, describes its place
// with it (sky, light, fog, terrain, water, landmarks, props, particles) and the kit returns one
// environment the battle renderer can add, animate and dispose.
//
// Coordinates: metres, +Y up, the camera looks toward -Z. The battle floor is the flat strip
// x ∈ [-11.5, 11.5], z ∈ [-3.5, 3.5] at y = 0; allies stand on the left, enemies on the right.
// Scenery goes behind (z < -5), on the edges (|x| > 12) and only low details in front (z > 4).
// The kit uses no DOM APIs (textures are DataTextures), so maps also build in Node for checks.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export const ARENA = Object.freeze({ halfWidth: 11.5, halfDepth: 3.5, clearHeight: 7 })
const TAU = Math.PI * 2

// ---------- deterministic randomness and noise ----------
export function createRandom(seed = 1) {
  let state = seed >>> 0 || 1
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash2(x, z, seed) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + Math.imul(seed | 0, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function valueNoise(x, z, seed = 0) {
  const x0 = Math.floor(x), z0 = Math.floor(z)
  const fx = x - x0, fz = z - z0
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz)
  const a = hash2(x0, z0, seed), b = hash2(x0 + 1, z0, seed), c = hash2(x0, z0 + 1, seed), d = hash2(x0 + 1, z0 + 1, seed)
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz
}

export function fbm(x, z, seed = 0, octaves = 4) {
  let sum = 0, amplitude = 0.5, frequency = 1, norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * frequency, z * frequency, seed + i * 17) * amplitude
    norm += amplitude
    amplitude *= 0.5
    frequency *= 2.03
  }
  return sum / norm
}

const smoothstep = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t) }

// ---------- procedural textures (no canvas) ----------
function dataTexture(size, pixel, { repeat = true, srgb = true } = {}) {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a = 255] = pixel(x / size, y / size, x, y)
      const i = (y * size + x) * 4
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  if (repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

// Tileable grey detail patterns multiplied over vertex colours.
const DETAIL_PATTERNS = {
  grass: (u, v, x, y) => { const n = 0.78 + 0.22 * hash2(x, y, 3) - 0.12 * (hash2(x >> 2, y >> 2, 5) > 0.8); return n },
  dirt: (u, v, x, y) => 0.8 + 0.2 * fbm(u * 8, v * 8, 11, 3) - 0.08 * hash2(x, y, 2),
  sand: (u, v, x, y) => 0.88 + 0.1 * Math.sin((u * 6 + fbm(u * 4, v * 4, 4, 2)) * TAU) * 0.5 + 0.06 * hash2(x, y, 9),
  snow: (u, v) => 0.93 + 0.07 * fbm(u * 6, v * 6, 21, 3),
  stone: (u, v) => { const n = fbm(u * 6, v * 6, 31, 4); const cell = Math.abs(Math.sin(u * TAU * 4 + n * 3) * Math.sin(v * TAU * 4 + n * 2)); return 0.72 + 0.22 * n + (cell < 0.07 ? -0.25 : 0) },
  tiles: (u, v) => { const gx = (u * 4) % 1, gy = (v * 4) % 1; const edge = Math.min(gx, gy, 1 - gx, 1 - gy); return edge < 0.035 ? 0.55 : 0.9 + 0.08 * fbm(u * 10, v * 10, 7, 2) },
  planks: (u, v, x, y) => { const row = Math.floor(v * 6); const gy = (v * 6) % 1; const offset = (row % 2) * 0.5; const gx = (u * 2 + offset) % 1; return gy < 0.05 || gx < 0.012 ? 0.5 : 0.8 + 0.12 * valueNoise(u * 40, row * 3, 13) + 0.05 * hash2(x, y, 1) },
  grid: (u, v) => { const gx = (u * 8) % 1, gy = (v * 8) % 1; return Math.min(gx, gy, 1 - gx, 1 - gy) < 0.03 ? 1.35 : 0.85 },
  hex: (u, v) => { const s = 5, hx = u * s * 1.1547, hy = v * s + (Math.floor(hx) % 2) * 0.5; const fx = hx % 1, fy = hy % 1; return Math.min(fx, 1 - fx, fy, 1 - fy) < 0.05 ? 0.6 : 0.9 },
  metal: (u, v, x, y) => { const gx = (u * 2) % 1, gy = (v * 2) % 1; const seam = Math.min(gx, gy, 1 - gx, 1 - gy) < 0.012; const rivet = Math.hypot(gx - 0.06, gy - 0.06) < 0.015; return seam ? 0.55 : rivet ? 1.2 : 0.85 + 0.1 * valueNoise(u * 30, v * 2, 3) + 0.03 * hash2(x, y, 4) },
  ash: (u, v, x, y) => 0.7 + 0.25 * fbm(u * 5, v * 5, 41, 4) + 0.06 * hash2(x, y, 7),
  cracked: (u, v) => { const n = fbm(u * 7, v * 7, 51, 4); const vein = Math.abs(n - 0.5) < 0.018; return vein ? 1.6 : 0.75 + 0.2 * n },
  moss: (u, v, x, y) => 0.75 + 0.2 * fbm(u * 9, v * 9, 61, 3) + 0.08 * hash2(x, y, 8),
  circuit: (u, v) => { const gx = (u * 8) % 1, gy = (v * 8) % 1; const cx = Math.floor(u * 8), cy = Math.floor(v * 8); const horizontal = hash2(cx, cy, 71) > 0.5; const line = horizontal ? Math.abs(gy - 0.5) < 0.04 : Math.abs(gx - 0.5) < 0.04; const pad = Math.hypot(gx - 0.5, gy - 0.5) < 0.1 && hash2(cx, cy, 72) > 0.6; return line || pad ? 1.5 : 0.8 },
}

function detailTexture(kind) {
  const pattern = DETAIL_PATTERNS[kind] || DETAIL_PATTERNS.dirt
  return dataTexture(128, (u, v, x, y) => {
    const value = Math.max(0, Math.min(255, Math.round(pattern(u, v, x, y) * 200)))
    return [value, value, value]
  }, { srgb: false })
}

const softTexture = () => dataTexture(64, (u, v) => {
  const d = Math.hypot(u - 0.5, v - 0.5) * 2
  const a = Math.max(0, 1 - d)
  return [255, 255, 255, Math.round(255 * a * a)]
}, { repeat: false })

// ---------- sky shader ----------
const SKY_VERTEX = `
varying vec3 vDirection;
void main() {
  vDirection = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * world;
}`
const SKY_FRAGMENT = `
uniform vec3 topColor;
uniform vec3 horizonColor;
uniform vec3 bottomColor;
uniform float exponent;
uniform float horizonBlur;
varying vec3 vDirection;
void main() {
  float h = vDirection.y;
  vec3 color = h >= 0.0
    ? mix(horizonColor, topColor, pow(clamp(h / max(0.001, 1.0 - horizonBlur), 0.0, 1.0), exponent))
    : mix(horizonColor, bottomColor, clamp(-h * 4.0, 0.0, 1.0));
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

// ---------- the kit ----------
export function createMapKit({ seed = 1, name = 'map' } = {}) {
  const root = new THREE.Group()
  root.name = `map:${name}`
  const random = createRandom(seed)
  const disposables = new Set()
  const updaters = []
  const materialCache = new Map()
  const textureCache = new Map()
  const environment = { fog: null, lights: [], background: null }
  const own = (thing) => { if (thing) disposables.add(thing); return thing }
  const range = (min, max) => min + (max - min) * random()
  const pick = (list) => list[Math.floor(random() * list.length) % list.length]
  const color = (value) => new THREE.Color(value)

  function texture(key, make) {
    if (!textureCache.has(key)) textureCache.set(key, own(make()))
    return textureCache.get(key)
  }
  const glowMap = () => texture('soft', softTexture)

  // Shared materials. Vertex-coloured flat material covers most merged props.
  function material(options = {}) {
    const { color: hex = 0xffffff, emissive = 0x000000, emissiveIntensity = 1, roughness = 0.88, metalness = 0,
      flat = true, vertexColors = false, transparent = false, opacity = 1, side = THREE.FrontSide, map = null, fog = true, basic = false, additive = false, depthWrite } = options
    const key = JSON.stringify([hex, emissive, emissiveIntensity, roughness, metalness, flat, vertexColors, transparent, opacity, side, map?.uuid, fog, basic, additive, depthWrite])
    if (materialCache.has(key)) return materialCache.get(key)
    const made = basic || additive
      ? new THREE.MeshBasicMaterial({ color: hex, vertexColors, transparent: transparent || additive, opacity, side, map, fog,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: depthWrite ?? !(transparent || additive), toneMapped: !additive })
      : new THREE.MeshStandardMaterial({ color: hex, emissive, emissiveIntensity, roughness, metalness, flatShading: flat, vertexColors, transparent, opacity, side, map, fog,
        depthWrite: depthWrite ?? !transparent })
    materialCache.set(key, own(made))
    return made
  }
  const vertexMaterial = (options = {}) => material({ vertexColors: true, ...options })

  // ----- geometry assembly: parts with colours merge into one draw call -----
  function part(geometry, hex, { position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], emissive = false } = {}) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone()
    if (geometry !== g) geometry.dispose()
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name)
    if (!g.attributes.normal) g.computeVertexNormals()
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(...(Array.isArray(scale) ? scale : [scale, scale, scale])))
    g.applyMatrix4(matrix)
    const c = color(hex)
    const colors = new Float32Array(g.attributes.position.count * 3)
    for (let i = 0; i < colors.length; i += 3) { colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.userData.emissive = emissive
    return g
  }
  // Merge parts into { solid, glow } geometries (glow parts render unlit and bright).
  function assemble(parts) {
    const solid = parts.filter((p) => !p.userData.emissive), glow = parts.filter((p) => p.userData.emissive)
    const result = {
      solid: solid.length ? mergeGeometries(solid) : null,
      glow: glow.length ? mergeGeometries(glow) : null,
    }
    for (const p of parts) p.dispose()
    if (result.solid) { result.solid.computeBoundingBox(); result.solid.computeBoundingSphere() }
    if (result.glow) { result.glow.computeBoundingBox(); result.glow.computeBoundingSphere() }
    return result
  }

  // Place an assembled prop once (returns a group with its solid and glow meshes).
  function place(assembled, { x = 0, y = 0, z = 0, rotY = 0, scale = 1, shadow = false, parent = root, name } = {}) {
    const group = new THREE.Group()
    group.position.set(x, y, z)
    group.rotation.y = rotY
    group.scale.setScalar(scale)
    if (name) group.name = name
    if (assembled.solid) {
      const mesh = new THREE.Mesh(own(assembled.solid), vertexMaterial())
      mesh.castShadow = shadow
      mesh.receiveShadow = true
      group.add(mesh)
    }
    if (assembled.glow) group.add(new THREE.Mesh(own(assembled.glow), vertexMaterial({ basic: true })))
    parent.add(group)
    return group
  }

  // Many copies of one prop in one draw call (per solid/glow half).
  function scatter(assembled, { count, area, avoidArena = true, avoid = [], scale = [1, 1], rotY = [0, TAU], y = 0, surface = null, positions = null, parent = root, tilt = 0 }) {
    const transforms = []
    const tries = (positions ? positions.length : count) * 30
    // Horizontal footprint of one unscaled copy, so canopies and piles also stay off the arena.
    const bounds = (assembled.solid ?? assembled.glow)?.boundingBox
    const footprint = bounds ? Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x), Math.abs(bounds.min.z), Math.abs(bounds.max.z)) : 0
    for (let attempt = 0; transforms.length < (positions ? positions.length : count) && attempt < tries; attempt++) {
      const p = positions ? positions[transforms.length] : { x: range(area.x0, area.x1), z: range(area.z0, area.z1) }
      const s = p.scale ?? range(scale[0], scale[1])
      const reach = footprint * s + 0.5
      if (avoidArena && Math.abs(p.x) < ARENA.halfWidth + reach && Math.abs(p.z) < ARENA.halfDepth + reach) { if (positions) transforms.push(null); continue }
      if (avoid.some((zone) => p.x > zone.x0 - reach && p.x < zone.x1 + reach && p.z > zone.z0 - reach && p.z < zone.z1 + reach)) { if (positions) transforms.push(null); continue }
      const baseY = (p.y ?? y) + (surface ? surface(p.x, p.z) : 0)
      transforms.push(new THREE.Matrix4().compose(new THREE.Vector3(p.x, baseY, p.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt ? range(-tilt, tilt) : 0, p.rotY ?? range(rotY[0], rotY[1]), tilt ? range(-tilt, tilt) : 0)),
        new THREE.Vector3(s, s, s)))
    }
    const list = transforms.filter(Boolean)
    const group = new THREE.Group()
    for (const [geometry, mat] of [[assembled.solid, vertexMaterial()], [assembled.glow, vertexMaterial({ basic: true })]]) {
      if (!geometry || !list.length) continue
      const mesh = new THREE.InstancedMesh(own(geometry), mat, list.length)
      list.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingBox()
      mesh.computeBoundingSphere()
      mesh.receiveShadow = true
      group.add(mesh)
    }
    parent.add(group)
    return group
  }

  // Single mesh helper with its own material (for animated or special parts).
  function mesh(geometry, options = {}, transform = {}) {
    const m = new THREE.Mesh(own(geometry), options.isMaterial ? options : material(options))
    const { x = 0, y = 0, z = 0, rotX = 0, rotY = 0, rotZ = 0, scale = 1, parent = root, shadow = false } = transform
    m.position.set(x, y, z)
    m.rotation.set(rotX, rotY, rotZ)
    if (Array.isArray(scale)) m.scale.set(...scale)
    else m.scale.setScalar(scale)
    m.castShadow = shadow
    m.receiveShadow = !options.basic && !options.additive
    parent.add(m)
    return m
  }

  // ---------- environment ----------
  function sky({ top = 0x5aa8ff, horizon = 0xcfe8ff, bottom = null, exponent = 0.7, horizonBlur = 0,
    sun = null, moon = null, stars = 0, starColor = 0xffffff, clouds = null, nebula = null } = {}) {
    const uniforms = {
      topColor: { value: color(top) }, horizonColor: { value: color(horizon) }, bottomColor: { value: color(bottom ?? horizon) },
      exponent: { value: exponent }, horizonBlur: { value: horizonBlur },
    }
    const dome = new THREE.Mesh(own(new THREE.SphereGeometry(360, 48, 24)), own(new THREE.ShaderMaterial({
      uniforms, vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT, side: THREE.BackSide, depthWrite: false, fog: false,
    })))
    dome.renderOrder = -10
    dome.userData.sky = true
    root.add(dome)
    environment.background = color(horizon)
    const skyObjects = new THREE.Group()
    skyObjects.userData.sky = true
    root.add(skyObjects)
    const disc = (spec, fallbackColor) => {
      const dir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - (spec.elevation ?? 30)), THREE.MathUtils.degToRad(spec.azimuth ?? -20))
      const position = dir.multiplyScalar(spec.distance ?? 300)
      const coreMaterial = own(new THREE.SpriteMaterial({ map: glowMap(), color: spec.color ?? fallbackColor, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }))
      const core = new THREE.Sprite(coreMaterial)
      core.position.copy(position)
      core.scale.setScalar(spec.size ?? 30)
      skyObjects.add(core)
      if (spec.glow !== 0) {
        const halo = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: glowMap(), color: spec.glowColor ?? spec.color ?? fallbackColor, opacity: spec.glow ?? 0.45, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending })))
        halo.position.copy(position)
        halo.scale.setScalar((spec.size ?? 30) * 3.2)
        skyObjects.add(halo)
      }
      if (spec.solid) {
        const ball = new THREE.Mesh(own(new THREE.SphereGeometry((spec.size ?? 30) * 0.28, 24, 16)), material({ basic: true, color: spec.solid, fog: false }))
        ball.position.copy(position)
        skyObjects.add(ball)
      }
      return core
    }
    if (sun) disc(sun, 0xfff2c8)
    if (moon) disc({ glow: 0.25, ...moon, solid: moon.solid ?? moon.color ?? 0xe8eeff }, 0xe8eeff)
    if (stars) {
      const positions = new Float32Array(stars * 3)
      for (let i = 0; i < stars; i++) {
        const v = new THREE.Vector3().setFromSphericalCoords(330, Math.acos(range(0.08, 1)), range(0, TAU))
        positions.set([v.x, v.y, v.z], i * 3)
      }
      const geometry = own(new THREE.BufferGeometry())
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const points = new THREE.Points(geometry, own(new THREE.PointsMaterial({ color: starColor, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9, depthWrite: false })))
      skyObjects.add(points)
      updaters.push((t) => { points.material.opacity = 0.75 + Math.sin(t * 0.7) * 0.15 })
    }
    if (nebula) {
      for (const cloud of nebula) {
        const sprite = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: glowMap(), color: cloud.color, opacity: cloud.opacity ?? 0.35, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending })))
        const dir = new THREE.Vector3().setFromSphericalCoords(320, THREE.MathUtils.degToRad(90 - (cloud.elevation ?? 30)), THREE.MathUtils.degToRad(cloud.azimuth ?? 0))
        sprite.position.copy(dir)
        sprite.scale.set(cloud.width ?? 180, cloud.height ?? 90, 1)
        skyObjects.add(sprite)
      }
    }
    if (clouds) cloudLayer(clouds, skyObjects)
    return dome
  }

  // Low-poly cloud puffs drifting slowly across the far sky.
  function cloudLayer({ count = 10, color: hex = 0xffffff, shade = null, opacity = 0.95, height = [35, 70], distance = [140, 250], spread = 260, speed = 0.6, flat = 0.45 } = {}, parent = root) {
    const parts = []
    for (let c = 0; c < 5; c++) {
      const r = range(0.7, 1.3)
      parts.push(part(new THREE.IcosahedronGeometry(r, 1), c % 2 && shade ? shade : hex, { position: [range(-1.4, 1.4), range(-0.2, 0.3), range(-0.4, 0.4)], scale: [1.4, flat * 1.6, 1] }))
    }
    const puff = assemble(parts)
    const cloudMaterial = own(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: opacity < 1, opacity, fog: false, depthWrite: false }))
    const mesh = new THREE.InstancedMesh(own(puff.solid), cloudMaterial, count)
    const items = []
    for (let i = 0; i < count; i++) {
      items.push({ x: range(-spread / 2, spread / 2), y: range(height[0], height[1]), z: -range(distance[0], distance[1]), s: range(5, 12) })
    }
    const matrix = new THREE.Matrix4()
    const write = (t) => {
      items.forEach((item, i) => {
        const x = ((item.x + t * speed + spread / 2) % spread + spread) % spread - spread / 2
        matrix.compose(new THREE.Vector3(x, item.y, item.z), new THREE.Quaternion(), new THREE.Vector3(item.s * 1.6, item.s, item.s))
        mesh.setMatrixAt(i, matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    write(0)
    mesh.frustumCulled = false
    mesh.userData.sky = true
    parent.add(mesh)
    updaters.push(write)
    return mesh
  }

  function fog({ color: hex = 0xcfe8ff, near = 40, far = 220 } = {}) {
    // The fighters stand ~19 m from the camera; fog never starts before the arena.
    environment.fog = new THREE.Fog(hex, Math.max(28, near), Math.max(near + 10, far))
    return environment.fog
  }

  function lights({ sky: skyColor = 0xe6f7ff, ground = 0x6b7a58, hemi = 1.6, sun = {}, rim = {}, ambient = 0 } = {}) {
    const hemisphere = new THREE.HemisphereLight(skyColor, ground, hemi)
    const key = new THREE.DirectionalLight(sun.color ?? 0xfff1d6, sun.intensity ?? 2.6)
    key.position.set(...(sun.direction ?? [-6, 12, 8]))
    key.castShadow = sun.shadow !== false
    key.shadow.mapSize.set(1024, 1024)
    Object.assign(key.shadow.camera, { left: -16, right: 16, top: 10, bottom: -10, near: 1, far: 60 })
    key.shadow.bias = -0.0006
    key.shadow.normalBias = 0.03
    key.target.position.set(0, 0, 0)
    const back = new THREE.DirectionalLight(rim.color ?? 0x88ccff, rim.intensity ?? 1.2)
    back.position.set(...(rim.direction ?? [5, 6, -8]))
    environment.lights = [hemisphere, key, key.target, back]
    if (ambient) environment.lights.push(new THREE.AmbientLight(0xffffff, ambient))
    for (const light of environment.lights) root.add(light)
    return { hemisphere, sun: key, rim: back }
  }

  // Small coloured point light for a lantern, lava pool or crystal (use sparingly: ≤ 4 per map).
  function pointLight({ x = 0, y = 2, z = -8, color: hex = 0xffc27a, intensity = 20, distance = 18, flicker = 0 } = {}) {
    const light = new THREE.PointLight(hex, intensity, distance, 2)
    light.position.set(x, y, z)
    root.add(light)
    if (flicker) {
      const phase = range(0, TAU)
      updaters.push((t) => { light.intensity = intensity * (1 - flicker * 0.5 + Math.sin(t * 9 + phase) * flicker * 0.25 + Math.sin(t * 23 + phase) * flicker * 0.25) })
    }
    return light
  }

  // Terrain: a wide plane, flat across the arena, with relief rising outside it.
  function ground({ color: hex = 0x5f9a47, color2 = null, detail = 'grass', relief = 3, reliefScale = 0.035, backRise = 0, sideRise = 0, sink = 0,
    size = [300, 240], segments = [150, 110], z0 = 40, noiseSeed = 5, repeat = 0.25, roughness = 0.95, metalness = 0, height = null, emissive = 0x000000 } = {}) {
    const [width, depth] = size
    const geometry = new THREE.PlaneGeometry(width, depth, segments[0], segments[1])
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(0, 0, z0 - depth / 2)
    const position = geometry.attributes.position
    const colors = new Float32Array(position.count * 3)
    const c1 = color(hex), c2 = color(color2 ?? hex)
    const uv = geometry.attributes.uv
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), z = position.getZ(i)
      const d = Math.max(Math.abs(x) / (ARENA.halfWidth + 2), Math.abs(z) / (ARENA.halfDepth + 2))
      const mask = smoothstep(1, 2.4, d)
      let y = height ? height(x, z) * mask
        : (fbm(x * reliefScale, z * reliefScale, noiseSeed) - 0.35) * relief * mask
      if (!height) {
        y += backRise * smoothstep(-8, -80, z) * (0.6 + 0.4 * fbm(x * 0.02, z * 0.02, noiseSeed + 3))
        y += sideRise * smoothstep(14, 60, Math.abs(x)) * smoothstep(20, -20, z)
        y -= sink * smoothstep(8, 30, z)
      }
      position.setY(i, y)
      const n = fbm(x * 0.08, z * 0.08, noiseSeed + 9, 3)
      const blend = Math.min(1, Math.max(0, n * 1.6 - 0.3))
      colors[i * 3] = c1.r + (c2.r - c1.r) * blend
      colors[i * 3 + 1] = c1.g + (c2.g - c1.g) * blend
      colors[i * 3 + 2] = c1.b + (c2.b - c1.b) * blend
      uv.setXY(i, x * repeat, z * repeat)
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.computeVertexNormals()
    const map = texture(`detail:${detail}`, () => detailTexture(detail))
    const terrain = new THREE.Mesh(own(geometry), own(new THREE.MeshStandardMaterial({ vertexColors: true, map, roughness, metalness, emissive, flatShading: false })))
    terrain.receiveShadow = true
    terrain.userData.arena = true
    terrain.name = 'terrain'
    root.add(terrain)
    // Height lookup so props can sit on the terrain.
    const sampler = (x, z) => {
      const d = Math.max(Math.abs(x) / (ARENA.halfWidth + 2), Math.abs(z) / (ARENA.halfDepth + 2))
      const mask = smoothstep(1, 2.4, d)
      if (height) return height(x, z) * mask
      let y = (fbm(x * reliefScale, z * reliefScale, noiseSeed) - 0.35) * relief * mask
      y += backRise * smoothstep(-8, -80, z) * (0.6 + 0.4 * fbm(x * 0.02, z * 0.02, noiseSeed + 3))
      y += sideRise * smoothstep(14, 60, Math.abs(x)) * smoothstep(20, -20, z)
      y -= sink * smoothstep(8, 30, z)
      return y
    }
    terrain.userData.heightAt = sampler
    kit.heightAt = sampler
    return terrain
  }

  // A distinct battle pad (plaza, stage, platform) laid over the arena.
  function floor({ shape = 'rect', width = 26, depth = 9, radius = 11, color: hex = 0x8a8f99, color2 = null, detail = 'tiles', repeat = 0.35, y = 0.02, border = null, borderColor = 0x555a66, emissive = 0x000000, emissiveIntensity = 1, metalness = 0, roughness = 0.9, opacity = 1 } = {}) {
    const geometry = shape === 'disc' ? new THREE.CircleGeometry(radius, 64) : new THREE.PlaneGeometry(width, depth, 1, 1)
    geometry.rotateX(-Math.PI / 2)
    const uv = geometry.attributes.uv
    const position = geometry.attributes.position
    const colors = new Float32Array(position.count * 3)
    const c1 = color(hex), c2 = color(color2 ?? hex)
    for (let i = 0; i < position.count; i++) {
      uv.setXY(i, position.getX(i) * repeat, position.getZ(i) * repeat)
      const t = hash2(Math.round(position.getX(i) * 3), Math.round(position.getZ(i) * 3), 5)
      colors[i * 3] = c1.r + (c2.r - c1.r) * t; colors[i * 3 + 1] = c1.g + (c2.g - c1.g) * t; colors[i * 3 + 2] = c1.b + (c2.b - c1.b) * t
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const pad = new THREE.Mesh(own(geometry), own(new THREE.MeshStandardMaterial({ vertexColors: true, map: texture(`detail:${detail}`, () => detailTexture(detail)),
      emissive, emissiveIntensity, metalness, roughness, transparent: opacity < 1, opacity, polygonOffset: true, polygonOffsetFactor: -2 })))
    pad.position.y = y
    pad.receiveShadow = true
    pad.userData.arena = true
    root.add(pad)
    if (border) {
      const edge = shape === 'disc'
        ? new THREE.TorusGeometry(radius, border, 6, 64)
        : (() => { const g = new THREE.BoxGeometry(width + border * 2, border * 1.2, depth + border * 2); return g })()
      if (shape === 'disc') edge.rotateX(Math.PI / 2)
      const edgeMesh = new THREE.Mesh(own(edge), material({ color: borderColor }))
      edgeMesh.position.y = shape === 'disc' ? y : y - border * 0.55
      edgeMesh.receiveShadow = true
      edgeMesh.userData.arena = true
      root.add(edgeMesh)
    }
    return pad
  }

  // Animated water / lava / sludge / data surface.
  function water({ y = -0.4, color: hex = 0x2f7fbf, deep = null, opacity = 0.85, area = { x0: -150, x1: 150, z0: -160, z1: -8 }, waves = 0.18, speed = 1, emissive = 0x000000, emissiveIntensity = 0, shininess = 0.2, detail = null } = {}) {
    const w = area.x1 - area.x0, d = area.z1 - area.z0
    const geometry = new THREE.PlaneGeometry(w, d, Math.min(160, Math.ceil(w / 2)), Math.min(120, Math.ceil(d / 2)))
    geometry.rotateX(-Math.PI / 2)
    geometry.translate((area.x0 + area.x1) / 2, 0, (area.z0 + area.z1) / 2)
    const position = geometry.attributes.position
    const base = Float32Array.from(position.array)
    const colors = new Float32Array(position.count * 3)
    const c1 = color(hex), c2 = color(deep ?? hex)
    for (let i = 0; i < position.count; i++) {
      const t = smoothstep(0, 1, (area.z1 - position.getZ(i)) / Math.max(1, d) * 2.5)
      colors[i * 3] = c1.r + (c2.r - c1.r) * t; colors[i * 3 + 1] = c1.g + (c2.g - c1.g) * t; colors[i * 3 + 2] = c1.b + (c2.b - c1.b) * t
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const surface = new THREE.Mesh(own(geometry), own(new THREE.MeshStandardMaterial({
      vertexColors: true, transparent: opacity < 1, opacity, roughness: 1 - shininess, metalness: 0.1, emissive, emissiveIntensity, flatShading: true,
      map: detail ? texture(`detail:${detail}`, () => detailTexture(detail)) : null,
    })))
    surface.position.y = y
    surface.receiveShadow = true
    surface.userData.arena = true
    surface.name = 'water'
    root.add(surface)
    if (waves > 0) {
      let frame = 0
      updaters.push((t) => {
        if (++frame % 2) return // half-rate is plenty for gentle waves
        const array = position.array
        for (let i = 0; i < position.count; i++) {
          const x = base[i * 3], z = base[i * 3 + 2]
          array[i * 3 + 1] = (Math.sin(x * 0.35 + t * 1.3 * speed) + Math.sin(z * 0.42 - t * 1.1 * speed) * 0.7 + Math.sin((x + z) * 0.9 + t * 2.1 * speed) * 0.25) * waves
        }
        position.needsUpdate = true
        geometry.computeVertexNormals()
      })
    }
    return surface
  }

  // ---------- backdrops (far silhouettes) ----------
  function mountains({ count = 9, distance = [90, 170], height = [25, 60], width = [30, 70], color: hex = 0x5c7390, color2 = null, snow = null, snowLine = 0.72, spread = 360, zOffset = 0, sharp = 0.5, seed: localSeed = 7 } = {}) {
    const parts = []
    for (let i = 0; i < count; i++) {
      const h = range(height[0], height[1]), r = range(width[0], width[1]) / 2
      const x = -spread / 2 + (spread * (i + range(0.2, 0.8))) / count
      const z = -range(distance[0], distance[1]) + zOffset
      const cone = new THREE.ConeGeometry(r, h, 7 + Math.floor(range(0, 4)), 4)
      const p = cone.attributes.position
      for (let v = 0; v < p.count; v++) {
        const vy = p.getY(v)
        if (vy < h / 2 - 0.01) {
          const n = (valueNoise(p.getX(v) * 0.2 + i * 7, p.getZ(v) * 0.2, localSeed) - 0.5) * r * (1 - sharp) * 0.8
          p.setX(v, p.getX(v) + n); p.setZ(v, p.getZ(v) + n * 0.6)
        }
      }
      parts.push(part(cone, i % 2 && color2 ? color2 : hex, { position: [x, h / 2 - 2, z] }))
      if (snow) parts.push(part(new THREE.ConeGeometry(r * (1 - snowLine) * 1.08, h * (1 - snowLine), 8, 1), snow, { position: [x, h - h * (1 - snowLine) / 2 - 2 + 0.05, z] }))
    }
    return place(assemble(parts), { name: 'mountains' })
  }

  function skyline({ count = 24, distance = [70, 130], height = [10, 45], width = [5, 14], color: hex = 0x2a3550, windows = 0xffd88a, windowDensity = 0.35, spread = 300 } = {}) {
    const parts = []
    for (let i = 0; i < count; i++) {
      const h = range(height[0], height[1]), w = range(width[0], width[1]), d = range(width[0], width[1])
      const x = -spread / 2 + (spread * (i + range(0.1, 0.9))) / count
      const z = -range(distance[0], distance[1])
      parts.push(part(new THREE.BoxGeometry(w, h, d), hex, { position: [x, h / 2 - 1, z] }))
      if (windows) {
        for (let k = 0; k < Math.floor(h / 3); k++) {
          if (random() > windowDensity) continue
          parts.push(part(new THREE.PlaneGeometry(w * 0.8, 0.9), windows, { position: [x, 2 + k * 3 - 1, z + d / 2 + 0.05], emissive: true }))
        }
      }
    }
    return place(assemble(parts), { name: 'skyline' })
  }

  function treeLine({ count = 60, distance = [45, 80], height = [6, 14], color: hex = 0x2f5a35, trunk = 0x4a3526, spread = 260, kind = 'round' } = {}) {
    const proto = tree(kind, { height: 1, leaves: hex, trunk })
    return scatter(proto, { count, area: { x0: -spread / 2, x1: spread / 2, z0: -distance[1], z1: -distance[0] }, scale: height, avoidArena: false, surface: kit.heightAt })
  }

  // ---------- prop factories (return assembled geometry; place() or scatter() it) ----------
  function tree(kind = 'round', { height = 5, leaves = 0x3f8a3c, leaves2 = null, trunk = 0x6a4a32, blossom = null } = {}) {
    const h = height
    const parts = []
    switch (kind) {
      case 'conifer':
        parts.push(part(new THREE.CylinderGeometry(h * 0.04, h * 0.06, h * 0.3, 6), trunk, { position: [0, h * 0.15, 0] }))
        for (let i = 0; i < 3; i++) parts.push(part(new THREE.ConeGeometry(h * (0.3 - i * 0.07), h * 0.42, 7), i % 2 && leaves2 ? leaves2 : leaves, { position: [0, h * (0.38 + i * 0.2), 0] }))
        break
      case 'palm': {
        const segments = 5
        for (let i = 0; i < segments; i++) parts.push(part(new THREE.CylinderGeometry(h * 0.04, h * 0.05, h * 0.2, 6), trunk, { position: [h * 0.03 * i, h * (0.1 + i * 0.18), 0], rotation: [0, 0, -0.08 * i] }))
        for (let i = 0; i < 7; i++) parts.push(part(new THREE.ConeGeometry(h * 0.07, h * 0.55, 4), leaves, { position: [h * 0.15 + Math.cos(i / 7 * TAU) * h * 0.2, h * 0.92, Math.sin(i / 7 * TAU) * h * 0.2], rotation: [Math.sin(i / 7 * TAU) * 1.2, 0, -Math.cos(i / 7 * TAU) * 1.2 + Math.PI / 2 * 0], scale: [1, 1, 0.25] }))
        break
      }
      case 'dead':
        parts.push(part(new THREE.CylinderGeometry(h * 0.03, h * 0.07, h * 0.75, 5), trunk, { position: [0, h * 0.37, 0] }))
        for (let i = 0; i < 4; i++) parts.push(part(new THREE.CylinderGeometry(h * 0.01, h * 0.03, h * 0.4, 4), trunk, { position: [Math.cos(i * 1.7) * h * 0.12, h * (0.55 + i * 0.08), Math.sin(i * 1.7) * h * 0.12], rotation: [Math.sin(i * 1.7) * 0.9, 0, -Math.cos(i * 1.7) * 0.9] }))
        break
      case 'mushroom':
        parts.push(part(new THREE.CylinderGeometry(h * 0.08, h * 0.12, h * 0.6, 8), trunk, { position: [0, h * 0.3, 0] }))
        parts.push(part(new THREE.SphereGeometry(h * 0.4, 10, 6, 0, TAU, 0, Math.PI / 2), leaves, { position: [0, h * 0.55, 0], scale: [1, 0.7, 1] }))
        if (leaves2) for (let i = 0; i < 5; i++) parts.push(part(new THREE.SphereGeometry(h * 0.05, 5, 4), leaves2, { position: [Math.cos(i * 1.3) * h * 0.25, h * 0.78, Math.sin(i * 1.3) * h * 0.25] }))
        break
      case 'bamboo':
        for (let i = 0; i < 3; i++) {
          const ox = (i - 1) * h * 0.08
          parts.push(part(new THREE.CylinderGeometry(h * 0.02, h * 0.025, h, 6), leaves, { position: [ox, h / 2, (i % 2) * h * 0.06] }))
          parts.push(part(new THREE.ConeGeometry(h * 0.1, h * 0.25, 4), leaves2 ?? leaves, { position: [ox, h * 0.95, (i % 2) * h * 0.06], scale: [1, 1, 0.3] }))
        }
        break
      case 'willow':
        parts.push(part(new THREE.CylinderGeometry(h * 0.05, h * 0.08, h * 0.55, 6), trunk, { position: [0, h * 0.27, 0] }))
        parts.push(part(new THREE.SphereGeometry(h * 0.35, 8, 6), leaves, { position: [0, h * 0.7, 0], scale: [1, 0.8, 1] }))
        for (let i = 0; i < 8; i++) parts.push(part(new THREE.ConeGeometry(h * 0.08, h * 0.55, 4), leaves2 ?? leaves, { position: [Math.cos(i / 8 * TAU) * h * 0.3, h * 0.42, Math.sin(i / 8 * TAU) * h * 0.3], rotation: [Math.PI, 0, 0] }))
        break
      case 'crystal':
        for (let i = 0; i < 4; i++) parts.push(part(new THREE.OctahedronGeometry(h * (0.25 - i * 0.04), 0), leaves, { position: [Math.cos(i * 2) * h * 0.12, h * (0.3 + i * 0.12), Math.sin(i * 2) * h * 0.12], scale: [0.5, 1.6, 0.5], rotation: [0, i, (i - 1.5) * 0.2], emissive: Boolean(blossom) }))
        break
      default: { // round broadleaf
        parts.push(part(new THREE.CylinderGeometry(h * 0.05, h * 0.08, h * 0.5, 6), trunk, { position: [0, h * 0.25, 0] }))
        parts.push(part(new THREE.IcosahedronGeometry(h * 0.33, 0), leaves, { position: [0, h * 0.65, 0] }))
        parts.push(part(new THREE.IcosahedronGeometry(h * 0.24, 0), leaves2 ?? leaves, { position: [h * 0.18, h * 0.55, h * 0.05] }))
        parts.push(part(new THREE.IcosahedronGeometry(h * 0.22, 0), leaves2 ?? leaves, { position: [-h * 0.16, h * 0.58, -h * 0.06] }))
        if (blossom) for (let i = 0; i < 6; i++) parts.push(part(new THREE.IcosahedronGeometry(h * 0.08, 0), blossom, { position: [Math.cos(i) * h * 0.28, h * (0.6 + (i % 3) * 0.1), Math.sin(i) * h * 0.28] }))
      }
    }
    return assemble(parts)
  }

  function rock({ size = 1, color: hex = 0x7d7a74, color2 = null, jag = 0.35, flatten = 0.7, detail = 0 } = {}) {
    const geometry = new THREE.DodecahedronGeometry(size, detail)
    const p = geometry.attributes.position
    const seedOffset = range(0, 100)
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i))
      const n = 1 + (valueNoise(v.x * 2 + seedOffset, v.z * 2 + v.y, 3) - 0.5) * jag * 2
      p.setXYZ(i, v.x * n, v.y * n * flatten, v.z * n)
    }
    const parts = [part(geometry, hex, { position: [0, size * flatten * 0.45, 0] })]
    if (color2) parts.push(part(new THREE.DodecahedronGeometry(size * 0.45, 0), color2, { position: [size * 0.5, size * 0.2, size * 0.2] }))
    return assemble(parts)
  }

  function grassTuft({ color: hex = 0x5fa64a, color2 = null, height = 0.5, blades = 5 } = {}) {
    const parts = []
    for (let i = 0; i < blades; i++) parts.push(part(new THREE.ConeGeometry(height * 0.08, height, 3), i % 2 && color2 ? color2 : hex, { position: [Math.cos(i * 2.4) * height * 0.15, height / 2, Math.sin(i * 2.4) * height * 0.15], rotation: [Math.sin(i) * 0.25, 0, Math.cos(i) * 0.25] }))
    return assemble(parts)
  }

  function flower({ color: hex = 0xff7aa8, center = 0xffe066, stem = 0x4c9a3f, height = 0.35 } = {}) {
    return assemble([
      part(new THREE.CylinderGeometry(0.015, 0.02, height, 4), stem, { position: [0, height / 2, 0] }),
      part(new THREE.IcosahedronGeometry(height * 0.2, 0), hex, { position: [0, height, 0], scale: [1, 0.45, 1] }),
      part(new THREE.IcosahedronGeometry(height * 0.08, 0), center, { position: [0, height + height * 0.05, 0] }),
    ])
  }

  function house({ width = 4, depth = 4, height = 3, wall = 0xe8d9b8, roof = 0xb5483a, roofType = 'gable', door = 0x6a4028, windows = 0xffd88a, trim = null, glowWindows = false } = {}) {
    const parts = [part(new THREE.BoxGeometry(width, height, depth), wall, { position: [0, height / 2, 0] })]
    if (trim) parts.push(part(new THREE.BoxGeometry(width + 0.1, 0.25, depth + 0.1), trim, { position: [0, height, 0] }))
    const roofHeight = Math.min(width, depth) * 0.55
    if (roofType === 'gable') {
      const prism = new THREE.CylinderGeometry(roofHeight * 0.001, depth * 0.72, roofHeight, 4, 1)
      parts.push(part(prism, roof, { position: [0, height + roofHeight / 2, 0], rotation: [0, Math.PI / 4, 0], scale: [width / depth * 1.05, 1, 1.05] }))
    } else if (roofType === 'cone') {
      parts.push(part(new THREE.ConeGeometry(Math.max(width, depth) * 0.75, roofHeight * 1.4, 8), roof, { position: [0, height + roofHeight * 0.7, 0] }))
    } else if (roofType === 'pagoda') {
      parts.push(part(new THREE.CylinderGeometry(width * 0.35, width * 0.85, roofHeight * 0.6, 4), roof, { position: [0, height + roofHeight * 0.3, 0], rotation: [0, Math.PI / 4, 0] }))
      parts.push(part(new THREE.ConeGeometry(width * 0.4, roofHeight * 0.6, 4), roof, { position: [0, height + roofHeight * 0.85, 0], rotation: [0, Math.PI / 4, 0] }))
    } else if (roofType === 'dome') {
      parts.push(part(new THREE.SphereGeometry(Math.min(width, depth) * 0.5, 12, 6, 0, TAU, 0, Math.PI / 2), roof, { position: [0, height, 0] }))
    } else {
      parts.push(part(new THREE.BoxGeometry(width + 0.2, 0.3, depth + 0.2), roof, { position: [0, height + 0.15, 0] }))
    }
    if (door) parts.push(part(new THREE.BoxGeometry(width * 0.22, height * 0.5, 0.1), door, { position: [0, height * 0.25, depth / 2 + 0.03] }))
    if (windows) {
      parts.push(part(new THREE.BoxGeometry(width * 0.18, height * 0.2, 0.08), windows, { position: [-width * 0.3, height * 0.6, depth / 2 + 0.03], emissive: glowWindows }))
      parts.push(part(new THREE.BoxGeometry(width * 0.18, height * 0.2, 0.08), windows, { position: [width * 0.3, height * 0.6, depth / 2 + 0.03], emissive: glowWindows }))
    }
    return assemble(parts)
  }

  function tower({ radius = 1.5, height = 10, color: hex = 0xcfc6b8, roof = 0x5a4a8a, roofType = 'cone', bands = 0x9a8f80, windows = 0x2a2a3a, glowWindows = false, segments = 10 } = {}) {
    const parts = [part(new THREE.CylinderGeometry(radius * 0.9, radius, height, segments), hex, { position: [0, height / 2, 0] })]
    if (bands) for (let i = 1; i < 4; i++) parts.push(part(new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, 0.25, segments), bands, { position: [0, height * i / 4, 0] }))
    if (roofType === 'cone') parts.push(part(new THREE.ConeGeometry(radius * 1.35, radius * 2.4, segments), roof, { position: [0, height + radius * 1.2, 0] }))
    else if (roofType === 'battlement') for (let i = 0; i < 8; i++) parts.push(part(new THREE.BoxGeometry(radius * 0.4, radius * 0.45, radius * 0.4), roof, { position: [Math.cos(i / 8 * TAU) * radius * 0.95, height + radius * 0.22, Math.sin(i / 8 * TAU) * radius * 0.95] }))
    else if (roofType === 'dome') parts.push(part(new THREE.SphereGeometry(radius, segments, 6, 0, TAU, 0, Math.PI / 2), roof, { position: [0, height, 0] }))
    if (windows) for (let i = 0; i < 3; i++) parts.push(part(new THREE.BoxGeometry(radius * 0.35, radius * 0.6, 0.1), windows, { position: [0, height * (0.35 + i * 0.22), radius * 0.93], emissive: glowWindows }))
    return assemble(parts)
  }

  function pillar({ radius = 0.6, height = 6, color: hex = 0xd8d0c0, capital = null, broken = 0, fluted = true } = {}) {
    const h = height * (1 - broken)
    const parts = [
      part(new THREE.BoxGeometry(radius * 2.6, radius * 0.6, radius * 2.6), capital ?? hex, { position: [0, radius * 0.3, 0] }),
      part(new THREE.CylinderGeometry(radius, radius * 1.05, h, fluted ? 12 : 8), hex, { position: [0, radius * 0.6 + h / 2, 0] }),
    ]
    if (!broken) parts.push(part(new THREE.BoxGeometry(radius * 2.6, radius * 0.6, radius * 2.6), capital ?? hex, { position: [0, radius * 0.9 + h, 0] }))
    return assemble(parts)
  }

  function arch({ width = 6, height = 6, thickness = 1, color: hex = 0xcfc3ad, keystone = null } = {}) {
    const r = width / 2
    const parts = [
      part(new THREE.BoxGeometry(thickness, height - r, thickness), hex, { position: [-r, (height - r) / 2, 0] }),
      part(new THREE.BoxGeometry(thickness, height - r, thickness), hex, { position: [r, (height - r) / 2, 0] }),
      part(new THREE.TorusGeometry(r, thickness / 2, 6, 16, Math.PI), hex, { position: [0, height - r, 0] }),
    ]
    if (keystone) parts.push(part(new THREE.BoxGeometry(thickness * 0.9, thickness * 1.1, thickness * 1.1), keystone, { position: [0, height, 0] }))
    return assemble(parts)
  }

  function torii({ width = 6, height = 6, color: hex = 0xc9352b, top = 0x2a2220 } = {}) {
    return assemble([
      part(new THREE.CylinderGeometry(0.28, 0.32, height, 10), hex, { position: [-width / 2, height / 2, 0] }),
      part(new THREE.CylinderGeometry(0.28, 0.32, height, 10), hex, { position: [width / 2, height / 2, 0] }),
      part(new THREE.BoxGeometry(width + 1.8, 0.45, 0.6), top, { position: [0, height + 0.2, 0] }),
      part(new THREE.BoxGeometry(width + 1.2, 0.35, 0.45), hex, { position: [0, height - 0.5, 0] }),
      part(new THREE.BoxGeometry(width + 0.4, 0.3, 0.35), hex, { position: [0, height * 0.72, 0] }),
    ])
  }

  function lantern({ height = 1.6, body = 0x3a3028, light = 0xffc27a, style = 'post' } = {}) {
    if (style === 'stone') return assemble([
      part(new THREE.CylinderGeometry(0.35, 0.45, height * 0.35, 6), body, { position: [0, height * 0.17, 0] }),
      part(new THREE.CylinderGeometry(0.12, 0.15, height * 0.3, 6), body, { position: [0, height * 0.5, 0] }),
      part(new THREE.BoxGeometry(0.42, 0.34, 0.42), light, { position: [0, height * 0.75, 0], emissive: true }),
      part(new THREE.ConeGeometry(0.45, 0.35, 4), body, { position: [0, height * 0.95, 0], rotation: [0, Math.PI / 4, 0] }),
    ])
    return assemble([
      part(new THREE.CylinderGeometry(0.06, 0.08, height, 6), body, { position: [0, height / 2, 0] }),
      part(new THREE.BoxGeometry(0.34, 0.4, 0.34), light, { position: [0, height + 0.18, 0], emissive: true }),
      part(new THREE.ConeGeometry(0.3, 0.22, 4), body, { position: [0, height + 0.48, 0], rotation: [0, Math.PI / 4, 0] }),
    ])
  }

  function tombstone({ color: hex = 0x8d8f95, style = 'round', height = 1.2 } = {}) {
    if (style === 'cross') return assemble([
      part(new THREE.BoxGeometry(0.22, height, 0.2), hex, { position: [0, height / 2, 0] }),
      part(new THREE.BoxGeometry(0.75, 0.2, 0.2), hex, { position: [0, height * 0.7, 0] }),
      part(new THREE.BoxGeometry(0.6, 0.18, 0.5), hex, { position: [0, 0.09, 0] }),
    ])
    return assemble([
      part(new THREE.BoxGeometry(0.8, height * 0.75, 0.22), hex, { position: [0, height * 0.375, 0] }),
      part(new THREE.CylinderGeometry(0.4, 0.4, 0.22, 12, 1, false, 0, Math.PI), hex, { position: [0, height * 0.75, 0], rotation: [Math.PI / 2, 0, Math.PI / 2] }),
      part(new THREE.BoxGeometry(1, 0.16, 0.5), hex, { position: [0, 0.08, 0.1] }),
    ])
  }

  function fence({ length = 6, height = 1, color: hex = 0x8a6440, posts = 5, style = 'wood' } = {}) {
    const parts = []
    for (let i = 0; i < posts; i++) parts.push(part(new THREE.BoxGeometry(0.14, height, 0.14), hex, { position: [-length / 2 + (length * i) / (posts - 1), height / 2, 0] }))
    const rails = style === 'wood' ? [0.35, 0.75] : [0.9]
    for (const r of rails) parts.push(part(new THREE.BoxGeometry(length, 0.09, 0.07), hex, { position: [0, height * r, 0] }))
    return assemble(parts)
  }

  function crystal({ height = 2, color: hex = 0x7fe3ff, glow = true, cluster = 4 } = {}) {
    const parts = []
    for (let i = 0; i < cluster; i++) {
      const h = height * (1 - i * 0.18)
      parts.push(part(new THREE.OctahedronGeometry(1, 0), hex, { position: [Math.cos(i * 2.3) * height * 0.18 * (i > 0), h * 0.45, Math.sin(i * 2.3) * height * 0.18 * (i > 0)], scale: [h * 0.18, h * 0.55, h * 0.18], rotation: [(i ? Math.cos(i * 2.3) : 0) * 0.4, i, (i ? Math.sin(i * 2.3) : 0) * 0.4], emissive: glow }))
    }
    return assemble(parts)
  }

  function gear({ radius = 2, teeth = 12, thickness = 0.5, color: hex = 0x9a8f7a, hub = 0x5c5448 } = {}) {
    const parts = [part(new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, thickness, Math.max(12, teeth * 2)), hex, { rotation: [Math.PI / 2, 0, 0] })]
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * TAU
      parts.push(part(new THREE.BoxGeometry(radius * 0.26, radius * 0.3, thickness), hex, { position: [Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9, 0], rotation: [0, 0, a] }))
    }
    parts.push(part(new THREE.CylinderGeometry(radius * 0.25, radius * 0.25, thickness * 1.4, 10), hub, { rotation: [Math.PI / 2, 0, 0] }))
    return assemble(parts)
  }

  // A standalone gear that spins (separate mesh so it can animate).
  function spinningGear(options = {}, { x = 0, y = 3, z = -10, rotY = 0, speed = 0.3, axis = 'z' } = {}) {
    const g = place(gear(options), { x, y, z, rotY })
    updaters.push((t) => { g.children.forEach((child) => { child.rotation[axis] = t * speed }) })
    return g
  }

  function pipe(points, { radius = 0.35, color: hex = 0x6f7b85, segments = 40 } = {}) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
    return assemble([part(new THREE.TubeGeometry(curve, segments, radius, 8, false), hex)])
  }

  function planet({ radius = 12, color: hex = 0x7a5cff, ring = null, ringColor = 0xd8c8ff } = {}) {
    const parts = [part(new THREE.IcosahedronGeometry(radius, 2), hex)]
    if (ring) parts.push(part(new THREE.TorusGeometry(radius * ring, radius * 0.06, 4, 48), ringColor, { rotation: [Math.PI / 2.4, 0, 0.3], scale: [1, 1, 0.15] }))
    const assembled = assemble(parts)
    return assembled
  }

  function floatingIsland({ radius = 5, height = 6, top = 0x5d9a48, rock: rockColor = 0x7d6a58 } = {}) {
    return assemble([
      part(new THREE.CylinderGeometry(radius, radius * 0.95, 0.8, 9), top, { position: [0, 0, 0] }),
      part(new THREE.ConeGeometry(radius * 0.95, height, 9), rockColor, { position: [0, -height / 2 - 0.4, 0], rotation: [Math.PI, 0, 0] }),
    ])
  }

  // Additive glow sprite (lamps, crystal halos, magic).
  function glow({ x = 0, y = 2, z = -8, color: hex = 0xffc27a, size = 3, opacity = 0.8, pulse = 0 } = {}) {
    const sprite = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: glowMap(), color: hex, opacity, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })))
    sprite.position.set(x, y, z)
    sprite.scale.setScalar(size)
    root.add(sprite)
    if (pulse) {
      const phase = range(0, TAU)
      updaters.push((t) => { sprite.material.opacity = opacity * (1 - pulse * 0.5 + Math.sin(t * 2 + phase) * pulse * 0.5) })
    }
    return sprite
  }

  // ---------- particles ----------
  const PARTICLE_KINDS = {
    snow: { color: 0xffffff, size: 0.22, fall: 1.1, sway: 0.6, opacity: 0.95 },
    rain: { color: 0xb8d8ff, size: 0.12, fall: 14, sway: 0, opacity: 0.6 },
    embers: { color: 0xff8a3a, size: 0.2, fall: -1.4, sway: 0.5, opacity: 1, additive: true, flicker: true },
    ash: { color: 0x9a948c, size: 0.18, fall: 0.5, sway: 0.8, opacity: 0.8 },
    fireflies: { color: 0xd9ff7a, size: 0.25, fall: 0, sway: 0.9, opacity: 1, additive: true, flicker: true, wander: true },
    leaves: { color: 0xd98c3a, size: 0.3, fall: 1.2, sway: 1.6, opacity: 1 },
    petals: { color: 0xffb7d0, size: 0.26, fall: 0.9, sway: 1.4, opacity: 1 },
    bubbles: { color: 0xbfefff, size: 0.28, fall: -1.2, sway: 0.4, opacity: 0.7 },
    data: { color: 0x6affd8, size: 0.24, fall: -1.6, sway: 0, opacity: 1, additive: true, flicker: true },
    dust: { color: 0xe8d8b0, size: 0.14, fall: 0.15, sway: 0.5, opacity: 0.55, wander: true },
    spores: { color: 0xc9a0ff, size: 0.2, fall: -0.3, sway: 0.7, opacity: 0.9, additive: true, wander: true },
    sparkle: { color: 0xffffff, size: 0.22, fall: 0, sway: 0.2, opacity: 1, additive: true, flicker: true, wander: true },
  }
  function particles({ kind = 'dust', count = 200, area = { x0: -40, x1: 40, y0: 0, y1: 18, z0: -40, z1: 6 }, color: hex, size, speed = 1, opacity } = {}) {
    const style = PARTICLE_KINDS[kind] || PARTICLE_KINDS.dust
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = range(area.x0, area.x1)
      positions[i * 3 + 1] = range(area.y0, area.y1)
      positions[i * 3 + 2] = range(area.z0, area.z1)
      seeds[i] = range(0, TAU)
    }
    const geometry = own(new THREE.BufferGeometry())
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const points = new THREE.Points(geometry, own(new THREE.PointsMaterial({
      color: hex ?? style.color, size: size ?? style.size, map: glowMap(), transparent: true, opacity: opacity ?? style.opacity, depthWrite: false,
      blending: style.additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true,
    })))
    points.frustumCulled = false
    points.userData.arena = true
    root.add(points)
    const height = area.y1 - area.y0
    updaters.push((t, dt) => {
      const array = geometry.attributes.position.array
      for (let i = 0; i < count; i++) {
        const s = seeds[i]
        let y = array[i * 3 + 1] - style.fall * speed * dt * (0.7 + 0.6 * ((s * 7.3) % 1))
        if (y < area.y0) y += height
        if (y > area.y1) y -= height
        array[i * 3 + 1] = y
        array[i * 3] += Math.sin(t * 0.8 + s) * style.sway * dt
        if (style.wander) array[i * 3 + 2] += Math.cos(t * 0.6 + s * 1.7) * style.sway * dt * 0.7
      }
      geometry.attributes.position.needsUpdate = true
      if (style.flicker) points.material.opacity = (opacity ?? style.opacity) * (0.8 + Math.sin(t * 3.1) * 0.2)
    })
    return points
  }

  // Register a per-frame animation: fn(timeSeconds, deltaSeconds).
  const animate = (fn) => { updaters.push(fn) }

  function finish() {
    root.updateMatrixWorld(true)
    return {
      group: root,
      fog: environment.fog,
      background: environment.background,
      lights: environment.lights,
      update(t, dt) { for (const fn of updaters) fn(t, dt) },
      dispose() {
        root.removeFromParent()
        for (const thing of disposables) thing.dispose?.()
        disposables.clear()
      },
    }
  }

  const kit = {
    THREE, ARENA, root, random, range, pick, color, noise: valueNoise, fbm, smoothstep,
    heightAt: () => 0,
    material, part, assemble, place, scatter, mesh, own,
    sky, cloudLayer, fog, lights, pointLight, ground, floor, water,
    mountains, skyline, treeLine,
    tree, rock, grassTuft, flower, house, tower, pillar, arch, torii, lantern, tombstone, fence, crystal, gear, spinningGear, pipe, planet, floatingIsland,
    glow, particles, animate, finish,
  }
  return kit
}
