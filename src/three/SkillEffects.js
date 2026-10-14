import { makeExpansionObject, makeSignatureContactAura, animateSignatureObject } from './expansionSkillGeometry.js'
import * as THREE from 'three'
import { clamp01 } from './battle3dMath.js'
import { skillMesh, makeVortex, makeGlyph, makeEnergyObject, makeImpactMarks, makeFlameObject, makeFlameBreath, makeSpiralFlame, animateSkillObject } from './skillEffectGeometry.js'

const FORWARD = new THREE.Vector3(0, 0, 1)
const UP = new THREE.Vector3(0, 1, 0)
const VORTEX_AXIS = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2)
const TAU = Math.PI * 2
const point = value => typeof value === 'function' ? value() : value.clone()
const strikePlan = (plan, index) => plan.shotColors?.length
  ? { ...plan, palette: { ...plan.palette, color: plan.shotColors[index % plan.shotColors.length] } } : plan

// Geometry follows the skill's object (arrow, missile, feather…), never its damage element.
// Materials belong to an effect; geometries are pooled by BattleEffects and disposed with it.
export function makeSkillObject(fx, plan) {
  const group = new THREE.Group(), { color, core } = plan.palette
  const g = fx.geometries
  g.dart ??= new THREE.ConeGeometry(.22, .65, 6).rotateX(Math.PI / 2)
  g.rod ??= new THREE.CylinderGeometry(.06, .06, 1, 8).rotateX(Math.PI / 2)
  const signatureObject = makeExpansionObject(fx, plan)
  if (signatureObject) { signatureObject.userData.shape = plan.shape; return signatureObject }
  if (!g.heart) {
    const s = new THREE.Shape()
    s.moveTo(0, -.42); s.bezierCurveTo(-.9, .04, -.5, .8, 0, .35); s.bezierCurveTo(.5, .8, .9, .04, 0, -.42)
    g.heart = new THREE.ExtrudeGeometry(s, { depth: .1, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .04, bevelThickness: .04 })
  }
  const mesh = (geometry, tone = color, scale = [1, 1, 1], position = [0, 0, 0], solid = false) => {
    const material = solid ? new THREE.MeshStandardMaterial({ color: tone, roughness: .4, metalness: .35, emissive: tone, emissiveIntensity: .12 }) : fx.additive(tone, .8)
    const m = new THREE.Mesh(geometry, material)
    m.scale.set(...scale); m.position.set(...position); group.add(m); return m
  }
  const glow = (size = 1, tone = color) => { const s = fx.sprite(fx.textures.glow, tone, size); group.add(s); return s }
  switch (plan.shape) {
    case 'bullet':
      mesh(g.rod, core, [.75, .75, 1.9]); glow(.5, 0xffd36e); break
    case 'missile':
      if (plan.motif === 'harpoon') {
        g.harpoon ??= new THREE.ConeGeometry(.26, 2.1, 12).rotateX(Math.PI / 2)
        mesh(g.harpoon, 0xe8edf3, [1, 1, 1], [0, 0, .1], true)
        for (let i = 0; i < 3; i++) mesh(g.torus, 0xabbfd1, [.23 - i * .035, .23 - i * .035, .3], [0, 0, -.65 + i * .23], true)
        glow(.45, color).position.z = -.9
        break
      }
      mesh(g.rod, 0xcbd5df, [3, 3, 1.25], [0, 0, 0], true)
      mesh(g.dart, plan.motif === 'freezeMissile' ? color : 0xf55e48, [.75, .75, .75], [0, 0, .78], true)
      mesh(g.cube, 0x8f9daf, [.65, .06, .4], [0, 0, -.4], true)
      mesh(g.cube, 0x8f9daf, [.06, .65, .4], [0, 0, -.4], true)
      glow(.65, plan.motif === 'freezeMissile' ? color : 0xff9b38).position.z = -.75; break
    case 'arrow':
    case 'needle':
      mesh(g.rod, core, [.4, .4, 2.5])
      mesh(g.dart, core, [.65, .65, .9], [0, 0, 1.3])
      if (plan.shape === 'arrow') {
        mesh(g.cube, color, [.6, .025, .4], [0, 0, -1])
        mesh(g.cube, color, [.025, .6, .4], [0, 0, -1])
      }
      break
    case 'blade':
      mesh(g.shard, core, [.15, .7, 1.5]); mesh(g.arc, color, [1.4, 1.4, 1]); break
    case 'feather':
    case 'leaf':
      mesh(g.plane, plan.shape === 'leaf' ? 0x6de886 : core, [.6, 1.6, 1]).material.map = fx.textures.leaf
      mesh(g.rod, core, [.25, .25, 1.5]).rotation.x = Math.PI / 2; break
    case 'rock':
    case 'meteor':
      mesh(g.rock, plan.shape === 'meteor' ? 0x7f3c22 : 0x967552, [.7, .6, .9], [0, 0, 0], true)
      if (plan.shape === 'meteor') glow(2, 0xff632a); break
    case 'metalBall':
      mesh(g.sphere, 0xb4c9df, [.7, .7, .7], [0, 0, 0], true).material.metalness = .85
      glow(1.5, 0x9ad7ff); break
    case 'bat':
    case 'bird': {
      mesh(g.sphere, plan.shape === 'bat' ? 0x733791 : core, [.16, .2, .5])
      for (const sign of [-1, 1]) {
        const wing = mesh(g.shard, color, [.85, .08, .42], [sign * .62, 0, -.12]); wing.rotation.y = sign * .4
        wing.userData.wing = sign
        for (let i = 0; i < 3; i++) mesh(g.dart, color, [.5, .4, .7], [sign * (.3 + i * .28), 0, -.48 - i * .1]).rotation.y = Math.PI
      }
      if (plan.shape === 'bird') glow(2.2)
      break
    }
    case 'bomb':
      mesh(g.sphere, 0x363748, [.7, .7, .7], [0, 0, 0], true)
      mesh(g.rod, 0xffc860, [.7, .7, .4], [0, .7, 0]).rotation.x = Math.PI / 2; break
    case 'seed':
      mesh(g.sphere, 0x9cbb53, [.4, .6, .5], [0, 0, 0], true); break
    case 'bubble':
      mesh(g.sphere, color, [.8, .8, .8]).material.opacity = .13
      mesh(g.torus, core, [.8, .8, .8]); glow(.3, core).position.set(-.3, .3, .5); break
    case 'air':
    case 'sound':
      for (let i = 0; i < 3; i++) mesh(g.torus, i === 1 ? core : color, [1 - i * .2, 1 - i * .2, 1], [0, 0, -i * .45])
      break
    case 'heart': mesh(g.heart, 0xff72b8, [1, 1, 1]); glow(1.5, 0xff69ab); break
    case 'crystal':
      if (plan.motif === 'diamondStorm') {
        mesh(g.shard, core, [.24, .55, .07], [0, 0, 0], true)
        mesh(g.shard, color, [.27, .58, .04]).material.opacity = .22
      } else { mesh(g.shard, core, [.4, .55, 1.2]); glow(1) }
      break
    case 'fish':
      mesh(g.sphere, plan.motif === 'marchingFishes' ? color : 0x9edfea, [.28, .45, .8], [0, 0, 0], true)
      mesh(g.dart, plan.motif === 'marchingFishes' ? color : 0x74badc, [1.4, .8, .8], [0, 0, -.85], true); break
    case 'gear':
      mesh(g.torus, 0xb7c4d5, [.8, .8, .8], [0, 0, 0], true)
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; mesh(g.cube, 0xb7c4d5, [.25, .28, .2], [Math.cos(a) * .85, Math.sin(a) * .85, 0], true).rotation.z = a }
      break
    case 'fist':
      mesh(g.cube, core, [.7, .55, .55])
      for (let i = 0; i < 4; i++) mesh(g.sphere, color, [.14, .2, .24], [(i - 1.5) * .2, .15, .28])
      mesh(g.sphere, color, [.22, .23, .28], [.38, -.14, .18]); glow(1.6); break
    case 'web':
      for (let i = 1; i <= 3; i++) mesh(g.torus, core, [i * .4, i * .4, .3])
      for (let i = 0; i < 8; i++) { const spoke = mesh(g.rod, core, [.3, .3, 2.4]); spoke.rotation.set(Math.PI / 2, 0, i * Math.PI / 4) }
      break
    case 'vortex': {
      if (plan.motif === 'spiralFlame') { group.add(makeSpiralFlame(fx, plan.palette)); break }
      const cyclone = makeVortex(fx, plan.palette); cyclone.rotation.x = Math.PI / 2; group.add(cyclone); break
    }
    case 'wave':
      for (let i = 0; i < 5; i++) { const r = .5 + i * .2; const m = mesh(plan.shape === 'wave' ? g.arc : g.torus, color, [r, r, .7], [0, i * .1, -i * .2]); m.rotation.z = i * .6 }
      break
    default:
      group.add(makeEnergyObject(fx, plan))
  }
  group.userData.shape = plan.shape
  return group
}

