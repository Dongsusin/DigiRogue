import { FINAL_BOSS_PROFILES } from '../data/finalBossProfiles.js'

const profiles = new Map(FINAL_BOSS_PROFILES.map(profile => [profile.id, profile]))
const living = unit => unit && !unit.isEgg && unit.currentHp > 0
export function getFinalBossMove(unit) {
  const plan = unit?.bossEncounter
  const profile = unit?.isBoss && plan?.kind === 'final' && plan.leader !== false ? profiles.get(plan.id) : null
  if (!profile) return null
  const cycle = profile.cycles[Math.min(plan.phase ?? 0, profile.cycles.length - 1)]
  return cycle[Math.max(0, plan.actions ?? 0) % cycle.length]
}

export function getFinalBossSkillData(skillName, unit) {
  const move = getFinalBossMove(unit)
  return move?.skill.기술명 === skillName ? move.skill : null
}

export function getFinalBossTarget(unit, opponents = []) {
  const mode = getFinalBossMove(unit)?.target
  if (!mode) return null
  const targets = opponents.filter(living)
  return [...targets].sort(mode === 'weakest'
    ? (a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp
    : (a, b) => Math.max(b.attack, b.specialAttack) - Math.max(a.attack, a.specialAttack))[0]?.id ?? null
}

export function resolveFinalBossBeforeAction(enemies, actorId, refreshStats) {
  const unit = enemies.find(enemy => enemy.id === actorId)
  const profile = living(unit) && unit.bossEncounter?.leader !== false ? profiles.get(unit.bossEncounter?.id) : null
  const plan = unit?.bossEncounter
  const child = profile?.brood && (plan.actions ?? 0) >= 3 && !plan.broodUsed
    ? enemies.find(enemy => plan.companionIds.includes(enemy.id)) : null
  if (!child || living(child)) return { nextEnemies: enemies, changes: [], battleLogs: [] }
  const revived = refreshStats({ ...child, currentHp: Math.max(1, Math.floor(child.maxHp * .35)), statusEffect: null,
    battleGuards: {}, statModifiers: {}, skillCooldowns: {}, bossEncounter: child.bossEncounter })
  const nextUnit = { ...unit, bossEncounter: { ...plan, broodUsed: true } }
  const battleLogs = ['아마게몬의 데이터에서 쿠라몬이 한 번 더 증식했다!']
  return { nextEnemies: enemies.map(enemy => enemy.id === actorId ? nextUnit : enemy.id === child.id ? revived : enemy),
    changes: [{ targetId: child.id, targetSide: 'enemy', kind: 'reinforce', label: '쿠라몬 재증식',
      actionActorId: actorId, consumesAction: true, nextCombatant: revived, logs: battleLogs }], battleLogs }
}

// One source of truth for finite drain/reinforcement and the next-action warning.
// Called only after an action actually executed. No timers, no reserve-party effects.
export function resolveFinalBossAfterAction(enemies, context) {
  const changes = [], battleLogs = []
  const nextEnemies = enemies
  if (context.actorSide !== 'enemy' || context.didAct === false) return { nextEnemies, changes, battleLogs }
  let unit = enemies.find(enemy => enemy.id === context.actorId)
  const profile = living(unit) && unit.bossEncounter?.leader !== false ? profiles.get(unit.bossEncounter?.id) : null
  if (!profile) return { nextEnemies, changes, battleLogs }
  const plan = unit.bossEncounter
  const cycle = profile.cycles[Math.min(context.phaseBefore ?? plan.phase ?? 0, profile.cycles.length - 1)]
  const previousMove = cycle[(context.actionsBefore ?? Math.max(0, (plan.actions ?? 1) - 1)) % cycle.length]
  const emit = (target, kind, label, logs) => {
    changes.push({ targetId: target.id, targetSide: 'enemy', kind, label, nextCombatant: target, logs })
    battleLogs.push(...logs)
  }
  const hits = (context.hitEffects ?? []).filter(hit => hit.attackerId === unit.id && hit.targetSide === 'ally' && hit.damage > 0 && hit.kind !== 'status')
  if (profile.drainSkill && hits.some(hit => hit.skillName === profile.drainSkill) && (plan.drainUses ?? 0) < 2 && unit.currentHp < unit.maxHp) {
    const stolen = Math.min(Math.floor(unit.maxHp * .05), Math.floor(hits.reduce((sum, hit) => sum + hit.damage, 0) * .25))
    const healed = Math.max(0, Math.min(stolen, unit.maxHp - unit.currentHp))
    if (healed > 0) {
      unit = { ...unit, currentHp: unit.currentHp + healed, bossEncounter: { ...unit.bossEncounter, drainUses: (plan.drainUses ?? 0) + 1 } }
      emit(unit, 'power', '소울 앱소브션', [`${unit.name}이(가) 흡수한 데이터로 HP ${healed} 회복!`])
    }
  }
  // A form change can replace the cycle during the same action; its old warning is obsolete.
  if (!context.isPatternAction && previousMove.tell && (context.phaseBefore == null || context.phaseBefore === plan.phase))
    emit(unit, 'power', previousMove.skill.기술명, [previousMove.tell])
  return { nextEnemies: nextEnemies.map(enemy => enemy.id === unit.id ? unit : enemy), changes, battleLogs }
}
