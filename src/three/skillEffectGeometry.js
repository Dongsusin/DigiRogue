import * as THREE from 'three'
const TAU = Math.PI * 2

// All reusable geometry belongs to the battle pool; effect-local materials are
// disposed by BattleEffects. Motifs remain volumetric at both camera angles.
export function skillMesh(fx, group, geometry, color, scale = [1,1,1], position = [0,0,0], opacity = .65) {
  const mesh = new THREE.Mesh(geometry, fx.additive(color, opacity))
  mesh.scale.set(...scale); mesh.position.set(...position); group.add(mesh)
  mesh.userData.baseOpacity = opacity
  return mesh
}

// Palette-driven flames keep the same outer/core colors at every stage of a move.
// A pooled envelope plus moving tongues replaces the rigid octahedral fire ball.
export function makeFlameObject(fx, palette, tongues = 4) {
  const group = new THREE.Group(), g = fx.geometries
  g.flameEnvelope ??= new THREE.SphereGeometry(1, 20, 12)
  const shell = skillMesh(fx, group, g.flameEnvelope, palette.color, [.52, .52, .68], [0, 0, -.12], .78)
  shell.material.blending = THREE.NormalBlending
  shell.material.side = THREE.FrontSide; shell.material.toneMapped = false
  const phase = { value: 0 }, outer = { value: new THREE.Color(palette.color) }, core = { value: new THREE.Color(palette.core) }
  shell.material.userData.flamePhase = phase
  shell.material.customProgramCacheKey = () => 'digirouge-flame-v1'
  shell.material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, { uFlamePhase: phase, uFlameOuter: outer, uFlameCore: core })
    shader.vertexShader = 'uniform float uFlamePhase; varying vec3 vFlamePosition;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvFlamePosition = position;\nfloat tail = 1.0 - smoothstep(-1.0, 0.8, position.z);\nfloat swirl = atan(position.y, position.x) * 3.0 + position.z * 9.0 + uFlamePhase * 12.0;\ntransformed.xy *= (0.58 + 0.42 * (1.0 - tail)) * (1.0 + tail * 0.18 * sin(swirl));\ntransformed.xy += tail * vec2(sin(position.z * 5.0 + uFlamePhase * 9.0), cos(position.z * 6.0 + uFlamePhase * 11.0)) * 0.09;\ntransformed.z = position.z * (1.0 + tail * 0.65);')
    shader.fragmentShader = 'uniform float uFlamePhase; uniform vec3 uFlameOuter; uniform vec3 uFlameCore; varying vec3 vFlamePosition;\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>',
      'float flameAngle = atan(vFlamePosition.y, vFlamePosition.x);\nfloat flameNoise = sin(flameAngle * 5.0 + vFlamePosition.z * 13.0 + uFlamePhase * 17.0) * sin(flameAngle * 3.0 - vFlamePosition.z * 9.0 + uFlamePhase * 11.0);\nfloat flameHeat = clamp((1.0 - length(vFlamePosition.xy)) * 0.75 + flameNoise * 0.18, 0.0, 1.0);\noutgoingLight = mix(uFlameOuter, uFlameCore, flameHeat * 0.65);\ndiffuseColor.a *= smoothstep(-1.0, -0.65, vFlamePosition.z) * (0.55 + 0.45 * flameHeat);\n#include <opaque_fragment>')
  }
  skillMesh(fx, group, g.sphere, palette.core, [.16, .16, .28], [0, 0, .12], .6)
  for (let i = 0; i < tongues; i++) {
    const a = i / tongues * TAU
    const tongue = skillMesh(fx, group, g.flameEnvelope, i % 2 ? palette.color : palette.core,
      [.12, .12, .52], [Math.cos(a) * .23, Math.sin(a) * .23, -.48], .38)
    tongue.rotation.set(Math.sin(a) * .18, Math.cos(a) * .18, 0)
    tongue.userData.flame = i; tongue.userData.flameLength = .52
  }
  group.userData.kind = 'flame'; return group
}