export class SkillEffects {
  constructor(fx) { this.fx = fx }

  charge(emitter, plan, start, duration, scale) {
    if (['contact', 'native'].includes(plan.delivery) || ['bullet', 'missile', 'arrow', 'rock', 'seed', 'fish'].includes(plan.shape)) return
    const fx = this.fx, group = new THREE.Group()
    group.name = 'skill-charge:' + (plan.motif || plan.shape)
    const glow = fx.sprite(fx.textures.glow, plan.palette.color, 1)
    group.add(glow)
    const ring = new THREE.Mesh(fx.geometries.torus, fx.additive(plan.palette.core, .55))
    group.add(ring)
    const globe = (['giantOrb', 'hellfire'].includes(plan.styleId) || plan.motif === 'flowerCannon') ? makeSkillObject(fx, plan) : null
    if (globe) group.add(globe)
    fx.add({ group, start, duration, update: p => {
      group.position.copy(point(emitter))
      const radius = scale * plan.size * (.08 + p * .22)
      glow.scale.setScalar(radius * 3); glow.material.opacity = p * .75
      ring.scale.setScalar(radius); ring.rotation.set(p * 3, p * 4, p * 5); ring.material.opacity = p * .6
      if (globe) { globe.scale.setScalar(scale * plan.size * .25 * p); animateSkillObject(globe, p) }
    } })
  }

