// Legacy preview helpers. Production attacks use attackPresentation.js; hit feedback is shared.
export const MOTION_MS = 760
export const PROJECTILE_MS = 700
export const PROJECTILE_IMPACT_MS = 620
export const HIT_MS = 920

export const clamp01 = (value) => Math.max(0, Math.min(1, value))

// Imported models carry the source games' clip names (idle, attack01, special01, damage, down…).
// Each role lists fallbacks in order of preference.
export const CLIP_ROLES = Object.freeze({
  idle: [/^idle/i, /idle|stand|wait/i],
  physical: [/^attack0?1$/i, /^attack/i, /attack|atk|punch|kick|slash/i],
  special: [/^special/i, /^attack0?2$/i, /^attack/i, /skill|cast|attack/i],
  hit: [/^damage/i, /damage|hit|hurt/i],
  dodge: [/^guard/i, /^move/i],
  defeat: [/^down/i, /down|dead|die/i],
  victory: [/^victory/i, /glad|win/i, /^special/i],
})

export function pickClip(clips, roles) {
  for (const pattern of roles) {
    const clip = clips.find((entry) => pattern.test(entry.name))
    if (clip) return clip
  }
  return null
}

// Clips keep their natural pace but speed up (up to 3x) so the key pose lands near the battle
// engine's timing window. Game speed is applied separately, by the mixer update.
export function clipPlaybackRate(clipSeconds, fitMs) {
  if (!fitMs || !clipSeconds) return 1
  const target = (fitMs / 1000) * 1.4
  return Math.min(3, Math.max(1, clipSeconds / target))
}

export function attackPose(progress, physical = true) {
  const p = clamp01(progress)
  const reach = p < 0.42 ? Math.sin(p / 0.42 * Math.PI / 2) : Math.cos((p - 0.42) / 0.58 * Math.PI / 2)
  return {
    advance: physical ? Math.max(0, reach) * 0.72 : 0,
    jump: physical ? Math.sin(p * Math.PI) * 0.35 : Math.sin(p * Math.PI) * 0.08,
    lean: Math.sin(p * Math.PI * 2) * (physical ? 0.22 : 0.1),
    charge: Math.sin(p * Math.PI),
  }
}

export function effectStyle(attribute = '', skillName = '') {
  const tag = `${attribute} ${skillName}`.toLowerCase()
  if (/화염|불꽃|불|파이어|fire|화속성/.test(tag)) return { color: 0xff7835, core: 0xffed9b, kind: 'fire' }
  if (/물|얼음|빙|아이스|water|ice/.test(tag)) return { color: 0x55d8ff, core: 0xd6ffff, kind: 'ice' }
  if (/전기|전격|번개|썬더|electric/.test(tag)) return { color: 0xffdc54, core: 0xffffff, kind: 'electric' }
  if (/어둠|암흑|다크|dark/.test(tag)) return { color: 0xb174ff, core: 0xf6c9ff, kind: 'dark' }
  if (/빛|신성|홀리|light/.test(tag)) return { color: 0xffefaa, core: 0xffffff, kind: 'light' }
  if (/풀|나무|식물|독|바람|자연|wind|nature/.test(tag)) return { color: 0x68f7aa, core: 0xd2ffe1, kind: 'nature' }
  if (/흙|땅|돌|바위|earth/.test(tag)) return { color: 0xe3af76, core: 0xffe4a8, kind: 'earth' }
  if (/강철|금속|메탈|steel|metal/.test(tag)) return { color: 0xc9d6e3, core: 0xffffff, kind: 'energy' }
  return { color: 0x65bfff, core: 0xe5f5ff, kind: 'energy' }
}

// A bounded ledger prevents React rerenders from replaying animation events.
export class EventLedger {
  constructor(limit = 512) { this.ids = new Set(); this.limit = limit }
  take(type, events = []) {
    return events.filter((event) => {
      const key = `${type}:${event.id}`
      if (this.ids.has(key)) return false
      this.ids.add(key)
      if (this.ids.size > this.limit) this.ids.delete(this.ids.values().next().value)
      return true
    })
  }
}
