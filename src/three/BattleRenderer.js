import * as THREE from 'three'
import { fusionPose } from './fusionPresentation.js'
import { BOSS_FUSION_SWAP_MS, BOSS_FUSION_MS } from '../battle/bossEncounters.js'
import { getDigimonModel } from '../data/digimonModels.js'
import { fitDigimonScale, fitDigimonFormation, getDigimonDisplayScale } from '../data/digimonSizes.js'
import { getBattleFootprint } from './modelSize.js'
import { prepareModel } from './modelPreparation.js'
import { acquireModelAsset } from './sharedModelAssets.js'
import { BattleEffects } from './BattleEffects.js'
import { SkillEffects } from './SkillEffects.js'
import { StatusEffects } from './StatusEffects.js'
import { CaptureEffects } from './CaptureEffects.js'
import { capturePose, captureSpeed } from './capturePresentation.js'
import { resolveAttackPresentation, sampleAttackClip, sampleAttackLift, attackAdvance } from './attackPresentation.js'
import { attackEmitter, attackBodyDirection } from './attackAnatomy.js'
import { SWITCH_OUT_MS, SWITCH_IN_DELAY_MS, SWITCH_IN_MS, switchOpacity } from './switchPresentation.js'
import { getVisibleModelBounds } from './modelParts.js'
import { getModelGroundBounds, createGroundOcclusion } from './modelGrounding.js'
import { defeatPresentation, defeatPose } from './defeatPresentation.js'
import { clamp01, clipPlaybackRate, CLIP_ROLES, EventLedger, HIT_MS, pickClip } from './battle3dMath.js'
import { DAMAGE_TEXT_MS, getDamageFeedback } from '../battle/damageFeedback.js'
import { ModelAssetCache } from './ModelAssetCache.js'
import { getRenderPixelRatio } from './renderResolution.js'
import { registerBattleSurface } from './cinematicSurface.js'
import { getMapPresentation } from '../data/mapPresentation.js'
import { beginPoseTransition, updatePoseTransition, clearPoseTransition, CLIP_BLEND_MS, ATTACK_RECOVERY_MS } from './poseTransitions.js'

const UP = new THREE.Vector3(0, 1, 0)
const GROUND = new THREE.Plane(UP, 0)
const actorKey = (side, id) => `${side === 'player' ? 'ally' : side}:${id}`


function cloneActorMaterial(actor, source) {
  const material = source.clone()
  const planeIndex = source.clippingPlanes?.indexOf(actor.groundOcclusion?.plane) ?? -1
  // Material.clone copies planes. Recall/capture must follow the actor's live
  // contact line as a new map or responsive layout changes its position.
  if (planeIndex >= 0) material.clippingPlanes[planeIndex] = actor.groundOcclusion.plane
  return material
}

export { prepareModel } from './modelPreparation.js'

function glowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.18, '#ffffffea')
  gradient.addColorStop(0.5, '#ffffff65')
  gradient.addColorStop(1, '#ffffff00')
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