  // Contact effects follow the animated joint/body, so a dash or spin carries its
  // trail rather than leaving a stationary flash at the original battle slot.
  motion(emitter, center, target, plan, start, duration, scale, bodyDirection) {
    if (!plan.motionFx) return
    const fx=this.fx, group=new THREE.Group(),kind=plan.motionFx.kind,g=fx.geometries
    g.rod ??= new THREE.CylinderGeometry(.06,.06,1,8).rotateX(Math.PI/2)
    group.name='skill-motion:'+kind
    let object
    if (['tornado','drill'].includes(kind)) {
      object=makeVortex(fx,plan.palette,{golden:plan.motif==='braveTornado'});object.rotation.x=Math.PI/2;group.add(object)
    } else if (kind==='nightmare') {
      object=makeEnergyObject(fx,{...plan,motif:'souls'});group.add(object)
    } else {
      object=new THREE.Group();group.add(object)
      if(['claw','slash','bite'].includes(kind)) {
        for(let i=0;i<(kind==='claw'?3:kind==='bite'?2:1);i++) {
          const mark=skillMesh(fx,object,g.arc,plan.palette.core,[.7,.3,.7],[(i-1)*.18,0,0],.7)
          mark.rotation.z=-.7+i*.12
        }
      } else if(kind==='thrust') skillMesh(fx,object,g.shard,plan.palette.core,[.10,.10,1.1])
      else if(kind==='slam') {
        skillMesh(fx,object,g.sphere,plan.palette.color,[.32,.32,.32])
        skillMesh(fx,object,g.torus,plan.palette.core,[.6,.6,.6]).rotation.x=Math.PI/2
      } else if(kind==='rush') {
        for(let i=0;i<5;i++)skillMesh(fx,object,g.shard,plan.palette.core,[.04,.04,.8],[(i%3-1)*.35,(i%2-.5)*.3,-.3],.6)
      } else {
        skillMesh(fx,object,g.sphere,plan.palette.color,[.24,.24,.24],[0,0,0],.22)
        for(let i=0;i<4;i++){const mark=skillMesh(fx,object,g.shard,plan.palette.core,[.035,.035,.5],[(i%2-.5)*.25,(Math.floor(i/2)-.5)*.25,-.2]);mark.rotation.y=i*.1}
      }
    }
    const signatureAura = makeSignatureContactAura(fx, plan)
    if (signatureAura) { signatureAura.scale.setScalar(['rush','tornado','drill'].includes(kind) ? 2.1 : 1.25); object.add(signatureAura) }
    const onBody=['tornado','rush','nightmare'].includes(kind)
    fx.add({group,start,duration,update:p=>{
      const position=onBody?center():emitter()
      if(!position)return false
      group.position.copy(position)
      const bodyAxis = plan.motif === 'braveTornado' ? bodyDirection?.() : null
      const axis = bodyAxis && Number.isFinite(bodyAxis.lengthSq()) && bodyAxis.lengthSq() > 1e-8
        ? bodyAxis.clone() : target.clone().sub(position)
      if (Number.isFinite(axis.lengthSq()) && axis.lengthSq() > 1e-8) {
        group.quaternion.setFromUnitVectors(FORWARD, axis.normalize())
      }
      const gate=clamp01(p/.18)*clamp01((1-p)/.18)
      group.scale.setScalar(scale*(kind==='tornado'?.9:kind==='rush'?.42:.30)*gate)
      if(['tornado','drill'].includes(kind))object.quaternion.setFromAxisAngle(FORWARD,p*TAU*6).multiply(VORTEX_AXIS)
      else object.rotation.z=Math.sin(p*Math.PI)*.55
      animateSkillObject(object,p)
      animateSignatureObject(object,p)
      group.traverse(n=>{if(n.material){
        n.material.opacity=(n.userData.baseOpacity??.6)*gate*(n.userData.energyStreak!=null?.8+Math.sin(p*45+n.userData.energyStreak)*.2:1)
        if(n.material.userData.tornadoPhase)n.material.userData.tornadoPhase.value=p
      }})
    }})
  }