export function makeFlameBreath(fx, palette) {
  const g = fx.geometries
  g.flameBreath ??= new THREE.CylinderGeometry(1, .08, 1, 24, 12, true).translate(0, .5, 0)
  const mesh = new THREE.Mesh(g.flameBreath, fx.additive(palette.color, .62))
  mesh.material.blending = THREE.NormalBlending; mesh.material.side = THREE.FrontSide; mesh.material.toneMapped = false
  const phase = { value: 0 }, outer = { value: new THREE.Color(palette.color) }, core = { value: new THREE.Color(palette.core) }
  mesh.material.userData.flamePhase = phase
  mesh.material.customProgramCacheKey = () => 'digirouge-flame-breath-v1'
  mesh.material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, { uFlamePhase: phase, uFlameOuter: outer, uFlameCore: core })
    shader.vertexShader = 'uniform float uFlamePhase; varying vec3 vBreathPosition;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvBreathPosition = position;\nfloat breathA = atan(position.z, position.x);\nfloat breathFlow = sin(position.y * 22.0 - uFlamePhase * 15.0 + breathA * 3.0);\ntransformed.xz *= 0.88 + breathFlow * 0.12;\ntransformed.x += position.y * position.y * sin(position.y * 11.0 - uFlamePhase * 8.0) * 0.12;\ntransformed.z += position.y * position.y * cos(position.y * 14.0 - uFlamePhase * 9.0) * 0.12;')
    shader.fragmentShader = 'uniform float uFlamePhase; uniform vec3 uFlameOuter; uniform vec3 uFlameCore; varying vec3 vBreathPosition;\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>',
      'float breathA = atan(vBreathPosition.z, vBreathPosition.x);\nfloat breathFlow = sin(vBreathPosition.y * 26.0 - uFlamePhase * 19.0 + breathA * 5.0);\nfloat breathHeat = breathFlow * 0.5 + 0.5;\noutgoingLight = mix(uFlameOuter, uFlameCore, breathHeat * 0.4);\ndiffuseColor.a *= (0.4 + breathHeat * 0.6) * (1.0 - smoothstep(0.78, 1.0, vBreathPosition.y));\n#include <opaque_fragment>')
  }
  mesh.userData.baseOpacity = .62
  return mesh
}

export function animateSkillObject(object, time) {
  object.traverse(child => {
    if (child.material?.userData.flamePhase) child.material.userData.flamePhase.value = time
    if (child.userData.flame != null) child.scale.z = (child.userData.flameLength ?? .7) * (1 + Math.sin(time * 18 + child.userData.flame) * .25)
    if (child.userData.orbit != null) child.rotation.z = time * 7 + child.userData.orbit
  })
}

export function makeSpiralFlame(fx, palette) {
  const group = new THREE.Group(), g = fx.geometries
  g.spectralSpiral ??= new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 65 }, (_, i) => {
    const t = i / 64, a = t * TAU * 2.4, r = .12 + Math.sin(t * Math.PI) * .32
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, .8 - t * 1.8)
  })), 64, .065, 6, false)
  for (let i = 0; i < 3; i++) {
    const helix = skillMesh(fx, group, g.spectralSpiral, i === 1 ? palette.core : palette.color, [1, 1, 1], [0, 0, 0], .72)
    helix.rotation.z = i * TAU / 3
  }
  const flame = makeFlameObject(fx, palette, 2); flame.scale.setScalar(.6); group.add(flame)
  group.userData.kind = 'spiralFlame'; return group
}

export function makeVortex(fx, palette, { golden = false } = {}) {
  if (golden) return makeGoldenVortex(fx,palette)
  const group = new THREE.Group(), g = fx.geometries
  g.funnel ??= new THREE.ConeGeometry(1, 1, 32, 1, true)
  g.spiral ??= new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length:65},(_,i)=> {
    const t=i/64, a=t*TAU*1.75, r=.68-.58*t
    return new THREE.Vector3(Math.cos(a)*r, -.65+t*1.3, Math.sin(a)*r)
  })),64,.015,5,false)
  skillMesh(fx,group,g.funnel,palette.color,[.70,1.35,.70],[0,0,0],.12)
  for(let i=0;i<3;i++) {
    const ribbon=skillMesh(fx,group,g.spiral,i===1?palette.core:palette.color,[1,1,1],[0,0,0],i===1?.20:.13)
    ribbon.rotation.y=i*TAU/3
  }
  for(let i=0;i<3;i++) {
    const ring=skillMesh(fx,group,g.torus,palette.color,[.60-i*.20,.60-i*.20,.25],[0,-.55+i*.5,0],.08)
    ring.rotation.x=Math.PI/2
  }
  group.userData.kind='tornado'
  return group
}

