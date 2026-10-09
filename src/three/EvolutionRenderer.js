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
import { disposeModelTrees } from './modelResources.js'
import { CLIP_ROLES, pickClip } from './battle3dMath.js'
import { getDigimonModel } from '../data/digimonModels.js'
import { getEvolutionDisplayHeight } from '../data/digimonSizes.js'
import { sampleEvolution } from './evolutionTimeline.js'
import { getVisibleModelBounds } from './modelParts.js'

const CYAN = new THREE.Color('#67e8ff')
const GOLD = new THREE.Color('#ffe1a0')
const WHITE = new THREE.Color('#e3ffff')

export function createHatchEgg() {
  const egg = new THREE.Group()
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.78, 40, 32), new THREE.MeshStandardMaterial({ color: 0xe2f9ff, roughness: 0.3, metalness: 0.2, transparent: true }))
  shell.scale.set(1, 1.28, 1)
  egg.add(shell)
  // A geometric data shell belongs to the scene, so normal scene disposal releases it.
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.17, 6), new THREE.MeshStandardMaterial({ color: CYAN, emissive: 0x166d85, roughness: 0.35, transparent: true, side: THREE.DoubleSide }))
    patch.position.set(Math.sin(angle) * 0.76, i % 2 ? 0.25 : -0.2, Math.cos(angle) * 0.76)
    patch.lookAt(patch.position.clone().multiplyScalar(2))
    egg.add(patch)
  }
  egg.position.y = 1.12
  return egg
}

export function getEvolutionModelScale(normalized, height) {
  // SkinnedMesh refreshes its bind inverse in updateMatrixWorld, not Box3's updateWorldMatrix.
  // Measuring first can count a model's imported root scale twice (notably Omnimon).
  normalized.updateMatrixWorld(true)
  const size = (normalized.userData.idleBounds ?? getVisibleModelBounds(normalized)).getSize(new THREE.Vector3())
  return Math.min(height / size.y, 4.6 / size.x, 4.4 / size.z)
}

export const disposeTrees = disposeModelTrees

// Original geometric dial: no artwork or video from the reference games is bundled.
function createDialTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1024
  const ctx = canvas.getContext('2d')
  ctx.translate(512, 512)
  ctx.strokeStyle = '#8aefff'
  for (const radius of [270, 292, 394, 428, 460]) {
    ctx.lineWidth = radius === 428 ? 4 : 2
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke()
  }
  ctx.font = '21px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#b6f7ff'
  for (let i = 0; i < 64; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 32)
    ctx.lineWidth = i % 4 === 0 ? 5 : 2
    ctx.beginPath(); ctx.moveTo(0, 435); ctx.lineTo(0, i % 4 === 0 ? 455 : 444); ctx.stroke()
    if (i % 2 === 0) ctx.fillText((i * 19 + 7).toString(2).padStart(8, '0').slice(-4), 0, -348)
    ctx.restore()
  }
  for (let i = 0; i < 8; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 4)
    ctx.beginPath(); ctx.moveTo(-34, 260); ctx.lineTo(0, 224); ctx.lineTo(34, 260); ctx.stroke()
    ctx.restore()
  }
  return new THREE.CanvasTexture(canvas)
}

