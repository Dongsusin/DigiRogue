import { isMainBattleWon } from './modeProgress.js'

export const HALL_STORAGE_KEY = 'digirogue-hall-of-fame-v1'
export const HALL_MODES = ['classic', 'hard']
export const HALL_LIMIT = 10
export const HALL_MAX_TURNS = 2_000_000
export const HALL_TEAM_MAX_BYTES = 512_000
const integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max
const text = (v, max = 80) => typeof v === 'string' && v.length > 0 && v.length <= max
const MAX_DATE = 8_640_000_000_000_000
const STAT_KEYS = ['maxHp', 'currentHp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
const id = v => text(v, 120) && /^[a-zA-Z0-9_-]+$/.test(v)

export const createRunStats = (now = Date.now()) => ({ version: 1, startedAtMs: now, totalTurns: 0, finalClear: false })
export function resumeRunStats(value) {
  return value?.version === 1 && integer(value.startedAtMs, 1, MAX_DATE) &&
    integer(value.totalTurns, 0, HALL_MAX_TURNS) ? { version: 1, startedAtMs: value.startedAtMs, totalTurns: value.totalTurns, finalClear: value.finalClear === true } : null
}
export function advanceRunTurn(state) {
  const previous = resumeRunStats(state?.runStats)
  return { ...state, runStats: previous && previous.totalTurns < HALL_MAX_TURNS ? { ...previous, totalTurns: previous.totalTurns + 1, finalClear: false } : null }
}
function snapshotMember(unit, itemsFor) {
  if (!unit || !text(unit.name)) return null
  if (unit.isEgg) return { name: unit.name, isEgg: true, eggName: String(unit.eggName ?? '').slice(0, 80),
    eggStagesRemaining: Math.max(0, Math.floor(unit.eggStagesRemaining ?? 0)) }
  const stats = Object.fromEntries(['maxHp', 'currentHp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
    .map(key => [key, Math.max(0, Math.round(Number(unit[key]) || 0))]))
  return { name: unit.name, imageName: text(unit.imageName) ? unit.imageName : unit.name, isEgg: false,
    level: Math.floor(unit.level), speciesStage: String(unit.speciesStage ?? '').slice(0, 40),
    type: String(unit.type ?? '불명').slice(0, 40), attribute: String(unit.attribute ?? '불명').slice(0, 40), ...stats,
    skills: [...new Set((unit.skills ?? []).filter(name => text(name)))].slice(0, 8),
    items: itemsFor(unit).filter(item => id(item.id) && text(item.name) && integer(item.value, 1, 999))
      .slice(0, 80).map(item => ({ id: item.id, name: item.name, count: item.value })) }
}
export function createClearRecord(state, { now = Date.now(), itemsFor = () => [] } = {}) {
  const stats = resumeRunStats(state?.runStats)
  if (!HALL_MODES.includes(state?.gameMode) || state.currentStage !== 200 || !isMainBattleWon(state) ||
    !id(state.trainerRunId) || !stats?.finalClear || stats.totalTurns < 1 || now < stats.startedAtMs) return null
  const team = (state.party ?? []).filter(unit => !unit.regionalSupport).map(unit => snapshotMember(unit, itemsFor))
  const record = { version: 1, mode: state.gameMode, runId: state.trainerRunId, stage: 200,
    totalTurns: stats.totalTurns, startedAtMs: stats.startedAtMs, clearedAt: now,
    mapName: String(state.currentMap ?? '').slice(0, 80), team: JSON.stringify(team) }
  return parseHallRecord(record) ? record : null
}
export function parseHallRecord(value) {
  if (value?.version !== 1 || !HALL_MODES.includes(value.mode) || value.stage !== 200 || !id(value.runId) ||
    !integer(value.totalTurns, 1, HALL_MAX_TURNS) || !integer(value.startedAtMs, 1, MAX_DATE) ||
    !integer(value.clearedAt, value.startedAtMs, MAX_DATE) || !text(value.mapName) ||
    typeof value.team !== 'string' || new TextEncoder().encode(value.team).length > HALL_TEAM_MAX_BYTES) return null
  try {
    const members = JSON.parse(value.team)
    if (!Array.isArray(members) || !members.length || members.length > 8 || members.some(unit => {
      if (!unit || !text(unit.name) || typeof unit.isEgg !== 'boolean') return true
      if (unit.isEgg) return !text(unit.eggName) || !integer(unit.eggStagesRemaining, 0, 1000)
      return !integer(unit.level, 1, 1000) || !text(unit.imageName) ||
        typeof unit.speciesStage !== 'string' || unit.speciesStage.length > 40 || !text(unit.type, 40) || !text(unit.attribute, 40) ||
        STAT_KEYS.some(key => !integer(unit[key], 0, Number.MAX_SAFE_INTEGER)) ||
        !Array.isArray(unit.skills) || unit.skills.length > 8 || unit.skills.some(name => !text(name)) ||
        !Array.isArray(unit.items) || unit.items.length > 80 ||
        unit.items.some(item => !item || !id(item.id) || !text(item.name) || !integer(item.count, 1, 999))
    })) return null
    return { ...value, members }
  } catch { return null }
}
export function rankHallRecords(values, mode) {
  const best = new Map()
  for (const row of values ?? []) {
    const record = parseHallRecord(row)
    if (!record || record.mode !== mode || !text(row.playerKey, 128)) continue
    const previous = best.get(row.playerKey)
    if (!previous || record.totalTurns < previous.totalTurns ||
      record.totalTurns === previous.totalTurns && record.clearedAt < previous.clearedAt) best.set(row.playerKey, record)
  }
  return [...best.values()].sort((a,b) => a.totalTurns - b.totalTurns || a.clearedAt - b.clearedAt ||
    a.playerKey.localeCompare(b.playerKey)).slice(0, HALL_LIMIT)
}
function readLedger(storage) {
  try {
    const value = JSON.parse(storage.getItem(HALL_STORAGE_KEY) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch { return {} }
}
function writeLedger(storage, ledger) {
  const value = JSON.stringify(ledger)
  storage.setItem(HALL_STORAGE_KEY, value)
  if (storage.getItem(HALL_STORAGE_KEY) !== value) throw new Error('클리어 기록을 보관하지 못했습니다.')
}
export function queueHallRecord(storage, record) {
  if (!parseHallRecord(record)) return false
  const ledger = readLedger(storage), previous = ledger[record.mode]
  if (parseHallRecord(previous?.record) && previous.record.totalTurns <= record.totalTurns) return false
  writeLedger(storage, { ...ledger, [record.mode]: { record, pending: true } })
  return true
}
export function readHallPending(storage) {
  const ledger = readLedger(storage)
  return HALL_MODES.flatMap(mode => ledger[mode]?.pending && parseHallRecord(ledger[mode].record) ? [ledger[mode].record] : [])
}
export function markHallSynced(storage, record) {
  const ledger = readLedger(storage)
  if (JSON.stringify(ledger[record.mode]?.record) !== JSON.stringify(record)) return
  writeLedger(storage, { ...ledger, [record.mode]: { ...ledger[record.mode], pending: false } })
}

// A guest acknowledgement belongs to its anonymous remote UID, not the Google account.
export function requeueImportedHallLedger(raw) {
  try {
    const ledger = JSON.parse(raw)
    return JSON.stringify(Object.fromEntries(HALL_MODES.flatMap(mode =>
      parseHallRecord(ledger?.[mode]?.record) ? [[mode, {record: ledger[mode].record, pending: true}]] : [])))
  } catch { return '{}' }
}
