import expansionEffects from '../src/data/expansionSkillEffects.json' with { type: 'json' }
import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { resolveAttackPresentation, ATTACK_PROFILES } from '../src/three/attackPresentation.js'
import { SkillEffects, makeSkillObject } from '../src/three/SkillEffects.js'
import { BattleEffects } from '../src/three/BattleEffects.js'

const plan = (species, skillName, attribute) => resolveAttackPresentation({ attackerSpecies: species, skillName, attribute })
const blue = tone => { const c = new THREE.Color(tone); return c.b > c.r * 1.4 && c.b >= c.g }
for (const species of ['파피몬', '파피몬(흑)', '가루몬', '가루몬(흑)']) {
  const skill = species.startsWith('파피') ? '쁘띠 파이어' : '푸른화염포'
  test(species + ' keeps blue fire from release through impact without changing the damage element', () => {
    const p = plan(species, skill, '화염')
    assert(blue(p.palette.color), 'outer flame must be blue')
    assert(blue(p.palette.core), 'flame core must remain blue rather than orange/white')
    assert.equal(p.palette.kind, 'fire')
    assert.equal(p.impactKind, 'flame')
    assert.equal(p.motif, 'blueFlame')
    assert.equal(p.emitter.role, 'mouth')
    assert(p.clip && p.strikes.length && p.impactMs > p.releaseMs)
  })
}
const cases = [
  ['워그레이몬', '가이아 포스', 'orb', 'solar', 'explosion'],
  ['아구몬', '베이비 플레임', 'fireball', 'solar', 'flame'],
  ['그레이몬', '메가파이어', 'fireball', 'solar', 'explosion'],
  ['피요몬', '빙빙회오리', 'vortex', 'spiralFlame', 'flame'],
  ['버드라몬', '메테오 윙', 'fireball', 'meteorWing', 'flame'],
  ['텐타몬', '쁘띠 썬더', 'lightning', 'electric', 'lightning'],
  ['캅테리몬', '전기충격', 'orb', 'electroOrb', 'lightning'],
  ['쉬라몬', '물고기 행진', 'fish', 'marchingFishes', 'water'],
  ['원뿔몬', '뿔 날리기', 'missile', 'harpoon', 'explosion'],
  ['팔몬', '포이즌 아이비', 'vine', 'poisonVines', 'vines'],
  ['릴리몬', '꽃잎 포', 'orb', 'flowerCannon', 'petals'],
  ['레나몬', '호엽설', 'crystal', 'diamondStorm', 'pierce'],
  ['메탈가루몬', '코큐토스 브레스', 'frost', 'frost', 'frost'],
  ['엔젤몬', '헤븐즈 너클', 'fist', 'holy', 'holy'],
]
for (const [species, skill, shape, motif, impact] of cases) test(skill + ' uses its technique-specific form', () => {
  const p = plan(species, skill)
  assert.equal(p.shape, shape); assert.equal(p.motif, motif); assert.equal(p.impactKind, impact)
})
test('spacing and inherited techniques resolve the same canonical art direction', () => {
  assert.deepEqual(plan('파피몬', '쁘띠파이어', '화염').palette, plan('파피몬', '쁘띠 파이어', '화염').palette)
  assert.deepEqual(plan('아구몬', '쁘띠 파이어', '화염').palette, plan('파피몬', '쁘띠 파이어', '화염').palette)
  assert.notDeepEqual(plan('아구몬', '베이비 플레임').palette, plan('파피몬', '쁘띠 파이어').palette)
})

