import { getSpeciesScanGain } from '../balance/scanRates.js'

// Base data budgets; addAnalysis converts these into species-specific %p.
export const ANALYSIS_ENCOUNTER_GAIN = 10
export const ANALYSIS_SCAN_GAIN = 25
export const ANALYSIS_SCAN_MS = 850

const retiredCaptureItems = new Set(['capture-net', 'capture-net-super', 'capture-net-hyper', 'capture-net-master'])
export function removeCaptureItems(inventory) {
  return Object.fromEntries(Object.entries(inventory ?? {}).filter(([id]) => !retiredCaptureItems.has(id)))
}

const clamp = value => Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.floor(Number(value)))) : 0
const nameOf = unit => canonicalDigimonName(typeof unit === 'string' ? unit : unit?.name ?? unit?.imageName)

export function normalizeAnalysis(analysis, { legacy = false } = {}) {
  if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) return {}
  const entries = Object.entries(analysis).map(([name, value]) => [name, canonicalDigimonName(name, { legacy }), clamp(value)])
    .filter(([, name]) => isPlayableDigimon(name))
  // When an alias and its canonical entry coexist, the canonical zero remains
  // authoritative: loading an older alias must not restore a spent sample.
  entries.sort(([stored, name], [other, target]) => Number(stored === name) - Number(other === target))
  return Object.fromEntries(entries.map(([, name, value]) => [name, value]))
}

export function getAnalysisProgress(analysis, unit) {
  const name = nameOf(unit)
  if (!isPlayableDigimon(name)) return 0
  for (const alias of getDigimonNameAliases(name)) if (Object.hasOwn(analysis ?? {}, alias)) return clamp(analysis[alias])
  return 0
}

export function canScanSpecies(unit, unlockedSpecies = []) {
  return isPlayableDigimon(unit) && !new Set(unlockedSpecies.map(nameOf)).has(nameOf(unit))
}

export function withoutUnlockedAnalysis(analysis, unlockedSpecies = []) {
  const unlocked = new Set(unlockedSpecies.map(nameOf))
  return Object.fromEntries(Object.entries(normalizeAnalysis(analysis)).filter(([name]) => !unlocked.has(name)))
}

export function addAnalysis(analysis, units, amount, unlockedSpecies = []) {
  const next = withoutUnlockedAnalysis(analysis, unlockedSpecies)
  const gains = []
  // Two of the same species in one encounter/scan share a single data sample.
  const samples = new Map((units ?? []).map(unit => [nameOf(unit), unit]).filter(([name]) => canScanSpecies(name, unlockedSpecies)))
  for (const [name, unit] of samples) {
    const before = getAnalysisProgress(next, name)
    const resolvedAmount = typeof amount === 'function' ? amount(unit) : amount
    const gain = getSpeciesScanGain(name, resolvedAmount)
    if (!gain) continue
    const after = clamp(before + gain)
    Object.defineProperty(next, name, { value: after, enumerable: true, writable: true, configurable: true })
    if (after > before) gains.push({ name, before, after, gain: after - before })
  }
  return { analysis: next, gains }
}

export function getScanPreview(enemies, analysis, scanGain = ANALYSIS_SCAN_GAIN, unlockedSpecies = []) {
  const living = (enemies ?? []).filter(unit => unit.currentHp > 0 && !unit.isEgg && canScanSpecies(unit, unlockedSpecies))
  const projected = addAnalysis(analysis, living, scanGain, unlockedSpecies).analysis
  const species = new Map()
  for (const unit of living) {
    const name = nameOf(unit)
    if (typeof name !== 'string' || !name.trim()) continue
    if (species.has(name)) { species.get(name).count += 1; continue }
    const progress = getAnalysisProgress(analysis, name), after = getAnalysisProgress(projected, name)
    species.set(name, { name, count: 1, progress, after, gain: after - progress })
  }
  return [...species.values()]
}