  launch(emitter, target, plan, start, duration, scale, index = 0) {
    if (plan.motif === 'marchingFishes') plan = { ...plan, palette: { ...plan.palette, color: [0xf27f65, 0x61caff, 0xffd56a, 0xa8eb93, 0xbc9bff][index % 5] } }
    plan = strikePlan(plan, index)
    if (['contact', 'native'].includes(plan.delivery)) return
    if (['beam', 'tether'].includes(plan.delivery)) return this.beam(emitter, target, plan, start, duration, scale, index)
    if (plan.delivery === 'field') return this.field(target, plan, start, duration, scale)
    const fx = this.fx, group = new THREE.Group(), from = point(emitter), to = target.clone()
    if (plan.trajectory === 'rain') from.copy(to).add(new THREE.Vector3((index - (plan.shots-1)/2)*scale*.22,scale*1.4,(index%2-.5)*scale*.3))
    group.name = 'skill-projectile:' + (plan.motif || plan.shape)
    const head = makeSkillObject(fx, plan)
    const size = scale * plan.size * (plan.shape === 'fireball' ? .33 : .25)
    head.scale.setScalar(size); group.add(head)
    if (['bullet', 'missile'].includes(plan.shape)) {
      const muzzle = new THREE.Group(); muzzle.position.copy(from)
      const flash = fx.sprite(fx.textures.spark, plan.effectSource === 'expansion-signature' || ['freezeMissile', 'harpoon'].includes(plan.motif) ? plan.palette.core : 0xffdc8c, size * 3); muzzle.add(flash)
      fx.add({ group: muzzle, start, duration: 90 * duration / plan.travelMs, update: p => { flash.scale.setScalar(size * (3 - p * 2)); flash.material.opacity = (1 - p) * .85 } })
    }
    const direction = to.clone().sub(from).normalize()
    const facing = new THREE.Quaternion().setFromUnitVectors(FORWARD, direction)
    const trail = Array.from({ length: ['bullet', 'arrow', 'needle'].includes(plan.shape) ? 3 : 7 }, (_, i) => {
      const sprite = fx.sprite(['fireball','missile','meteor'].includes(plan.shape) ? fx.textures.smoke : ['leaf','seed','feather'].includes(plan.shape) ? fx.textures.leaf : fx.textures.glow, plan.shape === 'missile' && !['freezeMissile', 'harpoon'].includes(plan.motif) ? 0xff9b38 : plan.palette.color, size * (1 - i / 9))
      group.add(sprite); return sprite
    })
    const arc = plan.trajectory === 'lob' ? scale * (.3 + index * .06) : plan.formation === 'rain' ? scale * 1.2 : 0
    const fan = plan.formation === 'fan' ? (index - (plan.shots - 1) / 2) * .16 : (index % 2 ? .06 : -.06)
    const positionAt = p => {
      const position = from.clone().lerp(to, p)
      if (plan.trajectory === 'rain') return position
      if (plan.trajectory === 'spiral') {
        const angle = p * TAU * 1.5 + index * TAU / Math.max(1, plan.shots), radius = Math.sin(p*Math.PI)*scale*.35
        return position.add(new THREE.Vector3(0,Math.cos(angle)*radius,Math.sin(angle)*radius))
      }
      return position.add(new THREE.Vector3(0, Math.sin(p * Math.PI) * (arc + Math.abs(fan) * scale * .35), Math.sin(p * Math.PI) * fan * scale))
    }
    fx.add({ group, start, duration, update: p => {
      head.position.copy(positionAt(p)); head.quaternion.copy(facing)
      if (plan.effectSource === 'expansion-signature') {
        const tangent = positionAt(Math.min(1,p+.015)).sub(positionAt(Math.max(0,p-.015)))
        if (tangent.lengthSq()>1e-8) head.quaternion.setFromUnitVectors(FORWARD,tangent.normalize())
      }
      if (plan.effectSource === 'expansion-signature' && /Notes|Disc|Wheel|shuriken|Shield|talismanCards|royalTablet|flowerBomb|roseStorm/.test(plan.motif)) head.quaternion.copy(fx.camera.quaternion)
      if ((['blade', 'gear', 'leaf', 'feather', 'web', 'vortex'].includes(plan.shape) || plan.motif === 'diamondStorm')) head.rotateZ(p * 7)
      animateSkillObject(head, p)
      animateSignatureObject(head,p)
      for (const child of head.children) if (child.userData.wing) child.rotation.z = Math.sin(p * 25) * .5 * child.userData.wing
      trail.forEach((sprite, i) => {
        const t = Math.max(0, p - (i + 1) * .035)
        sprite.position.copy(positionAt(t)); sprite.material.opacity = (1 - i / trail.length) * .45 * Math.min(1, p * 12)
      })
    } })
  }

