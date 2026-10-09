// Both source models converge before the state swap. A consumed source leaves
// as data; it is not a KO and must never enter the renderer's down-clip path.
export function fusionPose(elapsedMs, swapMs) {
  const p = Math.max(0, Math.min(1, elapsedMs / Math.max(1, swapMs)))
  return { convergence: p * p * (3 - 2 * p), scale: 1 - .9 * p * p,
    lift: Math.sin(p * Math.PI) * .25, ringOpacity: .3 * (1 - p) }
}
