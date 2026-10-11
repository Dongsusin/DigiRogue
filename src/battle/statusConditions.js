import { getItemStatusDamageMultiplier } from '../data/adventureItems.js'
import { getPassiveStatusDamageMultiplier } from './passives.js'

export const getStatusDuration = type => ['착란', '행동불능', '혼수상태'].includes(type) ? 1 : 3

export const STATUS_EARLY_CURE_CHANCE = 30
export const STATUS_CONDITIONS = Object.freeze({
  독: { label: '독', key: 'poison', color: '#c18dff', icon: 'poison', endTurnDamageRatio: .06 },
  맹독: { label: '맹독', key: 'toxic', color: '#f088d3', icon: 'toxic', endTurnDamageRatio: .1 },
  화상: { label: '화상', key: 'burn', color: '#ff9c69', icon: 'burn', endTurnDamageRatio: .04 },
  혼란: { label: '혼란', key: 'confusion', color: '#ffd580', icon: 'confusion', actionSuccessRate: .75, curesOnHit: true },
  착란: { label: '착란', key: 'derangement', color: '#ffaecc', icon: 'confusion', actionSuccessRate: 0, curesOnHit: true },
  마비: { label: '마비', key: 'paralysis', color: '#ffe16d', icon: 'paralysis', actionSuccessRate: .75 },
  행동불능: { label: '행동불능', key: 'disabled', color: '#ff9c98', icon: 'disabled', actionSuccessRate: 0 },
  수면: { label: '수면', key: 'sleep', color: '#96d3ff', icon: 'sleep', actionSuccessRate: .75, curesOnHit: true },
  혼수상태: { label: '혼수상태', key: 'coma', color: '#aaaaff', icon: 'sleep', actionSuccessRate: 0, curesOnHit: true },
})
export const getStatusEffectDefinition = type => Object.hasOwn(STATUS_CONDITIONS, type) ? STATUS_CONDITIONS[type] : null

// Durations count this Digimon's actions, not rounds or the whole party's turns.
export function getStatusConditionInfo(unit, duration = 3) {
  const status = unit?.statusEffect, definition = getStatusEffectDefinition(status?.type)
  if (!definition || unit.isEgg || unit.currentHp <= 0) return null
  const elapsed = Number.isFinite(status.turns) ? Math.max(0, Math.floor(status.turns)) : 0
  const remaining = Math.max(0, Math.min(duration, getStatusDuration(status.type)) - elapsed)
  if (!remaining) return null
  const rules = []
  if (definition.actionSuccessRate != null) rules.push(definition.actionSuccessRate === 0
    ? '이번 행동을 할 수 없습니다.' : `행동할 때 ${Math.round((1 - definition.actionSuccessRate) * 100)}% 확률로 움직이지 못합니다.`)
  if (status.type === '화상') rules.push('물리 기술 위력 -15%.')
  if (definition.endTurnDamageRatio) {
    const ratio = definition.endTurnDamageRatio * (unit.isBoss ? .5 : 1)
    rules.push(`자신의 행동 종료 시 최대 HP의 ${Number((ratio * 100).toFixed(2))}% 피해를 받습니다.`)
    const itemMultiplier = getItemStatusDamageMultiplier(unit), passiveMultiplier = getPassiveStatusDamageMultiplier(unit)
    if (itemMultiplier < 1) rules.push('순수의 문장으로 이 피해가 절반이 됩니다.')
    if (passiveMultiplier < 1) rules.push(`특성으로 상태이상 피해가 ${Math.round((1 - passiveMultiplier) * 100)}% 감소합니다.`)
    if (Number.isFinite(unit.maxHp)) rules.push(`현재 기준 HP ${Math.max(1, Math.floor(unit.maxHp * ratio * itemMultiplier * passiveMultiplier))} 피해 (남은 HP 한도).`)
  }
  if (definition.curesOnHit) rules.push('피격 시 해제됩니다.')
  const recovery = `자신의 행동 종료 시 지속 시간이 줄어듭니다.${remaining > 1 ? ` ${STATUS_EARLY_CURE_CHANCE}% 확률로 일찍 풀릴 수 있습니다.` : ' 이번 행동이 끝나면 해제됩니다.'}`
  return { ...definition, type: status.type, remaining, duration: `최대 ${remaining}턴`, rules, recovery,
    detail: [...rules, recovery].join(' ') }
}

export const STATUS_IMPACT_MS = Object.freeze({ blocked: 680, damage: 600, applied: 520, cleared: 400 })

export function createStatusCue(type, phase, unit, side, extra = {}) {
  if (!getStatusEffectDefinition(type) || !Object.hasOwn(STATUS_IMPACT_MS, phase) || !unit || unit.isEgg) return null
  return { kind: 'status', statusType: type, phase, targetId: unit.id, targetSide: side, ...extra }
}

// Only real changes create a cue: no repeated effects when turns tick or React rerenders.
export function statusTransitionCues(before, after, side) {
  if (!after || after.isEgg || after.currentHp <= 0) return []
  const from = before?.statusEffect?.type, to = after.statusEffect?.type
  if (from === to) return []
  return [from && createStatusCue(from, 'cleared', after, side), to && createStatusCue(to, 'applied', after, side)].filter(Boolean)
}