  beam(emitter, to, plan, start, duration, scale, index = 0) {
    const fx=this.fx,group=new THREE.Group(),g=fx.geometries,size=scale*plan.size*.09*(plan.beamWidth||1)
    const flame=plan.shape==='flame',frost=plan.shape==='frost',vine=plan.shape==='vine',electric=plan.shape==='lightning'
    const petals=plan.motif==='petals',data=plan.motif==='data',color=plan.palette.color
    const water=plan.shape==='waterJet',mist=['inkJet','mistJet'].includes(plan.shape)
    const energy=plan.effectSource==='expansion-signature'&&!flame&&!frost&&!vine&&!electric&&!water&&!mist
    group.name='skill-beam:'+ (plan.motif||plan.shape)
    g.breathCone??=new THREE.CylinderGeometry(1,.1,1,20,1,true).translate(0,.5,0)
    const outer=flame ? makeFlameBreath(fx,plan.palette) : skillMesh(fx,group,frost||water||mist?g.breathCone:g.cylinder,color,[1,1,1],[0,0,0],.25)
    if(flame)group.add(outer)
    if(mist){outer.material.blending=THREE.NormalBlending;outer.material.opacity=.45}
    if(energy){outer.material.blending=THREE.NormalBlending;outer.material.side=THREE.FrontSide;outer.material.toneMapped=false}
    const inner=skillMesh(fx,group,g.cylinder,plan.palette.core,[1,1,1],[0,0,0],electric?.18:.5)
    if(energy){inner.material.side=THREE.FrontSide;inner.material.toneMapped=false}
    let bolts=[]
    if(electric||vine) {
      bolts=Array.from({length:electric?3:1},()=>{const b=fx.ribbon(Array.from({length:13},()=>new THREE.Vector3()),size*(electric?.35:.5),fx.additive(color,.8));group.add(b);return b})
      outer.visible=inner.visible=false
    }
    const motes=Array.from({length:flame?0:frost||petals||water||mist?10:6},(_,i)=>{
      const geometry=energy?g.shard:water?g.sphere:mist?g.sphere:frost?g.shard:petals?g.shard:data?g.cube:vine?g.spike:flame?g.shard:g.torus
      return skillMesh(fx,group,geometry,i%3?color:plan.palette.core,[1,1,1],[0,0,0],.6)
    })
    const strands=energy?Array.from({length:2},()=>{const material=fx.additive(color,.62);material.blending=THREE.NormalBlending;material.forceSinglePass=true;material.toneMapped=false;const ribbon=fx.ribbon(Array.from({length:17},()=>new THREE.Vector3()),size*.18,material);group.add(ribbon);return ribbon}):[]
    // Tongues advect down a widening breath instead of a rigid glowing cylinder.
    const flames = flame ? Array.from({length:5},()=> { const f=makeFlameObject(fx,plan.palette,2); group.add(f); return f }) : []
    if(flame||mist) inner.visible = false
    const hand=plan.motif==='spectralHand'?makeSkillObject(fx,{...plan,shape:'fist'}):null
    if(hand)group.add(hand)
    fx.add({group,start,duration:duration+120,update:(p,dt,now)=>{
      const t=clamp01((now-start)/Math.max(1,duration)),from=plan.formation==='rain'?to.clone().add(new THREE.Vector3((index-(plan.shots-1)/2)*scale*.18,scale*1.5,(index%2-.5)*scale*.15)):point(emitter),end=from.clone().lerp(to,t)
      const direction=end.clone().sub(from),length=direction.length(),axis=direction.clone().normalize()
      if(!length){group.visible=false;return}
      group.position.copy(from)
      const fade=1-clamp01((now-start-duration)/120),q=new THREE.Quaternion().setFromUnitVectors(UP,axis)
      for(const [i,m]of [outer,inner].entries()) {
        m.quaternion.copy(q);const radius=size*(i?.28:flame||frost||water||mist?3.2:1)
        m.scale.set(radius,length,radius);m.material.opacity=(energy?(i?.30:.48):(i?.55:flame?.62:.25))*fade
      }
      animateSkillObject(outer,(now-start)/500)
      flames.forEach((f,i)=>{
        const progress=((now-start)/550+i/flames.length)%1, along=progress*t
        f.position.copy(to).sub(from).multiplyScalar(along)
        f.quaternion.setFromUnitVectors(FORWARD,axis)
        const spread=size*(.9+along*2.2),gate=Math.sin(progress*Math.PI)*fade
        f.scale.set(spread,spread,size*(4+along*3))
        animateSkillObject(f,(now-start)/500+i)
        f.traverse(n=>{if(n.material)n.material.opacity=(n.userData.baseOpacity??.6)*gate})
      })
      bolts.forEach((b,j)=>{
        const pts=Array.from({length:13},(_,i)=>{
          const f=i/12,v=direction.clone().multiplyScalar(f),edge=Math.sin(f*Math.PI)
          v.y+=Math.sin(i*2.3+now*.035+j)*size*3*edge
          v.z+=Math.cos(i*1.7+now*.027+j)*size*2*edge
          return v
        })
        fx.updateRibbon(b,pts);b.material.opacity=.8*fade
      })
      if(energy){
        const across=new THREE.Vector3().crossVectors(axis,UP)
        if(across.lengthSq()<1e-6)across.set(1,0,0);else across.normalize()
        const above=new THREE.Vector3().crossVectors(across,axis).normalize()
        strands.forEach((ribbon,j)=>{
          const points=Array.from({length:17},(_,i)=>{
            const f=i/16,a=f*TAU*2-(now-start)*.018+j*Math.PI,r=size*.8*Math.sin(f*Math.PI)
            return direction.clone().multiplyScalar(f).addScaledVector(across,Math.cos(a)*r).addScaledVector(above,Math.sin(a)*r)
          })
          fx.updateRibbon(ribbon,points);ribbon.material.opacity=.62*fade
        })
      }
      motes.forEach((m,i)=>{
        const f=((i/motes.length+(now-start)/380)%1)*t
        m.position.copy(to).sub(from).multiplyScalar(f)
        m.quaternion.setFromUnitVectors(FORWARD,axis)
        if (vine) { m.scale.set(size*.7,size*2,size*.7);m.rotation.z=i*.8 }
        else if(flame||frost||petals||water||mist) {
          m.position.y+=Math.sin(i*2+now*.01)*size*f*2
          m.position.z+=Math.cos(i*3+now*.012)*size*f*2
          m.scale.set(size*(.7+f*2),size*(water?1.2:flame?1+f*2.5:2),size*(water?1.2:flame?3:.5))
          if(mist){m.material.blending=THREE.NormalBlending;m.material.opacity=.35*fade}
        } else if(energy)m.scale.set(size*.09,size*.09,size*3.5)
        else m.scale.setScalar(size*(data?.7:1.4))
        m.rotation.z+=i*.9;m.material.opacity=(flame?.18:.65)*fade
      })
      if(hand){hand.position.copy(direction);hand.quaternion.setFromUnitVectors(FORWARD,axis);hand.scale.setScalar(size*3)}
    }})
  }

