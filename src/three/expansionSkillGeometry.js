import * as THREE from 'three'
import { skillMesh, makeFlameObject, makeGlyph } from './skillEffectGeometry.js'

const TAU = Math.PI * 2

// Small, pooled 3D props for signature techniques. These are attack objects,
// not replacements for the original Digimon models or their animations.
export function makeExpansionObject(fx, plan) {
  if (plan.effectSource !== 'expansion-signature') return null
  const motif = plan.motif || '', g = fx.geometries, { color, core } = plan.palette
  const group = new THREE.Group()
  group.name = 'signature-object:' + motif
  const mesh = (geometry, tone, scale, position = [0, 0, 0], solid = false) => {
    const m = skillMesh(fx, group, geometry, tone, scale, position, solid ? 1 : .72)
    if (solid) {
      m.material.dispose()
      m.material = new THREE.MeshStandardMaterial({ color: tone, metalness: .55, roughness: .35 })
    } else {
      // Colored objects keep a visible surface; additive front/back surfaces
      // overlap into white on petals, notes and metal outlines.
      m.material.blending = THREE.NormalBlending
      m.material.side = THREE.FrontSide
      m.material.opacity = .82
      m.material.toneMapped = false
    }
    return m
  }
  const ring = (r = .6, tone = color, position = [0, 0, 0]) => mesh(g.torus, tone, [r, r, .35], position)
  const glow = (size = 1, tone = color) => { const s = fx.sprite(fx.textures.glow, tone, size); group.add(s); return s }

  if (motif === 'coronaShell' || motif === 'sunCore') {
    group.add(makeFlameObject(fx,plan.palette,motif === 'sunCore' ? 6 : 4))
    if(motif === 'sunCore') {ring(.85);ring(.65,core).rotation.y=.6}
  } else if (/Sword|Swords|Blades|Espada|Daggers|wingRazors|crossSword|chronoScythe|xScythe|tripleScythe|keyBlade|bambooSword|chickSword|shogunSword|sickleWave|crescentBlade/.test(motif)) {
    const scythe = /Scythe|sickle|crescent/.test(motif)
    if (scythe) {
      const arc = mesh(g.arc, core, [1.2, .55, .12])
      arc.rotation.z = -.6
      mesh(g.rod, color, [.8, .8, 1.8], [0, 0, -.35])
    } else {
      mesh(g.shard, core, [.16, .48, 1.35], [0, 0, .35], true)
      mesh(g.cube, color, [.7, .12, .14], [0, 0, -.6], true)
      mesh(g.rod, 0x514756, [1, 1, .5], [0, 0, -.93], true)
      mesh(g.sphere, color, [.13, .13, .13], [0, 0, -1.2], true)
      if (motif === 'keyBlade') for (let i = 0; i < 3; i++) mesh(g.cube, color, [.28, .14, .12], [.22, 0, .25 + i * .3], true)
      if (/dramon|doubleSword/.test(motif)) mesh(g.shard, color, [.1, .48, 1.2], [.28, 0, .25], true)
    }
    ring(.48).rotation.y = Math.PI / 2
    if (/sunMoon/.test(motif)) { ring(.72, 0xffa330); ring(.53, 0x9bcfff).rotation.y = .65 }
  } else if (/shuriken|musicDisc|spikeWheel|frozenShield/.test(motif)) {
    g.signatureDisc ??= new THREE.CylinderGeometry(1, 1, .12, 32).rotateX(Math.PI / 2)
    mesh(g.signatureDisc, color, [.65, .65, .65], [0, 0, 0], true)
    ring(.25, core)
    if (/shuriken|spikeWheel/.test(motif)) for (let i = 0; i < (motif === 'shuriken' ? 4 : 8); i++) {
      const a = i * TAU / (motif === 'shuriken' ? 4 : 8)
      const blade = mesh(g.shard, core, [.13, .55, .06], [Math.cos(a) * .6, Math.sin(a) * .6, 0], true)
      blade.rotation.z = a - Math.PI / 2
    }
    group.userData.signatureSpin = 8
  } else if (/boneBoomerang|spiralBone/.test(motif)) {
    mesh(g.rod, core, [1.6, 1.6, 1.8], [0, 0, 0], true)
    for (const z of [-1, 1]) for (const x of [-.15, .15]) mesh(g.sphere, core, [.2, .25, .24], [x, 0, z], true)
    if (motif === 'spiralBone') for (let i = 0; i < 3; i++) ring(.45 - i * .08, color, [0, 0, -.5 + i * .5])
    else group.userData.signatureSpin = 7
  } else if (/rocketFists|blackHikky|smileyBomb|littleKiwi|prayerBeads|royalNut|potato|snowball/.test(motif)) {
    const tone = /blackHikky/.test(motif) ? 0x252a35 : motif === 'potato' ? 0x9b7246 : motif === 'royalNut' ? 0xc29c51 : motif === 'snowball' ? 0xe7f7ff : color
    mesh(g.sphere, tone, [.58, .58, .7], [0, 0, 0], true)
    if (/Hikky|smiley/.test(motif)) {
      for (const x of [-.2, .2]) mesh(g.sphere, 0xf5faff, [.10, .16, .05], [x, .1, .64])
      mesh(g.arc, 0xffffff, [.28, .12, .05], [0, -.2, .66])
    } else if (motif === 'littleKiwi') {
      mesh(g.spike, 0xe9c864, [.18, .55, .18], [0, 0, .8], true).rotation.x = Math.PI / 2
      for (const x of [-.19, .19]) mesh(g.sphere, 0x141c24, [.06, .06, .05], [x, .2, .62], true)
      mesh(g.shard, 0x78ab45, [.2, .5, .1], [0, .5, -.1], true)
    } else if (motif === 'rocketFists') {
      mesh(g.cube, core, [.8, .65, .55], [0, 0, .2], true)
      for (let i = 0; i < 4; i++) mesh(g.cube, color, [.14, .28, .3], [(i - 1.5) * .19, .2, .5], true)
      glow(.85).position.z = -.7
    } else if (motif === 'snowball') {
      for (let i = 0; i < 5; i++) mesh(g.shard, 0xb9e9ff, [.09, .2, .08], [Math.sin(i * 2) * .4, Math.cos(i * 2) * .4, .3])
    } else if (motif === 'royalNut') mesh(g.shard, 0x7fa446, [.24, .4, .1], [0, .55, 0], true)
    else if (motif === 'prayerBeads') { ring(.6, 0xcda05b); glow(.9, core) }
  } else if (/royalTablet|talismanCards|cursedBook/.test(motif)) {
    if (motif === 'cursedBook') {
      for (const x of [-.27, .27]) mesh(g.cube, 0x5a243e, [.55, .85, .12], [x, 0, 0], true).rotation.y = x > 0 ? .25 : -.25
    } else mesh(g.cube, motif === 'royalTablet' ? 0xb69669 : 0xf1e3c5, [.75, 1.15, .10], [0, 0, 0], true)
    for (let i = 0; i < 6; i++) mesh(g.cube, motif === 'royalTablet' ? core : 0x9f2c43,
      [.12 + i % 2 * .15, .025, .025], [(i % 2 ? .12 : -.12), .4 - i * .15, .07])
    if (motif === 'royalTablet') ring(.72, color).rotation.z = .4
  } else if (/Notes|panFlute|rapNotes|sutraNotes/.test(motif)) {
    ring(.7); ring(.48, core, [0, 0, -.3])
    for (let i = 0; i < 2; i++) {
      const x = (i - .5) * .6
      mesh(g.sphere, i ? core : color, [.22, .16, .08], [x, -.2, .1])
      mesh(g.cube, core, [.045, .6, .06], [x + .14, .08, .1])
      mesh(g.cube, color, [.28, .08, .06], [x + .27, .38, .1]).rotation.z = -.3
    }
    group.userData.signatureSpin = .7
  } else if (/Clock|chronoDecay|dataDetonation/.test(motif)) {
    ring(.85, core); ring(.68, color)
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU
      mesh(g.cube, core, [.03, .13, .03], [Math.cos(a) * .75, Math.sin(a) * .75, 0]).rotation.z = a - Math.PI / 2
    }
    mesh(g.cube, color, [.05, .5, .05], [0, .22, .03]).userData.signatureHand = 1
    mesh(g.cube, core, [.38, .045, .05], [.16, 0, .04]).userData.signatureHand = -2
    glow(.75)
  } else if (/pyramid|waterMandala|aegisCircle|pawnShield|elderSign/.test(motif)) {
    if (motif === 'pyramid') {
      g.signaturePyramid ??= new THREE.ConeGeometry(.8, 1.4, 4)
      mesh(g.signaturePyramid, color, [1, 1, 1], [0, 0, 0]).material.opacity = .16
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + Math.PI / 4
        const line = mesh(g.rod, core, [.8, .8, 1.55], [Math.cos(a) * .3, -.05, Math.sin(a) * .3])
        line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-Math.cos(a) * .6, 1.4, -Math.sin(a) * .6).normalize())
      }
    } else group.add(makeGlyph(fx, plan.palette, 'mandala'))
    ring(.9, core).rotation.x = Math.PI / 2
  } else if (/mirrorPrison|dimensionGates|blackHole|hellGate|tripleHellGate|neverlandGate/.test(motif)) {
    const count = /dimension|triple/.test(motif) ? 3 : 1
    for (let i = 0; i < count; i++) {
      const x = count === 1 ? 0 : (i - 1) * .65
      ring(count === 1 ? .85 : .47, color, [x, i % 2 * .3, 0])
      const coreMesh = mesh(g.sphere, 0x0c0918, [count === 1 ? .75 : .4, count === 1 ? .75 : .4, .08], [x, i % 2 * .3, -.05])
      coreMesh.material.blending = THREE.NormalBlending
      for (let j = 0; j < 4; j++) mesh(g.shard, core, [.06, .20, .04], [x + Math.cos(j * Math.PI / 2) * .55, Math.sin(j * Math.PI / 2) * .55, 0]).rotation.z = j * Math.PI / 2
    }
  } else if (/thornCage|thornJaw|serpentArm|serpentBandage|frozenHair|boneCoil|chainRush/.test(motif)) {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU
      const link = ring(.22, i % 2 ? core : color, [Math.cos(a) * .65, Math.sin(a) * .65, i % 2 * .12])
      link.rotation.y = i % 2 * Math.PI / 2
      if (/thorn/.test(motif)) mesh(g.spike, color, [.10, .34, .10], [Math.cos(a) * .85, Math.sin(a) * .85, 0]).rotation.z = a - Math.PI / 2
    }
  } else if (/flowerBomb|roseStorm|fairyDust|butterflyDream/.test(motif)) {
    mesh(g.sphere, 0xf6dc78, [.22, .22, .22])
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU
      mesh(g.sphere, color, [.18, .42, .08], [Math.cos(a) * .3, Math.sin(a) * .3, 0]).rotation.z = a - Math.PI / 2
    }
    if (motif === 'butterflyDream') {
      group.scale.set(1.3, .6, 1)
      for (const sign of [-1, 1]) mesh(g.shard, core, [.3, .55, .06], [sign * .55, .1, 0]).rotation.z = sign * .3
    }
  } else if (/islandFall|seaMine|steamBomb|heliumBomb|plasmaLance|gigaLance|skyKeraunos|sunArrow/.test(motif)) {
    if (/Lance|Keraunos|Arrow/.test(motif)) {
      mesh(g.rod, core, [.8, .8, 2.4])
      mesh(g.shard, color, [.25, .45, .8], [0, 0, 1.3])
      for (const x of [-.3, .3]) mesh(g.shard, core, [.10, .35, .45], [x, 0, 1])
    } else if (motif === 'islandFall') {
      mesh(g.rock, 0x8d6a4b, [1, .6, 1], [0, -.15, 0], true)
      for (let i = 0; i < 4; i++) mesh(g.rock, 0x548f4a, [.45, .27, .45], [(i % 2 - .5) * .7, .3, (Math.floor(i / 2) - .5) * .7], true)
    } else {
      mesh(g.sphere, motif === 'seaMine' ? 0x52687b : color, [.7, .7, .7], [0, 0, 0], true)
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU
        mesh(g.spike, core, [.1, .35, .1], [Math.cos(a) * .65, Math.sin(a) * .65, 0], true).rotation.z = a - Math.PI / 2
      }
    }
  } else if (/sunCore|coronaShell|holyStars|colorDance|eclipsePalm/.test(motif)) {
    mesh(g.sphere, core, [.3, .3, .3])
    const arms = motif === 'holyStars' ? 5 : 8
    for (let i = 0; i < arms; i++) {
      const a = i / arms * TAU
      mesh(g.shard, i % 2 ? color : core, [.045, .45, .045], [Math.cos(a) * .3, Math.sin(a) * .3, 0]).rotation.z = a - Math.PI / 2
    }
    ring(.65, color); glow(1.2)
  } else return null
  group.userData.signatureMotif = motif
  return group
}

