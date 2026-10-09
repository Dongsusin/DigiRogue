// Generic grassland used while a map module is missing.
export default function build(kit) {
  kit.sky({ top: 0x4f93e6, horizon: 0xcfe6ff, sun: { elevation: 38, azimuth: -25, size: 26 }, clouds: { count: 12 } })
  kit.fog({ color: 0xcfe6ff, near: 60, far: 260 })
  kit.lights({ sky: 0xe6f4ff, ground: 0x5e7a48, hemi: 1.5, sun: { color: 0xfff0d2, intensity: 2.6, direction: [-8, 14, 9] } })
  kit.ground({ color: 0x5f9c48, color2: 0x7fb257, detail: 'grass', relief: 5, backRise: 8 })
  kit.mountains({ count: 10, color: 0x6c8fb0, color2: 0x7b9cbc, height: [30, 60] })
  kit.treeLine({ count: 70, distance: [40, 75], color: 0x3e7a3a })
  kit.scatter(kit.tree('round', { height: 1, leaves: 0x4c9a43, leaves2: 0x5fae4e }), { count: 18, area: { x0: -45, x1: 45, z0: -30, z1: -7 }, scale: [4, 7], surface: kit.heightAt })
  kit.scatter(kit.grassTuft({ color: 0x6fb454 }), { count: 120, area: { x0: -30, x1: 30, z0: -10, z1: 12 }, scale: [0.8, 1.3], surface: kit.heightAt })
}
