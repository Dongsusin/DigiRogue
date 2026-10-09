import { buildAttackSound, buildImpactSounds, buildSituationSound, soundForBattleMessages } from './soundDesign.js'

const SFX_GAIN = .38
const ATTACK_GAIN = 2
const BGM_DUCK_LEVEL = .5
const BGM_DUCK_ATTACK = .015
const BGM_DUCK_RELEASE = .24
const MAX_VOICES = 72
const EPSILON = .00001
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const speedOf = value => [1, 1.5, 2].includes(Number(value)) ? Number(value) : 1

// This bus is completely separate from the existing HTMLAudioElement BGM player.
// The same renderer works with an OfflineAudioContext for waveform checks/audition.
export class GameAudio {
  constructor({ context = null, isHidden = () => typeof document !== 'undefined' && document.hidden } = {}) {
    this.context = context
    this.isHidden = isHidden
    this.volume = .8
    this.voices = new Set()
    this.playedCount = 0
    this.musicDuck = null
    if (context) this.connectBus()
  }

  connectBus() {
    const ctx = this.context
    this.master = ctx.createGain()
    this.master.gain.value = SFX_GAIN * this.volume
    this.highpass = ctx.createBiquadFilter()
    this.highpass.type = 'highpass'; this.highpass.frequency.value = 28; this.highpass.Q.value = .5
    this.limiter = ctx.createDynamicsCompressor()
    this.limiter.threshold.value = -10; this.limiter.knee.value = 8
    this.limiter.ratio.value = 12; this.limiter.attack.value = .002; this.limiter.release.value = .1
    this.master.connect(this.highpass); this.highpass.connect(this.limiter); this.limiter.connect(ctx.destination)
    // Reuse one deterministic noise buffer, including for rapid multi-shot attacks.
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const samples = this.noise.getChannelData(0)
    let seed = 0x1a2b3c4d
    for (let i = 0; i < samples.length; i++) {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
      samples[i] = ((seed >>> 0) / 0xffffffff) * 2 - 1
    }
  }

  unlock() {
    try {
      if (!this.context || this.context.state === 'closed') {
        const Constructor = globalThis.AudioContext || globalThis.webkitAudioContext
        if (!Constructor) return false
        this.context = new Constructor({ latencyHint: 'interactive' })
        this.connectBus()
      }
      if (this.context.state === 'suspended') this.context.resume().catch(() => {})
      return true
    } catch { return false }
  }

  setVolume(value) {
    this.volume = clamp(Number(value) || 0, 0, 1)
    if (this.master) {
      const now = this.context.currentTime
      this.master.gain.cancelScheduledValues(now)
      this.master.gain.setValueAtTime(SFX_GAIN * this.volume, now)
    }
    if (!this.volume) this.stopAll()
  }

