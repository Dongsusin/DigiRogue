import { isRegionalSupport } from './regionalSupport.js'

// Reuse the learned-skill array used by commands, level-ups and save snapshots.
// Only the two copies of this party member change; a move is never a battle action.
export function reorderBattleSkill(state, combatantId, skillName, targetIndex) {
  if (!state || !Array.isArray(state.party)) return state
  const member = state.party.find(unit => unit?.id === combatantId)
  const unit = state.player?.id === combatantId ? state.player : member
  const names = unit?.skills
  if (!member || unit?.isEgg || isRegionalSupport(unit) || !Array.isArray(names) ||
    !Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= names.length) return state
  const sourceIndex = names.indexOf(skillName)
  if (sourceIndex < 0 || sourceIndex === targetIndex) return state
  const skills = [...names]
  skills.splice(targetIndex, 0, skills.splice(sourceIndex, 1)[0])
  const updated = { ...unit, skills }
  return { ...state, party: state.party.map(unit => unit.id === combatantId ? updated : unit),
    player: state.player?.id === combatantId ? updated : state.player }
}
