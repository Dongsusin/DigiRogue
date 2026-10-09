import { createPassiveState } from '../battle/passives.js'
import { applyMapEnvironment } from '../battle/mapEnvironment.js'

// Optional story fights reuse the normal command, damage, scan and replacement rules.
// Preview and creation share a deterministic roster; reopening a save cannot reroll it.
export function getEventBattlePreview(state, battle) {
  const levels = (state.enemies ?? []).map(unit => unit.level).filter(Number.isFinite)
  const base = state.explorationEvent?.battle?.baseLevel ?? (levels.length ? Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length)
    : Math.max(1, Math.round((state.player?.level ?? 1) * .9))
  )
  const level = Math.max(1, Math.min(state.levelCap ?? 100, base + (battle.levelDelta ?? 0)))
  const allies = (state.party ?? []).filter(unit => !unit.isEgg && unit.currentHp > 0).length
  return { level, opponents: battle.opponents, formation: `${Math.min(allies, battle.opponents.length)}대${battle.opponents.length}`,
    rule: battle.rule, difficulty: battle.specialQuest ? '시련' : battle.levelDelta > 0 ? '도전' : '일반',
    waves: battle.waves?.map(wave => ({ opponents: wave.opponents, level: Math.min(state.levelCap ?? 100, base + wave.levelDelta) })) }
}

export function buildEventBattle(state, { createCombatant, allDigimonLookup, getActiveAllyIdsForParty, refreshCombatantStats }) {
  const event = state.explorationEvent
  const battle = event?.battle
  if (event?.phase !== 'battle' || !battle?.spec || battle.enemyIds?.length) return { ok: false, state }
  const spec = battle.spec.waves?.[battle.waveIndex ?? 0] ?? battle.spec, preview = getEventBattlePreview(state, spec)
  const baseLevel = battle.baseLevel ?? getEventBattlePreview(state, { opponents: spec.opponents, levelDelta: 0 }).level
  if (!spec.opponents?.length || spec.opponents.length > 3 || spec.opponents.some(name => !allDigimonLookup.has(name))) return { ok: false, state }
  const party = state.party.map(member => member.isEgg ? member : refreshCombatantStats({ ...member, skillCooldowns: {}, battleGuards: {},
    passiveState: createPassiveState() }, { statModifiers: {} }))
  const enemies = spec.opponents.map((name, index) => {
    const enemy = createCombatant({ id: `${event.id}-${event.storyId}-${battle.routeId}-wave${battle.waveIndex ?? 0}-${index}`, name,
      data: allDigimonLookup.get(name), level: preview.level })
    return refreshCombatantStats({ ...enemy, enemyStage: state.currentStage, specialQuest: spec.specialQuest === true, battleGuards: { ...spec.guards } }, { preserveMaxHpDelta: true })
  })
  const activeAllyIds = getActiveAllyIdsForParty(party, [state.player?.id, ...(state.activeAllyIds ?? [])].filter(Boolean), enemies.length)
  const player = party.find(member => member.id === activeAllyIds[0])
  if (!player?.currentHp) return { ok: false, state }
  return { ok: true, state: applyMapEnvironment({ ...state, party, player, enemies, activeAllyIds,
    encounterCount: enemies.length, encounterPool: spec.opponents, actingAllyId: player.id,
    actedAllyIds: [], pendingAllyActions: [], awaitingReplacement: false, escapeAttempts: 0,
    rewardCheckpoint: null, explorationEvent: { ...event, species: [...new Set(spec.opponents)],
      battle: { ...battle, baseLevel, waveIndex: battle.waveIndex ?? 0, enemyIds: enemies.map(enemy => enemy.id), level: preview.level } } }) }
}