export class BattleRenderer {
  constructor(host, { onReady, onStatus, previewFacing = 'side', clock = () => performance.now() }) {
    this.clock = clock
    this.host = host
    this.field = host.closest('[data-3d-field], .adventure-field') || host.parentElement
    this.onReady = onReady
    this.onStatus = onStatus
    this.actors = new Map()
    this.bossPreloads = new Set()
    this.preloadTimers = new Map()
    this.modelAssets = new ModelAssetCache({
      load: acquireModelAsset,
      dispose: asset => asset.release(),
      limit: this.field.classList.contains('adventure-field') ? 4 : 2,
      isPinned: url => [...this.actors.values()].some(actor => actor.spec?.url === url ||
        actor.unit?.bossEncounter?.phases.slice(actor.unit.bossEncounter.phase)
          .some(phase => phase.form && getDigimonModel(phase.form)?.url === url)),
    })
    this.ledger = new EventLedger()
    this.speed = 1
    this.disposed = false
    this.failed = false
    this.paused = false
    this.lastTime = this.clock()
    this.layoutDirty = true
    this.scene = new THREE.Scene()
    // Transparent 3D actors and effects sit over the map's original 2D background.
    this.isBattleField = this.field.classList.contains('adventure-field')
    this.previewFacing = previewFacing
    this.camera = new THREE.OrthographicCamera(-8, 8, 5, -5, 0.1, 120)
    this.groundPlane = this.isBattleField ? new THREE.Plane(new THREE.Vector3(0, 0, 1), 0) : GROUND
    this.camera.position.set(0, this.isBattleField ? 0 : 7, 16)
    this.camera.lookAt(0, 0, 0)
    this.camera.updateMatrixWorld()
    this.ray = new THREE.Raycaster()
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: this.isBattleField ? 'high-performance' : 'low-power' })
    this.renderer.localClippingEnabled = true
    if (this.isBattleField) this.unregisterSurface = registerBattleSurface(this)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.3
    host.appendChild(this.renderer.domElement)
    this.texture = glowTexture()
    this.fx = new BattleEffects(this.scene, this.camera)
    this.skillFx = new SkillEffects(this.fx)
    this.statusFx = new StatusEffects(this.fx)
    this.captureFx = new CaptureEffects(this.fx)
    this.cameraBase = this.camera.position.clone()
    // Consistent actor lighting across the painted map backgrounds.
    const hemisphere = new THREE.HemisphereLight(0xe6f7ff, 0x718058, 2.4)
    const key = new THREE.DirectionalLight(0xffeed6, 3.1)
    key.position.set(-4, 9, 6)
    const rim = new THREE.DirectionalLight(0x70c9ff, 2.0)
    rim.position.set(4, 5, -5)
    this.defaultLights = [hemisphere, key, rim]
    for (const light of this.defaultLights) this.scene.add(light)
    this.handleContextLost = (event) => {
      event.preventDefault()
      this.failed = true
      this.onReady(false)
      this.restoreAnchors()
      this.onStatus('3D 연결이 끊겼습니다. 화면을 새로 고치면 다시 표시됩니다.')
    }
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost)
    this.resizeObserver = new ResizeObserver(() => { this.layoutDirty = true })
    this.resizeObserver.observe(this.field)
    const frameSlot = this.field.closest('.game-frame-slot')
    if (frameSlot) this.resizeObserver.observe(frameSlot)
    this.handleResize = () => { this.layoutDirty = true }
    window.addEventListener('resize', this.handleResize)
    this.frame = this.frame.bind(this)
    this.frameId = null
    this.handleVisibility = () => this.syncFrameLoop()
    document.addEventListener('visibilitychange', this.handleVisibility)
    if (!this.isBattleField && typeof IntersectionObserver !== 'undefined') {
      this.visibilityObserver = new IntersectionObserver(([entry]) => { this.offscreen = !entry.isIntersecting; this.syncFrameLoop() })
      this.visibilityObserver.observe(this.host)
    }
    this.syncFrameLoop()
  }

  syncFrameLoop() {
    this.lastTime = this.clock()
    const paused = this.paused || this.borrowed || this.offscreen || document.hidden
    this.host.dataset.renderPaused = String(Boolean(paused))
    if (paused || this.disposed || this.failed) {
      cancelAnimationFrame(this.frameId); this.frameId = null
    } else if (this.frameId == null) this.frameId = requestAnimationFrame(this.frame)
  }

  setPaused(paused) {
    if (this.paused === paused) return
    this.paused = paused; this.syncFrameLoop()
  }

  loadModel(spec) {
    return this.modelAssets.get(spec.url)
  }

  updatePreview({ name, intro, effect, effectMs, facing = 'side' }) {
    if (this.isBattleField || this.disposed || this.failed) return
    const actor = this.actors.get('ally:preview')
    const spec = getDigimonModel(name)
    if (!actor || actor.spec?.url !== spec?.url) {
      this.removeActor('ally:preview')
      this.ready = false
      delete this.host.dataset.previewReady
      this.renderer.clear()
      this.showcase = null
    }
    this.previewFacing = facing
    this.update({ allies: spec ? [{ id: 'preview', name, intro }] : [], enemies: [], gameSpeed: 1,
      showcase: effect ? { effect, durationMs: effectMs } : null })
    this.modelAssets.trim()
  }

  update(state) {
    if (!state || this.disposed || this.failed) return
    if (state.paused != null) this.setPaused(Boolean(state.paused))
    this.speed = Number(state.gameSpeed) || 1
    this.mapName = state.mapName
    const switches = this.ledger.take('switch', state.switchEffects)
    const captures = this.ledger.take('capture', state.captureEffects)
    this.actingKey = state.actingId == null ? null : actorKey(state.actingSide ?? 'ally', state.actingId)
    this.targetIds = new Set(state.targetIds || [])
    if (state.showcase?.effect && !this.showcase) this.showcase = { ...state.showcase, started: false }
    const next = new Set()
    for (const [side, units] of [['ally', state.allies || []], ['enemy', state.enemies || []]]) {
      for (const unit of units) {
        const key = actorKey(side, unit.id)
        next.add(key)
        const spec = getDigimonModel(unit)
        let actor = this.actors.get(key)
        if (actor && actor.spec?.url !== spec?.url) { this.removeActor(key); actor = null }
        if (!actor) {
          actor = this.addActor(key, side, unit, spec)
          this.actors.set(key, actor)
        }
        actor.unit = unit
        // Decode the next form while the current form fights; a phase change uses
        // the same actor ID and must never play a death/recall animation.
        for (const phase of (unit.bossEncounter?.phases.slice(unit.bossEncounter.phase) ?? []).filter(phase => phase.form).slice(0, 1)) {
          const future = phase.form && getDigimonModel(phase.form)
          if (!future || this.preloadTimers.has(future.url) || (this.bossPreloads.has(future.url) && this.modelAssets.entries.has(future.url))) continue
          this.bossPreloads.add(future.url)
          // Visible actors take priority over speculative future phases.
          this.preloadTimers.set(future.url, setTimeout(() => {
            this.preloadTimers.delete(future.url)
            if (this.disposed) return
            this.loadModel(future).catch(error => {
              this.bossPreloads.delete(future.url)
              console.warn('Boss form preload failed', phase.form, error)
            })
          }, 700))
        }
        if (actor.removedAt != null) {
          this.clearSwitch(actor)
          if (actor.defeat?.effect && this.fx.effects.includes(actor.defeat.effect)) {
            this.fx.remove(actor.defeat.effect)
            this.fx.effects = this.fx.effects.filter(effect => effect !== actor.defeat.effect)
          }
          // Reinforcements can return before their old death fade finishes.
          // The held down clip must not survive into the living actor's next turn.
          actor.motion = null
          actor.hitAt = actor.dodgeAt = null
          actor.mixer?.stopAllAction()
          actor.action = null
          this.playClip(actor, CLIP_ROLES.idle, { loop: true })
        }
        actor.removedAt = null
        actor.defeat = null
      }
    }
    for (const [key, actor] of this.actors) {
      if (!next.has(key) && actor.removedAt == null) {
        // A slow frame may batch the charge cue and the state swap together.
        // The serialized cue still identifies an absorbed source as a fusion.
        if (actor.fusion || (actor.side === 'enemy' && state.hitEffects?.some(event => event.kind === 'boss' && event.bossKind === 'fusion' &&
          event.consumedIds?.includes(actor.unit.id)))) { this.removeActor(key); continue }
        // A captured enemy leaves as data; it must never fall into the KO path.
        if (actor.capture?.event.success || state.captureEffects?.some(event => event.success && actorKey(event.targetSide || 'enemy', event.targetId) === key)) {
          this.removeActor(key)
          continue
        }
        const recall = switches.find(event => actorKey(event.side || 'ally', event.outgoingId) === key)
        if (recall) {
          this.beginSwitch(actor, 'out', recall)
          actor.removedAt = actor.transition.start
          continue
        }
        actor.motion = null
        actor.removedAt = this.clock()
        this.beginDefeat(actor)
      }
    }
    this.layoutDirty = true
    this.layout()
    for (const actor of this.actors.values()) {
      if (actor.capture && !state.captureEffects?.some(event => event.id === actor.capture.event.id)) this.clearCapture(actor)
    }
    for (const event of captures) {
      const actor = this.findActor(event.targetSide || 'enemy', event.targetId)
      if (actor) this.beginCapture(actor, event)
    }
    for (const event of switches) {
      const incoming = this.findActor(event.side || 'ally', event.incomingId)
      if (incoming) this.beginSwitch(incoming, 'in', event)
    }
    const now = this.clock()
    for (const event of this.ledger.take('motion', state.attackMotions)) {
      this.beginAttack(event, now)
    }
    for (const event of this.ledger.take('projectile', state.projectileEffects)) {
      this.beginAttack(event, now)
    }
    for (const event of this.ledger.take('hit', state.hitEffects)) {
      const actor = this.findActor(event.targetSide, event.targetId)
      if (event.kind === 'card') {
        if (actor) this.fx.cast(actor.base.clone().add(new THREE.Vector3(0, actor.height * .45, 0)),
          { kind: event.cardKind === 'heal' ? 'nature' : event.cardKind === 'guard' ? 'ice' : event.cardKind === 'weaken' ? 'dark' : 'light' }, now, 550 / (event.speed || this.speed), actor.height)
        continue
      }
      if (event.kind === 'boss') {
        if (event.bossKind === 'fusion') { this.beginFusion(event, now); continue }
        if (actor) {
          const start = now, speed = event.speed || this.speed
          if (event.bossKind === 'evolve') {
            this.fx.evolution(actor.base.clone(), actor.height * .85, 'charge', start, 500 / speed)
            this.fx.evolution(actor.base.clone(), actor.height * .85, 'burst', start + 500 / speed, 600 / speed)
          } else if (actor.spec?.name === '위그드라실 7D6') {
            this.fx.programRebuild(actor.base.clone(), actor.height * .85, start, 520 / speed)
          } else {
            this.fx.evolution(actor.base.clone(), actor.height * .85, 'burst', start, 520 / speed)
          }
        }
        continue
      }
      if (event.kind === 'status') {
        this.addStatusImpact(event, now, actor)
        continue
      }
      if (event.isMiss) {
        if (actor && !actor.removedAt) { actor.dodgeAt = now; this.playClip(actor, CLIP_ROLES.dodge, { fitMs: 480 }) }
        const position = this.targetPoint(event)
        if (position) this.fx.miss(position, now, 480 / this.speed, actor?.side === 'ally' ? -1 : 1)
        this.addDamageNumber(event, now, actor)
        continue
      }
      this.addImpact(event, now, actor)
      for (const cue of event.statusCues ?? []) this.addStatusImpact(cue, now, actor)
      if (Number.isFinite(event.damage) && event.damage > 0) {
        this.addDamageNumber(event, now, actor)
      }
      if (actor) {
        actor.hitAt = now
        // The killing blow arrives together with the removal; keep the defeat clip.
        if (!actor.removedAt) { actor.motion = null; this.playClip(actor, CLIP_ROLES.hit, { fitMs: HIT_MS }) }
      }
    }
    this.reportStatus()
  }

  findActor(side, id) {
    return this.actors.get(actorKey(side, id)) || [...this.actors.values()].find((actor) => actor.unit.id === id)
  }

  beginFusion(event, now) {
    const leader = this.findActor('enemy', event.targetId)
    const partners = (event.consumedIds ?? []).map(id => this.findActor('enemy', id)).filter(Boolean)
    if (!leader) return
    const speed = event.speed || this.speed
    if (!partners.length) {
      // If the swap already happened, finish on the new model without replaying
      // its sources or shrinking the fused actor.
      if (leader.unit.name === event.nextName) this.fx.evolution(leader.base.clone(), leader.height,
        'burst', now, (BOSS_FUSION_MS - BOSS_FUSION_SWAP_MS) / speed)
      return
    }
    const actors = [leader, ...partners]
    const center = actors.reduce((position, actor) => position.add(actor.base), new THREE.Vector3()).divideScalar(actors.length)
    const height = Math.max(...actors.map(actor => actor.height))
    for (const [index, actor] of actors.entries()) {
      actor.motion = null; actor.hitAt = actor.dodgeAt = null
      this.playClip(actor, CLIP_ROLES.idle, { loop: true })
      actor.fusion = { start: now, swapMs: BOSS_FUSION_SWAP_MS / speed, from: actor.base.clone(), center }
      this.fx.evolution(actor.base.clone(), actor.height * .85, 'charge', now, BOSS_FUSION_SWAP_MS / speed)
      this.fx.projectile(actor.base.clone().add(new THREE.Vector3(0, actor.height * .5, 0)),
        center.clone().add(new THREE.Vector3(0, height * .5, 0)),
        { kind: index ? 'light' : 'energy' }, now + 300 / speed, 450 / speed)
    }
    this.fx.evolution(center, height, 'burst', now + BOSS_FUSION_SWAP_MS / speed,
      (BOSS_FUSION_MS - BOSS_FUSION_SWAP_MS) / speed)
  }

  targetPoint(event, attacker = false) {
    const actor = this.findActor(attacker ? event.attackerSide : event.targetSide, attacker ? event.attackerId : event.targetId)
    if (!actor) return null
    return actor.base.clone().add(new THREE.Vector3(0, actor.height * (actor.modelHeight ?? 1) * 0.52, 0))
  }

  addActor(key, side, unit, spec) {
    const root = new THREE.Group()
    const body = new THREE.Group()
    root.add(body)
    this.scene.add(root)
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: this.texture, color: 0x041019, transparent: true, opacity: 0.6, depthWrite: false }),
    )
    // Contact shadow on the ground; the map's sun adds the real cast shadow on top.
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.012
    shadow.renderOrder = 1
    root.add(shadow)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.37, 0.44, 48),
      new THREE.MeshBasicMaterial({ color: side === 'ally' ? 0x66e3ff : 0xff8c76, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.03
    ring.renderOrder = 2
    root.add(ring)
    const actor = { key, unit, side, spec, root, body, ring, shadow, base: new THREE.Vector3(), height: 2, joints: [], loaded: false }
    if (spec) this.loadModel(spec).then(async (asset) => {
      if (this.disposed || this.failed || this.actors.get(key) !== actor) return
      const { normalized, model, mixer, clips, height } = prepareModel(asset, spec)
      if (this.isBattleField) actor.footprint = getBattleFootprint(asset, spec, { normalized, mixer, clips }, side)
      body.add(normalized)
      actor.model = normalized
      actor.groundOcclusion = createGroundOcclusion(normalized, actor.base.y)
      actor.modelHeight = height
      model.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false
          child.castShadow = this.isBattleField
        }
        if (child.isBone && /arm|hand|leg|thigh|spine|neck|head|elbow|knee|chest|ude|asi|kubi/i.test(child.name)) {
          actor.joints.push({ bone: child, quaternion: child.quaternion.clone(), name: child.name.toLowerCase() })
        }
      })
      if (mixer) {
        actor.mixer = mixer
        actor.clips = clips
        actor.mixer.addEventListener('finished', (event) => {
          if (event.action !== actor.action || actor.holdClip) return
          // 'finished' fires before the mixer applies its final bindings. Capture
          // that last pose after update(), otherwise recovery starts a frame early.
          actor.finishToIdle = true
        })
        this.playClip(actor, CLIP_ROLES.idle, { loop: true })
        // Showcase views (evolution) can open with a one-off pose before idling.
        if (CLIP_ROLES[unit.intro]) this.playClip(actor, CLIP_ROLES[unit.intro])
      }
      if (this.renderer?.compileAsync) {
        actor.root.visible = false
        await this.renderer.compileAsync(actor.root, this.camera, this.scene)
        if (this.disposed || this.failed || this.actors.get(key) !== actor) return
        actor.root.visible = true
      }
      actor.loaded = true
      if (actor.removedAt != null && !actor.transition) this.beginDefeat(actor)
      this.layoutDirty = true
      this.reportStatus()
    }).catch((error) => {
      if (this.disposed || this.failed || this.actors.get(key) !== actor) return
      actor.loadError = true
      console.warn(`3D model unavailable: ${unit.name}`, error.message)
      this.reportStatus()
    })
    return actor
  }

  playClip(actor, roles, { loop = false, fitMs = 0, hold = false, startMs = this.clock?.() ?? 0,
    blendMs = CLIP_BLEND_MS, speed = this.speed || 1, floorOffset = 0 } = {}) {
    const clip = actor.clips && pickClip(actor.clips, roles)
    if (!clip) return
    const action = actor.mixer.clipAction(clip)
    const blending = beginPoseTransition(actor, action, { startMs, durationMs: blendMs, speed, floorOffset })
    actor.hasActiveClip = true
    actor.holdClip = hold
    action.reset()
    action.setEffectiveWeight(blending ? 0 : 1)
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1)
    action.clampWhenFinished = !loop
    // frame() advances the mixer by dt * game speed, so the rate here only fits the timing window.
    action.timeScale = loop ? 1 : clipPlaybackRate(clip.duration, fitMs)
    action.play()
    actor.mixer.update(0)
  }

  beginDefeat(actor) {
    const clip = actor.clips && pickClip(actor.clips, CLIP_ROLES.defeat)
    actor.defeat = { ...defeatPresentation(clip?.duration), speed: this.speed }
    actor.hitAt = null
    actor.dodgeAt = null
    this.playClip(actor, CLIP_ROLES.defeat, { hold: true, startMs: actor.removedAt })
    if (clip && actor.action) actor.action.timeScale = 0
    if (actor.loaded) actor.defeat.effect = this.fx.defeat(actor.base.clone(), actor.height * (actor.modelHeight ?? 1),
      actor.removedAt + actor.defeat.fadeStartMs / actor.defeat.speed, 750 / actor.defeat.speed)
  }

  beginSwitch(actor, kind, event) {
    this.clearCapture(actor)
    this.clearSwitch(actor)
    const speed = event.speed || this.speed
    actor.transition = {
      kind, speed, start: (event.startedAt ?? this.clock()) + (kind === 'in' ? SWITCH_IN_DELAY_MS / speed : 0),
      duration: (kind === 'in' ? SWITCH_IN_MS : SWITCH_OUT_MS) / speed,
    }
    actor.motion = null
    actor.hitAt = null
    actor.dodgeAt = null
    // Recall is a standing light effect, never a down clip or a leftover damage blend.
    actor.mixer?.stopAllAction()
    actor.action = null
    this.playClip(actor, CLIP_ROLES.idle, { loop: true })
    actor.body.visible = kind !== 'in'
  }

  poseSwitch(actor, now) {
    const transition = actor.transition
    if (!transition) return
    const progress = (now - transition.start) / transition.duration
    if (progress >= 1 && transition.kind === 'in') { this.clearSwitch(actor); return }
    const opacity = switchOpacity(transition.kind, progress)
    actor.body.visible = opacity > 0
    actor.shadow.material.opacity = .6 * opacity
    actor.ring.material.opacity *= opacity
    if (actor.loaded && !transition.materials) {
      // Skeleton clones share source materials. A fading party member must not fade its twin.
      transition.materials = []
      actor.model.traverse(mesh => {
        if (!mesh.isMesh) return
        const original = mesh.material
        const entries = [].concat(original).map(source => {
          const material = cloneActorMaterial(actor, source)
          material.transparent = true
          material.depthWrite = false
          return { source, material }
        })
        mesh.material = Array.isArray(original) ? entries.map(entry => entry.material) : entries[0].material
        transition.materials.push({ mesh, original, entries })
      })
    }
    for (const { entries } of transition.materials || []) {
      for (const { source, material } of entries) {
        material.opacity = source.opacity * opacity
        if (material.emissive) material.emissive.copy(source.emissive).lerp(new THREE.Color(0x67dcff), (1 - opacity) * .65)
      }
    }
    if (progress >= 0 && progress < 1 && !transition.effect) {
      transition.effect = this.fx.switch(actor.base.clone(), actor.height * (actor.modelHeight ?? 1),
        transition.start, transition.duration, transition.kind === 'in')
    }
  }

  clearSwitch(actor) {
    const transition = actor.transition
    if (!transition) return
    for (const { mesh, original, entries } of transition.materials || []) {
      mesh.material = original
      for (const { material } of entries) material.dispose()
    }
    if (transition.effect && this.fx.effects.includes(transition.effect)) {
      this.fx.remove(transition.effect)
      this.fx.effects = this.fx.effects.filter(effect => effect !== transition.effect)
    }
    actor.transition = null
    actor.body.visible = true
    actor.shadow.material.opacity = .6
  }

  beginCapture(actor, event) {
    this.clearSwitch(actor)
    this.clearCapture(actor)
    actor.capture = { event: { ...event, speed: captureSpeed(event.speed), startedAt: event.startedAt ?? this.clock() } }
    actor.motion = null
    actor.hitAt = actor.dodgeAt = null
    actor.mixer?.stopAllAction()
    actor.action = null
    this.playClip(actor, CLIP_ROLES.idle, { loop: true })
  }

  poseCapture(actor, now) {
    const capture = actor.capture
    const { event } = capture
    const pose = capturePose((now - event.startedAt) * event.speed, event.success)
    if (pose.complete && !event.success) { this.clearCapture(actor); return }
    // If the asset arrives during the throw, refit the net at the same clock time.
    if (capture.effect && actor.loaded && !capture.fittedModel) {
      if (this.fx.effects.includes(capture.effect)) {
        this.fx.remove(capture.effect)
        this.fx.effects = this.fx.effects.filter(effect => effect !== capture.effect)
      }
      capture.effect = null
    }
    if (!capture.effect) {
      actor.root.updateMatrixWorld(true)
      const bounds = actor.model ? getVisibleModelBounds(actor.model).getSize(new THREE.Vector3()) : new THREE.Vector3(actor.height, actor.height, actor.height)
      const caster = this.findActor(event.sourceSide || 'ally', event.sourceId)
      capture.effect = this.captureFx.play({ event,
        height: actor.height * (actor.modelHeight ?? 1), width: bounds.x,
        target: () => actor.base,
        origin: () => (caster?.base || actor.base).clone().add(new THREE.Vector3(0, (caster?.height || actor.height) * .5, 0)),
      })
      capture.fittedModel = actor.loaded
    }
    if (actor.loaded && !capture.materials) {
      capture.materials = []
      actor.model.traverse(mesh => {
        if (!mesh.isMesh) return
        const original = mesh.material
        const entries = [].concat(original).map(source => {
          const material = cloneActorMaterial(actor, source)
          material.transparent = true
          material.depthWrite = false
          return { source, material }
        })
        mesh.material = Array.isArray(original) ? entries.map(entry => entry.material) : entries[0].material
        capture.materials.push({ mesh, original, entries })
      })
    }
    for (const { entries } of capture.materials || []) {
      for (const { source, material } of entries) {
        material.opacity = source.opacity * pose.opacity
        if (material.emissive) material.emissive.copy(source.emissive).lerp(new THREE.Color(0x7eefff), (1 - pose.opacity) * .8)
      }
    }
    actor.body.visible = pose.opacity > .001
    actor.body.scale.multiplyScalar(pose.scale)
    actor.body.position.y += pose.lift * actor.height * (actor.modelHeight ?? 1)
    actor.ring.material.opacity *= pose.opacity
    actor.shadow.material.opacity = .6 * pose.opacity
  }

  clearCapture(actor) {
    const capture = actor.capture
    if (!capture) return
    for (const { mesh, original, entries } of capture.materials || []) {
      mesh.material = original
      for (const { material } of entries) material.dispose()
    }
    if (capture.effect && this.fx.effects.includes(capture.effect)) {
      this.fx.remove(capture.effect)
      this.fx.effects = this.fx.effects.filter(effect => effect !== capture.effect)
    }
    actor.capture = null
    actor.body.visible = true
    actor.body.scale.setScalar(actor.height)
    actor.shadow.material.opacity = .6
  }

  layout() {
    if (!this.layoutDirty) return
    const rect = this.host.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    this.rect = rect
    const ratio = getRenderPixelRatio(rect.width, rect.height, window.devicePixelRatio, 1.75)
    if (this.renderer.getPixelRatio() !== ratio) this.renderer.setPixelRatio(ratio)
    this.renderer.setSize(rect.width, rect.height, false)
    const aspect = rect.width / rect.height
    const anchors = [...this.field.querySelectorAll('[data-combatant-id]')]
    const logicalHeight = this.host.clientHeight || rect.height
    const pixelScale = rect.height / logicalHeight
    const worldPerPixel = 10 / rect.height
    let mapFloor = this.field.dataset.groundY
    // Measure the painted area itself; HUD/status rail changes must not shift
    // the floor, and physical CSS-scaled pixels must be converted only once.
    const background = this.isBattleField && this.mapName && (
      this.field.closest('.adventure-stage')?.querySelector('.adventure-stage__background')
      || this.field.querySelector('.adventure-stage__background'))
    if (background) {
      const painted = background.getBoundingClientRect()
      if (painted.width && painted.height) {
        mapFloor = (painted.top - rect.top + getMapPresentation(this.mapName, painted.width, painted.height).groundY) / pixelScale
        this.field.style.setProperty('--map-ground-y', `${mapFloor}px`)
      }
    }
    this.camera.left = -5 * aspect
    this.camera.right = 5 * aspect
    this.camera.updateProjectionMatrix()
    // A resize or model load during impact shake must not bake that temporary
    // camera displacement into the permanent floor anchors.
    if (this.cameraBase) this.camera.position.copy(this.cameraBase)
    this.camera.updateMatrixWorld()
    const teams = {}, formationEntries = []
    if (this.isBattleField) for (const actor of this.actors.values()) {
      const anchor = anchors.find(element => element.dataset.combatantId === String(actor.unit.id) && element.dataset.side === actor.side)
      const team = anchor?.closest('.adventure-allies, .adventure-enemies')
      if (!team) continue
      const teamRect = team.getBoundingClientRect(), anchorRect = anchor.getBoundingClientRect()
      const slotRect = anchor.closest('.adventure-ally, .adventure-enemy')?.getBoundingClientRect() || anchorRect
      teams[actor.side] = { left: (teamRect.left - rect.left) * worldPerPixel, width: teamRect.width * worldPerPixel }
      const floorY = mapFloor == null ? anchorRect.bottom - 8 : rect.top + Number(mapFloor) * pixelScale
      formationEntries.push({ key: actor.key, side: actor.side, footprint: actor.footprint || { width: 1, height: 1 },
        center: (slotRect.left + slotRect.width / 2 - rect.left) * worldPerPixel,
        desiredHeight: 148 / logicalHeight * 10 * .96 * getDigimonDisplayScale(actor.unit),
        maxHeight: Math.max(40 * pixelScale, floorY - rect.top - 96 * pixelScale) * worldPerPixel })
    }
    const formation = fitDigimonFormation(formationEntries, teams, {
      gap: 12 / logicalHeight * 10, padding: 8 / logicalHeight * 10, minHeight: 28 / logicalHeight * 10,
      depthGap: 8 / logicalHeight * 10, bounds: { left: 0, right: rect.width * worldPerPixel },
    })
    for (const actor of this.actors.values()) {
      const anchor = anchors.find((element) => element.dataset.combatantId === String(actor.unit.id) && element.dataset.side === actor.side)
      if (!anchor) continue
      if (actor.anchor !== anchor) {
        actor.anchor?.removeAttribute('data-model-ready')
        actor.anchor = anchor
        this.resizeObserver.observe(anchor)
      }
      const bounds = anchor.getBoundingClientRect()
      const image = anchor.querySelector('.adventure-player__sprite')
      const imageBounds = image?.getBoundingClientRect() || bounds
      const x = (bounds.left + bounds.width / 2 - rect.left) / rect.width * 2 - 1
      // Map floors are logical design pixels, independent of status-card height.
      const groundScreenY = mapFloor == null ? bounds.bottom - 8
        : rect.top + Number(mapFloor) * pixelScale
      const y = -(groundScreenY - rect.top) / rect.height * 2 + 1
      if (this.isBattleField) {
        const slot = anchor.closest('.adventure-ally, .adventure-enemy')
        const slotBounds = slot?.getBoundingClientRect() || bounds
        const footprint = actor.footprint || { width: 1, height: 1 }
        const maxWidth = Math.max(24 * pixelScale, slotBounds.width - 16 * pixelScale) / rect.height * 10
        const maxHeight = Math.max(40 * pixelScale, groundScreenY - rect.top - 96 * pixelScale) / rect.height * 10
        const placement = formation.get(actor.key)
        actor.height = placement?.scale ?? fitDigimonScale(148 / logicalHeight * 10 * .96 * getDigimonDisplayScale(actor.unit) / footprint.height, footprint, maxWidth, maxHeight)
        // The slot centre on the floor line becomes a point on the 3D ground. Actors the
        // formation stacks behind a neighbour step back into the scene at the same screen x.
        const centerPx = placement ? placement.center / worldPerPixel : bounds.left + bounds.width / 2 - rect.left
        this.groundPoint(centerPx, groundScreenY - rect.top, rect, actor.base)
        const depthScale = placement?.z ? this.stepBack(actor.base, placement.z) : 1
        const foot = actor.base.clone().project(this.camera)
        const liftPx = (groundScreenY - rect.top) - (1 - foot.y) / 2 * rect.height
        // Match the clickable area to the fitted model; the containing grid slot
        // remains the layout authority so this cannot create a ResizeObserver loop.
        if (slot) {
          anchor.style.setProperty('--battle-model-width', `${(footprint.width * actor.height * depthScale * logicalHeight / 10).toFixed(2)}px`)
          anchor.style.setProperty('--battle-model-height', `${(footprint.height * actor.height * depthScale * logicalHeight / 10).toFixed(2)}px`)
          anchor.style.setProperty('--battle-model-lift', `${(liftPx / pixelScale).toFixed(2)}px`)
          if (placement) anchor.style.setProperty('--battle-model-layer', String(placement.layer))
        }
      } else {
        this.ray.setFromCamera(new THREE.Vector2(x, y), this.camera)
        this.ray.ray.intersectPlane(this.groundPlane, actor.base)
        // Detail cards deliberately fit their subject for readable close-ups.
        actor.height = THREE.MathUtils.clamp((imageBounds.height || bounds.height) / rect.height * 10 * .96, .65, this.field.classList.contains('digimon-model-preview') ? 8.5 : 4.5)
      }
      actor.body.scale.setScalar(actor.height)
      actor.shadow.scale.set(actor.height * 1.05, actor.height * 0.8, 1)
      actor.ring.scale.setScalar(actor.height * 0.72)
      actor.root.position.copy(actor.base)
      // Conversation and starter portraits face the viewer; combatants face their opponent.
      actor.body.rotation.y = !this.isBattleField && this.previewFacing === 'front'
        ? 0 : actor.side === 'ally' ? Math.PI * 0.34 : -Math.PI * 0.34
    }
    this.layoutDirty = false
  }

  // Screen point (px inside the host) on the floor line -> point on the 3D ground.
  groundPoint(xPx, yPx, rect, target) {
    this.ray.setFromCamera(new THREE.Vector2(xPx / rect.width * 2 - 1, 1 - yPx / rect.height * 2), this.camera)
    if (!this.ray.ray.intersectPlane(this.groundPlane, target)) target.set(0, 0, 0)
    return target
  }

  // Moves a ground point deeper by dz (< 0) keeping its screen x; returns the size ratio.
  stepBack(base, dz) {
    base.z += dz
    return 1
  }

  reportStatus() {
    const current = [...this.actors.values()].filter((actor) => !actor.removedAt)
    const loaded = current.filter((actor) => actor.loaded).length
    const pending = current.filter((actor) => actor.spec && !actor.loaded && !actor.loadError).length
    const message = pending ? `3D 모델 불러오는 중 · ${loaded} / ${current.length}`
      : loaded === current.length ? '3D BATTLE · 입체 모션 & 속성 이펙트'
      : `3D 모델 ${loaded} / ${current.length} · 일부 모델을 불러오지 못했습니다`
    this.onStatus(message)
    this.host.dataset.loadedModels = String(loaded)
    this.host.dataset.actorCount = String(current.length)
  }

  beginAttack(event, now) {
    const actor = this.findActor(event.attackerSide, event.attackerId)
    if (!actor || actor.removedAt) return
    this.clearCapture(actor)
    if (actor.transition?.kind === 'in') this.clearSwitch(actor)
    const plan = event.presentation || resolveAttackPresentation({ ...event, attackerSpecies: actor.spec?.name })
    actor.motion = { event, plan, start: event.startedAt ?? now, speed: event.speed || this.speed,
      target: this.targetPoint(event), launched: new Set(), initialized: false }
  }

  poseAttack(actor, now) {
    const motion = actor.motion
    if (!motion) return
    const { plan, start, speed, target } = motion
    const elapsed = Math.max(0, (now - start) * speed)
    if (actor.loaded && !motion.initialized) {
      this.playClip(actor, [new RegExp(`^${plan.clip}$`)], { hold: true,
        startMs: start, speed, blendMs: Math.min(CLIP_BLEND_MS, plan.releaseMs / 2) })
      if (actor.action) {
        actor.action.timeScale = 0
        actor.action.time = 0
        // Measure the source's pure opening pose, then restore the displayed
        // blend. Idle must be fully gone by the first firing landmark.
        actor.clipBlend?.from.setEffectiveWeight(0)
        actor.action.setEffectiveWeight(1)
        actor.mixer.update(0)
        actor.root.updateMatrixWorld(true)
        const bounds = getModelGroundBounds(actor.model)
        // Some special clips start already airborne in the source game. Anchor their
        // opening pose here; subsequent authored jumps remain intact, without a teleport.
        motion.floorOffset = Number.isFinite(bounds.min.y) ? (actor.base.y - bounds.min.y) / actor.height : 0
        const bodyJoint = actor.model.getObjectByName(plan.bodyBone)
        if (plan.motionFx && bodyJoint) {
          const bodyBounds = getModelGroundBounds(actor.model, new THREE.Box3(), { body: true })
          if (!bodyBounds.isEmpty()) motion.bodyCenterOffset = bodyJoint.worldToLocal(bodyBounds.getCenter(new THREE.Vector3()))
        }
        if (actor.clipBlend) actor.clipBlend.toFloor = motion.floorOffset
        else actor.clipFloorOffset = motion.floorOffset
        updatePoseTransition(actor, now)
        actor.mixer.update(0)
      }
      motion.initialized = true
      if (plan.motionFx && target) this.skillFx.motion?.(
        () => this.actors.has(actor.key) && actor.motion === motion ? attackEmitter(actor, plan, target) : null,
        () => {
          if (!this.actors.has(actor.key) || actor.motion !== motion) return null
          const joint = actor.model.getObjectByName(plan.bodyBone)
          return joint && motion.bodyCenterOffset ? joint.localToWorld(motion.bodyCenterOffset.clone())
            : actor.body.localToWorld(new THREE.Vector3(0, (actor.modelHeight ?? 1) * .5, 0))
        },
        target, plan, start, plan.motionMs / speed, actor.height * (actor.modelHeight ?? 1),
        () => attackBodyDirection(actor, plan))
      if (elapsed < plan.releaseMs && target) this.skillFx.charge(() => attackEmitter(actor, plan, target), plan,
        start, plan.releaseMs / speed, actor.height * (actor.modelHeight ?? 1))
    }
    if (motion.initialized && actor.action) actor.action.time = sampleAttackClip(plan, elapsed)
    updatePoseTransition(actor, now)
    if (elapsed >= plan.motionMs) {
      // Apply the real source ending before blending back; a late RAF catches
      // up to the recovery clock rather than cutting to idle or replaying it.
      actor.mixer?.update(0)
      actor.motion = null
      actor.poseFloorOffset = actor.clipFloorOffset || 0
      if (plan.groundLift && actor.model) {
        actor.root.updateMatrixWorld(true)
        const endingBounds = getModelGroundBounds(actor.model)
        if (Number.isFinite(endingBounds.min.y)) actor.poseFloorOffset = Math.max(actor.poseFloorOffset, (actor.base.y - endingBounds.min.y) / actor.height)
      }
      if (!actor.removedAt) this.playClip(actor, CLIP_ROLES.idle, { loop: true, speed,
        startMs: start + plan.motionMs / speed, blendMs: plan.recoveryMs ?? ATTACK_RECOVERY_MS })
      updatePoseTransition(actor, now)
      return
    }
    if (target && plan.movement !== 'stationary') {
      const direction = target.clone().sub(actor.base); direction.y = 0
      const distance = direction.length()
      const targetActor = this.findActor(motion.event.targetSide, motion.event.targetId)
      const reach = actor.height * .38 + (targetActor?.height || 1) * .25
      const travel = Math.max(0, distance - reach) * (plan.movement === 'dash' ? 1 : .92)
      actor.root.position.addScaledVector(direction.normalize(), travel * attackAdvance(plan, elapsed))
    }
  }

  releaseAttack(actor, now) {
    const motion = actor.motion
    if (!motion) return
    const { event, plan, start, speed } = motion
    const elapsed = (now - start) * speed
    for (const [index, strike] of plan.strikes.entries()) {
      if (elapsed < strike.releaseMs || motion.launched.has(index)) continue
      motion.launched.add(index)
      // A late model/network frame catches up to the shared clock instead of replaying old shots.
      if (elapsed >= strike.impactMs || !actor.loaded) continue
      for (const targetEvent of event.targets || [event]) {
        const target = this.targetPoint(targetEvent)
        if (!target) continue
        if (targetEvent.isMiss) target.y += actor.height * .45
        const emitter = () => attackEmitter(actor, plan, target, index)
        // Capture a projectile at the exact source release pose, even if the RAF arrived late.
        // Continuous beams stay attached to the animated muzzle after release.
        const currentTime = actor.action?.time
        const currentHeight = actor.body?.position.y
        if (actor.action) {
          if (actor.body) actor.body.position.y += (sampleAttackLift(plan, strike.releaseMs) - sampleAttackLift(plan, elapsed)) * actor.height
          actor.action.time = sampleAttackClip(plan, strike.releaseMs); actor.mixer.update(0); actor.root.updateMatrixWorld(true)
        }
        const launchPoint = emitter()
        if (actor.action) { if (actor.body) actor.body.position.y = currentHeight; actor.action.time = currentTime; actor.mixer.update(0); actor.root.updateMatrixWorld(true) }
        this.skillFx.launch(['beam', 'tether'].includes(plan.delivery) ? emitter : launchPoint, target, plan, start + strike.releaseMs / speed,
          (strike.impactMs - strike.releaseMs) / speed, actor.height * (actor.modelHeight ?? 1), index)
        // Earlier pellets have cosmetic impacts. Only the final hit updates HP and hit reaction.
        if (index < plan.strikes.length - 1 && !targetEvent.isMiss) this.skillFx.impact(target, plan,
          start + strike.impactMs / speed, 280 / speed, actor.height * .45, false, index)
      }
    }
  }

  addImpact(event, start, target) {
    const position = this.targetPoint(event)
    if (!position) return
    const plan = event.presentation || resolveAttackPresentation(event)
    this.skillFx.impact(position, plan, start, HIT_MS / (event.speed || this.speed),
      target ? target.height * (target.modelHeight ?? 1) : 1, Boolean(event.isCritical))
  }

  addStatusImpact(event, start, target) {
    if (!target) return
    this.statusFx.impact(event, () => this.actors.has(target.key) ? {
      position: target.body.getWorldPosition(new THREE.Vector3()),
      height: target.height * (target.modelHeight ?? 1),
    } : null, start, event.speed || this.speed)
    if (event.phase === 'damage') {
      const point = this.targetPoint(event)
      if (point && event.damage > 0) {
        point.y += target.height * (target.modelHeight ?? 1) * .5 + .2
        const feedback = getDamageFeedback(event, event.statusType === '화상' ? 0xff9c69 : 0xc18dff)
        this.fx.damageNumber(point, { ...feedback, label: event.statusType, multiplier: null }, start, DAMAGE_TEXT_MS / (event.speed || this.speed))
      }
      if (!target.removedAt) { target.motion = null; this.playClip(target, CLIP_ROLES.hit, { fitMs: HIT_MS }) }
    }
  }

  addDamageNumber(event, start, target) {
    const point = this.targetPoint(event)
    if (!point) return
    const height = target ? target.height * (target.modelHeight ?? 1) : 1
    point.y += height * 0.5 + 0.2
    const feedback = getDamageFeedback(event, (event.presentation || resolveAttackPresentation(event)).palette.color)
    this.fx.damageNumber(point, feedback, start, DAMAGE_TEXT_MS / (event.speed || this.speed))
  }

  // Showcase views (evolution) start their light effect once the actor has a place on screen,
  // and brighten the model itself toward a white silhouette at the moment of change.
  startShowcase(now) {
    const actor = [...this.actors.values()].find((candidate) => candidate.anchor)
    if (!actor) return
    const phase = this.showcase.effect === 'evolution-burst' ? 'burst' : 'charge'
    const duration = Math.max(600, Number(this.showcase.durationMs) || 4000)
    this.fx.evolution(actor.base.clone(), actor.height * 0.85, phase, now, phase === 'burst' ? Math.min(duration, 1800) : duration)
    actor.glow = { phase, start: now, duration }
    this.showcase.started = true
  }

  applyGlow(actor, now) {
    const { phase, start, duration } = actor.glow
    const p = clamp01((now - start) / duration)
    const amount = phase === 'burst' ? 1 - clamp01(p / 0.3) : clamp01((p - 0.55) / 0.4)
    if (!actor.glowMaterials) {
      actor.glowMaterials = []
      actor.model?.traverse((child) => {
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
          if (material?.emissive) actor.glowMaterials.push({ material, emissive: material.emissive.clone() })
          else if (material?.color) actor.glowMaterials.push({ material, color: material.color.clone() })
        }
      })
    }
    for (const entry of actor.glowMaterials) {
      if (entry.emissive) entry.material.emissive.copy(entry.emissive).lerp(new THREE.Color(0xffffff), amount)
      else entry.material.color.copy(entry.color).lerp(new THREE.Color(0xffffff), amount)
    }
    if (p >= 1) actor.glow = null
  }

  frame(now) {
    this.frameId = null
    if (this.disposed || this.failed || this.paused || this.borrowed || this.offscreen || document.hidden) return
    this.frameId = requestAnimationFrame(this.frame)
    now = this.clock()
    const dt = Math.max(0, Math.min((now - this.lastTime) / 1000, 0.05))
    this.lastTime = now
    this.layout()
    if (this.showcase && !this.showcase.started) this.startShowcase(now)
    for (const [key, actor] of this.actors) {
      const removalDuration = actor.transition?.kind === 'out' ? actor.transition.duration
        : actor.defeat ? actor.defeat.durationMs / actor.defeat.speed : HIT_MS / this.speed
      if (actor.removedAt != null && now - actor.removedAt >= removalDuration) { this.removeActor(key); continue }
      if (!actor.loaded) continue
      actor.root.position.copy(actor.base)
      actor.body.position.set(0, 0, 0)
      actor.body.rotation.x = 0
      actor.body.rotation.z = 0
      actor.body.scale.setScalar(actor.height)
      this.poseAttack(actor, now)
      const defeat = actor.defeat && defeatPose(actor.defeat, (now - actor.removedAt) * actor.defeat.speed)
      if (defeat && actor.action) {
        actor.action.time = defeat.clipSeconds
      }
      updatePoseTransition(actor, now)
      actor.mixer?.update(dt * (actor.motion?.speed || this.speed))
      if (actor.finishToIdle) {
        actor.poseFloorOffset = actor.clipFloorOffset || 0
        if (pickClip(actor.clips, CLIP_ROLES.idle)) this.playClip(actor, CLIP_ROLES.idle, { loop: true, startMs: now })
        else { actor.finishToIdle = false; actor.action = null; actor.hasActiveClip = false }
      }
      actor.body.position.y += (actor.clipFloorOffset || 0) * actor.height
      const motion = actor.motion
      if (motion) actor.body.position.y += sampleAttackLift(motion.plan, (now - motion.start) * motion.speed) * actor.height
      const motionProgress = motion ? clamp01((now - motion.start) * motion.speed / motion.plan.motionMs) : 0
      if (!actor.hasActiveClip) {
        for (const joint of actor.joints) {
          joint.bone.quaternion.copy(joint.quaternion)
          const amplitude = /arm|hand|ude|elbow/.test(joint.name) ? 0.5 : /leg|thigh|asi|knee/.test(joint.name) ? 0.25 : 0.1
          const angle = motion ? Math.sin(motionProgress * Math.PI * 2) * amplitude : Math.sin(now * 0.002) * 0.018
          joint.bone.rotateX(angle)
        }
      }
      const hitProgress = actor.hitAt ? (now - actor.hitAt) / (360 / this.speed) : 1
      if (hitProgress < 1) {
        actor.body.position.x = Math.sin(hitProgress * Math.PI * 5) * 0.12 * (1 - hitProgress)
        actor.body.rotation.z += (actor.side === 'ally' ? 1 : -1) * Math.sin(hitProgress * Math.PI) * 0.14
      } else actor.body.position.x = 0
      const dodgeProgress = actor.dodgeAt ? (now - actor.dodgeAt) / (480 / this.speed) : 1
      if (dodgeProgress < 1) actor.root.position.z -= Math.sin(dodgeProgress * Math.PI) * 0.8
      // Idle roots stay in contact; recoil and falls cannot sink into the floor.
      // Attack parts can extend below the feet, so authored attacks keep their
      // opening-pose offset rather than grounding on a revealed projectile.
      const idleAction = !actor.action || actor.action.getClip() === pickClip(actor.clips || [], CLIP_ROLES.idle)
      const resting = idleAction && !actor.motion && (actor.removedAt == null || actor.transition) && hitProgress >= 1 && dodgeProgress >= 1
      // Measured flights retain their native leap, with a floor safety check for
      // blended or interpolated poses between the stored height samples.
      const correctedFlight = Boolean(motion?.plan.groundLift)
      if (actor.model && (!actor.motion || correctedFlight)) {
        actor.groundBounds ??= new THREE.Box3()
        actor.root.updateMatrixWorld(true)
        getModelGroundBounds(actor.model, actor.groundBounds, { body: !resting })
        if (Number.isFinite(actor.groundBounds.min.y) && (resting || actor.groundBounds.min.y < actor.base.y)) {
          const recovery = actor.clipBlend && resting && actor.groundBounds.min.y >= actor.base.y ? actor.clipBlend.progress : 1
          const correction = actor.base.y - actor.groundBounds.min.y
          actor.body.position.y += correction * recovery
          actor.root.updateMatrixWorld(true)
        }
      }
      if (actor.groundOcclusion) actor.groundOcclusion.plane.constant = -actor.base.y
      if (actor.glow && actor.model) this.applyGlow(actor, now)
      // Targets share the HUD's gold highlight; the actor keeps its side's color.
      const targeted = this.targetIds?.has(actor.unit.id)
      const focused = targeted || key === this.actingKey
      const pulse = focused ? (Math.sin(now * 0.006) + 1) / 2 : 0
      actor.ring.material.color.setHex(targeted ? 0xffd16b : actor.side === 'ally' ? 0x66e3ff : 0xff8c76)
      actor.ring.material.depthTest = !targeted
      actor.ring.renderOrder = targeted ? 8 : 0
      actor.ring.material.opacity = targeted ? 0.85 + pulse * 0.15 : focused ? 0.55 + pulse * 0.4 : 0.22
      actor.ring.scale.setScalar((targeted ? Math.max(0.9, actor.height * 0.95) : actor.height * 0.72) * (1 + pulse * 0.08))
      if (actor.capture) this.poseCapture(actor, now)
      else if (actor.fusion) {
        const pose = fusionPose(now - actor.fusion.start, actor.fusion.swapMs)
        actor.root.position.lerpVectors(actor.fusion.from, actor.fusion.center, pose.convergence)
        actor.body.scale.multiplyScalar(pose.scale)
        actor.body.position.y += actor.height * pose.lift
        actor.ring.material.opacity = pose.ringOpacity
      }
      else if (actor.transition) this.poseSwitch(actor, now)
      else if (actor.removedAt != null) {
        const fade = defeat?.fade ?? clamp01((now - actor.removedAt) / (HIT_MS / this.speed))
        actor.body.scale.multiplyScalar(1 - fade * fade)
        actor.body.position.y += fade * 0.3
        actor.ring.material.opacity = (1 - fade) * 0.4
      }
      actor.root.updateMatrixWorld(true)
      actor.poseFloorOffset = actor.body.position.y / actor.height
    }
    for (const actor of this.actors.values()) this.releaseAttack(actor, now)
    this.fx.update(now, dt)
    const shake = this.fx.shakeOffset(now)
    this.camera.position.copy(this.cameraBase)
    if (shake) this.camera.position.add(shake)
    try {
      this.renderer.render(this.scene, this.camera)
    } catch (error) {
      this.failed = true
      this.restoreAnchors()
      this.onReady(false)
      this.onStatus('3D 표시 오류가 발생했습니다. 화면을 새로 고쳐 주세요.')
      console.warn('3D render failed', error)
      return
    }
    // Publish readiness only after a real, correctly posed frame has reached the canvas.
    // A network completion or a blank render must not hide the loading portrait.
    let presented = false
    for (const actor of this.actors.values()) {
      if (!actor.loaded || !actor.anchor) continue
      actor.anchor.dataset.modelReady = 'true'
      presented = true
    }
    if (presented && !this.ready) {
      this.ready = true
      if (!this.isBattleField) this.host.dataset.previewReady = 'true'
      this.onReady(true)
    }
    this.host.dataset.activeEffects = String(this.fx.count)

  }

  removeActor(key) {
    const actor = this.actors.get(key)
    if (!actor) return
    this.clearCapture(actor)
    this.clearSwitch(actor)
    actor.anchor?.removeAttribute('data-model-ready')
    actor.anchor?.style?.removeProperty('--battle-model-width')
    actor.anchor?.style?.removeProperty('--battle-model-height')
    actor.anchor?.style?.removeProperty('--battle-model-layer')
    actor.anchor?.style?.removeProperty('--battle-model-lift')
    if (actor.anchor) this.resizeObserver.unobserve(actor.anchor)
    actor.mixer?.stopAllAction()
    clearPoseTransition(actor)
    actor.mixer?.uncacheRoot(actor.mixer.getRoot())
    this.scene.remove(actor.root)
    actor.ring.geometry.dispose()
    actor.ring.material.dispose()
    actor.shadow.geometry.dispose()
    actor.shadow.material.dispose()
    // Geometry and textures belong to the shared template; each clone owns its skeleton's bone texture.
    actor.model?.traverse((child) => { if (child.isSkinnedMesh) child.skeleton.dispose() })
    actor.groundOcclusion?.dispose()
    this.actors.delete(key)
  }

  restoreAnchors() {
    delete this.host.dataset.previewReady
    for (const actor of this.actors.values()) {
      actor.anchor?.removeAttribute('data-model-ready')
      for (const property of ['--battle-model-width', '--battle-model-height', '--battle-model-layer', '--battle-model-lift']) actor.anchor?.style?.removeProperty(property)
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.unregisterSurface?.()
    cancelAnimationFrame(this.frameId)
    this.resizeObserver.disconnect()
    this.visibilityObserver?.disconnect()
    document.removeEventListener('visibilitychange', this.handleVisibility)
    for (const timer of this.preloadTimers.values()) clearTimeout(timer)
    this.preloadTimers.clear()
    window.removeEventListener('resize', this.handleResize)
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost)
    for (const key of this.actors.keys()) this.removeActor(key)
    this.fx.dispose()
    this.modelAssets.dispose()
    this.texture.dispose()
    this.renderer.dispose()
    // Each preview owns a WebGL context; release it instead of waiting for garbage collection.
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
  }
}
