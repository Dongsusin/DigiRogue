export const EVOLUTION_DURATION_MS = 8000
const clamp = (n) => Math.max(0, Math.min(1, n))
const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t) }

// One clock drives camera, actors, effects and labels. It starts only after loading settles.
export class EvolutionPlayback {
  constructor(speed = 1, duration = EVOLUTION_DURATION_MS) {
    this.speed = [1, 1.5, 2].includes(Number(speed)) ? Number(speed) : 1
    this.duration = duration > 0 ? duration : EVOLUTION_DURATION_MS
    this.elapsed = 0
    this.ready = false
    this.finished = false
  }
  start() { this.ready = true }
  advance(deltaMs, paused = false) {
    if (this.ready && !paused && !this.finished) this.elapsed = Math.min(this.duration, this.elapsed + Math.max(0, deltaMs) * this.speed)
    return this.elapsed
  }
  finish() {
    if (this.finished) return false
    this.finished = true
    this.elapsed = this.duration
    return true
  }
}

export function sampleEvolution(elapsed, reducedMotion = false) {
  const t = Math.max(0, Math.min(EVOLUTION_DURATION_MS, elapsed))
  const charge = smooth(700, 3100, t) * (1 - smooth(4200, 5700, t))
  const reveal = smooth(3800, 6200, t)
  return {
    phase: t < 900 ? 'intro' : t < 3000 ? 'charge' : t < 4200 ? 'transform' : t < 6200 ? 'reveal' : 'complete',
    fromOpacity: 1 - smooth(2900, 3600, t),
    toOpacity: smooth(3800, 4600, t),
    charge,
    reveal,
    flash: smooth(3250, 3700, t) * (1 - smooth(3900, 4700, t)) * (reducedMotion ? 0.08 : 0.72),
    lift: reducedMotion ? 0 : 0.24 * charge,
    orbit: reducedMotion ? 0 : 0.48 - 0.75 * smooth(0, 3600, t) + 0.47 * smooth(4200, 8000, t),
  }
}
