const FADE_IN_MS = 1100
const FADE_OUT_MS = 2000
const MAX_RETRIES = 4
const clamp = value => Math.max(0, Math.min(1, Number(value) || 0))

// One HTMLAudioElement owns both gameplay music and auditions. Source changes
// invalidate pending play promises so a previous track cannot resume later.
export class BgmPlayer {
  constructor({ audio, window, document, navigator, versionUrl = url => url,
    getDucking = () => 1, onStatus = () => {}, onPreviewEnd = () => {} }) {
    Object.assign(this, { audio, window, document, navigator, versionUrl, getDucking, onStatus, onPreviewEnd })
    this.tracks = []
    this.volume = 0
    this.baseVolume = 0
    this.currentTrack = null
    this.previewTrack = null
    this.contextKey = ''
    this.unlocked = false
    this.disposed = false
    this.generation = 0
    this.retryFailures = 0
    this.retryTimer = null
    this.fadeFrame = null
    this.fadingOut = false
    this.handlers = {
      pointerdown: () => this.gesture(), keydown: () => this.gesture(),
      offline: () => this.suspend(), online: () => { this.retryFailures = 0; this.resume() },
      visibilitychange: () => document.hidden ? this.suspend() : this.resume(),
      timeupdate: () => this.timeUpdate(), ended: () => this.ended(),
      error: () => this.failed(), playing: () => { this.retryFailures = 0; this.cancelRetry(); this.emit('playing') },
    }
    for (const event of ['pointerdown', 'keydown', 'offline', 'online']) window.addEventListener(event, this.handlers[event])
    document.addEventListener('visibilitychange', this.handlers.visibilitychange)
    for (const event of ['timeupdate', 'ended', 'error', 'playing']) audio.addEventListener(event, this.handlers[event])
    const mix = () => {
      if (this.disposed) return
      if (!audio.paused) audio.volume = clamp(this.baseVolume * this.getDucking())
      this.mixFrame = window.requestAnimationFrame(mix)
    }
    this.mixFrame = window.requestAnimationFrame(mix)
  }

  emit(state) {
    const status = { state, trackUrl: this.currentTrack?.url ?? null, isPreview: Boolean(this.previewTrack) }
    const key = JSON.stringify(status)
    if (key !== this.statusKey) { this.statusKey = key; this.onStatus(status) }
  }

  candidates() { return this.previewTrack ? [this.previewTrack] : this.tracks }
  syncLoop() {
    this.audio.loop = !this.previewTrack && this.tracks.length === 1
    // Scene themes are authored as seamless loops. If the selection shrinks
    // during a playlist fade, restore its level before the native loop seam.
    if (this.audio.loop && this.fadingOut) {
      this.fadingOut = false; this.cancelFade(); this.baseVolume = this.volume
      this.audio.volume = clamp(this.baseVolume * this.getDucking())
    }
  }
  canStream() {
    return !this.disposed && !this.document.hidden && this.navigator.onLine !== false
      && this.volume > 0 && this.candidates().length > 0
  }
  cancelRetry() { this.window.clearTimeout(this.retryTimer); this.retryTimer = null }
  cancelFade() {
    if (this.fadeFrame !== null) this.window.cancelAnimationFrame(this.fadeFrame)
    this.fadeFrame = null
  }
  fadeTo(target, duration) {
    this.cancelFade()
    const started = this.window.performance.now(), from = this.baseVolume
    const tick = now => {
      if (this.disposed) return
      const progress = Math.max(0, Math.min(1, (now - started) / duration))
      this.baseVolume = from + (target - from) * (1 - (1 - progress) ** 3)
      this.audio.volume = clamp(this.baseVolume * this.getDucking())
      this.fadeFrame = progress < 1 ? this.window.requestAnimationFrame(tick) : null
    }
    this.fadeFrame = this.window.requestAnimationFrame(tick)
  }