function pool() {
  const fx = Object.create(BattleEffects.prototype)
  Object.assign(fx, { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), effects: [], shake: 0,
    textures: Object.fromEntries(['glow', 'smoke', 'spark', 'leaf'].map(k => [k, new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1)])),
    geometries: { sphere: new THREE.IcosahedronGeometry(1, 2), shard: new THREE.OctahedronGeometry(), cube: new THREE.BoxGeometry(),
      torus: new THREE.TorusGeometry(1,.06,8,24), plane: new THREE.PlaneGeometry(), arc: new THREE.RingGeometry(.78,1,24),
      cylinder: new THREE.CylinderGeometry(1,1,1,12,1,true).translate(0,.5,0), rock: new THREE.DodecahedronGeometry(), spike: new THREE.ConeGeometry() } })
  return fx
}
for (const [species, skill] of [['파피몬','쁘띠 파이어'],['가루몬','푸른화염포']]) test(skill + ' actual charge, projectile/beam and impact contain no warm materials', () => {
  const fx = pool(), effects = new SkillEffects(fx), p = plan(species, skill, '화염')
  const from = new THREE.Vector3(-2,1,0), to = new THREE.Vector3(2,1,0)
  effects.charge(() => from, p, 0, 300, 2)
  effects.launch(() => from, to, p, 0, 400, 2)
  effects.impact(to, p, 0, 500, 2)
  for (const time of [1,80,200,320]) {
    fx.update(time,.016)
    fx.scene.updateMatrixWorld(true)
    fx.scene.traverse(o => {
      assert([...o.position,...o.scale,...o.quaternion].every(Number.isFinite))
      if(o.material?.color) assert(o.material.color.b >= o.material.color.r, 'warm color leaked into ' + o.type)
    })
  }
  assert(fx.scene.children.length > 0)
  fx.update(2000,.016); assert.equal(fx.count,0); assert.equal(fx.scene.children.length,0)
  fx.dispose()
})
test('native signatures keep their source clips, anatomical emitters and release markers', () => {
  for(const [species,skill,clip,anchor] of [['파피몬','쁘띠 파이어','special01','mouth'],['가루몬','푸른화염포','special01','mouth']]) {
    const p=plan(species,skill)
    assert.equal(p.clip,clip); assert.equal(p.emitter.role,anchor)
    assert(p.strikes.every(s => s.impactMs >= s.releaseMs))
  }
})
test('technique geometry is finite, bounded and disposes after repeated volleys', () => {
  const fx=pool(),effects=new SkillEffects(fx),from=new THREE.Vector3(-2,1,0),to=new THREE.Vector3(2,1,0)
  for(const [species,skill] of [...cases,['파피몬','쁘띠 파이어'],['가루몬','푸른화염포'],['워그레이몬','브레이브 토네이도']]) {
    const p=plan(species,skill),object=makeSkillObject(fx,p)
    let count=0;object.traverse(o=>{if(o.isMesh)count++})
    assert(count <= 36, skill + ' geometry budget exceeded')
    object.traverse(o=>o.material?.dispose())
    effects.charge(()=>from,p,0,300,2)
    for(let i=0;i<Math.min(7,p.shots);i++)effects.launch(()=>from,to,p,300,400,2,i)
    effects.impact(to,p,700,500,2)
  }
  for(let now=0;now<=1600;now+=40){fx.update(now,.04);fx.scene.updateMatrixWorld(true);fx.scene.traverse(o=>assert([...o.matrixWorld.elements].every(Number.isFinite)))}
  assert.equal(fx.count,0);assert.equal(fx.scene.children.length,0);fx.dispose()
})

test('every shipped signature retains its native clip and resolves a finite presentation', () => {
  let signatures=0
  for (const [species,rig] of Object.entries(ATTACK_PROFILES)) for(const [skillName,signature] of Object.entries(rig.signature)) {
    const p=plan(species,skillName)
    assert.equal(p.clip,signature.clip,species+': '+skillName+' native clip')
    assert.equal(p.emitter.role,expansionEffects[species]?.[skillName]?.anchor ?? signature.anchor,species+': '+skillName+' anatomy')
    assert([p.size,p.releaseMs,p.impactMs,p.motionMs,p.palette.color,p.palette.core].every(Number.isFinite),species+': '+skillName)
    assert(p.strikes.length>0 && p.strikes.length===p.shots)
    for(let i=0;i<p.clock.length;i++)assert(i===0||p.clock[i].atMs>=p.clock[i-1].atMs)
    signatures++
  }
  assert(signatures>500)
})

test('freezing missiles keep cold muzzle light, exhaust and frost impacts', () => {
  const fx=pool(),effects=new SkillEffects(fx),p=plan('메탈가루몬','그레이스 크로스 프리저')
  effects.launch(new THREE.Vector3(),new THREE.Vector3(2,1,0),p,0,400,2)
  effects.impact(new THREE.Vector3(2,1,0),p,0,400,2)
  fx.scene.traverse(o=>{if(o.material?.color)assert(o.material.color.b>=o.material.color.r,'warm muzzle/exhaust leaked into freezing missile')})
  fx.dispose()
})
test('multi-colored volleys use the matching color for each impact', () => {
  const fx=pool(),effects=new SkillEffects(fx),p=plan('얼티메이트카오스몬','얼티마 버스트')
  p.shotColors.forEach((color,i)=>{
    effects.impact(new THREE.Vector3(),p,0,400,2,false,i)
    const effect=fx.effects.at(-1),matching=[]
    effect.group.traverse(o=>{if(o.material?.color?.getHex()===color)matching.push(o)})
    assert(matching.length>0)
  })
  fx.dispose()
})
