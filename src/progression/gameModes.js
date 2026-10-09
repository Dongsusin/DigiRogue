export const GAME_MODES = Object.freeze([
  { id: 'classic', name: '클래식' },
  { id: 'daily', name: '데일리' },
  { id: 'endless', name: '무한' },
])
export const normalizeGameMode = mode => GAME_MODES.some(entry => entry.id === mode) ? mode : 'classic'
export const getGameMode = mode => GAME_MODES.find(entry => entry.id === normalizeGameMode(mode))
export const getNextGameMode = (mode, direction = 1) => GAME_MODES[(GAME_MODES.findIndex(entry => entry.id === normalizeGameMode(mode)) + (direction < 0 ? -1 : 1) + GAME_MODES.length) % GAME_MODES.length].id
export const isDailyMode = state => (typeof state === 'string' ? state : state?.gameMode) === 'daily'
export const isEndlessMode = mode => (typeof mode === 'string' ? mode : mode?.gameMode) === 'endless'
export const getModeStageLimit = mode => isEndlessMode(mode) ? Infinity : 200
export const getEncounterProfileStage = (stage, mode) => isEndlessMode(mode) ? (Math.max(1, Math.floor(stage)) - 1) % 200 + 1 : stage
export const canPlayGameMode = (mode, progress) => normalizeGameMode(mode) === 'classic' || Boolean(progress?.classicCleared)
export const allowsScanning = state => !isDailyMode(state)
export const isModeItemAllowed = (item, mode) => !isDailyMode(mode) || !(
  item?.digiEggName || item?.effect?.scan || item?.id === 'card-blue' || ['d-scanner', 'digivice-ic'].includes(item?.id)
)

export function getDailyDate(now = Date.now()) {
  return new Date(Number(now) + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// The roster is sorted by name before shuffling so every account receives the
// same five species, independent of discovery order or browser locale.
export function createDailyChallenge(entries, date = getDailyDate()) {
  const pool = entries.filter(entry => entry.stage === '성장기').map(entry => entry.name).sort()
  let seed = 2166136261
  for (const char of `digirogue-daily-v1:${date}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0
  for (let index = pool.length - 1; index > 0; index--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const target = seed % (index + 1)
    ;[pool[index], pool[target]] = [pool[target], pool[index]]
  }
  return { date, candidates: pool.slice(0, 5) }
}
export function isDailyTeamValid(names, challenge) {
  return Array.isArray(names) && names.length === 2 && new Set(names).size === 2 &&
    names.every(name => challenge?.candidates.includes(name))
}