// Brave Tornado is a dense golden drill around the moving body, rather than a
// thin generic wind helix. The broad tail tapers toward the opponent.
function makeGoldenVortex(fx,palette) {
  const group=new THREE.Group(),g=fx.geometries
  g.goldFunnel??=new THREE.ConeGeometry(.78,2.4,48,3,true)
  g.goldRibbon??=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length:193},(_,i)=>{
    const t=i/192,a=t*TAU*5,r=.08+(1-t)*.72
    return new THREE.Vector3(Math.cos(a)*r,-1.2+t*2.4,Math.sin(a)*r)
  })),192,.012,5,false)
  const shell=skillMesh(fx,group,g.goldFunnel,palette.color,[1,1,1],[0,0,0],.82)
  shell.material.blending=THREE.NormalBlending; shell.material.side=THREE.FrontSide
  const phase={value:0};shell.material.userData.tornadoPhase=phase
  shell.material.customProgramCacheKey=()=> 'brave-tornado-v2'
  shell.material.onBeforeCompile=shader=>{
    shader.uniforms.uTornadoPhase=phase
    shader.vertexShader='uniform float uTornadoPhase; varying vec3 vTornadoPosition;\n'+shader.vertexShader
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvTornadoPosition=position;\nfloat twist=atan(position.z,position.x)*7.0+position.y*12.0-uTornadoPhase*38.0;\ntransformed.xz*=1.0+0.025*sin(twist);')
    shader.fragmentShader='uniform float uTornadoPhase; varying vec3 vTornadoPosition;\n'+shader.fragmentShader
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
      'float energyT=clamp(vTornadoPosition.y/2.4+0.5,0.0,1.0);\nfloat energyAngle=atan(vTornadoPosition.z,vTornadoPosition.x);\nfloat energyStripe=smoothstep(0.25,1.0,sin(energyAngle*13.0-energyT*72.0+uTornadoPhase*58.0));\nfloat energyFade=smoothstep(0.0,0.10,energyT)*(1.0-smoothstep(0.94,1.0,energyT));\noutgoingLight=mix(vec3(1.0,0.25,0.01),vec3(1.0,0.62,0.08),energyStripe);\ndiffuseColor.a*=energyFade*(0.60+0.40*energyStripe);\n#include <opaque_fragment>')
  }
  const inner=skillMesh(fx,group,g.goldFunnel,palette.color,[.92,.98,.92],[0,0,0],.18)
  inner.material.blending=THREE.NormalBlending; inner.material.side=THREE.FrontSide
  for(let i=0;i<3;i++) {
    const ribbon=skillMesh(fx,group,g.goldRibbon,i?0xffdf72:palette.core,[1,1,1],[0,0,0],i?.08:.12)
    ribbon.rotation.y=i*TAU/3;ribbon.userData.energyStreak=i
  }
  for(let i=0;i<12;i++) {
    const a=i/12*TAU,r=.78+(i%3)*.06
    const streak=skillMesh(fx,group,g.shard,i%3?palette.color:palette.core,[.014,.55,.014],[Math.cos(a)*r,-.95,Math.sin(a)*r],.65)
    streak.userData.energyStreak=i
  }
  group.scale.set(1.25,1,1.25);group.userData.kind='braveTornado';return group
}

export function makeGlyph(fx, palette, motif='mandala') {
  const group=new THREE.Group(),g=fx.geometries
  for(const r of [.65,1]) skillMesh(fx,group,g.torus,palette.color,[r,r,.35])
  const n=motif==='prison'?8:12
  for(let i=0;i<n;i++) {
    const a=i/n*TAU
    const mark=skillMesh(fx,group,g.cube,i%3?palette.color:palette.core,[.035,.13,.025],[Math.cos(a)*.82,Math.sin(a)*.82,0])
    mark.rotation.z=a-Math.PI/2
  }
  if(['holy','holyGate','cross'].includes(motif)) {
    skillMesh(fx,group,g.cube,palette.core,[.10,.9,.04]);skillMesh(fx,group,g.cube,palette.core,[.58,.10,.04],[0,.12,0])
  } else if(motif==='chess') {
    for(let x=0;x<4;x++)for(let y=0;y<4;y++) {
      const m=skillMesh(fx,group,g.cube,(x+y)%2?palette.core:palette.color,[.22,.22,.035],[(x-1.5)*.23,(y-1.5)*.23,0],.38)
      m.userData.checker=true
    }
  } else {
    for(let i=0;i<3;i++)skillMesh(fx,group,g.rod??g.cylinder,palette.core,[.045,.045,1.18]).rotation.set(Math.PI/2,0,i*TAU/3)
  }
  group.userData.kind='glyph'; return group
}

