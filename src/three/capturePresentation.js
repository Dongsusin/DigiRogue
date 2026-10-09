// Shared logical milliseconds: model, net, result text and sound use the same clock.
export const CAPTURE_BIND_MS = 450
export const CAPTURE_ABSORB_MS = 950
export const CAPTURE_CONTAIN_MS = 1450
export const CAPTURE_RESULT_MS = 2100
export const CAPTURE_RESTORE_MS = 2650
export const CAPTURE_TOTAL_MS = 3300
export const CAPTURE_CUES = Object.freeze([
  { at: CAPTURE_BIND_MS, kind: 'bind' },
  { at: 1530, kind: 'pulse' },
  { at: 1830, kind: 'pulse' },
  { at: CAPTURE_RESULT_MS, kind: 'result' },
])

const clamp = value => Math.max(0, Math.min(1, value))
export const captureEase = value => { const t = clamp(value); return t * t * (3 - 2 * t) }

export function capturePose(elapsed, success) {
  const absorbed = captureEase((elapsed - CAPTURE_ABSORB_MS) / (CAPTURE_CONTAIN_MS - CAPTURE_ABSORB_MS))
  const returned = success ? 0 : captureEase((elapsed - CAPTURE_RESULT_MS) / (CAPTURE_RESTORE_MS - CAPTURE_RESULT_MS))
  const amount = absorbed * (1 - returned)
  return { opacity: 1 - amount, scale: 1 - amount * .88, lift: amount * .42,
    phase: elapsed < CAPTURE_BIND_MS ? 'throw' : elapsed < CAPTURE_CONTAIN_MS ? 'bind'
      : elapsed < CAPTURE_RESULT_MS ? 'check' : success ? 'success' : 'failure',
    complete: elapsed >= CAPTURE_TOTAL_MS }
}

export function captureSpeed(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 1
}
