import { REGIONAL_SUPPORT_BY_MAP } from '../data/regionalSupportProfiles.js'
import { EVENT_STORY_LOOKUP } from '../adventure/eventStories.js'
export const REGIONAL_TRUST_STORAGE_KEY = 'digirogue-regional-trust-v1'
const bounded = value => Math.min(3, Math.max(0, Math.floor(Number(value) || 0)))
const object = value => value && typeof value === 'object' && !Array.isArray(value)
const parse = text => { try { return JSON.parse(text ?? 'null') } catch { return null } }
const valid = value => value?.version === 1 && object(value.regions) && object(value.contacts) && object(value.receipts)
export function normalizeRegionalTrust(value) {
  const regions = Object.fromEntries(Object.entries(value?.regions ?? {}).filter(([name]) => REGIONAL_SUPPORT_BY_MAP.has(name)).map(([name, trust]) => [name, bounded(trust)]))
  const contacts = Object.fromEntries(Object.entries(value?.contacts ?? {}).filter(([name]) => name.length > 0 && name.length <= 80).map(([name, trust]) => [name, bounded(trust)]))
  const receipts = Object.fromEntries(Object.entries(value?.receipts ?? {}).filter(([id, stage]) => id.length > 0 && id.length <= 256 && Number.isSafeInteger(stage) && stage >= 0))
  return { version: 1, regions, contacts, receipts }
}
// A contact key at zero records a meeting without granting trust. Keep this
// distinct from its numeric value, which can fall back to zero after a failure.
function rememberEncounters(profile, state) {
  const event = state?.explorationEvent
  const story = event?.stage === state?.currentStage && ['choice', 'battle', 'result'].includes(event?.phase)
    ? EVENT_STORY_LOOKUP.get(event.storyId) : null
  const names = [...Object.keys(state?.eventMemory?.contacts ?? {}),
    ...(state?.eventMemory?.journal ?? []).map(entry => entry.npc ?? EVENT_STORY_LOOKUP.get(entry.storyId)?.npc), story?.npc]
  let contacts = profile.contacts
  for (const name of names) if (typeof name === 'string' && name.length > 0 && name.length <= 80 && !Object.hasOwn(contacts, name)) {
    if (contacts === profile.contacts) contacts = { ...contacts }
    contacts[name] = 0
  }
  return contacts === profile.contacts ? profile : { ...profile, contacts }
}
export function loadRegionalTrust(storage, { recoverEncounters = false } = {}) {
  const current = parse(storage.getItem(REGIONAL_TRUST_STORAGE_KEY))
  if (valid(current) && !recoverEncounters) return normalizeRegionalTrust(current)
  // One-time import: choose the latest snapshot for each region/contact. Later
  // decreases, including zero, are authoritative and never restored from saves.
  const saves = ['digirogue-save-v1', ...[1, 2, 3].map(n => 'digirogue-save-slot-' + n + '-v1')]
    .map(key => parse(storage.getItem(key))).filter(data => object(data?.gameState) && Array.isArray(data.gameState.party))
    .sort((a, b) => (Date.parse(a.savedAt) || 0) - (Date.parse(b.savedAt) || 0))
  if (valid(current)) return saves.reduce((profile, data) => rememberEncounters(profile, data.gameState), normalizeRegionalTrust(current))
  const result = normalizeRegionalTrust(null)
  const completedStage = state => Math.max(0, state.lastExplorationEventStage ?? 0, ...(state.eventMemory?.journal ?? []).map(entry => Number(entry.stage) || 0))
  // Pre-run-ID snapshots cannot be correlated reliably. Protect every accepted
  // legacy slot through the latest imported legacy outcome, using the loader's
  // exact fallback identity; subsequent stages remain eligible for new trust.
  const legacyStage = Math.max(0, ...saves.filter(data => !data.gameState.trainerRunId).map(data => completedStage(data.gameState)))
  for (const data of saves) {
    const state = data.gameState, memory = state.eventMemory ?? {}
    const migrated = {}
    for (const entry of memory.journal ?? []) {
      const route = EVENT_STORY_LOOKUP.get(entry.storyId)?.routes.find(route => route.id === entry.choiceId)
      migrated[entry.mapName] = bounded((migrated[entry.mapName] ?? 0) + (route?.regionTrust ?? route?.trust ?? 0))
    }
    for (const [name, region] of Object.entries(memory.regions ?? {})) migrated[name] = bounded(region?.trust)
    Object.assign(result.regions, migrated)
    Object.assign(result.contacts, memory.contacts)
    const runId = state.trainerRunId ?? `legacy-${Number(data.savedAt) || 0}-${Math.floor(Number(state.currentStage))}`
    const stage = state.trainerRunId ? completedStage(state) : legacyStage
    result.receipts[runId] = Math.max(result.receipts[runId] ?? 0, stage)
  }
  return saves.reduce((profile, data) => rememberEncounters(profile, data.gameState), normalizeRegionalTrust(result))
}
export function recordRegionalTrust(profile, state) {
  profile = rememberEncounters(profile, state)
  const change = state?.explorationEvent?.phase === 'result' ? state.explorationEvent.result?.trustChange : null
  if (!change || typeof change.runId !== 'string' || !change.runId || !Number.isSafeInteger(change.stage) || change.stage <= 0 ||
    change.runId !== state.trainerRunId || change.stage !== state.explorationEvent.stage || change.stage <= (profile.receipts[change.runId] ?? 0)) return profile
  const rememberNpc = typeof change.npc === 'string' && change.npc.length > 0 && change.npc.length <= 80 &&
    (change.npcDelta || !Object.hasOwn(profile.contacts, change.npc))
  return normalizeRegionalTrust({ ...profile,
    regions: change.regionDelta ? { ...profile.regions, [change.mapName]: bounded((profile.regions[change.mapName] ?? 0) + change.regionDelta) } : profile.regions,
    contacts: rememberNpc ? { ...profile.contacts, [change.npc]: bounded((profile.contacts[change.npc] ?? 0) + change.npcDelta) } : profile.contacts,
    receipts: { ...profile.receipts, [change.runId]: change.stage } })
}
export function saveRegionalTrust(storage, profile) {
  try {
    const raw = JSON.stringify(profile)
    if (storage.getItem(REGIONAL_TRUST_STORAGE_KEY) !== raw) storage.setItem(REGIONAL_TRUST_STORAGE_KEY, raw)
    return storage.getItem(REGIONAL_TRUST_STORAGE_KEY) === raw
  } catch { return false }
}
export function hydrateRegionalTrust(state, profile) {
  if (!state || !profile) return state
  const regions = { ...state.eventMemory?.regions }
  for (const name of REGIONAL_SUPPORT_BY_MAP.keys()) regions[name] = { ...regions[name], trust: profile.regions[name] ?? 0 }
  const eventMemory = { ...state.eventMemory, contacts: { ...profile.contacts }, regions }
  if (JSON.stringify(state.eventMemory) === JSON.stringify(eventMemory) && JSON.stringify(state.trustReceipts) === JSON.stringify(profile.receipts)) return state
  return { ...state, eventMemory, trustReceipts: profile.receipts }
}
