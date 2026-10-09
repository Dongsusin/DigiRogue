import { isStatModifierActive } from './regionModifiers.js'
import { getDigimonPassive, getDigimonPassiveId, getDigimonFamilies } from '../data/digimonPassives.js'

const number = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0
export const createPassiveState = () => ({ actions: 0, hits: 0, barrierUsed: false, wardUsed: false, endureUsed: false, drainDamage: 0, defeats: 0 })
export function normalizePassiveState(state = {}) {
  return { actions: Math.min(1000, number(state?.actions)), hits: Math.min(1000, number(state?.hits)),
    barrierUsed: state?.barrierUsed === true, wardUsed: state?.wardUsed === true, endureUsed: state?.endureUsed === true,
    drainDamage: Math.min(1000000, number(state?.drainDamage)), defeats: Math.min(10, number(state?.defeats)) }
}
export const passiveLog = (unit, detail) => `${unit.name}의 특성 [${getDigimonPassive(unit)?.name}]! ${detail}`
export function hydrateDigimonPassive(unit, { reset = false } = {}) {
  if (!unit || unit.isEgg) return unit
  return { ...unit, passiveId: getDigimonPassiveId(unit), passiveState: reset ? createPassiveState() : normalizePassiveState(unit.passiveState) }
}
export function mergePassiveStates(units) {
  const states = units.map(unit => normalizePassiveState(unit?.passiveState))
  return { ...createPassiveState(), actions: Math.max(0, ...states.map(state => state.actions)),
    hits: Math.max(0, ...states.map(state => state.hits)), barrierUsed: states.some(state => state.barrierUsed),
    wardUsed: states.some(state => state.wardUsed), endureUsed: states.some(state => state.endureUsed) }
}
export function describePassiveState(unit) {
  const passive = getDigimonPassive(unit), state = normalizePassiveState(unit?.passiveState)
  if (!passive) return ''
  if (passive.regeneration && unit.bossEncounter?.regenerationStopped) return '앙코르 피날레 · 재생 중단'
  if (passive.firstHitMultiplier) return state.barrierUsed ? '이번 전투 사용 완료' : '첫 피격 대기'
  if (passive.firstStatusWard) return state.wardUsed ? '이번 전투 사용 완료' : '보호막 대기'
  if (passive.endure) return state.endureUsed ? '이번 전투 사용 완료' : '버팀 대기'
  if (passive.openingMultiplier) return state.actions ? '이번 전투 사용 완료' : '첫 행동 대기'
  if (passive.actionCharge || passive.hitCharge) return `피해 +${Math.round(Math.min(passive.chargeCap, state.actions * (passive.actionCharge ?? 0) + state.hits * (passive.hitCharge ?? 0)) * 100)}%`
  return '항상 적용'
}
export function describePassiveEffect(unit) {
  const passive = getDigimonPassive(unit)
  return passive?.regeneration && unit.bossEncounter?.regenerationStopped
    ? '보스가 모든 힘을 공격에 집중하면서 재생 회복이 중단됐습니다.' : passive?.description ?? ''
}
export function getPassiveAccuracy(attacker, defender) {
  return (getDigimonPassive(attacker)?.accuracyBonus ?? 0) - (getDigimonPassive(defender)?.evasionBonus ?? 0)
}
export function getPassiveCriticalChance(attacker, baseChance) {
  return Math.min(1, baseChance + (getDigimonPassive(attacker)?.criticalChanceBonus ?? 0))
}
export function getPassiveStatusChance(actor, chance) {
  return Math.min(100, Math.max(0, chance + (getDigimonPassive(actor)?.statusChanceBonus ?? 0)))
}
export function getPassiveStatusDamageMultiplier(unit) { return getDigimonPassive(unit)?.statusDamageMultiplier ?? 1 }
export function getPassiveHealing(actor, target) {
  const outgoing = getDigimonPassive(actor)?.outgoingHealing ?? 1, incoming = getDigimonPassive(target)?.incomingHealing ?? 1
  return { multiplier: outgoing * incoming, battleLogs: [
    ...(outgoing > 1 ? [passiveLog(actor, '회복 기술의 효과가 증가했다!')] : []),
    ...(incoming > 1 ? [passiveLog(target, '받는 회복량이 증가했다!')] : []),
  ] }
}
export function resolvePassiveStatusGuard(unit, status) {
  const passive = getDigimonPassive(unit), state = normalizePassiveState(unit?.passiveState)
  if (passive?.statusImmunities?.includes(status)) return { blocked: true, nextCombatant: unit, battleLogs: [passiveLog(unit, `${status} 상태이상을 막았다!`)] }
  if (passive?.firstStatusWard && !state.wardUsed) return { blocked: true,
    nextCombatant: { ...unit, passiveState: { ...state, wardUsed: true } }, battleLogs: [passiveLog(unit, `${status} 상태이상을 막았다!`)] }
  return { blocked: false, nextCombatant: unit, battleLogs: [] }
}
export function resolvePassiveStatGuard(actor, target) {
  return actor.id !== target.id && getDigimonPassive(target)?.blockStatDrops
    ? [passiveLog(target, '능력치 하락을 막았다!')] : []
}
export function getPassiveAttackModifiers({ attacker, defender, skillData, matchup, isCritical, criticalMultiplier }) {
  const offensive = getDigimonPassive(attacker), defensive = getDigimonPassive(defender)
  const attackState = normalizePassiveState(attacker.passiveState), defenseState = normalizePassiveState(defender.passiveState)
  let attackMultiplier = 1, defenseMultiplier = 1, nextCritical = criticalMultiplier
  const battleLogs = []
  const boost = multiplier => { attackMultiplier *= multiplier }
  if (offensive) {
    if ((offensive.attackAttribute === skillData.속성 || offensive.attackAttributes?.includes(skillData.속성) || offensive.attackCategory === skillData.분류) && offensive.attackMultiplier) boost(offensive.attackMultiplier)
    if (offensive.fasterMultiplier && attacker.speed > defender.speed) boost(offensive.fasterMultiplier)
    if (offensive.lowHpMultiplier && attacker.currentHp / Math.max(1, attacker.maxHp) <= offensive.lowHpThreshold) boost(offensive.lowHpMultiplier)
    if (offensive.targetHpMultiplier && defender.currentHp / Math.max(1, defender.maxHp) <= offensive.targetHpThreshold) boost(offensive.targetHpMultiplier)
    if (offensive.giantMultiplier && defender.maxHp >= attacker.maxHp * 1.5) boost(offensive.giantMultiplier)
    if (offensive.openingMultiplier && !attackState.actions) boost(offensive.openingMultiplier)
    if (offensive.actionCharge || offensive.hitCharge) boost(1 + Math.min(offensive.chargeCap,
      attackState.actions * (offensive.actionCharge ?? 0) + attackState.hits * (offensive.hitCharge ?? 0)))
    if (offensive.familyMultiplier && getDigimonFamilies(defender).includes(offensive.targetFamily)) boost(offensive.familyMultiplier)
    if (offensive.typeMultiplier && defender.type === offensive.targetType) boost(offensive.typeMultiplier)
    if (offensive.afflictedMultiplier && (defender.statusEffect || Object.values(defender.statModifiers ?? {}).some(modifier => isStatModifierActive(modifier) && modifier.multiplier < 1))) boost(offensive.afflictedMultiplier)
    if (offensive.signatureMultiplier && attacker.speciesData?.기술?.includes(skillData.기술명)) boost(offensive.signatureMultiplier)
    if (attackMultiplier > 1) battleLogs.push(passiveLog(attacker, `공격 피해가 ${Math.round((attackMultiplier - 1) * 100)}% 증가했다!`))
    if (isCritical && offensive.criticalChanceBonus) battleLogs.push(passiveLog(attacker, '급소를 포착했다!'))
  }
  if (defensive) {
    if (defensive.defenseCategory === skillData.분류) defenseMultiplier *= defensive.defenseMultiplier
    if (defensive.firstHitMultiplier && !defenseState.barrierUsed) defenseMultiplier *= defensive.firstHitMultiplier
    if (defensive.weaknessReduction && matchup > 1) defenseMultiplier *= (1 + (matchup - 1) * (1 - defensive.weaknessReduction)) / matchup
    if (isCritical && defensive.blockCriticalBonus) { nextCritical = 1; battleLogs.push(passiveLog(defender, '치명타의 추가 피해를 막았다!')) }
    if (defenseMultiplier < 1) battleLogs.push(passiveLog(defender, `받는 피해가 ${Math.round((1 - defenseMultiplier) * 100)}% 감소했다!`))
  }
  return { multiplier: attackMultiplier * defenseMultiplier, criticalMultiplier: nextCritical, battleLogs }
}
// Called only for actual attack damage; misses, status damage and immune attacks cannot consume the shield.
export function recordPassiveHit(unit, damage) {
  if (!unit || damage <= 0) return unit
  const state = normalizePassiveState(unit.passiveState)
  return { ...unit, passiveState: { ...state, hits: state.hits + 1,
    barrierUsed: state.barrierUsed || Boolean(getDigimonPassive(unit)?.firstHitMultiplier) } }
}
export function recordPassiveAttack(actor, targetBefore, targetAfter, damage) {
  const state = normalizePassiveState(actor.passiveState), passive = getDigimonPassive(actor)
  return { ...actor, passiveState: { ...state,
    drainDamage: state.drainDamage + (passive?.drainRatio ? damage : 0),
    defeats: state.defeats + (passive?.defeatHealing && targetBefore.currentHp > 0 && targetAfter.currentHp <= 0 ? 1 : 0) } }
}
export function resolvePassiveEndure(unit, nextHp) {
  const state = normalizePassiveState(unit.passiveState)
  if (getDigimonPassive(unit)?.endure && !state.endureUsed && unit.currentHp > 1 && nextHp <= 0) {
    return { nextCombatant: { ...unit, currentHp: 1, passiveState: { ...state, endureUsed: true } }, nextHp: 1,
      battleLogs: [passiveLog(unit, 'HP 1로 버텼다!')] }
  }
  return { nextCombatant: { ...unit, currentHp: nextHp }, nextHp, battleLogs: [] }
}
export function resolvePassiveActionEnd(unit) {
  if (!unit || unit.isEgg) return { nextCombatant: unit, battleLogs: [] }
  const state = normalizePassiveState(unit.passiveState), passive = getDigimonPassive(unit)
  if (unit.currentHp <= 0) return { nextCombatant: { ...unit,
    passiveState: { ...state, drainDamage: 0, defeats: 0 } }, battleLogs: [] }
  let heal = 0
  if (passive?.regeneration && !unit.bossEncounter?.regenerationStopped) heal = Math.max(1, Math.floor(unit.maxHp * passive.regeneration))
  if (passive?.drainRatio && state.drainDamage > 0) heal = Math.min(Math.max(1, Math.floor(unit.maxHp * passive.drainCap)), Math.max(1, Math.floor(state.drainDamage * passive.drainRatio)))
  if (passive?.defeatHealing && state.defeats > 0) heal = Math.max(1, Math.floor(unit.maxHp * Math.min(passive.defeatHealingCap, state.defeats * passive.defeatHealing)))
  const appliedHeal = Math.max(0, Math.min(unit.maxHp - unit.currentHp, heal))
  const nextCombatant = { ...unit, currentHp: unit.currentHp + appliedHeal,
    passiveState: { ...state, actions: state.actions + 1, drainDamage: 0, defeats: 0 } }
  const battleLogs = []
  if (appliedHeal > 0) battleLogs.push(passiveLog(unit, `${unit.name}의 HP가 ${appliedHeal} 회복됐다!`))
  if (passive?.actionCharge && state.actions * passive.actionCharge < passive.chargeCap) battleLogs.push(passiveLog(unit,
    `전투 데이터를 축적했다! 주는 피해 +${Math.round(Math.min(passive.chargeCap, nextCombatant.passiveState.actions * passive.actionCharge) * 100)}%.`))
  return { nextCombatant, battleLogs }
}
