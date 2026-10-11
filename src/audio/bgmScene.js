// Use the encounter roster rather than only living opponents: a defeated
// boss leader may still have a companion on the field.
export const resolveBgmScene = ({ screenMode = 'menu', gameState = null,
  rewardState = null, mapSelectionState = null } = {}) => {
  if (screenMode === 'town') return 'rest'
  if (screenMode !== 'adventure') return 'title'
  if (rewardState) return 'rest'
  if (mapSelectionState) return 'exploration'
  const event = gameState?.explorationEvent
  if (event && event.phase !== 'battle') return event.theme === 'town' ? 'rest' : 'exploration'
  if (gameState?.enemies?.some(enemy => enemy.isBoss || enemy.bossEncounter?.leader)) return 'boss'
  return 'battle'
}
