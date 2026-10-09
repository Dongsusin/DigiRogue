import { isStatModifierActive, REGION_EFFECT_TEXT } from './regionModifiers.js'
import { getStatusConditionInfo } from './statusConditions.js'
import { GUARD_DESCRIPTIONS } from '../balance/catalog.js'
import { ADVENTURE_BATTLE_ITEMS, hasAdventureItem } from '../data/adventureItems.js'
import { getDigimonPassive } from '../data/digimonPassives.js'
import { describePassiveState, describePassiveEffect } from './passives.js'
export const BATTLE_HISTORY_LIMIT = 400

export function describeMatchup(multiplier) {
  if (multiplier === 0) return { kind: 'immune', label: '무효', text: '무효 ×0' }
  if (multiplier < 1) return { kind: 'resist', label: '저항', text: `저항 ×${multiplier}` }
  if (multiplier > 1) return { kind: 'weak', label: '약점', text: `약점 ×${multiplier}` }
  return { kind: 'neutral', label: '보통', text: '보통 ×1' }
}

const statLabels = { hp: '체력', attack: '공격', defense: '방어', specialAttack: '특공', specialDefense: '특방', speed: '스피드' }
// Ailments and guards use turns; stat changes expire at the next region.
export function getCombatantEffects(combatant, statusDuration = 3) {
  if (!combatant || combatant.isEgg || combatant.currentHp <= 0) return []
  const effects = []
  const status = getStatusConditionInfo(combatant, statusDuration)
  if (status) effects.push({ id: 'status', kind: 'status', label: status.label,
    duration: status.duration, detail: status.detail })
  for (const [key, label] of Object.entries(statLabels)) {
    const modifier = combatant.statModifiers?.[key]
    if (isStatModifierActive(modifier) && modifier.multiplier !== 1) {
      const percent = Math.round((modifier.multiplier - 1) * 1000) / 10
      effects.push({ id: `skill-${key}`, kind: percent > 0 ? 'buff' : 'debuff',
        label: `${label} ${percent > 0 ? '+' : ''}${percent}%`, duration: REGION_EFFECT_TEXT,
        detail: '현재 지역에서 유지되며 맵이 바뀌면 초기화됩니다.' })
    }
    const stages = combatant.activeBuffs?.[key]
    if (stages > 0) effects.push({ id: `item-${key}`, kind: 'buff', label: `${label} +10%`,
      duration: REGION_EFFECT_TEXT, detail: '맵이 바뀌면 초기화됩니다. 같은 능력의 아이템 강화는 중첩되지 않습니다.' })
  }
  const guards = { taunt: '도발 · 피해 -25%', physical: '물리 방벽 -50%', special: '특수 방벽 -50%',
    status: '커스 배리어', stats: '스테이터스 배리어', endure: '세이프티 가드' }
  for (const [key, label] of Object.entries(guards)) {
    const turns = combatant.battleGuards?.[key] ?? 0
    if (turns > 0) effects.push({ id: `guard-${key}`, kind: 'buff', label, duration: `${turns}턴`, detail: GUARD_DESCRIPTIONS[key] })
  }
  for (const item of ADVENTURE_BATTLE_ITEMS) {
    if (hasAdventureItem(combatant, item.id)) effects.push({ id: item.id, kind: 'buff', label: item.name,
      duration: '장비', detail: item.description })
  }
  const passive = getDigimonPassive(combatant)
  if (passive) effects.push({ id: 'passive', kind: 'passive', label: passive.name, duration: '특성',
    detail: `${describePassiveEffect(combatant)} ${describePassiveState(combatant)}.` })
  return effects
}

// Called at presentation time, never with the resolver's unplayed future logs.
export function appendBattleHistory(history, logs, stage, limit = BATTLE_HISTORY_LIMIT) {
  const messages = logs.filter(log => typeof log === 'string' && log.trim())
  if (!messages.length) return history
  const nextId = (history.at(-1)?.id ?? 0) + 1
  return [...history, ...messages.map((text, index) => ({ id: nextId + index, stage, text }))].slice(-limit)
}
