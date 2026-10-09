// 시작의마을 — Village of Beginnings / はじまりの町 (Digimon Adventure, File Island).
// A toy-like nursery town of building blocks where Digi-Eggs hatch, under a green mountain with
// a waterfall. Built in the chunky voxel style of the map's original art.
export default function build(kit) {
  const { THREE, part, assemble, place, scatter } = kit

  kit.sky({ top: 0x4d8fe0, horizon: 0xd3e9ff, exponent: 0.8, sun: { elevation: 42, azimuth: -30, size: 24, glow: 0.35 },
    clouds: { count: 16, color: 0xffffff, shade: 0xe4eefb, height: [30, 75], distance: [150, 260], flat: 0.5 } })
  kit.fog({ color: 0xcfe4f6, near: 70, far: 300 })
  kit.lights({ sky: 0xe8f5ff, ground: 0x6a8f4a, hemi: 1.55, sun: { color: 0xfff1d4, intensity: 2.7, direction: [-9, 15, 10] }, rim: { color: 0xa8d8ff, intensity: 1.1 } })
  kit.ground({ color: 0x67b83e, color2: 0x86cc4d, detail: 'grass', relief: 2.2, reliefScale: 0.05, backRise: 6, noiseSeed: 11 })

  // Far green mountains and the big hill with its waterfall (back right, as in the art).
  kit.mountains({ count: 11, distance: [150, 210], height: [40, 70], width: [60, 110], color: 0x86a9c9, color2: 0x93b4d3, sharp: 0.3 })
  kit.mountains({ count: 7, distance: [95, 130], height: [22, 40], width: [45, 80], color: 0x4f8d3e, color2: 0x5c9a45, sharp: 0.2, spread: 300 })
  const hill = assemble([
    part(new THREE.ConeGeometry(42, 64, 9, 3), 0x4f9a3c, { position: [0, 32, 0] }),
    part(new THREE.ConeGeometry(30, 40, 8, 2), 0x5aa843, { position: [-18, 20, 10] }),
    part(new THREE.BoxGeometry(18, 22, 6), 0x7a5a3c, { position: [4, 18, 28] }),
  ])
  place(hill, { x: 58, z: -125 })
  const fall = kit.mesh(new THREE.PlaneGeometry(4, 34, 1, 8), { color: 0xe9f7ff, emissive: 0x9fd8ff, emissiveIntensity: 0.35, roughness: 0.2 }, { x: 62, y: 17, z: -95.5 })
  const fall2 = kit.mesh(new THREE.PlaneGeometry(2.4, 34, 1, 8), { color: 0xffffff, emissive: 0xbfe8ff, emissiveIntensity: 0.4, roughness: 0.2 }, { x: 66, y: 16, z: -95.3 })
  kit.animate((t) => { fall.material.emissiveIntensity = 0.3 + Math.sin(t * 6) * 0.06; fall2.position.y = 16 + Math.sin(t * 3) * 0.15 })
  kit.water({ y: 0.6, color: 0x7fc8f0, deep: 0x4d9fd6, area: { x0: 46, x1: 80, z0: -100, z1: -86 }, waves: 0.1, opacity: 0.9 })

  // Voxel trees: a trunk and stacked leaf cubes, like the original pixel art.
  const voxelTree = (leaf, leaf2) => assemble([
    part(new THREE.BoxGeometry(0.5, 1.6, 0.5), 0x7a5232, { position: [0, 0.8, 0] }),
    part(new THREE.BoxGeometry(2.2, 1.2, 2.2), leaf, { position: [0, 2.0, 0] }),
    part(new THREE.BoxGeometry(1.7, 1.0, 1.7), leaf2, { position: [0, 3.0, 0] }),
    part(new THREE.BoxGeometry(1.0, 0.8, 1.0), leaf, { position: [0, 3.8, 0] }),
  ])
  const pineTree = assemble([
    part(new THREE.BoxGeometry(0.45, 1.4, 0.45), 0x6d4a2d, { position: [0, 0.7, 0] }),
    part(new THREE.BoxGeometry(2.4, 0.9, 2.4), 0x2f7a35, { position: [0, 1.7, 0] }),
    part(new THREE.BoxGeometry(1.8, 0.9, 1.8), 0x378a3b, { position: [0, 2.6, 0] }),
    part(new THREE.BoxGeometry(1.2, 0.9, 1.2), 0x2f7a35, { position: [0, 3.5, 0] }),
    part(new THREE.BoxGeometry(0.6, 0.8, 0.6), 0x378a3b, { position: [0, 4.3, 0] }),
  ])
  const treeA = voxelTree(0x4fa33a, 0x62b646), treeB = voxelTree(0x3f9135, 0x57a83f)
  scatter(treeA, { count: 22, area: { x0: -60, x1: 60, z0: -48, z1: -9 }, scale: [1.3, 2.2], rotY: [0, Math.PI / 2], surface: kit.heightAt, avoid: [{ x0: -6, x1: 9, z0: -28, z1: -12 }] })
  scatter(treeB, { count: 18, area: { x0: -70, x1: 70, z0: -70, z1: -20 }, scale: [1.6, 2.6], rotY: [0, Math.PI / 2], surface: kit.heightAt, avoid: [{ x0: -6, x1: 9, z0: -28, z1: -12 }] })
  scatter(pineTree, { count: 16, area: { x0: -80, x1: 80, z0: -80, z1: -30 }, scale: [1.6, 2.8], rotY: [0, Math.PI / 2], surface: kit.heightAt })
  scatter(treeA, { count: 8, area: { x0: -34, x1: 34, z0: -8, z1: 2 }, scale: [1.4, 2], rotY: [0, Math.PI / 2], surface: kit.heightAt })

  // Toy blocks with pictograms (triangle, heart, star, cross, bird).
  const symbol = (shape, hex, size) => {
    switch (shape) {
      case 'heart': return [
        part(new THREE.BoxGeometry(size * 0.55, size * 0.55, 0.06), hex, { rotation: [0, 0, Math.PI / 4], position: [0, -size * 0.05, 0] }),
        part(new THREE.CylinderGeometry(size * 0.2, size * 0.2, 0.06, 12), hex, { rotation: [Math.PI / 2, 0, 0], position: [-size * 0.18, size * 0.14, 0] }),
        part(new THREE.CylinderGeometry(size * 0.2, size * 0.2, 0.06, 12), hex, { rotation: [Math.PI / 2, 0, 0], position: [size * 0.18, size * 0.14, 0] }),
      ]
      case 'triangle': return [part(new THREE.CylinderGeometry(0.001, size * 0.45, 0.06, 3), hex, { rotation: [Math.PI / 2, 0, 0] })]
      case 'star': return [part(new THREE.CylinderGeometry(size * 0.42, size * 0.42, 0.06, 5), hex, { rotation: [Math.PI / 2, 0, Math.PI / 10] }), part(new THREE.CylinderGeometry(size * 0.42, size * 0.42, 0.06, 5), hex, { rotation: [Math.PI / 2, 0, -Math.PI / 10] })]
      case 'cross': return [part(new THREE.BoxGeometry(size * 0.7, size * 0.2, 0.06), hex), part(new THREE.BoxGeometry(size * 0.2, size * 0.7, 0.06), hex)]
      default: return [ // bird
        part(new THREE.BoxGeometry(size * 0.5, size * 0.28, 0.06), hex),
        part(new THREE.BoxGeometry(size * 0.2, size * 0.2, 0.06), hex, { position: [size * 0.3, size * 0.14, 0] }),
        part(new THREE.BoxGeometry(size * 0.28, size * 0.1, 0.06), hex, { position: [-size * 0.05, size * 0.2, 0], rotation: [0, 0, 0.5] }),
      ]
    }
  }
  const faceParts = (shape, hex, size, offset) => symbol(shape, hex, size).map((g) => { g.translate(offset[0], offset[1], offset[2]); return g })
  function toyBlock(size, body, shape, mark) {
    const parts = [part(new THREE.BoxGeometry(size, size, size), body, { position: [0, size / 2, 0] })]
    parts.push(...faceParts(shape, mark, size * 0.75, [0, size / 2, size / 2 + 0.03]))
    const side = faceParts(shape === 'heart' ? 'cross' : 'heart', mark, size * 0.6, [0, 0, 0])
    for (const g of side) { g.rotateY(Math.PI / 2); g.translate(size / 2 + 0.03, size / 2, 0) }
    parts.push(...side)
    return parts
  }
  const blockSet = (list) => assemble(list.flatMap(([size, body, shape, mark, x, y, z, rot = 0]) => toyBlock(size, body, shape, mark).map((g) => { g.rotateY(rot); g.translate(x, y, z); return g })))

  // Left: red-roofed striped block tower and a pile of blocks.
  place(assemble([
    part(new THREE.BoxGeometry(3, 3, 3), 0x2f6fa8, { position: [0, 1.5, 0] }),
    part(new THREE.CylinderGeometry(1.1, 1.1, 2.4, 8), 0xd9562f, { position: [0, 4.2, 0] }),
    part(new THREE.CylinderGeometry(1.1, 1.1, 2.4, 8), 0x2a8a9a, { position: [0, 6.6, 0] }),
    part(new THREE.CylinderGeometry(1.1, 1.1, 2.4, 8), 0xd9562f, { position: [0, 9.0, 0] }),
    part(new THREE.CylinderGeometry(1.35, 1.35, 0.5, 8), 0xc23a2a, { position: [0, 10.45, 0] }),
    part(new THREE.ConeGeometry(1.4, 2.6, 8), 0xc23a2a, { position: [0, 12, 0] }),
  ]), { x: -16, z: -13, rotY: 0.2 })
  place(blockSet([
    [2.4, 0x2c77c9, 'triangle', 0xe03c2c, 0, 0, 0],
    [2.0, 0xe25a9a, 'cross', 0x8fd14a, 0.4, 2.4, 0.2, 0.3],
    [1.6, 0xf3cc32, 'bird', 0x3a3a3a, 2.6, 0, 0.8, -0.2],
  ]), { x: -21, z: -8, rotY: 0.35 })
  // Star-topped block stack.
  place(assemble([
    ...blockSetParts(),
    part(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 5), 0xf2c52e, { position: [0, 6.9, 0], rotation: [Math.PI / 2, 0, Math.PI / 10] }),
    part(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 5), 0xf2c52e, { position: [0, 6.9, 0], rotation: [Math.PI / 2, 0, -Math.PI / 10] }),
  ]), { x: -9, z: -17, rotY: 0.1 })
  function blockSetParts() {
    return [
      ...toyBlock(2.6, 0x3a7fc0, 'cross', 0xe9a23a).map((g) => g),
      ...toyBlock(2.6, 0x7ec24a, 'bird', 0xffffff).map((g) => { g.translate(0, 2.6, 0); return g }),
      part(new THREE.BoxGeometry(0.5, 0.8, 0.5), 0xf2c52e, { position: [0, 5.6, 0] }),
    ]
  }

  // Centre back: the block chapel with arched windows and its clock tower.
  const chapel = []
  chapel.push(part(new THREE.BoxGeometry(8, 5, 5), 0xc9a878, { position: [0, 2.5, 0] }))
  chapel.push(part(new THREE.BoxGeometry(8.4, 0.5, 5.4), 0x8d6c46, { position: [0, 5.1, 0] }))
  chapel.push(part(new THREE.CylinderGeometry(0.01, 4.1, 2.6, 4), 0x4a4f6a, { position: [0, 6.6, 0], rotation: [0, Math.PI / 4, 0], scale: [1.4, 1, 0.9] }))
  for (const x of [-2, 2]) {
    chapel.push(part(new THREE.BoxGeometry(1.6, 2.4, 0.2), 0x5c6f8a, { position: [x, 2.3, 2.55] }))
    chapel.push(part(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12, 1, false, 0, Math.PI), 0x5c6f8a, { position: [x, 3.5, 2.55], rotation: [Math.PI / 2, 0, Math.PI / 2] }))
    chapel.push(part(new THREE.BoxGeometry(1.9, 0.3, 0.3), 0xe0c060, { position: [x, 1.05, 2.6] }))
  }
  chapel.push(part(new THREE.BoxGeometry(3, 13, 3), 0xd8cf9f, { position: [5.5, 6.5, 0] }))
  chapel.push(part(new THREE.BoxGeometry(3.3, 3, 3.3), 0x3fa39a, { position: [5.5, 11.5, 0] }))
  chapel.push(part(new THREE.BoxGeometry(1.2, 1.4, 0.2), 0x2a3a44, { position: [5.5, 11.5, 1.7] }))
  chapel.push(part(new THREE.BoxGeometry(1.2, 1.4, 0.2), 0x2a3a44, { position: [5.5, 8, 1.55] }))
  chapel.push(part(new THREE.ConeGeometry(2.2, 4.2, 4), 0x8a6a48, { position: [5.5, 15.1, 0], rotation: [0, Math.PI / 4, 0] }))
  chapel.push(part(new THREE.BoxGeometry(0.35, 3, 0.35), 0xa24a3a, { position: [4.7, 15.8, 0.3] }))
  chapel.push(part(new THREE.BoxGeometry(0.35, 3, 0.35), 0xa24a3a, { position: [6.3, 15.8, -0.3] }))
  place(assemble(chapel), { x: 1, z: -22, rotY: -0.06, shadow: true })

  // Teddy bear sitting at the right, as in the art.
  const bear = assemble([
    part(new THREE.SphereGeometry(1.2, 10, 8), 0xa87a4f, { position: [0, 1.3, 0], scale: [1, 1.05, 0.9] }),
    part(new THREE.SphereGeometry(0.95, 10, 8), 0xb3865a, { position: [0, 3.0, 0] }),
    part(new THREE.SphereGeometry(0.35, 8, 6), 0x96693f, { position: [-0.7, 3.75, 0] }),
    part(new THREE.SphereGeometry(0.35, 8, 6), 0x96693f, { position: [0.7, 3.75, 0] }),
    part(new THREE.SphereGeometry(0.4, 8, 6), 0xe0c49c, { position: [0, 2.8, 0.75], scale: [1, 0.8, 0.8] }),
    part(new THREE.SphereGeometry(0.12, 6, 4), 0x2a1a10, { position: [0, 2.95, 1.05] }),
    part(new THREE.SphereGeometry(0.1, 6, 4), 0x1a1210, { position: [-0.35, 3.25, 0.82] }),
    part(new THREE.SphereGeometry(0.1, 6, 4), 0x1a1210, { position: [0.35, 3.25, 0.82] }),
    part(new THREE.SphereGeometry(0.45, 8, 6), 0xa87a4f, { position: [-1.15, 1.7, 0.3], scale: [0.8, 1.2, 0.8] }),
    part(new THREE.SphereGeometry(0.45, 8, 6), 0xa87a4f, { position: [1.15, 1.7, 0.3], scale: [0.8, 1.2, 0.8] }),
    part(new THREE.SphereGeometry(0.55, 8, 6), 0xa87a4f, { position: [-0.6, 0.45, 0.8], scale: [0.9, 0.8, 1.3] }),
    part(new THREE.SphereGeometry(0.55, 8, 6), 0xa87a4f, { position: [0.6, 0.45, 0.8], scale: [0.9, 0.8, 1.3] }),
  ])
  place(bear, { x: 9.5, z: -12, rotY: -0.35, scale: 1.1, shadow: true })

  // Right: yellow block tower with a blue roof, and heart / bird blocks.
  place(assemble([
    ...toyBlock(3.2, 0x5aa846, 'heart', 0xe0342c),
    ...toyBlock(2.8, 0xf2c52e, 'bird', 0x3f8fd0).map((g) => { g.translate(0, 3.2, 0); return g }),
    part(new THREE.BoxGeometry(2.4, 2.4, 2.4), 0xf2c52e, { position: [0, 7.2, 0] }),
    part(new THREE.ConeGeometry(2.2, 2.6, 4), 0x2f8fa8, { position: [0, 9.7, 0], rotation: [0, Math.PI / 4, 0] }),
  ]), { x: 18, z: -13, rotY: -0.25, shadow: true })
  place(blockSet([
    [2.2, 0xe96aa0, 'heart', 0xffffff, 0, 0, 0],
    [1.8, 0xd9462f, 'triangle', 0xf2c52e, 2.4, 0, -0.6, 0.4],
  ]), { x: 13.5, z: -9, rotY: -0.3 })

  // Wooden fences behind the battle floor.
  const fenceProto = kit.fence({ length: 5, height: 1.1, color: 0x9a6a3c, posts: 4 })
  scatter(fenceProto, { positions: [{ x: -8, z: -6.5, rotY: 0.05 }, { x: -2.5, z: -7, rotY: -0.04 }, { x: 4.5, z: -6.8, rotY: 0.06 }, { x: 13, z: -6 }], avoidArena: false, scale: [1, 1] })

  // Digi-Eggs resting in little cradles (the village's purpose).
  const egg = (shell, spot) => assemble([
    part(new THREE.CylinderGeometry(0.75, 0.6, 0.45, 10), 0xc99a64, { position: [0, 0.22, 0] }),
    part(new THREE.SphereGeometry(0.55, 12, 10), shell, { position: [0, 0.95, 0], scale: [1, 1.3, 1] }),
    part(new THREE.SphereGeometry(0.16, 6, 4), spot, { position: [0.3, 1.1, 0.4] }),
    part(new THREE.SphereGeometry(0.13, 6, 4), spot, { position: [-0.25, 0.8, 0.45] }),
    part(new THREE.SphereGeometry(0.12, 6, 4), spot, { position: [0.05, 1.45, 0.38] }),
  ])
  place(egg(0xfff4d6, 0xe05a8a), { x: -14, z: -5.6, rotY: 0.4 })
  place(egg(0xdff3ff, 0x3f8fd0), { x: -12.6, z: -6.2, rotY: -0.3, scale: 0.9 })
  place(egg(0xfff0a8, 0x5aa846), { x: 14.2, z: -5.2, rotY: 0.2, scale: 0.95 })

  // Foreground and floor dressing: grass tufts and small flowers.
  scatter(kit.grassTuft({ color: 0x5aa836, color2: 0x7cc446, height: 0.45 }), { count: 160, area: { x0: -40, x1: 40, z0: -12, z1: 14 }, scale: [0.7, 1.3], surface: kit.heightAt })
  scatter(kit.flower({ color: 0xffffff, center: 0xf2c52e }), { count: 40, area: { x0: -34, x1: 34, z0: -10, z1: 10 }, scale: [0.8, 1.2], surface: kit.heightAt })
  scatter(kit.flower({ color: 0xb58cff, center: 0xfff2a8 }), { count: 26, area: { x0: -34, x1: 34, z0: -10, z1: 10 }, scale: [0.8, 1.2], surface: kit.heightAt })
  scatter(kit.flower({ color: 0xff8a3a, center: 0xffe07a }), { count: 18, area: { x0: -30, x1: 30, z0: -9, z1: 8 }, scale: [0.8, 1.1], surface: kit.heightAt })

  kit.particles({ kind: 'petals', count: 60, color: 0xfff4c8, area: { x0: -30, x1: 30, y0: 0.5, y1: 12, z0: -24, z1: 6 }, speed: 0.5 })
  kit.particles({ kind: 'sparkle', count: 24, color: 0xfff6c8, area: { x0: -22, x1: 22, y0: 0.5, y1: 6, z0: -14, z1: -4 }, size: 0.18 })
}
