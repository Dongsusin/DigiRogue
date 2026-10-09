// One clock for recall, a short empty interval, materialization, and the next turn.
export const SWITCH_OUT_MS = 440
export const SWITCH_IN_DELAY_MS = 500
export const SWITCH_IN_MS = 500
export const SWITCH_TOTAL_MS = SWITCH_IN_DELAY_MS + SWITCH_IN_MS + 120

export function switchOpacity(kind, progress) {
  const p = Math.max(0, Math.min(1, progress))
  const eased = p * p * (3 - 2 * p)
  return kind === 'in' ? eased : 1 - eased
}

// A stage may change formation; every outgoing and incoming actor gets its own cue.
export function createSwitchEvents({ outgoing = [], incoming = [], side = 'ally', startedAt, speed = 1, nextId }) {
  return Array.from({ length: Math.max(outgoing.length, incoming.length) }, (_, index) => ({
    id: nextId(), outgoingId: outgoing[index]?.id ?? null, incomingId: incoming[index]?.id ?? null,
    side, startedAt, speed,
  }))
}