export function makeEnergyObject(fx,plan) {
  const group=new THREE.Group(),g=fx.geometries,{color,core}=plan.palette,motif=plan.motif||'energy'
  const ball=(r,tone,opacity=.7)=>skillMesh(fx,group,g.sphere,tone,[r,r,r],[0,0,0],opacity)
  const glow=fx.sprite(fx.textures.glow,color,1.7);group.add(glow)
  if(['solar','blueFlame','fireball','hellfire','inferno','meteorWing'].includes(motif)||plan.shape==='fireball') {
    const flame=makeFlameObject(fx,plan.palette)
    // Gaia Force and other solar orbs retain a round body; launched fire has a trailing tip.
    if(plan.shape==='orb'){flame.scale.z=.6;ball(.45,color,.3)}
    group.add(flame)
    if(motif==='hellfire') {
      const halo=skillMesh(fx,group,g.torus,0xd51d84,[.66,.66,.7]);halo.rotation.y=.5
      for(let i=0;i<3;i++)skillMesh(fx,group,g.arc,color,[.7,.7,.7]).rotation.set(i,0,i*2)
    }
  } else if(motif==='electroOrb') {
    ball(.38,color,.5);ball(.22,core,.8)
    g.electricArc ??= new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length:17},(_,i)=>{
      const a=i/16*TAU,r=i%2?.52:.68;return new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0)
    })),32,.025,4,false)
    for(let i=0;i<3;i++){const arc=skillMesh(fx,group,g.electricArc,i?color:core,[1,1,1]);arc.rotation.set(i*.9,i*.7,0);arc.userData.orbit=i}
  } else if(motif==='holy'||motif==='cross') {
    ball(.35,core,.7)
    group.add(makeGlyph(fx,plan.palette,'cross'));group.children.at(-1).scale.setScalar(.7)
    const halo=skillMesh(fx,group,g.torus,color,[.75,.75,.5]);halo.rotation.y=Math.PI/2
  } else if(['souls','shadow','nightmare'].includes(motif)) {
    ball(.35,color,.25)
    for(let i=0;i<4;i++) {
      const a=i/4*TAU, wisp=skillMesh(fx,group,g.sphere,i%2?color:core,[.12,.23,.16],[Math.cos(a)*.4,Math.sin(a)*.4,0],.58)
      wisp.userData.orbit=i
    }
    for(const x of [-.10,.10])skillMesh(fx,group,g.shard,core,[.07,.07,.03],[x,.08,.32],.9)
  } else if(['eclipse','serpentGate'].includes(motif)) {
    const disk=skillMesh(fx,group,g.sphere,0x170d29,[.55,.55,.18],[0,0,0],.85)
    disk.material.blending=THREE.NormalBlending
    group.add(makeGlyph(fx,plan.palette,motif));group.children.at(-1).scale.setScalar(.65)
  } else if(['petals','flowerCannon','fruit','nature'].includes(motif)) {
    ball(.23,core,.6)
    for(let i=0;i<7;i++) {
      const a=i/7*TAU,leaf=skillMesh(fx,group,g.shard,color,[.16,.30,.045],[Math.cos(a)*.45,Math.sin(a)*.45,0],.75)
      leaf.rotation.z=a-Math.PI/2; leaf.userData.orbit=i
    }
  } else {
    ball(.35,core,.8)
    if(motif==='data') {
      for(let i=0;i<8;i++) {const a=i/8*TAU;skillMesh(fx,group,g.cube,color,[.12,.12,.12],[Math.cos(a)*.5,Math.sin(a)*.5,(i%2-.5)*.3])}
    } else {
      for(let i=0;i<3;i++) {const halo=skillMesh(fx,group,g.torus,color,[.58,.58,.58],[0,0,0],.65);halo.rotation.set(i*1.2,i*.8,0);halo.userData.orbit=i}
    }
    if(motif==='coreBurst') for(let i=0;i<6;i++) {const a=i/6*TAU;skillMesh(fx,group,g.shard,core,[.07,.07,.45],[Math.cos(a)*.3,Math.sin(a)*.3,-.35])}
  }
  group.userData.motif=motif;return group
}