  play(sound, { speed = 1, scope = 'battle', at } = {}) {
    const ctx = this.context
    // A locked/hidden browser drops the cue. Never play stale attacks on return/unlock.
    if (!ctx || ctx.state === 'closed' || (ctx.state === 'suspended' && !ctx.startRendering) || !this.volume || this.isHidden() || !sound?.layers.length) return false
    const rate = speedOf(speed)
    const start = Math.max(ctx.currentTime, at ?? ctx.currentTime) + (sound.delay || 0) / rate
    const group = { scope, nodes: [], sources: [], end: start + sound.duration / rate, pending: sound.layers.length }
    // Retire the oldest group before exceeding the voice budget; rapid casts stay bounded.
    while (this.voiceCount + sound.layers.length > MAX_VOICES && this.voices.size) this.stopGroup(this.voices.values().next().value)
    const output = ctx.createGain()
    // Bound summed layer peaks too; the compressor is a backstop, not the mix strategy.
    const peakBudget = Math.max(1, sound.layers.reduce((sum, layer) => sum + layer.gain, 0))
    output.gain.value = (sound.gain ?? 1) * (sound.mix === 'attack' ? ATTACK_GAIN : 1) / peakBudget
    const pan = ctx.createStereoPanner?.()
    if (pan) { pan.pan.value = clamp(sound.pan || 0, -.65, .65); output.connect(pan); pan.connect(this.master); group.nodes.push(pan) }
    else output.connect(this.master)
    group.nodes.push(output)
    this.voices.add(group)
    try {
      for (const layer of sound.layers) {
        const when = start + (layer.offset || 0) / rate
        const duration = Math.max(.015, layer.duration / rate)
        const end = when + duration
        const source = layer.kind === 'noise' ? ctx.createBufferSource() : ctx.createOscillator()
        const filter = ctx.createBiquadFilter(), envelope = ctx.createGain()
        const frequency = value => clamp(value || 100, 28, Math.min(14000, ctx.sampleRate * .44))
        if (layer.kind === 'noise') {
          source.buffer = this.noise; source.loop = true
          filter.type = layer.filter || 'lowpass'
          filter.frequency.setValueAtTime(frequency(layer.from), when)
          filter.frequency.exponentialRampToValueAtTime(frequency(layer.to), end)
        } else {
          source.type = layer.wave || 'sine'
          source.frequency.setValueAtTime(frequency(layer.from), when)
          source.frequency.exponentialRampToValueAtTime(frequency(layer.to), end)
          filter.type = 'lowpass'; filter.frequency.value = layer.cutoff || 9500
        }
        filter.Q.value = layer.q || .7
        const attack = Math.min(duration * .8, (layer.attack ?? .004) / rate)
        const sustainEnd = Math.min(end - .003, when + attack + duration * (layer.hold || 0))
        const gain = clamp(layer.gain, EPSILON, .7)
        envelope.gain.setValueAtTime(EPSILON, when)
        envelope.gain.linearRampToValueAtTime(gain, when + attack)
        if (sustainEnd > when + attack) envelope.gain.setValueAtTime(gain, sustainEnd)
        envelope.gain.exponentialRampToValueAtTime(EPSILON, end)
        source.connect(filter); filter.connect(envelope)
        if (layer.modRate) {
          const amplitude = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain()
          const amount = clamp(layer.modDepth || .3, 0, .95)
          amplitude.gain.value = 1 - amount * .5
          lfo.frequency.value = layer.modRate; depth.gain.value = amount * .5
          lfo.connect(depth); depth.connect(amplitude.gain)
          envelope.connect(amplitude); amplitude.connect(output)
          group.nodes.push(amplitude, lfo, depth); group.sources.push(lfo)
          lfo.start(when); lfo.stop(end + .01)
        } else envelope.connect(output)
        group.nodes.push(source, filter, envelope); group.sources.push(source)
        source.onended = () => { if (--group.pending === 0) this.disposeGroup(group) }
        source.start(when); source.stop(end + .012)
      }
      this.playedCount++
      if (sound.mix === 'attack') {
        const previous = this.musicDuck
        this.musicDuck = {
          start: previous && start < previous.end + BGM_DUCK_RELEASE ? previous.start : start,
          end: Math.max(previous?.end ?? 0, group.end + .06),
        }
      }
      return true
    } catch {
      this.stopGroup(group)
      return false // Missing/broken device cannot interrupt gameplay.
    }
  }

  get voiceCount() { return [...this.voices].reduce((count, group) => count + group.pending, 0) }
  getBgmDucking() {
    if (!this.musicDuck || !this.volume || this.isHidden() || this.context?.state !== 'running') return 1
    const now = this.context.currentTime, { start, end } = this.musicDuck
    if (now < start) return 1
    if (now < end) {
      const attack = clamp((now - start) / BGM_DUCK_ATTACK, 0, 1)
      return 1 - (1 - BGM_DUCK_LEVEL) * attack
    }
    const release = clamp((now - end) / BGM_DUCK_RELEASE, 0, 1)
    return BGM_DUCK_LEVEL + (1 - BGM_DUCK_LEVEL) * (1 - (1 - release) ** 3)
  }
  disposeGroup(group) {
    if (!this.voices.delete(group)) return
    for (const node of group.nodes) { if ('onended' in node) node.onended = null; node.disconnect() }
  }
  stopGroup(group) {
    for (const source of group.sources) { try { source.stop() } catch { /* already ended */ } }
    this.disposeGroup(group)
  }
  stopAll(scope) {
    for (const group of [...this.voices]) if (!scope || group.scope === scope) this.stopGroup(group)
    if (!scope || scope === 'battle') this.musicDuck = null
  }
  attack(event, phase, shotIndex = 0) { return this.play(buildAttackSound(event, phase, shotIndex), { speed: event.speed }) }
  impact(event) { for (const sound of buildImpactSounds(event)) this.play(sound, { speed: event.speed }) }
  situation(kind, options = {}) { return this.play(buildSituationSound(kind, options), options) }
  messages(logs, options = {}) {
    const cue = soundForBattleMessages(logs)
    if (cue) this.situation(cue.kind, { ...options, ...cue })
  }
  dispose() {
    this.stopAll()
    this.master?.disconnect(); this.highpass?.disconnect(); this.limiter?.disconnect()
  }
}

export const gameAudio = new GameAudio()
