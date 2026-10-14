import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as THREE from 'three'
import expansion7 from '../src/data/rosterExpansion7.json' with { type: 'json' }
import expansion8 from '../src/data/rosterExpansion8.json' with { type: 'json' }
const expansion={names:[...expansion7.names,...expansion8.names]}
import recipes from '../src/data/expansionSkillEffects.json' with { type: 'json' }
import manifest from '../src/data/digimonModelManifest.json' with { type: 'json' }
import { ATTACK_PROFILES, resolveAttackPresentation, sampleAttackClip } from '../src/three/attackPresentation.js'
import { ATTACK_STYLES } from '../src/three/attackStyles.js'
import { PALETTES } from '../src/three/skillEffectRecipes.js'
import { SkillEffects, makeSkillObject } from '../src/three/SkillEffects.js'
import { BattleEffects } from '../src/three/BattleEffects.js'
import { attackEmitter } from '../src/three/attackAnatomy.js'

function pool() {
  const fx = Object.create(BattleEffects.prototype)
  Object.assign(fx, { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), effects: [], shake: 0,
    textures: Object.fromEntries(['glow','smoke','spark','leaf'].map(k=>[k,new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1)])),
    geometries: {sphere:new THREE.IcosahedronGeometry(1,2),shard:new THREE.OctahedronGeometry(),cube:new THREE.BoxGeometry(),
      torus:new THREE.TorusGeometry(1,.06,8,24),plane:new THREE.PlaneGeometry(),arc:new THREE.RingGeometry(.78,1,24),
      cylinder:new THREE.CylinderGeometry(1,1,1,12,1,true).translate(0,.5,0),rock:new THREE.DodecahedronGeometry(),spike:new THREE.ConeGeometry()} })
  return fx
}

test('every newly added species and every original signature has explicit art direction',()=>{
  assert.deepEqual(new Set(Object.keys(recipes)),new Set(expansion.names))
  assert.equal(Object.values(recipes).reduce((n,r)=>n+Object.keys(r).length,0),304)
  for(const name of expansion.names)assert.deepEqual(Object.keys(recipes[name]),Object.keys(ATTACK_PROFILES[name].signature))
})

for(const name of expansion.names)test(name+': native clips, real emitters, finite 3D effects and complete cleanup',()=>{
  const bytes=fs.readFileSync(new URL('../public'+manifest[name].url,import.meta.url))
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'))
  const nodes=new Set(gltf.nodes.map(n=>n.name))
  const clips=new Set(gltf.animations.map(a=>a.name))
  const fx=pool(),effects=new SkillEffects(fx),from=new THREE.Vector3(-2,1,0),to=new THREE.Vector3(2,1,0)
  for(const [skillName,recipe]of Object.entries(recipes[name])){
    assert(ATTACK_STYLES[recipe.style],skillName+' style')
    assert(PALETTES[recipe.palette],skillName+' palette')
    assert(nodes.has(recipe.bone),name+': '+skillName+' emitter '+recipe.bone)
    for(const bone of [...recipe.bones??[],...recipe.secondBone?[recipe.secondBone]:[]])assert(nodes.has(bone))
    const plan=resolveAttackPresentation({attackerSpecies:name,skillName})
    assert.equal(plan.effectSource,'expansion-signature')
    assert.equal(plan.clip,ATTACK_PROFILES[name].signature[skillName].clip)
    assert(clips.has(plan.clip))
    assert.equal(plan.emitter.role,recipe.anchor)
    assert.equal(plan.emitter.bone,recipe.bone)
    assert.equal(plan.shots,recipe.shots)
    assert(plan.shots>=1&&plan.shots<=8)
    assert([plan.palette.color,plan.palette.core,plan.releaseMs,plan.impactMs,plan.totalMs,plan.size].every(Number.isFinite))
    for(let i=0;i<plan.clock.length;i++)if(i)assert(plan.clock[i].atMs>=plan.clock[i-1].atMs&&plan.clock[i].sourceSeconds>=plan.clock[i-1].sourceSeconds)
    for(const strike of plan.strikes)assert(Math.abs(sampleAttackClip(plan,strike.releaseMs)-strike.sourceSeconds)<1e-5)
    const object=makeSkillObject(fx,plan)
    let pieces=0
    object.traverse(n=>{if(n.isMesh){pieces++;const a=n.geometry.getAttribute('position');assert([...a.array].every(Number.isFinite))}n.material?.dispose()})
    assert(pieces<=48,skillName+' object budget '+pieces)
    effects.motion(()=>from.clone(),()=>from.clone(),to,plan,0,650,2)
    effects.charge(()=>from.clone(),plan,0,180,2)
    for(let i=0;i<plan.shots;i++){
      effects.launch(()=>from.clone(),to,plan,180+i*60,300,2,i)
      effects.impact(to,plan,480+i*60,250,2,false,i)
    }
    for(const now of [1,80,180,260,340,500,650,800,1000,1600]){
      fx.update(now,.016);fx.scene.updateMatrixWorld(true)
      fx.scene.traverse(n=>assert([...n.matrixWorld.elements].every(Number.isFinite),skillName+' world matrix'))
    }
    assert.equal(fx.count,0,skillName+' expired effect')
    assert.equal(fx.scene.children.length,0,skillName+' scene cleanup')
  }
  fx.dispose()
})

