// Stat changes last for the current ten-stage region. Status ailments, guards,
// cooldowns and permanent training use their own clocks.
export const REGION_STAT_KEYS = Object.freeze(['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'])
export const REGION_EFFECT_TEXT = '맵 변경까지'
export const isStatModifierActive = modifier => Boolean(modifier && Number.isFinite(modifier.multiplier) && modifier.multiplier > 0 &&
  (modifier.duration === 'region' || modifier.turns > 0))

export function normalizeRegionStatModifiers(modifiers) {
  return Object.fromEntries(REGION_STAT_KEYS.map(key => {
    const modifier = modifiers?.[key]
    // Migrate active turn-based saves without reviving expired effects.
    return [key, isStatModifierActive(modifier) && modifier.multiplier !== 1
      ? { multiplier: Math.max(.5, Math.min(1.5, modifier.multiplier)), duration: 'region' } : null]
  }))
}

export function mergeRegionStatModifier(current, multiplier) {
  const value = Math.max(.5, Math.min(1.5, Number(multiplier) || 1))
  const old = isStatModifierActive(current) ? current.multiplier : 1
  const sameDirection = (old - 1) * (value - 1) > 0
  return { multiplier: sameDirection ? (value > 1 ? Math.max(old, value) : Math.min(old, value)) : value, duration: 'region' }
}

export function prepareCombatantForStage(unit, { mapChanged = false } = {}, refreshStats) {
  if (!unit || unit.isEgg) return unit
  const next = refreshStats({ ...unit, skillCooldowns: {}, battleGuards: {}, passiveState: {} }, {
    statModifiers: mapChanged ? {} : normalizeRegionStatModifiers(unit.statModifiers),
    activeBuffs: mapChanged ? {} : unit.activeBuffs,
    ...(mapChanged ? { statusEffect: null } : {}),
  })
  // A map change is also the existing full party rest, including fainted reserves.
  return mapChanged ? { ...next, currentHp: next.maxHp } : next
}
