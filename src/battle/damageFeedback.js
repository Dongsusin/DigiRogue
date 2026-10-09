// The hit event carries the resolved matchup; never infer it from the HP delta.
export const DAMAGE_TEXT_MS = 1120

const tiers = {
  blocked: { color: 0x9daec1, scale: 0.8, pop: 1.08, title: '무효' },
  resisted: { color: 0x8faecb, scale: 0.84, pop: 1.12, title: '강한 저항' },
  reduced: { color: 0x80d4e8, scale: 0.92, pop: 1.18, title: '저항' },
  neutral: { color: 0xffffff, scale: 1, pop: 1.26, title: '상성' },
  effective: { color: 0xffbc55, scale: 1.12, pop: 1.32, title: '약점' },
  weakness: { color: 0xff735d, scale: 1.24, pop: 1.38, title: '약점 강타' },
}

export function getDamageFeedback(event = {}, neutralColor = 0xffffff) {
  if (event.isMiss) return { kind: 'miss', text: 'MISS', label: '빗나감', color: 0xdff6ff,
    scale: 0.88, pop: 1.12, isCritical: false, criticalLabel: '', multiplier: null }
  const multiplier = Number.isFinite(event.matchupMultiplier) && event.matchupMultiplier >= 0 ? event.matchupMultiplier : 1
  const kind = multiplier === 0 ? 'blocked' : multiplier <= 0.5 ? 'resisted' : multiplier < 1 ? 'reduced'
    : multiplier >= 2 ? 'weakness' : multiplier > 1 ? 'effective' : 'neutral'
  const tier = tiers[kind]
  const damage = Number.isFinite(event.damage) ? Math.max(0, Math.round(event.damage)) : 0
  const isCritical = Boolean(event.isCritical && damage > 0 && multiplier > 0)
  return { ...tier, kind, multiplier, isCritical, text: damage.toLocaleString('en-US'),
    color: kind === 'neutral' ? neutralColor : tier.color,
    label: `${tier.title} ×${Number(multiplier.toFixed(2))}`,
    criticalLabel: isCritical ? '치명타!' : '',
    scale: tier.scale * (isCritical ? 1.08 : 1), pop: tier.pop + (isCritical ? 0.06 : 0) }
}

export function damageTextFrame(progress, feedback) {
  const p = Math.max(0, Math.min(1, progress))
  const ease = value => 1 - (1 - value) ** 3
  return {
    scale: p < 0.14 ? ease(p / 0.14) * feedback.pop : feedback.pop - Math.min(1, (p - 0.14) / 0.18) * (feedback.pop - 1),
    rise: ease(p) * 0.65,
    opacity: p < 0.72 ? 1 : Math.max(0, (1 - p) / 0.28),
  }
}

// Reserve the full pop + upward travel, including badges. Nearby hits use separate rows.
export function placeDamageText({ x, y, width, height, bounds }, occupied = []) {
  const padding = 0.14
  const fit = Math.min(1, (bounds.right - bounds.left - padding * 2) / width,
    (bounds.top - bounds.bottom - padding * 2) / height)
  width *= fit; height *= fit
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value))
  const centerX = clamp(x, bounds.left + width / 2 + padding, bounds.right - width / 2 - padding)
  const centerY = clamp(y, bounds.bottom + height / 2 + padding, bounds.top - height / 2 - padding)
  const candidates = [0, 1, -1, 2, -2, 3, -3].map(row => ({
    x: centerX, y: clamp(centerY + row * (height + padding), bounds.bottom + height / 2 + padding, bounds.top - height / 2 - padding),
    width, height, fit,
  }))
  const overlap = box => occupied.reduce((total, other) => total +
    Math.max(0, (box.width + other.width) / 2 + padding - Math.abs(box.x - other.x)) *
    Math.max(0, (box.height + other.height) / 2 + padding - Math.abs(box.y - other.y)), 0)
  return candidates.reduce((best, next) => overlap(next) < overlap(best) ? next : best)
}