export function makeImpactMarks(fx,plan) {
  const group=new THREE.Group(),g=fx.geometries,{color,core}=plan.palette,k=plan.impactKind||'burst'
  const ring=(r,tilt=0)=>{const m=skillMesh(fx,group,g.torus,color,[r,r,.45]);m.rotation.x=tilt;return m}
  if(k==='tornado' && plan.motif==='braveTornado') {
    for(let i=0;i<3;i++){const arc=skillMesh(fx,group,g.arc,i===1?core:color,[.7,.7,.7],[0,0,0],.8);arc.rotation.set(i*.7,i*.8,i*TAU/3)}
    for(let i=0;i<12;i++){const a=i/12*TAU;skillMesh(fx,group,g.shard,i%3?color:core,[.025,.48,.025],[Math.cos(a)*.25,Math.sin(a)*.25,0],.8).rotation.z=a-Math.PI/2}
  } else if(k==='tornado') { group.add(makeVortex(fx,plan.palette)); group.children[0].scale.setScalar(1.05) }
  else if(['claw','slice','pierce','bite'].includes(k)) {
    const count=k==='claw'?3:k==='bite'?4:1
    for(let i=0;i<count;i++) {
      const m=skillMesh(fx,group,k==='pierce'?g.shard:g.arc,core,k==='pierce'?[.10,.10,1.5]:[.8,.35,.8],[(i-(count-1)/2)*.18,0,0],.9)
      m.rotation.z=k==='bite'?(i%2?Math.PI:0):-.65
    }
  } else if(['earth','frost','nature','petals','feathers','data','swarm'].includes(k)) {
    for(let i=0;i<10;i++) {
      const a=i/10*TAU,r=.25+(i%3)*.12
      const geometry=k==='earth'?g.rock:k==='data'?g.cube:g.shard
      const m=skillMesh(fx,group,geometry,i%2?color:core,[.08,.18,.07],[Math.cos(a)*r,Math.sin(a)*r,(i%2-.5)*.3],.75)
      m.rotation.z=a;m.userData.debris=i
    }
    if(k==='earth')ring(.55,Math.PI/2)
  } else if(['portal','glyph','holy','summon'].includes(k)) { group.add(makeGlyph(fx,plan.palette,k==='holy'?'holy':plan.motif)) }
  else if(k==='vines') {
    for(let i=0;i<3;i++){const m=skillMesh(fx,group,g.torus,color,[.6,.6,.6]);m.rotation.set(i*.8,0,i*1.2)}
  } else if(k==='lightning') {
    for(let i=0;i<6;i++){const m=skillMesh(fx,group,g.shard,core,[.045,.55,.045],[(i-2.5)*.12,0,0],.9);m.rotation.z=(i%2?1:-1)*.6}
  } else if(k==='flame'||k==='darkBurst'||k==='explosion') {
    group.add(k==='darkBurst' ? makeEnergyObject(fx,{...plan,shape:'orb',motif:'shadow'}) : makeFlameObject(fx,plan.palette))
    if(k==='explosion')ring(.55,Math.PI/2)
  } else if(k==='energyBurst') {
    skillMesh(fx,group,g.sphere,core,[.3,.3,.3],[0,0,0],.5)
    ring(.5);ring(.8,Math.PI/2)
    for(let i=0;i<8;i++)skillMesh(fx,group,g.shard,color,[.035,.55,.035]).rotation.z=i*TAU/8
  } else if(k==='beam') {ring(.65);for(let i=0;i<5;i++)skillMesh(fx,group,g.shard,core,[.03,.45,.03]).rotation.z=i*TAU/5}
  else if(k==='shot') {for(let i=0;i<4;i++)skillMesh(fx,group,g.shard,core,[.025,.35,.025]).rotation.z=i*Math.PI/4}
  else if(k==='mist') {for(let i=0;i<6;i++){const m=fx.sprite(fx.textures.smoke,color,.8);m.position.set((i%3-1)*.35,(Math.floor(i/3)-.5)*.35,0);group.add(m)}}
  else if(k==='water'||k==='sonic') {
    for(let i=0;i<3;i++){const m=ring(.4+i*.22);m.position.z=-i*.15}
    if(k==='water')for(let i=0;i<8;i++){const a=i/8*TAU;skillMesh(fx,group,g.sphere,i%2?color:core,[.06,.14,.06],[Math.cos(a)*.5,Math.sin(a)*.5,0],.5).rotation.z=a}
  }
  else if(k==='strike') {for(let i=0;i<6;i++)skillMesh(fx,group,g.shard,i%2?color:core,[.07,.4,.07]).rotation.z=i*TAU/6;ring(.3)}
  else {ring(.5);ring(.7,Math.PI/2)}
  group.userData.impactKind=k;return group
}