export function makeSignatureContactAura(fx, plan) {
  if (plan.effectSource !== 'expansion-signature') return null
  const group = new THREE.Group(), g = fx.geometries, { color, core, kind } = plan.palette
  group.name = 'signature-contact:' + plan.motif
  if (kind === 'fire') {
    const flame = makeFlameObject(fx, plan.palette, 3)
    flame.scale.setScalar(.7); group.add(flame)
  } else if (kind === 'electric') {
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU
      const bolt = skillMesh(fx, group, g.shard, i % 2 ? color : core, [.045, .4, .035], [Math.cos(a) * .32, Math.sin(a) * .32, 0])
      bolt.rotation.z = a + .4; bolt.userData.signaturePulse = i
    }
  } else if (kind === 'ice') {
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU
      skillMesh(fx, group, g.shard, i % 2 ? color : core, [.1, .32, .08], [Math.cos(a) * .3, Math.sin(a) * .3, 0]).rotation.z = a
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const arc = skillMesh(fx, group, g.arc, i % 2 ? color : core, [.6, .25, .6], [(i - 1) * .12, 0, 0], .4)
      arc.rotation.z = i * .55
    }
  }
  return group
}

export function animateSignatureObject(object, time) {
  object.traverse(child => {
    if (child.userData.signatureSpin) {
      if(child===object&&object.userData.shape)child.rotateZ(time*child.userData.signatureSpin)
      else child.rotation.z=time*child.userData.signatureSpin
    }
    if (child.userData.signatureHand) child.rotation.z = time * child.userData.signatureHand * 4
    if (child.userData.signaturePulse != null) child.visible = Math.sin(time * 28 + child.userData.signaturePulse) > -.6
  })
}