  update({ tracks = [], volume = 0, contextKey = '', previewTrack = null }) {
    const contextChanged = this.contextKey !== contextKey
    const previewChanged = this.previewTrack?.url !== previewTrack?.url
    const volumeChanged = this.volume !== clamp(volume)
    if (previewChanged && previewTrack && !contextChanged && this.currentTrack && !this.previewTrack) {
      this.savedMain = { track: this.currentTrack, time: this.audio.currentTime }
    }
    if (contextChanged) this.savedMain = null
    Object.assign(this, { tracks, volume: clamp(volume), contextKey, previewTrack })
    this.syncLoop()
    const allowed = this.candidates()
    const invalidTrack = this.currentTrack && !allowed.some(track => track.url === this.currentTrack.url)
    if (contextChanged || previewChanged || invalidTrack) {
      this.suspend()
      this.retryFailures = 0
      this.currentTrack = null
      this.audio.removeAttribute('src')
      this.fadingOut = false
      if (previewChanged && !previewTrack && this.savedMain && tracks.some(track => track.url === this.savedMain.track.url)) {
        this.pendingMain = this.savedMain
      } else this.pendingMain = null
      if (!previewTrack) this.savedMain = null
    }
    if (!allowed.length) {
      this.suspend()
      this.currentTrack = null
      this.audio.removeAttribute('src')
      this.emit('off')
      return
    }
    if (!this.canStream()) { this.suspend(); this.emit(this.volume <= 0 ? 'muted' : 'paused'); return }
    if (volumeChanged) {
      this.cancelFade()
      this.baseVolume = this.volume
      this.audio.volume = clamp(this.baseVolume * this.getDucking())
    }
    this.resume()
  }

  pickNext() {
    const tracks = this.candidates()
    const alternatives = tracks.filter(track => track.url !== this.currentTrack?.url)
    const pool = alternatives.length ? alternatives : tracks
    return pool[Math.floor(Math.random() * pool.length)] ?? null
  }

  async start(track, time = 0) {
    if (!track || !this.unlocked || !this.canStream()) return
    this.cancelRetry(); this.cancelFade()
    const generation = ++this.generation
    this.currentTrack = track
    this.fadingOut = false
    this.audio.pause()
    this.audio.src = this.versionUrl(track.url)
    this.audio.currentTime = time
    this.audio.volume = 0
    this.baseVolume = 0
    this.resuming = true
    this.emit('loading')
    try {
      await this.audio.play()
      if (generation !== this.generation || this.disposed) return
      if (!this.canStream()) { this.audio.pause(); return }
      this.emit('playing')
      this.fadeTo(this.volume, FADE_IN_MS)
    } catch {
      if (generation === this.generation && !this.disposed) { this.audio.pause(); this.emit('blocked') }
    } finally {
      if (generation === this.generation) this.resuming = false
    }
  }

  gesture() { this.unlocked = true; this.resume() }
  retry() {
    this.suspend(); this.retryFailures = 0; this.unlocked = true
    this.currentTrack = null; this.audio.removeAttribute('src'); this.resume()
  }
  resume() {
    if (!this.unlocked || !this.canStream() || this.retryTimer !== null || this.retryFailures >= MAX_RETRIES) return
    if (!this.currentTrack || !this.audio.src) {
      const saved = this.pendingMain
      this.pendingMain = null
      void this.start(saved?.track ?? this.pickNext(), saved?.time ?? 0)
      return
    }
    if (!this.audio.paused || this.resuming) return
    const generation = this.generation
    this.resuming = true
    this.audio.play().then(() => {
      if (generation !== this.generation || this.disposed) return
      if (!this.canStream()) { this.audio.pause(); return }
      this.emit('playing'); this.fadeTo(this.volume, FADE_IN_MS)
    }).catch(() => {
      if (generation === this.generation && !this.disposed) this.emit('blocked')
    }).finally(() => { if (generation === this.generation) this.resuming = false })
  }
  suspend() {
    ++this.generation
    this.resuming = false
    this.cancelRetry(); this.cancelFade(); this.audio.pause()
  }
  timeUpdate() {
    if (this.audio.loop) return
    if (!this.fadingOut && Number.isFinite(this.audio.duration) && this.audio.duration > 3
      && this.audio.duration - this.audio.currentTime <= 3) {
      this.fadingOut = true; this.fadeTo(0, FADE_OUT_MS)
    }
  }
  ended() {
    if (this.audio.loop) return
    if (this.previewTrack) { this.emit('paused'); this.onPreviewEnd(); return }
    if (this.canStream()) void this.start(this.pickNext())
  }
  failed() {
    if (!this.canStream() || !this.unlocked || this.retryTimer !== null || this.retryFailures >= MAX_RETRIES) return
    this.emit('error')
    const delay = 5000 * 2 ** this.retryFailures++
    this.retryTimer = this.window.setTimeout(() => {
      this.retryTimer = null
      void this.start(this.pickNext())
    }, delay)
  }
  dispose() {
    this.disposed = true
    this.suspend()
    this.window.cancelAnimationFrame(this.mixFrame)
    for (const event of ['pointerdown', 'keydown', 'offline', 'online']) this.window.removeEventListener(event, this.handlers[event])
    this.document.removeEventListener('visibilitychange', this.handlers.visibilitychange)
    for (const event of ['timeupdate', 'ended', 'error', 'playing']) this.audio.removeEventListener(event, this.handlers[event])
  }
}
