import { groupBattlePresentationCues } from './battleLogTimeline.js'

// Battle motions, damage, patterns and logs share one ordered clock.
export function playBattleCueSequence(timeline, { speed = 1, onCues, onComplete,
  setTimer = setTimeout, clearTimer = clearTimeout, now = () => performance.now() } = {}) {
  const groups = groupBattlePresentationCues(timeline)
  const origin = now()
  let cursor = 0, index = 0, timer, cancelled = false, finished = false
  const finish = () => {
    if (cancelled || finished) return
    finished = true; onComplete?.()
  }
  const next = () => {
    if (cancelled || finished) return
    const group = groups[index]
    const atMs = group?.atMs ?? timeline.durationMs
    timer = setTimer(() => {
      if (cancelled || finished) return
      if (!group) { finish(); return }
      cursor = atMs; index++
      onCues?.(group.cues)
      next()
    }, Math.max(0, origin + atMs / speed - now()))
  }
  next()
  return { cancel() { cancelled = true; clearTimer(timer) }, get elapsedMs() { return cursor } }
}
