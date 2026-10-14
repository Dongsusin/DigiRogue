import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { BattleRenderer, prepareModel } from '../src/three/BattleRenderer.js'
import { SkillEffects } from '../src/three/SkillEffects.js'
import { resolveAttackPresentation, sampleAttackLift, sampleAttackClip } from '../src/three/attackPresentation.js'

// Pose checks use the shipped skeleton, meshes and native clip. Texture decoding
// is omitted only because Node has no browser image decoder; no bone data changes.
async function nativeModel(slug = 'wargreymon') {
  const binary = await fs.readFile(new URL('../public/models/digimon/' + slug + '.glb', import.meta.url))
  const jsonBytes = binary.readUInt32LE(12)
  const gltf = JSON.parse(binary.subarray(20, 20 + jsonBytes).toString())
  function omitTextures(value) {
    if (!value || typeof value !== 'object') return
    for (const key of Object.keys(value)) {
      if (key.endsWith('Texture')) delete value[key]
      else omitTextures(value[key])
    }
  }
  omitTextures(gltf.materials)
  delete gltf.images; delete gltf.textures
  const json = Buffer.from(JSON.stringify(gltf)), padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20)
  json.copy(padded)
  const header = Buffer.from(binary.subarray(0, 20))
  header.writeUInt32LE(20 + padded.length + binary.length - 20 - jsonBytes, 8)
  header.writeUInt32LE(padded.length, 12)
  const bytes = Buffer.concat([header, padded, binary.subarray(20 + jsonBytes)])
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
}
const asset = await nativeModel()
const forward = new THREE.Vector3(0, 0, 1)
function effectPool() {
  return {
    geometries: { shard: new THREE.OctahedronGeometry(1, 0) }, effects: [],
    additive: (color, opacity) => new THREE.MeshBasicMaterial({ color, opacity, transparent: true, depthWrite: false }),
    add(effect) { this.effects.push(effect) },
  }
}
function fixture(side, height, speed = 1) {
  const fitted = prepareModel(asset, { name: '워그레이몬' })
  const root = new THREE.Group(), body = new THREE.Group()
  root.add(body); body.add(fitted.normalized)
  body.scale.setScalar(height); body.rotation.y = side === 'ally' ? Math.PI / 2 : -Math.PI / 2
  const plan = resolveAttackPresentation({ attackerSpecies: '워그레이몬', skillName: '브레이브 토네이도', attribute: '바람' })
  const actor = { ...fitted, root, body, side, height, modelHeight: fitted.height, base: new THREE.Vector3(side === 'ally' ? -4 : 4, .7, 0),
    key: side + ':1', unit: { id: 1 }, spec: { name: '워그레이몬' }, loaded: true, action: fitted.mixer.clipAction(fitted.clips.find(clip => clip.name === 'idle')) }
  const fx = effectPool(), renderer = Object.create(BattleRenderer.prototype)
  renderer.actors = new Map([[actor.key, actor]]); renderer.skillFx = new SkillEffects(fx); renderer.speed = speed; renderer.clock = () => 0
  actor.motion = { plan, start: 0, speed, target: new THREE.Vector3(side === 'ally' ? 4 : -4, 1.4, 0), event: { targetSide: side === 'ally' ? 'enemy' : 'ally', targetId: 2 }, launched: new Set(), initialized: false }
  function sample(elapsed) {
    actor.root.position.copy(actor.base); actor.body.position.set(0, 0, 0)
    renderer.poseAttack(actor, elapsed / speed); actor.mixer.update(0)
    actor.body.position.y += (actor.clipFloorOffset || 0) * height + sampleAttackLift(plan, elapsed) * height
    actor.root.updateMatrixWorld(true)
    const effect = fx.effects.find(entry => entry.group.name === 'skill-motion:tornado')
    const keep = effect.update(elapsed / plan.motionMs)
    return { effect, keep }
  }
  sample(0)
  return { actor, plan, fx, renderer, sample }
}
for (const [side, height, speed] of [['ally', 1.2, 1], ['enemy', 3.4, 1], ['ally', 2.4, 2]]) {
  test('Brave Tornado follows the native body axis and center: ' + side + ', height ' + height + ', speed ' + speed, () => {
    const { actor, plan, sample } = fixture(side, height, speed)
    const center = actor.model.getObjectByName('J_center'), head = actor.model.getObjectByName('J_head')
    const initialAxis = head.getWorldPosition(new THREE.Vector3()).sub(center.getWorldPosition(new THREE.Vector3())).normalize()
    let largestTurn = 0
    for (const phase of [.12, .24, .36, .47, .59, .71, .83, .93]) {
      const { effect, keep } = sample(plan.motionMs * phase)
      assert.notEqual(keep, false)
      const expectedAxis = head.getWorldPosition(new THREE.Vector3()).sub(center.getWorldPosition(new THREE.Vector3())).normalize()
      const actualAxis = forward.clone().applyQuaternion(effect.group.quaternion)
      assert(actualAxis.angleTo(expectedAxis) < 1e-5, 'vortex must follow native 3D tilt rather than a fixed target line at phase ' + phase)
      const expectedCenter = center.localToWorld(actor.motion.bodyCenterOffset.clone())
      assert(effect.group.position.distanceTo(expectedCenter) < 1e-5, 'vortex must remain attached to the animated body')
      assert([...effect.group.position, ...effect.group.quaternion].every(Number.isFinite))
      largestTurn = Math.max(largestTurn, initialAxis.angleTo(expectedAxis))
    }
    assert(largestTurn > .5, 'fixture must exercise a real turning/airborne pose')
  })
}
test('Brave Tornado removes its attachment when the attack ends or the actor disappears', () => {
  const ended = fixture('ally', 1.4)
  ended.renderer.poseAttack(ended.actor, ended.plan.motionMs + 1)
  assert.equal(ended.fx.effects[0].update(.95), false)
  const removed = fixture('enemy', 1.4)
  removed.renderer.actors.clear()
  assert.equal(removed.fx.effects[0].update(.4), false)
})
test('other contact skills retain target-facing effects even when a body direction is available', () => {
  const fx = effectPool(), skillFx = new SkillEffects(fx)
  const plan = { motif: 'rush', motionFx: { kind: 'rush' }, palette: { color: 0xabc123, core: 0xffffff } }
  const position = new THREE.Vector3(2, 1, -1), target = new THREE.Vector3(-3, 2, .4)
  skillFx.motion(() => position, () => position, target, plan, 0, 1000, 1, () => new THREE.Vector3(0, 1, 0))
  fx.effects[0].update(.5)
  const actual = forward.clone().applyQuaternion(fx.effects[0].group.quaternion)
  assert(actual.angleTo(target.clone().sub(position).normalize()) < 1e-6)
})
test('missing/degenerate direction safely falls back and never produces a non-finite orientation', () => {
  for (const direction of [null, new THREE.Vector3(), new THREE.Vector3(NaN, 0, 0)]) {
    const fx = effectPool(), plan = { motif: 'braveTornado', motionFx: { kind: 'tornado' }, palette: { color: 0xffbb25, core: 0xfff0ba } }
    const origin = new THREE.Vector3(), target = new THREE.Vector3(1, .5, 0)
    new SkillEffects(fx).motion(() => origin, () => origin, target, plan, 0, 1000, 1, () => direction)
    fx.effects[0].update(.4)
    const axis = forward.clone().applyQuaternion(fx.effects[0].group.quaternion)
    assert(axis.angleTo(target.clone().normalize()) < 1e-6)
    assert([...fx.effects[0].group.quaternion].every(Number.isFinite))
  }
})

// The release landmark must be a visibly open native jaw, not the generic 48% point.
test('Little Blizzard releases from SnowAgumon only after its native jaw opens',async()=>{
 const snow=await nativeModel('snowagumon');const plan=resolveAttackPresentation({attackerSpecies:'스노우아구몬',skillName:'리틀 블리자드'});
 const fitted=prepareModel(snow,{name:'스노우아구몬'}),jaw=fitted.model.getObjectByName('J_joe');assert(jaw,'source jaw bone missing');
 const idle=jaw.quaternion.clone();fitted.mixer.stopAllAction();const action=fitted.mixer.clipAction(fitted.clips.find(c=>c.name===plan.clip));action.play();action.timeScale=0;
 for(const speed of [1,2,3]){const elapsed=plan.releaseMs/speed;action.time=sampleAttackClip(plan,elapsed*speed);fitted.mixer.update(0);assert(jaw.quaternion.angleTo(idle)>.7,'cold breath fired while jaw is closed at source '+action.time);}
 fitted.mixer.stopAllAction();fitted.mixer.uncacheRoot(fitted.model);
});
