// HP sections are encounter state, independent of an early evolution or healing.
export const BOSS_PHASE_VERSION = 2
export const getBossSegmentCount = (stage, kind) => kind === 'final' || stage >= 100 ? 4 : 2
export const bossSegmentMarkers = count => Array.from({ length: count - 1 }, (_, i) => (count - i - 1) / count)

export function withBossSegments(plan, { line = [], segmented = true } = {}) {
  if (!segmented) return { ...plan, version: BOSS_PHASE_VERSION, segmentCount: 1, phases: [] }
  const segmentCount = getBossSegmentCount(plan.stage, plan.kind)
  const markers = bossSegmentMarkers(segmentCount)
  const original = plan.phases ?? []
  const remainingForms = line.slice(Math.max(0, line.indexOf(plan.initialName)) + 1)
  const phases = markers.map((atHp, index) => {
    // Final bosses keep their two authored changes at the first/last section.
    const sourceIndex = original.length === 2 && markers.length === 3 ? (index === 1 ? -1 : index === 0 ? 0 : 1) : index
    const source = original[sourceIndex]
    const form = source?.form ?? (!original.some(p => p.fusion) && plan.kind !== 'final' ? remainingForms[index] : null) ?? null
    return { ...source, id: `phase-${index + 1}`, atHp, form,
      label: source?.label ?? (form ? '진화' : index === markers.length - 1 ? '최후의 해방' : '필살기 해방'),
      effect: source?.effect ?? (form ? { clearStatus: true } : index === markers.length - 1
        ? { stats: { attack: 1.12, specialAttack: 1.12 }, turns: 2 } : {}),
      signature: true }
  })
  return { ...plan, version: BOSS_PHASE_VERSION, segmentCount, phases }
}

export function hydrateBossSegments(unit, { resetDamageWindow = false } = {}) {
  if (!unit || (!unit.isBoss && !unit.rivalEncounter)) return unit
  let next = unit
  if (!unit.bossEncounter && unit.isBoss) {
    const plan = withBossSegments({ id: 'legacy:' + unit.name, kind: 'wild', stage: unit.bossStage ?? unit.enemyStage,
      title: '야생 우두머리', name: unit.name, initialName: unit.name, leader: true, companionIds: [],
      phase: 0, phases: [], rules: [], usedRules: [], actions: 0, hitStreak: 0, lastCategory: null })
    const markers = bossSegmentMarkers(plan.segmentCount)
    next = { ...unit, bossEncounter: plan, bossHpSegmentCount: plan.segmentCount,
      bossHpMarkers: markers, bossHpBreakpoints: markers }
  }
  if (unit.bossEncounter && unit.bossEncounter.version !== BOSS_PHASE_VERSION) {
    const old = unit.bossEncounter
    const count = old.leader === false && !unit.isBoss ? 1 : getBossSegmentCount(old.stage ?? unit.bossStage ?? unit.enemyStage, old.kind)
    const markers = bossSegmentMarkers(count)
    const ratio = unit.currentHp / Math.max(1, unit.maxHp)
    const pending = old.phases?.slice(old.phase ?? 0) ?? []
    const phase = unit.currentHp <= 0 ? markers.length : Math.min(pending.length ? Math.max(0, markers.length - 1) : markers.length,
      markers.filter(marker => marker > ratio + 1e-6).length)
    const phases = markers.map((atHp, index) => ({ ...(pending[index - phase] ?? {}), id: `phase-${index + 1}`, atHp,
      form: pending[index - phase]?.form ?? null, label: pending[index - phase]?.label ?? '필살기 해방',
      effect: pending[index - phase]?.effect ?? {}, signature: true }))
    next = { ...unit, bossEncounter: { ...old, version: BOSS_PHASE_VERSION, segmentCount: count, phases, phase },
      bossHpMarkers: markers, bossHpSegmentCount: count, bossHpBreakpoints: markers.slice(phase) }
  }
  if (resetDamageWindow) {
    const { bossHpGateLocked: _lock, bossHpDamageThisAction: _damage, ...clean } = next
    void _lock; void _damage
    next = clean
  }
  return next
}

// One action includes every hit and its damage-over-time effects. A section
// cannot be crossed twice before the boss has reacted; the last section also
// respects the 50%/25% budget if a recovery raised HP above it.
export function resolveSegmentedBossDamage(combatant, rawNextHp) {
  const count = combatant.bossHpSegmentCount >= 4 ? 4 : 2
  const spent = combatant.bossHpDamageThisAction ?? 0
  const remaining = Math.max(0, Math.ceil(combatant.maxHp / count) - spent)
  let nextHp = Math.max(rawNextHp, combatant.currentHp - remaining)
  const markers = (combatant.bossHpBreakpoints ?? []).filter(n => Number.isFinite(n) && n > 0 && n < 1).sort((a, b) => b - a)
  const locked = combatant.bossHpGateLocked
  const phase = combatant.bossEncounter?.phases?.[combatant.bossEncounter.phase]
  const gate = markers.find(marker => nextHp <= Math.max(1, Math.floor(combatant.maxHp * marker)) &&
    (combatant.currentHp > Math.floor(combatant.maxHp * marker) || phase?.atHp === marker))
  if (locked != null) nextHp = Math.max(nextHp, Math.min(combatant.currentHp, Math.max(1, Math.floor(combatant.maxHp * locked))))
  else if (gate != null) nextHp = Math.max(nextHp, Math.min(combatant.currentHp, Math.max(1, Math.floor(combatant.maxHp * gate))))
  const damage = Math.max(0, combatant.currentHp - nextHp)
  return { nextHp, nextCombatant: { ...combatant,
    bossHpDamageThisAction: spent + damage,
    ...(gate != null && locked == null ? { bossHpGateLocked: gate, bossHpBreakpoints: markers.filter(m => m < gate) } : {}) },
    battleLogs: [] }
}

export function finishBossDamageWindow(unit) {
  if (!unit || (unit.bossHpGateLocked == null && unit.bossHpDamageThisAction == null)) return unit
  const { bossHpGateLocked: _lock, bossHpDamageThisAction: _damage, ...next } = unit
  void _lock; void _damage
  return next
}
