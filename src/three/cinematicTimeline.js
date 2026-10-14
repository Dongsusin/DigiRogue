// Frame sampler for the anime / Super Rumble evolution templates.
// Beats: intro → charge (source becomes data) → transform (shell bursts) → reveal (pose) → complete (name card).
const clamp = (n) => Math.max(0, Math.min(1, n))
const smooth = (a, b, n) => { if (b <= a) return n >= b ? 1 : 0; const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t) }
const pulse = (a, b, c, d, n) => smooth(a, b, n) * (1 - smooth(c, d, n))

export function sampleCinematic(cinematic, elapsed, reducedMotion = false) {
  const { duration, beats } = cinematic
  const { charge: c, transform: x, reveal: r, complete: done } = beats
  const t = Math.max(0, Math.min(duration, elapsed))
  const chargeSpan = x - c
  const phase = t < c ? 'intro' : t < x ? 'charge' : t < r ? 'transform' : t < done ? 'reveal' : 'complete'
  const charge = smooth(c * 0.6, x - 200, t) * (1 - smooth(r - 300, r + 900, t))
  const reveal = smooth(r - 200, r + 1500, t)
  // The chain (warp) occupies the middle of the charge, after the source has turned to light.
  const chainStart = c + chainSpanStart(cinematic) * chargeSpan
  const chain = cinematic.chain?.length ? clamp((t - chainStart) / Math.max(1, x - 250 - chainStart)) : 0
  return {
    phase,
    t,
    progress: t / duration,
    fromOpacity: 1 - smooth(x - 400, x + 250, t),
    toOpacity: smooth(r - 350, r + 350, t),
    charge,
    reveal,
    // 0 → 1 while the source loses its colours to a glowing silhouette.
    silhouette: smooth(c, c + chargeSpan * 0.4, t),
    // Data wireframe flicker over the silhouette.
    wire: pulse(c + chargeSpan * 0.25, c + chargeSpan * 0.45, x - 300, x, t),
    // The cocoon / sphere / helix that encloses the transformation.
    shell: pulse(c + chargeSpan * 0.35, x - 300, r - 250, r + 150, t),
    burst: pulse(r - 300, r, r + 500, r + 1500, t),
    chain,
    assemble: smooth(x, r + 400, t),
    rise: pulse(c, c + chargeSpan * 0.6, x - 100, r, t),
    flash: (pulse(x - 250, x + 50, x + 200, x + 650, t) * 0.65 + pulse(r - 260, r - 40, r + 60, r + 600, t) * 0.85) * (reducedMotion ? 0.12 : 1) * clamp(cinematic.flashScale ?? 1),
    callout: pulse(150, 600, c + chargeSpan * 0.45, c + chargeSpan * 0.6, t),
    split: cinematic.template === 'jogress' || cinematic.template === 'xros' ? pulse(100, 500, c + 300, c + 900, t) : 0,
    nameCard: smooth(r + 500, r + 1100, t),
    shake: reducedMotion ? 0 : pulse(x - 200, x, x + 120, x + 600, t) * 0.6 + pulse(r - 100, r, r + 100, r + 700, t),
    reducedMotion,
  }
}

function chainSpanStart(cinematic) {
  return cinematic.template === 'warp' ? 0.35 : 0.5
}

// Camera choreography as a list of keyframes [time, azimuth, height, distance, lookY].
export function sampleCinematicCamera(cinematic, elapsed, reducedMotion = false) {
  const { charge: c, transform: x, reveal: r, complete: done } = cinematic.beats
  const d = cinematic.duration
  const jogress = cinematic.template === 'jogress'
  const xros = cinematic.template === 'xros'
  const keys = reducedMotion
    ? [[0, 0, 2.6, 9.4, 1.2], [d, 0, 2.6, 9.4, 1.3]]
    : xros ? [
      [0, 0, 1.8, 10.5, 1.25],
      [c, -.08, 2.1, 10.5, 1.3],
      [x - 200, -.2, 2.4, 10.0, 1.35],
      [r - 150, .15, 2.1, 9.8, 1.4],
      [r + 900, .08, 1.5, 8.8, 1.4],
      [done, 0, 1.4, 8.2, 1.4],
      [d, 0, 1.4, 8.2, 1.4],
    ] : [
      [0, 0.15, 1.1, 5.4, 1.0],
      [c, -0.35, 1.5, 6.6, 1.2],
      [x - 300, -1.55, jogress ? 3.6 : 2.4, jogress ? 9.6 : 7.8, jogress ? 2.4 : 1.6],
      [x + 200, -1.7, 2.6, 9.8, 1.7],
      [r + 100, 0.55, 0.6, 7.0, 1.7],
      [done, 0.18, 1.3, 7.9, 1.5],
      [d, 0.08, 1.5, 8.2, 1.45],
    ]
  const t = Math.max(0, Math.min(d, elapsed))
  let i = 0
  while (i < keys.length - 2 && keys[i + 1][0] <= t) i++
  const [t0, ...a] = keys[i]
  const [t1, ...b] = keys[i + 1]
  const k = smooth(t0, t1, t)
  const [azimuth, height, distance, lookY] = a.map((value, index) => value + (b[index] - value) * k)
  return { azimuth, height, distance, lookY }
}