  field(to, plan, start, duration, scale) {
    const fx=this.fx,group=new THREE.Group(),g=fx.geometries,k=plan.shape
    group.name='skill-field:'+ (plan.motif||k);group.position.copy(to)
    g.rod ??= new THREE.CylinderGeometry(.06,.06,1,8).rotateX(Math.PI/2)
    const signatureArt=makeExpansionObject(fx,plan)
    if(signatureArt)group.add(signatureArt)
    const glyph=['ring','portal','summon'].includes(k)&&!signatureArt?makeGlyph(fx,plan.palette,plan.motif):null
    if(glyph){group.add(glyph);glyph.rotation.y=.2}
    let core=null
    if(k==='portal') {
      core=skillMesh(fx,group,g.sphere,0x140a24,[1,1,.1],[0,0,-.05],.9)
      core.material.blending=THREE.NormalBlending
    }
    const motes=Array.from({length:k==='mist'?12:10},(_,i)=>{
      let m
      if(k==='mist')m=fx.sprite(plan.motif==='petals'?fx.textures.leaf:fx.textures.smoke,plan.palette.color,1)
      else {
        const geometry=k==='spike'?g.spike:plan.motif==='chess'?g.cube:plan.motif==='swarm'?g.shard:g.sphere
        m=new THREE.Mesh(geometry,fx.additive(i%3?plan.palette.color:plan.palette.core,.65))
      }
      group.add(m);return m
    })
    fx.add({group,start,duration,update:p=>{
      const gate=Math.sin(p*Math.PI),radius=scale*plan.size*(k==='portal'?.6:.5)
      if(glyph){glyph.scale.setScalar(radius*(.55+p*.45));glyph.rotation.z=p*.7;glyph.traverse(n=>{if(n.material)n.material.opacity=(n.userData.baseOpacity??.6)*gate})}
      if(core){core.scale.set(radius*gate,radius*gate,radius*.1);core.material.opacity=gate*.85}
      if(signatureArt){signatureArt.scale.setScalar(radius*(.7+p*.3));animateSignatureObject(signatureArt,p);signatureArt.traverse(n=>{if(n.material){n.userData.baseOpacity??=n.material.opacity;n.material.opacity=n.userData.baseOpacity*gate;n.material.transparent=true}})}
      motes.forEach((m,i)=>{
        const a=i/motes.length*TAU+p*(k==='mist'?1:2)
        m.position.set(Math.cos(a)*radius,Math.sin(a)*radius,(i%3-1)*radius*.4)
        if(k==='spike') {m.position.y=-scale*.35;m.scale.set(scale*.10,scale*.7*gate,scale*.10)}
        else if(k==='mist'){m.scale.setScalar(scale*(.3+p*.35));m.material.rotation=i+p;m.material.opacity=gate*(plan.motif==='petals'?.65:.35)}
        else {m.scale.set(scale*.09,scale*(plan.motif==='chess'?.20:.15),scale*.08);m.rotation.set(p*3,i+p,p);m.material.opacity=gate*.75}
      })
    }})
  }

