import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { CinematicBloomPass } from './CinematicBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { acquireModelAsset } from './sharedModelAssets.js'
import { warmCinematicRenderer } from './cinematicWarmup.js'
import { getRenderPixelRatio } from './renderResolution.js'
import { acquireCinematicSurface } from './cinematicSurface.js'
import { prepareModel } from './modelPreparation.js'
import { CLIP_ROLES, pickClip } from './battle3dMath.js'
import { getDigimonModel } from '../data/digimonModels.js'
import { getEvolutionDisplayHeight } from '../data/digimonSizes.js'
import { getVisibleModelBounds } from './modelParts.js'
import { disposeTrees, getEvolutionModelScale } from './EvolutionRenderer.js'
import { sampleCinematic, sampleCinematicCamera } from './cinematicTimeline.js'
import { createCinematicBackdrop } from './cinematicBackdrop.js'
import { createEvolutionCapsule } from './evolutionCapsules.js'
import { createEvolutionMotif, sampleXrosAssembly } from './evolutionMotifs.js'
import { fitCinematicCamera } from './cinematicFraming.js'

// Every texture here is drawn procedurally: the scenes re-stage anime choreography
// (stripes, data cocoons, helices, digimentals, code rings) without bundled artwork.
const TAU = Math.PI * 2
const WHITE = new THREE.Color('#ffffff')

function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvasTexture(width, height, draw, { repeat = false } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  draw(canvas.getContext('2d'), width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  if (repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}

const glowTexture = () => canvasTexture(128, 128, (ctx) => {
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(0.25, '#ffffffcc'); gradient.addColorStop(1, '#ffffff00')
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128)
})

const featherTexture = () => canvasTexture(128, 384, (ctx, w, h) => {
  const gradient = ctx.createLinearGradient(0, h, 0, 0)
  gradient.addColorStop(0, '#ffffffff'); gradient.addColorStop(1, '#ffffff22')
  ctx.fillStyle = gradient
  ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.quadraticCurveTo(-10, h * 0.45, w / 2, 0); ctx.quadraticCurveTo(w + 10, h * 0.45, w / 2, h); ctx.fill()
  ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 2
  for (let y = 30; y < h - 20; y += 22) { ctx.beginPath(); ctx.moveTo(w / 2, y + 14); ctx.lineTo(w * 0.15, y); ctx.moveTo(w / 2, y + 14); ctx.lineTo(w * 0.85, y); ctx.stroke() }
})

// An original three-blade warning sigil (not the anime's Digital Hazard artwork).
const hazardTexture = (color) => canvasTexture(256, 256, (ctx) => {
  ctx.translate(128, 128); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 12
  ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.stroke()
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.rotate(i * TAU / 3)
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(-30, -84); ctx.lineTo(30, -84); ctx.closePath(); ctx.fill()
    ctx.restore()
  }
  ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill()
})

const codeBandTexture = (color) => canvasTexture(1024, 64, (ctx, w, h) => {
  const random = seeded(11)
  ctx.font = 'bold 40px monospace'; ctx.fillStyle = color
  for (let x = 0; x < w; x += 26) { ctx.globalAlpha = 0.4 + random() * 0.6; ctx.fillText(random() < 0.5 ? '0' : '1', x, h - 14) }
}, { repeat: true })

const flameTexture = () => canvasTexture(256, 256, (ctx, w, h) => {
  const random = seeded(5)
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 140; i++) {
    const x = random() * w, y = random() * h, r = 8 + random() * 34
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, '#ffffffcc'); g.addColorStop(1, '#ffffff00')
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r * 2.4, r * 2, r * 4)
  }
}, { repeat: true })

const hexTexture = (color) => canvasTexture(512, 512, (ctx) => {
  ctx.translate(256, 256); ctx.strokeStyle = color; ctx.lineWidth = 3
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath()
    for (let i = 0; i <= 6; i++) { const a = i * TAU / 6, r = ring * 58; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r) }
    ctx.stroke()
  }
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 240, Math.sin(a) * 240); ctx.stroke() }
})

const additive = (color, opacity = 1, extra = {}) => new THREE.MeshBasicMaterial({
  color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, ...extra,
})

