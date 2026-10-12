import { sequenceAttacks } from './attackPresentation.js'
import { STATUS_IMPACT_MS } from '../battle/statusConditions.js'
import { BOSS_EVOLUTION_MS, BOSS_EVOLUTION_SWAP_MS, BOSS_POWER_MS, BOSS_FUSION_MS, BOSS_FUSION_SWAP_MS } from '../battle/bossEncounters.js'

export const BATTLE_LOG_FINAL_DELAY_MS = 260
export const createBattleLog = (...lines) => lines.filter(Boolean)

// Capture the resolver's actual boundaries. Damage/miss/KO timing never depends on parsing prose.
export function captureBattleLogAction(logs, effects, { logStart, actionStart, actionEnd, effectStart }) {
  const actionLogs = logs.slice(actionStart, actionEnd)
  return {
    beforeLogs: logs.slice(logStart, actionStart),
    useLogs: actionLogs.slice(0, 1),
    resultLogs: actionLogs.slice(1),
    afterLogs: logs.slice(actionEnd),
    effects: effects.slice(effectStart),
  }
}

export function createBattlePresentation({ effects = [], logs = [], presentation, prefixLogs = [], prefixStatus = [], prefixState = [] } = {}) {
  const casts = [], steps = [], states = [], statuses = [], bosses = []
  let cursor = 0
  const show = (lines, atMs, phase) => {
    // One resolver phase is one update. Extra lines must not add a pause per
    // target, passive, level or learned skill; animation still controls impact.
    const messages = createBattleLog(...lines)
    if (messages.length) steps.push({ atMs, logs: messages, phase })
    return messages.length ? atMs + BATTLE_LOG_FINAL_DELAY_MS : atMs
  }
  const showStatus = (events = [], atMs) => {
    const valid = events.filter(event => event && STATUS_IMPACT_MS[event.phase])
    if (!valid.length) return atMs
    statuses.push({ atMs, events: valid })
    return atMs + Math.max(...valid.map(event => STATUS_IMPACT_MS[event.phase]))
  }
  const showBossChanges = (changes = []) => {
    for (const change of changes) {
      const durationMs = change.kind === 'fusion' ? BOSS_FUSION_MS : change.kind === 'evolve' ? BOSS_EVOLUTION_MS : BOSS_POWER_MS
      bosses.push({ atMs: cursor, event: { ...change, durationMs } })
      show(change.logs ?? [], cursor, 'boss')
      states.push({ atMs: cursor + (change.kind === 'fusion' ? BOSS_FUSION_SWAP_MS : change.kind === 'evolve' ? BOSS_EVOLUTION_SWAP_MS : 0),
        units: [{ targetId: change.targetId, targetSide: change.targetSide ?? 'enemy', targetCombatant: change.nextCombatant,
          ...(change.insertCombatant ? { insertCombatant: true } : {}) },
          ...(change.consumedIds ?? []).map(targetId => ({ targetId, targetSide: 'enemy', removeCombatant: true }))] })
      cursor += durationMs
    }
  }
  if (!presentation) {
    // Unannotated callers cannot reveal outcomes before their effects have finished.
    casts.push(...sequenceAttacks(effects))
    const last = casts.at(-1)
    cursor = last ? last.offsetMs + last.plan.totalMs : 0
    cursor = show(logs, cursor, 'after')
    return { casts, steps, durationMs: cursor }
  }
  if (prefixState.length) states.push({ atMs: cursor, units: prefixState })
  cursor = Math.max(showStatus(prefixStatus, cursor), show(prefixLogs, cursor, 'before'))
  for (const action of presentation) {
    cursor = Math.max(showStatus(action.beforeStatus, cursor), show(action.beforeLogs || [], cursor, 'before'))
    const actionCasts = sequenceAttacks(action.effects)
    if (!actionCasts.length) {
      if (action.afterState?.length) states.push({ atMs: cursor, units: action.afterState })
      cursor = Math.max(showStatus(action.afterStatus, cursor),
        show([...(action.useLogs || []), ...(action.resultLogs || []), ...(action.afterLogs || [])], cursor, 'after'))
      showBossChanges(action.bossChanges)
      continue
    }
    const start = cursor
    const useEnd = show(action.useLogs || [], start, 'use')
    for (const cast of actionCasts) casts.push({ ...cast, offsetMs: start + cast.offsetMs })
    const last = actionCasts.at(-1)
    const lastImpact = start + last.offsetMs + last.plan.impactMs
    const resultEnd = show(action.resultLogs || [], lastImpact, 'impact')
    cursor = Math.max(useEnd, resultEnd, start + last.offsetMs + last.plan.totalMs)
    if (action.afterState?.length) states.push({ atMs: cursor, units: action.afterState })
    cursor = Math.max(showStatus(action.afterStatus, cursor), show(action.afterLogs || [], cursor, 'after'))
    showBossChanges(action.bossChanges)
  }
  return { casts, steps, durationMs: cursor, ...(states.length ? { states } : {}), ...(statuses.length ? { statuses } : {}),
    ...(bosses.length ? { bosses } : {}) }
}

// Batch HP, impact feedback and text at one deadline, in that order. A slow frame cannot
// let a separate text timer race ahead of its hit callback.
export function groupBattlePresentationCues(timeline) {
  const groups = new Map()
  const add = (atMs, cue) => {
    if (!groups.has(atMs)) groups.set(atMs, [])
    groups.get(atMs).push(cue)
  }
  timeline.casts.forEach((cast, index) => {
    add(cast.offsetMs, { kind: 'motion', index })
    cast.plan.strikes.forEach((strike, shotIndex) => add(cast.offsetMs + strike.releaseMs, { kind: 'launch', index, shotIndex }))
    add(cast.offsetMs + cast.plan.impactMs, { kind: 'impact', index })
    add(cast.offsetMs + cast.plan.totalMs, { kind: 'cleanup', index })
  })
  for (const state of timeline.states ?? []) add(state.atMs, { kind: 'state', units: state.units })
  for (const status of timeline.statuses ?? []) add(status.atMs, { kind: 'status', events: status.events })
  for (const boss of timeline.bosses ?? []) add(boss.atMs, { kind: 'boss', event: boss.event })
  for (const step of timeline.steps) add(step.atMs, { kind: 'logs', logs: step.logs, phase: step.phase })
  return [...groups].sort(([a], [b]) => a - b).map(([atMs, cues]) => ({ atMs, cues }))
}
