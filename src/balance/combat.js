import { isStatModifierActive } from '../battle/regionModifiers.js'
import { getItemVictoryRecoveryBonus } from '../data/adventureItems.js'
import { getDigimonPassive } from '../data/digimonPassives.js'
import { getPassiveAttackModifiers, getPassiveHealing, getPassiveAccuracy } from '../battle/passives.js'

export const CRITICAL_HIT_CHANCE = 0.05
export const CRITICAL_HIT_MULTIPLIER = 1.5

export function getSkillCooldown(unit, skill) {
  if (!unit || !skill) return 0
  return Math.max(0, Math.floor(Number(unit.skillCooldowns?.[skill.기술명]) || 0),
    skill.cooldownGroup ? Math.floor(Number(unit.skillCooldowns?.[`@${skill.cooldownGroup}`]) || 0) : 0)
}

export function startSkillCooldown(unit, skill) {
  if (!(skill?.cooldown > 0)) return unit
  const skillCooldowns = { ...unit.skillCooldowns, [skill.기술명]: skill.cooldown + 1 }
  if (skill.cooldownGroup) skillCooldowns[`@${skill.cooldownGroup}`] = skill.cooldown + 1
  return { ...unit, skillCooldowns }
}

export function tickBattleTimers(unit) {
  const tick = state => Object.fromEntries(Object.entries(state ?? {})
    .filter(([, turns]) => Number.isFinite(turns) && turns > 1)
    .map(([key, turns]) => [key, Math.min(9, Math.floor(turns)) - 1]))
  return { ...unit, skillCooldowns: tick(unit.skillCooldowns), battleGuards: tick(unit.battleGuards) }
}

export function getCommandSkillNames(unit, getSkill) {
  if (!unit) return []
  const names = unit?.skills ?? []
  const hasAttack = names.some(name => {
    const skill = getSkill(name)
    return skill && !skill.효과 && skill.분류 !== '보조형' && getSkillCooldown(unit, skill) === 0
  })
  return hasAttack ? names : [...names, unit?.specialAttack > unit?.attack ? '기본 파동' : '기본 타격']
}

export const getStatusDuration = type => ['착란', '행동불능', '혼수상태'].includes(type) ? 1 : 3

// Scores use visible HP, effects, and matchups. No look-ahead into the player's queued command.
export function scoreSkill(actor, skill, allies, opponents, matchup) {
  if (!skill || getSkillCooldown(actor, skill) > 0) return 0
  const living = list => list.filter(unit => unit && !unit.isEgg && unit.currentHp > 0)
  const effect = skill.효과
  if (effect) {
    const targets = effect.scope === 'self' ? [actor] : living(effect.targetSide === 'enemy' ? opponents : allies)
    if (effect.kind === 'revive') return allies.some(unit => unit && !unit.isEgg && unit.currentHp <= 0) ? 110 : 0
    if (effect.kind === 'heal') return Math.max(0, ...targets.map(unit => {
      const missing = 1 - unit.currentHp / unit.maxHp
      return missing < 0.25 ? 0 : Math.min(missing, effect.healRatio * getPassiveHealing(actor, unit).multiplier) * 180 + (missing > 0.65 ? 45 : 0)
    }))
    if (effect.kind === 'clear-status') return targets.some(unit => unit.statusEffect) ? 80 : 0
    if (effect.kind === 'clear-stat-drops' || effect.kind === 'clear-stat-boosts') return targets.some(unit =>
      Object.values(unit.statModifiers ?? {}).some(mod => isStatModifierActive(mod) && (effect.kind === 'clear-stat-drops' ? mod.multiplier < 1 : mod.multiplier > 1))) ? 70 : 0
    if (effect.kind === 'stat-modifier') {
      const useful = targets.some(unit => {
        const current = unit.statModifiers?.[effect.statKey]
        if (effect.multiplier < 1 && (getDigimonPassive(unit)?.blockStatDrops || unit.battleGuards?.stats)) return false
        const old = isStatModifierActive(current) ? current.multiplier : 1
        return effect.multiplier > 1 ? old < effect.multiplier : old > effect.multiplier
      })
      if (!useful) return 0
      // Spending an action setting up is useful only while there is a fight left.
      const healthyOpposition = living(opponents).some(unit => unit.currentHp > unit.maxHp * .5)
      return healthyOpposition ? 30 + Math.abs(effect.multiplier - 1) * 150 : 0
    }
    if (effect.kind === 'status') return targets.some(unit => !unit.statusEffect && !unit.battleGuards?.status &&
      !getDigimonPassive(unit)?.statusImmunities?.includes(effect.status) &&
      !(getDigimonPassive(unit)?.firstStatusWard && !unit.passiveState?.wardUsed)) ? 48 : 0
    if (effect.kind === 'guard') return targets.some(unit => !unit.battleGuards?.[effect.guard]) ? 42 : 0
    return 0
  }
  const targets = living(opponents)
  if (!targets.length) return 0
  const attack = skill.분류 === '특수형' ? actor.specialAttack : actor.attack
  const scores = targets.map(target => {
    const defense = skill.분류 === '특수형' ? target.specialDefense : target.defense
    const relation = matchup(actor, skill, target)
    const passive = getPassiveAttackModifiers({ attacker: actor, defender: target, skillData: skill,
      matchup: relation, isCritical: false, criticalMultiplier: 1 })
    const accuracy = Math.min(1, Math.max(0, (Number.parseInt(skill.명중률) + getPassiveAccuracy(actor, target)) / 100))
    const damage = ((((2 * Math.max(1, actor.level)) / 5 + 2) * skill.데미지 * attack / Math.max(1, defense)) / 50 + 2) *
      accuracy * relation * passive.multiplier
    return damage / Math.max(1, target.maxHp) * 160 + (damage >= target.currentHp ? 35 : 0)
  })
  return (skill.전체공격 ? scores.reduce((sum, value) => sum + value, 0) : Math.max(...scores))
}

export function recoverAfterVictory(party, boss = false, activeAllyIds, { equipmentOnly = false } = {}) {
  const ratio = boss ? 0.35 : 0.08
  const logs = []
  const visibleIds = activeAllyIds == null ? null : new Set(activeAllyIds)
  const nextParty = party.map(unit => {
    if (!unit || unit.isEgg || unit.currentHp <= 0) return unit
    const amount = equipmentOnly ? 0 : Math.min(unit.maxHp - unit.currentHp, Math.max(1, Math.floor(unit.maxHp * ratio)))
    if (amount > 0 && (!visibleIds || visibleIds.has(unit.id))) logs.push(`${unit.name}은(는) 전투 후 휴식으로 HP ${amount} 회복!`)
    const bonus = Math.max(0, Math.min(unit.maxHp - unit.currentHp - amount, Math.floor(unit.maxHp * getItemVictoryRecoveryBonus(unit))))
    if (bonus > 0 && (!visibleIds || visibleIds.has(unit.id))) logs.push(`${unit.name}의 D-아크! 전투 후 HP ${bonus} 추가 회복!`)
    return { ...unit, currentHp: unit.currentHp + amount + bonus }
  })
  return { nextParty, battleLogs: logs }
}
