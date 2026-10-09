import { isDailyMode, normalizeGameMode } from './gameModes.js'

export const MODE_PROGRESS_STORAGE_KEY = 'digirogue-modes-v1'
const stageValue = value => Number.isSafeInteger(value) && value > 0 ? value : 0
export function normalizeModeProgress(value) {
  const dailyRecords = Object.fromEntries(Object.entries(value?.dailyRecords ?? {})
    .filter(([date, stage]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && stageValue(stage))
    .sort(([a], [b]) => b.localeCompare(a)).slice(0, 90))
  return { version: 1, classicCleared: value?.classicCleared === true,
    classicBest: Math.min(200, stageValue(value?.classicBest)), endlessBest: stageValue(value?.endlessBest), dailyRecords }
}
export const isMainBattleWon = state => Boolean(Number.isSafeInteger(state?.currentStage) && state.currentStage > 0 &&
  state.explorationEvent?.phase !== 'battle' && state.enemies?.length && state.enemies.every(unit => unit.currentHp <= 0) &&
  state.party?.some(unit => !unit.isEgg && unit.currentHp > 0))
export function recordModeVictory(value, state) {
  const progress = normalizeModeProgress(value)
  if (!isMainBattleWon(state)) return progress
  const mode = normalizeGameMode(state.gameMode), stage = state.currentStage
  if (mode === 'classic') return { ...progress, classicBest: Math.max(progress.classicBest, Math.min(200, stage)),
    classicCleared: progress.classicCleared || stage === 200 }
  if (isDailyMode(state) && /^\d{4}-\d{2}-\d{2}$/.test(state.dailyDate ?? '')) return normalizeModeProgress({ ...progress,
    dailyRecords: { ...progress.dailyRecords, [state.dailyDate]: Math.max(progress.dailyRecords[state.dailyDate] ?? 0, stage) } })
  if (mode === 'endless') return { ...progress, endlessBest: Math.max(progress.endlessBest, stage) }
  return progress
}
export function loadModeProgress(storage, trainerProgress = {}) {
  try {
    const raw = storage.getItem(MODE_PROGRESS_STORAGE_KEY)
    if (raw) return normalizeModeProgress(JSON.parse(raw))
    // Before modes existed, the final skill-point milestone was written only
    // after defeating the stage-200 boss. Honor those existing classic clears.
    const cleared = Object.values(trainerProgress.milestones ?? {}).some(mask => Number.isSafeInteger(mask) && (mask & 2 ** 19) !== 0)
    return normalizeModeProgress({ classicCleared: cleared, classicBest: cleared ? 200 : 0 })
  } catch { return normalizeModeProgress(null) }
}
export function saveModeProgress(storage, progress) {
  try {
    const raw = JSON.stringify(normalizeModeProgress(progress))
    storage.setItem(MODE_PROGRESS_STORAGE_KEY, raw)
    return storage.getItem(MODE_PROGRESS_STORAGE_KEY) === raw
  } catch { return false }
}