  impact(to, plan, start, duration, height, critical = false, index = plan.shots - 1) {
    plan = strikePlan(plan, index)
    const fx=this.fx,group=new THREE.Group(),scale=Math.min(2.4,Math.max(.7,height))*(critical?1.2:1)
    group.name='skill-impact:'+plan.impactKind;group.position.copy(to)
    const flash=fx.sprite(fx.textures.glow,plan.palette.core,scale*.75);group.add(flash)
    const marks=makeImpactMarks(fx,plan);group.add(marks)
    if(plan.impactKind!=='tornado')marks.quaternion.copy(fx.camera.quaternion)
    const sparks=fx.particles(group,['shot','pierce'].includes(plan.impactKind)?8:14,{texture:['earth','mist','explosion','flame','darkBurst'].includes(plan.impactKind)?fx.textures.smoke:['petals','nature','feathers'].includes(plan.impactKind)?fx.textures.leaf:fx.textures.spark,color:plan.palette.color,size:scale*.08})
    sparks.forEach((s,i)=>{const a=i/sparks.length*TAU;s.velocity.set(Math.cos(a),Math.sin(a),.1).multiplyScalar(scale*(1+i%3*.3))})
    group.traverse(n=>{if(n.material){n.material.depthTest=false;n.renderOrder=20;n.userData.baseOpacity??=n.material.opacity}})
    let started=false
    fx.add({group,start,duration:Math.min(duration,650),update:p=>{
      if(!started){fx.shake=Math.max(fx.shake,critical?.12:plan.shape==='bullet'?.025:.055);started=true}
      flash.material.opacity=(1-clamp01(p*4))*.8
      marks.scale.setScalar(scale*(.22+p*.7))
      animateSkillObject(marks,p)
      if(plan.impactKind==='tornado')marks.rotation.y=p*TAU*2
      marks.traverse(n=>{if(n.material)n.material.opacity=(n.userData.baseOpacity??.65)*(1-p)**1.5})
      sparks.forEach(s=>{s.sprite.position.copy(s.velocity).multiplyScalar(p*.65);s.sprite.material.opacity=(1-p)**2})
    }})
  }
}
