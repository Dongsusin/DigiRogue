import { clipPlaybackRate, HIT_MS, clamp01 } from './battle3dMath.js'

// Finish the authored fall before dissolving. The old fixed hit window removed
// most actors while their down clip was still playing.
export function defeatPresentation(clipSeconds = 0) {
  const rate = clipPlaybackRate(clipSeconds, HIT_MS)
  const fallMs = clipSeconds > 0 ? clipSeconds / rate * 1000 : 500
  const holdMs = 100
  const fadeMs = 320
  return { rate, fallMs, fadeStartMs: fallMs + holdMs, durationMs: Math.max(HIT_MS, fallMs + holdMs + fadeMs), fadeMs }
}

export function defeatPose(presentation, elapsedMs) {
  return {
    clipSeconds: Math.min(presentation.fallMs, Math.max(0, elapsedMs)) * presentation.rate / 1000,
    fade: clamp01((elapsedMs - presentation.fadeStartMs) / presentation.fadeMs),
  }
}