const cases=[
 ['유피테르몬[래스 모드]','디오스 썬더','blade','overhead',1],
 ['주엘비몬','스파이크 버스터','blade','weapon',1],
 ['사이케몬','화려화려 호른','lightning','head',2],
 ['코로나몬','코로나 플레임','fireball','eyes',1],
 ['아이기오몬','아이언 트러스트','punch','feet',1],
 ['아이기오투스몬[다크]','플라즈마 매드니스','lightning','hands',2],
 ['아루다몬','브라흐마 스트라','bullet','hands',8],
 ['건드라몬','게발트 슈베르머','bullet','shoulders',8],
 ['그레이스노바몬','칼리돈 아르쿠스','blade','back',8],
 ['메디벌듀크몬','레이지 ･ 오브 ･ 와이번','beam','weapon',1],
 ['빅토리그레이몬','트라이던트 가이아','beam','hands',3],
 ['황제드라몬[드래곤]','메가 데스','beam','cannon',1],
 ['레베몬','엔트리히 ･ 메테오르','beam','chest',1],
 ['잠수몬','산소 어뢰','missile','cannon',3],
 ['세이렌몬','제 3곡 《캐논》','orb','mouth',5],
]
for(const[name,skillName,style,anchor,shots]of cases)test(name+' '+skillName+': recognizable canonical delivery',()=>{
 const p=resolveAttackPresentation({attackerSpecies:name,skillName})
 assert.equal(p.styleId,style);assert.equal(p.emitter.role,anchor);assert.equal(p.shots,shots)
})
test('water, ink, poison and fire have different beam bodies rather than recolored flame cones',()=>{
 const plans=[['쉘몬','하이드로 프레셔'],['옥토몬','카이메이 보쿠쥬'],['레드베지몬','하자드 브레스'],['마린데블몬','악마의 입김']]
  .map(([attackerSpecies,skillName])=>resolveAttackPresentation({attackerSpecies,skillName}))
 assert.deepEqual(plans.map(p=>p.shape),['waterJet','inkJet','mistJet','flame'])
})
test('dual-hand and multi-gun volleys use different physical source joints',()=>{
 for(const[name,skill]of [['아루다몬','브라흐마 스트라'],['건드라몬','게발트 슈베르머'],['그레이스노바몬','칼리돈 아르쿠스']]){
  const p=resolveAttackPresentation({attackerSpecies:name,skillName:skill}),model=new THREE.Group()
  const names=[...new Set([p.emitter.bone,p.emitter.secondBone,...p.emitter.bones??[]].filter(Boolean))]
  for(let i=0;i<names.length;i++){const n=new THREE.Object3D();n.name=names[i];n.position.set(0,i*.5,0);model.add(n)}
  model.updateMatrixWorld(true)
  const actor={model,height:1,modelHeight:1,root:model},target=new THREE.Vector3(3,1,0)
  if(names.length>1)assert(attackEmitter(actor,p,target,0).distanceTo(attackEmitter(actor,p,target,1))>.1)
 }
})

test('music notes and throwing discs retain a readable face as they travel',()=>{
 for(const[name,skillName]of [['가와파몬','디제이 슈터'],['세이렌몬','제 3곡 《캐논》']]){
  const fx=pool(),plan=resolveAttackPresentation({attackerSpecies:name,skillName})
  new SkillEffects(fx).launch(new THREE.Vector3(-2,1,0),new THREE.Vector3(2,1,0),plan,0,300,2)
  fx.update(150,.016)
  const head=fx.scene.getObjectByName('signature-object:'+plan.motif)
  assert(head)
  const normal=new THREE.Vector3(0,0,1).applyQuaternion(head.quaternion)
  assert(normal.angleTo(new THREE.Vector3(0,0,1).applyQuaternion(fx.camera.quaternion))<1e-6)
  fx.dispose()
 }
})
test('energy beams use longitudinal flow, not a row of edge-on hoops',()=>{
 const fx=pool(),plan=resolveAttackPresentation({attackerSpecies:'황제드라몬[드래곤]',skillName:'메가 데스'})
 new SkillEffects(fx).launch(new THREE.Vector3(-2,1,0),new THREE.Vector3(2,1,0),plan,0,300,2)
 fx.update(150,.016)
 const group=fx.scene.children.find(n=>n.name.startsWith('skill-beam:'))
 assert(group)
 assert.equal(group.children.filter(n=>n.geometry===fx.geometries.torus).length,0)
 fx.dispose()
})

test('Dios Thunder falls as a weapon while Holy Flare remains sacred flame',()=>{
 const falling=resolveAttackPresentation({attackerSpecies:'유피테르몬[래스 모드]',skillName:'디오스 썬더'})
 assert.equal(falling.delivery,'projectile');assert.equal(falling.trajectory,'rain')
 for(const attackerSpecies of ['크로노몬[홀리 모드]','크로노몬[디스트로이 모드]']){
  const fire=resolveAttackPresentation({attackerSpecies,skillName:'홀리 플레어'})
  assert.equal(fire.shape,'flame')
 }
})