export function recordEncounterAnalysis(state) {
  const key = `${state.currentStage}:${state.currentMap}${state.explorationEvent?.phase === 'battle' ? `:event:${state.explorationEvent.id}` : ''}`
  const analysis = withoutUnlockedAnalysis(state.digimonAnalysis, state.unlockedSpecies)
  const inventory = removeCaptureItems(state.inventory)
  if (!allowsScanning(state) || state.analysisEncounterKey === key) return { ...state, inventory, digimonAnalysis: analysis }
  const result = addAnalysis(analysis, (state.enemies ?? []).filter(unit => unit.currentHp > 0 && !unit.isEgg),
    target => getTrainerScanGain(state.trainerSkills, ANALYSIS_ENCOUNTER_GAIN, target, 'encounter'), state.unlockedSpecies)
  return { ...state, inventory, digimonAnalysis: result.analysis, analysisEncounterKey: key }
}

export function describeAnalysisGains(gains) {
  return gains.map(gain => `${gain.name} 스캔율 ${gain.before}% → ${gain.after}%${gain.after === 100 ? ' · 보상 화면에서 부화 가능' : ''}`)
}

export function hatchAnalyzedDigimon(state, name, createMember, replacementId = null) {
  name = canonicalDigimonName(name)
  if (!allowsScanning(state)) return { ok: false, state, error: '데일리 모드에서는 스캔 데이터를 부화할 수 없습니다.' }
  if (!isPlayableDigimon(name)) return { ok: false, state, error: '이 디지몬의 데이터를 부화할 수 없습니다.' }
  if (!canScanSpecies(name, state.unlockedSpecies)) return { ok: false, state, error: '이미 시작 디지몬으로 사용할 수 있습니다.' }
  if (getAnalysisProgress(state.digimonAnalysis, name) < 100) return { ok: false, state, error: '스캔율 100%가 필요합니다.' }
  const serial = Math.max(0, Math.floor(Number(state.scanHatchCount) || 0)) + 1
  const member = createMember(name, `scan-${state.currentStage}-${serial}-${name}`)
  if (!member || member.isEgg || !isPlayableDigimon(member) || !(member.currentHp > 0) || state.party.some(unit => unit.id === member.id)) return { ok: false, state, error: '이 디지몬의 데이터를 부화할 수 없습니다.' }
  const admission = admitPartyMember(state, member, replacementId)
  if (!admission.ok) return admission
  const unlockedSpecies = [...new Set([...(state.unlockedSpecies ?? []), name])]
  return { ...admission, state: { ...admission.state, scanHatchCount: serial, unlockedSpecies,
    digimonAnalysis: withoutUnlockedAnalysis(state.digimonAnalysis, unlockedSpecies) } }
}

export function createRewardCheckpoint(reward, stage) {
  return { stage, itemIds: reward.randomItems.map(item => item.id), rerollCount: reward.rerollCount ?? 0, rerollCost: reward.rerollCost ?? 0 }
}

export function restoreRewardCheckpoint(state, lookup) {
  const checkpoint = state.rewardCheckpoint
  if (!checkpoint || checkpoint.stage !== state.currentStage || state.explorationEvent || state.enemies?.some(unit => unit.currentHp > 0)) return null
  const ids = [...new Set(checkpoint.itemIds ?? [])].slice(0, 3)
  const randomItems = ids.map(id => lookup.get(id)).filter(item => item && !retiredCaptureItems.has(item.id) && isModeItemAllowed(item, state))
  if (!randomItems.length) return null
  return { randomItems, rerollCount: checkpoint.rerollCount ?? 0, rerollCost: checkpoint.rerollCost ?? 0,
    selectedRandomItemId: null, isResolving: false, isRevealing: false }
}
import { getTrainerScanGain } from '../progression/trainerSkills.js'
import { isPlayableDigimon } from '../data/speciesAvailability.js'
import { allowsScanning, isModeItemAllowed } from '../progression/gameModes.js'
import { canonicalDigimonName, getDigimonNameAliases } from '../data/digimonNames.js'
import { admitPartyMember } from './partyAdmission.js'
