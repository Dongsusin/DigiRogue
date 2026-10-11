import { BgmPlayer } from '../../src/audio/BgmPlayer.js'

// Exercise the shipping player with deterministic browser/media boundaries.
// Media decoding is validated separately in the browser; this harness verifies
// lifecycle, preference changes, autoplay policy, and network request behavior.
export function createBgmHarness({ volume = 1, hidden = false, online = true, tracks, contextKey = 'ai:title', playError = null } = {}) {
  const timers = new Map(), frames = new Map(), statuses = [], previews = []
  const window = new EventTarget(), document = new EventTarget(), navigator = { onLine: online }
  let clock = 0, sequence = 0, source, plays = 0, loads = 0
  const assignments = []
  document.hidden = hidden
  window.performance = { now: () => clock }
  window.setTimeout = (fn, delay = 0) => { const id = ++sequence; timers.set(id, { fn, at: clock + delay }); return id }
  window.clearTimeout = id => timers.delete(id)
  window.requestAnimationFrame = fn => { const id = ++sequence; frames.set(id, { fn, at: clock + 16 }); return id }
  window.cancelAnimationFrame = id => frames.delete(id)
  const audio = new EventTarget()
  Object.defineProperty(audio, 'src', { get: () => source, set: value => { source = value; assignments.push(value) } })
  Object.assign(audio, {
    paused: true, currentTime: 0, duration: 100, volume: 0, loop: false,
    pause() { this.paused = true },
    play() {
      plays++
      if (playError) return Promise.reject(playError)
      this.paused = false
      return Promise.resolve()
    },
    removeAttribute(name) { if (name === 'src') source = undefined },
    load() { loads++ },
  })
  const player = new BgmPlayer({ audio, window, document, navigator,
    versionUrl: url => url + '?v=0123456789abcdef', getDucking: () => 1,
    onStatus: status => statuses.push(status), onPreviewEnd: () => previews.push(clock),
  })
  let configuration = { tracks: tracks ?? [{ url: '/BGM/ai/one.ogg', pack: 'ai', scene: 'title' }, { url: '/BGM/ai/two.ogg', pack: 'ai', scene: 'title' }], volume, contextKey, previewTrack: null }
  player.update(configuration)
  const settle = async () => { for (let n = 0; n < 12; n++) await Promise.resolve() }
  return { player, audio, window, document, navigator, timers, frames, statuses, previews, assignments,
    plays: () => plays, loads: () => loads, clock: () => clock,
    async update(changes) { configuration = { ...configuration, ...changes }; player.update(configuration); await settle() },
    async gesture() { window.dispatchEvent(new Event('pointerdown')); await settle() },
    async emit(target, name) { target.dispatchEvent(new Event(name)); await settle() },
    async advance(duration) {
      const target = clock + duration
      for (let guard = 0; guard < 100_000; guard++) {
        const pending = [...timers].map(([id, timer]) => ({ id, ...timer, kind: 'timer' }))
          .concat([...frames].map(([id, frame]) => ({ id, ...frame, kind: 'frame' }))).sort((a, b) => a.at - b.at)
        if (!pending.length || pending[0].at > target) { clock = target; await settle(); return }
        const next = pending[0]
        clock = next.at; (next.kind === 'timer' ? timers : frames).delete(next.id)
        next.fn(clock); await settle()
      }
      throw Error('Player timers did not settle')
    },
    async dispose() { player.dispose(); await settle() },
  }
}
