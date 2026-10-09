// Presentation only: never roll random numbers or resolve an action to preview it.
export function getEnemyTargetIds(enemies, scope, selectedId, respectTaunt = false) {
  const living = (enemies ?? []).filter(unit => !unit.isEgg && unit.currentHp > 0)
  if (scope === 'all') return living.map(unit => unit.id)
  const taunter = respectTaunt && living.find(unit => unit.battleGuards?.taunt > 0)
  if (taunter) return [taunter.id]
  const selected = living.find(unit => unit.id === selectedId)
  return selected ? [selected.id] : selectedId == null && living.length === 1 ? [living[0].id] : []
}

// Follow only motions whose presentation cue has started, never future queued actions.
export function getBattleFocus({ motions = [], actingId, commandActive = false, previewTargetIds = [], scanningTargetIds = [], blocked = false }) {
  const none = { actorId: null, side: null, targetIds: [], phase: null }
  if (blocked) return none
  const motion = motions.at(-1)
  if (motion) return { actorId: motion.attackerId, side: motion.attackerSide ?? 'ally', phase: 'action',
    targetIds: [...new Set((motion.targets ?? [motion]).map(target => target.targetId).filter(id => id != null))] }
  if (scanningTargetIds.length) return { actorId: actingId, side: 'ally', targetIds: scanningTargetIds, phase: 'scan' }
  return commandActive ? { actorId: actingId, side: 'ally', targetIds: previewTargetIds, phase: 'command' } : none
}

export function buildTurnPreview({ allies = [], enemies = [], actions = [], actedIds = [], hasteChance = () => 0, describeAction = () => '' }) {
  const rows = [['ally', allies], ['enemy', enemies]].flatMap(([side, units]) => units
    .filter(unit => !unit.isEgg && unit.currentHp > 0)
    .map(unit => {
      const action = side === 'ally' ? actions.find(item => item.actorId === unit.id && item.side === 'ally') : null
      return { id: unit.id, side, name: unit.name, imageName: unit.imageName ?? unit.name,
        automatic: unit.regionalSupport === true, speed: action?.speed ?? unit.speed ?? 0, priority: action?.priority ?? 0,
        haste: side === 'ally' ? hasteChance(unit) : 0, completed: side === 'ally' && actedIds.includes(unit.id) && !action,
        skill: action?.skillName ?? null, target: action ? describeAction(action) : '', }
    }))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || b.priority - a.priority || b.speed - a.speed)
  const hasRandomPriority = rows.some(row => !row.completed && row.haste > 0)
  return rows.map((row, index) => {
    if (row.completed) return { ...row, rank: null, uncertain: false, reason: '' }
    const tied = rows.some(other => !other.completed && other !== row && other.speed === row.speed && other.priority === row.priority)
    return { ...row, rank: index + 1, uncertain: hasRandomPriority || tied,
      reason: [tied && '같은 속도', hasRandomPriority && '확률형 선제 효과'].filter(Boolean).join(' · ') }
  })
}

// A scan/item may have already consumed an ally's turn before attacks are queued.
export function getPlannedAllyIds(activeIds, actedIds, pendingActions) {
  return [...new Set([...(actedIds ?? []), ...pendingActions.map(action => action.actorId)])].filter(id => activeIds.includes(id))
}
