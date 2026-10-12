import { applyEncounterDrain, resolveEncounterPatterns } from './battle/encounterPatterns.js'
import CommunityHub from './components/CommunityHub.jsx'
import MainMenu from './components/MainMenu.jsx'
import HallOfFame from './components/HallOfFame.jsx'
import { useHallOfFame } from './hall/useHallOfFame.js'
import { createRunStats, resumeRunStats, advanceRunTurn } from './progression/hallOfFame.js'
import MenuBackdrop from './components/MenuBackdrop.jsx'
import TownScreen from './components/TownScreen.jsx'
import { versionedResourceUrl } from './data/resourceUrl.js'
import { applyTownStartingSupport, getTownEggStages } from './progression/townProgress.js'
import { hydrateRegionalTrust } from './progression/regionalTrustProgress.js'
import { ITEM_EVOLUTION_REWARD_ITEMS } from './data/evolutionItems.js'
﻿import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DIGIMON_STAGE_DATA } from './data/digimonRoster.js'
import { getDigimonStageRank as getSpeciesStageRank } from './data/digimonStages.js'
import digiEggData from '../data/디지몬/디지에그.json'
import babySkillData from '../data/기술/유아기.json'
import childSkillData from '../data/기술/유년기.json'
import growthSkillData from '../data/기술/성장기.json'
import matureSkillData from '../data/기술/성숙기.json'
import perfectSkillData from '../data/기술/완전체.json'
import ultimateSkillData from '../data/기술/궁극체.json'
import superUltimateSkillData from '../data/기술/초궁극체.json'
import attachmentSkillData from '../data/기술/어티치먼트.json'
import mapData from '../data/map.json'
import BattleScene3D from './components/BattleScene3D.jsx'
import { getMapPresentation } from './data/mapPresentation.js'
import DigimonModelPreview from './components/DigimonModelPreview.jsx'
import StarterSelection from './components/StarterSelection.jsx'
import SaveSlotsDialog from './components/SaveSlotsDialog.jsx'
import GameDialog from './components/GameDialog.jsx'
import GameModeSwitcher from './components/GameModeSwitcher.jsx'
import DailyStarterSelection from './components/DailyStarterSelection.jsx'
import { normalizeGameMode, getGameMode, isDailyMode, isHardMode, isEndlessMode, getModeStageLimit, getEncounterProfileStage,
  canPlayGameMode, allowsScanning, isModeItemAllowed, getDailyDate, createDailyChallenge, isDailyTeamValid } from './progression/gameModes.js'
import { MODE_PROGRESS_STORAGE_KEY, loadModeProgress, saveModeProgress, recordModeVictory } from './progression/modeProgress.js'
import { useLocalProgress } from './progression/useLocalProgress.js'
import { useAuthSession } from './auth/AuthContext.js'
import { browserStorage } from './progression/localStorage.js'
import { getCollectionStatus } from './progression/digimonCollection.js'
import TrainerSkillTree from './components/TrainerSkillTree.jsx'
import DigimonDex from './components/DigimonDex.jsx'
import ItemLuck from './components/ItemLuck.jsx'
import { ITEM_RARITIES, getItemRarityLabel } from './data/itemRarities.js'
import { pickLuckRewardRarity } from './progression/itemLuck.js'
import { TRAINER_SKILLS_STORAGE_KEY, loadTrainerProgress, saveTrainerProgress, normalizeTrainerRanks,
  learnTrainerSkill, redistributeTrainerSkills, getTrainerPoints, createTrainerRun, awardTrainerVictory, applyTrainerStats,
  getTrainerExperienceMultiplier, getTrainerBossMultiplier, getTrainerScanGain,
  getTrainerLuck, pickTrainerRewardItem, getTrainerEvolutionRequirement,
  hasTrainerEvolutionMemory, recordTrainerEvolutionMemory } from './progression/trainerSkills.js'
import { normalizeEvolutionMemory, mergeEvolutionMemory, hasEvolutionMemory, rememberItemEvolution, inferEvolutionMemory } from './progression/evolutionMemory.js'
import { loadScanProgress } from './progression/scanProgress.js'
import { SAVE_DATA_VERSION, SAVE_SLOTS, getSaveSlotKey, readSaveSlot, readSaveSlots,
  writeSaveSlot, deleteSaveSlot, createSaveResumeUi, isSaveTransitionBusy } from './progression/saveSlots.js'
import { normalizeRegionStatModifiers, mergeRegionStatModifier, prepareCombatantForStage, REGION_EFFECT_TEXT } from './battle/regionModifiers.js'
import { cleanCombatantFields, removeRetiredCombatantData } from './progression/retiredCombatantData.js'
import { getStageLevelCap, getStageEnemyLevelRange, getWildEnemyLevelRange, getEnemyDifficultyModifiers, getAdventureExperienceMultiplier, pickWildEncounterNames, enforceCombatantLevelCap } from './progression/gameDifficulty.js'
import { STARTER_TEAM_LIMIT, STARTING_PLAYER_LEVEL, createStarterCatalog, getStarterTeamSummary } from './data/starterSelection.js'
import EvolutionCutscene from './components/EvolutionCutscene.jsx'
import EvolutionBranches from './components/EvolutionBranches.jsx'
import { getDigimonThumbnailUrl } from './data/digimonModels.js'
import { DIGIMON_NAME_REVISION, migrateSavedDigimonNames } from './data/digimonNames.js'
import { isPlayableDigimon } from './data/speciesAvailability.js'
import { getDigimonDisplayScale } from './data/digimonSizes.js'
import BattleLog from './components/BattleLog.jsx'
import BattlePopover from './components/BattlePopover.jsx'
import EquipmentTooltip, { EquippedItemGrid } from './components/EquipmentTooltip.jsx'
import CombatantSummary, { CombatantTraits } from './components/CombatantSummary.jsx'
import StatusConditionBadge from './components/StatusConditionBadge.jsx'
import { getStatusEffectDefinition, STATUS_EARLY_CURE_CHANCE, createStatusCue, statusTransitionCues } from './battle/statusConditions.js'
import { BattleHistory, CombatantEffects, CombatantEffectsDialog } from './components/BattleInfo.jsx'
import BattleSkillConsole, { BattleCommandIcon } from './components/BattleSkillConsole.jsx'
import BattleTurnPreview, { BattleTurnDetails } from './components/BattleTurnPreview.jsx'
import BattleItemMenu from './components/BattleItemMenu.jsx'
import AdventureBattleBadge from './components/AdventureBattleBadge.jsx'
import FaintReplacementPanel from './components/FaintReplacementPanel.jsx'
import ScanIncubator from './components/ScanIncubator.jsx'
import PartyAdmissionDialog from './components/PartyAdmissionDialog.jsx'
import { admitPartyMember, queuePartyAdmission, dismissPartyAdmission, normalizePartyCapacity } from './battle/partyAdmission.js'
import DigimonLevel from './components/DigimonLevel.jsx'
import ExplorationEvent from './components/ExplorationEvent.jsx'
import { appendBattleHistory } from './battle/battleInfo.js'
import { getEnemyTargetIds, buildTurnPreview, getPlannedAllyIds, getBattleFocus } from './battle/commandPreview.js'
import { recordEncounterAnalysis as recordAnalysisEncounter, getAnalysisProgress, addAnalysis, canScanSpecies, withoutUnlockedAnalysis, describeAnalysisGains, hatchAnalyzedDigimon,
  createRewardCheckpoint, restoreRewardCheckpoint, ANALYSIS_SCAN_GAIN, ANALYSIS_SCAN_MS } from './battle/digimonAnalysis.js'
import { createExplorationEvent, resolveExplorationChoice, upgradeExplorationEvent } from './adventure/explorationEvents.js'
import { completeStoryBattle, upgradeRegionalTrustMemory } from './adventure/storyEvents.js'
import { attachRegionalSupport, isRegionalSupport, ownedBattleUnits, hasLivingOwnedAlly, regionalBattleContext, commitRegionalBattleState, getRegionalSupportSkill } from './battle/regionalSupport.js'
import { buildEventBattle } from './adventure/eventBattles.js'
import { createBossEncounter, resolveBossReactions, getBossIntroLogs, isBossSkillAllowed, spendBossRecovery, normalizeEncounterPresentation } from './battle/bossEncounters.js'
import { withBossSegments, hydrateBossSegments, getBossSegmentCount, bossSegmentMarkers, resolveSegmentedBossDamage } from './battle/bossPhases.js'
import { playBattleCueSequence } from './three/battleCuePlayback.js'
import { getFinalBossMove, getFinalBossSkillData, getFinalBossTarget, resolveFinalBossPatterns } from './battle/finalBosses.js'
import { BATTLE_CONSUMABLES, CARD_EFFECT_MS, resolveBattleConsumable } from './battle/battleItems.js'
import { applyMapEnvironment, getEnvironmentMultiplier } from './battle/mapEnvironment.js'
import { getAnomalyDamage, getAnomalyHealing, getAnomalyAccuracy, getAnomalyStatusChance } from './battle/worldAnomalies.js'
import { createRivalEncounter, recordRivalMeeting, recordRivalVictory, getRivalIntroLogs } from './battle/rivalEncounters.js'
import { createDigiEggRewardItems, describeJogressRecipes } from './data/gameDescriptions.js'
import { BATTLE_LOG_FINAL_DELAY_MS, createBattleLog,
  captureBattleLogAction, createBattlePresentation } from './three/battleLogTimeline.js'
import { SWITCH_OUT_MS, SWITCH_IN_DELAY_MS, SWITCH_TOTAL_MS, createSwitchEvents } from './three/switchPresentation.js'
import { isEscapeBlocked, rollRunAttempt } from './battle/escape.js'
import { gameAudio } from './audio/GameAudio.js'
import { bgmTracks } from './audio/bgmCatalog.js'
import { createDefaultBgmSettings, sanitizeBgmSettings, getEnabledBgmTracks } from './audio/bgmSettings.js'
import { BgmPlayer } from './audio/BgmPlayer.js'
import { resolveBgmScene } from './audio/bgmScene.js'
import { BALANCE_REVISION, BASIC_SKILLS, balanceSpecies, balanceSkill, GUARD_DESCRIPTIONS } from './balance/catalog.js'
import { getSkillCooldown, startSkillCooldown, tickBattleTimers, getCommandSkillNames, getStatusDuration,
  scoreSkill, chooseSkillTarget, recoverAfterVictory, CRITICAL_HIT_CHANCE, CRITICAL_HIT_MULTIPLIER } from './balance/combat.js'
import { typeAdvantageMap, attributeAdvantageMap, getMatchupResult } from './balance/matchups.js'
import { DAMAGE_TEXT_MS } from './battle/damageFeedback.js'
import { getDigimonPassive, getDigimonPassiveId } from './data/digimonPassives.js'
import PassiveAbility from './components/PassiveAbility.jsx'
import { createPassiveState, hydrateDigimonPassive, mergePassiveStates, getPassiveAccuracy,
  getPassiveCriticalChance, getPassiveStatusChance, getPassiveStatusDamageMultiplier, getPassiveHealing,
  resolvePassiveStatusGuard, resolvePassiveStatGuard, getPassiveAttackModifiers, recordPassiveHit,
  recordPassiveAttack, resolvePassiveEndure, resolvePassiveActionEnd, passiveLog } from './battle/passives.js'
import { getPartyEvolutionProgress, getNewLevelEvolutionTargets } from './data/evolutionReadiness.js'
import evolutionTrainingProfiles from './data/evolutionTrainingProfiles.json'
import { EVOLUTION_LEVELS, JOGRESS_RECIPES, ITEM_EVOLUTION_REQUIREMENTS, getEvolutionRoute } from './data/evolutionRules.js'
import { resolveEvolutionCinematic } from './data/evolutionCinematics.js'
import { ADVENTURE_BATTLE_ITEMS, ADVENTURE_UTILITY_ITEMS, hasAdventureItem, getItemScanGain,
  getItemHatchLevel, getItemRerollDiscount, getItemExperienceMultiplier, getItemStatusChance,
  getItemStatusDamageMultiplier, getItemHealingMultiplier, getAdventureAttackModifiers } from './data/adventureItems.js'
import './App.css'
import './battle-ui.css'

const battleMenuItems = [
  { label: '\uACF5\uACA9', key: 'attack', active: true },
  { label: '아이템', key: 'items', active: false },
  { label: '\uAD50\uCCB4', key: 'swap', active: false },
  { label: '\uB3C4\uB9DD', key: 'run', active: false },
]

const BGM_VOLUME = 0.28
const SETTINGS_STORAGE_KEY = 'digirogue-settings-v1'
const SPEED_OPTIONS = [1, 1.5, 2]
const EVOLUTION_SPEED_OPTIONS = [1, 1.5, 2, 'skip']
const VOLUME_OPTIONS = [0, 20, 40, 60, 80, 100]
const MAX_COMBATANT_SKILL_COUNT = 8
const DIGIMON_SIZE_MIN = 1
const DIGIMON_SIZE_MAX = 5

const createDefaultSettings = () => ({
  gameSpeed: 1,
  expBarSpeed: 1,
  evolutionSpeed: 1,
  masterVolume: 100,
  bgmVolume: 80,
  sfxVolume: 80,
  ...createDefaultBgmSettings(),
})

const normalizeSettingNumber = (value, fallback, options) => {
  const numericValue = Number(value)
  return options.includes(numericValue) ? numericValue : fallback
}

const normalizeVolumeSetting = (value, fallback = 100) => {
  const numericValue = Number(value)
  return VOLUME_OPTIONS.includes(numericValue) ? numericValue : fallback
}

const sanitizeSettings = (settings) => {
  const defaults = createDefaultSettings()

  return {
    gameSpeed: normalizeSettingNumber(settings?.gameSpeed, defaults.gameSpeed, SPEED_OPTIONS),
    expBarSpeed: normalizeSettingNumber(settings?.expBarSpeed, defaults.expBarSpeed, SPEED_OPTIONS),
    evolutionSpeed:
      settings?.evolutionSpeed === 'skip'
        ? 'skip'
        : normalizeSettingNumber(settings?.evolutionSpeed, defaults.evolutionSpeed, SPEED_OPTIONS),
    masterVolume: normalizeVolumeSetting(settings?.masterVolume, defaults.masterVolume),
    bgmVolume: normalizeVolumeSetting(settings?.bgmVolume, defaults.bgmVolume),
    sfxVolume: normalizeVolumeSetting(settings?.sfxVolume, defaults.sfxVolume),
    ...sanitizeBgmSettings(settings),
  }
}

const loadSettingsFromStorage = (storage = browserStorage()) => {
  if (!storage) {
    return createDefaultSettings()
  }

  try {
    const storedSettings = storage.getItem(SETTINGS_STORAGE_KEY)
    return storedSettings ? sanitizeSettings(JSON.parse(storedSettings)) : createDefaultSettings()
  } catch {
    return createDefaultSettings()
  }
}

const saveSettingsToStorage = (settings, storage = browserStorage()) => {
  if (!storage) {
    return
  }

  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)))
  } catch {
    // 설정 저장 실패는 게임 진행을 막지 않는다.
  }
}

const getVolumeRatio = (value) => Math.max(0, Math.min(1, Number(value) / 100))

const getEffectiveBgmVolume = (settings) =>
  BGM_VOLUME * getVolumeRatio(settings.masterVolume) * getVolumeRatio(settings.bgmVolume)

const getEffectiveSfxVolume = (settings) =>
  getVolumeRatio(settings.masterVolume) * getVolumeRatio(settings.sfxVolume)

const getScaledDuration = (duration, speed) => {
  const numericSpeed = Number(speed)
  const safeSpeed = Number.isFinite(numericSpeed) && numericSpeed > 0 ? numericSpeed : 1
  return Math.max(0, Math.round(duration / safeSpeed))
}

const sanitizeGameStateForSave = (gameState, { preserveCommands = false } = {}) => {
  if (!gameState || typeof gameState !== 'object') {
    return null
  }

  const stageStartState = {
    ...commitRegionalBattleState(gameState),
    digimonNameRevision: DIGIMON_NAME_REVISION,
    ...(Array.isArray(gameState.enemies) ? { enemies: gameState.enemies.map(normalizeEncounterPresentation) } : {}),
    actedAllyIds: preserveCommands ? gameState.actedAllyIds ?? [] : [],
    pendingAllyActions: preserveCommands ? gameState.pendingAllyActions ?? [] : [],
  }

  try {
    return removeRetiredCombatantData(JSON.parse(JSON.stringify(stageStartState)))
  } catch {
    return null
  }
}

const parseSavedGameState = (rawSaveData) => {
  try {
    const parsedSaveData = JSON.parse(rawSaveData)
    const savedGameState = removeRetiredCombatantData(migrateSavedDigimonNames(
      parsedSaveData?.version === SAVE_DATA_VERSION
        ? parsedSaveData.gameState
        : parsedSaveData?.gameState ?? null
    ))

    if (
      !savedGameState ||
      typeof savedGameState !== 'object' ||
      !savedGameState.player ||
      !Array.isArray(savedGameState.party) ||
      !Number.isFinite(Number(savedGameState.currentStage))
    ) {
      return null
    }

    // Species without a 3D model were removed from the roster. Runs that contain them, or eggs
    // that could only hatch them, cannot resume. Other units get current species data, so
    // evolution lists reflect the pruned roster.
    if (savedGameState.gameMode && normalizeGameMode(savedGameState.gameMode) !== savedGameState.gameMode) return null
    const gameMode = normalizeGameMode(savedGameState.gameMode)
    if (isDailyMode(gameMode) && (!/^\d{4}-\d{2}-\d{2}$/.test(savedGameState.dailyDate ?? '') ||
      !isDailyTeamValid(savedGameState.dailyStarterNames, { candidates: savedGameState.dailyCandidates ?? [] }) ||
      savedGameState.party.length > 2 || savedGameState.party.some(unit => unit?.isEgg))) return null
    const levelCap = getLevelCapForStage(savedGameState.currentStage, gameMode)
    const trainerSkills = normalizeTrainerRanks(savedGameState.trainerSkills)
    const refreshUnit = (unit, ally = false) => {
      if (!unit || typeof unit !== 'object') return unit
      if (unit.isEgg) {
        const currentEgg = digiEggData.find(egg => egg.이름 === unit.eggName)
        const eggHatchPool = (currentEgg?.부화가능 ?? unit.eggHatchPool ?? [])
          .filter((name) => allDigimonLookup.has(name) && isPlayableDigimon(name))
        return eggHatchPool.length ? { ...unit, eggHatchPool, trainerSkills: ally ? trainerSkills : {} } : null
      }
      const speciesData = allDigimonLookup.get(unit.name) ?? allDigimonLookup.get(unit.imageName)
      if (!speciesData || (ally && !isPlayableDigimon(speciesData))) return null
      const current = hydrateDigimonPassive({ ...unit, name: speciesData.이름, imageName: speciesData.이름,
        speciesStage: speciesData.stage, speciesData, imageUrl: speciesData.imageUrl,
        type: speciesData.타입 ?? '무', attribute: speciesData.속성 ?? '무',
        evolutionHistory: (unit.evolutionHistory ?? []).filter(name => allDigimonLookup.has(name) && isPlayableDigimon(name)),
        ...(ally || isRegionalSupport(unit) ? { enemyGameMode: undefined } : { enemyStage: Number(savedGameState.currentStage), enemyGameMode: gameMode }), trainerSkills: ally ? trainerSkills : {} })
      const refreshed = refreshCombatantStats(unit.balanceRevision === BALANCE_REVISION && unit.speciesStage === speciesData.stage ? current
        : { ...current, baseStats: createBaseStats(speciesData),
          baseStatTotal: getBaseStatTotal(createBaseStats(speciesData)), balanceRevision: BALANCE_REVISION })
      const migrated = { ...refreshed, currentHp: unit.currentHp <= 0 ? 0
        : Math.max(1, Math.min(refreshed.maxHp, Math.round(refreshed.maxHp * unit.currentHp / Math.max(1, unit.maxHp)))) }
      return ally ? enforceCombatantLevelCap(migrated, levelCap, refreshCombatantStats) : migrated
    }
    const enemies = Array.isArray(savedGameState.enemies) ? savedGameState.enemies : []
    // Retire removed eggs without invalidating the rest of an existing run.
    const savedParty = ownedBattleUnits(savedGameState.party).filter(unit => (unit?.isEgg || isPlayableDigimon(unit)) && !(unit?.isEgg &&
      (['옷코몬', '모르포몬'].includes(unit.eggName) || ['옷코몬 디지에그', '모르포몬 디지에그'].includes(unit.name))))
    const party = savedParty.map(unit => refreshUnit(unit, true))
    const player = isPlayableDigimon(savedGameState.player) ? refreshUnit(savedGameState.player, true)
      : party.find(unit => unit && !unit.isEgg && unit.currentHp > 0) ?? party.find(unit => unit && !unit.isEgg)
    const refreshedEnemies = enemies.map(unit => normalizeEncounterPresentation(hydrateBossSegments(refreshUnit(unit), { resetDamageWindow: true })))
    const lost = (refreshed, original) => refreshed.some((unit, index) => original[index] && !unit)
    if (!player || lost(party, savedParty) || lost(refreshedEnemies, enemies)) {
      return null
    }
    const inventory = { ...savedGameState.inventory }
    delete inventory['digi-egg-12']
    delete inventory['digi-egg-11']

    const savedSupport = savedGameState.regionalSupport
    const validSupport = savedSupport && savedSupport.stage === savedGameState.currentStage && savedSupport.mapName === savedGameState.currentMap
    const supportUnit = validSupport ? refreshUnit({ ...savedSupport.unit, regionalSupport: true, trainerSkills: {} }) : null
    const pendingPartyAdmissions = (savedGameState.pendingPartyAdmissions ?? [])
      .filter(request => ['egg', 'scan', 'overflow'].includes(request?.kind))
      .map(request => ({ ...request, member: refreshUnit(request.member, true) }))
      .filter(request => request.member)
    const resumedState = normalizePartyCapacity({
      ...savedGameState,
      pendingPartyAdmissions,
      eventMemory: upgradeRegionalTrustMemory(savedGameState.eventMemory),
      regionalSupport: supportUnit ? { ...savedSupport, unit: { ...supportUnit, regionalSupport: true, trainerSkills: {} } } : null,
      gameMode,
      maxStage: getModeStageLimit(gameMode),
      trainerSkills,
      evolutionMemory: mergeEvolutionMemory(savedGameState.evolutionMemory, inferEvolutionMemory(party)),
      levelCap,
      runStats: resumeRunStats(savedGameState.runStats),
      trainerRunId: savedGameState.trainerRunId ?? `legacy-${Number(parsedSaveData.savedAt) || 0}-${Math.floor(Number(savedGameState.currentStage))}`,
      player,
      party,
      inventory,
      ...(Array.isArray(savedGameState.enemies) ? { enemies: refreshedEnemies } : {}),
      encounterPool: Array.isArray(savedGameState.encounterPool)
        ? savedGameState.encounterPool.filter((name) => allDigimonLookup.has(name) && isPlayableDigimon(name))
        : savedGameState.encounterPool,
      currentStage: Math.max(1, Math.floor(Number(savedGameState.currentStage))),
      actedAllyIds: parsedSaveData.kind === 'manual' && Array.isArray(savedGameState.actedAllyIds)
        ? savedGameState.actedAllyIds.filter(id => party.some(unit => unit?.id === id)) : [],
      pendingAllyActions: parsedSaveData.kind === 'manual' && Array.isArray(savedGameState.pendingAllyActions)
        ? savedGameState.pendingAllyActions.filter(action => action?.side === 'ally' && party.some(unit => unit?.id === action.actorId && isCombatantAbleToBattle(unit))) : [],
    })
    if (!resumedState.party.some(unit => unit?.id === resumedState.actingAllyId)) resumedState.actingAllyId = resumedState.player.id
    // Older saves may lack a formation. Once assigned, vacancies require a choice.
    resumedState.activeAllyIds ??= getActiveAllyIdsForParty(resumedState.party, [resumedState.player.id], getBattleAllyLimit(resumedState))
    resumedState.awaitingReplacement = Boolean(getFaintReplacement(resumedState))
    return upgradeExplorationEvent(recordEncounterAnalysis(resumedState))
  } catch {
    return null
  }
}

const recordEncounterAnalysis = state => recordAnalysisEncounter(recordRivalMeeting(applyMapEnvironment(state)))
const resolveBattleItemUse = (state, command) => resolveBattleConsumable(state, command, refreshCombatantStats)

const saveGameStateToStorage = (gameState, storage = browserStorage(), { slotId = 'auto', resumeUi = null } = {}) => {
  if (!storage) {
    return false
  }

  const sanitizedGameState = sanitizeGameStateForSave(gameState, { preserveCommands: slotId !== 'auto' })

  if (!sanitizedGameState) {
    return false
  }

  return writeSaveSlot(storage, slotId, sanitizedGameState, resumeUi)
}

const loadSavedGameStateFromStorage = (storage = browserStorage(), profile = null, slotId = 'auto') => {
  if (!storage) {
    return null
  }

  try {
    const saved = readSaveSlot(storage, slotId, parseSavedGameState)
    const state = saved?.state
    return state ? { ...hydrateRegionalTrust(state, profile?.regionalTrust),
      unlockedSpecies: profile?.unlockedSpecies ?? state.unlockedSpecies ?? [],
      digimonAnalysis: profile?.analysis ?? withoutUnlockedAnalysis(loadScanProgress(storage, state.digimonAnalysis), state.unlockedSpecies),
      ...(saved.resumeUi ? { saveResumeUi: saved.resumeUi } : {}) } : null
  } catch {
    return null
  }
}

const clearSavedGameStateFromStorage = (storage = browserStorage(), slotId = 'auto') => {
  if (!storage) {
    return
  }

  try {
    storage.removeItem(getSaveSlotKey(slotId))
  } catch {
    // Ignore storage failures. The game can continue without persistence.
  }
}

const MAP_ITEM_ID = 'map-item'
const GLOBE_ITEM_ID = 'globe-item'
const EXP_SHARE_ITEM_ID = 'exp-share'
const EXP_BOOSTER_ITEM_ID = 'exp-booster'
const EXP_BOOSTER_PLUS_ITEM_ID = 'exp-booster-plus'
const LEVEL_UP_ITEM_ID = 'level-up'
const PARTY_LEVEL_UP_ITEM_ID = 'party-level-up'
const EVOLUTER_UP_ITEM_ID = 'evoluter-up'
const EVOLUTION_RETURN_ITEM_ID = 'evolution-return'
const JOGRESS_CHIP_ITEM_ID = 'jogress-chip'
const GOLDEN_BANANA_ITEM_ID = 'golden-banana'
const ACCURACY_TARGET_ITEM_ID = 'accuracy-target'
const CONFUSION_WAVE_ITEM_ID = 'confusion-wave'
const LIFE_FORCE_ITEM_ID = 'life-force'
const MIRACLE_RUBY_ITEM_ID = 'miracle-ruby'
const DEATH_BONE_ITEM_ID = 'death-bone'
const HASTE_ITEM_ID = 'haste'
const DIGI_EGG_STAGE = '디지에그'
const DIGI_EGG_HATCH_STAGE_COUNT = 3
const MAX_DIGIMON_LEVEL = 200
const GOLDEN_BANANA_MAX = 3
const GOLDEN_BANANA_BONUS_RATE = 0.2
const EVOLUTER_UP_MAX = 3
const BATTLE_ACCURACY_ITEM_MAX = 3
const BATTLE_ACCURACY_ITEM_RATE = 5
const LIFE_FORCE_MAX = 3
const LIFE_FORCE_ENDURE_RATE = 10
const MIRACLE_RUBY_MAX = 4
const MIRACLE_RUBY_HEAL_DIVISOR = 32
const DEATH_BONE_MAX = 3
const DEATH_BONE_FLINCH_RATE = 6
const HASTE_MAX = 3
const HASTE_PRIORITY_RATE = 10
const DIGIMON_TYPE_UP_TYPES = ['데이터', '바이러스', '백신', '불명', '프리']
const TYPE_POWER_UP_MAX = 5
const ATTRIBUTE_POWER_UP_MAX = 10
const RECOVERY_PROGRAM_MAX = 2
const ATTRIBUTE_POWER_UP_ALIAS_MAP = {
  불: '화염',
  전기: '번개',
  땅: '흙',
  금속: '강철',
}
const DIGICLONE_MAX = 10
const ATTRIBUTE_POWER_UP_REWARD_ITEMS = [
  { attribute: '화염', imageName: '불' },
  { attribute: '빛', imageName: '빛' },
  { attribute: '바람', imageName: '바람' },
  { attribute: '얼음', imageName: '얼음' },
  { attribute: '번개', imageName: '전기' },
  { attribute: '어둠', imageName: '어둠' },
  { attribute: '흙', imageName: '땅' },
  { attribute: '물', imageName: '물' },
  { attribute: '나무', imageName: '나무' },
  { attribute: '강철', imageName: '금속' },
  { attribute: '무', imageName: '무' },
].map(({ attribute, imageName }) => ({
  id: `attribute-up-${attribute}`,
  name: `${attribute} 속성업`,
  description: `${attribute} 속성 기술의 위력을 5% 높입니다.`,
  attributeUpKey: attribute,
  maxOwnedPerCombatant: ATTRIBUTE_POWER_UP_MAX,
  imageUrl: `/아이템/속성업/${imageName}.png`,
}))
const DIGICLONE_REWARD_ITEMS = [
  {
    id: 'digiclone-a',
    name: '디지클론(A)',
    description: '디지몬의 스피드를 6% 높입니다.',
    digicloneKey: 'speed',
    imageUrl: '/아이템/디지클론/디지클론(A).png',
  },
  {
    id: 'digiclone-b',
    name: '디지클론(B)',
    description: '디지몬의 방어를 6% 높입니다.',
    digicloneKey: 'defense',
    imageUrl: '/아이템/디지클론/디지클론(B).png',
  },
  {
    id: 'digiclone-c',
    name: '디지클론(C)',
    description: '디지몬의 공격을 6% 높입니다.',
    digicloneKey: 'attack',
    imageUrl: '/아이템/디지클론/디지클론(C).png',
  },
  {
    id: 'digiclone-d',
    name: '디지클론(D)',
    description: '디지몬의 특수방어를 6% 높입니다.',
    digicloneKey: 'specialDefense',
    imageUrl: '/아이템/디지클론/디지클론(D).png',
  },
  {
    id: 'digiclone-e',
    name: '디지클론(E)',
    description: '디지몬의 특수공격을 6% 높입니다.',
    digicloneKey: 'specialAttack',
    imageUrl: '/아이템/디지클론/디지클론(E).png',
  },
  {
    id: 'digiclone-s',
    name: '디지클론(S)',
    description: '디지몬의 최대 HP를 6% 높입니다.',
    digicloneKey: 'hp',
    imageUrl: '/아이템/디지클론/디지클론(S).png',
  },
]

const DIGI_EGG_REWARD_ITEMS = createDigiEggRewardItems(digiEggData, DIGI_EGG_HATCH_STAGE_COUNT)

const RECOVERY_PROGRAM_REWARD_ITEMS = [
  {
    id: 'recovery-program-m',
    name: '복구프로그램M',
    description: '전투 불능이 되면 1개를 소모해 최대 HP의 50%로 즉시 부활합니다.',
    recoveryProgramKey: 'recovery-program-m',
    recoveryRatio: 0.5,
    maxOwnedPerCombatant: RECOVERY_PROGRAM_MAX,
    imageUrl: '/아이템/회복/복구프로그램M.png',
  },
  {
    id: 'recovery-program-d',
    name: '복구프로그램D',
    description: '전투 불능이 되면 1개를 소모해 HP를 모두 회복하고 즉시 부활합니다.',
    recoveryProgramKey: 'recovery-program-d',
    recoveryRatio: 1,
    maxOwnedPerCombatant: RECOVERY_PROGRAM_MAX,
    imageUrl: '/아이템/회복/복구프로그램D.png',
  },
]

const BATTLE_ITEM_REWARD_ITEMS = [
  ...ADVENTURE_BATTLE_ITEMS,
  {
    id: ACCURACY_TARGET_ITEM_ID,
    name: '명중과녁',
    description: '디지몬이 사용하는 기술의 명중률을 개당 5%p 높입니다.',
    battleItemKey: ACCURACY_TARGET_ITEM_ID,
    maxOwnedPerCombatant: BATTLE_ACCURACY_ITEM_MAX,
    imageUrl: '/아이템/배틀/명중과녁.png',
  },
  {
    id: CONFUSION_WAVE_ITEM_ID,
    name: '혼란전파',
    description: '이 디지몬을 공격하는 상대 기술의 명중률을 개당 5%p 낮춥니다.',
    battleItemKey: CONFUSION_WAVE_ITEM_ID,
    maxOwnedPerCombatant: BATTLE_ACCURACY_ITEM_MAX,
    imageUrl: '/아이템/배틀/혼란전파.png',
  },
  {
    id: LIFE_FORCE_ITEM_ID,
    name: '생명의 힘',
    description: 'HP가 0이 될 피해를 받으면 개당 10% 확률로 HP 1을 남기고 버팁니다. 남은 HP가 1일 때는 발동하지 않습니다.',
    battleItemKey: LIFE_FORCE_ITEM_ID,
    maxOwnedPerCombatant: LIFE_FORCE_MAX,
    imageUrl: '/아이템/배틀/생명의힘.png',
  },
  {
    id: MIRACLE_RUBY_ITEM_ID,
    name: '기적의루비',
    description: '전투 중 매 턴이 끝날 때 개당 최대 HP의 1/32만큼 회복합니다. 최대 4개까지 적용됩니다.',
    battleItemKey: MIRACLE_RUBY_ITEM_ID,
    maxOwnedPerCombatant: MIRACLE_RUBY_MAX,
    imageUrl: '/아이템/배틀/기적의루비.png',
  },
  {
    id: DEATH_BONE_ITEM_ID,
    name: '죽음을부르는뼈',
    description: '공격이 명중하면 개당 6% 확률로 아직 행동하지 않은 상대를 풀죽게 합니다. 보스에게는 확률이 절반입니다.',
    battleItemKey: DEATH_BONE_ITEM_ID,
    maxOwnedPerCombatant: DEATH_BONE_MAX,
    imageUrl: '/아이템/배틀/죽음을부르는뼈.png',
  },
  {
    id: HASTE_ITEM_ID,
    name: '헤이스트',
    description: '공격할 때 개당 10% 확률로 먼저 행동합니다.',
    battleItemKey: HASTE_ITEM_ID,
    maxOwnedPerCombatant: HASTE_MAX,
    imageUrl: '/아이템/배틀/헤이스트.png',
  },
]

const getRecoveryItemAmount = (unit, amount) => Math.max(amount, Math.floor(unit.maxHp * (amount >= 200 ? 0.7 : amount >= 50 ? 0.4 : 0.25)))

const fixedRewardItems = [
  {
    id: 'heal-20',
    name: '회복플로피L',
    description: 'HP 20과 최대 HP의 25% 중 더 큰 만큼 회복합니다.',
    price: 120,
    healAmount: 20,
    imageUrl: '/아이템/회복/회복플로피L.png',
  },
  {
    id: 'heal-50',
    name: '회복플로피M',
    description: 'HP 50과 최대 HP의 40% 중 더 큰 만큼 회복합니다.',
    price: 280,
    healAmount: 50,
    imageUrl: '/아이템/회복/회복플로피M.png',
  },
  {
    id: 'revive-50',
    name: '부활칩(50%)',
    description: '전투 불능인 디지몬을 최대 HP의 50%로 부활시킵니다.',
    price: 500,
    reviveRatio: 0.5,
    imageUrl: '/아이템/회복/부활칩(50%25).png',
  },
  {
    id: 'revive-100',
    name: '부활칩(100%)',
    description: '전투 불능인 디지몬의 HP를 모두 회복하고 부활시킵니다.',
    price: 900,
    reviveRatio: 1,
    imageUrl: '/아이템/회복/부활칩(100%25).png',
  },
]

const COMMON_DIGI_EGG_NAMES = new Set([
  '용기',
  '우정',
  '순수',
  '사랑',
  '성실',
  '지식',
  '친절',
  '희망',
  '빛',
  '어둠',
])
const COMMON_REWARD_ITEM_IDS = new Set(['heal-20', 'heal-50', LEVEL_UP_ITEM_ID])
const GOOD_REWARD_ITEM_IDS = new Set([
  'heal-200',
  'party-heal-50',
  'revive-50',
  EXP_BOOSTER_ITEM_ID,
  PARTY_LEVEL_UP_ITEM_ID,
  MAP_ITEM_ID,
])
const RARE_REWARD_ITEM_IDS = new Set([
  'heal-full-hp',
  'heal-full-cure',
  'party-heal-200',
  'revive-100',
  'recovery-program-m',
  EXP_SHARE_ITEM_ID,
  EXP_BOOSTER_PLUS_ITEM_ID,
  GOLDEN_BANANA_ITEM_ID,
  CONFUSION_WAVE_ITEM_ID,
  ACCURACY_TARGET_ITEM_ID,
  GLOBE_ITEM_ID,
  EVOLUTION_RETURN_ITEM_ID,
  EVOLUTER_UP_ITEM_ID,
])
const ROGUE_REWARD_ITEM_IDS = new Set([
  'party-heal-full-cure',
  'recovery-program-d',
  HASTE_ITEM_ID,
  MIRACLE_RUBY_ITEM_ID,
  LIFE_FORCE_ITEM_ID,
  DEATH_BONE_ITEM_ID,
])
const MASTER_REWARD_ITEM_IDS = new Set()
const JOGRESS_CHIP_REWARD_ITEM = {
  id: JOGRESS_CHIP_ITEM_ID,
  name: '조그레스 칩',
  description: describeJogressRecipes(JOGRESS_RECIPES),
  rarity: 'rare',
  jogressRecipes: JOGRESS_RECIPES,
  imageUrl: '/아이템/진화/조그레스 칩.png',
}
const itemEvolutionRewardItemByTarget = new Map(
  ITEM_EVOLUTION_REWARD_ITEMS.map((item) => [item.evolutionItemFor, item])
)

const randomRewardItemPool = [
  ...BATTLE_CONSUMABLES,
  ...ADVENTURE_UTILITY_ITEMS,
  {
    id: 'buff-attack',
    name: '공격력 증가',
    description: '맵이 바뀔 때까지 디지몬의 공격을 10% 높입니다.',
    buffStatKey: 'attack',
    imageUrl: '/아이템/스탯업/힘.png',
  },
  {
    id: 'buff-defense',
    name: '방어력 증가',
    description: '맵이 바뀔 때까지 디지몬의 방어를 10% 높입니다.',
    buffStatKey: 'defense',
    imageUrl: '/아이템/스탯업/방어.png',
  },
  {
    id: 'buff-special-attack',
    name: '특수공격 증가',
    description: '맵이 바뀔 때까지 디지몬의 특수공격을 10% 높입니다.',
    buffStatKey: 'specialAttack',
    imageUrl: '/아이템/스탯업/특공.png',
  },
  {
    id: 'buff-special-defense',
    name: '특수방어 증가',
    description: '맵이 바뀔 때까지 디지몬의 특수방어를 10% 높입니다.',
    buffStatKey: 'specialDefense',
    imageUrl: '/아이템/스탯업/특방.png',
  },
  {
    id: 'buff-speed',
    name: '스피드 증가',
    description: '맵이 바뀔 때까지 디지몬의 스피드를 10% 높입니다.',
    buffStatKey: 'speed',
    imageUrl: '/아이템/스탯업/스피드.png',
  },
  {
    id: 'buff-hp',
    name: '체력 증가',
    description: '맵이 바뀔 때까지 디지몬의 최대 HP를 10% 높입니다.',
    buffStatKey: 'hp',
    imageUrl: '/아이템/스탯업/체력.png',
  },
  ...fixedRewardItems,
  {
    id: 'heal-200',
    name: '회복플로피S',
    description: 'HP 200과 최대 HP의 70% 중 더 큰 만큼 회복합니다.',
    healAmount: 200,
    imageUrl: '/아이템/회복/회복플로피S.png',
  },
  {
    id: 'heal-full-hp',
    name: '회복플로피D',
    description: '디지몬의 HP를 모두 회복합니다. 상태이상은 치료하지 않습니다.',
    healFull: true,
    imageUrl: '/아이템/회복/회복플로피D.png',
  },
  {
    id: 'heal-full-cure',
    name: '회복플로피R',
    description: '디지몬의 HP를 모두 회복하고 상태이상을 치료합니다.',
    healFull: true,
    cureStatus: true,
    imageUrl: '/아이템/회복/회복플로피R.png',
  },
  {
    id: 'party-heal-50',
    name: '회복플로피MX',
    description: '전투 가능한 파티 전원에게 HP 50과 최대 HP의 40% 중 더 큰 만큼 회복합니다.',
    partyHealAmount: 50,
    imageUrl: '/아이템/회복/회복플로피MX.png',
  },
  {
    id: 'party-heal-200',
    name: '회복플로피SX',
    description: '전투 가능한 파티 전원에게 HP 200과 최대 HP의 70% 중 더 큰 만큼 회복합니다.',
    partyHealAmount: 200,
    imageUrl: '/아이템/회복/회복플로피SX.png',
  },
  {
    id: 'party-heal-full-cure',
    name: '회복플로피DX',
    description: '전투 가능한 파티 디지몬 모두의 HP를 완전히 회복하고 상태이상을 치료합니다.',
    partyHealFull: true,
    cureStatus: true,
    imageUrl: '/아이템/회복/회복플로피DX.png',
  },
  ...RECOVERY_PROGRAM_REWARD_ITEMS,
  {
    id: MAP_ITEM_ID,
    name: '지도',
    description: '10개 스테이지를 진행할 때마다 다음에 이동할 지역을 선택할 수 있습니다.',
    unique: true,
    imageUrl: '/아이템/지도/지도.png',
  },
  {
    id: GLOBE_ITEM_ID,
    name: '지구본',
    description: '다음 지역을 선택할 때, 각 지역에서 만날 수 있는 디지몬을 보여줍니다. 지도가 필요합니다.',
    unique: true,
    requiresItemId: MAP_ITEM_ID,
    imageUrl: '/아이템/지도/지구본.png',
  },
  {
    id: GOLDEN_BANANA_ITEM_ID,
    name: '황금 바나나',
    description: '스테이지 클리어로 획득하는 골드가 개당 20% 증가합니다.',
    maxOwned: GOLDEN_BANANA_MAX,
    imageUrl: '/아이템/골드/황금바나나.png',
  },
  ...BATTLE_ITEM_REWARD_ITEMS,
  {
    id: EXP_SHARE_ITEM_ID,
    name: 'exp공유기',
    description: '전투 가능한 예비 디지몬의 경험치 몫을 기본 40%에서 65%로 높입니다. 중복 적용되지 않습니다.',
    maxOwned: 1,
    imageUrl: '/아이템/경험치/exp공유기.png',
  },
  {
    id: EXP_BOOSTER_ITEM_ID,
    name: '경험치부스터',
    description: '전투에서 획득하는 경험치가 개당 10% 증가합니다.',
    maxOwned: 5,
    imageUrl: '/아이템/경험치/경험치부스터.png',
  },
  {
    id: EXP_BOOSTER_PLUS_ITEM_ID,
    name: '경험치부스터+',
    description: '전투에서 획득하는 경험치가 개당 25% 증가합니다.',
    maxOwned: 2,
    imageUrl: '/아이템/경험치/경험치부스터+.png',
  },
  {
    id: LEVEL_UP_ITEM_ID,
    name: '에보류터',
    description: '현재 구간의 레벨 상한까지 선택한 디지몬의 레벨을 1 올립니다. 경험치는 0으로 초기화됩니다.',
    levelUpAmount: 1,
    imageUrl: '/아이템/레벨업/에보류터.png',
  },
  {
    id: PARTY_LEVEL_UP_ITEM_ID,
    name: '에보류터(골드)',
    description: '현재 구간의 레벨 상한까지 파티 디지몬 모두의 레벨을 1 올립니다. 경험치는 0으로 초기화됩니다.',
    partyLevelUpAmount: 1,
    imageUrl: '/아이템/레벨업/에보류터(골드).png',
  },
  {
    id: EVOLUTER_UP_ITEM_ID,
    name: '에보류터UP',
    description: '에보류터와 에보류터(골드)의 레벨 상승량을 개당 1씩 높입니다.',
    maxOwned: EVOLUTER_UP_MAX,
    imageUrl: '/아이템/레벨업/에보류터UP.png',
  },
  {
    id: EVOLUTION_RETURN_ITEM_ID,
    name: '진화리턴',
    description: '디지몬을 이전 진화 단계로 되돌립니다.',
    evolutionReturn: true,
    imageUrl: '/아이템/진화/진화리턴.png',
  },
  JOGRESS_CHIP_REWARD_ITEM,
  ...ITEM_EVOLUTION_REWARD_ITEMS,
  ...DIGI_EGG_REWARD_ITEMS,
  ...DIGICLONE_REWARD_ITEMS,
  ...ATTRIBUTE_POWER_UP_REWARD_ITEMS,
  ...DIGIMON_TYPE_UP_TYPES.map((type) => ({
    id: `type-up-${type}`,
    name: `${type} 타입업`,
    description: `${type} 타입 디지몬이 사용하는 기술의 위력을 8% 높입니다.`,
    typeUpKey: type,
    maxOwnedPerCombatant: TYPE_POWER_UP_MAX,
    imageUrl: `/아이템/타입업/${type}.png`,
  })),
]

const rewardItemLookup = new Map(
  [...fixedRewardItems, ...randomRewardItemPool].map((item) => [item.id, item])
)
const buffRewardItems = randomRewardItemPool.filter((item) => item.buffStatKey)
const typeUpRewardItems = randomRewardItemPool.filter((item) => item.typeUpKey)
const attributeUpRewardItems = randomRewardItemPool.filter((item) => item.attributeUpKey)
const digicloneRewardItems = randomRewardItemPool.filter((item) => item.digicloneKey)
const recoveryProgramRewardItems = randomRewardItemPool.filter((item) => item.recoveryProgramKey)
const battleItemRewardItems = randomRewardItemPool.filter((item) => item.battleItemKey)
const digimonStageDataMap = DIGIMON_STAGE_DATA

const normalizeDigimonSize = (size) => {
  const nextSize = Math.round(Number(size))

  if (!Number.isFinite(nextSize)) {
    return 3
  }

  return Math.max(DIGIMON_SIZE_MIN, Math.min(DIGIMON_SIZE_MAX, nextSize))
}

const allSkillLookup = [
  ...babySkillData,
  ...childSkillData,
  ...growthSkillData,
  ...matureSkillData,
  ...perfectSkillData,
  ...ultimateSkillData,
  ...superUltimateSkillData,
  ...attachmentSkillData,
].reduce((result, skill) => {
  if (!result.has(skill.기술명)) {
    result.set(skill.기술명, balanceSkill(skill))
  }

  return result
}, new Map(BASIC_SKILLS.map(skill => [skill.기술명, skill])))

const allDigimonLookup = Object.entries(digimonStageDataMap).reduce((result, [stage, items]) => {
  items.forEach((raw) => {
    const digimon = balanceSpecies(raw, stage, allSkillLookup)
    const imageName = digimon.이미지명 ?? digimon.이름
    result.set(digimon.이름, { ...digimon, stage, imageName, imageUrl: getDigimonThumbnailUrl(imageName) })
  })
  return result
}, new Map())

const starterCatalog = createStarterCatalog(allDigimonLookup)

const getAttachmentSkillNamesForLevel = (data, level) =>
  [...(data?.어티치먼트 ?? [])]
    .filter((entry) => entry?.기술 && Number(entry.레벨 ?? 0) <= level)
    .sort((first, second) => Number(first.레벨 ?? 0) - Number(second.레벨 ?? 0))
    .map((entry) => entry.기술)

const getAllDigimonSkillNamesForLevel = (data, level) => {
  const skillNames = [...(data?.기술 ?? []), ...getAttachmentSkillNamesForLevel(data, level)]

  return [...new Set(skillNames)]
}

const getDigimonSkillNamesForLevel = (data, level) => {
  const signature = [...new Set(data?.기술 ?? [])].slice(0, MAX_COMBATANT_SKILL_COUNT)
  const slots = MAX_COMBATANT_SKILL_COUNT - signature.length
  return [...new Set([...signature, ...(slots > 0 ? getAttachmentSkillNamesForLevel(data, level).slice(-slots) : [])])]
}

// The saved current level is the learning checkpoint: only newly crossed unlocks
// are opportunities. Missing older skills were declined or replaced, not deferred.
const getNewDigimonSkillNamesForLevelRange = (data, fromLevel, toLevel) => {
  if (!data || toLevel <= fromLevel) return []
  const previouslyAvailable = new Set(getAllDigimonSkillNamesForLevel(data, fromLevel))
  return getAllDigimonSkillNamesForLevel(data, toLevel).filter(skillName => !previouslyAvailable.has(skillName))
}

const normalizeInheritedSkills = (names) => [...new Set(Array.isArray(names) ? names : [])]
  .filter(name => allSkillLookup.has(name))

const getPendingJogressSkillEvents = (party = []) => party.flatMap(member =>
  normalizeInheritedSkills(member?.pendingJogressSkills).filter(name => !member.skills?.includes(name))
    .map(name => ({ ...createSkillLearnEvent(member, name, member.level),
      id: `jogress-${member.id}-${name}`, source: 'jogress' })))

const resolveJogressSkillChoice = (combatant, newSkillName, oldSkillName = null) => {
  if (!combatant?.pendingJogressSkills?.includes(newSkillName) || !allSkillLookup.has(newSkillName) ||
    (oldSkillName && !combatant.skills?.includes(oldSkillName))) return null
  const skills = oldSkillName
    ? [...new Set(combatant.skills.map(name => name === oldSkillName ? newSkillName : name))].slice(0, MAX_COMBATANT_SKILL_COUNT)
    : [...combatant.skills]
  const pendingJogressSkills = normalizeInheritedSkills(combatant.pendingJogressSkills)
    .filter(name => name !== newSkillName && !skills.includes(name))
  return { ...combatant, skills, pendingJogressSkills,
    inheritedSkills: normalizeInheritedSkills(combatant.inheritedSkills)
      .filter(name => skills.includes(name) || pendingJogressSkills.includes(name)) }
}

const mergeCombatantSkillNamesForLevel = (combatant, level) => {
  if (!combatant?.speciesData) {
    return combatant?.skills ?? []
  }

  const learnableSkills = getAllDigimonSkillNamesForLevel(combatant.speciesData, level)
  const learnableSkillSet = new Set([...learnableSkills, ...normalizeInheritedSkills(combatant.inheritedSkills)])
  const currentSkills = (combatant.skills?.length
    ? combatant.skills
    : getDigimonSkillNamesForLevel(combatant.speciesData, level)
  ).filter((skillName) => learnableSkillSet.has(skillName))
  const nextSkills = [...new Set(currentSkills)]

  getNewDigimonSkillNamesForLevelRange(combatant.speciesData, combatant.level, level).forEach((skillName) => {
    if (nextSkills.length < MAX_COMBATANT_SKILL_COUNT && !nextSkills.includes(skillName)) {
      nextSkills.push(skillName)
    }
  })

  return nextSkills.slice(0, MAX_COMBATANT_SKILL_COUNT)
}

const getNewSkillLearnNamesForLevel = (combatant, level) => {
  if (!combatant?.speciesData) {
    return []
  }

  const currentSkillSet = new Set(combatant.skills ?? [])

  return getNewDigimonSkillNamesForLevelRange(combatant.speciesData, combatant.level, level).filter(
    (skillName) => !currentSkillSet.has(skillName)
  )
}

const createSkillLearnEvent = (combatant, skillName, level) => ({
  id: `${combatant.id}-${level}-${skillName}`,
  combatantId: combatant.id,
  combatantName: combatant.name,
  newSkillName: skillName,
  level,
})

const getSkillLearnEventsForLevelRange = (combatant, fromLevel, toLevel) => {
  if (!combatant?.speciesData || toLevel <= fromLevel) {
    return []
  }

  const knownSkillNames = new Set(combatant.skills ?? [])
  const queuedSkillNames = new Set()
  let learnedSkillCount = knownSkillNames.size
  const events = []

  for (let level = fromLevel + 1; level <= toLevel; level += 1) {
    getNewDigimonSkillNamesForLevelRange(combatant.speciesData, level - 1, level)
      .filter((skillName) => !knownSkillNames.has(skillName) && !queuedSkillNames.has(skillName))
      .forEach((skillName) => {
        if (learnedSkillCount < MAX_COMBATANT_SKILL_COUNT) {
          knownSkillNames.add(skillName)
          learnedSkillCount += 1
          return
        }

        queuedSkillNames.add(skillName)
        events.push(createSkillLearnEvent(combatant, skillName, level))
      })
  }

  return events
}

const DIGIMON_TYPE_ICON_NAMES = new Set(['데이터', '무', '바이러스', '백신', '불명', '프리'])
const ATTRIBUTE_ICON_FILE_MAP = {
  화염: '불',
  번개: '전기',
  흙: '땅',
}
const createPublicAssetUrl = (...segments) =>
  `/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`

const getDigimonTypeIconUrl = (type) =>
  DIGIMON_TYPE_ICON_NAMES.has(type) ? createPublicAssetUrl('타입', `${type}.png`) : null

const getDigimonAttributeIconUrl = (attribute) => {
  const iconName = ATTRIBUTE_ICON_FILE_MAP[attribute] ?? attribute

  return iconName ? createPublicAssetUrl('속성', `${iconName}.png`) : null
}

const MatchupGuideBadge = ({ kind, name, compact = false }) => {
  const iconUrl =
    kind === 'type' ? getDigimonTypeIconUrl(name) : getDigimonAttributeIconUrl(name)

  return (
    <span
      className={[
        'matchup-guide-badge',
        `matchup-guide-badge--${kind}`,
        compact ? 'matchup-guide-badge--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {iconUrl ? <img className="matchup-guide-badge__icon" src={iconUrl} alt="" /> : null}
      <span className="matchup-guide-badge__label">{name}</span>
    </span>
  )
}

const MatchupGuideRow = ({ kind, source, targets }) => (
  <div className="matchup-guide-row">
    <MatchupGuideBadge kind={kind} name={source} />
    <span className="matchup-guide-row__arrow" aria-hidden="true">
      {'>'}
    </span>
    <span className="matchup-guide-row__targets">
      {targets.map((target) => (
        <MatchupGuideBadge key={`${source}-${target}`} kind={kind} name={target} compact />
      ))}
    </span>
  </div>
)

const MatchupGuideModal = ({ onClose }) => {
  const typeEntries = Object.entries(typeAdvantageMap)
  const attributeEntries = Object.entries(attributeAdvantageMap)

  return (
    <GameDialog title="상성표" eyebrow="BATTLE GUIDE" onClose={onClose}
      className="matchup-guide-panel" backdropClassName="matchup-guide-overlay"
      returnFocusSelector=".matchup-guide-button"
      footer={<div className="matchup-guide-footer">
        <span>타입 x2 / x0.5 · 속성 x1.5 / x0.75</span>
        <span>각 상성을 곱해 적용 · 모두 유리 x3 · 모두 불리 x0.375</span>
      </div>}>
      <p className="matchup-guide-summary">
        디지몬 타입과 기술 속성의 상성에 따라 피해량이 달라집니다. 유리한 상대를 공략해 보세요.
      </p>
      <div className="matchup-guide-body">
        <section className="matchup-guide-section matchup-guide-section--type" aria-label="타입 상성">
          <div className="matchup-guide-section__head">
            <span>타입</span>
            <strong>x2</strong>
          </div>
          <div className="matchup-guide-rows">
            {typeEntries.map(([source, targets]) => (
              <MatchupGuideRow
                key={`type-${source}`}
                kind="type"
                source={source}
                targets={targets}
              />
            ))}
          </div>
        </section>

        <section className="matchup-guide-section matchup-guide-section--attribute" aria-label="속성 상성">
          <div className="matchup-guide-section__head">
            <span>속성</span>
            <strong>다음 2개에 강함</strong>
          </div>
          <div className="matchup-guide-wheel" aria-label="속성 상성 순환표">
            <div className="matchup-guide-wheel__ring" aria-hidden="true" />
            <div className="matchup-guide-wheel__core">
              <strong>x1.5</strong>
              <span>유리</span>
            </div>
            {attributeEntries.map(([attribute], index) => {
              const angle = (360 / attributeEntries.length) * index - 90
              const radians = (angle * Math.PI) / 180
              const x = 50 + Math.cos(radians) * 39
              const y = 50 + Math.sin(radians) * 39

              return (
                <span
                  key={`attribute-node-${attribute}`}
                  className="matchup-guide-node"
                  style={{
                    '--matchup-node-x': `${x}%`,
                    '--matchup-node-y': `${y}%`,
                  }}
                >
                  <MatchupGuideBadge kind="attribute" name={attribute} compact />
                </span>
              )
            })}
            {attributeEntries.map(([attribute], index) => {
              const angle = (360 / attributeEntries.length) * (index + 0.5) - 90
              const radians = (angle * Math.PI) / 180
              const x = 50 + Math.cos(radians) * 39
              const y = 50 + Math.sin(radians) * 39

              return (
                <span
                  key={`attribute-arrow-${attribute}`}
                  className="matchup-guide-wheel__arrow"
                  style={{
                    '--matchup-arrow-x': `${x}%`,
                    '--matchup-arrow-y': `${y}%`,
                    '--matchup-arrow-angle': `${angle + 90}deg`,
                  }}
                  aria-hidden="true"
                >
                  {'>'}
                </span>
              )
            })}
          </div>
          <p className="matchup-guide-note">무 속성은 속성 상성에 따른 피해량 변화가 없습니다.</p>
        </section>
      </div>
    </GameDialog>
  )
}

const BackgroundMusic = ({ settings, scene = 'title', previewUrl = null, onStatus, onPreviewEnd, retrySignal = 0 }) => {
  const audioRef = useRef(null)
  const playerRef = useRef(null)
  const callbacks = useRef({ onStatus, onPreviewEnd })
  callbacks.current = { onStatus, onPreviewEnd }
  const safe = sanitizeSettings(settings)
  const optionsRef = useRef(null)
  optionsRef.current = {
    tracks: getEnabledBgmTracks(safe, scene),
    volume: getEffectiveBgmVolume(safe),
    contextKey: scene,
    previewTrack: safe.enabledBgmUrls.includes(previewUrl) ? bgmTracks.find(track => track.url === previewUrl) : null,
  }
  useEffect(() => {
    const player = new BgmPlayer({
      audio: audioRef.current, window, document, navigator, versionUrl: versionedResourceUrl,
      getDucking: () => gameAudio.getBgmDucking(),
      onStatus: status => callbacks.current.onStatus?.(status),
      onPreviewEnd: () => callbacks.current.onPreviewEnd?.(),
    })
    playerRef.current = player
    player.update(optionsRef.current)
    return () => { player.dispose(); playerRef.current = null }
  }, [])
  const enabledKey = safe.enabledBgmUrls.join('|')
  useEffect(() => { playerRef.current?.update(optionsRef.current) },
    [safe.masterVolume, safe.bgmVolume, enabledKey, scene, previewUrl])
  useEffect(() => { if (retrySignal) playerRef.current?.retry() }, [retrySignal])
  return <audio ref={audioRef} preload="none" aria-hidden="true" />
}

const ButtonClickSound = () => {
  useEffect(() => {
    const handleClick = (event) => {
      const button = event.target instanceof Element ? event.target.closest('button,[role="button"]') : null
      if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return
      gameAudio.unlock()
      const back = /취소|닫기|돌아가기/.test(button.textContent || button.getAttribute('aria-label') || '')
      gameAudio.situation(back ? 'ui-back' : 'ui-select', { scope: 'ui' })
    }
    const silence = () => { if (document.hidden) gameAudio.stopAll() }
    const stop = () => gameAudio.stopAll()
    document.addEventListener('click', handleClick, true)
    document.addEventListener('visibilitychange', silence)
    window.addEventListener('pagehide', stop)
    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('visibilitychange', silence)
      window.removeEventListener('pagehide', stop)
      gameAudio.stopAll()
    }
  }, [])
  return null
}

const MAX_ACTIVE_COMBATANTS = 2
const MAX_ENEMY_COMBATANTS = 2
const PARTY_SLOT_COUNT = STARTER_TEAM_LIMIT
const BOSS_STAGE_INTERVAL = 10
const DIGI_EGG_HATCH_LEVEL = 3
const REGION_BUFF_ACTIVE = 1
const STATUS_DURATION_TURNS = 3
const STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
const BUFFABLE_STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
const STATUS_EFFECT_TYPES = ['독', '맹독', '화상', '혼란', '착란', '마비', '행동불능', '수면', '혼수상태']
const BASE_STAT_FIELD_MAP = {
  hp: '체력',
  attack: '공격',
  defense: '방어',
  specialAttack: '특공',
  specialDefense: '특방',
  speed: '스피드',
}
const STAT_LABEL_MAP = {
  hp: '체력',
  attack: '공격',
  defense: '방어',
  specialAttack: '특공',
  specialDefense: '특방',
  speed: '스피드',
}
const LEVEL_UP_STAT_KEYS = ['hp', 'attack', 'specialAttack', 'defense', 'specialDefense', 'speed']
const LEVEL_UP_STAT_LABEL_MAP = {
  hp: 'hp',
  attack: '공격',
  specialAttack: '특공',
  defense: '방어',
  specialDefense: '특방',
  speed: '스피드',
}
const COMBATANT_STAT_CHART_FIELDS = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: '공격' },
  { key: 'defense', label: '방어' },
  { key: 'speed', label: '스피드' },
  { key: 'specialDefense', label: '특수방어' },
  { key: 'specialAttack', label: '특수공격' },
]
const STAT_CHART_CENTER = 60
const STAT_CHART_RADIUS = 46
const EXP_BAR_ANIMATION_MS = 520
const EXP_BAR_RESET_MS = 70
const EXP_BAR_VISIBLE_AFTER_MS = 450
const LEVEL_UP_STAT_ANIMATION_MS = 900
const LEVEL_UP_STAT_VISIBLE_AFTER_MS = 1050
const getBattlePrompt = (name) => `${name}은 어떤 행동을 할까?`
const formatGold = (value) => {
  const numericValue = Number(value ?? 0)

  if (numericValue < 1000) {
    return numericValue.toLocaleString('ko-KR')
  }

  const goldInK = numericValue / 1000
  const formattedValue =
    goldInK >= 10 || Number.isInteger(goldInK) ? goldInK.toFixed(0) : goldInK.toFixed(1)

  return `${formattedValue}K`
}
const getGoldRewardMultiplier = (inventory = {}) => {
  const goldenBananaCount = Math.min(
    GOLDEN_BANANA_MAX,
    Math.max(0, Math.floor(inventory?.[GOLDEN_BANANA_ITEM_ID] ?? 0))
  )

  return 1 + goldenBananaCount * GOLDEN_BANANA_BONUS_RATE
}

const getStageClearGoldReward = (stage, inventory = {}) => {
  const waveSet = Math.ceil(stage / 10) - 1
  const baseReward = (10 * stage + 175) ** (1 + 0.005 * waveSet)
  return Math.max(20, Math.floor((baseReward * getGoldRewardMultiplier(inventory)) / 10) * 10)
}
const getRewardRerollBaseCost = (stage) =>
  Math.max(80, Math.floor((getStageClearGoldReward(stage) * 0.4) / 10) * 10)
const getRewardRerollCost = (stage, rerollCount = 0, inventory = {}) =>
  Math.max(1, Math.floor(getRewardRerollBaseCost(stage) * (Math.max(0, rerollCount) + 1) * getItemRerollDiscount(inventory)))
const addInventoryItem = (inventory, itemId) => ({
  ...(inventory ?? {}),
  [itemId]: (inventory?.[itemId] ?? 0) + 1,
})
const removeInventoryItem = (inventory, itemId) => {
  const currentCount = inventory?.[itemId] ?? 0

  if (currentCount <= 1) {
    const { [itemId]: _removedItem, ...restInventory } = inventory ?? {}
    return restInventory
  }

  return {
    ...(inventory ?? {}),
    [itemId]: currentCount - 1,
  }
}
const syncPartyMember = (party, activePlayer) => {
  if (!activePlayer) {
    return party ?? []
  }

  const currentParty = Array.isArray(party) && party.length > 0 ? party : [activePlayer]
  const activeIndex = currentParty.findIndex((member) => member.id === activePlayer.id)

  if (activeIndex === -1) {
    return [activePlayer, ...currentParty]
  }

  return currentParty.map((member, index) => (index === activeIndex ? activePlayer : member))
}
const isCombatantEgg = (combatant) => Boolean(combatant?.isEgg)
const fullyRestoreParty = (party) =>
  (party ?? []).map((member) => {
    if (isCombatantEgg(member)) {
      return member
    }

    const refreshedMember = refreshCombatantStats(member, { statusEffect: null })

    return {
      ...refreshedMember,
      currentHp: refreshedMember.maxHp,
    }
  })
const isCombatantAbleToBattle = (combatant) =>
  !isCombatantEgg(combatant) && (combatant?.currentHp ?? 0) > 0
const getBattleAllyLimit = (battleState) =>
  Math.max(
    1,
    Math.min(
      MAX_ACTIVE_COMBATANTS,
      MAX_ENEMY_COMBATANTS,
      Math.max(1, battleState?.encounterCount ?? battleState?.enemies?.length ?? 1)
    )
  )
const getCombatantById = (combatants, combatantId) =>
  combatants?.find((combatant) => combatant.id === combatantId) ?? null
const replaceCombatantById = (combatants, updatedCombatant) => {
  if (!updatedCombatant) {
    return combatants ?? []
  }

  return (combatants ?? []).map((combatant) =>
    combatant.id === updatedCombatant.id ? updatedCombatant : combatant
  )
}
const replacePartyMember = (party, updatedMember) => {
  if (!updatedMember) {
    return party ?? []
  }

  const currentParty = party ?? []
  const memberIndex = currentParty.findIndex((member) => member.id === updatedMember.id)

  if (memberIndex === -1) {
    return [...currentParty, updatedMember]
  }

  return currentParty.map((member, index) => (index === memberIndex ? updatedMember : member))
}
const getLivingCombatants = (combatants) => (combatants ?? []).filter(isCombatantAbleToBattle)
const getRandomCombatant = (combatants) => {
  const currentCombatants = combatants ?? []

  if (!currentCombatants.length) {
    return null
  }

  return currentCombatants[Math.floor(Math.random() * currentCombatants.length)]
}
const getActiveAllyIdsForParty = (party, preferredIds = [], limit = MAX_ACTIVE_COMBATANTS) => {
  const currentParty = party ?? []
  const resolvedLimit = Math.max(1, Math.min(MAX_ACTIVE_COMBATANTS, Math.floor(limit)))
  const livingIds = new Set(
    currentParty.filter((member) => isCombatantAbleToBattle(member)).map((member) => member.id)
  )
  const activeIds = []
  const pushActiveId = (memberId) => {
    if (!memberId || !livingIds.has(memberId) || activeIds.includes(memberId)) {
      return
    }

    if (activeIds.length < resolvedLimit) {
      activeIds.push(memberId)
    }
  }

  preferredIds.forEach(pushActiveId)
  currentParty.forEach((member) => pushActiveId(member.id))

  return activeIds
}
// Keep fainted IDs in the stored formation until the player replaces that slot.
// Rendering/targeting uses only its living members; it must never add a reserve.
const getFaintReplacement = (state) => {
  if (!state?.enemies?.some(isCombatantAbleToBattle)) return null
  const party = ownedBattleUnits(state.party)
  const slots = (state.activeAllyIds ?? []).filter(id => !isRegionalSupport(getCombatantById(state.party, id)))
  const faintedIds = [...new Set(slots)].filter(id => !isCombatantAbleToBattle(getCombatantById(party, id)))
  const candidates = party.filter(member => isCombatantAbleToBattle(member) && !slots.includes(member.id))
  if (!faintedIds.length || !candidates.length) return null
  return { faintedIds, candidates, remainingCount: Math.min(faintedIds.length, candidates.length) }
}
const replaceFaintedAlly = (state, memberId) => {
  const replacement = getFaintReplacement(state)
  if (!state?.awaitingReplacement || !replacement?.candidates.some(member => member.id === memberId)) return null
  const activeAllyIds = state.activeAllyIds.map(id => id === replacement.faintedIds[0] ? memberId : id)
  const player = getFirstLivingPartyMember(state.party, activeAllyIds)
  const next = { ...state, activeAllyIds, player, actingAllyId: player.id }
  next.awaitingReplacement = Boolean(getFaintReplacement(next))
  return next
}
const getReplacementPrompt = (state) => {
  const replacement = getFaintReplacement(state)
  const fainted = getCombatantById(state?.party, replacement?.faintedIds[0])
  return fainted ? `${fainted.name} 대신 내보낼 디지몬을 선택해 주세요.` : '내보낼 디지몬을 선택해 주세요.'
}
const getFirstLivingPartyMember = (party, preferredIds = []) => {
  const currentParty = ownedBattleUnits(party)
  const preferredMembers = preferredIds
    .map((memberId) => getCombatantById(currentParty, memberId))
    .filter(Boolean)
  const searchOrder = preferredMembers.length > 0 ? preferredMembers : currentParty

  return searchOrder.find((member) => isCombatantAbleToBattle(member)) ?? null
}
const getNextActingAllyId = (party, activeAllyIds, actedAllyIds = []) => {
  const actedIdSet = new Set(actedAllyIds)

  return (
    activeAllyIds.find((memberId) => {
      const member = getCombatantById(party, memberId)

      return !isRegionalSupport(member) && isCombatantAbleToBattle(member) && !actedIdSet.has(memberId)
    }) ?? null
  )
}
const normalizeBuffState = (activeBuffs) =>
  BUFFABLE_STAT_KEYS.reduce((result, statKey) => {
    const nextValue = Math.max(0, Math.floor(activeBuffs?.[statKey] ?? 0))
    result[statKey] = Math.min(REGION_BUFF_ACTIVE, nextValue)
    return result
  }, {})

const normalizeBattleStatModifiers = normalizeRegionStatModifiers

const normalizeTypePowerUps = (typePowerUps) =>
  DIGIMON_TYPE_UP_TYPES.reduce((result, type) => {
    const nextValue = Math.max(0, Math.floor(typePowerUps?.[type] ?? 0))
    result[type] = Math.min(TYPE_POWER_UP_MAX, nextValue)
    return result
  }, {})

const normalizeAttributePowerUps = (attributePowerUps) =>
  ATTRIBUTE_POWER_UP_REWARD_ITEMS.reduce((result, item) => {
    const nextValue = Math.max(0, Math.floor(attributePowerUps?.[item.attributeUpKey] ?? 0))
    result[item.attributeUpKey] = Math.min(ATTRIBUTE_POWER_UP_MAX, nextValue)
    return result
  }, {})

const getAttributePowerUpKey = (attribute) => ATTRIBUTE_POWER_UP_ALIAS_MAP[attribute] ?? attribute

const normalizeDigiclones = (digiclones) =>
  STAT_KEYS.reduce((result, statKey) => {
    const nextValue = Math.max(0, Math.floor(digiclones?.[statKey] ?? 0))
    result[statKey] = Math.min(DIGICLONE_MAX, nextValue)
    return result
  }, {})

const normalizeRecoveryPrograms = (recoveryPrograms) =>
  RECOVERY_PROGRAM_REWARD_ITEMS.reduce((result, item) => {
    const nextValue = Math.max(0, Math.floor(recoveryPrograms?.[item.recoveryProgramKey] ?? 0))
    result[item.recoveryProgramKey] = Math.min(RECOVERY_PROGRAM_MAX, nextValue)
    return result
  }, {})

const normalizeBattleItems = (battleItems) =>
  BATTLE_ITEM_REWARD_ITEMS.reduce((result, item) => {
    const nextValue = Math.max(0, Math.floor(battleItems?.[item.battleItemKey] ?? 0))
    result[item.battleItemKey] = Math.min(item.maxOwnedPerCombatant ?? 0, nextValue)
    return result
  }, {})

const getRewardItemLevelLimit = (item, levelCap = Infinity) =>
  levelCap

const applyPartyHealRewardEffect = (party, rewardItem) =>
  (party ?? []).map((member) => {
    if (!isCombatantAbleToBattle(member)) {
      return member
    }

    if (rewardItem?.partyHealFull) {
      const refreshedMember = refreshCombatantStats(member, {
        statusEffect: rewardItem.cureStatus ? null : member.statusEffect,
      })

      return {
        ...refreshedMember,
        currentHp: refreshedMember.maxHp,
      }
    }

    if (rewardItem?.partyHealAmount) {
      return {
        ...member,
        currentHp: Math.min(member.maxHp, member.currentHp + getRecoveryItemAmount(member, rewardItem.partyHealAmount)),
      }
    }

    return member
  })

const applyInstantRewardEffect = (player, rewardItem, levelCap = Infinity) => {
  if (rewardItem?.consumable) return { nextPlayer: player, shouldStore: true }
  if (!player) {
    return {
      nextPlayer: player,
      shouldStore: true,
    }
  }

  if (rewardItem?.buffStatKey) {
    const nextActiveBuffs = {
      ...normalizeBuffState(player.activeBuffs),
      [rewardItem.buffStatKey]: REGION_BUFF_ACTIVE,
    }

    return {
      nextPlayer: refreshCombatantStats(player, { activeBuffs: nextActiveBuffs }),
      shouldStore: false,
    }
  }

  if (rewardItem?.typeUpKey) {
    const nextTypePowerUps = normalizeTypePowerUps(player.typePowerUps)
    nextTypePowerUps[rewardItem.typeUpKey] = Math.min(
      TYPE_POWER_UP_MAX,
      (nextTypePowerUps[rewardItem.typeUpKey] ?? 0) + 1
    )

    return {
      nextPlayer: {
        ...player,
        typePowerUps: nextTypePowerUps,
      },
      shouldStore: false,
    }
  }

  if (rewardItem?.attributeUpKey) {
    const nextAttributePowerUps = normalizeAttributePowerUps(player.attributePowerUps)
    nextAttributePowerUps[rewardItem.attributeUpKey] = Math.min(
      ATTRIBUTE_POWER_UP_MAX,
      (nextAttributePowerUps[rewardItem.attributeUpKey] ?? 0) + 1
    )

    return {
      nextPlayer: {
        ...player,
        attributePowerUps: nextAttributePowerUps,
      },
      shouldStore: false,
    }
  }

  if (rewardItem?.digicloneKey) {
    return {
      nextPlayer: applyDigicloneRewardEffect(player, rewardItem.digicloneKey),
      shouldStore: false,
    }
  }

  if (rewardItem?.recoveryProgramKey) {
    return {
      nextPlayer: applyRecoveryProgramRewardEffect(player, rewardItem.recoveryProgramKey),
      shouldStore: false,
    }
  }

  if (rewardItem?.battleItemKey) {
    return {
      nextPlayer: applyBattleItemRewardEffect(player, rewardItem.battleItemKey),
      shouldStore: false,
    }
  }

  if (rewardItem?.levelUpAmount) {
    return {
      nextPlayer: applyLevelUpRewardEffect(
        player,
        rewardItem.levelUpAmount,
        getRewardItemLevelLimit(rewardItem, levelCap)
      ),
      shouldStore: false,
    }
  }

  if (rewardItem?.evolutionReturn) {
    return {
      nextPlayer: createReturnedEvolutionCombatant(player),
      shouldStore: false,
    }
  }

  if (rewardItem?.reviveRatio) {
    if (player.currentHp > 0) {
      return {
        nextPlayer: player,
        shouldStore: false,
      }
    }

    const refreshedPlayer = refreshCombatantStats(player, { statusEffect: null })

    return {
      nextPlayer: {
        ...refreshedPlayer,
        currentHp: Math.max(1, Math.floor(refreshedPlayer.maxHp * rewardItem.reviveRatio)),
      },
      shouldStore: false,
    }
  }

  if (rewardItem?.healFull) {
    const refreshedPlayer = refreshCombatantStats(player, {
      statusEffect: rewardItem.cureStatus ? null : player.statusEffect,
    })

    return {
      nextPlayer: {
        ...refreshedPlayer,
        currentHp: refreshedPlayer.maxHp,
      },
      shouldStore: false,
    }
  }

  if (!player || !rewardItem?.healAmount) {
    return {
      nextPlayer: player,
      shouldStore: true,
    }
  }

  return {
    nextPlayer: {
      ...player,
      currentHp: Math.min(player.maxHp, player.currentHp + getRecoveryItemAmount(player, rewardItem.healAmount)),
    },
    shouldStore: false,
  }
}

const isTargetedRewardItem = (item) =>
  Boolean(
    item?.healAmount ||
      item?.healFull ||
      item?.reviveRatio ||
      item?.buffStatKey ||
      item?.typeUpKey ||
      item?.attributeUpKey ||
      item?.digicloneKey ||
      item?.recoveryProgramKey ||
      item?.battleItemKey ||
      item?.levelUpAmount ||
      item?.evolutionReturn ||
      item?.jogressRecipes
  )

const getRewardTargetCandidates = (party, fallbackPlayer = null) => {
  const currentParty = Array.isArray(party) && party.length > 0 ? party : []
  const candidates = currentParty.length > 0 ? currentParty : [fallbackPlayer].filter(Boolean)
  const seenIds = new Set()

  return candidates.filter((member) => {
    if (!member?.id || seenIds.has(member.id) || isCombatantEgg(member)) {
      return false
    }

    seenIds.add(member.id)
    return true
  })
}

const hasJogressRecipeMaterials = (party, recipe) => {
  const materialCounts = (party ?? []).reduce((result, member) => {
    if (!member?.name || isCombatantEgg(member) || (member.level ?? 0) < (recipe?.level ?? 1)) {
      return result
    }

    result[member.name] = (result[member.name] ?? 0) + 1
    return result
  }, {})

  return (recipe?.materials ?? []).every((materialName) => {
    if ((materialCounts[materialName] ?? 0) <= 0) {
      return false
    }

    materialCounts[materialName] -= 1
    return true
  })
}

const getAvailableJogressRecipesForParty = (party, recipes = JOGRESS_RECIPES) =>
  (recipes ?? []).filter((recipe) => hasJogressRecipeMaterials(party, recipe))

const canJogressRecipeAcceptMembers = (recipe, members) => {
  const selectedMembers = (members ?? []).filter(Boolean)
  const materialNames = recipe?.materials ?? []

  if (selectedMembers.length <= 0 || selectedMembers.length > materialNames.length) {
    return false
  }

  const materialCounts = materialNames.reduce((result, materialName) => {
    result[materialName] = (result[materialName] ?? 0) + 1
    return result
  }, {})

  return selectedMembers.every((member) => {
    if (!member?.name || isCombatantEgg(member) || (member.level ?? 0) < (recipe?.level ?? 1) || (materialCounts[member.name] ?? 0) <= 0) {
      return false
    }

    materialCounts[member.name] -= 1
    return true
  })
}

const getJogressRecipeForMembers = (members, recipes = JOGRESS_RECIPES) => {
  const selectedMembers = (members ?? []).filter(Boolean)
  const selectedIds = new Set(selectedMembers.map((member) => member.id))

  if (selectedMembers.length <= 1 || selectedIds.size !== selectedMembers.length) {
    return null
  }

  return (
    (recipes ?? []).find((recipe) => {
      return recipe.materials?.length === selectedMembers.length && canJogressRecipeAcceptMembers(recipe, selectedMembers)
    }) ?? null
  )
}

const getJogressEvolutionMembers = (combatant, party, recipe, partnerIds = null) => {
  if (!combatant || !recipe) return []
  if (Array.isArray(partnerIds)) {
    const members = [combatant, ...partnerIds.map(id => getCombatantById(party, id)).filter(Boolean)]
    return getJogressRecipeForMembers(members, [recipe]) ? members : []
  }
  const remaining = [...recipe.materials]
  const primaryIndex = remaining.indexOf(combatant.name)
  if (primaryIndex < 0) return []
  remaining.splice(primaryIndex, 1)
  const members = [combatant]
  for (const name of remaining) {
    const partner = party.find(member => member.name === name && !isCombatantEgg(member) && member.level >= recipe.level &&
      !members.some(selected => selected.id === member.id))
    if (!partner) return []
    members.push(partner)
  }
  return getJogressRecipeForMembers(members, [recipe]) ? members : []
}

const getJogressSelectionRequiredCount = (party, selectedIds = [], recipes = JOGRESS_RECIPES) => {
  const selectedMembers = (selectedIds ?? []).map((memberId) => getCombatantById(party, memberId)).filter(Boolean)
  const availableRecipes = getAvailableJogressRecipesForParty(party, recipes)
  const matchingRecipes =
    selectedMembers.length > 0
      ? availableRecipes.filter((recipe) => canJogressRecipeAcceptMembers(recipe, selectedMembers))
      : availableRecipes
  const materialCounts = matchingRecipes
    .map((recipe) => recipe.materials?.length ?? 0)
    .filter((materialCount) => materialCount > 0)

  return materialCounts.length > 0 ? Math.min(...materialCounts) : 2
}

const isJogressMemberSelectable = (member, party, selectedIds = [], recipes = JOGRESS_RECIPES) => {
  if (!member || isCombatantEgg(member)) {
    return false
  }

  if (selectedIds.includes(member.id)) {
    return true
  }

  const selectedMembers = (selectedIds ?? []).map((memberId) => getCombatantById(party, memberId)).filter(Boolean)
  const candidateMembers = [...selectedMembers, member]

  return getAvailableJogressRecipesForParty(party, recipes).some((recipe) =>
    canJogressRecipeAcceptMembers(recipe, candidateMembers)
  )
}

const isRewardItemUsableByCombatant = (item, combatant, levelCap = Infinity) => {
  if (!item || !combatant) {
    return false
  }

  if (isCombatantEgg(combatant)) {
    return false
  }

  if (item.levelUpAmount) {
    return combatant.level < getRewardItemLevelLimit(item, levelCap)
  }

  if (item.evolutionReturn) {
    return canReturnEvolution(combatant)
  }

  if (item.jogressRecipes) {
    return !isCombatantEgg(combatant)
  }

  if (item.evolutionItemFor) {
    const targetData = allDigimonLookup.get(item.evolutionItemFor)
    return Boolean(
      targetData &&
        combatant.speciesData?.진화가능?.includes(item.evolutionItemFor) &&
        targetData.이름 !== combatant.name
    )
  }

  if (item.typeUpKey) {
    const typePowerUps = normalizeTypePowerUps(combatant.typePowerUps)

    return (
      combatant.type === item.typeUpKey &&
      (typePowerUps[item.typeUpKey] ?? 0) < (item.maxOwnedPerCombatant ?? TYPE_POWER_UP_MAX)
    )
  }

  if (item.attributeUpKey) {
    const attributePowerUps = normalizeAttributePowerUps(combatant.attributePowerUps)

    return (
      (attributePowerUps[item.attributeUpKey] ?? 0) <
      (item.maxOwnedPerCombatant ?? ATTRIBUTE_POWER_UP_MAX)
    )
  }

  if (item.digicloneKey) {
    const digiclones = normalizeDigiclones(combatant.digiclones)

    return (digiclones[item.digicloneKey] ?? 0) < DIGICLONE_MAX
  }

  if (item.recoveryProgramKey) {
    const recoveryPrograms = normalizeRecoveryPrograms(combatant.recoveryPrograms)

    return (
      (recoveryPrograms[item.recoveryProgramKey] ?? 0) <
      (item.maxOwnedPerCombatant ?? RECOVERY_PROGRAM_MAX)
    )
  }

  if (item.battleItemKey) {
    if (item.requiredStage && combatant.speciesStage !== item.requiredStage) return false
    const battleItems = normalizeBattleItems(combatant.battleItems)

    return (
      (battleItems[item.battleItemKey] ?? 0) <
      (item.maxOwnedPerCombatant ?? 0)
    )
  }

  if (item.reviveRatio) {
    return combatant.currentHp <= 0
  }

  if (item.healAmount || item.partyHealAmount) {
    return isCombatantAbleToBattle(combatant) && combatant.currentHp < combatant.maxHp
  }

  if (item.healFull || item.partyHealFull) {
    return (
      isCombatantAbleToBattle(combatant) &&
      (combatant.currentHp < combatant.maxHp || Boolean(item.cureStatus && combatant.statusEffect))
    )
  }

  if (item.buffStatKey) {
    return isCombatantAbleToBattle(combatant)
  }

  return true
}

const shouldSelectRewardTarget = (item, party, fallbackPlayer = null) =>
  isTargetedRewardItem(item) && getRewardTargetCandidates(party, fallbackPlayer).length > 1

const hasCombatantSkillAttribute = (combatant, attributeKey) => {
  if (!combatant || !attributeKey) {
    return false
  }

  return (combatant.skills ?? []).some((skillName) => {
    const skillAttribute = getAttributePowerUpKey(getSkillData(skillName)?.속성)

    return skillAttribute === attributeKey
  })
}

const canRandomRewardItemAppear = (item, inventory = {}, rewardTarget = null, levelCap = Infinity, gameMode = 'classic') => {
  if (!isModeItemAllowed(item, gameMode)) return false
  if (item.requiresItemId && (inventory?.[item.requiresItemId] ?? 0) <= 0) {
    return false
  }

  if (item.digiEggName && (!Array.isArray(item.hatchPool) || item.hatchPool.length <= 0)) {
    return false
  }

  if (item.unique && (inventory?.[item.id] ?? 0) > 0) {
    return false
  }

  if (item.maxOwned != null && (inventory?.[item.id] ?? 0) >= item.maxOwned) {
    return false
  }

  if (item.jogressRecipes) {
    const rewardTargets = getRewardTargetCandidates(
      Array.isArray(rewardTarget) ? rewardTarget : [rewardTarget].filter(Boolean)
    )

    return getAvailableJogressRecipesForParty(rewardTargets, item.jogressRecipes).length > 0
  }

  if (
    item.typeUpKey ||
    item.attributeUpKey ||
    item.digicloneKey ||
    item.recoveryProgramKey ||
    item.battleItemKey ||
    item.healAmount ||
    item.healFull ||
    item.partyHealAmount ||
    item.partyHealFull ||
    item.buffStatKey ||
    item.levelUpAmount ||
    item.partyLevelUpAmount ||
    item.reviveRatio ||
    item.evolutionReturn ||
    item.evolutionItemFor ||
    item.jogressRecipes
  ) {
    const rewardTargets = getRewardTargetCandidates(
      Array.isArray(rewardTarget) ? rewardTarget : [rewardTarget].filter(Boolean)
    )
    const usableItem = item.partyLevelUpAmount
      ? {
          ...item,
          levelUpAmount: item.partyLevelUpAmount,
        }
      : item

    if (
      item.attributeUpKey &&
      !rewardTargets.some((target) => hasCombatantSkillAttribute(target, item.attributeUpKey))
    ) {
      return false
    }

    if (!rewardTargets.some((target) => isRewardItemUsableByCombatant(usableItem, target, levelCap))) {
      return false
    }
  }

  return true
}

const addRewardInventoryItem = (inventory, item) => {
  if (!item?.id) {
    return inventory ?? {}
  }

  if (item.unique) {
    return {
      ...(inventory ?? {}),
      [item.id]: 1,
    }
  }

  if (item.maxOwned != null) {
    return {
      ...(inventory ?? {}),
      [item.id]: Math.min(item.maxOwned, (inventory?.[item.id] ?? 0) + 1),
    }
  }

  return addInventoryItem(inventory, item.id)
}

const getRewardItemMaxCount = (item) => {
  if (item?.maxOwnedPerCombatant != null) {
    return item.maxOwnedPerCombatant
  }

  if (item?.maxOwned != null) {
    return item.maxOwned
  }

  if (item?.unique) {
    return 1
  }

  return null
}

const getRewardItemRarity = (item) => {
  if (!item) {
    return 'common'
  }

  if (item.rarity) {
    return item.rarity
  }

  if (item.buffStatKey || COMMON_REWARD_ITEM_IDS.has(item.id) || COMMON_DIGI_EGG_NAMES.has(item.digiEggName)) {
    return 'common'
  }

  if (item.digicloneKey || GOOD_REWARD_ITEM_IDS.has(item.id)) {
    return 'good'
  }

  if (
    item.attributeUpKey ||
    item.typeUpKey ||
    RARE_REWARD_ITEM_IDS.has(item.id)
  ) {
    return 'rare'
  }

  if (ROGUE_REWARD_ITEM_IDS.has(item.id)) {
    return 'rogue'
  }

  if (MASTER_REWARD_ITEM_IDS.has(item.id)) {
    return 'master'
  }

  return 'common'
}

const selectWeightedRewardRarity = (items, trainerSkills = {}) => {
  const availableWeights = ITEM_RARITIES.filter(({ key }) =>
    items.some((item) => getRewardItemRarity(item) === key)
  )
  return pickLuckRewardRarity(availableWeights, getTrainerLuck(trainerSkills), Math.random) ?? 'common'
}

const selectRandomRewardItemsByRarity = (items, count = 3, trainerSkills = {}) => {
  const selectedItems = []
  let candidates = [...items]

  while (selectedItems.length < count && candidates.length > 0) {
    const selectedRarity = selectWeightedRewardRarity(candidates, trainerSkills)
    const rarityCandidates = candidates.filter((item) => getRewardItemRarity(item) === selectedRarity)
    const selectedItem = pickTrainerRewardItem(rarityCandidates.length ? rarityCandidates : candidates, Math.random)

    if (!selectedItem) {
      break
    }

    selectedItems.push(selectedItem)
    candidates = candidates.filter((item) => item.id !== selectedItem.id)
  }

  return selectedItems
}

const REWARD_REVEAL_DURATION_MS = 1200
const REWARD_REVEAL_IMAGE_URL = '/item.png'
const HIT_EFFECT_DURATION_MS = 620
const DAMAGE_TEXT_DURATION_MS = DAMAGE_TEXT_MS
const RUN_STAGE_ADVANCE_DELAY_MS = 650

const createRewardSelection = (
  inventory = {},
  rewardTarget = null,
  levelCap = Infinity,
  currentStage = 1,
  rerollCount = 0,
  gameMode = 'classic'
) => ({
  randomItems: selectVariedRewardItems(
    randomRewardItemPool.filter((item) =>
      canRandomRewardItemAppear(item, inventory, rewardTarget, levelCap, gameMode)
    ),
    3,
    (Array.isArray(rewardTarget) ? rewardTarget[0] : rewardTarget)?.trainerSkills ?? {}
  ),
  selectedRandomItemId: null,
  isResolving: false,
  isRevealing: true,
  revealKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  rerollCount,
  rerollCost: getRewardRerollCost(currentStage, rerollCount, inventory),
})

const selectVariedRewardItems = (items, count = 3, trainerSkills = {}) => {
  const growth = item => item.digicloneKey || item.levelUpAmount || item.partyLevelUpAmount
  const recovery = item => item.healAmount || item.partyHealAmount || item.healFull || item.partyHealFull || item.reviveRatio
  const categories = [growth, item => !growth(item) && !recovery(item), recovery]
  const selected = []
  for (const category of categories.slice(0, count)) {
    const remaining = items.filter(item => !selected.some(chosen => chosen.id === item.id))
    const pool = remaining.filter(category)
    selected.push(...selectRandomRewardItemsByRarity(pool.length ? pool : remaining, 1, trainerSkills))
  }
  return selected
}

const mapBackgrounds = [
  '/맵/가디언 팰리스.png',
  '/맵/겐시 대륙.png',
  '/맵/기어 포레스트.png',
  '/맵/기어사바나.png',
  '/맵/나이트메어 솔저스.png',
  '/맵/네트의 바다.png',
  '/맵/다크 에리어.png',
  '/맵/다크 웹.png',
  '/맵/다크 필드.png',
  '/맵/메탈 엠파이어.png',
  '/맵/무한산.png',
  '/맵/미하라시 산.png',
  '/맵/부트 화산.png',
  '/맵/비틀랜드.png',
  '/맵/사규산.png',
  '/맵/선공계.png',
  '/맵/센트럴 타운.png',
  '/맵/시작의마을.png',
  '/맵/쓰레기의 산.png',
  '/맵/아시노 섬.png',
  '/맵/아이스 생츄어리.png',
  '/맵/어비스 에리어.png',
  '/맵/어셈블러 타워.png',
  '/맵/오버델 묘지.png',
  '/맵/용의눈호수.png',
  '/맵/용정궁.png',
  '/맵/윈드 가디언즈.png',
  '/맵/이블 포레스트.png',
  '/맵/지하 하수도.png',
  '/맵/코덱 유적.png',
  '/맵/코즈믹 에리어.png',
  '/맵/코퀴토스.png',
  '/맵/팩토리얼 에리어.png',
  '/맵/황천.png',
]

const TOTAL_STAGE_COUNT = 200
const STAGES_PER_MAP = 10
const STAGE_ROUTE = [
  '시작의마을',
  '기어사바나',
  '용의눈호수',
  '네트의 바다',
  '메탈 엠파이어',
  '나이트메어 솔저스',
  '코덱 유적',
  '부트 화산',
  '어셈블러 타워',
  '오버델 묘지',
  '무한산',
  '이블 포레스트',
  '다크 웹',
  '코퀴토스',
  '겐시 대륙',
  '아시노 섬',
  '용정궁',
  '선공계',
  '사규산',
  '황천',
]

const mapBackgroundByName = mapBackgrounds.reduce((result, url) => {
  const fileName = url.split('/').pop() ?? ''
  result[fileName.replace('.png', '')] = url
  return result
}, {})

const getMapNameForStage = (stage, gameMode = 'classic') => {
  const safeStage = Math.min(Math.max(getEncounterProfileStage(stage, gameMode), 1), TOTAL_STAGE_COUNT)
  const routeIndex = Math.min(STAGE_ROUTE.length - 1, Math.floor((safeStage - 1) / STAGES_PER_MAP))
  return STAGE_ROUTE[routeIndex]
}

const isMapMoveStage = (stage) => stage > 1 && (stage - 1) % STAGES_PER_MAP === 0

const getConnectedMapNames = (mapName) => {
  const connectedMaps = mapData[mapName]?.['이동가능한맵']

  if (Array.isArray(connectedMaps) && connectedMaps.length > 0) {
    return connectedMaps
  }

  return Object.keys(mapData).filter((nextMapName) => nextMapName !== mapName)
}

const getRandomConnectedMapName = (mapName, fallbackStage) =>
  shuffleItems(getConnectedMapNames(mapName))[0] ?? getMapNameForStage(fallbackStage)

const getMapEncounterGroups = (mapName) => mapData[mapName]?.['등장디지몬'] ?? {}

const getMapEncounterNamesForStage = (mapName, stage) =>
  (getMapEncounterGroups(mapName)?.[getEncounterGroupForStage(stage)] ?? []).filter(isPlayableDigimon)

const getEncounterGroupNumberForStage = (stage) =>
  Math.max(1, Math.min(6, Number.parseInt(getEncounterGroupForStage(stage), 10) || 1))

const getBossEncounterGroupForStage = (stage) =>
  String(Math.min(6, getEncounterGroupNumberForStage(stage) + 1))

const getBossEncounterNamesForStage = (mapName, stage) => {
  const encounterGroups = getMapEncounterGroups(mapName)
  const bossPool = encounterGroups?.[getBossEncounterGroupForStage(stage)]

  if (Array.isArray(bossPool) && bossPool.length > 0) {
    return bossPool
  }

  return getMapEncounterNamesForStage(mapName, stage)
}

const getLevelCapForStage = (stage, gameMode = 'classic') => getStageLevelCap(stage, gameMode)

const getMapBackgroundUrl = (mapName) => mapBackgroundByName[mapName] ?? mapBackgrounds[0]

const getRandomIntInclusive = (min, max) =>
  Math.floor(Math.random() * (Math.max(min, max) - Math.min(min, max) + 1)) + Math.min(min, max)

const rollPercentChance = (chance) => Math.random() * 100 < chance

const shuffleItems = (items) => {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]]
  }

  return nextItems
}

const getEncounterGroupForStage = (stage) => {
  if (stage <= 10) {
    return '1'
  }

  if (stage <= 30) {
    return '2'
  }

  if (stage <= 50) {
    return '3'
  }

  if (stage <= 70) {
    return '4'
  }

  if (stage <= 90) {
    return '5'
  }

  return '6'
}

const isBossStage = (stage) => stage > 0 && stage % BOSS_STAGE_INTERVAL === 0

const getEncounterCountForStage = (stage) =>
  isBossStage(stage) || stage <= 5 ? 1
    : stage % 10 >= 8 || rollPercentChance(stage >= 100 ? 70 : stage >= 31 ? 60 : 45) ? MAX_ENEMY_COMBATANTS : 1

const createBossHpBreakpoints = (stage) => bossSegmentMarkers(getBossSegmentCount(stage))

const createSkillUseLog = (combatantName, skillName) =>
  `${combatantName}이(가) ${skillName}을(를) 사용했다!`

const normalizeStatusEffect = (statusEffect) => {
  if (!statusEffect?.type || !STATUS_EFFECT_TYPES.includes(statusEffect.type)) {
    return null
  }

  return {
    type: statusEffect.type,
    turns: Math.max(0, Math.min(STATUS_DURATION_TURNS, Math.floor(statusEffect.turns ?? 0))),
  }
}

const getStatusEffectChance = (chanceText) => {
  const numericValue = Number.parseInt(String(chanceText ?? '0').replace('%', ''), 10)
  return Number.isNaN(numericValue) ? 0 : numericValue
}

const getSkillStatusData = (skillData) => {
  const statusType = skillData?.상태이상
  if (!statusType || !STATUS_EFFECT_TYPES.includes(statusType)) {
    return null
  }

  const chance = getStatusEffectChance(skillData?.상태이상확률)
  if (chance <= 0) {
    return null
  }

  return {
    type: statusType,
    chance,
    label: `${statusType} ${chance}%`,
  }
}

const formatInfoValue = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  return value
}

const getStatChartPoint = (ratio, index) => {
  const angle = (-90 + index * 60) * (Math.PI / 180)
  const radius = STAT_CHART_RADIUS * Math.max(0, Math.min(1, ratio))

  return {
    x: STAT_CHART_CENTER + Math.cos(angle) * radius,
    y: STAT_CHART_CENTER + Math.sin(angle) * radius,
  }
}

const formatChartPoint = (point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`

const getStatChartPolygonPoints = (ratio) =>
  COMBATANT_STAT_CHART_FIELDS.map((_, index) => formatChartPoint(getStatChartPoint(ratio, index))).join(' ')

const getStatChartValue = (combatant, statKey) => {
  if (statKey === 'hp') {
    return combatant?.maxHp ?? 0
  }

  return combatant?.[statKey] ?? 0
}

const getCombatantStatChartData = (combatant) => {
  if (!combatant) {
    return null
  }
  const maximumValue = Math.max(...COMBATANT_STAT_CHART_FIELDS.map((field) => getStatChartValue(combatant, field.key)), 1)

  return COMBATANT_STAT_CHART_FIELDS.map((field) => {
    const value = getStatChartValue(combatant, field.key)
    return {
      ...field,
      value,
      valueText: String(value),
      ratio: maximumValue > 0 ? value / maximumValue : 0,
    }
  })
}

const CombatantStatChart = ({ combatant }) => {
  const chartData = getCombatantStatChartData(combatant)

  if (!chartData) {
    return null
  }

  const dataPolygonPoints = chartData
    .map((item, index) => formatChartPoint(getStatChartPoint(item.ratio, index)))
    .join(' ')

  return (
    <figure className="combatant-stat-chart" aria-label="능력치 육각 차트">
      {chartData.map((item) => (
        <figcaption
          key={item.key}
          className={[
            'combatant-stat-chart__label',
            `combatant-stat-chart__label--${item.key}`,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="combatant-stat-chart__label-name">{item.label}</span>
          <span className="combatant-stat-chart__label-value">{item.valueText}</span>
        </figcaption>
      ))}

      <svg className="combatant-stat-chart__svg" viewBox="0 0 120 120" aria-hidden="true">
        {[1, 0.66, 0.33].map((ratio) => (
          <polygon
            key={ratio}
            className="combatant-stat-chart__grid"
            points={getStatChartPolygonPoints(ratio)}
          />
        ))}
        {COMBATANT_STAT_CHART_FIELDS.map((field, index) => {
          const point = getStatChartPoint(1, index)

          return (
            <line
              key={field.key}
              className="combatant-stat-chart__axis"
              x1={STAT_CHART_CENTER}
              y1={STAT_CHART_CENTER}
              x2={point.x}
              y2={point.y}
            />
          )
        })}
        <polygon className="combatant-stat-chart__shape" points={dataPolygonPoints} />
        {COMBATANT_STAT_CHART_FIELDS.map((field, index) => {
          const point = getStatChartPoint(1, index)

          return (
            <circle
              key={field.key}
              className="combatant-stat-chart__vertex"
              cx={point.x}
              cy={point.y}
              r="2.3"
            />
          )
        })}
      </svg>
    </figure>
  )
}

const CombatantIdentityStrip = ({ combatant, levelCap }) => <>
  <CombatantSummary combatant={combatant} levelCap={levelCap} />
  <div className="combatant-info__identity">
    <StatusConditionBadge combatant={combatant} className="combatant-info__status" />
    <span className="combatant-info__pill">{formatInfoValue(combatant.speciesStage)}</span>
    <span className="combatant-info__pill">{combatant.speciesData?.전투역할 ?? '균형형'}</span>
  </div>
</>

export const CombatantInfoPanel = ({
  combatant,
  levelCap,
  side,
  items = [],
  anchor,
  onClose,
}) => {
  if (!combatant || !anchor) {
    return null
  }

  return (
    <BattlePopover anchor={anchor} onClose={onClose} label={`${combatant.name} 상세 정보`} interactive placement="side"
      header={<CombatantIdentityStrip combatant={combatant} levelCap={levelCap} />}>
    <div
      className={['combatant-info', `combatant-info--${side}`].filter(Boolean).join(' ')}
      role="group"
      aria-label={`${combatant.name} 상세 정보`}
    >
      <PassiveAbility combatant={combatant} showState />

      {side !== 'enemy' ? <CombatantStatChart combatant={combatant} /> : null}
      <EquippedItemGrid items={items} />
    </div>
    </BattlePopover>
  )
}

const getStatusBlockMessage = (combatantName, statusType) => {
  switch (statusType) {
    case '혼란':
      return `${combatantName}은(는) 상태이상(혼란)으로 행동할 수 없었다!`
    case '착란':
      return `${combatantName}은(는) 상태이상(착란)으로 행동할 수 없었다!`
    case '마비':
      return `${combatantName}은(는) 상태이상(마비)으로 행동할 수 없었다!`
    case '행동불능':
      return `${combatantName}은(는) 상태이상(행동불능)으로 행동할 수 없었다!`
    case '수면':
      return `${combatantName}은(는) 상태이상(수면)으로 행동할 수 없었다!`
    case '혼수상태':
      return `${combatantName}은(는) 상태이상(혼수상태)으로 행동할 수 없었다!`
    default:
      return `${combatantName}은(는) 상태이상(${statusType ?? '불명'})으로 행동할 수 없었다!`
  }
}

const createStatusEffect = (type) => ({
  type,
  turns: 0,
})

const getSkillData = (skillName, combatant) => {
  const species = combatant?.speciesData ?? allDigimonLookup.get(combatant?.name ?? combatant?.이름)
  return (
    getFinalBossSkillData(skillName, combatant) ?? species?.기술설정?.[skillName] ??
    allSkillLookup.get(skillName) ?? {
      기술명: skillName,
      데미지: 40,
      명중률: '100%',
      분류: '물리형',
      속성: '무',
      상태이상: null,
      상태이상확률: null,
      전체공격: false,
    }
  )
}
const isSkillAreaAttack = (skillData) => skillData?.전체공격 === true
const isSupportSkill = (skillData) => skillData?.분류 === '보조형' || Boolean(skillData?.효과)
const getSkillEffect = (skillData) => skillData?.효과 ?? null
const getSkillRangeLabel = (skillData) =>
  skillData?.대상 ?? (isSkillAreaAttack(skillData) ? '상대 전체' : '상대 1마리')
const getSkillTargetSide = (skillData) => getSkillEffect(skillData)?.targetSide ?? 'enemy'
const getSkillTargetScope = (skillData) =>
  getSkillEffect(skillData)?.scope ?? (isSkillAreaAttack(skillData) ? 'all' : 'single')
const isEnemyTargetSkill = (skillData) => !isSupportSkill(skillData) || getSkillTargetSide(skillData) === 'enemy'
const shouldChooseEnemyTarget = (skillData, livingEnemyCount) =>
  isEnemyTargetSkill(skillData) &&
  getSkillTargetScope(skillData) === 'single' &&
  livingEnemyCount > 1

const getSkillEffectDescription = (skillData) => {
  if (!skillData) {
    return null
  }

  if (skillData.효과설명) {
    return skillData.효과설명
  }

  const effects = []

  if (skillData.전체공격) {
    effects.push('적 전체를 공격합니다.')
  }

  if (skillData.상태이상) {
    const chanceText = skillData.상태이상확률 ? `${skillData.상태이상확률} 확률로 ` : ''
    effects.push(`${chanceText}${skillData.상태이상} 상태이상을 부여합니다.`)
  }

  return effects.length > 0 ? effects.join(' ') : null
}

const getAccuracyValue = (accuracyText) => {
  const numericValue = Number.parseInt(String(accuracyText ?? '100').replace('%', ''), 10)
  return Number.isNaN(numericValue) ? 100 : numericValue
}

const getModifiedAccuracyValue = (skillData, attacker, defender, attackerSide = 'ally') => {
  const baseAccuracy = getAccuracyValue(skillData?.명중률)
  const accuracyBonus =
    attackerSide === 'ally'
      ? Math.min(BATTLE_ACCURACY_ITEM_MAX, getBattleItemCount(attacker, ACCURACY_TARGET_ITEM_ID)) *
        BATTLE_ACCURACY_ITEM_RATE
      : 0
  const accuracyPenalty =
    attackerSide === 'enemy'
      ? Math.min(BATTLE_ACCURACY_ITEM_MAX, getBattleItemCount(defender, CONFUSION_WAVE_ITEM_ID)) *
        BATTLE_ACCURACY_ITEM_RATE
      : 0

  return Math.max(0, Math.min(100, baseAccuracy + accuracyBonus - accuracyPenalty + getPassiveAccuracy(attacker, defender) + getAnomalyAccuracy(attacker, skillData)))
}

const resolveLifeForceEndure = ({ combatant, previousHp, nextHp, canEndure = true }) => {
  const itemCount = Math.min(LIFE_FORCE_MAX, getBattleItemCount(combatant, LIFE_FORCE_ITEM_ID))
  const endureChance = itemCount * LIFE_FORCE_ENDURE_RATE

  if (!canEndure || itemCount <= 0 || previousHp <= 1 || nextHp > 0) {
    return {
      nextHp,
      battleLogs: [],
    }
  }

  if (Math.random() * 100 >= endureChance) {
    return {
      nextHp,
      battleLogs: [],
    }
  }

  return {
    nextHp: 1,
    battleLogs: [`${combatant.name}은(는) 생명의 힘으로 버텼다!`],
  }
}

const resolveBossHpGate = ({ combatant, rawNextHp }) => {
  if ((!combatant?.isBoss && !combatant?.rivalEncounter) || combatant.bossEncounter?.leader === false && !combatant.isBoss ||
    combatant.currentHp <= 0 || rawNextHp >= combatant.currentHp) {
    return { nextCombatant: combatant, nextHp: rawNextHp, battleLogs: [] }
  }
  return resolveSegmentedBossDamage(combatant, rawNextHp)
}

const resolveCombatantDamageHp = ({ combatant, rawNextHp, canEndure = true }) => {
  const gateResult = resolveBossHpGate({ combatant, rawNextHp })
  if (combatant.battleGuards?.endure > 0 && combatant.currentHp > 1 && gateResult.nextHp <= 0) {
    return { nextHp: 1, nextCombatant: { ...gateResult.nextCombatant, currentHp: 1,
      battleGuards: { ...combatant.battleGuards, endure: 0 } },
    battleLogs: [...gateResult.battleLogs, `${combatant.name}은(는) 세이프티 가드로 버텼다!`] }
  }
  const passiveEndure = resolvePassiveEndure(gateResult.nextCombatant, gateResult.nextHp)
  const endureResult = resolveLifeForceEndure({
    combatant: passiveEndure.nextCombatant,
    previousHp: combatant.currentHp,
    nextHp: passiveEndure.nextHp,
    canEndure,
  })

  return {
    nextCombatant: {
      ...passiveEndure.nextCombatant,
      currentHp: endureResult.nextHp,
    },
    nextHp: endureResult.nextHp,
    battleLogs: [...gateResult.battleLogs, ...passiveEndure.battleLogs, ...endureResult.battleLogs],
  }
}

const rollHastePriority = (combatant) => {
  const itemCount = Math.min(HASTE_MAX, getBattleItemCount(combatant, HASTE_ITEM_ID))

  return itemCount > 0 && Math.random() * 100 < itemCount * HASTE_PRIORITY_RATE
}

const rollDeathBoneFlinch = (combatant) => {
  const itemCount = Math.min(DEATH_BONE_MAX, getBattleItemCount(combatant, DEATH_BONE_ITEM_ID))

  return itemCount > 0 && Math.random() * 100 < itemCount * DEATH_BONE_FLINCH_RATE
}

const applyMiracleRubyTurnHealing = ({ party, activeAllyIds }) => {
  let nextParty = [...(party ?? [])]
  const battleLogs = []

  activeAllyIds.forEach((allyId) => {
    const ally = getCombatantById(nextParty, allyId)
    const itemCount = Math.min(MIRACLE_RUBY_MAX, getBattleItemCount(ally, MIRACLE_RUBY_ITEM_ID))

    if (itemCount <= 0 || !isCombatantAbleToBattle(ally) || ally.currentHp >= ally.maxHp) {
      return
    }

    const healAmount = Math.max(1, Math.floor((ally.maxHp * itemCount) / MIRACLE_RUBY_HEAL_DIVISOR))
    const nextAlly = {
      ...ally,
      currentHp: Math.min(ally.maxHp, ally.currentHp + healAmount),
    }

    nextParty = replacePartyMember(nextParty, nextAlly)
    battleLogs.push(`${ally.name}은(는) 기적의루비로 HP를 ${nextAlly.currentHp - ally.currentHp} 회복했다!`)
  })

  return {
    nextParty,
    battleLogs,
  }
}

const getExperienceRatio = (combatant) => {
  if (!combatant?.experienceToNext) {
    return 0
  }

  return Math.max(0, Math.min(100, (combatant.experience / combatant.experienceToNext) * 100))
}

const getLevelUpStatValues = (combatant) => ({
  hp: combatant?.maxHp ?? 0,
  attack: combatant?.attack ?? 0,
  specialAttack: combatant?.specialAttack ?? 0,
  defense: combatant?.defense ?? 0,
  specialDefense: combatant?.specialDefense ?? 0,
  speed: combatant?.speed ?? 0,
})

const getCombatantBattleStatValue = (combatant, statKey) =>
  statKey === 'hp' ? combatant?.maxHp ?? 0 : combatant?.[statKey] ?? 0

const getExperienceToNextLevel = (level) => Math.floor(20 + level * 12)

const createBaseStats = (data) =>
  STAT_KEYS.reduce((result, statKey) => {
    result[statKey] = Math.max(1, data?.[BASE_STAT_FIELD_MAP[statKey]] ?? 50)
    return result
  }, {})

const calculateHpStat = ({ base, level }) =>
  Math.floor((2 * base * level) / 100) + level + 10

const calculateOtherStat = ({ base, level }) =>
  Math.floor((2 * base * level) / 100) + 5

const getBuffMultiplier = (activeBuffs, statKey) =>
  BUFFABLE_STAT_KEYS.includes(statKey) && (activeBuffs?.[statKey] ?? 0) > 0 ? 1.1 : 1

const getBattleStatModifierMultiplier = (statModifiers, statKey) =>
  normalizeBattleStatModifiers(statModifiers)[statKey]?.multiplier ?? 1

const getDigicloneMultiplier = (digiclones, statKey) => {
  const cloneCount = normalizeDigiclones(digiclones)[statKey] ?? 0

  return 1 + cloneCount * 0.06
}

const getCombatantEquippedItems = (combatant) => {
  if (!combatant || combatant.isEgg) return []
  const groups = [
    { items: typeUpRewardItems, field: 'typePowerUps', key: 'typeUpKey', normalize: normalizeTypePowerUps, max: TYPE_POWER_UP_MAX, flag: 'isTypeUp' },
    { items: attributeUpRewardItems, field: 'attributePowerUps', key: 'attributeUpKey', normalize: normalizeAttributePowerUps, max: ATTRIBUTE_POWER_UP_MAX, flag: 'isAttributeUp' },
    { items: digicloneRewardItems, field: 'digiclones', key: 'digicloneKey', normalize: normalizeDigiclones, max: DIGICLONE_MAX, flag: 'isDigiclone' },
    { items: recoveryProgramRewardItems, field: 'recoveryPrograms', key: 'recoveryProgramKey', normalize: normalizeRecoveryPrograms, max: RECOVERY_PROGRAM_MAX, flag: 'isRecoveryProgram' },
    { items: battleItemRewardItems, field: 'battleItems', key: 'battleItemKey', normalize: normalizeBattleItems, max: 0, flag: 'isBattleItem' },
  ]
  return groups.flatMap(group => {
    const counts = group.normalize(combatant[group.field])
    return group.items.flatMap(item => {
      const value = counts[item[group.key]] ?? 0
      if (value <= 0) return []
      const maxCount = item.maxOwnedPerCombatant ?? group.max
      const effectDescription = group.flag === 'isDigiclone'
        ? (STAT_LABEL_MAP[item.digicloneKey] ?? item.name) + ' ' + Math.round((getDigicloneMultiplier(combatant.digiclones, item.digicloneKey) - 1) * 100) + '% 증가'
        : item.description
      return [{ id: item.id, name: item.name, imageUrl: item.imageUrl, effectDescription, value, maxCount,
        description: effectDescription + '\n적용 수량: ' + value + '/' + maxCount,
        isMaxed: maxCount > 0 && value >= maxCount, [group.flag]: true }]
    })
  })
}

const getTypePowerMultiplier = (combatant) => {
  const combatantType = combatant?.type

  if (!combatantType) {
    return 1
  }

  const typePowerUps = normalizeTypePowerUps(combatant.typePowerUps)
  const boostCount = typePowerUps[combatantType] ?? 0

  return 1 + boostCount * 0.08
}

const getAttributePowerMultiplier = (combatant, skillAttribute) => {
  const attributeKey = getAttributePowerUpKey(skillAttribute)

  if (!attributeKey) {
    return 1
  }

  const attributePowerUps = normalizeAttributePowerUps(combatant?.attributePowerUps)
  const boostCount = attributePowerUps[attributeKey] ?? 0

  return 1 + boostCount * 0.05
}

const calculateBattleStats = ({ baseStats, level, activeBuffs, statModifiers, digiclones }) => ({
  maxHp: Math.max(
    1,
    Math.floor(
      calculateHpStat({
        base: baseStats.hp,
        level,
      }) *
        getBuffMultiplier(activeBuffs, 'hp') *
        getBattleStatModifierMultiplier(statModifiers, 'hp') *
        getDigicloneMultiplier(digiclones, 'hp')
    )
  ),
  attack: Math.max(
    1,
    Math.floor(
      calculateOtherStat({
        base: baseStats.attack,
        level,
      }) *
        getBuffMultiplier(activeBuffs, 'attack') *
        getBattleStatModifierMultiplier(statModifiers, 'attack') *
        getDigicloneMultiplier(digiclones, 'attack')
    )
  ),
  defense: Math.max(
    1,
    Math.floor(
      calculateOtherStat({
        base: baseStats.defense,
        level,
      }) *
        getBuffMultiplier(activeBuffs, 'defense') *
        getBattleStatModifierMultiplier(statModifiers, 'defense') *
        getDigicloneMultiplier(digiclones, 'defense')
    )
  ),
  specialAttack: Math.max(
    1,
    Math.floor(
      calculateOtherStat({
        base: baseStats.specialAttack,
        level,
      }) *
        getBuffMultiplier(activeBuffs, 'specialAttack') *
        getBattleStatModifierMultiplier(statModifiers, 'specialAttack') *
        getDigicloneMultiplier(digiclones, 'specialAttack')
    )
  ),
  specialDefense: Math.max(
    1,
    Math.floor(
      calculateOtherStat({
        base: baseStats.specialDefense,
        level,
      }) *
        getBuffMultiplier(activeBuffs, 'specialDefense') *
        getBattleStatModifierMultiplier(statModifiers, 'specialDefense') *
        getDigicloneMultiplier(digiclones, 'specialDefense')
    )
  ),
  speed: Math.max(
    1,
    Math.floor(
      calculateOtherStat({
        base: baseStats.speed,
        level,
      }) *
        getBuffMultiplier(activeBuffs, 'speed') *
        getBattleStatModifierMultiplier(statModifiers, 'speed') *
        getDigicloneMultiplier(digiclones, 'speed')
    )
  ),
})

const getBaseStatTotal = (baseStats) =>
  STAT_KEYS.reduce((total, statKey) => total + (baseStats?.[statKey] ?? 0), 0)

const getDigimonStageRank = getSpeciesStageRank

// Permanent training only: battle boosts, debuffs and remaining HP cannot unlock evolution.
const getEvolutionTrainingStats = (combatant) => calculateBattleStats({
  baseStats: combatant?.baseStats ?? createBaseStats(combatant?.speciesData),
  level: combatant?.level ?? 1,
  activeBuffs: {}, statModifiers: {}, digiclones: combatant?.digiclones ?? {},
})

const getEvolutionRequirements = (targetData, combatant = null, route = null) => {
  if (targetData?.stage === '유아기') return []
  const level = route?.level ?? Number(targetData?.진화조건?.레벨 ?? EVOLUTION_LEVELS[targetData?.stage] ?? 65)
  const requirements = [{ key: 'level', label: '레벨', current: unit => unit?.level ?? 0, required: level }]
  if (!combatant || route?.kind !== 'level' || getDigimonStageRank(targetData?.stage) < 2) return requirements
  const labels = { hp: '육성 체력', attack: '육성 공격', defense: '육성 방어', specialAttack: '육성 특공', specialDefense: '육성 특방', speed: '육성 스피드' }
  const baseStats = combatant.baseStats ?? createBaseStats(combatant.speciesData)
  // Fixed source-form thresholds. Extra levels or permanent DigiClones can meet every branch.
  for (const key of evolutionTrainingProfiles[targetData.이름]?.stats ?? []) {
    const baseline = key === 'hp'
      ? calculateHpStat({ base: baseStats[key], level })
      : calculateOtherStat({ base: baseStats[key], level })
    requirements.push({ key, label: labels[key], current: unit => getEvolutionTrainingStats(unit)[key === 'hp' ? 'maxHp' : key],
      required: getTrainerEvolutionRequirement(combatant.trainerSkills, baseline + Math.max(1, Math.ceil(level / 15))) })
  }
  return requirements
}

const getEvolutionOptions = (combatant, inventory = {}, party = [], evolutionMemory = []) => {
  if (!combatant?.speciesData?.진화가능?.length) {
    return []
  }

  return combatant.speciesData.진화가능
    .map((targetName) => allDigimonLookup.get(targetName))
    .filter((targetData) => targetData && isPlayableDigimon(targetData))
    .filter((targetData) => targetData.이름 !== combatant.name)
    .flatMap((targetData) => {
      const route = getEvolutionRoute(combatant.name, targetData.이름, targetData.stage)
      if (!route) return []
      const itemRequirement = itemEvolutionRewardItemByTarget.get(targetData.이름) ?? null
      const itemWaived = Boolean((itemRequirement || route.recipe) && hasTrainerEvolutionMemory(combatant.trainerSkills) &&
        hasEvolutionMemory(evolutionMemory, route.recipe?.materials ?? [combatant.name], targetData.이름))
      const jogressMembers = route.recipe ? getJogressEvolutionMembers(combatant, party, route.recipe) : []
      const requirements = getEvolutionRequirements(targetData, combatant, route).map((requirement) => {
        const currentValue = requirement.current(combatant)

        return {
          key: requirement.key,
          label: requirement.label,
          current: currentValue,
          required: requirement.required,
          isMet: currentValue >= requirement.required,
        }
      })
      if (itemRequirement) requirements.push({ key: 'item', label: itemRequirement.name,
        current: inventory[itemRequirement.id] ?? 0, required: 1, isMet: itemWaived || (inventory[itemRequirement.id] ?? 0) > 0, waived: itemWaived })
      if (route.recipe) {
        const partners = route.recipe.materials.filter(name => name !== combatant.name)
        for (const name of partners) {
          const level = Math.max(0, ...party.filter(member => member.id !== combatant.id && member.name === name && !isCombatantEgg(member)).map(member => member.level ?? 0))
          requirements.push({ key: `partner-${name}`, label: name, current: level, required: route.level, isMet: level >= route.level })
        }
      }
      return {
        targetData,
        evolutionType: route.kind === 'level' ? 'stat' : route.kind,
        method: route.method,
        recipe: route.recipe,
        itemRequirement,
        itemWaived,
        partnerIds: jogressMembers.slice(1).map(member => member.id),
        itemCount: itemRequirement ? inventory[itemRequirement.id] ?? 0 : 0,
        requirements,
        // Remembered Jogress still consumes every correctly leveled material Digimon.
        canEvolve: (route.kind !== 'jogress' || (itemWaived && jogressMembers.length === route.recipe.materials.length)) && requirements.every((requirement) => requirement.isMet),
        conditionsMet: requirements.every((requirement) => requirement.isMet),
      }
    })
}

const getReadyEvolutionPreviewTargets = (combatant, inventory = {}, party = [], evolutionMemory = []) =>
  getEvolutionOptions(combatant, inventory, party, evolutionMemory)
    .filter((option) => option.canEvolve)
    .map((option) => ({
      name: option.targetData.이름,
      stage: option.targetData.stage,
      imageUrl: option.targetData.imageUrl,
    }))

// Keep the player's selected inheritance when a later form adds its own moves.
const carryEvolutionInheritance = (previous, next) => {
  if (!previous.inheritedSkills?.length && !previous.pendingJogressSkills?.length) return {}
  const inheritedSkills = normalizeInheritedSkills([...(previous.inheritedSkills ?? []), ...(previous.pendingJogressSkills ?? [])])
  const selected = (previous.skills ?? []).filter(name => inheritedSkills.includes(name))
  const candidates = [...new Set([...selected, ...next.skills])]
  const skills = candidates.slice(0, MAX_COMBATANT_SKILL_COUNT)
  const pendingJogressSkills = normalizeInheritedSkills([...(previous.pendingJogressSkills ?? []), ...candidates.slice(MAX_COMBATANT_SKILL_COUNT)])
    .filter(name => !skills.includes(name))
  return { skills, pendingJogressSkills, inheritedSkills: inheritedSkills.filter(name => skills.includes(name) || pendingJogressSkills.includes(name)) }
}

const createEvolvedCombatant = (combatant, targetData) => {
  if (!combatant || !targetData || (!combatant.isBoss && !isPlayableDigimon(targetData))) {
    return combatant
  }

  const hpRatio = combatant.maxHp > 0 ? combatant.currentHp / combatant.maxHp : 1
  const evolvedCombatant = createCombatant({
    id: combatant.id,
    name: targetData.이름,
    imageUrl: targetData.imageUrl ?? '',
    data: targetData,
    level: combatant.level,
    experience: combatant.experience,
    activeBuffs: combatant.activeBuffs,
    statModifiers: combatant.statModifiers,
    typePowerUps: combatant.typePowerUps,
    attributePowerUps: combatant.attributePowerUps,
    digiclones: combatant.digiclones,
    recoveryPrograms: combatant.recoveryPrograms,
    battleItems: combatant.battleItems,
    inheritedSkills: normalizeInheritedSkills(combatant.inheritedSkills).filter(name => combatant.skills?.includes(name)),
    trainerSkills: combatant.trainerSkills,
    passiveState: combatant.passiveState,
    statusEffect: combatant.statusEffect,
    stageName: targetData.stage,
  })

  return {
    ...evolvedCombatant,
    ...carryEvolutionInheritance(combatant, evolvedCombatant),
    battleMap: combatant.battleMap,
    battleAnomaly: combatant.battleAnomaly,
    currentHp:
      combatant.currentHp <= 0
        ? 0
        : Math.max(1, Math.min(evolvedCombatant.maxHp, Math.floor(evolvedCombatant.maxHp * hpRatio))),
    evolutionHistory: [...(combatant.evolutionHistory ?? []), combatant.name],
  }
}

const resolveManualEvolution = (gameState, memberId, targetName, rewardState = null, partnerIds = null) => {
  if (!gameState || rewardState?.isResolving || rewardState?.pendingTarget) return null
  const currentParty = syncPartyMember(gameState.party, gameState.player)
  const selectedMember = getCombatantById(currentParty, memberId)
  const selectedOption = getEvolutionOptions(selectedMember, gameState.inventory, currentParty, gameState.evolutionMemory)
    .find(option => option.targetData.이름 === targetName)
  if (!selectedMember || !selectedOption?.canEvolve) return null

  if (selectedOption.recipe) {
    const members = getJogressEvolutionMembers(selectedMember, currentParty, selectedOption.recipe, partnerIds)
    return members.length ? resolveJogressEvolution(gameState, members, selectedOption.recipe, false, rewardState) : null
  }

  const evolvedMember = createEvolvedCombatant(selectedMember, selectedOption.targetData)
  const nextParty = replacePartyMember(currentParty, evolvedMember)
  const nextInventory = selectedOption.itemRequirement && !selectedOption.itemWaived
    ? removeInventoryItem(gameState.inventory, selectedOption.itemRequirement.id) : gameState.inventory
  const nextPlayer = getCombatantById(nextParty, gameState.player?.id)
    ?? getFirstLivingPartyMember(nextParty, gameState.activeAllyIds) ?? evolvedMember
  return { selectedMember, evolvedMember, nextGameState: {
    ...gameState,
    inventory: nextInventory,
    player: nextPlayer,
    party: nextParty,
    evolutionMemory: selectedOption.itemRequirement && !selectedOption.itemWaived
      ? rememberItemEvolution(gameState.evolutionMemory, [selectedMember.name], targetName) : normalizeEvolutionMemory(gameState.evolutionMemory),
    rewardCheckpoint: rewardState ? createRewardCheckpoint(rewardState, gameState.currentStage) : gameState.rewardCheckpoint,
  } }
}

const resolveJogressEvolution = (gameState, members, recipe, usedChip = false, rewardState = null) => {
  if (!gameState || !recipe || !Array.isArray(members)) return null
  const currentParty = syncPartyMember(gameState.party, gameState.player)
  const currentMembers = members.map(member => getCombatantById(currentParty, member?.id)).filter(Boolean)
  if (currentMembers.length !== members.length) return null
  const currentRecipe = getJogressRecipeForMembers(currentMembers)
  if (currentRecipe?.targetName !== recipe.targetName) return null
  recipe = currentRecipe
  members = currentMembers
  const targetData = allDigimonLookup.get(recipe.targetName)
  if (!targetData || !isPlayableDigimon(targetData)) return null
  const [selectedMember, ...partners] = members
  if (!usedChip && (!hasTrainerEvolutionMemory(selectedMember.trainerSkills) || !hasEvolutionMemory(gameState.evolutionMemory, recipe.materials, recipe.targetName))) return null
  const evolvedMember = createJogressCombatant(selectedMember, partners, targetData)
  const partnerIds = new Set(partners.map(member => member.id))
  const materialIds = new Set(members.map(member => member.id))
  const nextParty = currentParty.filter(member => !partnerIds.has(member.id)).map(member => member.id === selectedMember.id ? evolvedMember : member)
  const nextPlayer = materialIds.has(gameState.player?.id) ? evolvedMember
    : getCombatantById(nextParty, gameState.player?.id) ?? getFirstLivingPartyMember(nextParty, gameState.activeAllyIds) ?? evolvedMember
  return { selectedMember, evolvedMember, fromMembers: members, nextGameState: { ...gameState, party: nextParty, player: nextPlayer,
    activeAllyIds: getActiveAllyIdsForParty(nextParty, (gameState.activeAllyIds ?? []).filter(id => !partnerIds.has(id)), getBattleAllyLimit(gameState)),
    evolutionMemory: usedChip ? rememberItemEvolution(gameState.evolutionMemory, recipe.materials, recipe.targetName) : normalizeEvolutionMemory(gameState.evolutionMemory),
    rewardCheckpoint: rewardState ? createRewardCheckpoint(rewardState, gameState.currentStage) : gameState.rewardCheckpoint,
  } }
}

const createJogressCombatant = (primaryCombatant, partnerCombatants, targetData) => {
  const materialCombatants = [
    primaryCombatant,
    ...(Array.isArray(partnerCombatants) ? partnerCombatants : [partnerCombatants]),
  ].filter(Boolean)

  if (!primaryCombatant || materialCombatants.length <= 1 || !targetData || !isPlayableDigimon(targetData)) {
    return primaryCombatant
  }

  const hpRatio = Math.max(
    0,
    Math.min(
      1,
      materialCombatants.reduce(
        (total, combatant) => total + (combatant.maxHp > 0 ? combatant.currentHp / combatant.maxHp : 1),
        0
      ) / materialCombatants.length
    )
  )
  const level = Math.max(1, Math.floor(materialCombatants.reduce((total, member) => total + (member.level ?? 1), 0) / materialCombatants.length))
  // Reuse each existing normalizer for both valid keys and the per-item stack limit.
  const mergeEquipment = (field, normalize) => normalize(materialCombatants.reduce((counts, member) => {
    for (const [key, value] of Object.entries(normalize(member[field]))) {
      counts[key] = (counts[key] ?? 0) + (Number.isFinite(value) ? value : 0)
    }
    return counts
  }, {}))
  const inheritedSkills = normalizeInheritedSkills(materialCombatants.flatMap(member =>
    (member.skills ?? []).filter(name => !member.speciesData?.기술?.includes(name))))
  const allSkills = [...new Set([...(targetData.기술 ?? []), ...inheritedSkills, ...getDigimonSkillNamesForLevel(targetData, level)])]
  const experienceRatio = materialCombatants.reduce((total, member) => total +
    Math.max(0, Math.min(1, (member.experience ?? 0) / Math.max(1, member.experienceToNext ?? 1))), 0) / materialCombatants.length
  const jogressCombatant = createCombatant({
    id: primaryCombatant.id,
    name: targetData.이름,
    imageUrl: targetData.imageUrl ?? '',
    data: targetData,
    level,
    experience: 0,
    inheritedSkills,
    activeBuffs: primaryCombatant.activeBuffs,
    statModifiers: primaryCombatant.statModifiers,
    typePowerUps: mergeEquipment('typePowerUps', normalizeTypePowerUps),
    attributePowerUps: mergeEquipment('attributePowerUps', normalizeAttributePowerUps),
    digiclones: mergeEquipment('digiclones', normalizeDigiclones),
    recoveryPrograms: mergeEquipment('recoveryPrograms', normalizeRecoveryPrograms),
    battleItems: mergeEquipment('battleItems', normalizeBattleItems),
    trainerSkills: primaryCombatant.trainerSkills,
    passiveState: mergePassiveStates(materialCombatants),
    statusEffect: null,
    stageName: targetData.stage,
  })

  return {
    ...jogressCombatant,
    battleMap: primaryCombatant.battleMap,
    battleAnomaly: primaryCombatant.battleAnomaly,
    experience: Math.min(jogressCombatant.experienceToNext - 1, Math.floor(jogressCombatant.experienceToNext * experienceRatio)),
    pendingJogressSkills: allSkills.filter(name => !jogressCombatant.skills.includes(name)),
    currentHp: Math.max(1, Math.min(jogressCombatant.maxHp, Math.floor(jogressCombatant.maxHp * hpRatio))),
    evolutionHistory: [...(primaryCombatant.evolutionHistory ?? []), primaryCombatant.name],
  }
}

const getEvolutionReturnTargetName = (combatant) => {
  const history = Array.isArray(combatant?.evolutionHistory) ? combatant.evolutionHistory : []

  return history.length > 0 ? history[history.length - 1] : null
}

const canReturnEvolution = (combatant) => {
  const targetName = getEvolutionReturnTargetName(combatant)

  return Boolean(targetName && allDigimonLookup.has(targetName) && isPlayableDigimon(targetName))
}

const createReturnedEvolutionCombatant = (combatant) => {
  const targetName = getEvolutionReturnTargetName(combatant)
  const targetData = targetName ? allDigimonLookup.get(targetName) : null

  if (!combatant || !targetData || !isPlayableDigimon(targetData)) {
    return combatant
  }

  const hpRatio = combatant.maxHp > 0 ? combatant.currentHp / combatant.maxHp : 1
  const nextHistory = (combatant.evolutionHistory ?? []).slice(0, -1)
  const returnedCombatant = createCombatant({
    id: combatant.id,
    name: targetData.이름,
    imageUrl: targetData.imageUrl ?? '',
    data: targetData,
    level: combatant.level,
    experience: combatant.experience,
    activeBuffs: combatant.activeBuffs,
    statModifiers: combatant.statModifiers,
    typePowerUps: combatant.typePowerUps,
    attributePowerUps: combatant.attributePowerUps,
    digiclones: combatant.digiclones,
    recoveryPrograms: combatant.recoveryPrograms,
    battleItems: combatant.battleItems,
    inheritedSkills: normalizeInheritedSkills(combatant.inheritedSkills).filter(name => combatant.skills?.includes(name)),
    trainerSkills: combatant.trainerSkills,
    passiveState: combatant.passiveState,
    statusEffect: combatant.statusEffect,
    stageName: targetData.stage,
  })

  return {
    ...returnedCombatant,
    ...carryEvolutionInheritance(combatant, returnedCombatant),
    currentHp:
      combatant.currentHp <= 0
        ? 0
        : Math.max(1, Math.min(returnedCombatant.maxHp, Math.floor(returnedCombatant.maxHp * hpRatio))),
    evolutionHistory: nextHistory,
  }
}

const createCombatant = ({
  id,
  name,
  imageUrl,
  data,
  level = STARTING_PLAYER_LEVEL,
  currentHp,
  experience = 0,
  activeBuffs,
  statModifiers,
  typePowerUps,
  attributePowerUps,
  digiclones,
  recoveryPrograms,
  battleItems,
  inheritedSkills,
  trainerSkills,
  passiveState,
  statusEffect,
  stageName,
}) => {
  const baseStats = createBaseStats(data)
  const resolvedActiveBuffs = normalizeBuffState(activeBuffs)
  const resolvedStatModifiers = normalizeBattleStatModifiers(statModifiers)
  const resolvedTypePowerUps = normalizeTypePowerUps(typePowerUps)
  const resolvedAttributePowerUps = normalizeAttributePowerUps(attributePowerUps)
  const resolvedDigiclones = normalizeDigiclones(digiclones)
  const resolvedRecoveryPrograms = normalizeRecoveryPrograms(recoveryPrograms)
  const resolvedBattleItems = normalizeBattleItems(battleItems)
  const resolvedInheritedSkills = normalizeInheritedSkills(inheritedSkills)
  const speciesPassive = getDigimonPassive(name)
  const resolvedStatusEffect = speciesPassive?.statusImmunities?.includes(statusEffect?.type) ? null : normalizeStatusEffect(statusEffect)
  const resolvedTrainerSkills = normalizeTrainerRanks(trainerSkills)
  const battleStats = applyTrainerStats(calculateBattleStats({
    baseStats,
    level,
    activeBuffs: resolvedActiveBuffs,
    statModifiers: resolvedStatModifiers,
    digiclones: resolvedDigiclones,
  }), resolvedTrainerSkills, { ...data, stage: stageName ?? data?.stage })

  return {
    id,
    name,
    imageUrl: imageUrl ?? '',
    imageName: data?.imageName ?? data?.이미지명 ?? name,
    speciesData: data,
    speciesStage: stageName ?? data?.stage ?? null,
    passiveId: getDigimonPassiveId(name),
    passiveState: hydrateDigimonPassive({ name, passiveState }).passiveState,
    baseStats,
    activeBuffs: resolvedActiveBuffs,
    statModifiers: resolvedStatModifiers,
    typePowerUps: resolvedTypePowerUps,
    attributePowerUps: resolvedAttributePowerUps,
    digiclones: resolvedDigiclones,
    recoveryPrograms: resolvedRecoveryPrograms,
    battleItems: resolvedBattleItems,
    trainerSkills: resolvedTrainerSkills,
    ...(resolvedInheritedSkills.length ? { inheritedSkills: resolvedInheritedSkills } : {}),
    statusEffect: resolvedStatusEffect,
    level,
    experience,
    experienceToNext: getExperienceToNextLevel(level),
    currentHp: currentHp ?? battleStats.maxHp,
    maxHp: battleStats.maxHp,
    baseStatTotal: getBaseStatTotal(baseStats),
    type: data?.타입 ?? '무',
    attribute: data?.속성 ?? '무',
    size: normalizeDigimonSize(data?.크기),
    attack: battleStats.attack,
    specialAttack: battleStats.specialAttack,
    defense: battleStats.defense,
    specialDefense: battleStats.specialDefense,
    speed: battleStats.speed,
    skills: [...new Set([...(data?.기술 ?? []), ...resolvedInheritedSkills, ...getDigimonSkillNamesForLevel(data, level)])].slice(0, MAX_COMBATANT_SKILL_COUNT),
    balanceRevision: BALANCE_REVISION,
    skillCooldowns: {},
    battleGuards: {},
  }
}

const createDigiEggCombatant = ({
  id,
  eggName,
  hatchPool = [],
  trainerSkills = {},
  stagesRemaining = DIGI_EGG_HATCH_STAGE_COUNT + 1,
  townSupport,
}) => ({
  id,
  isEgg: true,
  trainerSkills: normalizeTrainerRanks(trainerSkills),
  eggName,
  eggHatchPool: hatchPool.filter(isPlayableDigimon),
  eggStagesRemaining: getTownEggStages(stagesRemaining, townSupport),
  name: `${eggName} 디지에그`,
  imageUrl: `/아이템/디지에그/${eggName}.png`,
  speciesData: null,
  speciesStage: DIGI_EGG_STAGE,
  baseStats: createBaseStats(null),
  activeBuffs: normalizeBuffState(null),
  statModifiers: normalizeBattleStatModifiers(null),
  typePowerUps: normalizeTypePowerUps(null),
  attributePowerUps: normalizeAttributePowerUps(null),
  digiclones: normalizeDigiclones(null),
  recoveryPrograms: normalizeRecoveryPrograms(null),
  battleItems: normalizeBattleItems(null),
  statusEffect: null,
  level: 1,
  experience: 0,
  experienceToNext: getExperienceToNextLevel(1),
  currentHp: 0,
  maxHp: 1,
  baseStatTotal: 0,
  type: '무',
  attribute: '무',
  attack: 0,
  specialAttack: 0,
  defense: 0,
  specialDefense: 0,
  speed: 0,
  skills: [],
})

const hatchDigiEggCombatant = (combatant, inventory = {}) => {
  const currentEgg = digiEggData.find(egg => egg.이름 === combatant?.eggName)
  const hatchPool = (currentEgg?.부화가능 ?? combatant?.eggHatchPool ?? []).filter((name) => allDigimonLookup.has(name) && isPlayableDigimon(name))

  if (!combatant || !hatchPool.length) {
    return {
      nextCombatant: combatant,
      hatchLogs: [],
    }
  }

  const hatchName = shuffleItems(hatchPool)[0]
  const targetData = allDigimonLookup.get(hatchName)

  return {
    nextCombatant: createCombatant({
      id: combatant.id,
      name: hatchName,
      imageUrl: targetData?.imageUrl ?? combatant.imageUrl,
      data: targetData,
      level: getItemHatchLevel(inventory, DIGI_EGG_HATCH_LEVEL),
      trainerSkills: combatant.trainerSkills,
      stageName: targetData?.stage ?? null,
    }),
    hatchLogs: [`${combatant.name}가 ${hatchName}(으)로 부화했다!`,
      ...(inventory['digivice-ic'] > 0 ? ['디지바이스 iC의 육성 지원으로 부화 레벨이 3 높아졌다!'] : [])],
  }
}

const progressDigiEggPartyByStage = (party, inventory = {}) => {
  const currentParty = party ?? []
  const hatchLogs = []

  const nextParty = currentParty.map((member) => {
    if (!isCombatantEgg(member)) {
      return member
    }

    const nextRemaining = Math.max(0, (member.eggStagesRemaining ?? DIGI_EGG_HATCH_STAGE_COUNT) - 1)

    if (nextRemaining > 0) {
      return {
        ...member,
        eggStagesRemaining: nextRemaining,
      }
    }

    const hatchResult = hatchDigiEggCombatant(member, inventory)
    hatchLogs.push(...hatchResult.hatchLogs)
    return hatchResult.nextCombatant
  })

  return {
    nextParty,
    hatchLogs,
  }
}

const getEnemyLevelRangeForStage = (stage, gameMode = 'classic') => getStageEnemyLevelRange(stage, gameMode)

const getEnemyLevelForStage = (stage, gameMode = 'classic', ordinary = false, roll = Math.random()) => {
  const safeStage = isEndlessMode(gameMode) ? Math.max(stage, 1) : Math.min(Math.max(stage, 1), TOTAL_STAGE_COUNT)
  const [minimumLevel, maximumLevel] = ordinary ? getWildEnemyLevelRange(safeStage, gameMode) : getEnemyLevelRangeForStage(safeStage, gameMode)
  const stageProgress = ((safeStage - 1) % STAGES_PER_MAP) / Math.max(1, STAGES_PER_MAP - 1)
  const levelSpan = Math.max(0, maximumLevel - minimumLevel)
  const scaledLevel = minimumLevel + levelSpan * stageProgress
  const variance = Math.max(1, Math.floor(levelSpan * 0.18))
  const progressiveMinimum = Math.max(minimumLevel, Math.floor(scaledLevel) - variance)
  const progressiveMaximum = Math.min(maximumLevel, Math.ceil(scaledLevel) + variance)

  return progressiveMinimum + Math.floor(roll * (progressiveMaximum - progressiveMinimum + 1))
}

const getBossLevelForStage = (stage, gameMode = 'classic') => Math.max(1, getEnemyLevelRangeForStage(stage, gameMode)[1] - (isHardMode(gameMode) ? 0 : stage <= 50 ? 4 : 2))

const getExperienceReward = (enemy) =>
  Math.max(
    18,
    Math.floor(
      (enemy.level * 10 + enemy.baseStatTotal * 0.08) *
        (enemy.isBoss ? 1.6 : 1) * getAdventureExperienceMultiplier(enemy.enemyStage ?? enemy.bossStage ?? 1)
    )
  )

const getInventoryItemCount = (inventory, itemId) =>
  Math.max(0, Math.floor(inventory?.[itemId] ?? 0))

const getEvoluterLevelUpAmount = (inventory = {}, baseAmount = 1) =>
  Math.max(1, baseAmount) +
  Math.min(EVOLUTER_UP_MAX, getInventoryItemCount(inventory, EVOLUTER_UP_ITEM_ID))

const getRewardItemWithInventoryModifiers = (item, inventory = {}) => {
  if (!item) {
    return item
  }

  if (item.levelUpAmount) {
    return {
      ...item,
      levelUpAmount: getEvoluterLevelUpAmount(inventory, item.levelUpAmount),
    }
  }

  if (item.partyLevelUpAmount) {
    return {
      ...item,
      partyLevelUpAmount: getEvoluterLevelUpAmount(inventory, item.partyLevelUpAmount),
    }
  }

  return item
}

const getBattleItemCount = (combatant, itemId) =>
  Math.max(0, Math.floor(normalizeBattleItems(combatant?.battleItems)[itemId] ?? 0))

const getExperienceMultiplier = (inventory = {}) =>
  1 +
  getInventoryItemCount(inventory, EXP_BOOSTER_ITEM_ID) * 0.1 +
  getInventoryItemCount(inventory, EXP_BOOSTER_PLUS_ITEM_ID) * 0.25

const getBoostedExperienceAmount = (baseExperience, inventory = {}) =>
  Math.max(1, Math.floor(baseExperience * getExperienceMultiplier(inventory)))

const getLivingEnemyIndex = (enemies) => enemies.findIndex((enemy) => enemy.currentHp > 0)

// Scripted enemies keep their existing targeting. Ordinary wildlife commits to
// the same visible matchup/defense evaluation used to choose its technique.
const getEnemySkillTarget = (enemy, skillData, opponents) => {
  if (enemy.isBoss || enemy.rivalEncounter || enemy.specialQuest || enemy.bossEncounter) {
    return getFinalBossTarget(enemy, opponents) ?? getRandomCombatant(opponents)?.id ?? null
  }
  return chooseSkillTarget(enemy, skillData, opponents, (actor, skill, target) =>
    getMatchupResult({ attackerType: actor.type, skillAttribute: skill.속성,
      defenderType: target.type, defenderAttribute: target.attribute }).multiplier)?.id ?? null
}

const getRandomEnemySkill = (enemy, allies = [enemy], opponents = []) => {
  if (!enemy) return null
  const finalMove = getFinalBossMove(enemy)
  if (finalMove) return finalMove.skill.기술명
  const options = getCommandSkillNames(enemy, name => getSkillData(name, enemy))
    .filter(name => isBossSkillAllowed(enemy, getSkillData(name, enemy))).map(name => ({ name,
    score: scoreSkill(enemy, getSkillData(name, enemy), allies, opponents, (actor, skill, target) =>
      getMatchupResult({ attackerType: actor.type, skillAttribute: skill.속성,
        defenderType: target.type, defenderAttribute: target.attribute }).multiplier) }))
    .filter(option => getSkillCooldown(enemy, getSkillData(option.name, enemy)) === 0)
  const best = Math.max(0, ...options.map(option => option.score))
  const candidates = options.filter(option => best === 0 || option.score >= best * 0.8)
  return candidates[Math.floor(Math.random() * candidates.length)]?.name ?? null
}

const refreshCombatantStats = (
  combatant,
  {
    level = combatant.level,
    activeBuffs = combatant.activeBuffs,
    statModifiers = combatant.statModifiers,
    digiclones = combatant.digiclones,
    statusEffect = combatant.statusEffect,
    preserveMaxHpDelta = false,
  } = {}
) => {
  const battleStats = applyTrainerStats(calculateBattleStats({
    baseStats: combatant.baseStats,
    level,
    activeBuffs,
    statModifiers,
    digiclones,
  }), combatant.trainerSkills, combatant)
  const difficulty = getEnemyDifficultyModifiers(combatant)
  const statMultiplier = difficulty.stats
  const resolvedBattleStats = {
    maxHp: Math.max(1, Math.floor(battleStats.maxHp * difficulty.hp)),
    attack: Math.max(1, Math.floor(battleStats.attack * statMultiplier)),
    specialAttack: Math.max(1, Math.floor(battleStats.specialAttack * statMultiplier)),
    defense: Math.max(1, Math.floor(battleStats.defense * statMultiplier)),
    specialDefense: Math.max(1, Math.floor(battleStats.specialDefense * statMultiplier)),
    speed: battleStats.speed,
  }
  const maxHpDelta = resolvedBattleStats.maxHp - combatant.maxHp

  return {
    ...cleanCombatantFields(combatant),
    activeBuffs: normalizeBuffState(activeBuffs),
    statModifiers: normalizeBattleStatModifiers(statModifiers),
    digiclones: normalizeDigiclones(digiclones),
    statusEffect: getDigimonPassive(combatant)?.statusImmunities?.includes(statusEffect?.type) ? null : normalizeStatusEffect(statusEffect),
    level,
    experienceToNext: getExperienceToNextLevel(level),
    currentHp: combatant.currentHp <= 0 ? 0 : preserveMaxHpDelta
      ? Math.max(1, Math.min(resolvedBattleStats.maxHp, combatant.currentHp + maxHpDelta))
      : Math.min(resolvedBattleStats.maxHp, combatant.currentHp),
    maxHp: resolvedBattleStats.maxHp,
    attack: resolvedBattleStats.attack,
    specialAttack: resolvedBattleStats.specialAttack,
    defense: resolvedBattleStats.defense,
    specialDefense: resolvedBattleStats.specialDefense,
    speed: resolvedBattleStats.speed,
    skills: mergeCombatantSkillNamesForLevel(combatant, level),
  }
}

const levelUpCombatant = (combatant, nextLevel) => {
  return refreshCombatantStats(combatant, {
    level: nextLevel,
    preserveMaxHpDelta: true,
  })
}

const applyDigicloneRewardEffect = (combatant, digicloneKey) => {
  if (!combatant || !digicloneKey) {
    return combatant
  }

  const nextDigiclones = normalizeDigiclones(combatant.digiclones)
  nextDigiclones[digicloneKey] = Math.min(DIGICLONE_MAX, (nextDigiclones[digicloneKey] ?? 0) + 1)
  const nextCombatant = refreshCombatantStats(combatant, {
    digiclones: nextDigiclones,
    preserveMaxHpDelta: true,
  })

  return {
    ...nextCombatant,
    currentHp: combatant.currentHp <= 0 ? 0 : nextCombatant.currentHp,
  }
}

const applyRecoveryProgramRewardEffect = (combatant, recoveryProgramKey) => {
  if (!combatant || !recoveryProgramKey) {
    return combatant
  }

  const nextRecoveryPrograms = normalizeRecoveryPrograms(combatant.recoveryPrograms)
  nextRecoveryPrograms[recoveryProgramKey] = Math.min(
    RECOVERY_PROGRAM_MAX,
    (nextRecoveryPrograms[recoveryProgramKey] ?? 0) + 1
  )

  return {
    ...combatant,
    recoveryPrograms: nextRecoveryPrograms,
  }
}

const applyBattleItemRewardEffect = (combatant, battleItemKey) => {
  if (!combatant || !battleItemKey) {
    return combatant
  }

  const battleItem = BATTLE_ITEM_REWARD_ITEMS.find((item) => item.battleItemKey === battleItemKey)
  const nextBattleItems = normalizeBattleItems(combatant.battleItems)
  nextBattleItems[battleItemKey] = Math.min(
    battleItem?.maxOwnedPerCombatant ?? 0,
    (nextBattleItems[battleItemKey] ?? 0) + 1
  )

  return {
    ...combatant,
    battleItems: nextBattleItems,
  }
}

const applyLevelUpRewardEffect = (combatant, levelUpAmount = 1, levelCap = Infinity) => {
  if (!combatant || combatant.level >= levelCap) {
    return combatant
  }

  const nextLevel = Math.min(levelCap, combatant.level + Math.max(1, levelUpAmount))
  const leveledCombatant = levelUpCombatant(combatant, nextLevel)

  return {
    ...leveledCombatant,
    currentHp: combatant.currentHp <= 0 ? 0 : leveledCombatant.currentHp,
    experience: 0,
  }
}

const clearStatusEffect = (combatant) =>
  refreshCombatantStats(combatant, { statusEffect: null })

const clearReactiveStatusOnHit = (combatant) => {
  const normalizedStatus = normalizeStatusEffect(combatant.statusEffect)
  const statusDefinition = getStatusEffectDefinition(normalizedStatus?.type)

  if (!normalizedStatus || !statusDefinition?.curesOnHit) {
    return {
      nextCombatant: combatant,
      battleLogs: [],
    }
  }

  return {
    nextCombatant: clearStatusEffect(combatant),
    battleLogs: [`${combatant.name}의 ${statusDefinition.label} 상태가 공격을 받고 풀렸다!`],
  }
}

const resolveTurnStartStatus = (combatant) => {
  const normalizedStatus = normalizeStatusEffect(combatant.statusEffect)
  const statusDefinition = getStatusEffectDefinition(normalizedStatus?.type)

  if (!normalizedStatus || !statusDefinition) {
    return {
      nextCombatant: combatant,
      canAct: true,
      battleLogs: [],
    }
  }

  if (statusDefinition.actionSuccessRate == null) {
    return {
      nextCombatant: combatant,
      canAct: true,
      battleLogs: [],
    }
  }

  if (Math.random() < statusDefinition.actionSuccessRate) {
    return {
      nextCombatant: combatant,
      canAct: true,
      battleLogs: [],
    }
  }

  return {
    nextCombatant: combatant,
    canAct: false,
    battleLogs: [getStatusBlockMessage(combatant.name, normalizedStatus.type)],
    blockedStatus: normalizedStatus.type,
  }
}

const resolveTurnEndStatus = (
  combatant,
  { side = 'enemy', skipEndTurnDamage = false } = {}
) => {
  const normalizedStatus = normalizeStatusEffect(combatant.statusEffect)
  const statusDefinition = getStatusEffectDefinition(normalizedStatus?.type)

  if (!normalizedStatus || !statusDefinition) {
    return {
      nextCombatant: combatant,
      battleLogs: [],
    }
  }

  let nextCombatant = combatant
  const battleLogs = []

  if (
    statusDefinition.endTurnDamageRatio &&
    nextCombatant.currentHp > 0 &&
    !skipEndTurnDamage
  ) {
    const previousHp = nextCombatant.currentHp
    const damage = Math.max(1, Math.floor(nextCombatant.maxHp * statusDefinition.endTurnDamageRatio * (nextCombatant.isBoss ? 0.5 : 1) * getItemStatusDamageMultiplier(nextCombatant) * getPassiveStatusDamageMultiplier(nextCombatant)))
    if (getPassiveStatusDamageMultiplier(nextCombatant) < 1) battleLogs.push(passiveLog(nextCombatant, '상태이상 피해가 감소했다!'))
    if (hasAdventureItem(nextCombatant, 'crest-purity')) battleLogs.push(`${nextCombatant.name}의 순수의 문장이 상태이상 피해를 줄였다!`)
    const rawNextHp = Math.max(0, nextCombatant.currentHp - damage)
    const hpResult = resolveCombatantDamageHp({
      combatant: nextCombatant,
      rawNextHp,
      canEndure: side === 'ally',
    })
    const nextHp = hpResult.nextHp
    const appliedDamage = Math.max(0, previousHp - nextHp)
    nextCombatant = hpResult.nextCombatant
    battleLogs.push(
      `${nextCombatant.name}은(는) 상태이상(${statusDefinition.label})으로 ${appliedDamage} 데미지를 입었다!`
    )
    battleLogs.push(...hpResult.battleLogs)

    if (nextHp === 0) {
      battleLogs.push(`${nextCombatant.name}은(는) 쓰러졌다!`)
    }
  }

  if (nextCombatant.currentHp === 0) {
    return {
      nextCombatant,
      battleLogs,
    }
  }

  const progressedStatus = {
    ...normalizedStatus,
    turns: normalizedStatus.turns + 1,
  }

  nextCombatant = refreshCombatantStats(nextCombatant, { statusEffect: progressedStatus })

  if (progressedStatus.turns >= getStatusDuration(progressedStatus.type)) {
    return {
      nextCombatant: clearStatusEffect(nextCombatant),
      battleLogs: [...battleLogs, `${nextCombatant.name}의 ${statusDefinition.label} 상태가 풀렸다!`],
    }
  }

  if (Math.random() * 100 < STATUS_EARLY_CURE_CHANCE) {
    return {
      nextCombatant: clearStatusEffect(nextCombatant),
      battleLogs: [...battleLogs, `${nextCombatant.name}의 ${statusDefinition.label} 상태가 자연스럽게 풀렸다!`],
    }
  }

  return {
    nextCombatant,
    battleLogs,
  }
}

const resolveTurnEndCombatantEffects = (
  combatant,
  { side = 'enemy', skipEndTurnDamage = false } = {}
) => {
  const statusResult = resolveTurnEndStatus(combatant, { side, skipEndTurnDamage })
  const statusCues = statusTransitionCues(combatant, statusResult.nextCombatant, side)
  const statusDamage = Math.max(0, combatant.currentHp - statusResult.nextCombatant.currentHp)
  if (statusDamage > 0) statusCues.unshift(createStatusCue(combatant.statusEffect?.type, 'damage',
    statusResult.nextCombatant, side, { damage: statusDamage }))
  const nextCombatant = statusResult.nextCombatant

  const passiveResult = resolvePassiveActionEnd(nextCombatant)
  return { nextCombatant: tickBattleTimers(passiveResult.nextCombatant),
    battleLogs: [...statusResult.battleLogs, ...passiveResult.battleLogs], statusCues: statusCues.filter(Boolean) }
}

const applyExperienceAmount = ({
  combatant,
  experienceAmount,
  levelCap,
}) => {
  if (!combatant || experienceAmount <= 0) {
    return {
      nextCombatant: combatant,
      battleLogs: [],
      skillLearnEvents: [],
    }
  }

  let nextCombatant = { ...combatant }
  const battleLogs = []
  const skillLearnEvents = []
  const queuedSkillNames = new Set()

  nextCombatant.experience += experienceAmount
  battleLogs.push(`${nextCombatant.name}은(는) 경험치 ${experienceAmount}를 얻었다!`)

  while (
    nextCombatant.level < levelCap &&
    nextCombatant.experience >= nextCombatant.experienceToNext
  ) {
    const nextLevel = nextCombatant.level + 1
    const newlyLearnedSkills = getNewSkillLearnNamesForLevel(nextCombatant, nextLevel).filter(
      (skillName) => !queuedSkillNames.has(skillName)
    )
    const freeSkillSlots = Math.max(
      0,
      MAX_COMBATANT_SKILL_COUNT - (nextCombatant.skills?.length ?? 0)
    )
    const autoLearnedSkills = newlyLearnedSkills.slice(0, freeSkillSlots)
    const replacementSkillNames = newlyLearnedSkills.slice(freeSkillSlots)

    nextCombatant.experience -= nextCombatant.experienceToNext
    nextCombatant = levelUpCombatant(nextCombatant, nextLevel)
    battleLogs.push(`${nextCombatant.name}의 레벨이 Lv.${nextCombatant.level}이 되었다!`)
    autoLearnedSkills.forEach((skillName) => {
      battleLogs.push(`${nextCombatant.name}은(는) ${skillName}을(를) 배웠다!`)
    })
    replacementSkillNames.forEach((skillName) => {
      queuedSkillNames.add(skillName)
      skillLearnEvents.push(createSkillLearnEvent(nextCombatant, skillName, nextLevel))
    })
  }

  if (nextCombatant.level >= levelCap) {
    nextCombatant.experience = Math.min(
      nextCombatant.experience,
      Math.max(0, nextCombatant.experienceToNext - 1)
    )
  }

  return {
    nextCombatant,
    battleLogs,
    skillLearnEvents,
  }
}

const getCatchUpExperienceMultiplier = (member, enemies) => Math.max(1, Math.min(1.75,
  enemies.reduce((sum, enemy) => sum + enemy.level, 0) / Math.max(1, enemies.length) / Math.max(1, member.level)))

const applyPartyExperienceGain = ({
  party,
  activeAllyIds,
  defeatedEnemies,
  levelCap,
  inventory = {},
}) => {
  if (!defeatedEnemies.length) {
    return {
      nextParty: party,
      battleLogs: [],
    }
  }

  let nextParty = [...party]
  const battleLogs = defeatedEnemies.map((enemy) => `${enemy.name}을(를) 쓰러뜨렸다!`)
  const skillLearnEvents = []
  const totalBaseExperience = defeatedEnemies.reduce(
    (total, enemy) => total + getExperienceReward(enemy),
    0
  )
  const boostedExperience = getBoostedExperienceAmount(totalBaseExperience, inventory)
  const activeRecipients = activeAllyIds
    .map((allyId) => getCombatantById(nextParty, allyId))
    .filter(member => !isRegionalSupport(member) && isCombatantAbleToBattle(member))
  const activeShareAmount = activeRecipients.length
    ? Math.max(1, Math.floor(boostedExperience / activeRecipients.length))
    : 0

  activeRecipients.forEach((recipient) => {
    const experienceResult = applyExperienceAmount({
      combatant: recipient,
      experienceAmount: Math.floor(activeShareAmount * getCatchUpExperienceMultiplier(recipient, defeatedEnemies) * getItemExperienceMultiplier(recipient) *
        getTrainerExperienceMultiplier(recipient, { boss: defeatedEnemies.some(enemy => enemy.isBoss) })),
      levelCap,
    })
    nextParty = replacePartyMember(nextParty, experienceResult.nextCombatant)
    battleLogs.push(...experienceResult.battleLogs)
    skillLearnEvents.push(...(experienceResult.skillLearnEvents ?? []))
  })

  {
    const activeIdSet = new Set(activeAllyIds)
    const shareRatio = getInventoryItemCount(inventory, EXP_SHARE_ITEM_ID) > 0 ? 0.75 : 0.55
    const sharedExperienceAmount = Math.max(1, Math.floor(boostedExperience * shareRatio))

    nextParty
      .filter(
        (member) =>
          !isRegionalSupport(member) && !activeIdSet.has(member.id) &&
          isCombatantAbleToBattle(member)
      )
      .forEach((member) => {
        const experienceResult = applyExperienceAmount({
          combatant: member,
          experienceAmount: Math.floor(sharedExperienceAmount * getCatchUpExperienceMultiplier(member, defeatedEnemies) * getItemExperienceMultiplier(member) *
            getTrainerExperienceMultiplier(member, { reserve: true, boss: defeatedEnemies.some(enemy => enemy.isBoss) })),
          levelCap,
        })
        nextParty = replacePartyMember(nextParty, experienceResult.nextCombatant)
        // Reserves still gain EXP and skills, but do not interrupt the battle log.
        skillLearnEvents.push(...(experienceResult.skillLearnEvents ?? []))
      })
  }

  return {
    nextParty,
    battleLogs,
    skillLearnEvents,
  }
}

const getSupportTargetPool = ({ side, effect, party, enemies, activeAllyIds }) => {
  const isActorAlly = side === 'ally'
  const allyPool = isActorAlly
    ? effect?.kind === 'revive' ? party : party.filter(unit => activeAllyIds.includes(unit.id))
    : enemies
  const enemyPool = isActorAlly
    ? enemies
    : activeAllyIds
        .map((allyId) => getCombatantById(party, allyId))
        .filter(Boolean)

  if (effect?.targetSide === 'enemy') {
    return enemyPool
  }

  return allyPool
}

const chooseSupportTarget = ({ actor, action, effect, party, enemies, activeAllyIds }) => {
  if (effect?.scope === 'self') {
    return actor
  }

  const pool = getSupportTargetPool({
    side: action.side,
    effect,
    party,
    enemies,
    activeAllyIds,
  })

  if (effect?.kind === 'revive') {
    return pool.find((target) => target && !target.isEgg && target.currentHp <= 0) ?? null
  }

  const livingTargets = pool.filter(isCombatantAbleToBattle)
  if (effect?.scope === 'all') {
    return livingTargets
  }

  if (action.targetId) {
    const selectedTarget = livingTargets.find((target) => target.id === action.targetId)
    if (selectedTarget) {
      return selectedTarget
    }
  }

  if (effect?.kind === 'heal') {
    return (
      [...livingTargets].sort(
        (first, second) =>
          first.currentHp / Math.max(1, first.maxHp) - second.currentHp / Math.max(1, second.maxHp)
      )[0] ?? null
    )
  }

  if (effect?.kind === 'clear-status') {
    return livingTargets.find((target) => normalizeStatusEffect(target.statusEffect)) ?? actor
  }

  return livingTargets.find((target) => target.id === actor.id) ?? livingTargets[0] ?? null
}

const replaceSupportTarget = ({ side, targetSide, party, enemies, target }) => {
  if (!target) {
    return { party, enemies }
  }

  const shouldReplaceParty =
    (side === 'ally' && targetSide !== 'enemy') ||
    (side === 'enemy' && targetSide === 'enemy')

  return shouldReplaceParty
    ? { party: replacePartyMember(party, target), enemies }
    : { party, enemies: replaceCombatantById(enemies, target) }
}

const getStatModifierLabel = (effect) => {
  const statLabel = STAT_LABEL_MAP[effect?.statKey] ?? '스탯'
  const percent = Math.round(Math.abs((effect?.multiplier ?? 1) - 1) * 100)
  const direction = (effect?.multiplier ?? 1) >= 1 ? '증가' : '감소'

  return `${statLabel} ${percent}% ${direction}`
}

const applySupportEffectToTarget = ({ actor, target, skillData }) => {
  const effect = getSkillEffect(skillData)

  if (!effect || !target) {
    return {
      nextTarget: target,
      battleLogs: [`${skillData.기술명}은(는) 아직 효과가 구현되지 않았다.`],
    }
  }

  if (effect.kind === 'heal') {
    if (target.isEgg || target.currentHp <= 0) return { nextTarget: target, battleLogs: [`${target.name}은(는) 회복 기술을 받을 수 없다.`] }
    const healingMultiplier = getItemHealingMultiplier(actor, target, effect.scope)
    const passiveHealing = getPassiveHealing(actor, target)
    const healAmount = Math.max(1, Math.floor(target.maxHp * (effect.healRatio ?? 0) * healingMultiplier * passiveHealing.multiplier * getAnomalyHealing(actor)))
    const nextHp = Math.min(target.maxHp, target.currentHp + healAmount)
    const appliedHeal = Math.max(0, nextHp - target.currentHp)

    return {
      nextTarget: {
        ...target,
        currentHp: nextHp,
      },
      battleLogs: [...(appliedHeal > 0 && healingMultiplier > 1 ? ['문장·스피릿의 효과로 회복 기술이 강화됐다!'] : []),
        ...(appliedHeal > 0 ? passiveHealing.battleLogs : []), `${target.name}의 HP가 ${appliedHeal} 회복됐다!`],
    }
  }

  if (effect.kind === 'revive') {
    if (target.currentHp > 0) {
      return {
        nextTarget: target,
        battleLogs: [`${target.name}은(는) 아직 전투 가능하다!`],
      }
    }

    const nextHp = Math.max(1, Math.floor(target.maxHp * (effect.reviveRatio ?? 0.5)))
    return {
      nextTarget: {
        ...target,
        currentHp: Math.min(target.maxHp, nextHp),
        statusEffect: null,
      },
      battleLogs: [`${target.name}이(가) HP ${Math.min(target.maxHp, nextHp)}로 부활했다!`],
    }
  }

  if (effect.kind === 'clear-status') {
    if (!normalizeStatusEffect(target.statusEffect)) {
      return {
        nextTarget: target,
        battleLogs: [`${target.name}에게 해제할 상태이상이 없다.`],
      }
    }

    return {
      nextTarget: clearStatusEffect(target),
      battleLogs: [`${target.name}의 상태이상이 해제됐다!`],
    }
  }

  if (effect.kind === 'stat-modifier') {
    const passiveGuardLogs = effect.multiplier < 1 ? resolvePassiveStatGuard(actor, target) : []
    if (passiveGuardLogs.length) return { nextTarget: target, battleLogs: passiveGuardLogs }
    if (effect.multiplier < 1 && actor.id !== target.id && hasAdventureItem(target, 'crest-hope')) {
      return { nextTarget: target, battleLogs: [`${target.name}의 희망의 문장이 능력치 하락을 막았다!`] }
    }
    if (effect.multiplier < 1 && target.battleGuards?.stats > 0) {
      return { nextTarget: target, battleLogs: [`${target.name}의 스테이터스 배리어가 능력치 하락을 막았다!`] }
    }
    const nextModifiers = {
      ...normalizeBattleStatModifiers(target.statModifiers),
      [effect.statKey]: mergeRegionStatModifier(target.statModifiers?.[effect.statKey],
        effect.multiplier < 1 && actor.id !== target.id && (target.isBoss || target.rivalEncounter)
          ? 1 - (1 - effect.multiplier) / 2 : effect.multiplier ?? 1),
    }

    return {
      nextTarget: refreshCombatantStats(target, {
        statModifiers: nextModifiers,
        preserveMaxHpDelta: true,
      }),
      battleLogs: [`${target.name}의 ${getStatModifierLabel({ ...effect, multiplier: nextModifiers[effect.statKey].multiplier })}!`],
    }
  }

  if (effect.kind === 'status') {
    if (target.battleGuards?.status > 0) {
      return { nextTarget: target, battleLogs: [`${target.name}의 커스 배리어가 상태이상을 막았다!`] }
    }
    if (normalizeStatusEffect(target.statusEffect)) {
      return {
        nextTarget: target,
        battleLogs: [`${target.name}은(는) 이미 상태이상에 걸려 있다.`],
      }
    }

    if (Math.random() * 100 >= getPassiveStatusChance(actor, getAnomalyStatusChance(actor, effect.status, getItemStatusChance(actor, effect.chance ?? 100))) * (target.isBoss ? 0.5 : 1)) {
      return {
        nextTarget: target,
        battleLogs: [`${actor.name}의 ${skillData.기술명}은(는) 실패했다!`],
      }
    }

    const passiveGuard = resolvePassiveStatusGuard(target, effect.status)
    if (passiveGuard.blocked) return { nextTarget: passiveGuard.nextCombatant, battleLogs: passiveGuard.battleLogs }
    return {
      nextTarget: refreshCombatantStats(target, {
        statusEffect: createStatusEffect(effect.status),
      }),
      battleLogs: [`${target.name}은(는) ${effect.status} 상태가 되었다!`],
    }
  }

  if (effect.kind === 'clear-stat-drops' || effect.kind === 'clear-stat-boosts') {
    const shouldClearDrop = effect.kind === 'clear-stat-drops'
    const currentModifiers = normalizeBattleStatModifiers(target.statModifiers)
    const nextModifiers = BUFFABLE_STAT_KEYS.reduce((result, statKey) => {
      const modifier = currentModifiers[statKey]
      const isDrop = (modifier?.multiplier ?? 1) < 1
      const isBoost = (modifier?.multiplier ?? 1) > 1
      result[statKey] =
        (shouldClearDrop && isDrop) || (!shouldClearDrop && isBoost) ? null : modifier
      return result
    }, {})

    return {
      nextTarget: refreshCombatantStats(target, {
        statModifiers: nextModifiers,
        preserveMaxHpDelta: true,
      }),
      battleLogs: [
        shouldClearDrop
          ? `${target.name}의 스테이터스 하락이 해제됐다!`
          : `${target.name}의 스테이터스 증가가 해제됐다!`,
      ],
    }
  }

  if (effect.kind === 'guard') {
    let guarded = { ...target, battleGuards: { ...target.battleGuards,
      [effect.guard]: effect.turns + (actor.id === target.id ? 1 : 0) } }
    if (effect.guard === 'status') guarded = clearStatusEffect(guarded)
    if (effect.guard === 'stats') guarded = refreshCombatantStats(guarded, {
      statModifiers: Object.fromEntries(Object.entries(guarded.statModifiers ?? {}).map(([key, value]) =>
        [key, value?.multiplier < 1 ? null : value])) })
    return { nextTarget: guarded, battleLogs: [`${target.name}에게 ${skillData.기술명}! ${effect.turns}턴 동안 ${GUARD_DESCRIPTIONS[effect.guard]}`] }
  }
  return { nextTarget: target, battleLogs: [] }
}

const resolveSupportSkillAction = ({
  action,
  actor,
  party,
  enemies,
  activeAllyIds,
  skillData,
}) => {
  const effect = getSkillEffect(skillData)
  const battleLogs = [createSkillUseLog(actor.name, skillData.기술명)]
  let nextParty = [...party]
  let nextEnemies = [...enemies]
  const supportStates = []
  const targets = chooseSupportTarget({
    actor,
    action,
    effect,
    party: nextParty,
    enemies: nextEnemies,
    activeAllyIds,
  })
  const targetList = Array.isArray(targets) ? targets : [targets].filter(Boolean)

  if (targetList.length === 0) {
    return {
      nextParty,
      nextEnemies,
      battleLogs: [...battleLogs, '대상이 없다!'],
    }
  }

  targetList.forEach((target) => {
    const currentTarget =
      (action.side === 'ally' && effect?.targetSide !== 'enemy') ||
      (action.side === 'enemy' && effect?.targetSide === 'enemy')
        ? getCombatantById(nextParty, target.id) ?? target
        : getCombatantById(nextEnemies, target.id) ?? target
    const effectResult = applySupportEffectToTarget({
      actor,
      target: currentTarget,
      skillData,
    })
    const replaceResult = replaceSupportTarget({
      side: action.side,
      targetSide: effect?.targetSide ?? 'ally',
      party: nextParty,
      enemies: nextEnemies,
      target: effectResult.nextTarget,
    })

    nextParty = replaceResult.party
    nextEnemies = replaceResult.enemies
    const targetSide = effect?.targetSide === 'enemy' ? (action.side === 'ally' ? 'enemy' : 'ally') : action.side
    if (targetSide !== 'ally' || activeAllyIds.includes(target.id)) battleLogs.push(...effectResult.battleLogs)
    supportStates.push({ targetId: target.id,
      targetSide,
      targetCurrentHp: effectResult.nextTarget.currentHp, targetStatusEffect: effectResult.nextTarget.statusEffect,
      targetPassiveState: effectResult.nextTarget.passiveState,
      statusCues: targetSide !== 'ally' || activeAllyIds.includes(target.id)
        ? statusTransitionCues(currentTarget, effectResult.nextTarget, targetSide) : [] })
  })

  return {
    nextParty,
    nextEnemies,
    battleLogs,
    supportStates,
  }
}

const resolveAttackAction = ({
  attacker,
  defender,
  skillName,
  announce = true,
  attackerSide = 'ally',
  skillOverride = null,
}) => {
  const skillData = skillOverride ?? getSkillData(skillName, attacker)
  // Only the final boss's explicitly authored phase strike can erase one target.
  const instantDefeat = attackerSide === 'enemy' && attacker.isBoss &&
    attacker.bossEncounter?.id === 'arcadiamon-final' && skillOverride?.bossInstantDefeat === true
  const skillStatusData = getSkillStatusData(skillData)
  const battleLogs = announce ? [createSkillUseLog(attacker.name, skillData.기술명)] : []
  const accuracyValue = getModifiedAccuracyValue(skillData, attacker, defender, attackerSide)

  if (!instantDefeat && Math.random() * 100 >= accuracyValue) {
    return {
      nextDefender: defender,
      battleLogs: [...battleLogs, `${attacker.name}의 공격이 빗나갔다!`],
      hitEffects: [
        {
          attackerId: attacker.id,
          attackerSpecies: attacker.imageName || attacker.speciesName || attacker.name,
          attackerSide,
          targetId: defender.id,
          targetSpecies: defender.imageName || defender.speciesName || defender.name,
          targetSide: attackerSide === 'ally' ? 'enemy' : 'ally',
          attribute: skillData.속성 ?? '무',
          category: skillData.분류 ?? '물리형',
          skillName: skillData.기술명,
          area: isSkillAreaAttack(skillData),
          finalBossMove: Boolean(getFinalBossMove(attacker)),
          isMiss: true,
        },
      ],
    }
  }

  const attackStat =
    skillData.분류 === '특수형' ? attacker.specialAttack : attacker.attack
  const defenseStat =
    skillData.분류 === '특수형' ? defender.specialDefense : defender.defense
  const matchupResult = getMatchupResult({
    attackerType: attacker.type,
    skillAttribute: skillData.속성,
    defenderType: defender.type,
    defenderAttribute: defender.attribute,
  })
  const finalMultiplier = matchupResult.multiplier

  if (!instantDefeat && finalMultiplier === 0) {
    return {
      nextDefender: defender,
      battleLogs: [...battleLogs, '상성이 너무 불리해서 공격이 통하지 않았다!'],
      hitEffects: [],
    }
  }

  const boostedSkillPower =
    (skillData.데미지 ?? 0) *
    (attacker.statusEffect?.type === '화상' && skillData.분류 === '물리형' ? 0.85 : 1) *
    getTypePowerMultiplier(attacker) *
    getAttributePowerMultiplier(attacker, skillData.속성)
  const scaledPower =
    (((2 * Math.max(1, attacker.level)) / 5 + 2) * boostedSkillPower * Math.max(1, attackStat)) /
    Math.max(1, defenseStat)
  const baseDamage = Math.floor(scaledPower / 50) + 2
  const randomFactor = 0.85 + Math.random() * 0.15
  const isCritical = !instantDefeat && Math.random() < getPassiveCriticalChance(attacker, CRITICAL_HIT_CHANCE)
  const equipment = getAdventureAttackModifiers({ attacker, defender, skillData,
    matchup: finalMultiplier, isCritical, baseCritical: CRITICAL_HIT_MULTIPLIER })
  const passiveModifiers = getPassiveAttackModifiers({ attacker, defender, skillData,
    matchup: finalMultiplier, isCritical, criticalMultiplier: equipment.criticalMultiplier })
  const criticalMultiplier = passiveModifiers.criticalMultiplier
  const guardMultiplier = Math.min(defender.battleGuards?.taunt > 0 ? 0.75 : 1,
    defender.battleGuards?.[skillData.분류 === '특수형' ? 'special' : 'physical'] > 0 ? 0.5 : 1)
  const damage = Math.max(1, Math.floor(baseDamage * finalMultiplier * randomFactor * guardMultiplier * criticalMultiplier * equipment.multiplier * passiveModifiers.multiplier * getEnvironmentMultiplier(attacker, skillData) *
    getTrainerBossMultiplier(attacker, defender, skillData, attackerSide) * getAnomalyDamage(attacker, skillData)))
  const rawNextHp = instantDefeat ? 0 : Math.max(0, defender.currentHp - damage)
  const hpResult = resolveCombatantDamageHp({
    combatant: defender,
    rawNextHp,
    canEndure: attackerSide === 'enemy',
  })
  const nextHp = hpResult.nextHp
  const appliedDamage = Math.max(0, defender.currentHp - nextHp)
  let nextDefender = recordPassiveHit(hpResult.nextCombatant, appliedDamage)
  if (nextDefender.rivalEncounter && appliedDamage > 0) {
    const category = skillData.분류 === '특수형' ? 'special' : 'physical'
    const observed = nextDefender.rivalEncounter.observed ?? {}
    nextDefender = { ...nextDefender, rivalEncounter: { ...nextDefender.rivalEncounter,
      observed: { ...observed, [category]: (observed[category] ?? 0) + 1 } } }
  }
  const drain = applyEncounterDrain(recordPassiveAttack(attacker, defender, nextDefender, appliedDamage), skillOverride, appliedDamage)
  const nextAttacker = drain.nextAttacker
  const nextLogs = [...battleLogs, ...equipment.battleLogs, ...passiveModifiers.battleLogs, `${defender.name}에게 ${appliedDamage} 데미지!`]
  nextLogs.push(...drain.battleLogs)
  if (instantDefeat) nextLogs.push(`${defender.name}의 데이터가 도트 매트릭스에 지워졌다!`)
  if (isCritical) nextLogs.push(criticalMultiplier > 1 ? `치명타! 피해가 ${criticalMultiplier}배로 증가했다!` : '치명타의 추가 피해가 막혔다!')
  nextLogs.push(...hpResult.battleLogs)

  const hitStatusClearResult = clearReactiveStatusOnHit(nextDefender)
  nextDefender = hitStatusClearResult.nextCombatant
  nextLogs.push(...hitStatusClearResult.battleLogs)

  if (finalMultiplier > 1) {
    nextLogs.push('효과가 굉장했다!')
  } else if (finalMultiplier > 0 && finalMultiplier < 1) {
    nextLogs.push('효과가 별로인 듯하다...')
  }

  if (nextHp === 0) {
    nextLogs.push(`${defender.name}은(는) 쓰러졌다!`)
  } else if (!normalizeStatusEffect(nextDefender.statusEffect) && !nextDefender.battleGuards?.status && skillStatusData) {
    if (Math.random() * 100 < getPassiveStatusChance(attacker, getAnomalyStatusChance(attacker, skillStatusData.type, getItemStatusChance(attacker, skillStatusData.chance))) * (nextDefender.isBoss ? 0.5 : 1)) {
      const passiveGuard = resolvePassiveStatusGuard(nextDefender, skillStatusData.type)
      if (passiveGuard.blocked) { nextDefender = passiveGuard.nextCombatant; nextLogs.push(...passiveGuard.battleLogs) }
      else {
        nextDefender = refreshCombatantStats(nextDefender, { statusEffect: createStatusEffect(skillStatusData.type) })
        nextLogs.push(`${nextDefender.name}은(는) 상태이상(${skillStatusData.type})에 걸렸다!`)
      }
    }
  }

  return {
    nextAttacker,
    nextDefender,
    battleLogs: nextLogs,
    hitEffects:
      appliedDamage > 0
        ? [
            {
              attackerId: attacker.id,
              attackerSpecies: attacker.imageName || attacker.speciesName || attacker.name,
              attackerSide,
              targetId: defender.id,
              targetSpecies: defender.imageName || defender.speciesName || defender.name,
              targetSide: attackerSide === 'ally' ? 'enemy' : 'ally',
              attribute: skillData.속성 ?? '무',
              category: skillData.분류 ?? '물리형',
              skillName: skillData.기술명,
              area: isSkillAreaAttack(skillData),
              finalBossMove: Boolean(getFinalBossMove(attacker)),
              damage: appliedDamage,
              matchupMultiplier: finalMultiplier,
              isCritical,
              criticalMultiplier,
              targetCurrentHp: nextDefender.currentHp,
              targetStatusEffect: nextDefender.statusEffect ?? null,
              statusCues: statusTransitionCues(defender, nextDefender, attackerSide === 'ally' ? 'enemy' : 'ally'),
              targetPassiveState: nextDefender.passiveState,
              isDefeatingHit: nextHp === 0,
            },
          ]
        : [],
  }
}

const resolveRecoveryProgramOnDefeat = (combatant) => {
  if (!combatant || combatant.currentHp > 0) {
    return {
      nextCombatant: combatant,
      battleLogs: [],
    }
  }

  const recoveryPrograms = normalizeRecoveryPrograms(combatant.recoveryPrograms)
  const recoveryItem =
    RECOVERY_PROGRAM_REWARD_ITEMS.find(
      (item) => item.recoveryProgramKey === 'recovery-program-d' && recoveryPrograms[item.recoveryProgramKey] > 0
    ) ??
    RECOVERY_PROGRAM_REWARD_ITEMS.find(
      (item) => item.recoveryProgramKey === 'recovery-program-m' && recoveryPrograms[item.recoveryProgramKey] > 0
    )

  if (!recoveryItem) {
    return {
      nextCombatant: combatant,
      battleLogs: [],
    }
  }

  const nextRecoveryPrograms = {
    ...recoveryPrograms,
    [recoveryItem.recoveryProgramKey]: Math.max(
      0,
      (recoveryPrograms[recoveryItem.recoveryProgramKey] ?? 0) - 1
    ),
  }
  const recoveredHp = Math.max(1, Math.floor(combatant.maxHp * recoveryItem.recoveryRatio))

  return {
    nextCombatant: {
      ...combatant,
      recoveryPrograms: nextRecoveryPrograms,
      currentHp: Math.min(combatant.maxHp, recoveredHp),
    },
    battleLogs: [
      `${combatant.name}의 ${recoveryItem.name}이 발동했다!`,
      `${combatant.name}은(는) HP ${Math.min(combatant.maxHp, recoveredHp)}로 전투에 복귀했다!`,
    ],
  }
}

const prepareBossTurn = ({ enemies, actorId, party = [], activeAllyIds = [] }) => {
  const response = resolveBossBattleReactions({ enemies, actorId, actorSide: 'enemy', didAct: false,
    deferPatterns: true, patternActorId: actorId })
  const special = resolveFinalBossPatterns({ ...response, enemies: response.nextEnemies, party, activeAllyIds }, {
    speciesLookup: allDigimonLookup, returnEvolution: createReturnedEvolutionCombatant,
    createCombatant, refreshStats: refreshCombatantStats, isPlayable: isPlayableDigimon,
  })
  const encounter = resolveEncounterPatterns({ enemies: special.nextEnemies, party: special.nextParty, changes: special.changes }, {
    speciesLookup: allDigimonLookup, createCombatant, refreshStats: refreshCombatantStats,
  })
  const patterns = response.changes.filter(change => change.actionActorId === actorId && change.consumesAction)
  return { ...encounter, battleLogs: [...response.battleLogs, ...special.battleLogs, ...encounter.battleLogs], consumesAction: patterns.length > 0,
    skill: patterns.find(change => change.signature)?.signature.skill ?? null }
}

const resolveEnemyPartyActions = ({ enemies, party, activeAllyIds, inventory = {} }) => {
  let nextEnemies = [...enemies]
  let nextParty = [...party]
  const battleLogs = []
  const hitEffects = []
  const presentation = []

  nextEnemies.forEach((enemy) => {
    let currentEnemy = getCombatantById(nextEnemies, enemy.id)
    if (!isCombatantAbleToBattle(currentEnemy)) {
      return
    }

    if (!nextParty.some(unit => activeAllyIds.includes(unit.id) && isCombatantAbleToBattle(unit))) return
    const bossTurn = prepareBossTurn({ enemies: nextEnemies, actorId: currentEnemy.id, party: nextParty, activeAllyIds })
    nextEnemies = bossTurn.nextEnemies
    nextParty = bossTurn.nextParty
    if (bossTurn.changes.length) presentation.push({ effects: [], bossChanges: bossTurn.changes })
    battleLogs.push(...bossTurn.battleLogs)
    currentEnemy = getCombatantById(nextEnemies, enemy.id)
    if (!isCombatantAbleToBattle(currentEnemy)) return
    let nextEnemy = { ...currentEnemy }
    const phaseBefore = nextEnemy.bossEncounter?.phase, actionsBefore = nextEnemy.bossEncounter?.actions
    let supportStates = []
    let afterStatus = []
    let targetAlly = nextParty.find(unit => activeAllyIds.includes(unit.id) && unit.currentHp > 0 && unit.battleGuards?.taunt > 0)
      ?? getFirstLivingPartyMember(nextParty, activeAllyIds)
    const enemySkill = bossTurn.skill?.기술명 ?? getRandomEnemySkill(nextEnemy, nextEnemies, nextParty.filter(unit => activeAllyIds.includes(unit.id)))
    const enemySkillData = bossTurn.skill ?? (enemySkill ? getSkillData(enemySkill, nextEnemy) : null)
    if (!nextEnemy.isBoss && !nextEnemy.rivalEncounter && !nextEnemy.specialQuest && !nextEnemy.bossEncounter) {
      const candidates = nextParty.filter(unit => activeAllyIds.includes(unit.id) && isCombatantAbleToBattle(unit))
      targetAlly = getCombatantById(nextParty, getEnemySkillTarget(nextEnemy, enemySkillData, candidates))
    }
    const isAreaAttack = isSkillAreaAttack(enemySkillData)

    if (!targetAlly) {
      return
    }

    const logStart = battleLogs.length, effectStart = hitEffects.length
    const startStatusResult = resolveTurnStartStatus(nextEnemy)
    nextEnemy = startStatusResult.nextCombatant
    battleLogs.push(...startStatusResult.battleLogs)

    targetAlly = getCombatantById(nextParty, targetAlly.id) ?? targetAlly

    const actionStart = battleLogs.length
    const phaseErasure = bossTurn.skill?.bossInstantDefeat === true
    const canUseSkill = enemySkill && (startStatusResult.canAct || phaseErasure) && isCombatantAbleToBattle(nextEnemy) &&
      (!bossTurn.consumesAction || Boolean(bossTurn.skill))
    if (canUseSkill) {
      if (isSupportSkill(enemySkillData)) {
        const supportResult = resolveSupportSkillAction({
          action: {
            side: 'enemy',
            actorId: nextEnemy.id,
            skillName: enemySkill,
            targetId: targetAlly.id,
          },
          actor: nextEnemy,
          party: nextParty,
          enemies: nextEnemies,
          activeAllyIds,
          skillData: enemySkillData,
        })

        nextParty = supportResult.nextParty
        nextEnemies = supportResult.nextEnemies
        supportStates = supportResult.supportStates ?? []
        battleLogs.push(...supportResult.battleLogs)
      } else if (isAreaAttack) {
        battleLogs.push(createSkillUseLog(nextEnemy.name, enemySkillData.기술명))
        activeAllyIds.forEach((allyId) => {
          const currentTarget = getCombatantById(nextParty, allyId)

          if (!isCombatantAbleToBattle(currentTarget)) {
            return
          }

          const attackResult = resolveAttackAction({
            attacker: nextEnemy,
            defender: currentTarget,
            skillName: enemySkill,
            skillOverride: bossTurn.skill ?? undefined,
            announce: false,
            inventory,
            attackerSide: 'enemy',
          })
          const recoveryResult = resolveRecoveryProgramOnDefeat(attackResult.nextDefender)
          nextEnemy = attackResult.nextAttacker ?? nextEnemy
          nextParty = replacePartyMember(nextParty, recoveryResult.nextCombatant)
          battleLogs.push(...attackResult.battleLogs)
          battleLogs.push(...recoveryResult.battleLogs)
          hitEffects.push(...(attackResult.hitEffects ?? []))
        })
      } else if (isCombatantAbleToBattle(targetAlly)) {
        const attackResult = resolveAttackAction({
          attacker: nextEnemy,
          defender: targetAlly,
          skillName: enemySkill,
          skillOverride: bossTurn.skill ?? undefined,
          inventory,
          attackerSide: 'enemy',
        })
        const recoveryResult = resolveRecoveryProgramOnDefeat(attackResult.nextDefender)
        nextEnemy = attackResult.nextAttacker ?? nextEnemy
        targetAlly = recoveryResult.nextCombatant
        nextParty = replacePartyMember(nextParty, targetAlly)
        battleLogs.push(...attackResult.battleLogs)
        battleLogs.push(...recoveryResult.battleLogs)
        hitEffects.push(...(attackResult.hitEffects ?? []))
      }
    }

    const actionEnd = battleLogs.length
    if (canUseSkill && isSupportSkill(enemySkillData)) nextEnemy = getCombatantById(nextEnemies, nextEnemy.id) ?? nextEnemy
    if (canUseSkill) nextEnemy = spendBossRecovery(startSkillCooldown(nextEnemy, enemySkillData), enemySkillData)
    if (isCombatantAbleToBattle(nextEnemy)) {
      const endStatusResult = resolveTurnEndCombatantEffects(nextEnemy, { side: 'enemy' })
      nextEnemy = endStatusResult.nextCombatant
      battleLogs.push(...endStatusResult.battleLogs)
      afterStatus = endStatusResult.statusCues
    }

    nextEnemies = replaceCombatantById(nextEnemies, nextEnemy)
    const bossResponse = resolveBossBattleReactions({ enemies: nextEnemies, actorId: nextEnemy.id,
      actorSide: 'enemy', hitEffects: hitEffects.slice(effectStart), phaseBefore, actionsBefore,
      deferPatterns: true, isPatternAction: bossTurn.consumesAction })
    nextEnemies = bossResponse.nextEnemies
    presentation.push({ ...captureBattleLogAction(battleLogs, hitEffects, { logStart, actionStart, actionEnd, effectStart }),
      bossChanges: bossResponse.changes,
      beforeStatus: startStatusResult.blockedStatus ? [createStatusCue(startStatusResult.blockedStatus, 'blocked', enemy, 'enemy')] : [],
      afterStatus: [...supportStates.flatMap(state => state.statusCues ?? []), ...afterStatus],
      afterState: [...supportStates, { targetId: nextEnemy.id, targetSide: 'enemy', targetCurrentHp: nextEnemy.currentHp,
        targetPassiveState: nextEnemy.passiveState, targetStatusEffect: nextEnemy.statusEffect }] })
    battleLogs.push(...bossResponse.battleLogs)
  })

  return { nextEnemies, nextParty, battleLogs, hitEffects, presentation }
}

const resolveNonAttackActionEnd = (party, actorId) => {
  const actor = getCombatantById(party, actorId)
  if (!actor || actor.isEgg) return { nextParty: party, battleLogs: [] }
  const end = resolveTurnEndCombatantEffects(actor, { side: 'ally' })
  const recovery = resolveRecoveryProgramOnDefeat(end.nextCombatant)
  return { nextParty: replacePartyMember(party, recovery.nextCombatant), battleLogs: [...end.battleLogs, ...recovery.battleLogs],
    statusCues: end.statusCues, visualState: [{ targetId: actor.id, targetSide: 'ally',
      targetCurrentHp: recovery.nextCombatant.currentHp, targetStatusEffect: recovery.nextCombatant.statusEffect,
      targetPassiveState: recovery.nextCombatant.passiveState }] }
}

const createBattleTurnAction = ({ side, actor, skillName, targetId = null, order = 0 }) => ({
  side,
  actorId: actor?.id ?? null,
  skillName,
  targetId,
  speed: actor?.speed ?? 0,
  order,
  tieBreaker: Math.random(),
})

const createRegionalSupportActions = ({ party, enemies, activeAllyIds, startOrder = 0 }) => {
  if (!hasLivingOwnedAlly(party, activeAllyIds)) return []
  const actor = party.find(unit => isRegionalSupport(unit) && activeAllyIds.includes(unit.id) && isCombatantAbleToBattle(unit))
  const opponents = getLivingCombatants(enemies)
  if (!actor || !opponents.length) return []
  const skillName = getRegionalSupportSkill(actor, getSkillData, skill => scoreSkill(actor, skill,
    party.filter(unit => activeAllyIds.includes(unit.id)), opponents,
    (attacker, move, target) => getMatchupResult({ attackerType: attacker.type, skillAttribute: move.속성,
      defenderType: target.type, defenderAttribute: target.attribute }).multiplier))
  const target = opponents.find(unit => unit.battleGuards?.taunt > 0) ?? opponents.reduce((best, unit) =>
    unit.currentHp / unit.maxHp < best.currentHp / best.maxHp ? unit : best)
  return [{ ...createBattleTurnAction({ side: 'ally', actor, skillName, targetId: target.id, order: startOrder }), automatic: true }]
}

const createEnemyBattleTurnActions = ({ enemies, party, activeAllyIds, startOrder = 0 }) => {
  const livingActiveAllies = activeAllyIds
    .map((allyId) => getCombatantById(party, allyId))
    .filter(isCombatantAbleToBattle)

  return getLivingCombatants(enemies)
    .map((enemy, index) => {
      const enemySkill = getRandomEnemySkill(enemy, enemies, livingActiveAllies)

      if (!enemySkill || !livingActiveAllies.length) {
        return null
      }

      return { ...createBattleTurnAction({
        side: 'enemy',
        actor: enemy,
        skillName: enemySkill,
        targetId: getEnemySkillTarget(enemy, getSkillData(enemySkill, enemy), livingActiveAllies),
        order: startOrder + index,
      }), bossPhase: enemy.bossEncounter?.phase }
    })
    .filter(Boolean)
}

const getBattleTurnActor = ({ action, party, enemies }) =>
  action.side === 'ally'
    ? getCombatantById(party, action.actorId)
    : getCombatantById(enemies, action.actorId)

const replaceBattleTurnActor = ({ action, party, enemies, actor }) => {
  if (action.side === 'ally') {
    return {
      party: replacePartyMember(party, actor),
      enemies,
    }
  }

  return {
    party,
    enemies: replaceCombatantById(enemies, actor),
  }
}

const getBattleTurnTargetCandidates = ({ action, party, enemies, activeAllyIds }) => {
  if (action.side === 'ally') {
    return getLivingCombatants(enemies)
  }

  return activeAllyIds
    .map((allyId) => getCombatantById(party, allyId))
    .filter(isCombatantAbleToBattle)
}

const resolveBattleTurnActions = ({
  party,
  enemies,
  activeAllyIds,
  actions,
  levelCap,
  inventory = {},
}) => {
  let nextParty = [...party]
  let nextEnemies = [...enemies]
  const battleLogs = []
  const skillLearnEvents = []
  const hitEffects = []
  const presentation = []
  const sortedActions = [...actions]
    .map((action) => {
      const priorityActor = getBattleTurnActor({ action, party: nextParty, enemies: nextEnemies })

      return {
        ...action,
        priority:
          action.priority ??
          (action.side === 'ally' && rollHastePriority(priorityActor) ? 1 : 0),
      }
    })
    .sort((firstAction, secondAction) => {
      const priorityDifference = (secondAction.priority ?? 0) - (firstAction.priority ?? 0)

      if (priorityDifference !== 0) {
        return priorityDifference
      }

      const speedDifference = (secondAction.speed ?? 0) - (firstAction.speed ?? 0)

      if (speedDifference !== 0) {
        return speedDifference
      }

      const tieDifference = (firstAction.tieBreaker ?? 0) - (secondAction.tieBreaker ?? 0)

      if (tieDifference !== 0) {
        return tieDifference
      }

      return (firstAction.order ?? 0) - (secondAction.order ?? 0)
    })
  const flinchedActorIds = new Set()

  sortedActions.forEach((action, actionIndex) => {
    let actor = getBattleTurnActor({ action, party: nextParty, enemies: nextEnemies })

    if (!isCombatantAbleToBattle(actor)) return
    if ((action.side === 'enemy' || isRegionalSupport(actor)) && !hasLivingOwnedAlly(nextParty, activeAllyIds)) return
    let bossTurn = { consumesAction: false, skill: null }
    if (action.side === 'enemy') {
      if (!nextParty.some(unit => activeAllyIds.includes(unit.id) && isCombatantAbleToBattle(unit))) return
      bossTurn = prepareBossTurn({ enemies: nextEnemies, actorId: actor.id, party: nextParty, activeAllyIds })
      nextEnemies = bossTurn.nextEnemies
      nextParty = bossTurn.nextParty
      if (bossTurn.changes.length) presentation.push({ effects: [], bossChanges: bossTurn.changes })
      battleLogs.push(...bossTurn.battleLogs)
      actor = getBattleTurnActor({ action, party: nextParty, enemies: nextEnemies })
    }

    if (!bossTurn.consumesAction && action.side === 'enemy' && actor?.bossEncounter &&
      (action.bossPhase !== actor.bossEncounter.phase ||
        (getFinalBossMove(actor) ? getFinalBossMove(actor).skill.기술명 !== action.skillName : !actor.skills.includes(action.skillName)) ||
        !isBossSkillAllowed(actor, getSkillData(action.skillName, actor)))) {
      const opponents = nextParty.filter(unit => activeAllyIds.includes(unit.id) && isCombatantAbleToBattle(unit))
      action = { ...action, skillName: getRandomEnemySkill(actor, nextEnemies,
        opponents), targetId: getFinalBossTarget(actor, opponents) ?? action.targetId }
    }

    if (bossTurn.skill) action = { ...action, skillName: bossTurn.skill.기술명, skillOverride: bossTurn.skill }
    if ((!action.skillName && !bossTurn.consumesAction) || !isCombatantAbleToBattle(actor)) {
      return
    }

    const logStart = battleLogs.length, effectStart = hitEffects.length
    const phaseBefore = actor.bossEncounter?.phase, actionsBefore = actor.bossEncounter?.actions
    const skillData = action.skillOverride ?? getSkillData(action.skillName, actor)
    const isAreaAttack = isSkillAreaAttack(skillData)
    const defeatedEnemies = []
    let supportStates = []
    let afterStatus = []
    const phaseErasure = bossTurn.skill?.bossInstantDefeat === true
    const invalidatedFormSkill = action.side === 'ally' &&
      getCombatantById(party, actor.id)?.name !== actor.name &&
      !['기본 타격', '기본 파동'].includes(action.skillName) &&
      !getCommandSkillNames(actor, name => getSkillData(name, actor)).includes(action.skillName)
    const startStatusResult = resolveTurnStartStatus(actor)
    // Like the other HP phase effects, data erasure is not a second ordinary skill action.
    const flinched = flinchedActorIds.delete(action.actorId) && !phaseErasure
    const coolingDown = !phaseErasure && (!bossTurn.consumesAction || Boolean(bossTurn.skill)) && getSkillCooldown(actor, skillData) > 0
    if (invalidatedFormSkill) battleLogs.push(`${actor.name}의 현재 모습에서는 ${action.skillName}을(를) 사용할 수 없다!`)
    if (flinched) battleLogs.push(`${actor.name}은(는) 풀죽어서 움직일 수 없었다!`)
    if (coolingDown) battleLogs.push(`${skillData.기술명}은(는) 아직 재사용 대기 중이다!`)
    actor = startStatusResult.nextCombatant
    battleLogs.push(...startStatusResult.battleLogs)

    const replacedAfterStart = replaceBattleTurnActor({
      action,
      party: nextParty,
      enemies: nextEnemies,
      actor,
    })
    nextParty = replacedAfterStart.party
    nextEnemies = replacedAfterStart.enemies

    let actionStart = battleLogs.length
    const canUseSkill = (startStatusResult.canAct || phaseErasure) && !invalidatedFormSkill && !flinched && !coolingDown && isCombatantAbleToBattle(actor) &&
      (!bossTurn.consumesAction || Boolean(bossTurn.skill))
    if (canUseSkill) {
      if (action.side === 'ally' && action.priority > 0) {
        battleLogs.push(`${actor.name}의 헤이스트가 발동했다!`)
      }
      actionStart = battleLogs.length

      const getDeathBoneFlinchLogs = (target, didHit) => {
        const hasPendingTargetAction = sortedActions
          .slice(actionIndex + 1)
          .some((futureAction) => futureAction.side === 'enemy' && futureAction.actorId === target?.id)

        if (
          action.side !== 'ally' ||
          !didHit ||
          !isCombatantAbleToBattle(target) ||
          !hasPendingTargetAction ||
          !rollDeathBoneFlinch(actor)
        ) {
          return []
        }
        if (target.isBoss && Math.random() >= 0.5) return []

        flinchedActorIds.add(target.id)
        return [`${target.name}은(는) 풀죽었다!`]
      }

      if (isSupportSkill(skillData)) {
        const supportResult = resolveSupportSkillAction({
          action,
          actor,
          party: nextParty,
          enemies: nextEnemies,
          activeAllyIds,
          skillData,
        })

        nextParty = supportResult.nextParty
        nextEnemies = supportResult.nextEnemies
        supportStates = supportResult.supportStates ?? []
        battleLogs.push(...supportResult.battleLogs)
      } else {
        const targetCandidates = getBattleTurnTargetCandidates({
          action,
          party: nextParty,
          enemies: nextEnemies,
          activeAllyIds,
        })

        if (isAreaAttack) {
          if (targetCandidates.length > 0) {
            battleLogs.push(createSkillUseLog(actor.name, skillData.기술명))
          }

          targetCandidates.forEach((target) => {
            const attackResult = resolveAttackAction({
              attacker: actor,
              defender: target,
              skillName: action.skillName,
              skillOverride: action.skillOverride,
              announce: false,
              inventory,
              attackerSide: action.side,
            })

            actor = attackResult.nextAttacker ?? actor
            const replacedAttacker = replaceBattleTurnActor({ action, party: nextParty, enemies: nextEnemies, actor })
            nextParty = replacedAttacker.party
            nextEnemies = replacedAttacker.enemies
            if (action.side === 'ally') {
              nextEnemies = replaceCombatantById(nextEnemies, attackResult.nextDefender)

              if (target.currentHp > 0 && attackResult.nextDefender.currentHp === 0) {
                defeatedEnemies.push(target)
              }
              battleLogs.push(...attackResult.battleLogs)
              battleLogs.push(...getDeathBoneFlinchLogs(attackResult.nextDefender, attackResult.hitEffects?.some(hit => hit.damage > 0)))
              hitEffects.push(...(attackResult.hitEffects ?? []))
            } else {
              const recoveryResult = resolveRecoveryProgramOnDefeat(attackResult.nextDefender)
              nextParty = replacePartyMember(nextParty, recoveryResult.nextCombatant)
              battleLogs.push(...attackResult.battleLogs)
              battleLogs.push(...recoveryResult.battleLogs)
              hitEffects.push(...(attackResult.hitEffects ?? []))
              return
            }
          })
        } else {
          const selectedTarget =
            targetCandidates.find(target => target.battleGuards?.taunt > 0) ??
            targetCandidates.find((target) => target.id === action.targetId) ?? targetCandidates[0]

          if (selectedTarget) {
            const attackResult = resolveAttackAction({
              attacker: actor,
              defender: selectedTarget,
              skillName: action.skillName,
              skillOverride: action.skillOverride,
              inventory,
              attackerSide: action.side,
            })

            actor = attackResult.nextAttacker ?? actor
            const replacedAttacker = replaceBattleTurnActor({ action, party: nextParty, enemies: nextEnemies, actor })
            nextParty = replacedAttacker.party
            nextEnemies = replacedAttacker.enemies
            if (action.side === 'ally') {
              nextEnemies = replaceCombatantById(nextEnemies, attackResult.nextDefender)

              if (selectedTarget.currentHp > 0 && attackResult.nextDefender.currentHp === 0) {
                defeatedEnemies.push(selectedTarget)
              }
              battleLogs.push(...attackResult.battleLogs)
              battleLogs.push(...getDeathBoneFlinchLogs(attackResult.nextDefender, attackResult.hitEffects?.some(hit => hit.damage > 0)))
              hitEffects.push(...(attackResult.hitEffects ?? []))
            } else {
              const recoveryResult = resolveRecoveryProgramOnDefeat(attackResult.nextDefender)
              nextParty = replacePartyMember(nextParty, recoveryResult.nextCombatant)
              battleLogs.push(...attackResult.battleLogs)
              battleLogs.push(...recoveryResult.battleLogs)
              hitEffects.push(...(attackResult.hitEffects ?? []))
            }
          } else {
            battleLogs.push(`${actor.name}의 공격 대상이 없다!`)
          }
        }
      }
    }

    const actionEnd = battleLogs.length
    actor = getBattleTurnActor({ action, party: nextParty, enemies: nextEnemies }) ?? actor
    if (canUseSkill) actor = spendBossRecovery(startSkillCooldown(actor, skillData), skillData)

    if (isCombatantAbleToBattle(actor)) {
      const shouldSkipAllyEndTurnStatusDamage =
        action.side === 'ally' && nextEnemies.every((enemy) => !isCombatantAbleToBattle(enemy))
      const endStatusResult = resolveTurnEndCombatantEffects(actor, {
        side: action.side,
        skipEndTurnDamage: shouldSkipAllyEndTurnStatusDamage,
      })
      actor = endStatusResult.nextCombatant
      battleLogs.push(...endStatusResult.battleLogs)
      afterStatus = endStatusResult.statusCues

      if (action.side === 'ally') {
        const recoveryResult = resolveRecoveryProgramOnDefeat(actor)
        actor = recoveryResult.nextCombatant
        battleLogs.push(...recoveryResult.battleLogs)
      }

      const replacedAfterEnd = replaceBattleTurnActor({
        action,
        party: nextParty,
        enemies: nextEnemies,
        actor,
      })
      nextParty = replacedAfterEnd.party
      nextEnemies = replacedAfterEnd.enemies
    }

    actor = getBattleTurnActor({ action, party: nextParty, enemies: nextEnemies }) ?? actor

    if (action.side === 'ally' && defeatedEnemies.length > 0) {
      const experienceResult = applyPartyExperienceGain({
        party: nextParty,
        activeAllyIds,
        defeatedEnemies,
        levelCap,
        inventory,
      })
      nextParty = experienceResult.nextParty
      battleLogs.push(...experienceResult.battleLogs)
      skillLearnEvents.push(...(experienceResult.skillLearnEvents ?? []))
    }
    const bossResponse = resolveBossBattleReactions({ enemies: nextEnemies, actorId: actor.id,
      actorSide: action.side, hitEffects: hitEffects.slice(effectStart), didAct: bossTurn.consumesAction || canUseSkill, phaseBefore, actionsBefore,
      deferPatterns: true, isPatternAction: bossTurn.consumesAction })
    nextEnemies = bossResponse.nextEnemies
    presentation.push({ ...captureBattleLogAction(battleLogs, hitEffects, { logStart, actionStart, actionEnd, effectStart }),
      bossChanges: bossResponse.changes,
      beforeStatus: startStatusResult.blockedStatus ? [createStatusCue(startStatusResult.blockedStatus, 'blocked', actor, action.side)] : [],
      afterStatus: [...supportStates.flatMap(state => state.statusCues ?? []), ...afterStatus],
      afterState: [...supportStates, { targetId: actor.id, targetSide: action.side, targetCurrentHp: actor.currentHp,
        targetPassiveState: actor.passiveState, targetStatusEffect: actor.statusEffect }] })
    battleLogs.push(...bossResponse.battleLogs)
  })

  const miracleRubyResult = applyMiracleRubyTurnHealing({
    party: nextParty,
    activeAllyIds,
  })
  nextParty = miracleRubyResult.nextParty
  battleLogs.push(...miracleRubyResult.battleLogs)
  presentation.push({ afterLogs: miracleRubyResult.battleLogs, effects: [] })

  return {
    nextParty,
    nextEnemies,
    battleLogs,
    skillLearnEvents,
    hitEffects,
    presentation,
  }
}

const createBossCombatant = ({ stage, name, data, gameMode = 'classic' }) => {
  const hpBreakpoints = createBossHpBreakpoints(stage)
  const combatant = createCombatant({
    id: `boss-${stage}-${name}`,
    name,
    imageUrl: data?.imageUrl ?? '',
    data,
    level: getBossLevelForStage(stage, gameMode),
    stageName: data?.stage ?? null,
  })

  return refreshCombatantStats(
    {
      ...combatant,
      isBoss: true,
      bossStage: stage,
      enemyGameMode: gameMode,
      bossHpSegmentCount: hpBreakpoints.length + 1,
      bossHpMarkers: hpBreakpoints,
      bossHpBreakpoints: hpBreakpoints,
      bossEncounter: withBossSegments({ id: 'wild:' + name, kind: 'wild', stage,
        title: '야생 우두머리', name, initialName: name, leader: true, companionIds: [],
        phase: 0, phases: [], rules: [], usedRules: [], actions: 0, hitStreak: 0,
        intro: name + '이(가) 길을 가로막는다!', lastCategory: null,
      }, { line: [name] }),
    },
    {
      preserveMaxHpDelta: true,
    }
  )
}

const evolveBossCombatant = (combatant, targetData) => {
  const hpRatio = combatant.currentHp / Math.max(1, combatant.maxHp)
  const evolved = createEvolvedCombatant(combatant, targetData)
  const next = refreshCombatantStats({ ...evolved, isBoss: combatant.isBoss, bossStage: combatant.bossStage,
    rivalEncounter: combatant.rivalEncounter, enemyStage: combatant.enemyStage, enemyGameMode: combatant.enemyGameMode,
    bossEncounter: combatant.bossEncounter, bossHpBreakpoints: combatant.bossHpBreakpoints,
    bossHpMarkers: combatant.bossHpMarkers, bossHpSegmentCount: combatant.bossHpSegmentCount,
    skillCooldowns: combatant.skillCooldowns, battleGuards: combatant.battleGuards })
  return { ...next, currentHp: combatant.currentHp <= 0 ? 0
    : Math.max(1, Math.min(next.maxHp, Math.floor(next.maxHp * hpRatio))) }
}

const resolveBossBattleReactions = (context) => resolveBossReactions(context, {
  speciesLookup: allDigimonLookup, evolveBoss: evolveBossCombatant, refreshCombatantStats, getSkillData,
})

const buildBaseEnemyParty = (stage, encounterPool, encounterCount, bossEncounterPool = [], options = {}) => {
  const gameMode = normalizeGameMode(options.gameMode)
  const profileStage = getEncounterProfileStage(stage, gameMode)
  if (isBossStage(stage)) {
    const scripted = createBossEncounter({ stage: profileStage, mapName: options.mapName ?? getMapNameForStage(stage, gameMode),
      speciesLookup: allDigimonLookup, createBossCombatant: spec => createBossCombatant({ ...spec, stage, gameMode }), createCombatant, random: Math.random,
      history: options.history, id: options.bossId })
    if (scripted.length) return scripted
    const bossName =
      shuffleItems(bossEncounterPool).find((name) => allDigimonLookup.has(name)) ??
      shuffleItems(encounterPool).find((name) => allDigimonLookup.has(name)) ??
      bossEncounterPool[0] ??
      encounterPool[0]
    const bossData = allDigimonLookup.get(bossName)

    return bossName
      ? [
          createBossCombatant({
            stage,
            gameMode,
            name: bossName,
            data: bossData,
          }),
        ]
      : []
  }

  const rivals = createRivalEncounter({ stage: profileStage, mapName: options.mapName ?? getMapNameForStage(stage, gameMode),
    rivalState: options.rivalState, speciesLookup: allDigimonLookup, createCombatant,
    level: Math.min(isHardMode(gameMode) ? Infinity : getLevelCapForStage(stage, gameMode), getEnemyLevelForStage(stage, gameMode) + (stage < 20 ? -1 : 1)) })
  if (rivals.length) return rivals
  const shuffledNames = pickWildEncounterNames(encounterPool.filter(isPlayableDigimon), allDigimonLookup, Math.min(MAX_ENEMY_COMBATANTS, encounterCount), stage)

  return shuffledNames.slice(0, Math.min(MAX_ENEMY_COMBATANTS, encounterCount)).map((name, index) => {
    const data = allDigimonLookup.get(name)
    const roll = Math.random()
    const level = getEnemyLevelForStage(stage, gameMode, true, roll)
    // Story trials retain the old level sample without consuming another roll.
    const storyBaseLevel = getEnemyLevelForStage(stage, gameMode, false, roll)

    return { ...createCombatant({
      id: `enemy-${stage}-${name}-${index}`,
      name,
      imageUrl: data?.imageUrl ?? '',
      data,
      level,
      stageName: data?.stage ?? null,
    }), storyBaseLevel }
  })
}

const applyEnemyDifficulty = (unit, stage, gameMode) =>
  refreshCombatantStats({ ...unit, enemyStage: stage, enemyGameMode: gameMode }, { preserveMaxHpDelta: true })

const buildEnemyParty = (stage, encounterPool, encounterCount, bossEncounterPool = [], options = {}) =>
  buildBaseEnemyParty(stage, encounterPool, encounterCount, bossEncounterPool, options)
    .map(unit => applyEnemyDifficulty(unit, stage, normalizeGameMode(options.gameMode)))

const buildStartingParty = (names, trainerSkills = {}, collection = null) => {
  const catalog = !collection && !Object.keys(trainerSkills).length ? starterCatalog : createStarterCatalog(allDigimonLookup, trainerSkills, collection)
  const { team, canStart } = getStarterTeamSummary(names, catalog)
  if (!canStart) return []
  return team.map((digimon, index) => createCombatant({
    id: index === 0 ? 'player' : `player-${index + 1}`,
    name: digimon.name,
    imageUrl: digimon.url,
    data: digimon.data,
    level: STARTING_PLAYER_LEVEL,
    stageName: digimon.stage,
    trainerSkills,
  }))
}

const buildDailyStartingParty = (names, challenge, trainerSkills = {}) => {
  if (!isDailyTeamValid(names, challenge)) return []
  return names.map((name, index) => createCombatant({
    id: index === 0 ? 'player' : 'player-2', name, data: allDigimonLookup.get(name),
    level: STARTING_PLAYER_LEVEL, trainerSkills,
  }))
}

function App() {
  const authSession = useAuthSession()
  const localProgress = useLocalProgress()
  const progressStorage = localProgress.storage
  const recordLocalGame = localProgress.recordGame
  const subscribeLocal = localProgress.subscribe
  const getLocalSnapshot = localProgress.getSnapshot
  const [screenMode, setScreenMode] = useState('menu')
  const [selectedMenuKey, setSelectedMenuKey] = useState('new-game')
  const [isHallOpen, setIsHallOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('general')
  const [isBgmSettingsOpen, setIsBgmSettingsOpen] = useState(false)
  const [gameSettings, setGameSettings] = useState(() => loadSettingsFromStorage(progressStorage))
  const [bgmPreviewUrl, setBgmPreviewUrl] = useState(null)
  const [bgmStatus, setBgmStatus] = useState({ state: 'paused', trackUrl: null, isPreview: false })
  const [bgmRetrySignal, setBgmRetrySignal] = useState(0)
  useEffect(() => {
    if (!isBgmSettingsOpen || settingsTab !== 'audio' || screenMode !== 'settings' ||
      bgmPreviewUrl && !gameSettings.enabledBgmUrls.includes(bgmPreviewUrl)) setBgmPreviewUrl(null)
  }, [isBgmSettingsOpen, settingsTab, screenMode, bgmPreviewUrl, gameSettings.enabledBgmUrls])
  const [trainerProgress, setTrainerProgress] = useState(() => loadTrainerProgress(progressStorage))
  const trainerProgressRef = useRef(trainerProgress)
  const [modeProgress, setModeProgress] = useState(() => loadModeProgress(progressStorage, trainerProgress))
  const modeProgressRef = useRef(modeProgress)
  const [selectedGameMode, setSelectedGameMode] = useState('classic')
  const [modeSwitchDirection, setModeSwitchDirection] = useState(null)
  const [dailyDate, setDailyDate] = useState(() => getDailyDate())
  const [selectedDailyNames, setSelectedDailyNames] = useState([])
  const dailyChallenge = useMemo(() => createDailyChallenge(starterCatalog.entries, dailyDate), [dailyDate])
  const modeControl = <GameModeSwitcher mode={selectedGameMode} progress={modeProgress} focusDirection={modeSwitchDirection}
    onChange={(mode, direction) => {
      setSelectedGameMode(mode); setModeSwitchDirection(direction)
      const today = getDailyDate()
      if (today !== dailyDate) { setDailyDate(today); setSelectedDailyNames([]) }
    }} />
  useEffect(() => {
    saveModeProgress(progressStorage, modeProgressRef.current)
    const timer = window.setInterval(() => {
      const today = getDailyDate()
      if (today !== dailyDate) { setDailyDate(today); setSelectedDailyNames([]) }
    }, 15000)
    return () => window.clearInterval(timer)
  }, [progressStorage, dailyDate])
  const trainedStarterCatalog = useMemo(() => createStarterCatalog(allDigimonLookup, trainerProgress.learned, localProgress.collection), [trainerProgress.learned, localProgress.collection])
  const [selectedStarterNames, setSelectedStarterNames] = useState(['아구몬'])
  const [isMatchupGuideOpen, setIsMatchupGuideOpen] = useState(false)
  const [gameState, setGameState] = useState(null)
  const hall = useHallOfFame({ state: gameState, storage: progressStorage, identity: authSession?.identity, itemsFor: getCombatantEquippedItems })
  const hallItemById = useMemo(() => new Map([...fixedRewardItems, ...randomRewardItemPool].map(item => [item.id, item])), [])
  const persistEvolutionMemory = useCallback(memory => {
    const progress = recordTrainerEvolutionMemory(trainerProgressRef.current, memory)
    if (JSON.stringify(progress.evolutionMemory ?? []) === JSON.stringify(trainerProgressRef.current.evolutionMemory ?? [])) return true
    if (!saveTrainerProgress(progress, progressStorage)) return false
    trainerProgressRef.current = progress
    setTrainerProgress(progress)
    return true
  }, [progressStorage])
  const runEvolutionMemory = gameState?.evolutionMemory
  useEffect(() => { persistEvolutionMemory(runEvolutionMemory) }, [runEvolutionMemory, persistEvolutionMemory])
  const latestGameStateRef = useRef(null)
  const replacementInFlightRef = useRef(false)
  useEffect(() => { latestGameStateRef.current = gameState }, [gameState])
  useEffect(() => {
    if (gameState) recordLocalGame(gameState)
  }, [gameState, recordLocalGame])
  useEffect(() => {
    let previousCollection = getLocalSnapshot().collection
    let previousTrust = getLocalSnapshot().regionalTrust
    return subscribeLocal(() => {
      const profile = getLocalSnapshot()
      if (profile.collection === previousCollection && profile.regionalTrust === previousTrust) return
      previousCollection = profile.collection
      previousTrust = profile.regionalTrust
      setGameState(current => {
        if (!current) return current
        current = hydrateRegionalTrust(current, profile.regionalTrust)
        const unlockedSpecies = [...new Set([...(current.unlockedSpecies ?? []), ...profile.unlockedSpecies])].sort()
        const incoming = Object.fromEntries(Object.entries(profile.analysis).map(([name, value]) =>
          [name, Math.max(value, getAnalysisProgress(current.digimonAnalysis, name))]))
        const digimonAnalysis = withoutUnlockedAnalysis({ ...current.digimonAnalysis, ...incoming }, unlockedSpecies)
        return JSON.stringify(current.digimonAnalysis) === JSON.stringify(digimonAnalysis) &&
          JSON.stringify(current.unlockedSpecies) === JSON.stringify(unlockedSpecies) ? current : { ...current, digimonAnalysis, unlockedSpecies }
      })
    })
  }, [subscribeLocal, getLocalSnapshot])
  const [saveSlots, setSaveSlots] = useState(() => readSaveSlots(progressStorage, parseSavedGameState))
  const hasSaveData = saveSlots.some(slot => slot.status !== 'empty')
  const currentMenuKey = selectedMenuKey === 'continue' && !hasSaveData ? 'new-game' : selectedMenuKey
  const [saveDialog, setSaveDialog] = useState(null)
  const saveExitInFlightRef = useRef(false)
  const [selectedBattleCommand, setSelectedBattleCommand] = useState('attack')
  const [battlePanelMode, setBattlePanelMode] = useState('commands')
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0)
  const [hoveredEnemyTargetId, setHoveredEnemyTargetId] = useState(null)
  const [previewedSkill, setPreviewedSkill] = useState(null)
  const [activeCombatantInfo, setActiveCombatantInfo] = useState(null)
  const [itemTooltip, setItemTooltip] = useState(null)
  const [equipmentTooltip, setEquipmentTooltip] = useState(null)
  const [currentLogs, setCurrentLogs] = useState([])
  const [battleHistory, setBattleHistory] = useState([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isTurnOrderOpen, setIsTurnOrderOpen] = useState(false)
  const [effectDetailsId, setEffectDetailsId] = useState(null)
  const logStageRef = useRef(1)
  const explorationActionRef = useRef({ choice: false, continue: false })
  const [rewardState, setRewardState] = useState(null)
  const [rewardTab, setRewardTab] = useState('items')
  const [hatchMessage, setHatchMessage] = useState('')
  const hatchInFlightRef = useRef(false)
  const [partyAdmissionError, setPartyAdmissionError] = useState('')
  const [evolutionState, setEvolutionState] = useState(null)
  const [evolutionScene, setEvolutionScene] = useState(null)
  const evolutionCompletionRef = useRef(null)
  const [mapSelectionState, setMapSelectionState] = useState(null)
  const [skillReplaceState, setSkillReplaceState] = useState(null)
  useEffect(() => { setEquipmentTooltip(null) }, [evolutionState?.mode, evolutionState?.selectedMemberId, evolutionState?.confirmTargetName])
  const battlePlaybackRef = useRef(null)
  const [hitEffects, setHitEffects] = useState([])
  const [attackMotions, setAttackMotions] = useState([])
  const [projectileEffects, setProjectileEffects] = useState([])
  const [switchEffects, setSwitchEffects] = useState([])
  const scanInFlightRef = useRef(false)
  const runAttemptInFlightRef = useRef(false)
  const [scanningTargetIds, setScanningTargetIds] = useState([])
  const [displayedPlayerExpRatio, setDisplayedPlayerExpRatio] = useState(0)
  const [, setIsPlayerExpBarVisible] = useState(false)
  const [isPlayerExpTransitionInstant, setIsPlayerExpTransitionInstant] = useState(false)
  const [levelUpStatPreview, setLevelUpStatPreview] = useState(null)
  const expAnimationTimeoutsRef = useRef([])
  const levelUpStatTimeoutsRef = useRef([])
  const hitEffectTimeoutsRef = useRef([])
  const battleEffectFrameIdsRef = useRef([])
  const battleLogSequenceTimeoutsRef = useRef([])
  const hitEffectIdRef = useRef(0)
  const combatantEffectAnchorRefs = useRef(new Map())
  const combatantEffectPointCacheRef = useRef(new Map())
  const previousPlayerProgressRef = useRef(null)
  useEffect(() => {
    saveSettingsToStorage(gameSettings, progressStorage)
    gameAudio.setVolume(getEffectiveSfxVolume(gameSettings))
  }, [gameSettings, progressStorage])

  const updateGameSetting = (key, value) => {
    setGameSettings((current) =>
      sanitizeSettings({
        ...current,
        [key]: value,
      })
    )
  }

  const toggleBgmTrack = (trackUrl) => {
    setGameSettings((current) => {
      const enabledUrlSet = new Set(current.enabledBgmUrls)

      if (enabledUrlSet.has(trackUrl)) {
        enabledUrlSet.delete(trackUrl)
      } else {
        enabledUrlSet.add(trackUrl)
      }

      return sanitizeSettings({
        ...current,
        enabledBgmUrls: [...enabledUrlSet],
      })
    })
  }

  const switchSettingsTab = (nextTab) => {
    setSettingsTab(nextTab)
    setIsBgmSettingsOpen(false)
  }

  const getGameDuration = (duration) => getScaledDuration(duration, gameSettings.gameSpeed)
  const getExpDuration = (duration) => getScaledDuration(duration, gameSettings.expBarSpeed)

  const clearExpAnimationQueue = () => {
    expAnimationTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    expAnimationTimeoutsRef.current = []
  }

  const clearHitEffectQueue = () => {
    battlePlaybackRef.current?.cancel()
    battlePlaybackRef.current = null
    gameAudio.stopAll('battle')
    hitEffectTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    hitEffectTimeoutsRef.current = []
    battleEffectFrameIdsRef.current.forEach((frameId) => window.cancelAnimationFrame(frameId))
    battleEffectFrameIdsRef.current = []
    setHitEffects([])
    setAttackMotions([])
    setProjectileEffects([])
    setSwitchEffects([])
    scanInFlightRef.current = false
    runAttemptInFlightRef.current = false
    setScanningTargetIds([])
  }

  const presentBattleLogs = (logs) => {
    setCurrentLogs(logs)
    const stage = logStageRef.current
    setBattleHistory(history => appendBattleHistory(history, logs, stage))
  }

  const clearBattleLogSequence = () => {
    battleLogSequenceTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    battleLogSequenceTimeoutsRef.current = []
  }

  const showBattleLogSequence = (logs, { finalBattlePanel = 'commands' } = {}) => {
    const messages = createBattleLog(...logs)
    clearBattleLogSequence()

    if (messages.length === 0) {
      setCurrentLogs([])
      setBattlePanelMode(finalBattlePanel)
      return 0
    }

    setBattlePanelMode('logs')
    presentBattleLogs(messages)
    gameAudio.messages(messages, { speed: gameSettings.gameSpeed })

    const totalDelay = getGameDuration(BATTLE_LOG_FINAL_DELAY_MS)
    const finalTimeoutId = window.setTimeout(() => {
      setBattlePanelMode(finalBattlePanel)
      battleLogSequenceTimeoutsRef.current = battleLogSequenceTimeoutsRef.current.filter(
        (currentTimeoutId) => currentTimeoutId !== finalTimeoutId
      )
    }, totalDelay)
    battleLogSequenceTimeoutsRef.current.push(finalTimeoutId)
    return totalDelay
  }

  const showImmediateBattleLogs = (...logs) => {
    clearBattleLogSequence()
    presentBattleLogs(createBattleLog(...logs))
    gameAudio.messages(logs.filter(Boolean), { speed: gameSettings.gameSpeed })
  }

  const saveStageGameState = (nextGameState) => {
    persistEvolutionMemory(nextGameState.evolutionMemory)
    logStageRef.current = nextGameState.currentStage
    recordLocalGame(nextGameState)
    const profile = getLocalSnapshot()
    saveGameStateToStorage({ ...nextGameState, digimonAnalysis: profile.analysis, unlockedSpecies: profile.unlockedSpecies }, progressStorage)
    setSaveSlots(readSaveSlots(progressStorage, parseSavedGameState))
  }

  const clearStageSave = () => {
    clearSavedGameStateFromStorage(progressStorage)
    setSaveSlots(readSaveSlots(progressStorage, parseSavedGameState))
  }

  const handleTrainerLearn = id => {
    const result = learnTrainerSkill(trainerProgressRef.current, id)
    if (!result.ok) return result
    if (!saveTrainerProgress(result.progress, progressStorage)) return { ok: false, error: '스킬을 저장하지 못했습니다. 다시 시도해 주세요.' }
    trainerProgressRef.current = result.progress
    setTrainerProgress(result.progress)
    return result
  }

  const handleTrainerReset = () => {
    const current = trainerProgressRef.current
    const result = redistributeTrainerSkills(current)
    if (!result.ok) return result
    if (!saveTrainerProgress(result.progress, progressStorage)) return { ok: false, error: '스킬 리셋을 저장하지 못했습니다.' }
    trainerProgressRef.current = result.progress
    setTrainerProgress(result.progress)
    return result
  }

  const grantTrainerVictory = (state, logs) => {
    const nextModeProgress = recordModeVictory(modeProgressRef.current, state)
    if (JSON.stringify(nextModeProgress) !== JSON.stringify(modeProgressRef.current) && saveModeProgress(progressStorage, nextModeProgress)) {
      if (!modeProgressRef.current.classicCleared && nextModeProgress.classicCleared) logs.push('캐주얼 클리어! 하드·데일리·무한 모드가 열렸습니다.')
      modeProgressRef.current = nextModeProgress
      setModeProgress(nextModeProgress)
    }
    const result = awardTrainerVictory(trainerProgressRef.current, state)
    if (result.awarded && saveTrainerProgress(result.progress, progressStorage)) {
      trainerProgressRef.current = result.progress
      setTrainerProgress(result.progress)
      logs.push(`${state.currentStage}스테이지 돌파! 스킬 포인트 +1 SP · 보유 ${getTrainerPoints(result.progress)} SP`)
    }
    return state
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleStorageChange = (event) => {
      if (event.key === progressStorage.key(MODE_PROGRESS_STORAGE_KEY)) {
        const progress = loadModeProgress(progressStorage, trainerProgressRef.current)
        modeProgressRef.current = progress
        setModeProgress(progress)
      }
      if (event.key == null || SAVE_SLOTS.some(slot => event.key === progressStorage.key(slot.key))) {
        setSaveSlots(readSaveSlots(progressStorage, parseSavedGameState))
      }
      if (event.key === progressStorage.key(TRAINER_SKILLS_STORAGE_KEY)) {
        const progress = loadTrainerProgress(progressStorage)
        trainerProgressRef.current = progress
        setTrainerProgress(progress)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [progressStorage])

  const renderBattleSprite = (combatant, side) => (
    <span
      className={[
        'adventure-player__sprite',
        side === 'ally' ? 'adventure-player__sprite--ally' : 'adventure-player__sprite--enemy',
        `adventure-player__sprite--size-${combatant.size}`,
      ].join(' ')}
      role="img"
      aria-label={combatant.name}
      style={{ '--digimon-size-scale': getDigimonDisplayScale(combatant) }}
    />
  )

  const setCombatantEffectAnchorRef = (combatantId) => (element) => {
    if (!combatantId) {
      return
    }

    if (element) {
      combatantEffectAnchorRefs.current.set(combatantId, element)
    } else {
      combatantEffectAnchorRefs.current.delete(combatantId)
    }
  }

  const getCombatantEffectPoint = (combatantId, { preferCached = false } = {}) => {
    const cachedPoint = combatantEffectPointCacheRef.current.get(combatantId)

    if (preferCached && cachedPoint) {
      return cachedPoint
    }

    const element = combatantEffectAnchorRefs.current.get(combatantId)
    const fieldElement = element?.closest('.adventure-field')

    if (!element || !fieldElement) {
      return cachedPoint ?? null
    }

    const elementRect = element.getBoundingClientRect()
    const fieldRect = fieldElement.getBoundingClientRect()

    const scale = fieldRect.width / fieldElement.clientWidth || 1
    const point = {
      x: (elementRect.left - fieldRect.left + elementRect.width / 2) / scale,
      y: (elementRect.top - fieldRect.top + elementRect.height * 0.45) / scale,
      headY: (elementRect.top - fieldRect.top + elementRect.height * 0.18) / scale,
      fieldCenterX: fieldElement.clientWidth / 2,
    }

    combatantEffectPointCacheRef.current.set(combatantId, point)
    return point
  }

  const runAfterBattleLayout = (callback) => {
    const firstFrameId = window.requestAnimationFrame(() => {
      battleEffectFrameIdsRef.current = battleEffectFrameIdsRef.current.filter(
        (frameId) => frameId !== firstFrameId
      )

      const secondFrameId = window.requestAnimationFrame(() => {
        battleEffectFrameIdsRef.current = battleEffectFrameIdsRef.current.filter(
          (frameId) => frameId !== secondFrameId
        )
        callback()
      })

      battleEffectFrameIdsRef.current.push(secondFrameId)
    })

    battleEffectFrameIdsRef.current.push(firstFrameId)
  }

  const showHitEffect = (effect) => {
    if (!effect?.targetId) {
      return
    }

    const hitPoint = getCombatantEffectPoint(effect.targetId)
    const hitX = hitPoint?.x ?? effect.hitX ?? null
    const hitY = hitPoint?.y ?? effect.hitY ?? null
    const damageX = hitPoint?.x ?? effect.damageX ?? effect.hitX ?? null
    const damageY = hitPoint?.headY ?? effect.damageY ?? effect.hitY ?? hitY

    if (!Number.isFinite(hitX) || !Number.isFinite(hitY)) {
      return
    }

    hitEffectIdRef.current += 1
    const stampedEffect = {
      ...effect,
      id: effect.id ?? `${effect.targetId}-${hitEffectIdRef.current}`,
      hitX,
      hitY,
      damageX,
      damageY,
    }

    setHitEffects((current) => [...current, stampedEffect].slice(-8))

    const endTimeoutId = window.setTimeout(() => {
      setHitEffects((current) =>
        current.filter((currentEffect) => currentEffect.id !== stampedEffect.id)
      )
      hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(
        (currentTimeoutId) => currentTimeoutId !== endTimeoutId
      )
    }, getGameDuration(Math.max(HIT_EFFECT_DURATION_MS, DAMAGE_TEXT_DURATION_MS, effect.durationMs ?? 0)))

    hitEffectTimeoutsRef.current.push(endTimeoutId)
  }

  const applyVisualAttackDamage = (effect) => {
    const hasHpChange = Number.isFinite(effect?.targetCurrentHp)
    const hasCombatantChange = effect?.targetCombatant?.id === effect?.targetId && Boolean(effect?.targetId)
    const removesEnemy = effect?.targetSide === 'enemy' && effect?.removeCombatant === true
    const hasStatusChange =
      effect && Object.prototype.hasOwnProperty.call(effect, 'targetStatusEffect')

    if (!effect?.targetId || (!hasHpChange && !hasStatusChange && !hasCombatantChange && !removesEnemy)) {
      return
    }

    setGameState((current) => {
      if (!current || screenMode !== 'adventure') {
        return current
      }

      if (removesEnemy) return { ...current, enemies: (current.enemies ?? []).filter(unit => unit.id !== effect.targetId) }

      const applyHitResult = (combatant) => {
        if (!combatant || combatant.id !== effect.targetId) {
          return combatant
        }

        const next = hasCombatantChange ? { ...combatant, ...effect.targetCombatant } : combatant
        return {
          ...next,
          currentHp: hasHpChange
            ? Math.max(0, Math.min(next.maxHp, effect.targetCurrentHp))
            : next.currentHp,
          statusEffect: hasStatusChange
            ? normalizeStatusEffect(effect.targetStatusEffect)
            : next.statusEffect,
          passiveState: effect.targetPassiveState ?? next.passiveState,
        }
      }

      if (effect.targetSide === 'ally') {
        const nextParty = (current.party ?? []).map(applyHitResult)
        const nextPlayer =
          current.player?.id === effect.targetId ? applyHitResult(current.player) : current.player

        return {
          ...current,
          player: nextPlayer,
          party: nextParty,
          ...(current.regionalSupport?.unit?.id === effect.targetId
            ? { regionalSupport: { ...current.regionalSupport, unit: applyHitResult(current.regionalSupport.unit) } } : {}),
        }
      }

      const enemies = current.enemies ?? []
      const insertsEnemy = effect.insertCombatant && hasCombatantChange &&
        effect.targetCombatant.id === effect.targetId && !enemies.some(unit => unit.id === effect.targetId)
      return {
        ...current,
        enemies: insertsEnemy ? [...enemies, effect.targetCombatant] : enemies.map(applyHitResult),
      }
    })
  }

  const playBattleAttackEffects = (effects = [], options = {}) => {
    const timeline = createBattlePresentation({ effects, ...options })
    battlePlaybackRef.current?.cancel()
    if (!timeline.durationMs) { options.onComplete?.(); return 0 }
    const speed = gameSettings.gameSpeed
    clearBattleLogSequence()
    setCurrentLogs([])
    setBattlePanelMode('logs')
    const motions = timeline.casts.map(({ event, targets, plan }) => ({
      ...event, id: 'attack-' + ++hitEffectIdRef.current, speed, presentation: plan, targets,
    }))
    battlePlaybackRef.current = playBattleCueSequence(timeline, {
      speed,
      setTimer: (callback, delay) => {
        const timer = window.setTimeout(() => {
          hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(id => id !== timer)
          callback()
        }, delay)
        hitEffectTimeoutsRef.current.push(timer)
        return timer
      },
      clearTimer: timer => {
        window.clearTimeout(timer)
        hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(id => id !== timer)
      },
      onComplete: () => { battlePlaybackRef.current = null; options.onComplete?.() },
      onCues: cues => {
        for (const cue of cues) {
          if (cue.kind === 'state') { cue.units.forEach(applyVisualAttackDamage); continue }
          if (cue.kind === 'status') { cue.events.forEach(event => showHitEffect({ ...event, speed })); continue }
          if (cue.kind === 'boss') { showHitEffect({ ...cue.event, kind: 'boss', bossKind: cue.event.kind, speed }); continue }
          if (cue.kind === 'logs') { presentBattleLogs(cue.logs); gameAudio.messages(cue.logs, { speed }); continue }
          const motion = motions[cue.index], plan = motion.presentation
          if (cue.kind === 'motion') {
            motion.startedAt = performance.now()
            setAttackMotions(current => [...current, motion].slice(-8)); gameAudio.attack(motion, 'charge')
          } else if (cue.kind === 'launch') gameAudio.attack(motion, 'launch', cue.shotIndex)
          else if (cue.kind === 'impact') {
            gameAudio.impact(motion)
            for (const [index, target] of motion.targets.entries()) {
              const hit = { ...target, id: motion.id + ':' + index, speed, presentation: plan }
              showHitEffect(hit); applyVisualAttackDamage(hit)
            }
          } else if (cue.kind === 'cleanup') setAttackMotions(current => current.filter(effect => effect.id !== motion.id))
        }
      },
    })
    return timeline.durationMs / speed
  }

  const runAfterBattleAttackEffects = (effects, callback, options = {}) => {
    playBattleAttackEffects(effects, { ...options, onComplete: callback })
  }

  useEffect(() => {
    if (!rewardState?.isRevealing) {
      return undefined
    }

    const activeRevealKey = rewardState.revealKey
    const revealTimeoutId = window.setTimeout(() => {
      setRewardState((current) =>
        current?.revealKey === activeRevealKey
          ? {
              ...current,
              isRevealing: false,
            }
          : current
      )
    }, REWARD_REVEAL_DURATION_MS)

    return () => {
      window.clearTimeout(revealTimeoutId)
    }
  }, [rewardState?.isRevealing, rewardState?.revealKey])

  const clearLevelUpStatAnimationQueue = () => {
    levelUpStatTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    levelUpStatTimeoutsRef.current = []
  }

  const openCombatantInfo = (combatantInfoId, element) => {
    if (battlePanelMode !== 'commands' || isPartyPanelOpen || isItemPanelOpen || rewardState || mapSelectionState || evolutionState) return
    setItemTooltip(null)
    setEquipmentTooltip(null)
    setActiveCombatantInfo({ id: combatantInfoId, anchor: element })
  }

  const closeCombatantInfo = () => {
    setActiveCombatantInfo(null)
  }

  const inspectCombatantEffects = (id) => {
    setActiveCombatantInfo(null)
    setItemTooltip(null)
    setEquipmentTooltip(null)
    setEffectDetailsId(id)
  }

  const queueSkillReplacementEvents = (events = []) => {
    const validEvents = events.filter((event) => event?.combatantId && event?.newSkillName)

    if (!validEvents.length) {
      return
    }

    setSkillReplaceState((current) => {
      const remainingQueue = current?.queue?.slice(current.index ?? 0) ?? []
      const queuedIds = new Set(remainingQueue.map((event) => event.id))
      const nextEvents = validEvents.filter((event) => !queuedIds.has(event.id))

      if (!nextEvents.length) {
        return current
      }

      return {
        queue: [...remainingQueue, ...nextEvents],
        index: 0,
      }
    })
  }

  // Persist unresolved inheritance on the combatant so automatic saves can resume it.
  useEffect(() => {
    if (!gameState || evolutionScene) return
    queueSkillReplacementEvents(getPendingJogressSkillEvents(syncPartyMember(gameState.party, gameState.player)))
  }, [gameState?.party, evolutionScene])

  const advanceSkillReplacementQueue = () => {
    setSkillReplaceState((current) => {
      if (!current?.queue?.length) {
        return null
      }

      const nextIndex = (current.index ?? 0) + 1

      if (nextIndex >= current.queue.length) {
        return null
      }

      return {
        ...current,
        index: nextIndex,
      }
    })
  }

  const commitSkillReplacementChoice = (activeEvent, oldSkillName = null) => {
    const current = latestGameStateRef.current ?? gameState
    if (!current || !activeEvent?.combatantId) return false
    const currentParty = syncPartyMember(current.party, current.player)
    const targetMember = getCombatantById(currentParty, activeEvent.combatantId)
    if (!targetMember) return false
    let updatedMember
    if (activeEvent.source === 'jogress') {
      updatedMember = resolveJogressSkillChoice(targetMember, activeEvent.newSkillName, oldSkillName)
    } else if (oldSkillName && targetMember.skills?.includes(oldSkillName)) {
      const skills = [...new Set(targetMember.skills.map(name => name === oldSkillName ? activeEvent.newSkillName : name))]
        .slice(0, MAX_COMBATANT_SKILL_COUNT)
      updatedMember = { ...targetMember, skills,
        ...(targetMember.inheritedSkills ? { inheritedSkills: normalizeInheritedSkills(targetMember.inheritedSkills)
          .filter(name => skills.includes(name) || targetMember.pendingJogressSkills?.includes(name)) } : {}) }
    }
    if (!updatedMember) return false
    const party = replacePartyMember(currentParty, updatedMember)
    const nextState = { ...current, party,
      player: current.player?.id === updatedMember.id ? updatedMember : getCombatantById(party, current.player?.id) ?? current.player }
    latestGameStateRef.current = nextState
    setGameState(nextState)
    if (activeEvent.source === 'jogress') saveStageGameState(nextState)
    return true
  }

  const handleSkipSkillReplacement = () => {
    const event = skillReplaceState?.queue?.[skillReplaceState.index ?? 0]
    if (event?.source === 'jogress') commitSkillReplacementChoice(event)
    advanceSkillReplacementQueue()
  }

  const handleReplaceSkill = (oldSkillName) => {
    const event = skillReplaceState?.queue?.[skillReplaceState.index ?? 0]
    commitSkillReplacementChoice(event, oldSkillName)
    advanceSkillReplacementQueue()
  }

  const showLevelUpStatPreview = (previousStats, currentStats, evolutionTargets = [], sourceName = null) => {
    const statRows = LEVEL_UP_STAT_KEYS.map((statKey) => {
      const startValue = previousStats?.[statKey] ?? currentStats?.[statKey] ?? 0
      const endValue = currentStats?.[statKey] ?? startValue

      return {
        key: statKey,
        label: LEVEL_UP_STAT_LABEL_MAP[statKey],
        startValue,
        endValue,
        gain: Math.max(0, endValue - startValue),
        value: startValue,
      }
    })
    const newlyAvailableEvolutionTargets = [...evolutionTargets]

    if (
      !statRows.some((row) => row.gain > 0) &&
      newlyAvailableEvolutionTargets.length === 0
    ) {
      return
    }

    clearLevelUpStatAnimationQueue()
    gameAudio.situation('level-up', { speed: gameSettings.expBarSpeed })
    setLevelUpStatPreview({
      isExiting: false,
      rows: statRows,
      sourceName,
      evolutionTargets: newlyAvailableEvolutionTargets,
    })

    const steps = 14
    const startDelay = 120

    for (let step = 1; step <= steps; step += 1) {
      const timeoutId = window.setTimeout(() => {
        const progress = step / steps
        const easedProgress = 1 - (1 - progress) ** 3

        setLevelUpStatPreview((current) =>
          current
            ? {
                ...current,
                rows: statRows.map((row) => ({
                  ...row,
                  value: Math.round(row.startValue + (row.endValue - row.startValue) * easedProgress),
                })),
                evolutionTargets: newlyAvailableEvolutionTargets,
              }
            : current
        )
      }, startDelay + (LEVEL_UP_STAT_ANIMATION_MS / steps) * step)
      levelUpStatTimeoutsRef.current.push(timeoutId)
    }

    const exitTimeoutId = window.setTimeout(() => {
      setLevelUpStatPreview((current) => (current ? { ...current, isExiting: true } : current))
    }, startDelay + LEVEL_UP_STAT_ANIMATION_MS + LEVEL_UP_STAT_VISIBLE_AFTER_MS)
    levelUpStatTimeoutsRef.current.push(exitTimeoutId)

    const removeTimeoutId = window.setTimeout(() => {
      setLevelUpStatPreview(null)
    }, startDelay + LEVEL_UP_STAT_ANIMATION_MS + LEVEL_UP_STAT_VISIBLE_AFTER_MS + 280)
    levelUpStatTimeoutsRef.current.push(removeTimeoutId)
  }

  const getBattleContext = (battleState = gameState) => {
    if (!battleState) {
      return {
        party: [],
        activeAllyIds: [],
        activeAllies: [],
        actingAllyId: null,
        actingAlly: null,
      }
    }

    let party = battleState.party?.length
      ? applyMapEnvironment({ ...battleState, party: syncPartyMember(battleState.party, battleState.player) }).party
      : []
    let activeAllyIds = battleState.activeAllyIds ?? getActiveAllyIdsForParty(
      party,
      [battleState.player?.id],
      getBattleAllyLimit(battleState)
    )
    ;({ party, activeAllyIds } = regionalBattleContext(battleState, party, activeAllyIds))
    party = applyMapEnvironment({ ...battleState, party, activeAllyIds }).party
    const activeAllies = activeAllyIds.map(id => getCombatantById(party, id)).filter(isCombatantAbleToBattle)
    const preferredActingAllyId =
      activeAllyIds.includes(battleState.actingAllyId) &&
      !isRegionalSupport(getCombatantById(party, battleState.actingAllyId)) &&
      isCombatantAbleToBattle(getCombatantById(party, battleState.actingAllyId))
        ? battleState.actingAllyId
        : null
    const actingAllyId =
      preferredActingAllyId ??
      getNextActingAllyId(party, activeAllyIds, battleState.actedAllyIds ?? []) ??
      (activeAllyIds.length ? getFirstLivingPartyMember(party, activeAllyIds)?.id : null) ??
      null

    return {
      party,
      activeAllyIds,
      activeAllies,
      actingAllyId,
      actingAlly: getCombatantById(party, actingAllyId),
    }
  }

  const finishExplorationBattle = (resolvedState, { escaped = false, skillLearnEvents = [] } = {}) => {
    const outcome = completeStoryBattle(resolvedState, refreshCombatantStats, { escaped })
    if (!outcome.ok) return false
    if (outcome.continueBattle) {
      const nextBattle = buildEventBattle(outcome.state, { createCombatant, allDigimonLookup, getActiveAllyIdsForParty, refreshCombatantStats })
      if (!nextBattle.ok) return false
      const nextState = recordEncounterAnalysis(nextBattle.state)
      const recalled = getBattleContext(resolvedState).activeAllies.filter(unit => !nextState.activeAllyIds.includes(unit.id))
      clearBattleLogSequence()
      clearHitEffectQueue()
      setRewardState(null)
      setGameState(nextState)
      saveStageGameState(nextState)
      setBattlePanelMode(recalled.length ? 'animating' : 'commands')
      setSelectedBattleCommand('attack')
      setSelectedSkillIndex(0)
      showImmediateBattleLogs('통로를 돌파했다! 마지막 수호자가 나타났다!', ...recalled.map(unit => `${unit.name}, 돌아와!`), getBattlePrompt(nextState.player.name))
      if (recalled.length) runAfterBattleRecall(recalled, () => setBattlePanelMode('commands'))
      gameAudio.situation('encounter', { speed: gameSettings.gameSpeed })
      queueSkillReplacementEvents(skillLearnEvents)
      return true
    }
    if (escaped) runAfterBattleRecall(resolvedState.enemies.filter(isCombatantAbleToBattle), () => {}, 'enemy')
    clearBattleLogSequence()
    setRewardState(null)
    setGameState(outcome.state)
    saveStageGameState(outcome.state)
    setBattlePanelMode('logs')
    setSelectedBattleCommand('attack')
    setSelectedSkillIndex(0)
    explorationActionRef.current = { choice: true, continue: false }
    // Detailed party changes belong to the story result. Combat logs retain the
    // active fight's conclusion without reintroducing reserve recovery chatter.
    showImmediateBattleLogs(escaped ? '동료들과 전투에서 물러났다.' : '의뢰 전투에서 승리했다!',
      outcome.state.explorationEvent.result.ending, ...(outcome.recoveryLogs ?? []))
    gameAudio.situation(escaped ? 'recall' : 'victory', { speed: gameSettings.gameSpeed })
    queueSkillReplacementEvents(skillLearnEvents)
    return true
  }

  const finishBattleAction = ({
    nextParty,
    nextEnemies,
    logs,
    actedAllyId,
    hitEffects: actionHitEffects = [],
    nextInventory = gameState?.inventory ?? {},
    nextAnalysis = gameState?.digimonAnalysis ?? {},
    nextGold = gameState?.gold ?? 0,
    preferredActiveAllyIds = gameState?.activeAllyIds ?? [],
  }) => {
    if (!gameState) {
      return
    }

    playBattleAttackEffects(actionHitEffects)

    const passiveTurn = resolveNonAttackActionEnd(nextParty, actedAllyId)
    let resolvedParty = passiveTurn.nextParty
    let resolvedEnemies = [...nextEnemies]
    let resolvedLogs = [...logs, ...passiveTurn.battleLogs]
    let presentedLogCount = 0
    let activeAllyIds = [...preferredActiveAllyIds]
    ;({ party: resolvedParty, activeAllyIds } = regionalBattleContext(gameState, resolvedParty, activeAllyIds))
    let actedAllyIds = Array.from(
      new Set([...(gameState.actedAllyIds ?? []), actedAllyId].filter(Boolean))
    )
    const pendingAllyActions = (gameState.pendingAllyActions ?? []).filter(action =>
      action.side === 'ally' && action.actorId !== actedAllyId && activeAllyIds.includes(action.actorId) &&
      isCombatantAbleToBattle(getCombatantById(resolvedParty, action.actorId)))
      .map(action => Number.isFinite(getCombatantById(resolvedParty, action.actorId)?.speed)
        ? { ...action, speed: getCombatantById(resolvedParty, action.actorId).speed } : action)

    let victoryReward = null
    const commitBattleState = ({ nextPlayer, battlePanel, nextActedAllyIds = actedAllyIds, stageCleared = false, questOutcome = null }) => {
      const countedState = stageCleared || !nextActedAllyIds.length ? advanceRunTurn(gameState) : gameState
      const nextState = commitRegionalBattleState({
        ...(questOutcome?.state ?? countedState),
        player: nextPlayer,
        party: resolvedParty,
        enemies: resolvedEnemies,
        inventory: nextInventory,
        digimonAnalysis: nextAnalysis,
        gold: nextGold,
        activeAllyIds,
        actingAllyId: nextPlayer?.id ?? null,
        actedAllyIds: nextActedAllyIds,
        pendingAllyActions: nextActedAllyIds.length ? pendingAllyActions : [],
        awaitingReplacement: false,
      }, { finished: stageCleared })
      if (battlePanel === 'commands' && !nextActedAllyIds.length && getFaintReplacement(nextState)) {
        nextState.awaitingReplacement = true
        nextState.actingAllyId = null
        battlePanel = 'replacement'
        resolvedLogs.push(getReplacementPrompt(nextState))
      }
      // Persist only completed rounds. Saving a half-collected command would let
      // an ally act twice after sanitizeGameStateForSave clears its command queue.
      if (stageCleared) {
        if (nextState.currentStage === 200 && nextState.runStats) nextState.runStats = { ...nextState.runStats, finalClear: true }
        nextState.rewardCheckpoint = createRewardCheckpoint(victoryReward, nextState.currentStage)
        grantTrainerVictory(nextState, resolvedLogs)
        saveStageGameState(nextState)
      } else if (!nextActedAllyIds.length && ['commands', 'replacement'].includes(battlePanel)) saveStageGameState(nextState)
      setGameState(nextState)
      if (!presentedLogCount) passiveTurn.statusCues?.forEach(event => showHitEffect({ ...event, speed: gameSettings.gameSpeed }))
      const logsToPresent =
        presentedLogCount > 0 ? resolvedLogs.slice(presentedLogCount) : resolvedLogs
      showBattleLogSequence(logsToPresent, { finalBattlePanel: battlePanel })

      if (battlePanel === 'commands') {
        setSelectedBattleCommand('attack')
        setSelectedSkillIndex(0)
      }

    }

    const commitVictory = () => {
      if (gameState.explorationEvent?.phase === 'battle' && finishExplorationBattle({ ...advanceRunTurn(gameState),
        party: resolvedParty, player: getFirstLivingPartyMember(resolvedParty, activeAllyIds), enemies: resolvedEnemies,
        activeAllyIds, inventory: nextInventory, digimonAnalysis: nextAnalysis, gold: nextGold })) return
      gameAudio.situation('victory', { speed: gameSettings.gameSpeed })
      const guest = resolvedParty.find(isRegionalSupport)
      if (guest && isCombatantAbleToBattle(guest)) {
        runAfterBattleRecall([guest], () => {})
        resolvedLogs.push(guest.name + '이(가) 지역 주민에게 돌아갔다. 함께해 줘서 고마워!')
      }
      resolvedParty = ownedBattleUnits(resolvedParty)
      activeAllyIds = activeAllyIds.filter(id => resolvedParty.some(unit => unit.id === id))
      const rest = recoverAfterVictory(resolvedParty, isBossStage(gameState.currentStage), activeAllyIds)
      resolvedParty = rest.nextParty
      resolvedLogs.push(...rest.battleLogs)
      activeAllyIds = getActiveAllyIdsForParty(
        resolvedParty,
        activeAllyIds,
        getBattleAllyLimit(gameState)
      )
      nextGold += getStageClearGoldReward(gameState.currentStage, nextInventory)
      resolvedLogs.push(isDailyMode(gameState) ? '보상을 선택해 주세요.' : '보상을 선택하거나 스캔 데이터로 디지몬을 부화시켜 주세요.')
      const rewardTarget = getFirstLivingPartyMember(resolvedParty, activeAllyIds)
      victoryReward = createRewardSelection(
          nextInventory,
          resolvedParty,
          gameState.levelCap,
          gameState.currentStage,
          0,
          gameState.gameMode
        )
      setRewardState(victoryReward)
      commitBattleState({
        nextPlayer: rewardTarget,
        battlePanel: 'logs',
        nextActedAllyIds: [],
        stageCleared: true,
      })
    }

    const commitDefeat = () => {
      gameAudio.situation('loss', { speed: gameSettings.gameSpeed })
      const failedQuest = completeStoryBattle({ ...gameState, party: resolvedParty, enemies: resolvedEnemies, activeAllyIds }, refreshCombatantStats, { defeated: true })
      if (failedQuest.ok) {
        recordLocalGame(failedQuest.state)
        resolvedLogs.push(failedQuest.state.explorationEvent.result.ending, ...failedQuest.logs.slice(1))
      }
      clearStageSave()
      resolvedLogs.push('눈앞이 깜깜해졌다...')
      commitBattleState({
        questOutcome: failedQuest.ok ? failedQuest : null,
        nextPlayer: getCombatantById(resolvedParty, actedAllyId) ?? resolvedParty[0] ?? gameState.player,
        battlePanel: 'logs',
      })
      window.setTimeout(() => {
        clearBattleLogSequence()
        setScreenMode('menu')
        setGameState(null)
        setRewardState(null)
        setEvolutionState(null)
        setCurrentLogs([])
      }, 3000)
    }

    if (!hasLivingOwnedAlly(resolvedParty)) {
      commitDefeat()
      return
    }

    if (resolvedEnemies.every((enemy) => !isCombatantAbleToBattle(enemy))) {
      commitVictory()
      return
    }

    let nextActingAllyId = getNextActingAllyId(resolvedParty, activeAllyIds, actedAllyIds)

    if (nextActingAllyId) {
      const nextPlayer = getCombatantById(resolvedParty, nextActingAllyId)
      resolvedLogs.push(getBattlePrompt(nextPlayer.name))
      commitBattleState({ nextPlayer, battlePanel: 'commands' })
      return
    }

    pendingAllyActions.push(...createRegionalSupportActions({ party: resolvedParty, enemies: resolvedEnemies,
      activeAllyIds, startOrder: pendingAllyActions.length }))
    // An ally may have queued an attack before its partner chose to scan or switch.
    // Resolve that command with the enemy turn instead of discarding the queue.
    if (pendingAllyActions.length) {
      const enemyActions = createEnemyBattleTurnActions({ enemies: resolvedEnemies, party: resolvedParty,
        activeAllyIds, startOrder: pendingAllyActions.length })
      const turnResult = resolveBattleTurnActions({ party: resolvedParty, enemies: resolvedEnemies, activeAllyIds,
        actions: [...pendingAllyActions, ...enemyActions], levelCap: gameState.levelCap, inventory: nextInventory })
      const allLogs = [...resolvedLogs, ...turnResult.battleLogs]
      runAfterBattleAttackEffects(turnResult.hitEffects, () => finishResolvedTurn({
        nextParty: turnResult.nextParty, nextEnemies: turnResult.nextEnemies, logs: allLogs,
        skillLearnEvents: turnResult.skillLearnEvents, nextInventory, nextAnalysis, nextGold,
        preferredActiveAllyIds: activeAllyIds, alreadyPresentedLogCount: allLogs.length,
      }), { logs: allLogs, presentation: turnResult.presentation, prefixLogs: resolvedLogs,
        prefixStatus: passiveTurn.statusCues, prefixState: passiveTurn.visualState })
      return
    }

    resolvedLogs.push('상대의 차례!')
    const enemyPhaseResult = resolveEnemyPartyActions({
      enemies: resolvedEnemies,
      party: resolvedParty,
      activeAllyIds,
      inventory: nextInventory,
    })
    resolvedEnemies = enemyPhaseResult.nextEnemies
    resolvedParty = enemyPhaseResult.nextParty
    const enemyPhasePrefixLogs = [...resolvedLogs]
    resolvedLogs.push(...enemyPhaseResult.battleLogs)
    presentedLogCount = resolvedLogs.length

    runAfterBattleAttackEffects(enemyPhaseResult.hitEffects, () => {
      const miracleRubyResult = applyMiracleRubyTurnHealing({
        party: resolvedParty,
        activeAllyIds,
      })
      resolvedParty = miracleRubyResult.nextParty
      resolvedLogs.push(...miracleRubyResult.battleLogs)
      actedAllyIds = []

      if (!hasLivingOwnedAlly(resolvedParty)) {
        commitDefeat()
        return
      }

      if (resolvedEnemies.every((enemy) => !isCombatantAbleToBattle(enemy))) {
        commitVictory()
        return
      }

      nextActingAllyId = getNextActingAllyId(resolvedParty, activeAllyIds, actedAllyIds)
      const nextPlayer =
        getCombatantById(resolvedParty, nextActingAllyId) ??
        getFirstLivingPartyMember(resolvedParty, activeAllyIds) ?? resolvedParty[0]
      if (!getFaintReplacement({ party: resolvedParty, enemies: resolvedEnemies, activeAllyIds })) {
        resolvedLogs.push(getBattlePrompt(nextPlayer.name))
      }
      commitBattleState({ nextPlayer, battlePanel: 'commands', nextActedAllyIds: [] })
    }, { logs: resolvedLogs, presentation: enemyPhaseResult.presentation, prefixLogs: enemyPhasePrefixLogs,
      prefixStatus: passiveTurn.statusCues, prefixState: passiveTurn.visualState })
  }

  const finishResolvedTurn = ({
    nextParty,
    nextEnemies,
    logs,
    skillLearnEvents = [],
    nextInventory = gameState?.inventory ?? {},
    nextAnalysis = gameState?.digimonAnalysis ?? {},
    nextGold = gameState?.gold ?? 0,
    preferredActiveAllyIds = gameState?.activeAllyIds ?? [],
    nextEscapeAttempts = gameState?.escapeAttempts ?? 0,
    alreadyPresentedLogCount = 0,
  }) => {
    if (!gameState) {
      return
    }

    const turnState = advanceRunTurn(gameState)
    let resolvedParty = [...nextParty]
    let resolvedEnemies = [...nextEnemies]
    let resolvedLogs = [...logs]
    let activeAllyIds = [...preferredActiveAllyIds]
    ;({ party: resolvedParty, activeAllyIds } = regionalBattleContext(gameState, resolvedParty, activeAllyIds))

    let victoryReward = null
    const commitBattleState = ({ nextPlayer, battlePanel, stageCleared = false, questOutcome = null }) => {
      const nextState = commitRegionalBattleState({
        ...(questOutcome?.state ?? turnState),
        player: nextPlayer,
        party: resolvedParty,
        enemies: resolvedEnemies,
        inventory: nextInventory,
        digimonAnalysis: nextAnalysis,
        gold: nextGold,
        escapeAttempts: nextEscapeAttempts,
        activeAllyIds,
        actingAllyId: nextPlayer?.id ?? null,
        actedAllyIds: [],
        pendingAllyActions: [],
        awaitingReplacement: false,
      }, { finished: stageCleared })
      if (battlePanel === 'commands' && getFaintReplacement(nextState)) {
        nextState.awaitingReplacement = true
        nextState.actingAllyId = null
        battlePanel = 'replacement'
        resolvedLogs.push(getReplacementPrompt(nextState))
      }
      if (stageCleared) {
        if (nextState.currentStage === 200 && nextState.runStats) nextState.runStats = { ...nextState.runStats, finalClear: true }
        nextState.rewardCheckpoint = createRewardCheckpoint(victoryReward, nextState.currentStage)
        grantTrainerVictory(nextState, resolvedLogs)
        saveStageGameState(nextState)
      } else if (['commands', 'replacement'].includes(battlePanel)) saveStageGameState(nextState)
      setGameState(nextState)
      const logsToPresent =
        alreadyPresentedLogCount > 0 ? resolvedLogs.slice(alreadyPresentedLogCount) : resolvedLogs
      showBattleLogSequence(logsToPresent, { finalBattlePanel: battlePanel })
      setSelectedBattleCommand('attack')
      setSelectedSkillIndex(0)
      queueSkillReplacementEvents(skillLearnEvents)
    }

    const commitVictory = () => {
      if (gameState.explorationEvent?.phase === 'battle' && finishExplorationBattle({ ...turnState,
        party: resolvedParty, player: getFirstLivingPartyMember(resolvedParty, activeAllyIds), enemies: resolvedEnemies,
        activeAllyIds, inventory: nextInventory, digimonAnalysis: nextAnalysis, gold: nextGold }, { skillLearnEvents })) return
      gameAudio.situation('victory', { speed: gameSettings.gameSpeed })
      const guest = resolvedParty.find(isRegionalSupport)
      if (guest && isCombatantAbleToBattle(guest)) {
        runAfterBattleRecall([guest], () => {})
        resolvedLogs.push(guest.name + '이(가) 지역 주민에게 돌아갔다. 함께해 줘서 고마워!')
      }
      resolvedParty = ownedBattleUnits(resolvedParty)
      activeAllyIds = activeAllyIds.filter(id => resolvedParty.some(unit => unit.id === id))
      const rest = recoverAfterVictory(resolvedParty, isBossStage(gameState.currentStage), activeAllyIds)
      resolvedParty = rest.nextParty
      resolvedLogs.push(...rest.battleLogs)
      activeAllyIds = getActiveAllyIdsForParty(
        resolvedParty,
        activeAllyIds,
        getBattleAllyLimit(gameState)
      )
      nextGold += getStageClearGoldReward(gameState.currentStage, nextInventory)
      resolvedLogs.push('전투에서 승리했다!')
      const rewardTarget = getFirstLivingPartyMember(resolvedParty, activeAllyIds)
      victoryReward = createRewardSelection(
          nextInventory,
          resolvedParty,
          gameState.levelCap,
          gameState.currentStage,
          0,
          gameState.gameMode
        )
      setRewardState(victoryReward)
      commitBattleState({
        nextPlayer: rewardTarget,
        battlePanel: 'logs',
        stageCleared: true,
      })
    }

    const commitDefeat = () => {
      gameAudio.situation('loss', { speed: gameSettings.gameSpeed })
      const failedQuest = completeStoryBattle({ ...turnState, party: resolvedParty, enemies: resolvedEnemies, activeAllyIds }, refreshCombatantStats, { defeated: true })
      if (failedQuest.ok) {
        recordLocalGame(failedQuest.state)
        resolvedLogs.push(failedQuest.state.explorationEvent.result.ending, ...failedQuest.logs.slice(1))
      }
      clearStageSave()
      resolvedLogs.push('눈앞이 깜깜해졌다...')
      commitBattleState({
        questOutcome: failedQuest.ok ? failedQuest : null,
        nextPlayer:
          getFirstLivingPartyMember(resolvedParty, activeAllyIds) ??
          resolvedParty[0] ??
          gameState.player,
        battlePanel: 'logs',
      })
      window.setTimeout(() => {
        clearBattleLogSequence()
        setScreenMode('menu')
        setGameState(null)
        setRewardState(null)
        setEvolutionState(null)
        setCurrentLogs([])
      }, 3000)
    }

    if (!hasLivingOwnedAlly(resolvedParty)) {
      commitDefeat()
      return
    }

    if (resolvedEnemies.every((enemy) => !isCombatantAbleToBattle(enemy))) {
      commitVictory()
      return
    }

    const nextPlayer = getFirstLivingPartyMember(resolvedParty, activeAllyIds) ?? resolvedParty[0]
    if (!getFaintReplacement({ party: resolvedParty, enemies: resolvedEnemies, activeAllyIds })) {
      resolvedLogs.push(getBattlePrompt(nextPlayer.name))
    }
    commitBattleState({ nextPlayer, battlePanel: 'commands' })
  }

  const startNextStage = ({ currentGameState, currentPlayer, nextStageNum, mapName }) => {
    currentGameState = recordRivalVictory(currentGameState)
    const encounterGroup = getEncounterGroupForStage(nextStageNum)
    const requestedCount = getEncounterCountForStage(nextStageNum)
    const levelCap = getLevelCapForStage(nextStageNum, currentGameState.gameMode)
    const mapEncounterPool = getMapEncounterGroups(mapName)?.[encounterGroup] ?? []
    const bossEncounterPool = getBossEncounterNamesForStage(mapName, nextStageNum)
    const newEnemies = buildEnemyParty(
      nextStageNum,
      mapEncounterPool,
      requestedCount,
      bossEncounterPool,
      { mapName, history: currentGameState.bossHistory ?? [], rivalState: currentGameState.rivalState, gameMode: currentGameState.gameMode }
    )
    const encounterCount = newEnemies.length
    const bossId = newEnemies.find(unit => !unit.rivalEncounter && unit.bossEncounter?.leader)?.bossEncounter.id
    const eggProgressResult = isDailyMode(currentGameState) ? { nextParty: syncPartyMember(currentGameState.party, currentPlayer), hatchLogs: [] } : progressDigiEggPartyByStage(
      syncPartyMember(currentGameState.party, currentPlayer), currentGameState.inventory
    )
    const didMoveMap = isMapMoveStage(nextStageNum)
    const nextParty = eggProgressResult.nextParty.map(unit => enforceCombatantLevelCap(
      prepareCombatantForStage(unit, { mapChanged: didMoveMap || mapName !== currentGameState.currentMap }, refreshCombatantStats),
      levelCap, refreshCombatantStats))
    const preferredActiveAllyIds = [
      currentPlayer?.id,
      ...(currentGameState.regionalSupport?.originalActiveIds ?? []),
      ...(currentGameState.activeAllyIds ?? []),
    ].filter(Boolean)
    const nextActiveAllyIds = getActiveAllyIdsForParty(
      nextParty,
      preferredActiveAllyIds,
      getBattleAllyLimit({
        encounterCount,
        enemies: newEnemies,
      })
    )
    const recalledAllies = getBattleContext(currentGameState).activeAllies
      .filter(unit => !nextActiveAllyIds.includes(unit.id))
    const recalledEnemies = getLivingCombatants(currentGameState.enemies)
    const nextPlayer =
      getCombatantById(nextParty, currentPlayer?.id) ??
      getFirstLivingPartyMember(nextParty, nextActiveAllyIds) ??
      currentPlayer

    let nextGameState = recordEncounterAnalysis({
      ...currentGameState,
      regionalSupport: null,
      currentStage: nextStageNum,
      explorationEvent: null,
      rewardCheckpoint: null,
      currentMap: mapName,
      encounterGroup,
      encounterCount,
      encounterPool: mapEncounterPool,
      levelCap,
      enemies: newEnemies,
      bossHistory: bossId ? [...(currentGameState.bossHistory ?? []), bossId].slice(-8) : currentGameState.bossHistory ?? [],
      player: nextPlayer,
      party: nextParty,
      activeAllyIds: nextActiveAllyIds,
      actingAllyId: nextPlayer?.id ?? null,
      actedAllyIds: [],
      pendingAllyActions: [],
      escapeAttempts: 0,
      awaitingReplacement: false,
    })

    nextGameState = attachRegionalSupport(nextGameState, { speciesLookup: allDigimonLookup, createCombatant, refreshStats: refreshCombatantStats })
    const arrivingSupport = nextGameState.regionalSupport?.unit
    setGameState(nextGameState)
    setRewardTab('items')
    setHatchMessage('')
    gameAudio.situation(isBossStage(nextStageNum) ? 'boss' : 'encounter', { speed: gameSettings.gameSpeed })
    saveStageGameState(nextGameState)
    setIsPlayerExpBarVisible(false)
    showImmediateBattleLogs(
      didMoveMap ? '새로운 지역에 도착해 파티 전원이 부활하고 완전히 회복됐다!' : null,
      ...recalledAllies.map(unit => `${unit.name}, 돌아와!`),
      ...getBossIntroLogs(newEnemies.filter(unit => !unit.rivalEncounter)),
      ...getRivalIntroLogs(newEnemies),
      arrivingSupport ? arrivingSupport.name + '이(가) 지역의 약속을 지키러 왔다! 이번 보스전에 자동으로 함께 싸운다.' : null,
      getBattlePrompt(nextPlayer?.name ?? '디지몬')
    )
    setSelectedBattleCommand('attack')
    setSelectedSkillIndex(0)
    setBattlePanelMode(recalledAllies.length || recalledEnemies.length || arrivingSupport ? 'animating' : 'commands')
    setRewardState(null)
    setEvolutionState(null)
    setMapSelectionState(null)
    if (recalledAllies.length || arrivingSupport) {
      runAfterBattleRecall(recalledAllies, () => {
        if (!recalledEnemies.length) setBattlePanelMode('commands')
      }, 'ally', arrivingSupport ? [arrivingSupport] : [])
    }
    if (recalledEnemies.length) {
      runAfterBattleRecall(recalledEnemies, () => setBattlePanelMode('commands'), 'enemy', newEnemies)
    }
  }

  const handleNextStage = (currentGameState, currentPlayer, { cleared = false } = {}) => {
    currentGameState = recordRivalVictory(currentGameState)
    const nextStageNum = currentGameState.currentStage + 1
    if (nextStageNum > getModeStageLimit(currentGameState)) {
      clearStageSave()
      setScreenMode('menu')
      setGameState(null)
      setRewardState(null)
      setEvolutionState(null)
      setMapSelectionState(null)
      clearBattleLogSequence()
      setCurrentLogs([])
      return
    }

    const explorationEvent = createExplorationEvent(currentGameState, { cleared, totalStages: getModeStageLimit(currentGameState) })
    if (explorationEvent) {
      const nextState = { ...currentGameState, explorationEvent }
      explorationActionRef.current = { choice: false, continue: false }
      setGameState(nextState)
      saveStageGameState(nextState)
      setRewardState(null)
      setActiveCombatantInfo(null)
      setItemTooltip(null)
      setBattlePanelMode('logs')
      showImmediateBattleLogs('길목에서 잠시 여정을 준비할 기회를 찾았다.')
      return
    }

    if (isMapMoveStage(nextStageNum)) {
      const hasMapItem = (currentGameState.inventory?.[MAP_ITEM_ID] ?? 0) > 0

      if (hasMapItem) {
        setMapSelectionState({
          currentGameState,
          currentPlayer,
          nextStageNum,
          options: getConnectedMapNames(currentGameState.currentMap),
        })
        showImmediateBattleLogs('지도를 펼쳤다. 다음에 이동할 지역을 선택하세요!')
        setBattlePanelMode('logs')
        setSelectedBattleCommand('attack')
        return
      }
    }

    const nextMapName = isMapMoveStage(nextStageNum)
      ? getRandomConnectedMapName(currentGameState.currentMap, nextStageNum)
      : currentGameState.currentMap ?? getMapNameForStage(nextStageNum)

    startNextStage({
      currentGameState,
      currentPlayer,
      nextStageNum,
      mapName: nextMapName,
    })
  }

  const handleSelectMapDestination = (mapName) => {
    if (!mapSelectionState || !mapName) {
      return
    }

    startNextStage({
      currentGameState: mapSelectionState.currentGameState,
      currentPlayer: mapSelectionState.currentPlayer,
      nextStageNum: mapSelectionState.nextStageNum,
      mapName,
    })
  }

  const handleExplorationChoice = (choiceId) => {
    if (explorationActionRef.current.choice || !gameState?.explorationEvent) return
    if (typeof choiceId === 'object' && explorationActionRef.current.revision === choiceId.revision) return
    const currentState = { ...gameState, party: syncPartyMember(gameState.party, gameState.player) }
    const outcome = resolveExplorationChoice(currentState, choiceId, refreshCombatantStats)
    if (!outcome.ok) return
    let nextState = outcome.state
    if (outcome.requestBattle) {
      const battle = buildEventBattle(nextState, { createCombatant, allDigimonLookup, getActiveAllyIdsForParty, refreshCombatantStats })
      if (!battle.ok) return
      nextState = recordEncounterAnalysis(battle.state)
      const recalled = getBattleContext(currentState).activeAllies.filter(unit => !nextState.activeAllyIds.includes(unit.id))
      clearHitEffectQueue()
      setActiveCombatantInfo(null)
      setItemTooltip(null)
      setRewardState(null)
      setSelectedBattleCommand('attack')
      setSelectedSkillIndex(0)
      setBattlePanelMode(recalled.length ? 'animating' : 'commands')
      if (recalled.length) runAfterBattleRecall(recalled, () => setBattlePanelMode('commands'))
    }
    explorationActionRef.current.choice = Boolean(nextState.explorationEvent.result || outcome.requestBattle)
    if (typeof choiceId === 'object') explorationActionRef.current.revision = choiceId.revision
    setGameState(nextState)
    saveStageGameState(nextState)
    if (outcome.logs.length) showImmediateBattleLogs(...outcome.logs)
    if (outcome.sound) gameAudio.situation(outcome.sound, { speed: gameSettings.gameSpeed })
  }

  const handleContinueExploration = () => {
    if (!gameState?.explorationEvent?.result || explorationActionRef.current.continue) return
    explorationActionRef.current.continue = true
    handleNextStage(gameState, gameState.player)
  }

  const handleSkillSelect = (skillIndex) => {
    setPreviewedSkill(null)
    if (rewardState || !gameState || battlePanelMode !== 'attack') {
      return
    }

    const playerSkill = battleSkillSlots[skillIndex]

    if (!playerSkill || getSkillCooldown(getBattleContext().actingAlly, getSkillData(playerSkill, getBattleContext().actingAlly)) > 0) {
      return
    }

    setSelectedSkillIndex(skillIndex)
    setSelectedBattleCommand('attack')

    const playerSkillData = getSkillData(playerSkill, getBattleContext().actingAlly)
    const livingEnemies = gameState.enemies.filter((enemy) => isCombatantAbleToBattle(enemy))

    if (!shouldChooseEnemyTarget(playerSkillData, livingEnemies.length)) {
      setHoveredEnemyTargetId(null)
      handleExecuteSkill(
        skillIndex,
        isEnemyTargetSkill(playerSkillData) && getSkillTargetScope(playerSkillData) === 'single'
          ? livingEnemies[0]?.id ?? null
          : null
      )
      return
    }

    setBattlePanelMode('attack-targets')
    setHoveredEnemyTargetId(null)
    clearBattleLogSequence()
    setCurrentLogs([])
  }

  const handleTargetPreview = (enemyId) => {
    if (rewardState || !gameState || battlePanelMode !== 'attack-targets') {
      return
    }

    setActiveCombatantInfo(null)
    setHoveredEnemyTargetId(enemyId)
  }

  const handleTargetPreviewClear = () => {
    setHoveredEnemyTargetId(null)
  }

  const handleExecuteSkill = (skillIndex, targetEnemyId = null) => {
    const battleContext = getBattleContext()
    const actingAlly = battleContext.actingAlly

    if (
      rewardState ||
      !gameState ||
      !['attack', 'attack-targets'].includes(battlePanelMode) ||
      !actingAlly ||
      !isCombatantAbleToBattle(actingAlly)
    ) {
      return
    }

    const playerSkill = battleSkillSlots[skillIndex]
    if (!playerSkill || getSkillCooldown(actingAlly, getSkillData(playerSkill, actingAlly)) > 0) return

    setSelectedSkillIndex(skillIndex)
    setHoveredEnemyTargetId(null)
    setSelectedBattleCommand('attack')
    const playerSkillData = getSkillData(playerSkill, actingAlly)
    const isAreaAttack = isSkillAreaAttack(playerSkillData)
    const needsEnemyTarget = isEnemyTargetSkill(playerSkillData)
    const isSingleEnemyTarget =
      needsEnemyTarget && getSkillTargetScope(playerSkillData) === 'single'

    const targetEnemy = !needsEnemyTarget
      ? null
      : isAreaAttack
        ? gameState.enemies[getLivingEnemyIndex(gameState.enemies)]
        : gameState.enemies.find(
            (enemy) => enemy.id === targetEnemyId && isCombatantAbleToBattle(enemy)
          )

    if (needsEnemyTarget && !targetEnemy) {
      showImmediateBattleLogs(
        isAreaAttack ? '공격할 수 있는 적이 없다!' : `${actingAlly.name}의 공격 대상을 선택해줘!`
      )
      setBattlePanelMode(isAreaAttack ? 'attack' : 'attack-targets')
      return
    }

    const livingActiveAllyIds = battleContext.activeAllyIds.filter((allyId) =>
      !isRegionalSupport(getCombatantById(battleContext.party, allyId)) &&
      isCombatantAbleToBattle(getCombatantById(battleContext.party, allyId))
    )
    const pendingActions = (gameState.pendingAllyActions ?? []).filter(
      (action) =>
        livingActiveAllyIds.includes(action.actorId) &&
        action.actorId !== actingAlly.id &&
        action.side === 'ally'
    )
    const nextAllyAction = createBattleTurnAction({
      side: 'ally',
      actor: actingAlly,
      skillName: playerSkill,
      targetId: isSingleEnemyTarget ? targetEnemy?.id ?? null : null,
      order: pendingActions.length,
    })
    const nextPendingActions = [...pendingActions, nextAllyAction]
    const nextActedAllyIds = getPlannedAllyIds(livingActiveAllyIds, gameState.actedAllyIds, nextPendingActions)

    if (nextActedAllyIds.length < livingActiveAllyIds.length) {
      const nextActingAllyId = getNextActingAllyId(
        battleContext.party,
        battleContext.activeAllyIds,
        nextActedAllyIds
      )
      const nextPlayer =
        getCombatantById(battleContext.party, nextActingAllyId) ??
        getFirstLivingPartyMember(battleContext.party, battleContext.activeAllyIds)

      setGameState(commitRegionalBattleState({
        ...gameState,
        player: nextPlayer,
        party: battleContext.party,
        activeAllyIds: battleContext.activeAllyIds,
        actingAllyId: nextPlayer?.id ?? null,
        actedAllyIds: nextActedAllyIds,
        pendingAllyActions: nextPendingActions,
      }))
      showImmediateBattleLogs(`${actingAlly.name}의 행동을 정했다!`, getBattlePrompt(nextPlayer.name))
      setBattlePanelMode('commands')
      setSelectedSkillIndex(0)
      return
    }

    nextPendingActions.push(...createRegionalSupportActions({ party: battleContext.party, enemies: gameState.enemies,
      activeAllyIds: battleContext.activeAllyIds, startOrder: nextPendingActions.length }))
    const enemyActions = createEnemyBattleTurnActions({
      enemies: gameState.enemies,
      party: battleContext.party,
      activeAllyIds: battleContext.activeAllyIds,
      startOrder: nextPendingActions.length,
    })
    const turnResult = resolveBattleTurnActions({
      party: battleContext.party,
      enemies: gameState.enemies,
      activeAllyIds: battleContext.activeAllyIds,
      actions: [...nextPendingActions, ...enemyActions],
      levelCap: gameState.levelCap,
      inventory: gameState.inventory,
    })

    runAfterBattleAttackEffects(turnResult.hitEffects, () => {
      finishResolvedTurn({
        nextParty: turnResult.nextParty,
        nextEnemies: turnResult.nextEnemies,
        logs: turnResult.battleLogs,
        skillLearnEvents: turnResult.skillLearnEvents,
        preferredActiveAllyIds: battleContext.activeAllyIds,
        alreadyPresentedLogCount: turnResult.battleLogs.length,
      })
    }, { logs: turnResult.battleLogs, presentation: turnResult.presentation })
  }

  useEffect(() => {
    if (screenMode === 'adventure') {
      return undefined
    }

    clearHitEffectQueue()
    return undefined
  }, [screenMode])

  useEffect(() => {
    const scheduleExpAnimationUpdate = (callback, delay = 0) => {
      const timeoutId = window.setTimeout(callback, delay)
      expAnimationTimeoutsRef.current.push(timeoutId)
    }

    if (!gameState?.player) {
      clearExpAnimationQueue()
      clearLevelUpStatAnimationQueue()
      previousPlayerProgressRef.current = null
      scheduleExpAnimationUpdate(() => {
        setIsPlayerExpBarVisible(false)
        setIsPlayerExpTransitionInstant(true)
        setDisplayedPlayerExpRatio(0)
        setLevelUpStatPreview(null)
      })
      return undefined
    }

    const currentSnapshot = {
      id: gameState.player.id,
      level: gameState.player.level,
      ratio: getExperienceRatio(gameState.player),
      stats: getLevelUpStatValues(gameState.player),
      partyProgress: getPartyEvolutionProgress(gameState.party?.length ? gameState.party : [gameState.player], gameState.inventory, getReadyEvolutionPreviewTargets, getLevelUpStatValues, gameState.evolutionMemory),
    }
    const previousSnapshot = previousPlayerProgressRef.current

    clearExpAnimationQueue()

    if (!previousSnapshot || previousSnapshot.id !== currentSnapshot.id) {
      scheduleExpAnimationUpdate(() => {
        setIsPlayerExpBarVisible(false)
        setIsPlayerExpTransitionInstant(true)
        setDisplayedPlayerExpRatio(currentSnapshot.ratio)
      })

      scheduleExpAnimationUpdate(() => {
        setIsPlayerExpTransitionInstant(false)
      }, 30)
      previousPlayerProgressRef.current = currentSnapshot
      return undefined
    }

    const levelGainCount = Math.max(0, currentSnapshot.level - previousSnapshot.level)
    const hasExperienceProgressChanged = levelGainCount > 0 || previousSnapshot.ratio !== currentSnapshot.ratio

    const newlyReadyEvolutionTargets = getNewLevelEvolutionTargets(previousSnapshot.partyProgress, currentSnapshot.partyProgress)
    if (levelGainCount === 0 && newlyReadyEvolutionTargets.length > 0) {
      const gained = currentSnapshot.partyProgress.find(member => member.id === newlyReadyEvolutionTargets[0].sourceId)
      const before = previousSnapshot.partyProgress.find(member => member.id === gained.id)
      scheduleExpAnimationUpdate(() => showLevelUpStatPreview(before.stats, gained.stats, newlyReadyEvolutionTargets, gained.name))
    }
    if (levelGainCount === 0) {
      if (!hasExperienceProgressChanged) {
        previousPlayerProgressRef.current = currentSnapshot
        return undefined
      }

      scheduleExpAnimationUpdate(() => {
        setIsPlayerExpBarVisible(true)
        setIsPlayerExpTransitionInstant(false)
        setDisplayedPlayerExpRatio(previousSnapshot.ratio)
      })

      scheduleExpAnimationUpdate(() => {
        setDisplayedPlayerExpRatio(currentSnapshot.ratio)
      }, 30)

      scheduleExpAnimationUpdate(() => {
        setIsPlayerExpBarVisible(false)
      }, 30 + getExpDuration(EXP_BAR_ANIMATION_MS) + getExpDuration(EXP_BAR_VISIBLE_AFTER_MS))

      previousPlayerProgressRef.current = currentSnapshot
      return undefined
    }

    scheduleExpAnimationUpdate(() => {
      setIsPlayerExpBarVisible(true)
      setIsPlayerExpTransitionInstant(false)
      setDisplayedPlayerExpRatio(previousSnapshot.ratio)
      showLevelUpStatPreview(previousSnapshot.stats, currentSnapshot.stats, newlyReadyEvolutionTargets)
    })

    let elapsed = 30

    for (let index = 0; index < levelGainCount; index += 1) {
      scheduleExpAnimationUpdate(() => {
        setIsPlayerExpTransitionInstant(false)
        setDisplayedPlayerExpRatio(100)
      }, elapsed)
      elapsed += getExpDuration(EXP_BAR_ANIMATION_MS)

      scheduleExpAnimationUpdate(() => {
        setIsPlayerExpTransitionInstant(true)
        setDisplayedPlayerExpRatio(0)
      }, elapsed)
      elapsed += EXP_BAR_RESET_MS
    }

    scheduleExpAnimationUpdate(() => {
      setIsPlayerExpTransitionInstant(false)
      setDisplayedPlayerExpRatio(currentSnapshot.ratio)
    }, elapsed)

    scheduleExpAnimationUpdate(() => {
      setIsPlayerExpBarVisible(false)
    }, elapsed + getExpDuration(EXP_BAR_ANIMATION_MS) + getExpDuration(EXP_BAR_VISIBLE_AFTER_MS))

    previousPlayerProgressRef.current = currentSnapshot

    return undefined
  }, [
    gameState?.player?.id,
    gameState?.player?.level,
    gameState?.player?.experience,
    gameState?.player?.experienceToNext,
    gameState?.inventory,
    gameState?.party,
    gameState?.evolutionMemory,
  ])

  useEffect(
    () => () => {
      battlePlaybackRef.current?.cancel()
      expAnimationTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      levelUpStatTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      hitEffectTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      battleEffectFrameIdsRef.current.forEach((frameId) => window.cancelAnimationFrame(frameId))
      battleLogSequenceTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    },
    []
  )

  const resetAdventureUiState = () => {
    saveExitInFlightRef.current = false
    replacementInFlightRef.current = false
    hatchInFlightRef.current = false
    setRewardTab('items')
    setHatchMessage('')
    setPartyAdmissionError('')
    gameAudio.stopAll()
    setItemTooltip(null)
    clearHitEffectQueue()
    clearExpAnimationQueue()
    clearLevelUpStatAnimationQueue()
    clearBattleLogSequence()
    setRewardState(null)
    setEvolutionState(null)
    setEvolutionScene(null)
    evolutionCompletionRef.current = null
    setMapSelectionState(null)
    setSkillReplaceState(null)
    setLevelUpStatPreview(null)
    setCurrentLogs([])
    setSelectedBattleCommand('attack')
    setBattlePanelMode('commands')
    setSelectedSkillIndex(0)
    setHoveredEnemyTargetId(null)
    setActiveCombatantInfo(null)
    setIsPlayerExpBarVisible(false)
    setIsPlayerExpTransitionInstant(true)
    setBattleHistory([])
    setIsHistoryOpen(false)
    setIsTurnOrderOpen(false)
    setEffectDetailsId(null)
    setIsMatchupGuideOpen(false)
    logStageRef.current = 1
    explorationActionRef.current = { choice: false, continue: false }
  }

  const getSaveTransitionBusy = () => isSaveTransitionBusy({ battlePanelMode, rewardState, evolutionScene,
    mapSelectionState, explorationEvent: gameState?.explorationEvent, skillReplaceState,
    actionTimers: hitEffectTimeoutsRef.current.length, logTimers: battleLogSequenceTimeoutsRef.current.length,
    scanning: scanInFlightRef.current, replacing: replacementInFlightRef.current })

  const canOpenExitSaveDialog = screenMode === 'adventure' && Boolean(gameState)
  useEffect(() => {
    const handleEscape = event => {
      if (event.key !== 'Escape' || event.repeat || event.defaultPrevented || !canOpenExitSaveDialog || saveDialog || isMatchupGuideOpen) return
      event.preventDefault()
      setSaveSlots(readSaveSlots(progressStorage, parseSavedGameState))
      setSaveDialog({ mode: 'exit', error: '' })
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [canOpenExitSaveDialog, saveDialog, isMatchupGuideOpen, progressStorage])

  useEffect(() => {
    if (screenMode !== 'adventure') setSaveDialog(current => current?.mode === 'exit' ? null : current)
  }, [screenMode])

  const handleSaveAndExit = slotId => {
    if (!gameState || saveExitInFlightRef.current || getSaveTransitionBusy() || !SAVE_SLOTS.some(slot => slot.id === slotId && !slot.automatic)) return false
    saveExitInFlightRef.current = true
    try {
      const current = recordRivalVictory(latestGameStateRef.current ?? gameState)
      if (!recordLocalGame(current)) throw new Error('Progress save failed')
      const profile = getLocalSnapshot()
      const state = { ...current, party: syncPartyMember(current.party, current.player),
        digimonAnalysis: profile.analysis, unlockedSpecies: profile.unlockedSpecies }
      const resumeUi = createSaveResumeUi({ state, rewardState, rewardTab, mapSelectionState, skillReplaceState, evolutionState,
        rewardCheckpoint: rewardState ? createRewardCheckpoint(rewardState, state.currentStage) : null })
      if (!saveGameStateToStorage(state, progressStorage, { slotId, resumeUi })) throw new Error('Save failed')
      setSaveSlots(readSaveSlots(progressStorage, parseSavedGameState))
      resetAdventureUiState()
      saveExitInFlightRef.current = true
      latestGameStateRef.current = null
      setGameState(null)
      setSaveDialog(null)
      setScreenMode('menu')
      return true
    } catch {
      saveExitInFlightRef.current = false
      setSaveDialog(current => ({ ...current, error: '저장하지 못했습니다. 저장 공간을 확인한 뒤 다시 시도해 주세요.' }))
      return false
    }
  }

  const handleDeleteSaveSlot = slotId => {
    if (saveDialog?.mode !== 'load' || !deleteSaveSlot(progressStorage, slotId)) {
      return { ok: false, error: '저장 기록을 삭제하지 못했습니다. 저장 공간을 확인한 뒤 다시 시도해 주세요.' }
    }
    setSaveSlots(readSaveSlots(progressStorage, parseSavedGameState))
    setSaveDialog(current => current && { ...current, error: '' })
    return { ok: true }
  }

  const handleLoadSaveSlot = slotId => {
    const snapshot = loadSavedGameStateFromStorage(progressStorage, getLocalSnapshot(), slotId)
    if (!snapshot) {
      setSaveSlots(readSaveSlots(progressStorage, parseSavedGameState))
      setSaveDialog(current => ({ ...current, error: '이 저장을 불러오지 못했습니다. 다른 슬롯을 선택해 주세요.' }))
      return false
    }
    if (!canPlayGameMode(snapshot.gameMode, modeProgressRef.current)) {
      setSaveDialog(current => ({ ...current, error: '캐주얼을 1회 클리어하면 이 모드의 저장을 이어할 수 있습니다.' }))
      return false
    }
    const { saveResumeUi = null, ...savedRun } = snapshot
    const savedGameState = { ...savedRun, evolutionMemory: mergeEvolutionMemory(savedRun.evolutionMemory, trainerProgressRef.current.evolutionMemory) }
    resetAdventureUiState()
    setSaveDialog(null)
    // Keep legacy automatic-save migration. A manual load never replaces another
    // snapshot; the next ordinary stage/round checkpoint still writes automatic.
    if (slotId === 'auto') saveStageGameState(savedGameState)
    latestGameStateRef.current = savedGameState
    setGameState(savedGameState)
    const rewardSource = saveResumeUi
      ? { ...savedGameState, rewardCheckpoint: saveResumeUi.reward?.checkpoint ?? null }
      : savedGameState
    const restoredReward = restoreRewardCheckpoint(rewardSource, rewardItemLookup)
    if (restoredReward) {
      setRewardState({ ...restoredReward, selectedRandomItemId: saveResumeUi?.reward?.selectedRandomItemId ?? null,
        pendingTarget: saveResumeUi?.reward?.pendingTarget ?? null,
        rerollCost: getRewardRerollCost(savedGameState.currentStage, restoredReward.rerollCount, savedGameState.inventory) })
      setRewardTab(isDailyMode(savedGameState) ? 'items' : saveResumeUi?.reward?.tab ?? 'scan')
    }
    if (saveResumeUi?.mapSelection) setMapSelectionState({ ...saveResumeUi.mapSelection,
      currentGameState: savedGameState, currentPlayer: savedGameState.player })
    if (saveResumeUi?.skillReplaceState) setSkillReplaceState(saveResumeUi.skillReplaceState)
    if (saveResumeUi?.evolutionState) setEvolutionState(saveResumeUi.evolutionState)
    logStageRef.current = savedGameState.currentStage
    setDisplayedPlayerExpRatio(getExperienceRatio(savedGameState.player))
    if (saveResumeUi?.mapSelection) {
      setBattlePanelMode('logs')
      showImmediateBattleLogs('다음에 이동할 지역을 선택하세요!')
    } else if (savedGameState.explorationEvent && savedGameState.explorationEvent.phase !== 'battle') {
      setBattlePanelMode('logs')
      showImmediateBattleLogs('탐험 이벤트에서 여정을 이어갑니다.')
    } else if (restoredReward) {
      setBattlePanelMode('logs')
      showImmediateBattleLogs(isDailyMode(savedGameState) ? '남은 보상을 선택해 주세요.' : '남은 보상을 선택하거나 스캔 데이터로 디지몬을 부화시켜 주세요.')
    } else if (savedGameState.awaitingReplacement) {
      setSelectedBattleCommand('swap')
      setBattlePanelMode('replacement')
      showImmediateBattleLogs(getReplacementPrompt(savedGameState))
    } else showImmediateBattleLogs(getBattlePrompt(savedGameState.player?.name ?? '디지몬'))
    setScreenMode('adventure')
    return true
  }

  const handleMenuAction = (actionKey) => {
    setSelectedMenuKey(actionKey)
    if (actionKey === 'hall-of-fame') { setIsHallOpen(true); return }
    if (actionKey === 'skills' || actionKey === 'town' || actionKey === 'dex') {
      setScreenMode(actionKey)
      return
    }
    if (actionKey === 'new-game') {
      setDailyDate(getDailyDate())
      setSelectedDailyNames([])
      resetAdventureUiState()
      setScreenMode('new-game')
      return
    }

    if (actionKey === 'settings') {
      switchSettingsTab('general')
      setScreenMode('settings')
      return
    }

    if (actionKey === 'continue') {
      setSaveSlots(readSaveSlots(progressStorage, parseSavedGameState))
      setSaveDialog({ mode: 'load', error: '' })
    }
  }

  const handleRunAttempt = () => {
    if (
      runAttemptInFlightRef.current ||
      rewardState ||
      mapSelectionState ||
      !gameState ||
      gameState.awaitingReplacement ||
      battlePanelMode === 'logs' ||
      battlePanelMode === 'animating'
    ) {
      return
    }

    const battleContext = getBattleContext()
    const currentParty = battleContext.party
    const activeAllyIds = battleContext.activeAllyIds
    const livingEnemies = getLivingCombatants(gameState.enemies)
    const actingAlly =
      battleContext.actingAlly ??
      getFirstLivingPartyMember(currentParty, activeAllyIds) ??
      gameState.player

    if (!actingAlly || livingEnemies.length === 0) {
      return
    }

    if (isEscapeBlocked(gameState)) {
      showImmediateBattleLogs('보스·중간보스전에서는 도망칠 수 없습니다.')
      return
    }

    runAttemptInFlightRef.current = true
    const nextEscapeAttempts = (gameState.escapeAttempts ?? 0) + 1
    const runSucceeded = rollRunAttempt({
      party: currentParty,
      activeAllyIds,
      enemies: gameState.enemies,
      attemptCount: nextEscapeAttempts,
    })
    const runLogs = [`${actingAlly.name}은(는) 도망치려 했다!`]

    setSelectedBattleCommand('run')
    setHoveredEnemyTargetId(null)

    if (runSucceeded) {
      const nextPlayer =
        getCombatantById(currentParty, gameState.player?.id) ??
        getFirstLivingPartyMember(currentParty, activeAllyIds) ??
        actingAlly
      const escapedGameState = {
        ...advanceRunTurn(gameState),
        player: nextPlayer,
        party: currentParty,
        activeAllyIds,
        actedAllyIds: [],
        pendingAllyActions: [],
        escapeAttempts: 0,
      }

      if (gameState.explorationEvent?.phase === 'battle' && finishExplorationBattle(escapedGameState, { escaped: true })) {
        runAttemptInFlightRef.current = false
        return
      }

      setGameState(escapedGameState)
      setBattlePanelMode('logs')
      showImmediateBattleLogs(...runLogs, '무사히 도망쳤다!', '보상 없이 다음 스테이지로 이동한다.')

      const runTimer = window.setTimeout(() => {
        hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(id => id !== runTimer)
        runAttemptInFlightRef.current = false
        handleNextStage(escapedGameState, escapedGameState.player)
      }, getGameDuration(RUN_STAGE_ADVANCE_DELAY_MS))
      hitEffectTimeoutsRef.current.push(runTimer)
      return
    }

    const passiveTurn = resolveNonAttackActionEnd(currentParty, actingAlly.id)
    const enemyActions = createEnemyBattleTurnActions({
      enemies: gameState.enemies,
      party: passiveTurn.nextParty,
      activeAllyIds,
    })
    const turnResult = resolveBattleTurnActions({
      party: passiveTurn.nextParty,
      enemies: gameState.enemies,
      activeAllyIds,
      actions: enemyActions,
      levelCap: gameState.levelCap,
      inventory: gameState.inventory,
    })
    const failureLogs = [
      ...runLogs,
      '도망칠 수 없었다!',
      ...passiveTurn.battleLogs,
      ...(enemyActions.length > 0 ? ['상대의 차례!'] : []),
      ...turnResult.battleLogs,
    ]

    runAfterBattleAttackEffects(turnResult.hitEffects, () => {
      runAttemptInFlightRef.current = false
      finishResolvedTurn({
        nextParty: turnResult.nextParty,
        nextEnemies: turnResult.nextEnemies,
        logs: failureLogs,
        skillLearnEvents: turnResult.skillLearnEvents,
        preferredActiveAllyIds: activeAllyIds,
        nextEscapeAttempts,
        alreadyPresentedLogCount: failureLogs.length,
      })
    }, { logs: failureLogs, presentation: turnResult.presentation,
      prefixLogs: failureLogs.slice(0, failureLogs.length - turnResult.battleLogs.length),
      prefixStatus: passiveTurn.statusCues, prefixState: passiveTurn.visualState })
  }

  const handleBattleCommandSelect = (commandKey) => {
    if (
      rewardState ||
      mapSelectionState ||
      !gameState ||
      gameState.awaitingReplacement ||
      battlePanelMode === 'logs' ||
      battlePanelMode === 'animating'
    ) {
      return
    }

    const isPriorityCommand = commandKey === 'swap' || commandKey === 'run'

    if ((gameState.pendingAllyActions ?? []).length > 0 && !['attack', 'items'].includes(commandKey) && !isPriorityCommand) {
      const currentActingAlly = getBattleContext().actingAlly ?? gameState.player
      setSelectedBattleCommand('attack')
      setBattlePanelMode('commands')
      showImmediateBattleLogs('남은 아군의 기술을 먼저 선택해줘!', getBattlePrompt(currentActingAlly.name))
      return
    }

    setSelectedBattleCommand(commandKey)

    if (commandKey === 'attack') {
      setBattlePanelMode('attack')
      setSelectedSkillIndex(0)
      setHoveredEnemyTargetId(null)
      return
    }

    if (commandKey === 'items') {
      setBattlePanelMode('items')
      setHoveredEnemyTargetId(null)
      return
    } else if (commandKey === 'swap') {
      setBattlePanelMode('party')
      setHoveredEnemyTargetId(null)
      return
    } else if (commandKey === 'run') {
      handleRunAttempt()
      return
    }

    setBattlePanelMode('commands')
  }

  const handleAttackTargetSelect = (enemyId) => {
    if (rewardState || !gameState || battlePanelMode !== 'attack-targets') {
      return
    }

    setHoveredEnemyTargetId(null)
    handleExecuteSkill(selectedSkillIndex, enemyId)
  }

  const handleScanEnemies = () => {
    if (!allowsScanning(gameState)) return
    const context = getBattleContext()
    if (!gameState || rewardState || battlePanelMode !== 'items' || scanInFlightRef.current ||
      !isCombatantAbleToBattle(context.actingAlly)) return
    if (!(gameState.inventory?.['card-blue'] > 0)) return
    const targets = gameState.enemies.filter(unit => isCombatantAbleToBattle(unit) && canScanSpecies(unit, gameState.unlockedSpecies))
    if (!targets.some(unit => getAnalysisProgress(gameState.digimonAnalysis, unit) < 100)) return
    const result = addAnalysis(gameState.digimonAnalysis, targets, target =>
      getTrainerScanGain(gameState.trainerSkills, getItemScanGain(gameState.inventory, ANALYSIS_SCAN_GAIN), target, 'card'), gameState.unlockedSpecies)
    scanInFlightRef.current = true
    setScanningTargetIds(targets.map(unit => unit.id))
    setBattlePanelMode('animating')
    setHoveredEnemyTargetId(null)
    showImmediateBattleLogs(`${context.actingAlly.name}이(가) 적의 데이터를 스캔한다!`)
    gameAudio.situation('item', { speed: gameSettings.gameSpeed })
    const timer = window.setTimeout(() => {
      hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(id => id !== timer)
      scanInFlightRef.current = false
      setScanningTargetIds([])
      finishBattleAction({ nextParty: context.party, nextEnemies: gameState.enemies,
        nextInventory: { ...gameState.inventory, 'card-blue': gameState.inventory['card-blue'] - 1 },
        nextAnalysis: result.analysis, logs: describeAnalysisGains(result.gains), actedAllyId: context.actingAlly.id,
        preferredActiveAllyIds: context.activeAllyIds })
    }, ANALYSIS_SCAN_MS / gameSettings.gameSpeed)
    hitEffectTimeoutsRef.current.push(timer)
  }

  const handleUseBattleItem = (itemId, targetId) => {
    if (!gameState || rewardState || battlePanelMode !== 'items' || scanInFlightRef.current) return
    if (itemId === 'card-blue') { handleScanEnemies(); return }
    const context = getBattleContext()
    const result = resolveBattleItemUse({ ...gameState, party: context.party, activeAllyIds: context.activeAllyIds }, { itemId, targetId, actorId: context.actingAlly?.id })
    if (!result.ok) return
    scanInFlightRef.current = true
    setBattlePanelMode('animating')
    setHoveredEnemyTargetId(null)
    showImmediateBattleLogs(result.logs[0])
    const restorative = result.item.effect.heal || result.item.effect.revive || result.item.effect.cure
    gameAudio.situation(restorative ? 'heal' : 'buff', { speed: gameSettings.gameSpeed })
    for (const id of result.targetIds) showHitEffect({ kind: 'card', targetSide: result.targetSide, targetId: id,
      cardKind: result.targetSide === 'enemy' ? 'weaken' : restorative ? 'heal' : result.item.effect.guard ? 'guard' : 'buff', speed: gameSettings.gameSpeed })
    const timer = window.setTimeout(() => {
      hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(id => id !== timer)
      scanInFlightRef.current = false
      finishBattleAction({ nextParty: result.state.party, nextEnemies: result.state.enemies,
        nextInventory: result.state.inventory, logs: result.logs.slice(1), actedAllyId: context.actingAlly.id,
        preferredActiveAllyIds: context.activeAllyIds })
    }, CARD_EFFECT_MS / gameSettings.gameSpeed)
    hitEffectTimeoutsRef.current.push(timer)
  }

  const runAfterBattleRecall = (combatants, callback, side = 'ally', incoming = []) => {
    const startedAt = performance.now(), speed = gameSettings.gameSpeed
    const events = createSwitchEvents({ outgoing: combatants, incoming, side, startedAt, speed,
      nextId: () => 'switch-' + ++hitEffectIdRef.current })
    if (!events.length) { runAfterBattleLayout(callback); return }
    setSwitchEffects(current => [...current, ...events])
    for (const unit of combatants) {
      gameAudio.situation('recall', { species: unit.name, side, speed })
    }
    if (incoming.length) {
      const entryTimer = window.setTimeout(() => {
        hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(id => id !== entryTimer)
        for (const unit of incoming) gameAudio.situation('send-out', { species: unit.name, side, speed })
      }, SWITCH_IN_DELAY_MS / speed)
      hitEffectTimeoutsRef.current.push(entryTimer)
    }
    // An escape reuses recall and materialization; a smaller formation only recalls.
    const timer = window.setTimeout(() => {
      hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(id => id !== timer)
      setSwitchEffects(current => current.filter(effect => !events.some(event => event.id === effect.id)))
      runAfterBattleLayout(callback)
    }, (incoming.length ? SWITCH_TOTAL_MS : SWITCH_OUT_MS) / speed)
    hitEffectTimeoutsRef.current.push(timer)
  }

  const runAfterBattleSwitch = (outgoingId, incomingId, callback) => {
    const event = { id: 'switch-' + ++hitEffectIdRef.current, outgoingId, incomingId,
      side: 'ally', startedAt: performance.now(), speed: gameSettings.gameSpeed }
    setSwitchEffects(current => [...current, event])
    const outgoing = gameState.party.find(member => member.id === outgoingId)
    const incoming = gameState.party.find(member => member.id === incomingId)
    if (outgoing) gameAudio.situation('recall', { species: outgoing.name, side: 'ally', speed: event.speed })
    const entryTimer = window.setTimeout(() => {
      hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(id => id !== entryTimer)
      gameAudio.situation('send-out', { species: incoming?.name, side: 'ally', speed: event.speed })
    }, SWITCH_IN_DELAY_MS / event.speed)
    hitEffectTimeoutsRef.current.push(entryTimer)
    const timer = window.setTimeout(() => {
      hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(id => id !== timer)
      setSwitchEffects(current => current.filter(effect => effect.id !== event.id))
      runAfterBattleLayout(callback)
    }, SWITCH_TOTAL_MS / event.speed)
    hitEffectTimeoutsRef.current.push(timer)
  }

  const handleFaintReplacement = (memberId) => {
    if (battlePanelMode !== 'replacement' || replacementInFlightRef.current || rewardState) return
    const next = replaceFaintedAlly(latestGameStateRef.current, memberId)
    if (!next) return
    replacementInFlightRef.current = true
    latestGameStateRef.current = next
    setGameState(next)
    saveStageGameState(next)
    setBattlePanelMode('animating')
    setSelectedBattleCommand('swap')
    setHoveredEnemyTargetId(null)
    setActiveCombatantInfo(null)
    setItemTooltip(null)
    const incoming = getCombatantById(next.party, memberId)
    showImmediateBattleLogs(`${incoming.name}, 부탁해!`)
    // The fallen ally has already left via its death animation. Only materialize the choice.
    runAfterBattleSwitch(null, memberId, () => {
      replacementInFlightRef.current = false
      const current = latestGameStateRef.current
      if (current?.awaitingReplacement) {
        setBattlePanelMode('replacement')
        showImmediateBattleLogs(getReplacementPrompt(current))
      } else {
        setBattlePanelMode('commands')
        setSelectedBattleCommand('attack')
        setSelectedSkillIndex(0)
        showImmediateBattleLogs(getBattlePrompt(current?.player?.name ?? incoming.name))
      }
    })
  }

  const handleSwitchPartyMember = (memberId) => {
    if (rewardState || !gameState || battlePanelMode !== 'party') {
      return
    }

    const battleContext = getBattleContext()
    const currentPlayer = battleContext.actingAlly
    const nextPlayer = battleContext.party.find((member) => member.id === memberId)

    if (
      !currentPlayer ||
      !nextPlayer ||
      isRegionalSupport(nextPlayer) ||
      battleContext.activeAllyIds.includes(nextPlayer.id) ||
      !isCombatantAbleToBattle(nextPlayer)
    ) {
      return
    }

    const replaceIndex = battleContext.activeAllyIds.indexOf(currentPlayer.id)
    const nextActiveAllyIds =
      replaceIndex >= 0
        ? battleContext.activeAllyIds.map((memberId, index) =>
            index === replaceIndex ? nextPlayer.id : memberId
          )
        : [nextPlayer.id, ...battleContext.activeAllyIds]
    const switchLogs = [`${currentPlayer.name}, 돌아와!`, `${nextPlayer.name}, 부탁해!`]
    showImmediateBattleLogs(...switchLogs)
    const pendingAllyActions = (gameState.pendingAllyActions ?? []).filter(
      (action) =>
        action.side === 'ally' &&
        action.actorId !== currentPlayer.id &&
        isCombatantAbleToBattle(getCombatantById(battleContext.party, action.actorId))
    )

    if (pendingAllyActions.length > 0) {
      const passiveTurn = resolveNonAttackActionEnd(battleContext.party, nextPlayer.id)
      battleContext.party = passiveTurn.nextParty
      switchLogs.push(...passiveTurn.battleLogs)
      const switchedGameState = {
        ...gameState,
        player: nextPlayer,
        party: battleContext.party,
        activeAllyIds: nextActiveAllyIds,
        actingAllyId: nextPlayer.id,
        actedAllyIds: nextActiveAllyIds,
        pendingAllyActions: [],
      }
      const enemyActions = createEnemyBattleTurnActions({
        enemies: gameState.enemies,
        party: battleContext.party,
        activeAllyIds: nextActiveAllyIds,
        startOrder: pendingAllyActions.length,
      })
      const turnResult = resolveBattleTurnActions({
        party: battleContext.party,
        enemies: gameState.enemies,
        activeAllyIds: nextActiveAllyIds,
        actions: [...pendingAllyActions, ...enemyActions],
        levelCap: gameState.levelCap,
        inventory: gameState.inventory,
      })

      const presentedLogs = [...switchLogs, ...turnResult.battleLogs]

      setGameState(commitRegionalBattleState(switchedGameState))
      setSelectedBattleCommand('swap')
      setBattlePanelMode('logs')

      runAfterBattleSwitch(currentPlayer.id, nextPlayer.id, () => {
        runAfterBattleAttackEffects(turnResult.hitEffects, () => {
          finishResolvedTurn({
            nextParty: turnResult.nextParty,
            nextEnemies: turnResult.nextEnemies,
            logs: presentedLogs,
            skillLearnEvents: turnResult.skillLearnEvents,
            preferredActiveAllyIds: nextActiveAllyIds,
            alreadyPresentedLogCount: presentedLogs.length,
          })
        }, { logs: presentedLogs, presentation: turnResult.presentation, prefixLogs: switchLogs,
          prefixStatus: passiveTurn.statusCues, prefixState: passiveTurn.visualState })
      })
      return
    }

    setGameState(commitRegionalBattleState({
      ...gameState,
      player: nextPlayer,
      party: battleContext.party,
      activeAllyIds: nextActiveAllyIds,
      actingAllyId: nextPlayer.id,
      actedAllyIds: Array.from(
        new Set([...(gameState.actedAllyIds ?? []), nextPlayer.id].filter(Boolean))
      ),
      pendingAllyActions: [],
    }))
    setSelectedBattleCommand('swap')
    setBattlePanelMode('logs')

    runAfterBattleSwitch(currentPlayer.id, nextPlayer.id, () => {
      finishBattleAction({
        nextParty: battleContext.party,
        nextEnemies: gameState.enemies,
        logs: switchLogs,
        actedAllyId: nextPlayer.id,
        preferredActiveAllyIds: nextActiveAllyIds,
      })
    })
  }

  const getRewardItemBySource = (source, itemId) =>
    source === 'fixed'
      ? fixedRewardItems.find((item) => item.id === itemId)
      : rewardState?.randomItems.find((item) => item.id === itemId)

  const finishEvolutionScene = (sceneId) => {
    const pending = evolutionCompletionRef.current
    if (!pending || pending.id !== sceneId) return
    evolutionCompletionRef.current = null
    setEvolutionScene(null)
    pending.onComplete()
  }

  const playEvolutionScene = (fromMembers, toMember, onComplete, mode = 'evolution') => {
    if (gameSettings.evolutionSpeed === 'skip') { onComplete(); return }
    const id = toMember.id + '-' + toMember.name + '-' + Date.now()
    const displayUnit = (member) => ({ name: member.imageName ?? member.name, imageUrl: member.imageUrl, stage: member.speciesStage ?? member.stageName ?? null })
    evolutionCompletionRef.current = { id, onComplete }
    setItemTooltip(null)
    setActiveCombatantInfo(null)
    const scene = { id, mode, from: fromMembers.map(displayUnit), to: displayUnit(toMember) }
    scene.cinematic = resolveEvolutionCinematic(scene, { style: 'rumble', signature: true })
    setEvolutionScene(scene)
  }

  const persistPartyDecision = next => {
    next = { ...next, awaitingReplacement: Boolean(getFaintReplacement(next)) }
    latestGameStateRef.current = next
    setGameState(next)
    saveStageGameState(next)
    setPartyAdmissionError('')
  }

  const requestPartyAdmission = request => {
    const current = latestGameStateRef.current ?? gameState
    if (!current || current.pendingPartyAdmissions?.length) return
    const next = queuePartyAdmission({ ...current,
      rewardCheckpoint: rewardState ? createRewardCheckpoint(rewardState, current.currentStage) : current.rewardCheckpoint }, request)
    setActiveCombatantInfo(null)
    setItemTooltip(null)
    persistPartyDecision(next)
  }

  const handleHatchScan = (name, replacementId = null, admissionId = null) => {
    if (!allowsScanning(gameState)) return
    if (!gameState || !rewardState || rewardState.isResolving || rewardState.isRevealing || rewardState.pendingTarget ||
      evolutionState || hatchInFlightRef.current) return
    const current = latestGameStateRef.current ?? gameState
    const request = current.pendingPartyAdmissions?.[0]
    if (request && (request.kind !== 'scan' || request.member.id !== admissionId)) return
    const result = hatchAnalyzedDigimon(current, name, (species, id) => {
      if (request) return request.member
      const data = allDigimonLookup.get(species)
      return data ? createCombatant({ id, name: species, imageUrl: data.imageUrl, data, stageName: data.stage, level: scanHatchLevel,
        trainerSkills: current.trainerSkills }) : null
    }, replacementId)
    if (result.requiresReplacement) {
      requestPartyAdmission({ kind: 'scan', member: result.member, scanName: name })
      return
    }
    if (!result.ok) { setHatchMessage(result.error); setPartyAdmissionError(result.error); return }
    hatchInFlightRef.current = true
    setRewardState(previous => ({ ...previous, isResolving: true }))
    setHatchMessage(name)
    const checkpoint = createRewardCheckpoint(rewardState, current.currentStage)
    playEvolutionScene([], result.member, () => {
      const next = { ...dismissPartyAdmission(result.state, admissionId), rewardCheckpoint: checkpoint }
      latestGameStateRef.current = next
      setGameState(next)
      saveStageGameState(next)
      setHatchMessage(name)
      setRewardState(previous => previous ? { ...previous, isResolving: false } : previous)
      hatchInFlightRef.current = false
    }, 'hatch')
  }

  const completeRewardItemUse = ({ rewardItem, source, targetId = null, targetIds = [], replacementId = null, admissionId = null }) => {
    const request = (latestGameStateRef.current ?? gameState)?.pendingPartyAdmissions?.[0]
    if (request && (request.kind !== 'egg' || request.member.id !== admissionId || request.itemId !== rewardItem?.id || request.source !== source)) return
    if (!gameState || !rewardItem || !isModeItemAllowed(rewardItem, gameState)) {
      return
    }

    if (source === 'fixed' && rewardItem.consumable) return

    if (rewardItem.consumable && (gameState.inventory?.[rewardItem.id] ?? 0) >= rewardItem.maxOwned) return

    if (source === 'fixed' && (gameState.gold ?? 0) < (rewardItem.price ?? 0)) {
      return
    }

    const currentParty = syncPartyMember(gameState.party, gameState.player)
    const levelCap = gameState.levelCap ?? Infinity
    const effectiveRewardItem = getRewardItemWithInventoryModifiers(rewardItem, gameState.inventory)
    const finishRewardUse = (nextGameState, skillLearnEvents = [], evolution = null) => {
      const itemSound = effectiveRewardItem.reviveRatio ? 'revive'
        : effectiveRewardItem.healAmount || effectiveRewardItem.healFull || effectiveRewardItem.partyHealAmount || effectiveRewardItem.partyHealFull ? 'heal'
          : effectiveRewardItem.cureStatus ? 'cure' : 'item'
      gameAudio.situation(itemSound, { speed: gameSettings.gameSpeed })
      setGameState(nextGameState)
      // Skipped evolution completes synchronously, before React's state effect runs.
      latestGameStateRef.current = nextGameState
      queueSkillReplacementEvents(skillLearnEvents)

      if (source === 'fixed') {
        setRewardState((current) =>
          current
            ? {
                ...current,
                pendingTarget: null,
              }
            : current
        )
        return
      }

      setRewardState((current) =>
        current
          ? {
              ...current,
              selectedRandomItemId: rewardItem.id,
              pendingTarget: null,
              isResolving: true,
            }
          : current
      )
      const proceed = () => {
        setRewardState(null)
        setEvolutionState(null)
        // Skill replacement can finish while the reward/evolution is being presented.
        const stateToAdvance = latestGameStateRef.current?.currentStage === nextGameState.currentStage
          ? latestGameStateRef.current : nextGameState
        handleNextStage(stateToAdvance, stateToAdvance.player, { cleared: true })
      }
      if (evolution) playEvolutionScene(evolution.from, evolution.to, proceed)
      else window.setTimeout(proceed, 1200)
    }

    if (effectiveRewardItem.jogressRecipes) {
      const selectedMembers = targetIds.map((memberId) => getCombatantById(currentParty, memberId)).filter(Boolean)
      const jogressRecipe = getJogressRecipeForMembers(selectedMembers, effectiveRewardItem.jogressRecipes)
      if (!jogressRecipe) return
      const result = resolveJogressEvolution(gameState, selectedMembers, jogressRecipe, true)
      if (!result) return
      finishRewardUse({
        ...result.nextGameState,
        gold: source === 'fixed' ? (gameState.gold ?? 0) - (rewardItem.price ?? 0) : gameState.gold,
      }, [], { from: result.fromMembers, to: result.evolvedMember })
      return
    }

    if (rewardItem.digiEggName) {
      const nextEgg = request?.member ?? createDigiEggCombatant({
        id: `egg-${gameState.currentStage}-${currentParty.length + 1}-${Date.now()}`,
        eggName: rewardItem.digiEggName,
        hatchPool: rewardItem.hatchPool ?? [],
        trainerSkills: gameState.trainerSkills,
        townSupport: gameState.townSupport,
      })
      const admission = admitPartyMember({ ...gameState, party: currentParty }, nextEgg, replacementId)
      if (admission.requiresReplacement) {
        requestPartyAdmission({ kind: 'egg', member: nextEgg, itemId: rewardItem.id, source })
        return
      }
      if (!admission.ok) { setPartyAdmissionError(admission.error); return }
      finishRewardUse({
        ...dismissPartyAdmission(admission.state, admissionId),
        gold: source === 'fixed' ? (gameState.gold ?? 0) - (rewardItem.price ?? 0) : gameState.gold,
      })
      return
    }

    if (effectiveRewardItem.partyLevelUpAmount) {
      const partyLevelUpItem = {
        ...effectiveRewardItem,
        levelUpAmount: effectiveRewardItem.partyLevelUpAmount,
      }

      if (!currentParty.some((member) => isRewardItemUsableByCombatant(partyLevelUpItem, member, levelCap))) {
        return
      }

      const skillLearnEvents = []
      const nextParty = currentParty.map((member) => {
        if (!isRewardItemUsableByCombatant(partyLevelUpItem, member, levelCap)) {
          return member
        }

        const nextMember = applyLevelUpRewardEffect(
          member,
          effectiveRewardItem.partyLevelUpAmount,
          getRewardItemLevelLimit(partyLevelUpItem, levelCap)
        )
        skillLearnEvents.push(
          ...getSkillLearnEventsForLevelRange(member, member.level, nextMember.level)
        )
        return nextMember
      })
      const nextPlayer =
        getCombatantById(nextParty, gameState.player?.id) ??
        getFirstLivingPartyMember(nextParty, gameState.activeAllyIds) ??
        nextParty[0] ??
        gameState.player

      finishRewardUse({
        ...gameState,
        gold: source === 'fixed' ? (gameState.gold ?? 0) - (rewardItem.price ?? 0) : gameState.gold,
        player: nextPlayer,
        party: nextParty,
      }, skillLearnEvents)
      return
    }

    if (effectiveRewardItem.partyHealAmount || effectiveRewardItem.partyHealFull) {
      const nextParty = applyPartyHealRewardEffect(currentParty, effectiveRewardItem)
      const nextPlayer =
        getCombatantById(nextParty, gameState.player?.id) ??
        getFirstLivingPartyMember(nextParty, gameState.activeAllyIds) ??
        nextParty[0] ??
        gameState.player

      finishRewardUse({
        ...gameState,
        gold: source === 'fixed' ? (gameState.gold ?? 0) - (rewardItem.price ?? 0) : gameState.gold,
        player: nextPlayer,
        party: nextParty,
      })
      return
    }

    const isTargetedItem = isTargetedRewardItem(effectiveRewardItem)
    const targetCombatant = isTargetedItem
      ? getCombatantById(currentParty, targetId) ?? gameState.player
      : gameState.player

    if (isTargetedItem && !isRewardItemUsableByCombatant(effectiveRewardItem, targetCombatant, levelCap)) {
      return
    }

    const effectResult = applyInstantRewardEffect(targetCombatant, effectiveRewardItem, levelCap)
    const skillLearnEvents =
      effectiveRewardItem.levelUpAmount && effectResult.nextPlayer
        ? getSkillLearnEventsForLevelRange(
            targetCombatant,
            targetCombatant.level,
            effectResult.nextPlayer.level
          )
        : []
    const nextParty = isTargetedItem
      ? replacePartyMember(currentParty, effectResult.nextPlayer)
      : syncPartyMember(currentParty, effectResult.nextPlayer)
    const nextPlayer =
      getCombatantById(nextParty, gameState.player?.id) ??
      effectResult.nextPlayer ??
      gameState.player
    const nextInventory = effectResult.shouldStore
      ? addRewardInventoryItem(gameState.inventory, rewardItem)
      : gameState.inventory
    const nextGameState = {
      ...gameState,
      gold: source === 'fixed' ? (gameState.gold ?? 0) - (rewardItem.price ?? 0) : gameState.gold,
      player: nextPlayer,
      party: nextParty,
      inventory: nextInventory,
    }

    finishRewardUse(nextGameState, skillLearnEvents)
  }

  const requestRewardTargetSelection = (source, rewardItem) => {
    setRewardState((current) =>
      current
        ? {
            ...current,
            selectedRandomItemId: source === 'random' ? rewardItem.id : current.selectedRandomItemId,
            pendingTarget: {
              source,
              itemId: rewardItem.id,
              selectedTargetIds: rewardItem.jogressRecipes ? [] : undefined,
            },
          }
        : current
    )
  }

  const handleSelectRewardTarget = (memberId) => {
    const pendingTarget = rewardState?.pendingTarget

    if (!pendingTarget || rewardState?.isResolving) {
      return
    }

    const rewardItem = getRewardItemBySource(pendingTarget.source, pendingTarget.itemId)

    if (rewardItem?.jogressRecipes) {
      const currentParty = getRewardTargetCandidates(
        syncPartyMember(gameState?.party, gameState?.player),
        gameState?.player
      )
      const selectedTargetIds = pendingTarget.selectedTargetIds ?? []

      if (selectedTargetIds.includes(memberId)) {
        setRewardState((current) =>
          current?.pendingTarget
            ? {
                ...current,
                pendingTarget: {
                  ...current.pendingTarget,
                  selectedTargetIds: selectedTargetIds.filter((targetId) => targetId !== memberId),
                },
              }
            : current
        )
        return
      }

      const selectedMember = getCombatantById(currentParty, memberId)

      if (!isJogressMemberSelectable(selectedMember, currentParty, selectedTargetIds, rewardItem.jogressRecipes)) {
        return
      }

      const nextTargetIds = [...selectedTargetIds, memberId]
      const selectedMembers = nextTargetIds.map((targetId) => getCombatantById(currentParty, targetId)).filter(Boolean)
      const jogressRecipe = getJogressRecipeForMembers(selectedMembers, rewardItem.jogressRecipes)

      if (jogressRecipe) {
        completeRewardItemUse({
          rewardItem,
          source: pendingTarget.source,
          targetIds: nextTargetIds,
        })
        return
      }

      setRewardState((current) =>
        current?.pendingTarget
          ? {
              ...current,
              pendingTarget: {
                ...current.pendingTarget,
                selectedTargetIds: nextTargetIds,
              },
            }
          : current
      )
      return
    }

    completeRewardItemUse({
      rewardItem,
      source: pendingTarget.source,
      targetId: memberId,
    })
  }

  const handleCancelRewardTargetSelection = () => {
    setRewardState((current) =>
      current
        ? {
            ...current,
            selectedRandomItemId:
              current.pendingTarget?.source === 'random' ? null : current.selectedRandomItemId,
            pendingTarget: null,
          }
        : current
    )
  }

  const showCombatantTooltip = (event, member) => {
    setItemTooltip(null)
    setActiveCombatantInfo(null)
    setEquipmentTooltip({ anchor: event.currentTarget, memberId: member.id, member })
  }

  const handleOpenEvolutionParty = () => {
    if (!gameState || rewardState?.isResolving) {
      return
    }

    setEvolutionState({
      mode: 'party',
      selectedMemberId: null,
      confirmTargetName: null,
    })
  }

  const handleCloseEvolutionPanel = () => {
    setEvolutionState(null)
  }

  const handleSelectEvolutionMember = (memberId) => {
    if (isCombatantEgg(getCombatantById(gameState?.party, memberId))) return
    setEvolutionState({
      mode: 'detail',
      selectedMemberId: memberId,
      confirmTargetName: null,
    })
  }

  const handleBackToEvolutionParty = () => {
    setEvolutionState({
      mode: 'party',
      selectedMemberId: null,
      confirmTargetName: null,
    })
  }

  const handleRequestEvolution = (targetName) => {
    const member = getCombatantById(gameState?.party, evolutionState?.selectedMemberId)
    const option = getEvolutionOptions(member, gameState?.inventory, gameState?.party, gameState?.evolutionMemory)
      .find(candidate => candidate.targetData.이름 === targetName)
    if (!option?.canEvolve) return
    setEvolutionState((current) =>
      current
        ? {
            ...current,
            confirmTargetName: targetName,
            confirmPartnerIds: option.partnerIds,
          }
        : current
    )
  }

  const handleCancelEvolutionConfirm = () => {
    setEvolutionState((current) =>
      current
        ? {
            ...current,
            confirmTargetName: null,
          }
        : current
    )
  }

  const handleConfirmEvolution = () => {
    if (!gameState || evolutionScene || !evolutionState?.selectedMemberId || !evolutionState.confirmTargetName) {
      return
    }

    const result = resolveManualEvolution(latestGameStateRef.current ?? gameState,
      evolutionState.selectedMemberId, evolutionState.confirmTargetName, rewardState, evolutionState.confirmPartnerIds)
    if (!result) return
    const { nextGameState, selectedMember, evolvedMember } = result
    // Commit the party, catalyst and unclaimed reward together, before a skip or reload.
    latestGameStateRef.current = nextGameState
    setGameState(nextGameState)
    saveStageGameState(nextGameState)

    playEvolutionScene(result.fromMembers ?? [selectedMember], evolvedMember, () => {
      setEvolutionState({ mode: 'party', selectedMemberId: null, confirmTargetName: null })
    })
  }

  const handlePurchaseFixedRewardItem = (itemId) => {
    if (!gameState || !rewardState || rewardState.isResolving || rewardState.pendingTarget) {
      return
    }

    const rewardItem = fixedRewardItems.find((item) => item.id === itemId)
    if (!rewardItem) {
      return
    }

    if ((gameState.gold ?? 0) < rewardItem.price) {
      return
    }

    if (shouldSelectRewardTarget(rewardItem, gameState.party, gameState.player)) {
      requestRewardTargetSelection('fixed', rewardItem)
      return
    }

    const [targetCombatant] = getRewardTargetCandidates(gameState.party, gameState.player)
    completeRewardItemUse({
      rewardItem,
      source: 'fixed',
      targetId: targetCombatant?.id,
    })
  }

  const handleClaimRandomRewardItem = (itemId) => {
    if (
      !gameState ||
      !rewardState ||
      rewardState.isResolving ||
      rewardState.isRevealing ||
      rewardState.pendingTarget
    ) {
      return
    }

    const rewardItem = rewardState.randomItems.find((item) => item.id === itemId)
    if (!rewardItem) {
      return
    }

    if (shouldSelectRewardTarget(rewardItem, gameState.party, gameState.player)) {
      requestRewardTargetSelection('random', rewardItem)
      return
    }

    const [targetCombatant] = getRewardTargetCandidates(gameState.party, gameState.player)
    completeRewardItemUse({
      rewardItem,
      source: 'random',
      targetId: targetCombatant?.id,
    })
  }

  const handleRerollRewardItems = () => {
    if (
      !gameState ||
      !rewardState ||
      rewardState.isResolving ||
      rewardState.isRevealing ||
      rewardState.pendingTarget
    ) {
      return
    }

    const rerollCost = getRewardRerollCost(gameState.currentStage, rewardState.rerollCount ?? 0, gameState.inventory)
    if ((gameState.gold ?? 0) < rerollCost) {
      return
    }

    const currentParty = syncPartyMember(gameState.party, gameState.player)
    const nextRerollCount = (rewardState.rerollCount ?? 0) + 1
    const nextRewardState = createRewardSelection(
      gameState.inventory,
      currentParty,
      gameState.levelCap ?? Infinity,
      gameState.currentStage,
      nextRerollCount,
      gameState.gameMode
    )

    setGameState({
      ...gameState,
      party: currentParty,
      gold: (gameState.gold ?? 0) - rerollCost,
    })
    setRewardState(nextRewardState)
  }

  const openItemTooltip = (event, item) => {
    if (!item.description) return
    setActiveCombatantInfo(null)
    setItemTooltip({ anchor: event.currentTarget, item })
  }

  const handleStartAdventure = () => {
    if (!canPlayGameMode(selectedGameMode, modeProgressRef.current)) return
    if (isDailyMode(selectedGameMode) && dailyChallenge.date !== getDailyDate()) { setDailyDate(getDailyDate()); setSelectedDailyNames([]); return }
    const trainerRun = createTrainerRun(trainerProgressRef.current)
    const startingParty = isDailyMode(selectedGameMode) ? buildDailyStartingParty(selectedDailyNames, dailyChallenge, trainerRun.trainerSkills)
      : buildStartingParty(selectedStarterNames, trainerRun.trainerSkills, localProgress.collection)
    if (!startingParty.length) return

    const startingStage = 1
    const mapName = getMapNameForStage(startingStage)
    const encounterGroup = getEncounterGroupForStage(startingStage)
    const encounterCount = getEncounterCountForStage(startingStage)
    const levelCap = getLevelCapForStage(startingStage, selectedGameMode)
    const mapEncounterPool = mapData[mapName]?.등장디지몬?.[encounterGroup] ?? []
    const bossEncounterPool = getBossEncounterNamesForStage(mapName, startingStage)
    const enemies = buildEnemyParty(startingStage, mapEncounterPool, encounterCount, bossEncounterPool, { gameMode: selectedGameMode, mapName })
    const player = startingParty[0]
    const activeAllyIds = getActiveAllyIdsForParty(
      startingParty,
      [player.id],
      getBattleAllyLimit({
        encounterCount,
        enemies,
      })
    )

    const initialGameState = applyTownStartingSupport(recordEncounterAnalysis(hydrateRegionalTrust({
      ...trainerRun,
      runStats: createRunStats(),
      gameMode: selectedGameMode,
      ...(isDailyMode(selectedGameMode) ? { dailyDate: dailyChallenge.date, dailyCandidates: dailyChallenge.candidates, dailyStarterNames: [...selectedDailyNames] } : {}),
      currentStage: startingStage,
      maxStage: getModeStageLimit(selectedGameMode),
      currentMap: mapName,
      gold: 0,
      digimonAnalysis: localProgress.analysis,
      unlockedSpecies: localProgress.unlockedSpecies,
      inventory: {},
      encounterGroup,
      encounterCount,
      encounterPool: mapEncounterPool,
      levelCap,
      enemies,
      player,
      party: startingParty,
      activeAllyIds,
      actingAllyId: player.id,
      actedAllyIds: [],
      pendingAllyActions: [],
      escapeAttempts: 0,
    }, getLocalSnapshot().regionalTrust)), getLocalSnapshot().town)

    setGameState(initialGameState)
    saveStageGameState(initialGameState)
      showImmediateBattleLogs(getBattlePrompt(player.name))
    setSelectedBattleCommand('attack')
    setBattlePanelMode('commands')
    setSelectedSkillIndex(0)
    setRewardState(null)
    setEvolutionState(null)
    setMapSelectionState(null)
    gameAudio.situation('encounter', { speed: gameSettings.gameSpeed })
    setScreenMode('adventure')
  }

  const handleConfirmPartyAdmission = replacementId => {
    if (hatchInFlightRef.current || rewardState?.isResolving || evolutionScene) return
    const current = latestGameStateRef.current ?? gameState
    const request = current?.pendingPartyAdmissions?.[0]
    if (!request) return
    if (request.kind === 'scan') {
      handleHatchScan(request.scanName, replacementId, request.member.id)
    } else if (request.kind === 'egg') {
      const rewardItem = rewardItemLookup.get(request.itemId)
      if (!rewardState || !rewardItem) { setPartyAdmissionError('보상을 다시 불러온 뒤 선택해 주세요.'); return }
      completeRewardItemUse({ rewardItem, source: request.source, replacementId, admissionId: request.member.id })
    } else {
      const result = admitPartyMember(current, request.member, replacementId)
      if (!result.ok) { setPartyAdmissionError(result.error); return }
      persistPartyDecision(dismissPartyAdmission(result.state, request.member.id))
    }
  }

  const handleCancelPartyAdmission = () => {
    if (hatchInFlightRef.current || rewardState?.isResolving || evolutionScene) return
    const current = latestGameStateRef.current ?? gameState
    const request = current?.pendingPartyAdmissions?.[0]
    if (!request) return
    persistPartyDecision(dismissPartyAdmission(current, request.member.id))
    if (request.kind === 'scan') setHatchMessage(request.member.name + ' 영입을 취소했습니다.')
  }

  const matchupGuideButton = (
    <button type="button" className="matchup-guide-button" aria-haspopup="dialog" aria-expanded={isMatchupGuideOpen}
      onClick={() => { setActiveCombatantInfo(null); setItemTooltip(null); setIsMatchupGuideOpen(true) }}>
      상성표
    </button>
  )

  const battleContext = getBattleContext()
  const partyMembers = ownedBattleUnits(battleContext.party)
  const activeSkillReplaceEvent = skillReplaceState?.queue?.[skillReplaceState.index ?? 0] ?? null
  const skillReplaceCombatant = activeSkillReplaceEvent
    ? getCombatantById(partyMembers, activeSkillReplaceEvent.combatantId)
    : null
  const skillReplaceNewSkillData = activeSkillReplaceEvent
    ? getSkillData(activeSkillReplaceEvent.newSkillName, skillReplaceCombatant)
    : null
  const skillReplaceCurrentSkills = skillReplaceCombatant?.skills ?? []
  const activeAllyIds = battleContext.activeAllyIds
  const activeAllies = battleContext.activeAllies
  const actingAlly = battleContext.actingAlly ?? gameState?.player ?? null
  const playerSkills = getCommandSkillNames(actingAlly, name => getSkillData(name, actingAlly))
  const battleSkillSlots = Array.from(
    { length: Math.max(MAX_COMBATANT_SKILL_COUNT, playerSkills.length) },
    (_, index) => playerSkills[index] ?? null
  )
  const isAttackPanelOpen = battlePanelMode === 'attack'
  const isAttackTargetPanelOpen = battlePanelMode === 'attack-targets'
  const isSkillConsoleOpen = isAttackPanelOpen || isAttackTargetPanelOpen
  const isItemPanelOpen = battlePanelMode === 'items'
  const isPartyPanelOpen = battlePanelMode === 'party'
  const faintReplacement = gameState?.awaitingReplacement ? getFaintReplacement(gameState) : null
  const isFaintReplacementOpen = battlePanelMode === 'replacement' && Boolean(faintReplacement)
  const hasDigimonDetector = true
  const hasGlobeItem = (gameState?.inventory?.[GLOBE_ITEM_ID] ?? 0) > 0
  const hudCombatant = actingAlly ?? gameState?.player ?? null
  const inventoryHudItems = [...rewardItemLookup.values()]
    .map((item) => {
      const count = gameState?.inventory?.[item.id] ?? 0

      if (!item || item.digiEggName || item.battleItemKey || count <= 0) {
        return null
      }

      const maxCount = getRewardItemMaxCount(item)

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        value: count,
        isMaxed: maxCount != null && count >= maxCount,
      }
    })
    .filter(Boolean)
  const activeBuffHudItems = buffRewardItems
    .map((item) => {
      const remainingTurns = hudCombatant?.activeBuffs?.[item.buffStatKey] ?? 0

      if (remainingTurns <= 0) {
        return null
      }

      return {
        id: item.id,
        name: item.name,
        description: `${STAT_LABEL_MAP[item.buffStatKey]} 10% 증가\n${REGION_EFFECT_TEXT}`,
        imageUrl: item.imageUrl,
        value: remainingTurns,
        isBuff: true,
      }
    })
    .filter(Boolean)
  const equippedHudItems = getCombatantEquippedItems(hudCombatant)
  const adventureHudItems = [
    ...inventoryHudItems,
    ...activeBuffHudItems,
    ...equippedHudItems,
  ]
  const mapSelectionOptions = mapSelectionState?.options?.length
    ? mapSelectionState.options
    : getConnectedMapNames(gameState?.currentMap)
  const partySwitchMembers = partyMembers.filter((member) => member.id !== actingAlly?.id)
  const partyListSlots = Array.from(
    { length: Math.max(Math.max(0, PARTY_SLOT_COUNT - 1), partySwitchMembers.length) },
    (_, index) => partySwitchMembers[index] ?? null
  )
  const pendingRewardTarget = rewardState?.pendingTarget ?? null
  const pendingRewardItem = pendingRewardTarget
    ? pendingRewardTarget.source === 'fixed'
      ? fixedRewardItems.find((item) => item.id === pendingRewardTarget.itemId)
      : rewardState?.randomItems.find((item) => item.id === pendingRewardTarget.itemId)
    : null
  const pendingJogressSelectedIds = pendingRewardItem?.jogressRecipes
    ? pendingRewardTarget?.selectedTargetIds ?? []
    : []
  const rewardTargetMembers = getRewardTargetCandidates(partyMembers, gameState?.player)
  const pendingJogressRequiredCount = pendingRewardItem?.jogressRecipes
    ? getJogressSelectionRequiredCount(
        rewardTargetMembers,
        pendingJogressSelectedIds,
        pendingRewardItem.jogressRecipes
      )
    : 0
  const rewardTargetSlots = Array.from(
    { length: Math.max(PARTY_SLOT_COUNT, partyMembers.length) },
    (_, index) => partyMembers[index] ?? null
  )
  const evolutionPartyMembers = partyMembers.filter((member) => !isCombatantEgg(member))
  const readyEvolutionMemberIds = new Set(evolutionPartyMembers
    .filter(member => getReadyEvolutionPreviewTargets(member, gameState?.inventory, evolutionPartyMembers, gameState?.evolutionMemory).length > 0)
    .map(member => member.id))
  const readyEvolutionMemberCount = readyEvolutionMemberIds.size
  const evolutionPartySlots = Array.from(
    { length: Math.max(PARTY_SLOT_COUNT, partyMembers.length) },
    (_, index) => partyMembers[index] ?? null
  )
  const selectedEvolutionMember = evolutionState?.selectedMemberId
    ? getCombatantById(evolutionPartyMembers, evolutionState.selectedMemberId)
    : null
  const evolutionOptions = selectedEvolutionMember
    ? getEvolutionOptions(selectedEvolutionMember, gameState?.inventory, evolutionPartyMembers, gameState?.evolutionMemory)
    : []
  const pendingEvolutionOption = evolutionState?.confirmTargetName
    ? evolutionOptions.find((option) => option.targetData.이름 === evolutionState.confirmTargetName)
    : null
  const pendingEvolutionMaterials = pendingEvolutionOption?.recipe
    ? getJogressEvolutionMembers(selectedEvolutionMember, evolutionPartyMembers, pendingEvolutionOption.recipe, evolutionState.confirmPartnerIds)
    : []
  const visibleEnemies = gameState?.enemies?.filter((enemy) => isCombatantAbleToBattle(enemy)) ?? []
  const equipmentTooltipMember = [...partyMembers, ...(gameState?.enemies ?? []), ...(gameState?.regionalSupport?.unit ? [gameState.regionalSupport.unit] : [])]
    .find(member => member.id === equipmentTooltip?.memberId) ?? equipmentTooltip?.member
  const effectDetailsCombatant = [...partyMembers, ...(gameState?.regionalSupport?.unit ? [gameState.regionalSupport.unit] : []), ...(gameState?.enemies ?? [])].find(member => member.id === effectDetailsId)
  const hasExplorationScene = Boolean(gameState?.explorationEvent && gameState.explorationEvent.phase !== 'battle')
  const showExplorationEvent = Boolean(hasExplorationScene && !activeSkillReplaceEvent && !evolutionScene)
  const isInfoDialogOpen = isHistoryOpen || isTurnOrderOpen || Boolean(effectDetailsCombatant)
  const partyAdmission = gameState?.pendingPartyAdmissions?.[0] ?? null
  useEffect(() => { setEquipmentTooltip(null) }, [screenMode, battlePanelMode, rewardState?.pendingTarget, partyAdmission?.member.id, gameState?.currentStage, saveDialog, faintReplacement?.faintedIds?.[0]])
  const isAdventureBlocked = Boolean(evolutionScene || showExplorationEvent || isInfoDialogOpen || isItemPanelOpen || partyAdmission)
  const skillConsoleEntries = isSkillConsoleOpen ? battleSkillSlots.flatMap((name, index) => {
    if (!name) return []
    const data = getSkillData(name, actingAlly)
    return [{ index, name, attribute: data?.속성 ?? '무', iconUrl: getDigimonAttributeIconUrl(data?.속성 ?? '무'),
      category: data?.분류 ?? '공격', power: data?.데미지, accuracy: data?.명중률,
      cooldown: data.cooldown ?? 0, remainingCooldown: getSkillCooldown(actingAlly, data),
      range: getSkillRangeLabel(data), description: getSkillEffectDescription(data), support: isSupportSkill(data),
      targets: visibleEnemies.map(enemy => ({ id: enemy.id, name: enemy.name,
        ...getMatchupResult({ attackerType: actingAlly?.type, skillAttribute: data?.속성,
          defenderType: enemy.type, defenderAttribute: enemy.attribute }) })) }]
  }) : []
  const mapPresentation = getMapPresentation(gameState?.currentMap)
  const previewSkillIndex = isAttackTargetPanelOpen ? selectedSkillIndex
    : previewedSkill && previewedSkill.actorId === actingAlly?.id ? previewedSkill.index : null
  const previewSkillData = isSkillConsoleOpen && !rewardState && !isAdventureBlocked && previewSkillIndex != null
    ? getSkillData(battleSkillSlots[previewSkillIndex], actingAlly) : null
  const previewTargetIds = !previewSkillData ? [] : isEnemyTargetSkill(previewSkillData)
    ? getEnemyTargetIds(visibleEnemies, getSkillTargetScope(previewSkillData), hoveredEnemyTargetId, !isSupportSkill(previewSkillData))
    : [chooseSupportTarget({ actor: actingAlly, action: { side: 'ally' }, effect: getSkillEffect(previewSkillData),
        party: battleContext.party, enemies: visibleEnemies, activeAllyIds })].flat().filter(Boolean).map(unit => unit.id)
  const battleFocus = getBattleFocus({ motions: attackMotions, actingId: actingAlly?.id, previewTargetIds, scanningTargetIds,
    commandActive: ['commands', 'attack', 'attack-targets', 'scan', 'party'].includes(battlePanelMode),
    blocked: Boolean(rewardState || mapSelectionState || evolutionState || isAdventureBlocked) })
  const commandTargetIds = battleFocus.targetIds
  const focusLabel = battleFocus.phase === 'action' ? '기술 사용' : battleFocus.phase === 'scan' ? '스캔 중' : '명령 중'
  const turnPreview = buildTurnPreview({ allies: activeAllies, enemies: visibleEnemies, actions: gameState?.pendingAllyActions,
    actedIds: gameState?.actedAllyIds,
    hasteChance: unit => Math.min(HASTE_MAX, getBattleItemCount(unit, HASTE_ITEM_ID)) * HASTE_PRIORITY_RATE,
    describeAction: action => {
      const skill = getSkillData(action.skillName, getCombatantById(partyMembers, action.actorId))
      if (!isEnemyTargetSkill(skill)) return getSkillTargetScope(skill) === 'self' ? '자신' : getSkillTargetScope(skill) === 'all' ? '아군 전체' : '아군 자동 선택'
      const taunter = !isSupportSkill(skill) && getSkillTargetScope(skill) === 'single' && visibleEnemies.find(unit => unit.battleGuards?.taunt > 0)
      if (taunter) return `${taunter.name} (도발)`
      return getSkillTargetScope(skill) === 'all' ? '적 전체' : visibleEnemies.find(unit => unit.id === action.targetId)?.name ?? '대상 재선택'
    } })
  const scanHatchLevel = Math.max(1, Math.min(gameState?.levelCap ?? MAX_DIGIMON_LEVEL, gameState?.player?.level ?? 1))
  const scanEntries = Object.keys(gameState?.digimonAnalysis ?? {}).flatMap(name => {
    const data = allDigimonLookup.get(name)
    return data && isPlayableDigimon(data) && getCollectionStatus(localProgress.collection, name) !== 'unlocked' ? [{ name, imageName: data.imageName, stage: data.stage, level: scanHatchLevel,
      progress: getAnalysisProgress(gameState.digimonAnalysis, name) }] : []
  }).sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name, 'ko'))
  const mainScreenStyle = {
    '--map-ground-y': `${mapPresentation.groundY}px`,
    '--exp-bar-duration': `${getExpDuration(EXP_BAR_ANIMATION_MS)}ms`,
  }

  return (
    <main
      className={['main-screen', screenMode === 'menu' ? 'main-screen--menu' : '', screenMode === 'adventure' ? 'main-screen--adventure' : '']
        .filter(Boolean)
        .join(' ')}
      style={mainScreenStyle}
    >
      <BackgroundMusic settings={gameSettings}
        scene={resolveBgmScene({ screenMode, gameState, rewardState, mapSelectionState })}
        previewUrl={screenMode === 'settings' && isBgmSettingsOpen && settingsTab === 'audio' ? bgmPreviewUrl : null}
        onStatus={setBgmStatus} onPreviewEnd={() => setBgmPreviewUrl(null)} retrySignal={bgmRetrySignal} />
      <ButtonClickSound />
      {screenMode !== 'adventure' && <MenuBackdrop backgrounds={mapBackgrounds} />}

      {screenMode === 'menu' && (
        <header className="title-band" inert={Boolean(saveDialog || isMatchupGuideOpen || isHallOpen)}>
          <div className="title-band__inner">
            <img className="title-band__logo" src="/Title.png" alt="DigiRogue" />
            <div className="profile-controls">
              <span className="local-guest-label"><span className="profile-controls__status-dot" aria-hidden="true" />{authSession?.identity?.isAnonymous === false ? authSession.identity.displayName : '게스트'} · 이 기기에 저장</span>
              {authSession && !authSession.launcher && <>
                {authSession.identity?.isAnonymous && <button type="button" className="profile-controls__connect" disabled={authSession.busy} onClick={authSession.google}>Google 계정 연결</button>}
                <button type="button" disabled={authSession.busy} onClick={authSession.logout}>로그아웃</button>
              </>}
            </div>
            {authSession?.error && <span className="profile-controls__error" role="alert">{authSession.error}</span>}
          </div>
        </header>
      )}

      <section
        inert={Boolean(saveDialog || isMatchupGuideOpen || isHallOpen)}
        className={[
          'playfield',
          screenMode === 'new-game' ? 'playfield--selection' : '',
          screenMode === 'settings' ? 'playfield--settings' : '',
          screenMode === 'skills' ? 'playfield--skills' : '',
          screenMode === 'town' ? 'playfield--town' : '',
          screenMode === 'dex' ? 'playfield--dex' : '',
          screenMode === 'adventure' ? 'playfield--adventure' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {screenMode !== 'adventure' && <div className="playfield__scanline" aria-hidden="true" />}

        <div
          className={[
            'playfield__content',
            screenMode === 'new-game' ? 'playfield__content--selection' : '',
            screenMode === 'settings' ? 'playfield__content--settings' : '',
            screenMode === 'skills' ? 'playfield__content--skills' : '',
            screenMode === 'town' ? 'playfield__content--town' : '',
            screenMode === 'dex' ? 'playfield__content--dex' : '',
            screenMode === 'adventure' ? 'playfield__content--adventure' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {screenMode === 'menu' ? (
            <MainMenu hasSaveData={hasSaveData} currentKey={currentMenuKey} skillPoints={getTrainerPoints(trainerProgress)} onSelect={setSelectedMenuKey} onAction={handleMenuAction} />
          ) : screenMode === 'skills' ? (
            <TrainerSkillTree progress={trainerProgress} onLearn={handleTrainerLearn} onReset={handleTrainerReset} onBack={() => setScreenMode('menu')} />
          ) : screenMode === 'town' ? (
            <TownScreen town={localProgress.town} trust={localProgress.regionalTrust} onAction={localProgress.actTown} onBack={() => setScreenMode('menu')} />
          ) : screenMode === 'dex' ? (
            <DigimonDex eggs={digiEggData} lookup={allDigimonLookup} collection={localProgress.collection} onBack={() => setScreenMode('menu')} />
          ) : screenMode === 'settings' ? (
            <section className="settings-screen" aria-label="설정">
              <div className="settings-panel">
                <div className="settings-panel__top">
                  <button
                    type="button"
                    className="settings-panel__shoulder settings-panel__shoulder--left"
                    aria-label="이전 분류"
                    onClick={() => switchSettingsTab(settingsTab === 'general' ? 'audio' : 'general')}
                  >
                    F
                  </button>
                  <div className="settings-tabs" role="tablist" aria-label="설정 분류">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={settingsTab === 'general'}
                      className={[
                        'settings-tab',
                        settingsTab === 'general' ? 'settings-tab--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => switchSettingsTab('general')}
                    >
                      일반
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={settingsTab === 'audio'}
                      className={[
                        'settings-tab',
                        settingsTab === 'audio' ? 'settings-tab--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => switchSettingsTab('audio')}
                    >
                      오디오
                    </button>
                  </div>
                  <button
                    type="button"
                    className="settings-panel__shoulder settings-panel__shoulder--right"
                    aria-label="다음 분류"
                    onClick={() => switchSettingsTab(settingsTab === 'general' ? 'audio' : 'general')}
                  >
                    R
                  </button>
                </div>

                <div className="settings-panel__body">
                  {settingsTab === 'general' ? (
                    <div className="settings-list">
                      <div className="settings-row">
                        <span className="settings-row__label">게임배속</span>
                        <div className="settings-options" role="group" aria-label="게임배속">
                          {SPEED_OPTIONS.map((speed) => (
                            <button
                              key={`game-speed-${speed}`}
                              type="button"
                              className={[
                                'settings-option',
                                gameSettings.gameSpeed === speed ? 'settings-option--active' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              onClick={() => updateGameSetting('gameSpeed', speed)}
                            >
                              {speed}배
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="settings-row">
                        <span className="settings-row__label">경험치바 속도</span>
                        <div className="settings-options" role="group" aria-label="경험치바 속도">
                          {SPEED_OPTIONS.map((speed) => (
                            <button
                              key={`exp-speed-${speed}`}
                              type="button"
                              className={[
                                'settings-option',
                                gameSettings.expBarSpeed === speed ? 'settings-option--active' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              onClick={() => updateGameSetting('expBarSpeed', speed)}
                            >
                              {speed}배
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="settings-row">
                        <span className="settings-row__label">진화씬 속도</span>
                        <div className="settings-options" role="group" aria-label="진화씬 속도">
                          {EVOLUTION_SPEED_OPTIONS.map((speed) => (
                            <button
                              key={`evolution-speed-${speed}`}
                              type="button"
                              className={[
                                'settings-option',
                                gameSettings.evolutionSpeed === speed ? 'settings-option--active' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              onClick={() => updateGameSetting('evolutionSpeed', speed)}
                            >
                              {speed === 'skip' ? '스킵' : `${speed}배`}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="settings-list settings-list--audio">
                      {[
                        ['masterVolume', '마스터 오디오'],
                        ['bgmVolume', 'BGM 음량'],
                        ['sfxVolume', '효과음'],
                      ].map(([settingKey, label]) => (
                        <div key={settingKey} className="settings-row">
                          <span className="settings-row__label">{label}</span>
                          <div className="settings-options settings-options--volume" role="group" aria-label={label}>
                            {VOLUME_OPTIONS.map((volume) => (
                              <button
                                key={`${settingKey}-${volume}`}
                                type="button"
                                className={[
                                  'settings-option',
                                  gameSettings[settingKey] === volume ? 'settings-option--active' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                onClick={() => updateGameSetting(settingKey, volume)}
                              >
                                {volume}%
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="settings-bgm-entry">
                        <div className="settings-bgm-entry__copy">
                          <span className="settings-row__label">BGM</span>
                          <span className="settings-bgm-entry__summary">
                            활성 {gameSettings.enabledBgmUrls.length}/{bgmTracks.length}곡 · 장면별 자동 재생
                          </span>
                        </div>
                        <button
                          type="button"
                          className="settings-bgm-entry__button"
                          aria-haspopup="dialog"
                          aria-expanded={isBgmSettingsOpen}
                          onClick={() => setIsBgmSettingsOpen(true)}
                        >
                          BGM 설정
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isBgmSettingsOpen && settingsTab === 'audio' && (
                  <div className="settings-bgm-window" role="dialog" aria-modal="true" aria-label="BGM 설정">
                    <div className="settings-bgm-window__panel">
                      <div className="settings-bgm-window__header">
                        <div className="settings-bgm-window__title-group">
                          <span className="settings-bgm-window__eyebrow">오디오</span>
                          <h2 className="settings-bgm-window__title">BGM</h2>
                        </div>
                        <span className="settings-bgm-window__count">
                          {gameSettings.enabledBgmUrls.length}/{bgmTracks.length}
                        </span>
                        <button
                          type="button"
                          className="settings-bgm-window__close"
                          onClick={() => setIsBgmSettingsOpen(false)}
                        >
                          닫기
                        </button>
                      </div>

                      <div className="settings-bgm settings-bgm--window">
                        <p className="settings-bgm__description">
                          디지털 세계의 모험을 위해 새로 만든 오리지널 연주곡입니다. 타이틀 · 탐험 · 전투 · 보스 · 휴식 장면에 맞춰 자동으로 재생합니다.
                        </p>
                        <div className="settings-bgm__toolbar">
                          <div className="settings-bgm__bulk">
                            <button type="button" onClick={() => updateGameSetting('enabledBgmUrls', bgmTracks.map(track => track.url))}>전체 ON</button>
                            <button type="button" onClick={() => updateGameSetting('enabledBgmUrls', [])}>전체 OFF</button>
                          </div>
                          <span className="settings-bgm__status" role="status">
                            {bgmStatus.state === 'playing' ? `${bgmStatus.isPreview ? '미리듣기' : '재생 중'} · ${bgmTracks.find(track => track.url === bgmStatus.trackUrl)?.title ?? ''}`
                              : bgmStatus.state === 'loading' ? '음악을 불러오는 중'
                                : bgmStatus.state === 'muted' ? 'BGM 음량이 0%입니다'
                                  : bgmStatus.state === 'off' ? '선택한 곡이 없습니다'
                                    : ['error', 'blocked'].includes(bgmStatus.state) ? '재생을 다시 시도해 주세요'
                                      : '음악 재생 대기'}
                          </span>
                          {['error', 'blocked'].includes(bgmStatus.state) && (
                            <button type="button" className="settings-bgm__retry" onClick={() => setBgmRetrySignal(value => value + 1)}>재생 재시도</button>
                          )}
                        </div>
                        <div className="settings-bgm__list">
                          {bgmTracks.map((track) => {
                            const isEnabled = gameSettings.enabledBgmUrls.includes(track.url)
                            const isPreviewing = bgmPreviewUrl === track.url
                            const isPlaying = bgmStatus.trackUrl === track.url && bgmStatus.state === 'playing'
                            return (
                              <div key={track.url} className={`settings-bgm__item${isPlaying ? ' settings-bgm__item--playing' : ''}`}>
                                <div className="settings-bgm__track">
                                  <span className="settings-bgm__title">{track.title}</span>
                                  <span className="settings-bgm__scene">{track.description}</span>
                                </div>
                                <button type="button" className="settings-bgm__preview"
                                  disabled={!isEnabled || gameSettings.masterVolume === 0 || gameSettings.bgmVolume === 0}
                                  aria-label={`${track.title} ${isPreviewing ? '미리듣기 중지' : '미리듣기'}`}
                                  aria-pressed={isPreviewing}
                                  onClick={() => setBgmPreviewUrl(isPreviewing ? null : track.url)}>
                                  {isPreviewing ? '중지' : '미리듣기'}
                                </button>
                                <button type="button"
                                  className={`settings-bgm__toggle${isEnabled ? ' settings-bgm__toggle--enabled' : ''}`}
                                  aria-label={`${track.title} 자동 재생 ${isEnabled ? 'ON' : 'OFF'}`}
                                  aria-pressed={isEnabled} onClick={() => toggleBgmTrack(track.url)}>
                                  {isEnabled ? 'ON' : 'OFF'}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="settings-panel__bottom">
                  <button
                    type="button"
                    className="settings-back"
                    onClick={() => {
                      setIsBgmSettingsOpen(false)
                      setScreenMode('menu')
                    }}
                  >
                    뒤로가기
                  </button>
                  <span className="settings-panel__hint">BACK</span>
                </div>
              </div>
            </section>
          ) : screenMode === 'new-game' ? (
            selectedGameMode === 'daily' ? <DailyStarterSelection challenge={dailyChallenge} catalog={trainedStarterCatalog}
              selectedNames={selectedDailyNames.filter(name => dailyChallenge.candidates.includes(name))}
              trainerSkills={trainerProgress.learned} getStartingSkills={getDigimonSkillNamesForLevel} getSkillDetails={getSkillData}
              onSelectionChange={setSelectedDailyNames} onStart={handleStartAdventure}
              onBack={() => setScreenMode('menu')}
              best={modeProgress.dailyRecords[dailyChallenge.date] ?? 0}
              startDisabled={!canPlayGameMode(selectedGameMode, modeProgress)} modeControl={modeControl}
              headerActions={matchupGuideButton} /> :
            <StarterSelection
              catalog={trainedStarterCatalog}
              analysis={localProgress.analysis}
              trainerSkills={trainerProgress.learned}
              selectedNames={selectedStarterNames}
              onSelectionChange={setSelectedStarterNames}
              getStartingSkills={getDigimonSkillNamesForLevel}
              getSkillDetails={getSkillData}
              onStart={handleStartAdventure}
              onBack={() => setScreenMode('menu')}
              startDisabled={!canPlayGameMode(selectedGameMode, modeProgress)}
              modeControl={modeControl}
              headerActions={matchupGuideButton}
            />
          ) : (
            <section className="adventure-screen" aria-label={'\uAC8C\uC784 \uC2DC\uC791 \uD654\uBA74'}>
              <div className="adventure-stage" inert={isAdventureBlocked} aria-hidden={isAdventureBlocked || undefined}>
                <div className="adventure-stage__background" style={{ backgroundImage: `url("${mapPresentation.url}")` }} aria-hidden="true" />
                <div className="adventure-hud adventure-hud--tactical">
                  <div className="adventure-inventory-strip" aria-label="획득한 아이템">
                    {adventureHudItems.length > 0 ? (
                      adventureHudItems.map((item) => (
                        <div
                          key={`${item.id}-${item.isBuff ? 'buff' : 'count'}`}
                          className={[
                            'adventure-inventory-item',
                            item.isMaxed ? 'adventure-inventory-item--maxed' : '',
                            item.isBuff ? 'adventure-inventory-item--buff' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          data-tooltip={item.description}
                          aria-label={`${item.name}: ${item.description}`}
                          tabIndex={0}
                          role="button"
                          onFocus={(event) => openItemTooltip(event, item)}
                          onPointerEnter={(event) => openItemTooltip(event, item)}
                          onClick={(event) => openItemTooltip(event, item)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openItemTooltip(event, item)
                            }
                          }}
                        >
                          <img className="adventure-inventory-item__image" src={item.imageUrl} alt="" onError={(event) => { event.currentTarget.hidden = true }} />
                          <span className="adventure-inventory-item__fallback" aria-hidden="true">{item.name.slice(0, 2)}</span>
                          <span className="adventure-inventory-item__count">{item.value}</span>
                        </div>
                      ))
                    ) : (
                      <span className="adventure-inventory-strip__empty"></span>
                    )}
                  </div>
                  <BattleTurnPreview rows={turnPreview} onInspect={() => { setActiveCombatantInfo(null); setItemTooltip(null); setIsTurnOrderOpen(true) }} busy={!['commands', 'attack', 'attack-targets', 'scan', 'party'].includes(battlePanelMode) || Boolean(rewardState || mapSelectionState || evolutionState)} />
                  {matchupGuideButton}
                  <div className="adventure-summary-card">
                    <p className="adventure-summary-card__line adventure-summary-card__line--stage">
                      <span>
                        <span className="adventure-summary-card__mode">{getGameMode(gameState?.gameMode).name}</span>
                        {gameState?.currentMap} - {gameState?.currentStage} / {isEndlessMode(gameState) ? '∞' : gameState?.maxStage}
                      </span>
                    </p>
                    <p className="adventure-summary-card__line adventure-summary-card__line--gold">
                      <span className="adventure-summary-card__level-cap" title={isEndlessMode(gameState) ? '아군과 적군의 레벨이 계속 오릅니다.' : '레벨 상한은 10스테이지를 돌파할 때마다 올라갑니다.'}>{isEndlessMode(gameState) ? '레벨 상한 없음' : `레벨 상한 Lv.${gameState?.levelCap}`}</span>
                      <span className="adventure-summary-card__gold">{formatGold(gameState?.gold ?? 0)}</span>
                    </p>
                  </div>
                </div>

                {itemTooltip && (
                  <BattlePopover anchor={itemTooltip.anchor} onClose={() => setItemTooltip(null)} label={`${itemTooltip.item.name} 설명`}>
                    <strong>{itemTooltip.item.name}</strong>
                    <span className="item-rarity-label" data-rarity={getRewardItemRarity(itemTooltip.item)}>{getItemRarityLabel(getRewardItemRarity(itemTooltip.item))} 등급</span>
                    <p>{itemTooltip.item.description}</p>
                  </BattlePopover>
                )}


                <div className="adventure-field" data-ground-y={mapPresentation.groundY}>
                  <AdventureBattleBadge state={gameState} />
                  <BattleScene3D
                    paused={Boolean(evolutionScene)}
                    allies={activeAllies}
                    enemies={visibleEnemies}
                    actingId={battleFocus.actorId}
                    actingSide={battleFocus.side}
                    targetIds={commandTargetIds}
                    attackMotions={attackMotions}
                    projectileEffects={projectileEffects}
                    hitEffects={hitEffects}
                    switchEffects={switchEffects}
                    gameSpeed={gameSettings.gameSpeed}
                    mapName={gameState?.currentMap}
                  />
                  <div
                    className={[
                      'adventure-allies',
                      `adventure-allies--${activeAllies.length || 1}`,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-label="아군 디지몬"
                  >
                    {activeAllies.map((ally, index) => {
                      const allyHpRatio = Math.max(
                        0,
                        Math.min(100, (ally.currentHp / ally.maxHp) * 100)
                      )
                      const isActingAlly = ally.id === actingAlly?.id
                      const allyExpRatio = isActingAlly
                        ? displayedPlayerExpRatio
                        : getExperienceRatio(ally)

                      return (
                        <div
                          key={ally.id}
                          className={[
                            'adventure-ally',
                            `adventure-ally--${activeAllies.length}`,
                            `adventure-ally--slot-${index + 1}`,
                            isActingAlly ? 'adventure-ally--acting' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div
                            className={[
                              'adventure-player__sprite-wrap',
                              'adventure-player__sprite-wrap--ally',
                              activeCombatantInfo?.id === `player-${ally.id}`
                                ? 'adventure-player__sprite-wrap--info-open'
                                : '',
                            ]
                            .filter(Boolean)
                            .join(' ')}
                            ref={setCombatantEffectAnchorRef(ally.id)}
                            data-combatant-id={ally.id}
                            data-side="ally"
                            tabIndex={0}
                            aria-label={`${ally.name} 상세 정보`}
                            onPointerEnter={(event) =>
                              openCombatantInfo(`player-${ally.id}`, event.currentTarget)
                            }
                            onFocus={(event) =>
                              openCombatantInfo(`player-${ally.id}`, event.currentTarget)
                            }
                            role="button"
                            aria-haspopup="dialog"
                            aria-expanded={activeCombatantInfo?.id === `player-${ally.id}`}
                            onClick={(event) => openCombatantInfo(`player-${ally.id}`, event.currentTarget)}
                            onKeyDown={(event) => {
                              if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
                                event.preventDefault()
                                openCombatantInfo(`player-${ally.id}`, event.currentTarget)
                              }
                            }}
                          >
                            {renderBattleSprite(ally, 'ally')}
                            <CombatantInfoPanel
                              combatant={ally}
                              items={getCombatantEquippedItems(ally)}
                              levelCap={gameState?.levelCap}
                              anchor={activeCombatantInfo?.id === `player-${ally.id}` ? activeCombatantInfo.anchor : null}
                              onClose={closeCombatantInfo}
                              side="ally"
                            />
                          </div>

                          <div
                            className="digimon-status"
                            data-active={battleFocus.side === 'ally' && battleFocus.actorId === ally.id}
                            data-active-label={focusLabel}
                            data-targeted={commandTargetIds.includes(ally.id)}
                            data-hp-state={allyHpRatio <= 25 ? 'critical' : allyHpRatio <= 50 ? 'low' : 'healthy'}
                            role="group"
                            aria-label={`${ally.name} 체력과 경험치`}
                          >
                            <p className="digimon-status__name">
                              {isRegionalSupport(ally) && <span className="digimon-status__support-label">동료 · 자동</span>}
                              <span className="digimon-status__name-text">{ally.name}</span>
                              <DigimonLevel className="digimon-status__level" level={ally.level} levelCap={gameState?.levelCap} />
                            </p>
                            <CombatantTraits combatant={ally} />
                            <div className="digimon-status__hp" role="progressbar" aria-label={`${ally.name} 체력`} aria-valuemin={0} aria-valuemax={ally.maxHp} aria-valuenow={ally.currentHp}>
                              <span
                                className="digimon-status__hp-fill"
                                style={{ width: `${allyHpRatio}%` }}
                              />
                              <p className="digimon-status__hp-text">
                                {ally.currentHp} / {ally.maxHp}
                              </p>
                            </div>
                            <CombatantEffects combatant={ally} statusDuration={STATUS_DURATION_TURNS} onInspect={() => inspectCombatantEffects(ally.id)} />
                            <div
                              hidden={isRegionalSupport(ally)}
                              className="digimon-status__exp digimon-status__exp--visible"
                              role="progressbar"
                              aria-label={`${ally.name} 경험치`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={Math.round(allyExpRatio)}
                            >
                              <span
                                className={[
                                  'digimon-status__exp-fill',
                                  isActingAlly && isPlayerExpTransitionInstant
                                    ? 'digimon-status__exp-fill--instant'
                                    : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                style={{ width: `${allyExpRatio}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="adventure-enemies" aria-label={'\uC801 \uB514\uC9C0\uBAAC'}>
                    {visibleEnemies.map((enemy, index) => {
                      const enemyHpRatio = Math.max(
                        0,
                        Math.min(100, (enemy.currentHp / enemy.maxHp) * 100)
                      )

                      return (
                        <div
                          key={enemy.id}
                          className={[
                            'adventure-enemy',
                            `adventure-enemy--${visibleEnemies.length}`,
                            `adventure-enemy--slot-${index + 1}`,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div
                            className={[
                              'adventure-player__sprite-wrap',
                              'adventure-player__sprite-wrap--enemy',
                              hasDigimonDetector && activeCombatantInfo?.id === `enemy-${enemy.id}`
                                ? 'adventure-player__sprite-wrap--info-open'
                                : '',
                            ]
                            .filter(Boolean)
                            .join(' ')}
                            ref={setCombatantEffectAnchorRef(enemy.id)}
                            data-combatant-id={enemy.id}
                            data-side="enemy"
                            tabIndex={hasDigimonDetector ? 0 : undefined}
                            aria-label={`${enemy.name} ${isAttackTargetPanelOpen ? '공격 대상으로 선택' : '상세 정보'}`}
                            onPointerEnter={
                              isAttackTargetPanelOpen ? () => handleTargetPreview(enemy.id) : hasDigimonDetector
                                ? (event) =>
                                    openCombatantInfo(`enemy-${enemy.id}`, event.currentTarget)
                                : undefined
                            }
                            onFocus={
                              isAttackTargetPanelOpen ? () => handleTargetPreview(enemy.id) : hasDigimonDetector
                                ? (event) =>
                                    openCombatantInfo(`enemy-${enemy.id}`, event.currentTarget)
                                : undefined
                            }
                            role={hasDigimonDetector ? 'button' : undefined}
                            onPointerLeave={isAttackTargetPanelOpen ? handleTargetPreviewClear : undefined}
                            onBlur={isAttackTargetPanelOpen ? handleTargetPreviewClear : undefined}
                            aria-haspopup={hasDigimonDetector && !isAttackTargetPanelOpen ? 'dialog' : undefined}
                            aria-expanded={hasDigimonDetector ? activeCombatantInfo?.id === `enemy-${enemy.id}` : undefined}
                            onClick={isAttackTargetPanelOpen ? () => handleAttackTargetSelect(enemy.id) : hasDigimonDetector ? (event) => openCombatantInfo(`enemy-${enemy.id}`, event.currentTarget) : undefined}
                            onKeyDown={hasDigimonDetector ? (event) => {
                              if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
                                event.preventDefault()
                                  if (isAttackTargetPanelOpen) handleAttackTargetSelect(enemy.id)
                                  else openCombatantInfo(`enemy-${enemy.id}`, event.currentTarget)
                              }
                            } : undefined}
                          >
                            {renderBattleSprite(enemy, 'enemy')}
                            {hasDigimonDetector ? (
                              <CombatantInfoPanel
                                combatant={enemy}
                                items={getCombatantEquippedItems(enemy)}
                                levelCap={gameState?.levelCap}
                                anchor={activeCombatantInfo?.id === `enemy-${enemy.id}` ? activeCombatantInfo.anchor : null}
                                onClose={closeCombatantInfo}
                                side="enemy"
                              />
                            ) : null}
                          </div>

                          <div
                            className={[
                              'digimon-status',
                              'digimon-status--enemy',
                              enemy.isBoss ? 'digimon-status--boss' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            role="group"
                            data-hp-state={enemyHpRatio <= 25 ? 'critical' : enemyHpRatio <= 50 ? 'low' : 'healthy'}
                            data-targeted={commandTargetIds.includes(enemy.id)}
                            data-active={battleFocus.side === 'enemy' && battleFocus.actorId === enemy.id}
                            data-active-label={focusLabel}
                            aria-label={`${enemy.name} 체력`}
                          >
                            <p className="digimon-status__name">
                              {enemy.isBoss ? (
                                <span className="digimon-status__boss-label">BOSS</span>
                              ) : null}
                              <span className="digimon-status__name-text">{enemy.name}</span>
                              <DigimonLevel className="digimon-status__level" level={enemy.level} levelCap={gameState?.levelCap} />
                            </p>
                            <CombatantTraits combatant={enemy} />
                            <div className="digimon-status__hp" role="progressbar" aria-label={`${enemy.name} 체력`} aria-valuemin={0} aria-valuemax={enemy.maxHp} aria-valuenow={enemy.currentHp}>
                              <span
                                className="digimon-status__hp-fill digimon-status__hp-fill--enemy"
                                style={{ width: `${enemyHpRatio}%` }}
                              />
                              {(enemy.isBoss || enemy.rivalEncounter?.leader) && (enemy.bossHpSegmentCount ?? 1) > 1 ? (
                                <span className="digimon-status__hp-segments" aria-hidden="true">
                                  {(enemy.bossHpMarkers ?? Array.from({ length: Math.max(0, (enemy.bossHpSegmentCount ?? 1) - 1) },
                                    (_, index) => (index + 1) / enemy.bossHpSegmentCount)).map((marker, segmentIndex) => (
                                    <span
                                      key={segmentIndex}
                                      className="digimon-status__hp-segment"
                                      style={{
                                        left: `${marker * 100}%`,
                                      }}
                                    />
                                  ))}
                                </span>
                              ) : null}
                              <p className="digimon-status__hp-text">
                                {enemy.currentHp} / {enemy.maxHp}
                              </p>
                            </div>
                            <CombatantEffects combatant={enemy} statusDuration={STATUS_DURATION_TURNS} onInspect={() => inspectCombatantEffects(enemy.id)} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {rewardState && (
                  <div className="reward-screen" aria-label={'스테이지 클리어 보상'}>
                    <div className="reward-screen__veil" aria-hidden="true" />
                    <div className="reward-screen__fixed">
                      {fixedRewardItems.map((item) => {
                        const canAfford = (gameState?.gold ?? 0) >= item.price
                        const canStore = !item.consumable || (gameState?.inventory?.[item.id] ?? 0) < item.maxOwned
                        const hasUsableTarget =
                          !isTargetedRewardItem(item) ||
                          rewardTargetMembers.some((member) =>
                            isRewardItemUsableByCombatant(item, member, gameState?.levelCap ?? Infinity)
                          )

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={[
                              'reward-item',
                              'reward-item--fixed',
                              canAfford && canStore && hasUsableTarget ? '' : 'reward-item--disabled',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={
                              !canAfford ||
                              !canStore ||
                              !hasUsableTarget ||
                              rewardState.isResolving ||
                              Boolean(rewardState.pendingTarget)
                            }
                            onClick={() => { setItemTooltip(null); handlePurchaseFixedRewardItem(item.id) }}
                            onFocus={(event) => openItemTooltip(event, item)}
                            onPointerEnter={(event) => openItemTooltip(event, item)}
                          >
                            <img className="reward-item__image" src={item.imageUrl} alt="" />
                            <strong className="reward-item__name">{item.name}</strong>
                            <span className="reward-item__price">{formatGold(item.price)}</span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="reward-screen__random reward-screen__random--tabs">
                      <div className="reward-screen__selection-heading">
                      <div className="reward-tabs" role="tablist" aria-label="전투 보상과 스캔 데이터">
                        {(allowsScanning(gameState) ? ['items', 'scan'] : ['items']).map(tab => <button type="button" role="tab" key={tab} id={`${tab}-reward-tab`}
                          aria-selected={rewardTab === tab} aria-controls={`${tab}-reward-panel`} tabIndex={rewardTab === tab ? 0 : -1}
                          disabled={rewardState.isResolving || Boolean(rewardState.pendingTarget)}
                          onClick={() => { setItemTooltip(null); setRewardTab(tab) }}
                          onKeyDown={event => { if (allowsScanning(gameState) && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
                            event.preventDefault(); const next = tab === 'items' ? 'scan' : 'items'; setItemTooltip(null); setRewardTab(next)
                            event.currentTarget.parentElement.querySelector(`#${next}-reward-tab`)?.focus()
                          } }}>{tab === 'items' ? '아이템 보상 · 3개 중 선택' : `스캔 데이터 · 부화 가능 ${scanEntries.filter(entry => entry.progress >= 100).length}`}</button>)}
                      </div>
                      <ItemLuck ranks={gameState?.trainerSkills} />
                      </div>
                      {allowsScanning(gameState) && rewardTab === 'scan' ? <ScanIncubator entries={scanEntries} busy={rewardState.isResolving || rewardState.isRevealing}
                        onHatch={handleHatchScan} message={hatchMessage} /> :
                      <div className="reward-screen__random-list" role="tabpanel" id="items-reward-panel" aria-labelledby="items-reward-tab">
                        {rewardState.randomItems.map((item) => {
                          const isRevealingReward = Boolean(rewardState.isRevealing)

                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={[
                                'reward-item',
                                'reward-item--random',
                                `reward-item--rarity-${getRewardItemRarity(item)}`,
                                isRevealingReward ? 'reward-item--revealing' : 'reward-item--revealed',
                                rewardState.selectedRandomItemId === item.id ? 'reward-item--selected' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              disabled={
                                rewardState.isResolving ||
                                isRevealingReward ||
                                Boolean(rewardState.pendingTarget)
                              }
                              onClick={() => { setItemTooltip(null); handleClaimRandomRewardItem(item.id) }}
                              onFocus={isRevealingReward ? undefined : (event) => openItemTooltip(event, item)}
                              onPointerEnter={isRevealingReward ? undefined : (event) => openItemTooltip(event, item)}
                            >
                              <img
                                className={`reward-item__image${!isRevealingReward && item.cardCode ? ' reward-item__image--card' : ''}`}
                                src={isRevealingReward ? REWARD_REVEAL_IMAGE_URL : item.imageUrl}
                                alt=""
                              />
                              <strong className="reward-item__name">
                                {isRevealingReward ? '\u00A0' : item.name}
                              </strong>
                              {!isRevealingReward && <span className="reward-item__rarity" data-rarity={getRewardItemRarity(item)}>{getItemRarityLabel(getRewardItemRarity(item))}</span>}
                            </button>
                          )
                        })}
                      </div>}
                    </div>

                    {pendingRewardItem ? (
                      <div className="reward-target-screen" aria-label="아이템 대상 선택">
                        <div className="reward-target-screen__panel">
                          <div className="reward-target-screen__header">
                            <img
                              className="reward-target-screen__item-image"
                              src={pendingRewardItem.imageUrl}
                              alt=""
                            />
                            <span className="reward-target-screen__eyebrow">대상 선택</span>
                            <strong className="reward-target-screen__title">
                              {pendingRewardItem.jogressRecipes
                                ? `${pendingRewardItem.name} ${pendingJogressSelectedIds.length}/${pendingJogressRequiredCount}`
                                : pendingRewardItem.name}
                            </strong>
                          </div>
                          <div className="reward-target-screen__list">
                            {rewardTargetSlots.map((member, index) => {
                              if (!member) {
                                return (
                                  <div
                                    key={`reward-target-empty-${index}`}
                                    className="party-member party-member--empty reward-target-member"
                                  >
                                    <span className="party-member__empty-text">EMPTY</span>
                                  </div>
                                )
                              }

                              const hpRatio = Math.max(
                                0,
                                Math.min(100, (member.currentHp / member.maxHp) * 100)
                              )
                              const isUsable = isRewardItemUsableByCombatant(
                                pendingRewardItem,
                                member,
                                gameState?.levelCap ?? Infinity
                              )
                              const isJogressSelection = Boolean(pendingRewardItem.jogressRecipes)
                              const isJogressSelected = pendingJogressSelectedIds.includes(member.id)
                              const isJogressUsable = isJogressSelection
                                ? isJogressMemberSelectable(
                                    member,
                                    rewardTargetMembers,
                                    pendingJogressSelectedIds,
                                    pendingRewardItem.jogressRecipes
                                  )
                                : false
                              const isInvalidTypeTarget =
                                pendingRewardItem.typeUpKey &&
                                (member.type !== pendingRewardItem.typeUpKey ||
                                  (normalizeTypePowerUps(member.typePowerUps)[pendingRewardItem.typeUpKey] ?? 0) >=
                                    (pendingRewardItem.maxOwnedPerCombatant ?? TYPE_POWER_UP_MAX))
                              const isInvalidEvolutionReturnTarget =
                                pendingRewardItem.evolutionReturn && !canReturnEvolution(member)

                              return (
                                <button
                                  key={member.id}
                                  type="button"
                                  className={[
                                    'party-member',
                                    'reward-target-member',
                                    !(isJogressSelection ? isJogressUsable : isUsable)
                                      ? 'reward-target-member--disabled'
                                      : '',
                                    isJogressSelected ? 'reward-target-member--selected' : '',
                                    isJogressSelection && !isJogressUsable
                                      ? 'reward-target-member--invalid-jogress'
                                      : '',
                                    isInvalidTypeTarget ? 'reward-target-member--invalid-type' : '',
                                    isInvalidEvolutionReturnTarget ? 'reward-target-member--invalid-return' : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                  disabled={!(isJogressSelection ? isJogressUsable : isUsable) || rewardState.isResolving}
                                  onPointerEnter={event => showCombatantTooltip(event, member)}
                                  onFocus={event => showCombatantTooltip(event, member)}
                                  onClick={() => handleSelectRewardTarget(member.id)}
                                >
                                  <img className="party-member__image" src={member.imageUrl} alt="" />
                                  <span className="party-member__name">{member.name}</span>
                                  <CombatantTraits combatant={member} />
                                  {member.isEgg ? <>
                                    <span className="party-member__level">{DIGI_EGG_STAGE}</span>
                                    <span className="party-member__egg-text">부화까지 {member.eggStagesRemaining}스테이지</span>
                                  </> : <>
                                    <DigimonLevel className="party-member__level" level={member.level} levelCap={gameState?.levelCap} />
                                    <span className="party-member__hp"><span className="party-member__hp-fill" style={{ width: `${hpRatio}%` }} /></span>
                                    <span className="party-member__hp-text">{member.currentHp}/{member.maxHp}</span>
                                  </>}
                                </button>
                              )
                            })}
                          </div>
                          <button
                            type="button"
                            className="reward-target-screen__cancel"
                            onClick={handleCancelRewardTargetSelection}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="reward-screen__bottom-actions">
                      <div className="reward-screen__reroll-group">
                        <button
                          type="button"
                          className="reward-screen__reroll-button"
                          disabled={
                            rewardState.isResolving ||
                            rewardState.isRevealing ||
                            Boolean(rewardState.pendingTarget) ||
                            (gameState?.gold ?? 0) < (rewardState.rerollCost ?? 0)
                          }
                          onClick={handleRerollRewardItems}
                        >
                          리롤
                        </button>
                        <span className="reward-screen__reroll-price">
                          {formatGold(rewardState.rerollCost ?? 0)}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`reward-screen__party-button ${readyEvolutionMemberCount > 0 ? 'reward-screen__party-button--evolution-ready' : ''}`}
                        aria-label={readyEvolutionMemberCount > 0 ? `보유디지몬 · ${readyEvolutionMemberCount}마리 진화 가능` : '보유디지몬'}
                        disabled={rewardState.isResolving || Boolean(rewardState.pendingTarget)}
                        onClick={handleOpenEvolutionParty}
                      >
                        보유디지몬
                        {readyEvolutionMemberCount > 0 && <span className="reward-screen__evolution-badge">진화 가능 {readyEvolutionMemberCount}</span>}
                      </button>
                    </div>

                    {evolutionState && !evolutionScene ? (
                      <div className="evolution-screen" aria-label="보유 디지몬 진화">
                        <div
                          className={[
                            'evolution-screen__panel',
                            evolutionState.mode === 'detail' ? 'evolution-screen__panel--detail' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div className="evolution-screen__header">
                            <span className="evolution-screen__eyebrow">진화</span>
                            <strong className="evolution-screen__title">
                              {evolutionState.mode === 'detail' && selectedEvolutionMember
                                ? `${selectedEvolutionMember.name} 진화 정보`
                                : '보유 디지몬'}
                            </strong>
                            <button
                              type="button"
                              className="evolution-screen__close"
                              onClick={handleCloseEvolutionPanel}
                            >
                              닫기
                            </button>
                          </div>

                          {evolutionState.mode !== 'detail' ? (
                            <div className="evolution-screen__party-list">
                              {evolutionPartySlots.map((member, index) => {
                                if (!member) {
                                  return (
                                    <div
                                      key={`evolution-empty-${index}`}
                                      className="party-member party-member--empty evolution-party-member"
                                    >
                                      <span className="party-member__empty-text">EMPTY</span>
                                    </div>
                                  )
                                }

                                const hpRatio = Math.max(
                                  0,
                                  Math.min(100, (member.currentHp / member.maxHp) * 100)
                                )
                                const evolutionCount = getEvolutionOptions(member, gameState?.inventory, evolutionPartyMembers, gameState?.evolutionMemory).length

                                return (
                                  <button
                                    key={member.id}
                                    type="button"
                                    className={'party-member evolution-party-member' + (member.isEgg ? ' party-member--egg' : '') + (readyEvolutionMemberIds.has(member.id) ? ' evolution-party-member--ready' : '')}
                                    aria-label={readyEvolutionMemberIds.has(member.id) ? `${member.name} · 진화 가능` : undefined}
                                    disabled={Boolean(member.isEgg)}
                                    onPointerEnter={event => showCombatantTooltip(event, member)}
                                    onFocus={event => showCombatantTooltip(event, member)}
                                    onClick={() => handleSelectEvolutionMember(member.id)}
                                  >
                                    <img className="party-member__image" src={member.imageUrl} alt="" />
                                    <span className="party-member__name">{member.name}</span>
                                    <CombatantTraits combatant={member} />
                                    {member.isEgg ? <>
                                      <span className="party-member__level">{DIGI_EGG_STAGE}</span>
                                      <span className="party-member__egg-text">부화까지 {member.eggStagesRemaining}스테이지</span>
                                    </> : <>
                                      <DigimonLevel className="party-member__level" level={member.level} levelCap={gameState?.levelCap} />
                                      <span className="party-member__hp"><span className="party-member__hp-fill" style={{ width: `${hpRatio}%` }} /></span>
                                      <span className="party-member__hp-text">{member.currentHp}/{member.maxHp} · 진화 {evolutionCount}</span>
                                    </>}
                                  </button>
                                )
                              })}
                            </div>
                          ) : selectedEvolutionMember ? (
                            <div className="evolution-detail">
                              <section className="evolution-detail__current">
                                <DigimonModelPreview
                                  className="evolution-detail__current-image"
                                  name={selectedEvolutionMember.imageName ?? selectedEvolutionMember.name}
                                >
                                  <img src={selectedEvolutionMember.imageUrl} alt={selectedEvolutionMember.name} />
                                </DigimonModelPreview>
                                <div className="evolution-detail__current-info">
                                  <p className="evolution-detail__name">{selectedEvolutionMember.name}</p>
                                  <p className="evolution-detail__meta">
                                    <DigimonLevel level={selectedEvolutionMember.level} levelCap={gameState?.levelCap} /> · {selectedEvolutionMember.speciesStage}
                                  </p>
                                  <p className="evolution-detail__meta">HP {selectedEvolutionMember.currentHp} / {selectedEvolutionMember.maxHp}</p>
                                  <div className="evolution-detail__traits">
                                    <span>{selectedEvolutionMember.type}</span>
                                    <span>{selectedEvolutionMember.attribute}</span>
                                  </div>
                                </div>
                                <div className="evolution-detail__stats">
                                  {LEVEL_UP_STAT_KEYS.map((statKey) => (
                                    <span key={statKey} className="evolution-detail__stat">
                                      <span>{LEVEL_UP_STAT_LABEL_MAP[statKey]}</span>
                                      <strong>{getCombatantBattleStatValue(selectedEvolutionMember, statKey)}</strong>
                                    </span>
                                  ))}
                                </div>
                              </section>

                              <EvolutionBranches
                                key={selectedEvolutionMember.id + selectedEvolutionMember.name}
                                options={evolutionOptions}
                                collection={localProgress.collection}
                                lookup={allDigimonLookup}
                                sourceName={selectedEvolutionMember.name}
                                onSelect={handleRequestEvolution}
                              />

                              <button
                                type="button"
                                className="evolution-screen__back"
                                onClick={handleBackToEvolutionParty}
                              >
                                목록으로
                              </button>
                            </div>
                          ) : null}

                          {pendingEvolutionOption && selectedEvolutionMember ? (
                            <div className="evolution-confirm" role="dialog" aria-modal="true">
                              <div className="evolution-confirm__box">
                                <p className="evolution-confirm__text">
                                  {pendingEvolutionOption.recipe ? pendingEvolutionMaterials.map(member => member.name).join(' + ') : selectedEvolutionMember.name}을(를) {getCollectionStatus(localProgress.collection, pendingEvolutionOption.targetData.이름) === 'unknown' ? '???' : pendingEvolutionOption.targetData.이름}(으)로
                                  진화하겠습니다.
                                  {pendingEvolutionOption.itemWaived ? <><br />진화 기억으로 아이템을 사용하지 않습니다.</>
                                    : pendingEvolutionOption.itemRequirement && <><br />{pendingEvolutionOption.itemRequirement.name} 1개를 사용합니다.</>}
                                  {pendingEvolutionOption.recipe && <><br />선택한 파트너들은 합체 후 한 마리가 됩니다.</>}
                                </p>
                                {pendingEvolutionOption.recipe && <div className="evolution-confirm__partners">
                                  {pendingEvolutionOption.partnerIds.map((defaultId, index) => {
                                    const sourcePartner = getCombatantById(evolutionPartyMembers, defaultId)
                                    const chosenIds = evolutionState.confirmPartnerIds ?? pendingEvolutionOption.partnerIds
                                    return <label key={index}>{sourcePartner?.name}
                                      <select aria-label={`조그레스 파트너 ${index + 1}`} value={chosenIds[index] ?? defaultId}
                                        onChange={event => { const id = event.target.value; setEvolutionState(current => ({ ...current,
                                          confirmPartnerIds: chosenIds.map((chosenId, slot) => slot === index ? id : chosenId) })) }}>
                                        {evolutionPartyMembers.filter(member => member.id !== selectedEvolutionMember.id && member.name === sourcePartner?.name &&
                                          member.level >= pendingEvolutionOption.recipe.level && !chosenIds.some((id, slot) => slot !== index && id === member.id))
                                          .map(member => <option key={member.id} value={member.id}>{member.name} · Lv.{member.level}</option>)}
                                      </select>
                                    </label>
                                  })}
                                </div>}
                                <div className="evolution-confirm__actions">
                                  <button type="button" onClick={handleConfirmEvolution} disabled={!pendingEvolutionOption.canEvolve || Boolean(pendingEvolutionOption.recipe && pendingEvolutionMaterials.length !== pendingEvolutionOption.recipe.materials.length)}>
                                    예
                                  </button>
                                  <button type="button" onClick={handleCancelEvolutionConfirm}>
                                    아니요
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {activeSkillReplaceEvent && skillReplaceCombatant && !evolutionScene ? (
                  <div className="skill-replace-screen" role="dialog" aria-modal="true">
                    <div className="skill-replace-screen__panel">
                      <div className="skill-replace-screen__header">
                        <span className="skill-replace-screen__eyebrow">{activeSkillReplaceEvent.source === 'jogress' ? '조그레스 기술 계승' : '새 기술'}</span>
                        <strong className="skill-replace-screen__title">
                          {skillReplaceCombatant.name}은(는) {activeSkillReplaceEvent.newSkillName}을(를) 배우려 한다.
                        </strong>
                      </div>

                      <div className="skill-replace-screen__new">
                        <strong>{activeSkillReplaceEvent.newSkillName}</strong>
                        <span>
                          {skillReplaceNewSkillData?.분류 ?? '기술'} ·{' '}
                          {skillReplaceNewSkillData?.속성 ?? '무'} ·{' '}
                          {getSkillRangeLabel(skillReplaceNewSkillData)}
                        </span>
                      </div>

                      <p className="skill-replace-screen__prompt">
                        {activeSkillReplaceEvent.source === 'jogress' ? '기술은 최대 8개까지 보유할 수 있습니다. 교체할 기술을 선택하거나 계승하지 않을 수 있습니다.' : '잊을 기술을 선택해줘. 배우지 않으면 현재 기술 구성을 유지한다.'}
                      </p>

                      <div className="skill-replace-screen__skills">
                        {skillReplaceCurrentSkills.map((skillName) => (
                          <button
                            key={skillName}
                            type="button"
                            className="skill-replace-screen__skill"
                            onClick={() => handleReplaceSkill(skillName)}
                          >
                            <span className="skill-replace-screen__marker" aria-hidden="true">
                              ▶
                            </span>
                            <span>{skillName}</span>
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="skill-replace-screen__skip"
                        onClick={handleSkipSkillReplacement}
                      >
                        {activeSkillReplaceEvent.source === 'jogress' ? '계승하지 않는다' : '배우지 않는다'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {mapSelectionState && !rewardState && (
                  <div className="map-selection-screen" aria-label="지도 이동 선택">
                    <div className="map-selection-screen__panel">
                      <div className="map-selection-screen__header">
                        <p className="map-selection-screen__eyebrow">지도</p>
                        <h3 className="map-selection-screen__title">다음에 이동할 지역을 선택하세요</h3>
                        <span className="map-selection-screen__stage">
                          STAGE {mapSelectionState.nextStageNum}
                        </span>
                      </div>
                      <div className="map-selection-screen__list">
                        {mapSelectionOptions.map((mapName) => {
                    const encounterNames = getMapEncounterNamesForStage(
                      mapName,
                      mapSelectionState.nextStageNum
                          )

                          return (
                            <button
                              key={mapName}
                              type="button"
                              className="map-selection-screen__item"
                              onClick={() => handleSelectMapDestination(mapName)}
                            >
                              <span className="map-selection-screen__marker" aria-hidden="true">
                                ▶
                              </span>
                              <span className="map-selection-screen__item-body">
                        <span className="map-selection-screen__map-name">{mapName}</span>
                        {hasGlobeItem ? (
                          <span className="map-selection-screen__encounters">
                            <span className="map-selection-screen__group">등장 디지몬</span>
                            <span className="map-selection-screen__names">
                              {encounterNames.join(', ')}
                            </span>
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {isFaintReplacementOpen && !rewardState && !activeSkillReplaceEvent && !evolutionState && (
                  <FaintReplacementPanel party={partyMembers} activeAllyIds={gameState.activeAllyIds}
                    replacement={faintReplacement} onSelect={handleFaintReplacement} onInspect={showCombatantTooltip} levelCap={gameState?.levelCap} />
                )}

                {isPartyPanelOpen && !rewardState && actingAlly && (
                  <div className="party-screen" aria-label="보유 디지몬">
                    <div className="party-screen__current" aria-label="현재 행동 디지몬" tabIndex={0}
                      onPointerEnter={event => showCombatantTooltip(event, actingAlly)} onFocus={event => showCombatantTooltip(event, actingAlly)}>
                      <DigimonModelPreview
                        className="party-screen__current-image"
                        name={actingAlly.imageName ?? actingAlly.name}
                      >
                        <img src={actingAlly.imageUrl} alt={actingAlly.name} />
                      </DigimonModelPreview>
                      <div className="party-screen__current-card">
                        <p className="party-screen__name">{actingAlly.name}</p>
                        <CombatantTraits combatant={actingAlly} />
                        <DigimonLevel as="p" className="party-screen__level" level={actingAlly.level} levelCap={gameState?.levelCap} />
                        <div className="party-screen__hp">
                          <span
                            className="party-screen__hp-fill"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, (actingAlly.currentHp / actingAlly.maxHp) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="party-screen__hp-text">
                          {actingAlly.currentHp}/{actingAlly.maxHp}
                        </p>
                      </div>
                    </div>

                    <div className="party-screen__list" aria-label="교체 가능한 디지몬">
                      {partyListSlots.map((member, index) => {
                        const hpRatio = member
                          ? Math.max(0, Math.min(100, (member.currentHp / member.maxHp) * 100))
                          : 0
                        const isEgg = member ? isCombatantEgg(member) : false
                        const isFainted = member ? !isEgg && member.currentHp <= 0 : false
                        const isActiveInBattle = member ? activeAllyIds.includes(member.id) : false
                        const isDisabled = isEgg || isFainted || isActiveInBattle

                        return member ? (
                          <button
                            key={member.id}
                            type="button"
                            className={[
                              'party-member',
                              isEgg ? 'party-member--egg' : '',
                              isFainted ? 'party-member--fainted' : '',
                              isActiveInBattle ? 'party-member--active' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={isDisabled}
                            onPointerEnter={event => showCombatantTooltip(event, member)}
                            onFocus={event => showCombatantTooltip(event, member)}
                            onClick={() => handleSwitchPartyMember(member.id)}
                          >
                            <img className="party-member__image" src={member.imageUrl} alt="" />
                            <span className="party-member__name">{member.name}</span>
                            <CombatantTraits combatant={member} />
                            <span className="party-member__level">
                              {isEgg ? DIGI_EGG_STAGE : <DigimonLevel level={member.level} levelCap={gameState?.levelCap} />}
                            </span>
                            {isEgg ? (
                              <span className="party-member__egg-text">
                                부화까지 {member.eggStagesRemaining}스테이지
                              </span>
                            ) : (
                              <>
                                <span className="party-member__hp">
                                  <span
                                    className="party-member__hp-fill"
                                    style={{ width: `${hpRatio}%` }}
                                  />
                                </span>
                                <span className="party-member__hp-text">
                                  {member.currentHp}/{member.maxHp}
                                </span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div key={`empty-${index}`} className="party-member party-member--empty">
                            <span className="party-member__empty-text">EMPTY</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {isSkillConsoleOpen &&
                !rewardState &&
                !mapSelectionState &&
                !evolutionState &&
                !isPartyPanelOpen &&
                !isItemPanelOpen ? (
                  <BattleSkillConsole
                    key={`${actingAlly?.id}-${battlePanelMode}`}
                    actor={{ ...actingAlly, imageUrl: getDigimonThumbnailUrl(actingAlly?.imageName ?? actingAlly?.name) }}
                    skills={skillConsoleEntries}
                    targets={visibleEnemies.map(enemy => ({ ...enemy, imageUrl: getDigimonThumbnailUrl(enemy.imageName ?? enemy.name) }))}
                    selectedSkillIndex={selectedSkillIndex}
                    choosingTarget={isAttackTargetPanelOpen}
                    hoveredTargetId={hoveredEnemyTargetId}
                    onSelectSkill={handleSkillSelect}
                    onSelectTarget={handleAttackTargetSelect}
                    onInspect={showCombatantTooltip}
                    onPreviewTarget={handleTargetPreview}
                    onClearTarget={handleTargetPreviewClear}
                    onPreviewSkill={index => setPreviewedSkill({ actorId: actingAlly?.id, index })}
                    onClearSkill={() => setPreviewedSkill(null)}
                    onBack={() => { setHoveredEnemyTargetId(null); setBattlePanelMode('attack') }}
                    onClose={() => { setHoveredEnemyTargetId(null); setBattlePanelMode('commands') }}
                  />
                ) : null}
              </div>

              <div className="battle-console" inert={isAdventureBlocked} aria-hidden={isAdventureBlocked || undefined} aria-label={'\uBC30\uD2C0 UI'}>
                <BattleLog logs={currentLogs} actingName={actingAlly?.name} busy={battlePanelMode === 'logs' || battlePanelMode === 'animating'}
                  waitingForReplacement={isFaintReplacementOpen}
                  historyDisabled={Boolean(evolutionState || activeSkillReplaceEvent || hasExplorationScene || gameState?.awaitingReplacement)}
                  onOpenHistory={() => { setActiveCombatantInfo(null); setItemTooltip(null); setIsHistoryOpen(true) }} />

                <section className="battle-console__commands battle-console__commands--digivice" aria-label={'\uBC30\uD2C0 \uBA54\uB274'}>
                  {battleMenuItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={[
                        'battle-command',
                        item.key === selectedBattleCommand ? 'battle-command--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      disabled={
                        (item.key === 'run' && isEscapeBlocked(gameState ?? {})) ||
                        Boolean(gameState?.awaitingReplacement) ||
                        battlePanelMode === 'logs' ||
                        battlePanelMode === 'animating' ||
                        Boolean(rewardState) ||
                        hasExplorationScene ||
                        Boolean(mapSelectionState)
                      }
                      title={item.key === 'run' && isEscapeBlocked(gameState ?? {}) ? '보스·중간보스전에서는 도망칠 수 없습니다.' : undefined}
                      data-command={item.key}
                      aria-pressed={item.key === selectedBattleCommand}
                      onClick={() => handleBattleCommandSelect(item.key)}
                    >
                      <span className="battle-command__marker" aria-hidden="true">
                        <BattleCommandIcon command={item.key} />
                      </span>
                      <span className="battle-command__label">{item.label}</span>
                    </button>
                  ))}
                </section>

                {levelUpStatPreview && (
                  <aside
                    className={[
                      'level-up-stats',
                      levelUpStatPreview.isExiting ? 'level-up-stats--exit' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-label="레벨업 스탯 상승량 및 진화 가능 알림"
                    role="status"
                    aria-live="polite"
                  >
                    {levelUpStatPreview.sourceName && <p className="level-up-stats__evolution-title">{levelUpStatPreview.sourceName} 레벨업</p>}
                    {levelUpStatPreview.rows.map((row) => (
                      <p key={row.key} className="level-up-stats__row">
                        <span className="level-up-stats__label">{row.label}:</span>
                        <span className="level-up-stats__value">{row.value}</span>
                        <span className="level-up-stats__gain">(+{row.gain})</span>
                      </p>
                    ))}
                    {levelUpStatPreview.evolutionTargets?.length > 0 ? (
                      <div className="level-up-stats__evolutions" aria-label="새로운 진화 가능 대상">
                        <p className="level-up-stats__evolution-title">진화 가능</p>
                        {levelUpStatPreview.evolutionTargets.map((target) => {
                          const discovered = getCollectionStatus(localProgress.collection, target.name) !== 'unknown'
                          return (
                          <div key={`${target.sourceId ?? 'player'}-${target.name}`} className="level-up-stats__evolution">
                            <img
                              className="level-up-stats__evolution-image evolution-target-portrait"
                              data-discovered={discovered}
                              src={target.imageUrl}
                              alt=""
                            />
                            <span className="level-up-stats__evolution-body">
                              <strong>{discovered ? target.name : '???'}</strong>
                              <span>{target.sourceName ? `${target.sourceName} → ` : ''}{discovered ? target.stage : '???'}</span>
                            </span>
                          </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </aside>
                )}

              </div>

              {isItemPanelOpen && !rewardState && actingAlly && <BattleItemMenu state={{ ...gameState, party: battleContext.party, activeAllyIds }} actor={actingAlly}
                onUse={handleUseBattleItem} onInspect={showCombatantTooltip} onClose={() => { setBattlePanelMode('commands'); setSelectedBattleCommand('attack') }} />}
              {isHistoryOpen && <BattleHistory history={battleHistory} onClose={() => setIsHistoryOpen(false)} />}
              {isTurnOrderOpen && <BattleTurnDetails rows={turnPreview} onClose={() => setIsTurnOrderOpen(false)} />}
              {effectDetailsCombatant && !isHistoryOpen && <CombatantEffectsDialog combatant={effectDetailsCombatant} statusDuration={STATUS_DURATION_TURNS} onClose={() => setEffectDetailsId(null)} />}
              {showExplorationEvent && !isInfoDialogOpen && <ExplorationEvent key={gameState.explorationEvent.id} state={gameState} onChoose={handleExplorationChoice} onContinue={handleContinueExploration} />}
              {evolutionScene ? (
                <EvolutionCutscene key={evolutionScene.id} scene={evolutionScene} speed={gameSettings.evolutionSpeed} onComplete={finishEvolutionScene} />
              ) : null}
            </section>
          )}
        </div>
      </section>
      <CommunityHub screenMode={screenMode} identity={authSession?.identity} blocked={Boolean(saveDialog || isMatchupGuideOpen || isHallOpen || (screenMode === 'adventure' && (isAdventureBlocked || evolutionState || isPartyPanelOpen || mapSelectionState)))} />
      {equipmentTooltip && equipmentTooltipMember && !evolutionScene && !saveDialog && <EquipmentTooltip
        anchor={equipmentTooltip.anchor} combatant={equipmentTooltipMember} levelCap={gameState?.levelCap}
        items={getCombatantEquippedItems(equipmentTooltipMember)} onClose={() => setEquipmentTooltip(null)} />}
      {isHallOpen && <HallOfFame identity={authSession?.identity} itemById={hallItemById} skillInfo={getSkillData}
        retryPending={hall.retry} onClose={() => setIsHallOpen(false)} />}
      {hall.notice && screenMode === 'adventure' && gameState?.currentStage === 200 && gameState.enemies?.every(unit => unit.currentHp <= 0) &&
        <div className="hall-clear-notice" role="status">{hall.notice}</div>}
      {isMatchupGuideOpen && <MatchupGuideModal onClose={() => setIsMatchupGuideOpen(false)} />}
      {screenMode === 'adventure' && partyAdmission && !saveDialog && !evolutionScene && !rewardState?.isResolving && <PartyAdmissionDialog
        key={partyAdmission.member.id} state={gameState} request={partyAdmission} error={partyAdmissionError}
        onReplace={handleConfirmPartyAdmission} onCancel={handleCancelPartyAdmission} onInspect={showCombatantTooltip} />}
      {saveDialog && <SaveSlotsDialog key={saveDialog.mode} mode={saveDialog.mode} slots={saveSlots}
        currentState={gameState} busy={saveDialog.mode === 'exit' && getSaveTransitionBusy()} error={saveDialog.error}
        onDelete={handleDeleteSaveSlot} onClose={() => setSaveDialog(null)} onConfirm={saveDialog.mode === 'exit' ? handleSaveAndExit : handleLoadSaveSlot} />}
    </main>
  )
}

export default App
