const living = unit => unit && !unit.isEgg && unit.currentHp > 0
const positive = value => Number.isFinite(value) ? Math.max(1, value) : 1
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

// Keep the whole encounter locked, including a surviving minion after its leader falls.
export function isEscapeBlocked({ enemies = [] } = {}) {
  return enemies.some(unit => unit && (unit.isBoss || unit.bossEncounter || unit.rivalEncounter))
}

function strength(unit) {
  return positive(unit.level) * 2 + positive(unit.maxHp) * .25 +
    ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
      .reduce((sum, stat) => sum + positive(unit[stat]), 0)
}

export function getEscapeChance({ party = [], activeAllyIds, enemies = [], attemptCount = 1 } = {}) {
  if (isEscapeBlocked({ enemies })) return 0
  const activeIds = new Set(activeAllyIds ?? party.filter(living).slice(0, 1).map(unit => unit.id))
  const allies = party.filter(unit => living(unit) && activeIds.has(unit.id))
  const opponents = enemies.filter(living)
  if (!allies.length || !opponents.length) return 0

  const allyStrength = allies.reduce((sum, unit) => sum + strength(unit), 0) / allies.length
  const enemyStrength = Math.max(...opponents.map(strength))
  const allySpeed = Math.max(...allies.map(unit => positive(unit.speed)))
  const enemySpeed = Math.max(...opponents.map(unit => positive(unit.speed)))
  const speedFactor = clamp((allySpeed / enemySpeed) ** .25, .65, 1.2)
  const retries = clamp(Math.floor(positive(attemptCount)) - 1, 0, 3)
  // Equal forces start at 70%; retries help without making escape guaranteed.
  return clamp(.7 * (allyStrength / enemyStrength) ** .7 * speedFactor + retries * .05, .1, .9)
}

export function rollRunAttempt(options, random = Math.random) {
  const chance = getEscapeChance(options)
  return chance > 0 && random() < chance
}
