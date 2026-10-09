import catalog from './digimonSizeProfiles.json' with { type: 'json' }
import { canonicalDigimonName } from './digimonNames.js'

// These are authored display proportions, never official heights in metres.
export const DIGIMON_SIZE_PROFILES = Object.freeze(Object.fromEntries(
  Object.entries(catalog.profiles).map(([name, profile]) => [name, Object.freeze({ name, ...profile })]),
))

const STAGE_SCALE = { 유아기: .33, 유년기: .41, 성장기: .72, 성숙기: 1.3, 아머체: 1.3, 하이브리드체: 1.3, 완전체: 1.6, 궁극체: 1.7, 초궁극체: 1.9 }
const LEGACY_SCALE = [.33, .72, 1.3, 1.65, 1.9]
const SIZE_LABELS = [
  [.38, '아주 작은 체구'], [.50, '초소형'], [.70, '소형'], [.90, '작은 중형'],
  [1.15, '중형'], [1.40, '큰 중형'], [1.65, '대형'], [1.90, '큰 대형'],
  [2.15, '초대형'], [2.40, '거대'], [Infinity, '초거대'],
]

export function getDigimonSizeProfile(combatant) {
  const names = typeof combatant === 'string' ? [combatant]
    : [combatant?.imageName, combatant?.speciesName, combatant?.name, combatant?.이름, combatant?.speciesData?.이름]
  for (const name of names) {
    if (typeof name === 'string' && DIGIMON_SIZE_PROFILES[canonicalDigimonName(name)]) return DIGIMON_SIZE_PROFILES[canonicalDigimonName(name)]
  }
  return null
}

export function getDigimonDisplayScale(combatant) {
  const profile = getDigimonSizeProfile(combatant)
  if (profile) return profile.scale
  const stage = STAGE_SCALE[combatant?.speciesStage]
  if (stage) return stage
  const legacy = Number(combatant?.size ?? combatant?.크기)
  return Number.isFinite(legacy) && legacy >= 1 && legacy <= 5 ? LEGACY_SCALE[Math.round(legacy) - 1] : 1
}

export function getDigimonSizeLabel(combatant) {
  const scale = getDigimonDisplayScale(combatant)
  return SIZE_LABELS.find(([limit]) => scale <= limit)[1]
}

// A smooth upper bound preserves differences between large species instead of
// flattening all of them at the same clamp. All dimensions use the same scale.
export function fitDigimonScale(desired, { width = 1, height = 1 }, maxWidth, maxHeight) {
  const cap = Math.max(.001, Math.min(maxWidth / Math.max(width, .001), maxHeight / Math.max(height, .001)))
  const ratio = Math.max(.001, desired) / cap
  return cap * ratio / Math.pow(1 + ratio ** 4, .25)
}

export function getEvolutionDisplayHeight(combatant, paired = false) {
  return fitDigimonScale(getDigimonDisplayScale(combatant) * 2.5, { width: 1, height: 1 }, 10, paired ? 2.3 : 3.1)
}

// Keep the UI grid's centers authoritative. Bound excessive silhouette overlap
// with a common scale instead of moving slots or flattening species proportions.
export function fitDigimonFormation(entries, teams, { gap = 12, padding = 8, minHeight = 28, depthGap = 8, bounds, maxOverlap = .25 } = {}) {
  const result = new Map()
  if (!entries.length) return result
  const edges = bounds ?? { left: Math.min(...Object.values(teams).map(team => team.left)),
    right: Math.max(...Object.values(teams).map(team => team.left + team.width)) }
  const slots = []
  for (const [side, team] of Object.entries(teams)) {
    const members = entries.filter(entry => entry.side === side)
    if (!members.length) continue
    const slotWidth = (team.width - gap * (members.length - 1)) / members.length
    members.forEach((entry, index) => {
      const center = entry.center ?? team.left + index * (slotWidth + gap) + slotWidth / 2
      const maxWidth = Math.max(.001, 2 * Math.min(center - edges.left - padding, edges.right - padding - center))
      const desired = entry.desiredHeight / entry.footprint.height
      const minimum = Math.min(entry.desiredHeight, minHeight) / entry.footprint.height
      const cap = Math.min(maxWidth / entry.footprint.width, entry.maxHeight / entry.footprint.height)
      slots.push({ ...entry, center, desired, minimum, cap })
    })
  }
  // At most a quarter of the narrower footprint can overlap a neighbour. A
  // monotonic fit also includes the readability floor for very small species.
  const overlapLimit = Math.max(0, Math.min(.5, maxOverlap))
  const fits = scaleFor => slots.every((entry, index) => slots.slice(index + 1).every(other => {
    const width = entry.footprint.width * scaleFor(entry)
    const otherWidth = other.footprint.width * scaleFor(other)
    return (width + otherWidth) / 2 - Math.abs(entry.center - other.center) <= Math.min(width, otherWidth) * overlapLimit
  }))
  const fitFactor = (limit, scaleFor) => {
    if (fits(entry => scaleFor(entry, limit))) return limit
    let low = 0, high = limit
    for (let step = 0; step < 24; step++) {
      const mid = (low + high) / 2
      if (fits(entry => scaleFor(entry, mid))) low = mid
      else high = mid
    }
    return low
  }
  const floorFactor = fitFactor(Math.min(1, ...slots.map(entry => entry.cap / entry.minimum)), (entry, factor) => entry.minimum * factor)
  const factor = fitFactor(Math.min(1, ...slots.map(entry => entry.cap / entry.desired)),
    (entry, value) => Math.max(entry.desired * value, entry.minimum * floorFactor))
  for (const entry of slots) {
    const scale = Math.max(entry.desired * factor, entry.minimum * floorFactor)
    result.set(entry.key, { scale, center: entry.center, width: scale * entry.footprint.width,
      height: scale * entry.footprint.height, depth: scale * (entry.footprint.depth ?? 1), z: 0 })
  }
  // Camera looks toward -Z. Allies always occupy the foreground, even when an
  // enemy is smaller. Within each team, reserve whole-body depth behind smaller
  // overlapping actors; equal sizes use stable slot order.
  const frontToBack = [...slots].sort((a, b) => Number(a.side === 'enemy') - Number(b.side === 'enemy') || a.desiredHeight - b.desiredHeight
    || a.center - b.center || String(a.key).localeCompare(String(b.key)))
  frontToBack.forEach((entry, index) => {
    const placement = result.get(entry.key)
    placement.layer = slots.length - index + 2
    for (const foreground of frontToBack.slice(0, index)) {
      const front = result.get(foreground.key)
      if (entry.side !== foreground.side || Math.abs(placement.center - front.center) < (placement.width + front.width) / 2) {
        placement.z = Math.min(placement.z, front.z - (front.depth + placement.depth) / 2 - depthGap)
      }
    }
  })
  return result
}