export class CinematicEvolutionRenderer {
  constructor(host, { cinematic, reducedMotion = false, onError = () => {} } = {}) {
    this.host = host
    this.cinematic = cinematic
    this.reducedMotion = reducedMotion
    this.disposed = false
    this.assets = []
    this.actors = []
    this.extraTextures = []
    this.palette = cinematic.palette.map((value) => new THREE.Color(value))
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(new THREE.Color(cinematic.palette[2]).multiplyScalar(0.12), 0.035)
    this.camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 90)
    this.surface = acquireCinematicSurface(host, { antialias: true, alpha: false, powerPreference: 'low-power' })
    this.renderer = this.surface.renderer
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.composer = new EffectComposer(this.renderer)
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    this.bloom = new CinematicBloomPass(new THREE.Vector2(640, 360), 0.6, 0.55, 0.85)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
    this.scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x30304a, 2.3))
    const key = new THREE.DirectionalLight(0xfff2dc, 3.2)
    key.position.set(3, 6, 7); this.scene.add(key)
    this.rim = new THREE.DirectionalLight(this.palette[0], 5)
    this.rim.position.set(-3, 4, -5); this.scene.add(this.rim)
    this.centerLight = new THREE.PointLight(this.palette[0], 8, 12, 2)
    this.centerLight.position.set(0, 1.6, 1.4); this.scene.add(this.centerLight)
    this.glow = glowTexture(); this.extraTextures.push(this.glow)
    this.build()
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(host)
    const slot = host.closest('.game-frame-slot')
    if (slot) this.resizeObserver.observe(slot)
    this.handleContextLost = (event) => { event.preventDefault(); onError(new Error('WebGL context lost')) }
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost)
    this.resize()
  }

  resize() {
    const rect = this.host.getBoundingClientRect()
    if (!rect.width || !rect.height || this.disposed) return
    const ratio = getRenderPixelRatio(rect.width, rect.height, window.devicePixelRatio)
    if (this.renderer.getPixelRatio() !== ratio) this.renderer.setPixelRatio(ratio)
    if (this.composerPixelRatio !== ratio) { this.composer.setPixelRatio(ratio); this.composerPixelRatio = ratio }
    this.renderer.setSize(rect.width, rect.height, false)
    this.composer.setSize(rect.width, rect.height)
    this.camera.aspect = rect.width / rect.height
    this.camera.updateProjectionMatrix()
    if (this.backdrop) this.backdrop.material.uniforms.uAspect.value = this.camera.aspect
    this.lastElapsed = null
  }

  build() {
    const { cinematic, palette } = this
    const reduced = this.reducedMotion
    // Backdrop: an inward-facing cylinder whose texture streams past the camera.
    this.backdrop = createCinematicBackdrop(cinematic.backdrop, cinematic.palette)
    this.backdrop.material.uniforms.uMotion.value = reduced ? 0.15 : 1
    this.scene.add(this.backdrop)

    const floorTexture = hexTexture(cinematic.palette[0]); this.extraTextures.push(floorTexture)
    this.floor = new THREE.Mesh(new THREE.CircleGeometry(3.4, 64), additive(palette[0], 0.4, { map: floorTexture, side: THREE.DoubleSide }))
    this.floor.rotation.x = -Math.PI / 2; this.floor.position.y = 0.02; this.scene.add(this.floor)

    // Data cocoon / matrix sphere / jogress core.
    const shellDetail = cinematic.template === 'matrix' ? 3 : 1
    this.shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1, shellDetail), additive(palette[1], 0, { wireframe: true }))
    this.shellInner = new THREE.Mesh(new THREE.SphereGeometry(0.96, 40, 24), additive(palette[0], 0, { side: THREE.BackSide }))
    this.shell.add(this.shellInner); this.scene.add(this.shell)
    this.core = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: palette[1], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))
    this.scene.add(this.core)

    this.dummy = new THREE.Object3D()
    const shardCount = reduced ? 40 : cinematic.motif ? 96 : 180
    this.shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1), additive(palette[1], 0.9), shardCount)
    this.shards.frustumCulled = false; this.scene.add(this.shards)
    this.shardSeeds = Array.from({ length: shardCount }, (_, i) => {
      const random = seeded(i + 3)
      return { theta: random() * TAU, phi: Math.acos(2 * random() - 1), speed: 2 + random() * 6, size: 0.03 + random() * 0.07, spin: random() * 6 }
    })
    const streakCount = reduced ? 16 : cinematic.motif ? 32 : 70
    this.streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), additive(palette[0], 0.8), streakCount)
    this.streaks.frustumCulled = false; this.scene.add(this.streaks)

    this.shockwave = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 96), additive(palette[1], 0, { side: THREE.DoubleSide }))
    this.shockwave.rotation.x = -Math.PI / 2; this.shockwave.position.y = 0.08; this.scene.add(this.shockwave)
    this.pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 14, 40, 1, true), additive(palette[1], 0, { side: THREE.DoubleSide }))
    this.pillar.position.y = 7; this.scene.add(this.pillar)

    if (cinematic.armor || cinematic.template === 'warp' || cinematic.template === 'armor' || cinematic.template === 'xros') {
      const count = reduced ? 10 : 26
      this.plates = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.6, 0.18),
        new THREE.MeshStandardMaterial({ color: palette[0], emissive: palette[2], emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.25, transparent: true }), count)
      this.plates.frustumCulled = false; this.scene.add(this.plates)
      this.plateSeeds = Array.from({ length: count }, (_, i) => {
        const random = seeded(i + 41)
        return { from: new THREE.Vector3((random() - 0.5) * 12, 1 + random() * 5, (random() - 0.5) * 8), to: new THREE.Vector3((random() - 0.5) * 1.2, 0.4 + random() * 1.8, (random() - 0.5) * 0.8), spin: new THREE.Euler(random() * 6, random() * 6, random() * 6), size: 0.25 + random() * 0.35 }
      })
    }
    if (cinematic.shield) {
      this.shieldDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 6), new THREE.MeshStandardMaterial({ color: palette[0], emissive: palette[0], emissiveIntensity: 0.8, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0 }))
      this.shieldDisc.rotation.x = Math.PI / 2; this.scene.add(this.shieldDisc)
    }
    if (cinematic.template === 'jogress') {
      const strands = Math.max(2, cinematic.sourcePalettes.length)
      const perStrand = reduced ? 60 : 220
      const positions = new Float32Array(strands * perStrand * 3), colors = new Float32Array(strands * perStrand * 3)
      cinematic.sourcePalettes.forEach((sourcePalette, strand) => {
        const color = new THREE.Color(sourcePalette[0])
        for (let i = 0; i < perStrand; i++) color.toArray(colors, (strand * perStrand + i) * 3)
      })
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      this.helix = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.45, map: this.glow, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))
      this.helix.frustumCulled = false; this.helixStrands = strands; this.helixPer = perStrand
      this.scene.add(this.helix)
    }
    if (cinematic.motif) {
      this.motif = createEvolutionMotif(cinematic.motif.kind, cinematic.palette, {
        variant: cinematic.motif.variant, sourcePalettes: cinematic.sourcePalettes, reducedMotion: reduced,
      })
      this.scene.add(this.motif.root)
    }
    if (cinematic.template === 'spirit') {
      const bandTexture = codeBandTexture(cinematic.palette[0]); this.extraTextures.push(bandTexture)
      this.codeRings = Array.from({ length: 5 }, (_, i) => {
        const texture = bandTexture.clone(); texture.needsUpdate = true; texture.repeat.set(3, 1); this.extraTextures.push(texture)
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.34, 72, 1, true), additive(palette[i % 2 ? 1 : 0], 0, { map: texture, side: THREE.DoubleSide }))
        this.scene.add(ring); return ring
      })
    }
    if (cinematic.hazard) {
      const texture = hazardTexture(cinematic.palette[0]); this.extraTextures.push(texture)
      this.hazard = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), additive(WHITE, 0, { map: texture, side: THREE.DoubleSide }))
      this.scene.add(this.hazard)
    }
    if (cinematic.lance) {
      const metal = () => new THREE.MeshStandardMaterial({ color: 0xf3f4ff, emissive: palette[0], emissiveIntensity: 0.9, metalness: 0.9, roughness: 0.2, transparent: true, opacity: 0 })
      this.lance = new THREE.Mesh(new THREE.ConeGeometry(0.13, 3.4, 24), metal())
      this.aegis = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 40), metal())
      this.aegis.rotation.x = Math.PI / 2
      this.scene.add(this.lance, this.aegis)
    }
    if (cinematic.wings) {
      const texture = featherTexture(); this.extraTextures.push(texture)
      this.wingPivot = new THREE.Group(); this.scene.add(this.wingPivot)
      this.wings = Array.from({ length: cinematic.wings }, (_, i) => {
        const geometry = new THREE.PlaneGeometry(0.75, 2.4); geometry.translate(0, 1.2, 0)
        const wing = new THREE.Mesh(geometry, additive(palette[1], 0, { map: texture, side: THREE.DoubleSide }))
        const side = i % 2 ? 1 : -1, rank = Math.floor(i / 2)
        wing.userData = { side, rank }
        this.wingPivot.add(wing); return wing
      })
    }
    if (cinematic.template === 'radiant') {
      const count = reduced ? 20 : 90
      const texture = this.wings ? this.wings[0].material.map : featherTexture()
      if (!this.wings) this.extraTextures.push(texture)
      this.feathers = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.12, 0.36), additive(palette[1], 0, { map: texture, side: THREE.DoubleSide }), count)
      this.feathers.frustumCulled = false; this.scene.add(this.feathers)
    }
    if (cinematic.template === 'burst' || cinematic.burst) {
      const texture = flameTexture(); texture.repeat.set(2, 1); this.extraTextures.push(texture)
      this.flameTexture = texture
      this.aura = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28, 0, TAU, 0, Math.PI * 0.62), additive(palette[0], 0, { map: texture, side: THREE.DoubleSide }))
      this.scene.add(this.aura)
    }
    if (cinematic.template === 'dark') {
      this.bolts = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: palette[1], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, fog: false }))
      this.bolts.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 10 * 6), 3))
      this.bolts.frustumCulled = false; this.scene.add(this.bolts)
    }
    if (cinematic.template === 'royal') {
      // Twelve holy blades descend in a ring, then converge on the knight.
      const count = 12
      const blade = new THREE.ConeGeometry(0.07, 1.8, 4); blade.rotateX(Math.PI)
      this.blades = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: 0xf5f7ff, emissive: palette[0], emissiveIntensity: 0.8, metalness: 0.9, roughness: 0.18, transparent: true, opacity: 0 }), count)
      this.blades.frustumCulled = false; this.scene.add(this.blades)
    }
    if (cinematic.template === 'sovereign') {
      // Four elemental orbs circle the holy beast and fall into it.
      this.orbs = [0, 1, 2, 3].map((i) => {
        const orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: i % 2 ? palette[1] : palette[0], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))
        this.scene.add(orb); return orb
      })
    }
    if (cinematic.capsule) {
      // A 3D capsule (digimental, spirit, X-antibody...) in this Digimon's colours descends onto it.
      this.capsule = new THREE.Group(); this.scene.add(this.capsule)
      this.capsuleModel = createEvolutionCapsule(cinematic.capsule.kind, cinematic.palette)
      this.capsule.add(this.capsuleModel.root)
      this.capsuleHalo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.03, 8, 96), additive(palette[1], 0))
      this.capsuleGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: palette[0], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))
      this.capsuleGlow.scale.setScalar(2.4)
      this.capsuleFx = new THREE.Group(); this.scene.add(this.capsuleFx)
      this.capsuleFx.add(this.capsuleGlow, this.capsuleHalo)
      this.capsuleLight = new THREE.PointLight(palette[0], 0, 4, 2); this.capsule.add(this.capsuleLight)
      const trail = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1), additive(palette[1], 0, { map: this.glow, side: THREE.DoubleSide }))
      trail.geometry.translate(0, 0.5, 0); this.capsuleTrail = trail; this.scene.add(trail)
    }
  }

  async load(scene) {
    const cinematic = this.cinematic
    const sources = scene.from
    const paired = sources.length > 1
    const entries = [
      ...sources.map((unit, index) => ({ unit, role: 'source', index })),
      ...cinematic.chain.map((name, index) => ({ unit: { name }, role: 'chain', index })),
      { unit: scene.to, role: 'result', index: 0 },
    ]
    await Promise.all(entries.map(async ({ unit, role, index }) => {
      const spec = getDigimonModel(unit)
      if (!spec) {
        if (role === 'chain') return
        throw new Error('No model for ' + unit.name)
      }
      const asset = await acquireModelAsset(spec.url)
      if (this.disposed) { asset.release(); return }
      this.assets.push(asset)
      const { normalized, model, mixer, clips } = prepareModel(asset, spec)
      const height = getEvolutionDisplayHeight(unit, role === 'source' && paired)
      const scale = getEvolutionModelScale(normalized, height)
      const root = new THREE.Group(); root.add(normalized); root.scale.setScalar(scale)
      const materials = []
      model.traverse((node) => {
        if (!node.isMesh) return
        const copy = (material) => {
          const cloned = material.clone()
          materials.push({ material: cloned, color: cloned.color?.clone(), emissive: cloned.emissive?.clone(), opacity: cloned.opacity, transparent: cloned.transparent, depthWrite: cloned.depthWrite, wireframe: cloned.wireframe })
          return cloned
        }
        node.material = Array.isArray(node.material) ? node.material.map(copy) : copy(node.material)
      })
      const idle = pickClip(clips, CLIP_ROLES.idle)
      const victory = clips.find((clip) => /^victory|^win|^glad/i.test(clip.name))
      const baseX = role === 'source' && paired ? (index - (sources.length - 1) / 2) * 3 : 0
      this.actors.push({ root, model, mixer, clips, materials, role, index, baseX, idle, victory, activeClip: null, height, scale })
      root.visible = false; this.scene.add(root)
    }))
    this.chainActors = this.actors.filter((actor) => actor.role === 'chain')
      .sort((a, b) => a.index - b.index)
    this.result = this.actors.find((actor) => actor.role === 'result')
    this.sourceActors = this.actors.filter((actor) => actor.role === 'source').sort((a, b) => a.index - b.index)
    if (!this.disposed) await warmCinematicRenderer(this.renderer, this.scene, this.camera, this.composer, () => this.disposed)
  }

  tintActor(actor, { opacity, glow, wire }) {
    const light = this.palette[1], hot = this.palette[0]
    for (const saved of actor.materials) {
      if (saved.color) saved.material.color.copy(saved.color).lerp(light, glow)
      if (saved.emissive) saved.material.emissive.copy(saved.emissive).lerp(hot, glow * 0.9)
      saved.material.wireframe = wire || saved.wireframe
      saved.material.opacity = saved.opacity * opacity
      saved.material.transparent = opacity < 0.999 || saved.transparent
      saved.material.depthWrite = opacity < 0.999 ? false : saved.depthWrite
    }
  }

  poseActor(actor, clip, seconds) {
    if (!actor.mixer || !clip) return
    if (actor.activeClip !== clip) { actor.mixer.stopAllAction(); actor.mixer.clipAction(clip).play(); actor.activeClip = clip }
    actor.mixer.setTime(seconds)
  }

  ground(actor, y) {
    actor.root.updateMatrixWorld(true)
    const bounds = getVisibleModelBounds(actor.root, actor.cameraBounds ??= new THREE.Box3())
    const bottom = bounds.min.y
    if (Number.isFinite(bottom)) {
      const offset = y - bottom
      actor.root.position.y += offset
      actor.cameraBounds = bounds.translate(new THREE.Vector3(0, offset, 0))
    }
  }

  render(elapsed) {
    if (this.disposed || elapsed === this.lastElapsed) return
    this.lastElapsed = elapsed
    const cinematic = this.cinematic
    const frame = sampleCinematic(cinematic, elapsed, this.reducedMotion)
    const { charge: c, transform: x, reveal: r } = cinematic.beats
    const seconds = elapsed / 1000
    const motion = this.reducedMotion ? 0.15 : 1
    const template = cinematic.template
    const bespoke = Boolean(this.motif)
    const resultHeight = this.result?.height ?? 2.6
    const center = new THREE.Vector3(0, 1.3, 0)
    const sourceCount = this.sourceActors.length

    // Sources: lift, spin and dissolve into light.
    const merge = THREE.MathUtils.smoothstep(elapsed, c + 400, x)
    for (const actor of this.sourceActors) {
      const assembly = template === 'xros' ? sampleXrosAssembly(cinematic, elapsed, actor.index, sourceCount, this.reducedMotion) : null
      const opacity = assembly?.opacity ?? frame.fromOpacity
      actor.root.visible = opacity > 0.005
      if (!actor.root.visible) continue
      this.poseActor(actor, actor.idle, seconds)
      const spinStart = Math.max(0, elapsed - c) / 1000
      const lift = assembly?.y ?? frame.rise * (sourceCount > 1 ? 1.6 : 0.5) * motion
      let px = actor.baseX
      let pz = 0
      if (assembly) {
        px = assembly.x
        pz = assembly.z
      } else if (sourceCount > 1) {
        // Partners leave their marks and spiral around each other until they meet.
        const orbit = THREE.MathUtils.smoothstep(elapsed, c - 200, c + 700)
        const angle = actor.index * TAU / sourceCount + spinStart * (1.2 + merge * 4) * motion
        const radius = 1.9 * (1 - merge * merge)
        px = THREE.MathUtils.lerp(actor.baseX, Math.cos(angle) * radius, orbit)
        pz = Math.sin(angle) * radius * orbit
      }
      actor.root.position.set(px, 0, pz)
      actor.root.rotation.y = assembly ? 0 : sourceCount > 1 ? -px * 0.2 : frame.silhouette * spinStart * 7 * motion * (cinematic.sourceSpin ?? 1)
      if ((template === 'dark' || template === 'xantibody') && !this.reducedMotion) actor.root.position.x += Math.sin(seconds * 60) * 0.06 * frame.charge
      // The source shrinks a touch as the cocoon tightens.
      actor.root.scale.setScalar(actor.scale * (assembly?.scale ?? (1 - 0.15 * frame.shell)))
      this.ground(actor, 0.03 + lift)
      const flicker = !this.reducedMotion && frame.wire > 0 && Math.sin(seconds * 38) > 0.15 - frame.wire * 0.8
      this.tintActor(actor, { opacity, glow: Math.min(1, frame.silhouette * (bespoke ? 0.55 : 0.92) + frame.charge * 0.08), wire: flicker })
    }

    // Warp chain: the in-between forms flash past as silhouettes.
    const chainCount = this.chainActors.length
    this.chainActors.forEach((actor, index) => {
      const local = frame.chain * chainCount - index
      const visible = frame.chain > 0 && frame.chain < 1 && local >= 0 && local < 1
      actor.root.visible = visible
      if (!visible) return
      this.poseActor(actor, actor.idle, seconds)
      actor.root.position.set(0, 0, 0)
      actor.root.rotation.y = local * TAU * 0.5 * motion
      actor.root.scale.setScalar(actor.scale * (0.86 + 0.14 * Math.sin(Math.min(1, local * 1.4) * Math.PI / 2)))
      this.ground(actor, 0.03 + 0.3 * frame.rise)
      const fade = Math.min(1, local * 6, (1 - local) * 6)
      this.tintActor(actor, { opacity: fade, glow: 0.88, wire: Math.sin(seconds * 30) > 0.6 })
    })

    // Result: born as a glowing silhouette, colour returns while it poses.
    if (this.result) {
      const actor = this.result
      actor.root.visible = frame.toOpacity > 0.005
      if (actor.root.visible) {
        // The finishing pose plays exactly once, then holds its last frame.
        const celebrating = elapsed > r + 250 && actor.victory
        const clip = celebrating ? actor.victory : actor.idle
        const time = celebrating ? (elapsed - r - 250) / 1000 : Math.max(0, elapsed - r) / 1000
        this.poseActor(actor, clip, celebrating ? Math.min(time, clip.duration - 1 / 60) : time)
        actor.root.position.set(0, 0, 0)
        const pop = 1 + Math.sin(Math.min(1, frame.reveal * 1.6) * Math.PI) * 0.07 * motion
        actor.root.scale.setScalar(actor.scale * (0.9 + 0.1 * frame.reveal) * pop)
        actor.root.rotation.y = (1 - frame.reveal) * -0.6 * motion
        this.ground(actor, 0.03)
        this.tintActor(actor, { opacity: frame.toOpacity, glow: Math.pow(1 - frame.reveal, 1.4) * 0.95, wire: frame.reveal < 0.25 && Math.sin(seconds * 40) > 0.4 })
      }
    }

    // Cocoon / sphere.
    const shellScale = template === 'matrix' ? resultHeight * 0.75 : resultHeight * 0.55
    this.shell.position.copy(center).setY(resultHeight * 0.5 + frame.rise * 0.3)
    this.shell.scale.setScalar(Math.max(0.001, shellScale * (0.5 + frame.shell * 0.55)))
    this.shell.rotation.set(seconds * 0.6 * motion, seconds * 1.4 * motion, 0)
    this.shell.material.opacity = frame.shell * (bespoke ? 0.18 : template === 'jogress' ? 0.3 : 0.75)
    this.shellInner.material.opacity = frame.shell * (bespoke ? 0.04 : template === 'matrix' ? 0.35 : 0.16)
    this.core.position.copy(this.shell.position)
    const coreSize = (template === 'jogress' ? 1.2 + merge * 2.8 : 1.6) * frame.shell + frame.flash * 3
    this.core.scale.setScalar(Math.max(0.001, coreSize))
    this.core.material.opacity = Math.min(1, frame.shell * (bespoke ? 0.18 : 0.6) + frame.flash)

    // Shards gather during charge, then explode at the reveal.
    for (let i = 0; i < this.shards.count; i++) {
      const s = this.shardSeeds[i]
      const gatherRadius = 4.5 - frame.charge * 3.2
      const out = frame.burst > 0 ? frame.burst * s.speed : 0
      const radius = Math.max(0.2, gatherRadius + out)
      const theta = s.theta + seconds * (0.6 + frame.charge * 1.6) * motion
      this.dummy.position.set(Math.sin(s.phi) * Math.cos(theta) * radius, 1.3 + Math.cos(s.phi) * radius * 0.7, Math.sin(s.phi) * Math.sin(theta) * radius)
      this.dummy.rotation.set(s.spin + seconds * 2, s.spin, seconds)
      this.dummy.scale.setScalar(s.size * (0.5 + frame.charge + frame.burst * 1.5) * (1 - frame.reveal * 0.6))
      this.dummy.updateMatrix(); this.shards.setMatrixAt(i, this.dummy.matrix)
    }
    this.shards.instanceMatrix.needsUpdate = true
    this.shards.material.opacity = 0.25 + frame.charge * 0.6 + frame.burst * 0.4 - frame.reveal * 0.5

    // Rising data streaks.
    for (let i = 0; i < this.streaks.count; i++) {
      const angle = i * 2.39996
      const radius = 2.2 + (i % 9) * 0.35
      const y = ((i * 0.37 + seconds * (2 + frame.charge * 9) * motion) % 9) - 1.5
      this.dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      this.dummy.rotation.set(0, -angle, 0)
      this.dummy.scale.set(0.02, 0.4 + frame.charge * 1.6, 0.02)
      this.dummy.updateMatrix(); this.streaks.setMatrixAt(i, this.dummy.matrix)
    }
    this.streaks.instanceMatrix.needsUpdate = true
    this.streaks.material.opacity = (0.15 + frame.charge * 0.75) * (1 - frame.reveal * 0.8)

    // Backdrop streams; it fades up as the world falls away during the charge.
    const backdrop = this.backdrop.material.uniforms
    backdrop.uTime.value = seconds
    backdrop.uCharge.value = frame.charge * (bespoke ? 0.65 : 1)
    backdrop.uReveal.value = frame.reveal
    backdrop.uFlash.value = frame.flash
    backdrop.uSpin.value = sampleCinematicCamera(cinematic, elapsed, this.reducedMotion).azimuth
    this.floor.rotation.z = -seconds * 0.4 * motion
    this.floor.material.opacity = 0.25 + frame.charge * 0.4 + frame.burst * 0.3

    this.shockwave.scale.setScalar(0.5 + frame.burst * 7)
    this.shockwave.material.opacity = frame.burst * (1 - frame.reveal * 0.5)
    this.pillar.material.opacity = (bespoke ? 0 : template === 'radiant' ? 0.25 : template === 'jogress' || template === 'royal' ? 0 : 0.08) * (frame.charge + frame.burst)
    this.pillar.rotation.y = seconds * motion

    if (this.plates) {
      const appear = THREE.MathUtils.smoothstep(elapsed, x - 600, x)
      for (let i = 0; i < this.plates.count; i++) {
        const s = this.plateSeeds[i]
        const k = Math.min(1, frame.assemble * 1.15)
        this.dummy.position.set(s.to.x, s.to.y * resultHeight / 2.2, s.to.z)
        this.dummy.position.lerpVectors(s.from, this.dummy.position, k * k * (3 - 2 * k))
        this.dummy.rotation.set(s.spin.x * (1 - k) + seconds * (1 - k), s.spin.y * (1 - k), s.spin.z * (1 - k))
        this.dummy.scale.setScalar(s.size * (1 - k * 0.6))
        this.dummy.updateMatrix(); this.plates.setMatrixAt(i, this.dummy.matrix)
      }
      this.plates.instanceMatrix.needsUpdate = true
      this.plates.material.opacity = appear * (1 - THREE.MathUtils.smoothstep(frame.assemble, 0.75, 1))
      this.plates.visible = this.plates.material.opacity > 0.01
    }
    if (this.shieldDisc) {
      this.shieldDisc.position.set(0, resultHeight * 0.55, -0.7 - (1 - frame.assemble) * 3)
      this.shieldDisc.rotation.y = (1 - frame.assemble) * 6 * motion
      this.shieldDisc.scale.setScalar(0.6 + resultHeight * 0.2)
      this.shieldDisc.material.opacity = Math.min(frame.assemble * 2, 1) * (1 - frame.nameCard * 0.9)
    }
    if (this.helix) {
      const positions = this.helix.geometry.attributes.position.array
      const radius = 1.6 * (1 - merge * 0.85) + 0.15
      for (let strand = 0; strand < this.helixStrands; strand++) {
        for (let i = 0; i < this.helixPer; i++) {
          const u = i / this.helixPer
          const angle = u * TAU * 4 + strand * (TAU / this.helixStrands) + seconds * 3 * motion
          const index = (strand * this.helixPer + i) * 3
          positions[index] = Math.cos(angle) * radius
          positions[index + 1] = u * 7 - 1 + frame.rise
          positions[index + 2] = Math.sin(angle) * radius
        }
      }
      this.helix.geometry.attributes.position.needsUpdate = true
      this.helix.material.opacity = Math.min(1, frame.charge * 1.3) * (1 - frame.reveal)
    }
    if (this.codeRings) {
      this.codeRings.forEach((ring, i) => {
        const wrap = THREE.MathUtils.smoothstep(elapsed, c + i * 250, x - 200)
        ring.position.set(0, resultHeight * (0.12 + i * 0.2) + Math.sin(seconds * 2 + i) * 0.08, 0)
        ring.scale.set(2.6 - wrap * 1.6, 1 + frame.charge * 0.6, 2.6 - wrap * 1.6)
        ring.rotation.y = seconds * (i % 2 ? -2 : 2) * motion
        ring.material.opacity = (frame.charge * 0.9 + frame.burst * 0.5) * (1 - frame.reveal)
        ring.material.map.offset.x = seconds * 0.3 * (i % 2 ? 1 : -1)
      })
    }
    if (this.hazard) {
      this.hazard.position.set(0, resultHeight * 0.62, 1.1)
      this.hazard.quaternion.copy(this.camera.quaternion)
      this.hazard.scale.setScalar(0.6 + frame.charge * 0.6 + frame.burst * 1.4)
      this.hazard.material.opacity = THREE.MathUtils.smoothstep(elapsed, c + 600, c + 1300) * (1 - frame.reveal) * (0.6 + 0.4 * Math.sin(seconds * 9))
    }
    if (this.lance) {
      const k = THREE.MathUtils.smoothstep(elapsed, x - 900, x + 300)
      this.lance.position.set(2.8 - k * 1.7, resultHeight * 0.55, 0.6)
      this.lance.rotation.set(0, 0, -0.35 + (1 - k) * 2)
      this.aegis.position.set(-2.8 + k * 1.7, resultHeight * 0.5, 0.7)
      this.aegis.rotation.z = (1 - k) * 6
      const fade = k * (1 - THREE.MathUtils.smoothstep(elapsed, r + 300, r + 1300))
      this.lance.material.opacity = fade; this.aegis.material.opacity = fade
    }
    if (this.wings) {
      this.wingPivot.position.set(0, resultHeight * 0.62, -0.35)
      const unfold = THREE.MathUtils.smoothstep(elapsed, r - 200, r + 1200)
      this.wings.forEach((wing) => {
        const { side, rank } = wing.userData
        wing.rotation.set(-0.2, side * 0.25, side * -(0.35 + rank * 0.32) * unfold - side * 0.1)
        wing.scale.setScalar(Math.max(0.001, unfold * (0.8 + resultHeight * 0.15)))
        wing.material.opacity = unfold * (1 - frame.nameCard * 0.7) * 0.85
      })
    }
    if (this.feathers) {
      for (let i = 0; i < this.feathers.count; i++) {
        const random = seeded(i + 99)
        const fx = (random() - 0.5) * 9, fz = (random() - 0.5) * 6
        const fy = 8 - ((seconds * (0.6 + random() * 0.6) * motion + random() * 8) % 9)
        this.dummy.position.set(fx + Math.sin(seconds + i) * 0.3, fy, fz)
        this.dummy.rotation.set(seconds + i, seconds * 0.7 + i, i)
        this.dummy.scale.setScalar(1)
        this.dummy.updateMatrix(); this.feathers.setMatrixAt(i, this.dummy.matrix)
      }
      this.feathers.instanceMatrix.needsUpdate = true
      this.feathers.material.opacity = 0.2 + frame.charge * 0.5 + frame.reveal * 0.4
    }
    if (this.aura) {
      const strength = Math.max(frame.charge * 0.4, cinematic.burst ? frame.reveal * (1 - frame.nameCard * 0.4) : frame.burst)
      this.aura.position.set(0, 0, 0)
      this.aura.scale.set(resultHeight * 0.55, resultHeight * 1.15 * (1 + Math.sin(seconds * 14) * 0.03), resultHeight * 0.55)
      this.aura.material.opacity = strength * 0.7
      this.flameTexture.offset.y = -seconds * 1.4 * motion
      this.flameTexture.offset.x = seconds * 0.1
    }
    if (this.bolts) {
      const positions = this.bolts.geometry.attributes.position.array
      const random = seeded(Math.floor(seconds * 12))
      let p = 0
      for (let b = 0; b < 8; b++) {
        let bx = (random() - 0.5) * 6, by = 6, bz = (random() - 0.5) * 3
        for (let s = 0; s < 10; s++) {
          const nx = bx * 0.82 + (random() - 0.5) * 0.7, ny = by - 0.6, nz = bz * 0.82 + (random() - 0.5) * 0.4
          positions.set([bx, by, bz, nx, ny, nz], p); p += 6
          bx = nx; by = ny; bz = nz
        }
      }
      this.bolts.geometry.attributes.position.needsUpdate = true
      this.bolts.material.opacity = (frame.charge + frame.burst) * (random() < 0.6 ? 0.9 : 0.2) * (this.reducedMotion ? 0.3 : 1)
    }
    if (this.blades) {
      const ring = THREE.MathUtils.smoothstep(elapsed, c, x - 500)
      const gather = THREE.MathUtils.smoothstep(elapsed, x - 500, x + 200)
      const radius = THREE.MathUtils.lerp(2.6, 0.35, gather)
      for (let i = 0; i < this.blades.count; i++) {
        const angle = i * TAU / this.blades.count + seconds * 0.6 * motion
        const y = THREE.MathUtils.lerp(5.2, resultHeight * 0.75 + 0.6, ring) - gather * resultHeight * 0.3
        this.dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
        this.dummy.rotation.set(Math.sin(angle) * 0.35 * gather, -angle, Math.cos(angle) * 0.35 * gather)
        this.dummy.scale.setScalar(Math.max(0.001, resultHeight / 2.6))
        this.dummy.updateMatrix(); this.blades.setMatrixAt(i, this.dummy.matrix)
      }
      this.blades.instanceMatrix.needsUpdate = true
      this.blades.material.opacity = ring * (1 - THREE.MathUtils.smoothstep(elapsed, x, r))
      this.blades.visible = this.blades.material.opacity > 0.01
    }
    if (this.orbs) {
      const gather = THREE.MathUtils.smoothstep(elapsed, x - 900, x)
      this.orbs.forEach((orb, i) => {
        const angle = i * TAU / 4 + seconds * (0.8 + gather * 3) * motion
        const radius = THREE.MathUtils.lerp(2.3, 0.2, gather)
        orb.position.set(Math.cos(angle) * radius, resultHeight * 0.55 + Math.sin(seconds * 2 + i) * 0.35 * (1 - gather), Math.sin(angle) * radius)
        orb.scale.setScalar(0.7 + frame.charge * 0.5)
        orb.material.opacity = THREE.MathUtils.smoothstep(elapsed, 400, c + 300) * (1 - THREE.MathUtils.smoothstep(elapsed, x - 100, x + 300))
      })
    }
    if (this.capsule) {
      // Fall from the sky, land on the Digimon's chest, then open (digimental) or sink into it.
      const chargeSpan = x - c
      const land = c + chargeSpan * 0.5
      const descend = THREE.MathUtils.smoothstep(elapsed, 150, land)
      const fall = 1 - Math.pow(1 - descend, 3)
      const absorb = THREE.MathUtils.smoothstep(elapsed, land + 150, x - 150)
      const appear = THREE.MathUtils.smoothstep(elapsed, 150, 600)
      const source = this.sourceActors[0]
      const sourceHeight = source?.height ?? 1.6
      const chestY = sourceHeight * 0.55 + frame.rise * 0.5 * motion
      const size = THREE.MathUtils.clamp(sourceHeight * 0.55, 0.75, 1.4)
      const startY = chestY + 5.5
      this.capsule.position.set(0, THREE.MathUtils.lerp(startY, chestY, fall), THREE.MathUtils.lerp(1.4, 0.45, fall) - absorb * 0.45)
      // Spins while falling, slows to face the camera as it settles on the Digimon.
      const spin = seconds * 2.2 * motion
      const facing = sampleCinematicCamera(cinematic, elapsed, this.reducedMotion).azimuth
      this.capsule.rotation.set(Math.sin(seconds * 2.3) * 0.12 * (1 - descend), THREE.MathUtils.lerp(spin, facing, descend * descend), Math.sin(seconds * 1.7) * 0.08 * (1 - absorb))
      const model = this.capsuleModel
      const shrink = model.split ? 1 : 1 - absorb * 0.92
      this.capsule.scale.setScalar(size * shrink * (1 + Math.sin(Math.min(1, absorb * 2) * Math.PI) * 0.12))
      if (model.split) {
        // the two shell halves swing open around the partner
        model.parts.forEach((part, half) => {
          // half 0 is the +x shell (lathe 0..π), so it opens toward +x
          const side = half ? -1 : 1
          part.position.x = side * absorb * 0.85
          part.rotation.z = -side * absorb * 0.9
        })
      }
      const fade = appear * (1 - THREE.MathUtils.smoothstep(absorb, 0.55, 1))
      for (const material of model.materials) material.opacity = fade
      this.capsuleLight.intensity = fade * (0.8 + absorb * 3)
      this.capsuleFx.position.copy(this.capsule.position)
      this.capsuleFx.quaternion.copy(this.camera.quaternion)
      this.capsuleFx.scale.setScalar(size)
      this.capsuleHalo.rotation.z = seconds * 2.4
      this.capsuleHalo.scale.setScalar(1 + absorb * 1.2)
      this.capsuleHalo.material.opacity = appear * (0.35 + descend * 0.45) * (1 - absorb)
      this.capsuleGlow.material.opacity = appear * (0.08 + absorb * 0.7) * (1 - THREE.MathUtils.smoothstep(elapsed, x - 250, x + 150))
      // a falling light trail
      this.capsuleTrail.position.set(this.capsule.position.x, this.capsule.position.y, this.capsule.position.z - 0.05)
      this.capsuleTrail.quaternion.copy(this.camera.quaternion)
      this.capsuleTrail.scale.set(size * 0.8, (1 - descend) * 4 + 0.001, 1)
      this.capsuleTrail.material.opacity = appear * (1 - descend) * 0.6
    }

    this.motif?.update(frame, seconds, resultHeight)
    this.centerLight.intensity = 0.6 + frame.charge * (bespoke ? 2.2 : 6) + frame.flash * 10
    this.rim.color.copy(this.palette[0]).lerp(this.palette[1], frame.reveal * 0.5)
    this.bloom.strength = (bespoke ? 0.25 : 0.45) + frame.charge * (bespoke ? 0.2 : 0.35) + frame.flash * 0.6
    this.renderer.toneMappingExposure = 1.15 + frame.flash * 0.9

    const cam = sampleCinematicCamera(cinematic, elapsed, this.reducedMotion)
    const shake = frame.shake * 0.12
    const heightScale = Math.max(0.8, resultHeight / 2.6)
    this.camera.position.set(
      Math.sin(cam.azimuth) * cam.distance * heightScale + Math.sin(seconds * 53) * shake,
      cam.height * heightScale + Math.cos(seconds * 47) * shake,
      Math.cos(cam.azimuth) * cam.distance * heightScale,
    )
    this.camera.lookAt(0, cam.lookY * heightScale, 0)
    fitCinematicCamera(this.camera, this.actors.filter(actor => actor.root.visible).map(actor => actor.cameraBounds))
    this.composer.render()
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.resizeObserver.disconnect()
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost)
    this.actors.forEach((actor) => { actor.mixer?.stopAllAction(); actor.mixer?.uncacheRoot(actor.model) })
    disposeTrees([this.scene], { preserve: this.assets.map(asset => asset.scene) })
    this.assets.forEach(asset => asset.release()); this.assets = []
    this.extraTextures.forEach((texture) => texture.dispose())
    this.composer.passes.forEach((pass) => pass.dispose())
    this.composer.dispose()
    this.surface.dispose()
  }
}