export class EvolutionRenderer {
  constructor(host, { reducedMotion = false, onError = () => {} } = {}) {
    this.host = host
    this.reducedMotion = reducedMotion
    this.disposed = false
    this.assets = []
    this.actors = []
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x031021, 0.04)
    this.camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.1, 70)
    this.surface = acquireCinematicSurface(host, { antialias: true, alpha: true, powerPreference: 'low-power' })
    this.renderer = this.surface.renderer
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.25
    this.composer = new EffectComposer(this.renderer)
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
    this.bloom = new CinematicBloomPass(new THREE.Vector2(640, 360), 0.4, 0.5, 1.6)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
    this.scene.add(new THREE.HemisphereLight(0xdff6ff, 0x35486b, 2.5))
    const key = new THREE.DirectionalLight(0xfff0d7, 3.4)
    key.position.set(3, 6, 7); this.scene.add(key)
    this.rim = new THREE.DirectionalLight(0x60ccff, 4)
    this.rim.position.set(-3, 4, -5); this.scene.add(this.rim)
    this.centerLight = new THREE.PointLight(0x6adfff, 12, 10, 2)
    this.centerLight.position.set(0, 2, 1); this.scene.add(this.centerLight)
    this.buildEnvironment()
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
    const ratio = getRenderPixelRatio(rect.width, rect.height, window.devicePixelRatio, 1.25)
    if (this.renderer.getPixelRatio() !== ratio) this.renderer.setPixelRatio(ratio)
    if (this.composerPixelRatio !== ratio) { this.composer.setPixelRatio(ratio); this.composerPixelRatio = ratio }
    this.renderer.setSize(rect.width, rect.height, false)
    this.composer.setSize(rect.width, rect.height)
    this.camera.aspect = rect.width / rect.height
    this.camera.updateProjectionMatrix()
    this.lastElapsed = null
  }

  buildEnvironment() {
    const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 96), new THREE.MeshBasicMaterial({ color: 0x030c19 }))
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; this.scene.add(floor)
    const grid = new THREE.GridHelper(30, 30, 0x164760, 0x0b283d)
    grid.position.y = 0.002; grid.material.transparent = true; grid.material.opacity = 0.45; this.scene.add(grid)
    this.dial = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6), new THREE.MeshBasicMaterial({ map: createDialTexture(), transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))
    this.dial.material.color.setRGB(2.5, 2.5, 2.5); this.dial.rotation.x = -Math.PI / 2; this.dial.position.y = 0.012; this.scene.add(this.dial)
    this.rings = []
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.95 + i * 0.27, i === 0 ? 0.016 : 0.008, 8, 160), new THREE.MeshBasicMaterial({ color: i % 2 ? CYAN : GOLD, transparent: true, opacity: 0.65, depthWrite: false, blending: THREE.AdditiveBlending }))
      ring.material.color.multiplyScalar(3.5); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.035 + i * 0.01; this.scene.add(ring); this.rings.push(ring)
    }
    this.halo = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.018, 8, 180), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }))
    this.halo.material.color.multiplyScalar(3); this.halo.position.set(0, 1.7, -1.7); this.scene.add(this.halo)
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.65, 8, 48, 1, true), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }))
    this.beam.position.y = 3.8; this.scene.add(this.beam)
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }))
    this.core.position.y = 1.5; this.scene.add(this.core)
    const shardMaterial = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })
    this.shards = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), shardMaterial, this.reducedMotion ? 36 : 144)
    this.shards.frustumCulled = false; this.scene.add(this.shards)
    this.matrixDummy = new THREE.Object3D()
    const points = new Float32Array(420 * 3)
    for (let i = 0; i < 420; i++) {
      const angle = i * 2.39996, radius = 5 + (i % 31) * 0.31
      points[i * 3] = Math.cos(angle) * radius
      points[i * 3 + 1] = ((i * 37) % 137) / 12 - 1
      points[i * 3 + 2] = Math.sin(angle) * radius
    }
    const starsGeometry = new THREE.BufferGeometry()
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(points, 3))
    this.stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0x93dafa, size: 0.024, transparent: true, opacity: 0.65, depthWrite: false }))
    this.scene.add(this.stars)
  }

  async load(scene) {
    const sources = scene.from
    if (scene.mode === 'hatch') {
      this.hatchEgg = createHatchEgg()
      this.scene.add(this.hatchEgg)
    }
    const entries = [...sources.map((unit) => ({ unit, result: false })), { unit: scene.to, result: true }]
    await Promise.all(entries.map(async ({ unit, result }, index) => {
      const spec = getDigimonModel(unit)
      if (!spec) throw new Error('No model for ' + unit.name)
      const asset = await acquireModelAsset(spec.url)
      if (this.disposed) { asset.release(); return }
      this.assets.push(asset)
      const prepared = prepareModel(asset, spec)
      const { normalized, model, mixer, clips } = prepared
      const height = getEvolutionDisplayHeight(unit, !result && sources.length > 1)
      const scale = getEvolutionModelScale(normalized, height)
      const root = new THREE.Group(); root.add(normalized); root.scale.setScalar(scale)
      const materials = []
      model.traverse((node) => {
        if (!node.isMesh) return
        const copy = (material) => {
          const cloned = material.clone()
          materials.push({ material: cloned, color: cloned.color?.clone(), emissive: cloned.emissive?.clone(), opacity: cloned.opacity, transparent: cloned.transparent, depthWrite: cloned.depthWrite })
          return cloned
        }
        node.material = Array.isArray(node.material) ? node.material.map(copy) : copy(node.material)
      })
      const baseX = !result && sources.length > 1 ? (index - (sources.length - 1) / 2) * 2.8 : 0
      const idle = pickClip(clips, CLIP_ROLES.idle)
      // Only a genuine celebration clip is used; an attack fallback would leave the model off-center.
      const victory = clips.find((clip) => /^victory|^win|^glad/i.test(clip.name))
      this.actors.push({ root, model, mixer, clips, materials, result, baseX, idle, victory, activeClip: idle })
      root.visible = false; this.scene.add(root)
    }))
    if (!this.disposed) await warmCinematicRenderer(this.renderer, this.scene, this.camera, this.composer, () => this.disposed)
  }

  render(elapsed) {
    if (this.disposed || elapsed === this.lastElapsed) return
    this.lastElapsed = elapsed
    const frame = sampleEvolution(elapsed, this.reducedMotion)
    const seconds = elapsed / 1000
    const motionTime = this.reducedMotion ? seconds * 0.12 : seconds
    if (this.hatchEgg) {
      this.hatchEgg.visible = frame.fromOpacity > 0.005
      this.hatchEgg.position.y = 1.12 + frame.lift
      this.hatchEgg.rotation.set(0, motionTime * 0.35, this.reducedMotion ? 0 : Math.sin(seconds * 8) * frame.charge * 0.08)
      this.hatchEgg.traverse(node => { if (node.material) node.material.opacity = frame.fromOpacity })
    }
    for (const actor of this.actors) {
      const opacity = actor.result ? frame.toOpacity : frame.fromOpacity
      actor.root.visible = opacity > 0.005
      if (!actor.root.visible) continue
      actor.root.position.set(actor.baseX * (0.25 + 0.75 * frame.fromOpacity), 0.03 + (actor.result ? 0 : frame.lift), 0)
      const clip = actor.result && elapsed > 4600 ? actor.victory || actor.idle : actor.idle
      if (actor.mixer && clip) {
        if (actor.activeClip !== clip) { actor.mixer.stopAllAction(); actor.mixer.clipAction(clip).play(); actor.activeClip = clip }
        const time = actor.result ? Math.max(0, elapsed - 4600) / 1000 : seconds
        // The finishing pose plays exactly once, then holds its last frame.
        actor.mixer.setTime(clip === actor.victory ? Math.min(time, clip.duration - 1 / 60) : time)
      }
      // Keep the current animated pose grounded, including source clips with root translation.
      actor.root.updateMatrixWorld(true)
      const bottom = getVisibleModelBounds(actor.root, actor.bounds ??= new THREE.Box3()).min.y
      if (Number.isFinite(bottom)) actor.root.position.y += 0.03 + (actor.result ? 0 : frame.lift) - bottom
      for (const saved of actor.materials) {
        const whiten = actor.result ? (1 - frame.reveal) * 0.85 : Math.pow(frame.charge, 6) * 0.6
        if (saved.color) saved.material.color.copy(saved.color).lerp(WHITE, whiten)
        if (saved.emissive) saved.material.emissive.copy(saved.emissive).lerp(CYAN, whiten * 0.75)
        saved.material.opacity = saved.opacity * opacity
        saved.material.transparent = opacity < 0.999 || saved.transparent
        saved.material.depthWrite = opacity < 0.999 ? false : saved.depthWrite
      }
    }
    this.dial.rotation.z = -motionTime * 0.15
    this.dial.material.opacity = 0.38 + frame.charge * 0.45 + frame.reveal * 0.18
    this.rings.forEach((ring, index) => {
      ring.position.y = index < 2 ? 0.04 + index * 0.012 : 0.1 + frame.charge * (1.1 + index * 0.48)
      const scale = 1 + frame.charge * 0.12 + (index === 3 ? frame.reveal * 1.4 : 0)
      ring.scale.setScalar(scale)
      ring.material.opacity = index === 3 ? (1 - frame.reveal) * 0.5 : 0.3 + frame.charge * 0.5
    })
    this.halo.rotation.z = motionTime * 0.08
    this.halo.material.opacity = 0.1 + frame.charge * 0.28
    this.beam.material.opacity = frame.charge * 0.055
    this.beam.rotation.y = motionTime
    this.core.scale.set(0.1 + frame.charge * 1.15, 0.2 + frame.charge * 1.8, 0.1 + frame.charge * 1.15)
    this.core.material.opacity = Math.max(0, 1 - frame.fromOpacity - frame.toOpacity) * 0.72
    this.core.rotation.set(motionTime * 0.5, motionTime * 0.8, 0)
    this.centerLight.intensity = 1.5 + frame.charge * 3
    this.rim.color.copy(CYAN).lerp(GOLD, frame.reveal)
    this.shards.material.color.copy(CYAN).lerp(GOLD, frame.reveal).multiplyScalar(3)
    this.shards.material.opacity = 0.35 + frame.charge * 0.5 - frame.reveal * 0.2
    for (let i = 0; i < this.shards.count; i++) {
      const angle = i * 2.39996 + motionTime * (0.2 + frame.charge * 0.55)
      const radius = 1.9 + (i % 13) * 0.14 - frame.charge * 0.65 + frame.reveal * 2
      const y = ((i * 0.173 + motionTime * (0.25 + frame.charge * 0.35)) % 5.8) - 0.2
      this.matrixDummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      this.matrixDummy.rotation.set(angle, angle * 0.5, seconds * 0.2)
      const size = 0.015 + (i % 5) * 0.009
      this.matrixDummy.scale.set(size, size * (i % 3 === 0 ? 3 : 1), size)
      this.matrixDummy.updateMatrix(); this.shards.setMatrixAt(i, this.matrixDummy.matrix)
    }
    this.shards.instanceMatrix.needsUpdate = true
    const distance = 9.3 - frame.reveal * 0.4 + frame.charge * 0.3
    this.camera.position.set(Math.sin(frame.orbit) * distance, 3.3 + frame.charge * 0.15, Math.cos(frame.orbit) * distance)
    this.camera.lookAt(0, 1.15, 0)
    this.bloom.strength = 0.35 + frame.charge * 0.15
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
    this.composer.passes.forEach((pass) => pass.dispose())
    this.composer.dispose()
    this.surface.dispose()
  }
}
