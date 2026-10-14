// Preserve the resolver's floor and multiplication order, including the damage roll.
export function calculateAttackDamage({ level, power, attack, defense, multiplier = 1, randomFactor = 1, factors = [] }) {
  const scaled = (((2 * Math.max(1, level)) / 5 + 2) * power * Math.max(1, attack)) / Math.max(1, defense)
  const base = Math.floor(scaled / 50) + 2
  return Math.max(1, Math.floor(factors.reduce((damage, factor) => damage * factor, base * multiplier * randomFactor)))
}
