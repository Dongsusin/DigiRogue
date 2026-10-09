// The original key remains the automatic save, so existing local records load
// without copying or replacing their current run. Each manual slot is independent.
import { DIGIMON_NAME_REVISION, migrateDigimonNames } from '../data/digimonNames.js'
import { removeRetiredCombatantData } from './retiredCombatantData.js'
export const SAVE_STORAGE_KEY = 'digirogue-save-v1'
export const SAVE_DATA_VERSION = 1
export const SAVE_SLOTS = Object.freeze([
  { id: 'auto', label: '자동 저장', key: SAVE_STORAGE_KEY, automatic: true },
  ...[1, 2, 3].map(number => ({ id: `manual-${number}`, label: `선택 저장 ${number}`, key: `digirogue-save-slot-${number}-v1`, automatic: false })),
])

export function getSaveSlotKey(id = 'auto') {
  const slot = SAVE_SLOTS.find(slot => slot.id === id)
  if (!slot) throw new Error('Unknown save slot')
  return slot.key
}

function validResumeUi(ui, state) {
  if (ui == null) return true
  if (typeof ui !== 'object' || Array.isArray(ui) || ui.stage !== state.currentStage) return false
  if (ui.reward && (!Array.isArray(ui.reward.checkpoint?.itemIds) ||
    ui.reward.checkpoint.stage !== state.currentStage || !ui.reward.checkpoint.itemIds.every(id => typeof id === 'string') ||
    !['items', 'scan'].includes(ui.reward.tab))) return false
  if (ui.reward?.pendingTarget && (!['random', 'fixed'].includes(ui.reward.pendingTarget.source) ||
    typeof ui.reward.pendingTarget.itemId !== 'string' || (ui.reward.pendingTarget.selectedTargetIds != null &&
      (!Array.isArray(ui.reward.pendingTarget.selectedTargetIds) || !ui.reward.pendingTarget.selectedTargetIds.every(id => typeof id === 'string'))))) return false
  if (ui.mapSelection && (ui.mapSelection.nextStageNum !== state.currentStage + 1 ||
    !Array.isArray(ui.mapSelection.options) || !ui.mapSelection.options.length ||
    !ui.mapSelection.options.every(name => typeof name === 'string' && name))) return false
  if (ui.skillReplaceState && (!Array.isArray(ui.skillReplaceState.queue) ||
    !Number.isInteger(ui.skillReplaceState.index) || ui.skillReplaceState.index < 0 ||
    ui.skillReplaceState.index >= ui.skillReplaceState.queue.length ||
    !ui.skillReplaceState.queue.every(event => event && typeof event.combatantId === 'string' && typeof event.newSkillName === 'string'))) return false
  if (ui.evolutionState && !['party', 'detail'].includes(ui.evolutionState.mode)) return false
  return true
}

export function readSaveSlot(storage, id, parseState) {
  const slot = SAVE_SLOTS.find(slot => slot.id === id)
  if (!slot) return null
  try {
    const raw = storage?.getItem(slot.key)
    if (!raw) return { ...slot, status: 'empty', savedAt: null, state: null, resumeUi: null }
    const envelope = removeRetiredCombatantData(JSON.parse(raw))
    const state = parseState(raw)
    if (!state) return { ...slot, status: 'invalid', savedAt: envelope?.savedAt ?? null, state: null, resumeUi: null }
    const resumeUi = !slot.automatic && envelope.kind === 'manual' ? migrateDigimonNames(envelope.resumeUi ?? null,
      { legacy: envelope.gameState?.digimonNameRevision !== DIGIMON_NAME_REVISION }) : null
    if (!validResumeUi(resumeUi, state)) return { ...slot, status: 'invalid', savedAt: envelope.savedAt ?? null, state: null, resumeUi: null }
    return { ...slot, status: 'ready', savedAt: envelope.savedAt ?? null, state,
      resumeUi }
  } catch {
    return { ...slot, status: 'invalid', savedAt: null, state: null, resumeUi: null }
  }
}

export const readSaveSlots = (storage, parseState) => SAVE_SLOTS.map(slot => readSaveSlot(storage, slot.id, parseState))

export function writeSaveSlot(storage, id, gameState, resumeUi = null) {
  if (!storage || storage.persistent === false || !gameState) return false
  try {
    const key = getSaveSlotKey(id)
    const data = JSON.stringify(removeRetiredCombatantData({ version: SAVE_DATA_VERSION, kind: id === 'auto' ? 'auto' : 'manual',
      savedAt: new Date().toISOString(), gameState: { ...gameState, digimonNameRevision: DIGIMON_NAME_REVISION },
      ...(id === 'auto' ? {} : { resumeUi }) }))
    // Never remove the existing snapshot first: a full/denied store must leave
// its previous save intact, and the player must stay in the game on failure.
    storage.setItem(key, data)
    return storage.getItem(key) === data
  } catch { return false }
}

// Delete through the active profile/launcher adapter, never the whole storage.
export function deleteSaveSlot(storage, id) {
  const key = SAVE_SLOTS.find(slot => slot.id === id)?.key
  if (!key || !storage || storage.persistent === false) return false
  try {
    storage.removeItem(key)
    return storage.getItem(key) === null
  } catch { return false }
}

export function defaultSaveSlot(slots, mode) {
  if (mode === 'exit') return slots.find(slot => !slot.automatic && slot.status !== 'ready')?.id ?? 'manual-1'
  return slots.filter(slot => slot.status === 'ready')
    .sort((a, b) => (Date.parse(b.savedAt) || 0) - (Date.parse(a.savedAt) || 0))[0]?.id ?? 'auto'
}

export function isSaveTransitionBusy({ battlePanelMode, rewardState, evolutionScene, mapSelectionState,
  explorationEvent, skillReplaceState, actionTimers = 0, logTimers = 0, scanning = false, replacing = false }) {
  return Boolean(evolutionScene || rewardState?.isResolving || rewardState?.isRevealing || scanning || replacing ||
    battlePanelMode === 'animating' || actionTimers || logTimers ||
    (battlePanelMode === 'logs' && !rewardState && !mapSelectionState && !skillReplaceState &&
      (!explorationEvent || explorationEvent.phase === 'battle')))
}

// UI checkpoints contain decisions that have not been made yet, not an animation
// callback or a second copy of the party. Reward items are rebuilt from current IDs.
export function createSaveResumeUi({ state, rewardCheckpoint = null, rewardState, rewardTab, mapSelectionState,
  skillReplaceState, evolutionState }) {
  return {
    reward: rewardState ? { checkpoint: rewardCheckpoint, tab: rewardTab,
      selectedRandomItemId: rewardState.selectedRandomItemId ?? null, pendingTarget: rewardState.pendingTarget ?? null } : null,
    mapSelection: mapSelectionState ? { nextStageNum: mapSelectionState.nextStageNum,
      options: [...(mapSelectionState.options ?? [])] } : null,
    skillReplaceState: skillReplaceState ?? null,
    evolutionState: evolutionState ? { ...evolutionState, confirmTargetName: null } : null,
    stage: state.currentStage,
  }
}
