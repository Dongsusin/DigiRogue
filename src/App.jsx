import { useEffect, useRef, useState } from 'react'
import babyStageData from '../data/디지몬/유아기.json'
import childStageData from '../data/디지몬/유년기.json'
import growthStageData from '../data/디지몬/성장기.json'
import matureStageData from '../data/디지몬/성숙기.json'
import perfectStageData from '../data/디지몬/완전체.json'
import ultimateStageData from '../data/디지몬/궁극체.json'
import superUltimateStageData from '../data/디지몬/초궁극체.json'
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
import './App.css'

const menuItems = [
  { label: '\uC0C8\uB85C\uD558\uAE30', key: 'new-game', disabled: false },
  { label: '\uC774\uC5B4\uD558\uAE30', key: 'continue', disabled: true },
  { label: '\uC124\uC815', key: 'settings', disabled: false },
]

const battleMenuItems = [
  { label: '\uACF5\uACA9', key: 'attack', active: true },
  { label: '\uC544\uC774\uD15C', key: 'item', active: false },
  { label: '\uAD50\uCCB4', key: 'swap', active: false },
  { label: '\uB3C4\uB9DD', key: 'run', active: false },
]

const bgmTracks = [
  { title: 'Brave Heart', url: '/BGM/Brave Heart.mp4' },
  { title: 'Butter-Fly', url: '/BGM/Butter-Fly.mp4' },
  { title: "I've got the power", url: "/BGM/I've got the power.mp4" },
  { title: 'Power Up', url: '/BGM/Power Up.mp4' },
  { title: 'Stay For You', url: '/BGM/Stay For You.mp4' },
  { title: 'To My Wish', url: '/BGM/To My Wish.mp4' },
  { title: '날지켜줘', url: '/BGM/날지켜줘.mp4' },
  { title: '내일을 찾아', url: '/BGM/내일을 찾아.mp4' },
  { title: '더 프론티어', url: '/BGM/더 프론티어.mp4' },
  { title: '새로운 진화', url: '/BGM/새로운 진화.mp4' },
  { title: '안녕! 디지몬', url: '/BGM/안녕! 디지몬.mp4' },
  { title: '에볼루션', url: '/BGM/에볼루션.mp4' },
  { title: '외롭지 않아', url: '/BGM/외롭지 않아.mp4' },
  { title: '질주', url: '/BGM/질주.mp4' },
  { title: '찾아라 비밀의 열쇠', url: '/BGM/찾아라 비밀의 열쇠.mp4' },
]
const BGM_VOLUME = 0.28
const BGM_FADE_IN_MS = 1800
const BGM_FADE_OUT_MS = 2400
const BGM_FADE_OUT_SECONDS = 3
const BUTTON_CLICK_SFX_URL = '/SFX/click.mp3'
const BUTTON_CLICK_SFX_VOLUME = 0.62
const BUTTON_CLICK_SFX_POOL_SIZE = 4
const BATTLE_ATTACK_SFX_VOLUME = 0.22
const SETTINGS_STORAGE_KEY = 'digirogue-settings-v1'
const SPEED_OPTIONS = [1, 1.5, 2]
const EVOLUTION_SPEED_OPTIONS = [1, 1.5, 2, 'skip']
const VOLUME_OPTIONS = [0, 20, 40, 60, 80, 100]
const BATTLE_LOG_STEP_MS = 820
const BATTLE_LOG_FINAL_DELAY_MS = 520
const SAVE_STORAGE_KEY = 'digirogue-save-v1'
const SAVE_DATA_VERSION = 1
const EVOLUTION_SCENE_SWITCH_MS = 4000
const EVOLUTION_SCENE_TOTAL_MS = 8000
const MAX_COMBATANT_SKILL_COUNT = 8
const DIGIMON_SIZE_MIN = 1
const DIGIMON_SIZE_MAX = 5

const canUseLocalStorage = () => {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

const createDefaultSettings = () => ({
  gameSpeed: 1,
  expBarSpeed: 1,
  evolutionSpeed: 1,
  masterVolume: 100,
  bgmVolume: 80,
  sfxVolume: 80,
  enabledBgmUrls: bgmTracks.map((track) => track.url),
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
  const enabledBgmUrls = Array.isArray(settings?.enabledBgmUrls)
    ? settings.enabledBgmUrls.filter((url) => bgmTracks.some((track) => track.url === url))
    : defaults.enabledBgmUrls

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
    enabledBgmUrls,
  }
}

const loadSettingsFromStorage = () => {
  if (!canUseLocalStorage()) {
    return createDefaultSettings()
  }

  try {
    const storedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    return storedSettings ? sanitizeSettings(JSON.parse(storedSettings)) : createDefaultSettings()
  } catch {
    return createDefaultSettings()
  }
}

const saveSettingsToStorage = (settings) => {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)))
  } catch {
    // 설정 저장 실패는 게임 진행을 막지 않는다.
  }
}

const getVolumeRatio = (value) => Math.max(0, Math.min(1, Number(value) / 100))

const getEffectiveBgmVolume = (settings) =>
  BGM_VOLUME * getVolumeRatio(settings.masterVolume) * getVolumeRatio(settings.bgmVolume)

const getEffectiveSfxVolume = (settings) =>
  getVolumeRatio(settings.masterVolume) * getVolumeRatio(settings.sfxVolume)

const getEnabledBgmTracks = (settings) => {
  const enabledUrlSet = new Set(settings.enabledBgmUrls ?? [])
  return bgmTracks.filter((track) => enabledUrlSet.has(track.url))
}

const getScaledDuration = (duration, speed) => {
  const numericSpeed = Number(speed)
  const safeSpeed = Number.isFinite(numericSpeed) && numericSpeed > 0 ? numericSpeed : 1
  return Math.max(0, Math.round(duration / safeSpeed))
}

const sanitizeGameStateForSave = (gameState) => {
  if (!gameState || typeof gameState !== 'object') {
    return null
  }

  const stageStartState = {
    ...gameState,
    actedAllyIds: [],
    pendingAllyActions: [],
  }

  try {
    return JSON.parse(JSON.stringify(stageStartState))
  } catch {
    return null
  }
}

const parseSavedGameState = (rawSaveData) => {
  try {
    const parsedSaveData = JSON.parse(rawSaveData)
    const savedGameState =
      parsedSaveData?.version === SAVE_DATA_VERSION
        ? parsedSaveData.gameState
        : parsedSaveData?.gameState ?? null

    if (
      !savedGameState ||
      typeof savedGameState !== 'object' ||
      !savedGameState.player ||
      !Array.isArray(savedGameState.party) ||
      !Number.isFinite(Number(savedGameState.currentStage))
    ) {
      return null
    }

    return {
      ...savedGameState,
      currentStage: Math.max(1, Math.floor(Number(savedGameState.currentStage))),
      actedAllyIds: [],
      pendingAllyActions: [],
    }
  } catch {
    return null
  }
}

const saveGameStateToStorage = (gameState) => {
  if (!canUseLocalStorage()) {
    return false
  }

  const sanitizedGameState = sanitizeGameStateForSave(gameState)

  if (!sanitizedGameState) {
    return false
  }

  try {
    window.localStorage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({
        version: SAVE_DATA_VERSION,
        savedAt: new Date().toISOString(),
        gameState: sanitizedGameState,
      })
    )

    return true
  } catch {
    return false
  }
}

const loadSavedGameStateFromStorage = () => {
  if (!canUseLocalStorage()) {
    return null
  }

  try {
    return parseSavedGameState(window.localStorage.getItem(SAVE_STORAGE_KEY))
  } catch {
    return null
  }
}

const hasSavedGameState = () => Boolean(loadSavedGameStateFromStorage())

const clearSavedGameStateFromStorage = () => {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(SAVE_STORAGE_KEY)
  } catch {
    // Ignore storage failures. The game can continue without persistence.
  }
}

const IV_DETECTOR_ITEM_ID = 'iv-detector'
const IV_DETECTOR_MAX = 3
const IV_DETECTOR_REVEALED_STATS_PER_ITEM = 2
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
const MIRACLE_RUBY_HEAL_DIVISOR = 16
const DEATH_BONE_MAX = 3
const DEATH_BONE_FLINCH_RATE = 10
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
  description: `${attribute} 속성 기술 위력 10% 증가`,
  attributeUpKey: attribute,
  maxOwnedPerCombatant: ATTRIBUTE_POWER_UP_MAX,
  imageUrl: `/아이템/속성업/${imageName}.png`,
}))
const DIGICLONE_REWARD_ITEMS = [
  {
    id: 'digiclone-a',
    name: '디지클론(A)',
    description: '대상 디지몬의 스피드 10% 증가',
    digicloneKey: 'speed',
    imageUrl: '/아이템/디지클론/디지클론(A).png',
  },
  {
    id: 'digiclone-b',
    name: '디지클론(B)',
    description: '대상 디지몬의 방어 10% 증가',
    digicloneKey: 'defense',
    imageUrl: '/아이템/디지클론/디지클론(B).png',
  },
  {
    id: 'digiclone-c',
    name: '디지클론(C)',
    description: '대상 디지몬의 공격 10% 증가',
    digicloneKey: 'attack',
    imageUrl: '/아이템/디지클론/디지클론(C).png',
  },
  {
    id: 'digiclone-d',
    name: '디지클론(D)',
    description: '대상 디지몬의 특방 10% 증가',
    digicloneKey: 'specialDefense',
    imageUrl: '/아이템/디지클론/디지클론(D).png',
  },
  {
    id: 'digiclone-e',
    name: '디지클론(E)',
    description: '대상 디지몬의 특공 10% 증가',
    digicloneKey: 'specialAttack',
    imageUrl: '/아이템/디지클론/디지클론(E).png',
  },
  {
    id: 'digiclone-s',
    name: '디지클론(S)',
    description: '대상 디지몬의 체력 10% 증가',
    digicloneKey: 'hp',
    imageUrl: '/아이템/디지클론/디지클론(S).png',
  },
]

const DIGI_EGG_REWARD_ITEMS = digiEggData.map((egg, index) => ({
  id: `digi-egg-${index + 1}`,
  name: `${egg.이름} 디지에그`,
  description: `${egg.부화가능.join(', ')} 중 한 디지몬이 3스테이지 뒤 부화`,
  digiEggName: egg.이름,
  hatchPool: egg.부화가능,
  imageUrl: `/아이템/디지에그/${egg.이름}.png`,
}))

const RECOVERY_PROGRAM_REWARD_ITEMS = [
  {
    id: 'recovery-program-m',
    name: '복구프로그램M',
    description: '전투 중 전투 불능 시 HP 50%로 즉시 부활',
    recoveryProgramKey: 'recovery-program-m',
    recoveryRatio: 0.5,
    maxOwnedPerCombatant: RECOVERY_PROGRAM_MAX,
    imageUrl: '/아이템/회복/복구프로그램M.png',
  },
  {
    id: 'recovery-program-d',
    name: '복구프로그램D',
    description: '전투 중 전투 불능 시 HP 100%로 즉시 부활',
    recoveryProgramKey: 'recovery-program-d',
    recoveryRatio: 1,
    maxOwnedPerCombatant: RECOVERY_PROGRAM_MAX,
    imageUrl: '/아이템/회복/복구프로그램D.png',
  },
]

const BATTLE_ITEM_REWARD_ITEMS = [
  {
    id: ACCURACY_TARGET_ITEM_ID,
    name: '명중과녁',
    description: '사용 기술의 명중률 5% 증가',
    battleItemKey: ACCURACY_TARGET_ITEM_ID,
    maxOwnedPerCombatant: BATTLE_ACCURACY_ITEM_MAX,
    imageUrl: '/아이템/배틀/명중과녁.png',
  },
  {
    id: CONFUSION_WAVE_ITEM_ID,
    name: '혼란전파',
    description: '상대 기술의 명중률 5% 감소',
    battleItemKey: CONFUSION_WAVE_ITEM_ID,
    maxOwnedPerCombatant: BATTLE_ACCURACY_ITEM_MAX,
    imageUrl: '/아이템/배틀/혼란전파.png',
  },
  {
    id: LIFE_FORCE_ITEM_ID,
    name: '생명의 힘',
    description: 'HP가 0이 될 피해를 받을 때 개당 10% 확률로 HP 1로 버틴다',
    battleItemKey: LIFE_FORCE_ITEM_ID,
    maxOwnedPerCombatant: LIFE_FORCE_MAX,
    imageUrl: '/아이템/배틀/생명의힘.png',
  },
  {
    id: MIRACLE_RUBY_ITEM_ID,
    name: '기적의루비',
    description: '매턴마다 최대 HP의 1/16만큼 회복',
    battleItemKey: MIRACLE_RUBY_ITEM_ID,
    maxOwnedPerCombatant: MIRACLE_RUBY_MAX,
    imageUrl: '/아이템/배틀/기적의루비.png',
  },
  {
    id: DEATH_BONE_ITEM_ID,
    name: '죽음을부르는뼈',
    description: '공격마다 적이 이번 턴 풀죽을 확률 10% 증가',
    battleItemKey: DEATH_BONE_ITEM_ID,
    maxOwnedPerCombatant: DEATH_BONE_MAX,
    imageUrl: '/아이템/배틀/죽음을부르는뼈.png',
  },
  {
    id: HASTE_ITEM_ID,
    name: '헤이스트',
    description: '공격이 개당 10% 확률로 선제공격',
    battleItemKey: HASTE_ITEM_ID,
    maxOwnedPerCombatant: HASTE_MAX,
    imageUrl: '/아이템/배틀/헤이스트.png',
  },
]

const fixedRewardItems = [
  {
    id: 'heal-20',
    name: '회복플로피L',
    description: 'HP 20 회복',
    price: 120,
    healAmount: 20,
    imageUrl: '/아이템/회복/회복플로피L.png',
  },
  {
    id: 'heal-50',
    name: '회복플로피M',
    description: 'HP 50 회복',
    price: 280,
    healAmount: 50,
    imageUrl: '/아이템/회복/회복플로피M.png',
  },
  {
    id: 'revive-50',
    name: '부활칩(50%)',
    description: '전투 불능 디지몬을 HP 50%로 부활',
    price: 500,
    reviveRatio: 0.5,
    imageUrl: '/아이템/회복/부활칩(50%25).png',
  },
  {
    id: 'revive-100',
    name: '부활칩(100%)',
    description: '전투 불능 디지몬을 HP 100%로 부활',
    price: 900,
    reviveRatio: 1,
    imageUrl: '/아이템/회복/부활칩(100%25).png',
  },
]

const REWARD_RARITY_WEIGHTS = [
  { key: 'common', weight: 75 },
  { key: 'good', weight: 18 },
  { key: 'rare', weight: 4 },
  { key: 'rogue', weight: 2.9 },
  { key: 'master', weight: 0.1 },
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
const ROGUE_DIGI_EGG_NAMES = new Set(['모르포몬', '옷코몬'])
const COMMON_REWARD_ITEM_IDS = new Set(['capture-net', 'heal-20', 'heal-50', LEVEL_UP_ITEM_ID])
const GOOD_REWARD_ITEM_IDS = new Set([
  'capture-net-super',
  'heal-200',
  'party-heal-50',
  'revive-50',
  EXP_BOOSTER_ITEM_ID,
  PARTY_LEVEL_UP_ITEM_ID,
  MAP_ITEM_ID,
])
const RARE_REWARD_ITEM_IDS = new Set([
  'capture-net-hyper',
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
  IV_DETECTOR_ITEM_ID,
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
const MASTER_REWARD_ITEM_IDS = new Set(['capture-net-master'])
const JOGRESS_RECIPES = [
  { targetName: '파일드라몬', materials: ['엑스브이몬', '스팅몬'] },
  { targetName: '오메가몬', materials: ['워그레이몬', '메탈가루몬'] },
  { targetName: '오메가몬[알터-S]', materials: ['블리츠그레이몬', '크레스가루몬'] },
  { targetName: '오메가몬[즈왈트]', materials: ['블랙워그레이몬', '블랙메탈가루몬'] },
  { targetName: '라이덴몬', materials: ['뇌신몬', '수신몬', '풍신몬'] },
  { targetName: '라플레시몬', materials: ['로제몬', '로터스몬'] },
  { targetName: '알파몬[왕룡검]', materials: ['알파몬', '오류우몬'] },
]
const JOGRESS_CHIP_REWARD_ITEM = {
  id: JOGRESS_CHIP_ITEM_ID,
  name: '조그레스 칩',
  description: '특정 디지몬 2마리를 선택해 1마리로 조그레스 진화',
  rarity: 'rare',
  jogressRecipes: JOGRESS_RECIPES,
  imageUrl: '/아이템/진화/조그레스 칩.png',
}
const ITEM_EVOLUTION_REQUIREMENTS = {
  '레이브몬[버스트]': { itemName: '한지호의 디지바이스', rarity: 'rare' },
  '로제몬[버스트]': { itemName: '유진의 디지바이스', rarity: 'rare' },
  '루체몬[사탄]': { itemName: '게헤나', rarity: 'rare' },
  '미라쥬가오가몬[버스트]': { itemName: '토마의 디지바이스', rarity: 'rare' },
  '베르제브몬[블라스트]': { itemName: '장난감총', rarity: 'rare' },
  '벨페몬[레이지]': { itemName: '자명종', rarity: 'rare' },
  '샤인그레이몬[버스트]': { itemName: '최건우의 디지바이스', rarity: 'rare' },
  '오파니몬[풀다운]': { itemName: '악의 근원', rarity: 'rare' },
  카오스드라몬: { itemName: '레드디지조이드', rarity: 'rare' },
  '황제드라몬[파이터]': { itemName: '포지트론 레이저', rarity: 'rare' },
  '황제드라몬[팔라딘]': { itemName: '오메가 블레이드', rarity: 'rogue' },
  '가이오몬[엄도의형]': { itemName: '천인엄도', rarity: 'rare' },
  기가시드라몬: { itemName: '기가스케일', rarity: 'rare' },
  '오메가몬[즈왈트-D]': { itemName: '블랙디지트론', rarity: 'rare' },
}
const ITEM_EVOLUTION_REWARD_ITEMS = Object.entries(ITEM_EVOLUTION_REQUIREMENTS).map(
  ([targetName, requirement]) => ({
    id: `item-evolution-${requirement.itemName}`,
    name: requirement.itemName,
    description: `${targetName} 아이템 진화에 사용`,
    evolutionItemFor: targetName,
    rarity: requirement.rarity,
    imageUrl: `/아이템/진화/${requirement.itemName}.png`,
  })
)
const itemEvolutionRewardItemByTarget = new Map(
  ITEM_EVOLUTION_REWARD_ITEMS.map((item) => [item.evolutionItemFor, item])
)

const randomRewardItemPool = [
  {
    id: 'buff-attack',
    name: '공격력 증가',
    description: '10턴 동안 공격 10% 증가',
    buffStatKey: 'attack',
    imageUrl: '/아이템/스탯업/힘.png',
  },
  {
    id: 'buff-defense',
    name: '방어력 증가',
    description: '10턴 동안 방어 10% 증가',
    buffStatKey: 'defense',
    imageUrl: '/아이템/스탯업/방어.png',
  },
  {
    id: 'buff-special-attack',
    name: '특수공격 증가',
    description: '10턴 동안 특수공격 10% 증가',
    buffStatKey: 'specialAttack',
    imageUrl: '/아이템/스탯업/특공.png',
  },
  {
    id: 'buff-special-defense',
    name: '특수방어 증가',
    description: '10턴 동안 특수방어 10% 증가',
    buffStatKey: 'specialDefense',
    imageUrl: '/아이템/스탯업/특방.png',
  },
  {
    id: 'buff-speed',
    name: '스피드 증가',
    description: '10턴 동안 스피드 10% 증가',
    buffStatKey: 'speed',
    imageUrl: '/아이템/스탯업/스피드.png',
  },
  {
    id: 'buff-hp',
    name: '체력 증가',
    description: '10턴 동안 체력 10% 증가',
    buffStatKey: 'hp',
    imageUrl: '/아이템/스탯업/체력.png',
  },
  ...fixedRewardItems,
  {
    id: 'heal-200',
    name: '회복플로피S',
    description: 'HP 200 회복',
    healAmount: 200,
    imageUrl: '/아이템/회복/회복플로피S.png',
  },
  {
    id: 'heal-full-hp',
    name: '회복플로피D',
    description: '상태이상은 유지하고 HP만 모두 회복',
    healFull: true,
    imageUrl: '/아이템/회복/회복플로피D.png',
  },
  {
    id: 'heal-full-cure',
    name: '회복플로피R',
    description: 'HP를 모두 회복하고 상태이상도 치료',
    healFull: true,
    cureStatus: true,
    imageUrl: '/아이템/회복/회복플로피R.png',
  },
  {
    id: 'party-heal-50',
    name: '회복플로피MX',
    description: '파티 전체 HP 50 회복',
    partyHealAmount: 50,
    imageUrl: '/아이템/회복/회복플로피MX.png',
  },
  {
    id: 'party-heal-200',
    name: '회복플로피SX',
    description: '파티 전체 HP 200 회복',
    partyHealAmount: 200,
    imageUrl: '/아이템/회복/회복플로피SX.png',
  },
  {
    id: 'party-heal-full-cure',
    name: '회복플로피DX',
    description: '파티 전체 HP를 모두 회복하고 상태이상도 치료',
    partyHealFull: true,
    cureStatus: true,
    imageUrl: '/아이템/회복/회복플로피DX.png',
  },
  ...RECOVERY_PROGRAM_REWARD_ITEMS,
  {
    id: 'capture-net',
    name: '포획그물',
    description: '야생 디지몬을 포획할 수 있는 기본 그물',
    captureTier: 'normal',
    imageUrl: '/아이템/포획/포획그물.png',
  },
  {
    id: 'capture-net-super',
    name: '포획그물(슈퍼)',
    description: '야생 디지몬 포획 확률이 더 높은 그물',
    captureTier: 'super',
    imageUrl: '/아이템/포획/포획그물(슈퍼).png',
  },
  {
    id: 'capture-net-hyper',
    name: '포획그물(하이퍼)',
    description: '야생 디지몬 포획 확률이 크게 높은 그물',
    captureTier: 'hyper',
    imageUrl: '/아이템/포획/포획그물(하이퍼).png',
  },
  {
    id: 'capture-net-master',
    name: '포획그물(마스터)',
    description: '야생 디지몬 포획에 특화된 최고 등급 그물',
    captureTier: 'master',
    imageUrl: '/아이템/포획/포획그물(마스터).png',
  },
  {
    id: IV_DETECTOR_ITEM_ID,
    name: '개체값탐지기',
    description: '적 디지몬의 개체값 정보를 일부 확인할 수 있다',
    maxOwned: IV_DETECTOR_MAX,
    imageUrl: '/아이템/탐지기/개체값탐지기.png',
  },
  {
    id: MAP_ITEM_ID,
    name: '지도',
    description: '10스테이지마다 다음 이동 맵을 직접 선택할 수 있다',
    unique: true,
    imageUrl: '/아이템/지도/지도.png',
  },
  {
    id: GLOBE_ITEM_ID,
    name: '지구본',
    description: '현재 맵에 등장하는 디지몬 목록을 확인할 수 있다',
    unique: true,
    requiresItemId: MAP_ITEM_ID,
    imageUrl: '/아이템/지도/지구본.png',
  },
  {
    id: GOLDEN_BANANA_ITEM_ID,
    name: '황금 바나나',
    description: '매 스테이지마다 획득하는 골드 20% 증가',
    maxOwned: GOLDEN_BANANA_MAX,
    imageUrl: '/아이템/골드/황금바나나.png',
  },
  ...BATTLE_ITEM_REWARD_ITEMS,
  {
    id: EXP_SHARE_ITEM_ID,
    name: 'exp공유기',
    description: '전투에 참여하지 않은 디지몬도 획득 경험치의 20%를 받는다',
    maxOwned: 5,
    imageUrl: '/아이템/경험치/exp공유기.png',
  },
  {
    id: EXP_BOOSTER_ITEM_ID,
    name: '경험치부스터',
    description: '획득 경험치 10% 증가',
    maxOwned: 5,
    imageUrl: '/아이템/경험치/경험치부스터.png',
  },
  {
    id: EXP_BOOSTER_PLUS_ITEM_ID,
    name: '경험치부스터+',
    description: '획득 경험치 25% 증가',
    maxOwned: 2,
    imageUrl: '/아이템/경험치/경험치부스터+.png',
  },
  {
    id: LEVEL_UP_ITEM_ID,
    name: '에보류터',
    description: '선택한 디지몬의 레벨 1 증가, 경험치 0으로 초기화',
    levelUpAmount: 1,
    ignoreLevelCap: true,
    imageUrl: '/아이템/레벨업/에보류터.png',
  },
  {
    id: PARTY_LEVEL_UP_ITEM_ID,
    name: '에보류터(골드)',
    description: '보유한 모든 디지몬의 레벨 1 증가, 경험치 0으로 초기화',
    partyLevelUpAmount: 1,
    ignoreLevelCap: true,
    imageUrl: '/아이템/레벨업/에보류터(골드).png',
  },
  {
    id: EVOLUTER_UP_ITEM_ID,
    name: '에보류터UP',
    description: '에보류터 계열 아이템의 레벨 상승량 +1',
    maxOwned: EVOLUTER_UP_MAX,
    imageUrl: '/아이템/레벨업/에보류터UP.png',
  },
  {
    id: EVOLUTION_RETURN_ITEM_ID,
    name: '진화리턴',
    description: '대상 디지몬을 이전 진화 단계로 되돌린다',
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
    description: `${type} 타입 디지몬의 기술 위력 10% 증가`,
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
const captureItemOrder = ['capture-net', 'capture-net-super', 'capture-net-hyper', 'capture-net-master']
const captureItemLookup = new Map(randomRewardItemPool.map((item) => [item.id, item]))
const captureChanceByTier = {
  normal: 10,
  super: 30,
  hyper: 50,
  master: 100,
}
const growthStageDigimonUrls = [
  '/도감/성장기/가오몬.png',
  '/도감/성장기/가지몬.png',
  '/도감/성장기/감마몬.png',
  '/도감/성장기/고부리몬.png',
  '/도감/성장기/길몬.png',
  '/도감/성장기/도루몬.png',
  '/도감/성장기/드라코몬.png',
  '/도감/성장기/드라큐몬.png',
  '/도감/성장기/라라몬.png',
  '/도감/성장기/레나몬.png',
  '/도감/성장기/로프몬.png',
  '/도감/성장기/루체몬.png',
  '/도감/성장기/류우다몬.png',
  '/도감/성장기/모노드라몬.png',
  '/도감/성장기/모르포몬.png',
  '/도감/성장기/베타몬.png',
  '/도감/성장기/보보몬.png',
  '/도감/성장기/브이몬.png',
  '/도감/성장기/블루코몬.png',
  '/도감/성장기/사이케몬.png',
  '/도감/성장기/샤코몬.png',
  '/도감/성장기/쉬라몬.png',
  '/도감/성장기/스윔몬.png',
  '/도감/성장기/아구몬(흑).png',
  '/도감/성장기/아구몬.png',
  '/도감/성장기/아기벌몬.png',
  '/도감/성장기/아르마몬.png',
  '/도감/성장기/에렉몬.png',
  '/도감/성장기/에리스몬.png',
  '/도감/성장기/올챙몬.png',
  '/도감/성장기/옷코몬.png',
  '/도감/성장기/울퉁몬.png',
  '/도감/성장기/임프몬.png',
  '/도감/성장기/추추몬.png',
  '/도감/성장기/츄카이몬.png',
  '/도감/성장기/카메몬.png',
  '/도감/성장기/캔들몬.png',
  '/도감/성장기/케라몬.png',
  '/도감/성장기/코만드라몬.png',
  '/도감/성장기/코테몬.png',
  '/도감/성장기/코스파이더몬.png',
  '/도감/성장기/쿠네몬.png',
  '/도감/성장기/쿠다몬.png',
  '/도감/성장기/크랩몬.png',
  '/도감/성장기/테리어몬.png',
  '/도감/성장기/텐타몬.png',
  '/도감/성장기/토이아구몬.png',
  '/도감/성장기/톱니몬.png',
  '/도감/성장기/팅커몬.png',
  '/도감/성장기/파닥몬.png',
  '/도감/성장기/파피몬(흑).png',
  '/도감/성장기/파피몬.png',
  '/도감/성장기/팔몬.png',
  '/도감/성장기/팔코몬.png',
  '/도감/성장기/펭귄몬.png',
  '/도감/성장기/폼몬.png',
  '/도감/성장기/플로라몬.png',
  '/도감/성장기/플롯트몬.png',
  '/도감/성장기/피요몬.png',
  '/도감/성장기/피코데블몬.png',
  '/도감/성장기/헉몬.png',
  '/도감/성장기/호크몬.png',
  '/도감/성장기/효코몬.png',
]

const growthStageDigimon = growthStageDigimonUrls.map((url) => {
  const fileName = url.split('/').pop() ?? ''
  const data = growthStageData.find((digimon) => digimon.이름 === fileName.replace('.png', ''))
  return {
    url,
    name: fileName.replace('.png', ''),
    data,
    stage: '성장기',
  }
})

const digimonStageDataMap = {
  유아기: babyStageData,
  유년기: childStageData,
  성장기: growthStageData,
  성숙기: matureStageData,
  완전체: perfectStageData,
  궁극체: ultimateStageData,
  초궁극체: superUltimateStageData,
}

const createDigimonImageUrl = (stage, name) =>
  `/${encodeURIComponent('도감')}/${encodeURIComponent(stage)}/${encodeURIComponent(name)}.png`

const createDigimonArtworkUrl = (stage, name) => (stage && name ? `/이미지/${stage}/${name}.jpg` : '')

const normalizeDigimonSize = (size) => {
  const nextSize = Math.round(Number(size))

  if (!Number.isFinite(nextSize)) {
    return 3
  }

  return Math.max(DIGIMON_SIZE_MIN, Math.min(DIGIMON_SIZE_MAX, nextSize))
}

const hideBrokenArtwork = (event) => {
  const currentTarget = event.currentTarget
  const fallbackSrc = currentTarget.dataset.fallbackSrc

  if (fallbackSrc && currentTarget.dataset.fallbackApplied !== 'true') {
    currentTarget.dataset.fallbackApplied = 'true'
    currentTarget.src = fallbackSrc
    return
  }

  currentTarget.style.visibility = 'hidden'
}

const allDigimonLookup = Object.entries(digimonStageDataMap).reduce((result, [stage, items]) => {
  items.forEach((digimon) => {
    const imageName = digimon.이미지명 ?? digimon.이름

    result.set(digimon.이름, {
      ...digimon,
      stage,
      imageName,
      imageUrl: createDigimonImageUrl(stage, imageName),
    })
  })
  return result
}, new Map())

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
    result.set(skill.기술명, skill)
  }

  return result
}, new Map())

const getAttachmentSkillNamesForLevel = (data, level) =>
  [...(data?.어티치먼트 ?? [])]
    .filter((entry) => entry?.기술 && Number(entry.레벨 ?? 0) <= level)
    .sort((first, second) => Number(first.레벨 ?? 0) - Number(second.레벨 ?? 0))
    .map((entry) => entry.기술)

const getAllDigimonSkillNamesForLevel = (data, level) => {
  const skillNames = [...(data?.기술 ?? []), ...getAttachmentSkillNamesForLevel(data, level)]

  return [...new Set(skillNames)]
}

const getDigimonSkillNamesForLevel = (data, level) =>
  getAllDigimonSkillNamesForLevel(data, level).slice(-MAX_COMBATANT_SKILL_COUNT)

const mergeCombatantSkillNamesForLevel = (combatant, level) => {
  if (!combatant?.speciesData) {
    return combatant?.skills ?? []
  }

  const learnableSkills = getAllDigimonSkillNamesForLevel(combatant.speciesData, level)
  const learnableSkillSet = new Set(learnableSkills)
  const currentSkills = (combatant.skills?.length
    ? combatant.skills
    : getDigimonSkillNamesForLevel(combatant.speciesData, level)
  ).filter((skillName) => learnableSkillSet.has(skillName))
  const nextSkills = [...new Set(currentSkills)]

  learnableSkills.forEach((skillName) => {
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

  return getAllDigimonSkillNamesForLevel(combatant.speciesData, level).filter(
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
    getAllDigimonSkillNamesForLevel(combatant.speciesData, level)
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

const typeAdvantageMap = {
  데이터: ['백신'],
  백신: ['바이러스'],
  바이러스: ['데이터'],
  프리: ['불명'],
  불명: ['프리'],
}

const attributeAdvantageMap = {
  불: ['나무', '흙'],
  나무: ['흙', '번개'],
  흙: ['번개', '강철'],
  번개: ['강철', '얼음'],
  강철: ['얼음', '바람'],
  얼음: ['바람', '어둠'],
  바람: ['어둠', '빛'],
  어둠: ['빛', '물'],
  빛: ['물', '불'],
  물: ['불', '나무'],
}

const DIGIMON_TYPE_ICON_NAMES = new Set(['데이터', '무', '바이러스', '백신', '불명', '프리'])
const ATTRIBUTE_ICON_FILE_MAP = {
  화염: '불',
  번개: '전기',
  흙: '땅',
}
const SKILL_TOOLTIP_THEME_MAP = {
  화염: {
    border: 'rgba(191, 88, 52, 0.96)',
    cardStart: 'rgba(214, 135, 104, 0.98)',
    cardEnd: 'rgba(128, 69, 52, 0.98)',
    headerBg: 'rgba(255, 224, 208, 0.94)',
    sectionBg: 'rgba(150, 71, 37, 0.96)',
    lightSurface: 'rgba(255, 244, 238, 0.98)',
    midSurface: 'rgba(237, 194, 175, 0.96)',
    darkText: '#3e1f13',
    lightText: '#fff8f3',
  },
  빛: {
    border: 'rgba(212, 181, 86, 0.96)',
    cardStart: 'rgba(233, 214, 149, 0.98)',
    cardEnd: 'rgba(157, 131, 63, 0.98)',
    headerBg: 'rgba(255, 248, 219, 0.94)',
    sectionBg: 'rgba(145, 120, 40, 0.96)',
    lightSurface: 'rgba(255, 252, 240, 0.98)',
    midSurface: 'rgba(239, 228, 178, 0.96)',
    darkText: '#433711',
    lightText: '#fffdf4',
  },
  바람: {
    border: 'rgba(92, 176, 157, 0.96)',
    cardStart: 'rgba(145, 208, 193, 0.98)',
    cardEnd: 'rgba(75, 126, 117, 0.98)',
    headerBg: 'rgba(222, 246, 241, 0.94)',
    sectionBg: 'rgba(57, 123, 111, 0.96)',
    lightSurface: 'rgba(242, 252, 250, 0.98)',
    midSurface: 'rgba(194, 232, 224, 0.96)',
    darkText: '#18362f',
    lightText: '#f5fffc',
  },
  얼음: {
    border: 'rgba(100, 171, 206, 0.96)',
    cardStart: 'rgba(152, 207, 232, 0.98)',
    cardEnd: 'rgba(77, 116, 141, 0.98)',
    headerBg: 'rgba(226, 245, 252, 0.94)',
    sectionBg: 'rgba(57, 109, 137, 0.96)',
    lightSurface: 'rgba(243, 251, 255, 0.98)',
    midSurface: 'rgba(195, 225, 238, 0.96)',
    darkText: '#163142',
    lightText: '#f5fcff',
  },
  번개: {
    border: 'rgba(211, 186, 74, 0.96)',
    cardStart: 'rgba(235, 221, 131, 0.98)',
    cardEnd: 'rgba(151, 132, 48, 0.98)',
    headerBg: 'rgba(255, 249, 210, 0.94)',
    sectionBg: 'rgba(146, 123, 26, 0.96)',
    lightSurface: 'rgba(255, 253, 236, 0.98)',
    midSurface: 'rgba(241, 231, 173, 0.96)',
    darkText: '#463910',
    lightText: '#fffdf4',
  },
  어둠: {
    border: 'rgba(98, 87, 127, 0.96)',
    cardStart: 'rgba(132, 122, 167, 0.98)',
    cardEnd: 'rgba(63, 58, 89, 0.98)',
    headerBg: 'rgba(220, 214, 235, 0.94)',
    sectionBg: 'rgba(69, 61, 100, 0.96)',
    lightSurface: 'rgba(243, 241, 249, 0.98)',
    midSurface: 'rgba(198, 191, 221, 0.96)',
    darkText: '#241d35',
    lightText: '#f7f5ff',
  },
  흙: {
    border: 'rgba(156, 120, 77, 0.96)',
    cardStart: 'rgba(193, 155, 110, 0.98)',
    cardEnd: 'rgba(106, 80, 52, 0.98)',
    headerBg: 'rgba(240, 224, 203, 0.94)',
    sectionBg: 'rgba(119, 83, 46, 0.96)',
    lightSurface: 'rgba(250, 244, 236, 0.98)',
    midSurface: 'rgba(225, 204, 177, 0.96)',
    darkText: '#372513',
    lightText: '#fff9f2',
  },
  물: {
    border: 'rgba(76, 129, 199, 0.96)',
    cardStart: 'rgba(121, 171, 225, 0.98)',
    cardEnd: 'rgba(55, 89, 140, 0.98)',
    headerBg: 'rgba(219, 236, 255, 0.94)',
    sectionBg: 'rgba(41, 82, 143, 0.96)',
    lightSurface: 'rgba(241, 248, 255, 0.98)',
    midSurface: 'rgba(187, 212, 241, 0.96)',
    darkText: '#152947',
    lightText: '#f4f9ff',
  },
  나무: {
    border: 'rgba(87, 153, 88, 0.96)',
    cardStart: 'rgba(139, 193, 130, 0.98)',
    cardEnd: 'rgba(68, 111, 66, 0.98)',
    headerBg: 'rgba(225, 243, 221, 0.94)',
    sectionBg: 'rgba(56, 107, 50, 0.96)',
    lightSurface: 'rgba(243, 250, 241, 0.98)',
    midSurface: 'rgba(196, 224, 188, 0.96)',
    darkText: '#173116',
    lightText: '#f5fff4',
  },
  강철: {
    border: 'rgba(125, 142, 168, 0.96)',
    cardStart: 'rgba(173, 187, 210, 0.98)',
    cardEnd: 'rgba(94, 104, 125, 0.98)',
    headerBg: 'rgba(232, 238, 246, 0.94)',
    sectionBg: 'rgba(79, 92, 115, 0.96)',
    lightSurface: 'rgba(246, 249, 252, 0.98)',
    midSurface: 'rgba(208, 216, 228, 0.96)',
    darkText: '#1f2938',
    lightText: '#f8fbff',
  },
  무: {
    border: 'rgba(118, 98, 164, 0.95)',
    cardStart: 'rgba(166, 150, 201, 0.98)',
    cardEnd: 'rgba(126, 102, 167, 0.98)',
    headerBg: 'rgba(210, 197, 231, 0.86)',
    sectionBg: 'rgba(85, 59, 130, 0.94)',
    lightSurface: 'rgba(246, 243, 250, 0.96)',
    midSurface: 'rgba(196, 181, 224, 0.96)',
    darkText: '#241636',
    lightText: '#f7f2ff',
  },
}

const createPublicAssetUrl = (...segments) =>
  `/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`

const IDLE_ANIMATION_SPRITE_META_BY_STAGE = {
  "유아기": {
    "깜몬": { fileName: "깜몬", frameWidth: 862, frameHeight: 703 },
    "도도몬": { fileName: "도도몬", frameWidth: 862, frameHeight: 653 },
    "레레몬": { fileName: "레레몬", frameWidth: 862, frameHeight: 514 },
    "모크몬": { fileName: "모크몬", frameWidth: 630, frameHeight: 832 },
    "붐몬": { fileName: "붐몬", frameWidth: 823, frameHeight: 818 },
    "뽀글몬": { fileName: "뽀글몬", frameWidth: 758, frameHeight: 832 },
    "뽈뽈몬": { fileName: "뽈뽈몬", frameWidth: 858, frameHeight: 660 },
    "쁘띠몬": { fileName: "쁘띠몬", frameWidth: 860, frameHeight: 662 },
    "새싹몬": { fileName: "새싹몬", frameWidth: 798, frameHeight: 833 },
    "얍실몬": { fileName: "얍실몬", frameWidth: 858, frameHeight: 375 },
    "유라몬": { fileName: "유라몬", frameWidth: 851, frameHeight: 832 },
    "잎새몬": { fileName: "잎새몬", frameWidth: 764, frameHeight: 834 },
    "쟈리몬": { fileName: "쟈리몬", frameWidth: 857, frameHeight: 834 },
    "제리몬": { fileName: "제리몬", frameWidth: 858, frameHeight: 499 },
    "츠브몬": { fileName: "츠브몬", frameWidth: 536, frameHeight: 834 },
    "치코몬": { fileName: "치코몬", frameWidth: 861, frameHeight: 678 },
    "코코몬": { fileName: "코코몬", frameWidth: 856, frameHeight: 457 },
    "쿠라몬": { fileName: "쿠라몬", frameWidth: 861, frameHeight: 719 },
    "키몬": { fileName: "키몬", frameWidth: 1330, frameHeight: 1346 },
    "포요몬": { fileName: "포요몬", frameWidth: 796, frameHeight: 834 },
    "푸니몬": { fileName: "푸니몬", frameWidth: 862, frameHeight: 717 },
    "푸르르몬": { fileName: "푸르르몬", frameWidth: 861, frameHeight: 622 },
    "푸와몬": { fileName: "푸와몬", frameWidth: 860, frameHeight: 355 },
    "푸티몬": { fileName: "푸티몬", frameWidth: 862, frameHeight: 620 },
    "프스몬": { fileName: "프스몬", frameWidth: 712, frameHeight: 761 },
    "피치몬": { fileName: "피치몬", frameWidth: 771, frameHeight: 834 },
    "하얀몬": { fileName: "하얀몬", frameWidth: 861, frameHeight: 770 },
  },
  "유년기": {
    "구리몬": { fileName: "구리몬", frameWidth: 1161, frameHeight: 932 },
    "구미몬": { fileName: "구미몬", frameWidth: 790, frameHeight: 832 },
    "기기몬": { fileName: "기기몬", frameWidth: 862, frameHeight: 717 },
    "꼬마몬": { fileName: "꼬마몬", frameWidth: 855, frameHeight: 833 },
    "데롱몬": { fileName: "데롱몬", frameWidth: 680, frameHeight: 834 },
    "도리몬": { fileName: "도리몬", frameWidth: 856, frameHeight: 834 },
    "둥실몬": { fileName: "둥실몬", frameWidth: 719, frameHeight: 834 },
    "모티몬": { fileName: "모티몬", frameWidth: 853, frameHeight: 829 },
    "미사일몬": { fileName: "미사일몬", frameWidth: 1035, frameHeight: 821 },
    "베이비드몬": { fileName: "베이비드몬", frameWidth: 724, frameHeight: 833 },
    "뿔몬": { fileName: "뿔몬", frameWidth: 712, frameHeight: 834 },
    "시드몬": { fileName: "시드몬", frameWidth: 774, frameHeight: 834 },
    "야몬": { fileName: "야몬", frameWidth: 1480, frameHeight: 845 },
    "야옹몬": { fileName: "야옹몬", frameWidth: 857, frameHeight: 541 },
    "어니몬": { fileName: "어니몬", frameWidth: 753, frameHeight: 834 },
    "와냐몬": { fileName: "와냐몬", frameWidth: 850, frameHeight: 833 },
    "우파몬": { fileName: "우파몬", frameWidth: 858, frameHeight: 566 },
    "초코몬": { fileName: "초코몬", frameWidth: 856, frameHeight: 834 },
    "츠메몬": { fileName: "츠메몬", frameWidth: 860, frameHeight: 762 },
    "치치몬": { fileName: "치치몬", frameWidth: 1035, frameHeight: 907 },
    "카프리몬": { fileName: "카프리몬", frameWidth: 861, frameHeight: 500 },
    "코로몬": { fileName: "코로몬", frameWidth: 858, frameHeight: 720 },
    "큐피몬": { fileName: "큐피몬", frameWidth: 562, frameHeight: 834 },
    "토코몬": { fileName: "토코몬", frameWidth: 692, frameHeight: 832 },
    "퍼그몬": { fileName: "퍼그몬", frameWidth: 862, frameHeight: 482 },
    "포로몬": { fileName: "포로몬", frameWidth: 861, frameHeight: 745 },
    "포코몬": { fileName: "포코몬", frameWidth: 820, frameHeight: 833 },
    "푸치메라몬": { fileName: "푸치메라몬", frameWidth: 857, frameHeight: 834 },
    "프스리몬": { fileName: "프스리몬", frameWidth: 994, frameHeight: 882 },
    "피나몬": { fileName: "피나몬", frameWidth: 862, frameHeight: 679 },
    "히야리몬": { fileName: "히야리몬", frameWidth: 811, frameHeight: 794 },
  },
  "성장기": {
    "가오몬": { fileName: "가오몬", frameWidth: 862, frameHeight: 714 },
    "가지몬": { fileName: "가지몬", frameWidth: 861, frameHeight: 745 },
    "감마몬": { fileName: "감마몬", frameWidth: 746, frameHeight: 823 },
    "고부리몬": { fileName: "고부리몬", frameWidth: 716, frameHeight: 834 },
    "길몬": { fileName: "길몬", frameWidth: 808, frameHeight: 834 },
    "도루몬": { fileName: "도루몬", frameWidth: 854, frameHeight: 832 },
    "드라코몬": { fileName: "드라코몬", frameWidth: 782, frameHeight: 834 },
    "드라큐몬": { fileName: "드라큐몬", frameWidth: 855, frameHeight: 833 },
    "라라몬": { fileName: "라라몬", frameWidth: 604, frameHeight: 834 },
    "레나몬": { fileName: "레나몬", frameWidth: 751, frameHeight: 834 },
    "로프몬": { fileName: "로프몬", frameWidth: 825, frameHeight: 834 },
    "루체몬": { fileName: "루체몬", frameWidth: 569, frameHeight: 834 },
    "류우다몬": { fileName: "류우다몬", frameWidth: 804, frameHeight: 834 },
    "모노드라몬": { fileName: "모노드라몬", frameWidth: 549, frameHeight: 834 },
    "모르포몬": { fileName: "모르포몬", frameWidth: 869, frameHeight: 897 },
    "베타몬": { fileName: "베타몬", frameWidth: 862, frameHeight: 803 },
    "보보몬": { fileName: "보보몬", frameWidth: 861, frameHeight: 599 },
    "브이몬": { fileName: "브이몬", frameWidth: 702, frameHeight: 834 },
    "블루코몬": { fileName: "블루코몬", frameWidth: 861, frameHeight: 751 },
    "사이케몬": { fileName: "사이케몬", frameWidth: 745, frameHeight: 834 },
    "샤코몬": { fileName: "샤코몬", frameWidth: 854, frameHeight: 833 },
    "쉬라몬": { fileName: "쉬라몬", frameWidth: 692, frameHeight: 834 },
    "스윔몬": { fileName: "스윔몬", frameWidth: 811, frameHeight: 834 },
    "아구몬": { fileName: "아구몬", frameWidth: 731, frameHeight: 834 },
    "아구몬(흑)": { fileName: "아구몬(흑)", frameWidth: 727, frameHeight: 829 },
    "아기벌몬": { fileName: "아기벌몬", frameWidth: 861, frameHeight: 720 },
    "아르마몬": { fileName: "아르마몬", frameWidth: 862, frameHeight: 629 },
    "에렉몬": { fileName: "에렉몬", frameWidth: 862, frameHeight: 727 },
    "에리스몬": { fileName: "에리스몬", frameWidth: 949, frameHeight: 1043 },
    "올챙몬": { fileName: "올챙몬", frameWidth: 862, frameHeight: 511 },
    "옷코몬": { fileName: "옷코몬", frameWidth: 860, frameHeight: 638 },
    "울퉁몬": { fileName: "울퉁몬", frameWidth: 692, frameHeight: 833 },
    "임프몬": { fileName: "임프몬", frameWidth: 1057, frameHeight: 1019 },
    "추추몬": { fileName: "추추몬", frameWidth: 854, frameHeight: 832 },
    "츄카이몬": { fileName: "츄카이몬", frameWidth: 825, frameHeight: 834 },
    "카메몬": { fileName: "카메몬", frameWidth: 727, frameHeight: 834 },
    "캔들몬": { fileName: "캔들몬", frameWidth: 948, frameHeight: 1103 },
    "케라몬": { fileName: "케라몬", frameWidth: 853, frameHeight: 834 },
    "코만드라몬": { fileName: "코만드라몬", frameWidth: 1026, frameHeight: 850 },
    "코스파이더몬": { fileName: "코스파이더몬", frameWidth: 1026, frameHeight: 790 },
    "코테몬": { fileName: "코테몬", frameWidth: 861, frameHeight: 819 },
    "쿠네몬": { fileName: "쿠네몬", frameWidth: 862, frameHeight: 793 },
    "쿠다몬": { fileName: "쿠다몬", frameWidth: 711, frameHeight: 834 },
    "크랩몬": { fileName: "크랩몬", frameWidth: 862, frameHeight: 668 },
    "테리어몬": { fileName: "테리어몬", frameWidth: 827, frameHeight: 834 },
    "텐타몬": { fileName: "텐타몬", frameWidth: 861, frameHeight: 817 },
    "토이아구몬": { fileName: "토이아구몬", frameWidth: 916, frameHeight: 891 },
    "톱니몬": { fileName: "톱니몬", frameWidth: 1032, frameHeight: 809 },
    "팅커몬": { fileName: "팅커몬", frameWidth: 979, frameHeight: 1032 },
    "파닥몬": { fileName: "파닥몬", frameWidth: 938, frameHeight: 946 },
    "파피몬": { fileName: "파피몬", frameWidth: 723, frameHeight: 834 },
    "파피몬(흑)": { fileName: "파피몬(흑)", frameWidth: 790, frameHeight: 912 },
    "팔몬": { fileName: "팔몬", frameWidth: 668, frameHeight: 832 },
    "팔코몬": { fileName: "팔코몬", frameWidth: 823, frameHeight: 834 },
    "펭귄몬": { fileName: "펭귄몬", frameWidth: 862, frameHeight: 742 },
    "폼몬": { fileName: "폼몬", frameWidth: 860, frameHeight: 590 },
    "플로라몬": { fileName: "플로라몬", frameWidth: 650, frameHeight: 833 },
    "플롯트몬": { fileName: "플롯트몬", frameWidth: 744, frameHeight: 834 },
    "피요몬": { fileName: "피요몬", frameWidth: 666, frameHeight: 833 },
    "피코데블몬": { fileName: "피코데블몬", frameWidth: 862, frameHeight: 763 },
    "헉몬": { fileName: "헉몬", frameWidth: 862, frameHeight: 530 },
    "호크몬": { fileName: "호크몬", frameWidth: 772, frameHeight: 829 },
    "효코몬": { fileName: "효코몬", frameWidth: 710, frameHeight: 991 },
  },
  "성숙기": {
    "가드로몬": { fileName: "가드로몬", frameWidth: 860, frameHeight: 722 },
    "가루몬": { fileName: "가루몬", frameWidth: 861, frameHeight: 679 },
    "가루몬(흑)": { fileName: "가루몬(흑)", frameWidth: 860, frameHeight: 714 },
    "가르고몬": { fileName: "가르고몬", frameWidth: 860, frameHeight: 535 },
    "가오가몬": { fileName: "가오가몬", frameWidth: 860, frameHeight: 707 },
    "가재드라몬": { fileName: "가재드라몬", frameWidth: 860, frameHeight: 777 },
    "가트몬": { fileName: "가트몬", frameWidth: 684, frameHeight: 833 },
    "개굴몬": { fileName: "개굴몬", frameWidth: 650, frameHeight: 833 },
    "고스몬": { fileName: "고스몬", frameWidth: 862, frameHeight: 778 },
    "고키몬": { fileName: "고키몬", frameWidth: 758, frameHeight: 832 },
    "구미호몬": { fileName: "구미호몬", frameWidth: 862, frameHeight: 589 },
    "그라우몬": { fileName: "그라우몬", frameWidth: 860, frameHeight: 775 },
    "그레이몬": { fileName: "그레이몬", frameWidth: 860, frameHeight: 823 },
    "그레이몬(청)": { fileName: "그레이몬(청)", frameWidth: 1032, frameHeight: 945 },
    "그루스감마몬": { fileName: "그루스감마몬", frameWidth: 1191, frameHeight: 979 },
    "긴류우몬": { fileName: "긴류우몬", frameWidth: 860, frameHeight: 686 },
    "꼬끼몬": { fileName: "꼬끼몬", frameWidth: 860, frameHeight: 807 },
    "니드몬": { fileName: "니드몬", frameWidth: 827, frameHeight: 832 },
    "다이노휴몬": { fileName: "다이노휴몬", frameWidth: 849, frameHeight: 832 },
    "데블몬": { fileName: "데블몬", frameWidth: 651, frameHeight: 834 },
    "데크스도루가몬": { fileName: "데크스도루가몬", frameWidth: 1020, frameHeight: 914 },
    "델타몬": { fileName: "델타몬", frameWidth: 861, frameHeight: 548 },
    "도그몬": { fileName: "도그몬", frameWidth: 838, frameHeight: 833 },
    "도루가몬": { fileName: "도루가몬", frameWidth: 861, frameHeight: 686 },
    "도베르몬": { fileName: "도베르몬", frameWidth: 860, frameHeight: 727 },
    "두리몬": { fileName: "두리몬", frameWidth: 860, frameHeight: 558 },
    "디아트리몬": { fileName: "디아트리몬", frameWidth: 861, frameHeight: 717 },
    "레오몬": { fileName: "레오몬", frameWidth: 812, frameHeight: 833 },
    "레파몬": { fileName: "레파몬", frameWidth: 1043, frameHeight: 959 },
    "마하몬": { fileName: "마하몬", frameWidth: 860, frameHeight: 582 },
    "말벌몬": { fileName: "말벌몬", frameWidth: 812, frameHeight: 1015 },
    "메라몬": { fileName: "메라몬", frameWidth: 694, frameHeight: 833 },
    "모노크로몬": { fileName: "모노크로몬", frameWidth: 861, frameHeight: 595 },
    "모야몬": { fileName: "모야몬", frameWidth: 1159, frameHeight: 961 },
    "무사몬": { fileName: "무사몬", frameWidth: 860, frameHeight: 665 },
    "미노타몬": { fileName: "미노타몬", frameWidth: 860, frameHeight: 825 },
    "미케몬": { fileName: "미케몬", frameWidth: 1059, frameHeight: 845 },
    "바오헉몬": { fileName: "바오헉몬", frameWidth: 861, frameHeight: 589 },
    "버드라몬": { fileName: "버드라몬", frameWidth: 736, frameHeight: 833 },
    "베지몬": { fileName: "베지몬", frameWidth: 1199, frameHeight: 935 },
    "베텔감마몬": { fileName: "베텔감마몬", frameWidth: 1027, frameHeight: 1061 },
    "부라이몬": { fileName: "부라이몬", frameWidth: 1013, frameHeight: 1106 },
    "브이드라몬": { fileName: "브이드라몬", frameWidth: 763, frameHeight: 832 },
    "블랙가트몬": { fileName: "블랙가트몬", frameWidth: 602, frameHeight: 831 },
    "블랙그라우몬": { fileName: "블랙그라우몬", frameWidth: 1212, frameHeight: 1057 },
    "소울몬": { fileName: "소울몬", frameWidth: 876, frameHeight: 1184 },
    "스나이몬": { fileName: "스나이몬", frameWidth: 860, frameHeight: 593 },
    "스카몬": { fileName: "스카몬", frameWidth: 862, frameHeight: 666 },
    "스타몬": { fileName: "스타몬", frameWidth: 861, frameHeight: 703 },
    "스트라이크드라몬": { fileName: "스트라이크드라몬", frameWidth: 860, frameHeight: 823 },
    "스팅몬": { fileName: "스팅몬", frameWidth: 718, frameHeight: 831 },
    "시드라몬": { fileName: "시드라몬", frameWidth: 860, frameHeight: 645 },
    "실즈드라몬": { fileName: "실즈드라몬", frameWidth: 1184, frameHeight: 980 },
    "아이기오몬": { fileName: "아이기오몬", frameWidth: 640, frameHeight: 1048 },
    "아이스몬": { fileName: "아이스몬", frameWidth: 689, frameHeight: 833 },
    "아큐라몬": { fileName: "아큐라몬", frameWidth: 805, frameHeight: 833 },
    "에어드라몬": { fileName: "에어드라몬", frameWidth: 860, frameHeight: 684 },
    "에오스몬[성숙기]": { fileName: "에오스몬", frameWidth: 1052, frameHeight: 914 },
    "에이프몬": { fileName: "에이프몬", frameWidth: 1151, frameHeight: 1046 },
    "엑스브이몬": { fileName: "엑스브이몬", frameWidth: 860, frameHeight: 808 },
    "엔젤몬": { fileName: "엔젤몬", frameWidth: 860, frameHeight: 742 },
    "연체몬": { fileName: "연체몬", frameWidth: 860, frameHeight: 556 },
    "왕잠자리몬": { fileName: "왕잠자리몬", frameWidth: 860, frameHeight: 701 },
    "우가몬": { fileName: "우가몬", frameWidth: 860, frameHeight: 627 },
    "우드몬": { fileName: "우드몬", frameWidth: 860, frameHeight: 632 },
    "워메몬": { fileName: "워메몬", frameWidth: 788, frameHeight: 832 },
    "원뿔몬": { fileName: "원뿔몬", frameWidth: 860, frameHeight: 755 },
    "웬디몬": { fileName: "웬디몬", frameWidth: 862, frameHeight: 658 },
    "위자몬": { fileName: "위자몬", frameWidth: 861, frameHeight: 752 },
    "위치몬": { fileName: "위치몬", frameWidth: 1107, frameHeight: 897 },
    "지오그레이몬": { fileName: "지오그레이몬", frameWidth: 856, frameHeight: 833 },
    "캅테리몬": { fileName: "캅테리몬", frameWidth: 860, frameHeight: 747 },
    "코어드라몬(녹)": { fileName: "코어드라몬(녹)", frameWidth: 860, frameHeight: 750 },
    "코어드라몬(청)": { fileName: "코어드라몬(청)", frameWidth: 861, frameHeight: 753 },
    "쿠가몬": { fileName: "쿠가몬", frameWidth: 862, frameHeight: 680 },
    "크리사리몬": { fileName: "크리사리몬", frameWidth: 860, frameHeight: 707 },
    "토리에몬": { fileName: "토리에몬", frameWidth: 861, frameHeight: 753 },
    "티라노몬": { fileName: "티라노몬", frameWidth: 860, frameHeight: 803 },
    "팡그몬": { fileName: "팡그몬", frameWidth: 861, frameHeight: 741 },
    "팩몬": { fileName: "팩몬", frameWidth: 714, frameHeight: 832 },
    "펑크몬": { fileName: "펑크몬", frameWidth: 1190, frameHeight: 954 },
    "페일드라몬": { fileName: "페일드라몬", frameWidth: 861, frameHeight: 714 },
    "프리지몬": { fileName: "프리지몬", frameWidth: 738, frameHeight: 829 },
    "플라이몬": { fileName: "플라이몬", frameWidth: 816, frameHeight: 832 },
    "피드몬": { fileName: "피드몬", frameWidth: 1244, frameHeight: 1089 },
    "피터몬": { fileName: "피터몬", frameWidth: 602, frameHeight: 833 },
    "필몬": { fileName: "필몬", frameWidth: 1194, frameHeight: 1046 },
    "하이코만드라몬": { fileName: "하이코만드라몬", frameWidth: 1220, frameHeight: 927 },
    "해바라기몬": { fileName: "해바라기몬", frameWidth: 860, frameHeight: 735 },
    "황금아르마몬": { fileName: "황금아르마몬", frameWidth: 860, frameHeight: 546 },
    "후크몬": { fileName: "후크몬", frameWidth: 860, frameHeight: 770 },
  },
  "완전체": {
    "가루다몬": { fileName: "가루다몬", frameWidth: 861, frameHeight: 826 },
    "고래몬": { fileName: "고래몬", frameWidth: 860, frameHeight: 459 },
    "그라운드라몬": { fileName: "그라운드라몬", frameWidth: 861, frameHeight: 402 },
    "네오데블몬": { fileName: "네오데블몬", frameWidth: 794, frameHeight: 832 },
    "데블시드라몬": { fileName: "데블시드라몬", frameWidth: 1111, frameHeight: 989 },
    "데이터몬": { fileName: "데이터몬", frameWidth: 1775, frameHeight: 932 },
    "도루그레몬": { fileName: "도루그레몬", frameWidth: 861, frameHeight: 567 },
    "도사몬": { fileName: "도사몬", frameWidth: 596, frameHeight: 833 },
    "디지타몬": { fileName: "디지타몬", frameWidth: 736, frameHeight: 833 },
    "라우드몬": { fileName: "라우드몬", frameWidth: 1231, frameHeight: 874 },
    "라이즈그레이몬": { fileName: "라이즈그레이몬", frameWidth: 860, frameHeight: 750 },
    "라일라몬": { fileName: "라일라몬", frameWidth: 604, frameHeight: 833 },
    "래피드몬": { fileName: "래피드몬", frameWidth: 764, frameHeight: 833 },
    "레굴루스몬": { fileName: "레굴루스몬", frameWidth: 1220, frameHeight: 813 },
    "레이디데블몬": { fileName: "레이디데블몬", frameWidth: 791, frameHeight: 833 },
    "로더레오몬": { fileName: "로더레오몬", frameWidth: 1112, frameHeight: 982 },
    "루체몬[풀다운]": { fileName: "루체몬[풀다운]", frameWidth: 860, frameHeight: 819 },
    "릴리몬": { fileName: "릴리몬", frameWidth: 540, frameHeight: 833 },
    "마스터티라노몬": { fileName: "마스터티라노몬", frameWidth: 858, frameHeight: 680 },
    "마하가오가몬": { fileName: "마하가오가몬", frameWidth: 818, frameHeight: 833 },
    "메가드라몬": { fileName: "메가드라몬", frameWidth: 861, frameHeight: 771 },
    "메가로그라우몬": { fileName: "메가로그라우몬", frameWidth: 860, frameHeight: 688 },
    "메가시드라몬": { fileName: "메가시드라몬", frameWidth: 860, frameHeight: 754 },
    "메탈그레이몬": { fileName: "메탈그레이몬", frameWidth: 860, frameHeight: 760 },
    "메탈그레이몬(청)": { fileName: "메탈그레이몬(청)", frameWidth: 860, frameHeight: 690 },
    "메탈티라노몬": { fileName: "메탈티라노몬", frameWidth: 860, frameHeight: 670 },
    "묘티스몬": { fileName: "묘티스몬", frameWidth: 772, frameHeight: 832 },
    "배드퍼펫몬": { fileName: "배드퍼펫몬", frameWidth: 664, frameHeight: 829 },
    "버밀리몬": { fileName: "버밀리몬", frameWidth: 860, frameHeight: 559 },
    "부텐몬": { fileName: "부텐몬", frameWidth: 1238, frameHeight: 737 },
    "브라키몬": { fileName: "브라키몬", frameWidth: 486, frameHeight: 833 },
    "블랙메가로그라우몬": { fileName: "블랙메가로그라우몬", frameWidth: 1195, frameHeight: 912 },
    "블루메라몬": { fileName: "블루메라몬", frameWidth: 586, frameHeight: 833 },
    "뿌띠몬": { fileName: "뿌띠몬", frameWidth: 860, frameHeight: 738 },
    "사이버드라몬": { fileName: "사이버드라몬", frameWidth: 855, frameHeight: 833 },
    "세이버헉몬": { fileName: "세이버헉몬", frameWidth: 860, frameHeight: 684 },
    "슈퍼스타몬": { fileName: "슈퍼스타몬", frameWidth: 862, frameHeight: 725 },
    "스컬그레이몬": { fileName: "스컬그레이몬", frameWidth: 861, frameHeight: 768 },
    "스컬사탄몬": { fileName: "스컬사탄몬", frameWidth: 860, frameHeight: 776 },
    "스콜피오몬": { fileName: "스콜피오몬", frameWidth: 860, frameHeight: 641 },
    "스티필몬": { fileName: "스티필몬", frameWidth: 1083, frameHeight: 1077 },
    "실피드몬": { fileName: "실피드몬", frameWidth: 658, frameHeight: 832 },
    "아수라몬": { fileName: "아수라몬", frameWidth: 719, frameHeight: 833 },
    "아이기오투스몬": { fileName: "아이기오투스몬", frameWidth: 917, frameHeight: 1171 },
    "아트라캅테리몬": { fileName: "아트라캅테리몬", frameWidth: 860, frameHeight: 703 },
    "안티라몬": { fileName: "안티라몬", frameWidth: 609, frameHeight: 832 },
    "안티라몬(데바)": { fileName: "안티라몬(데바)", frameWidth: 735, frameHeight: 832 },
    "야타가라몬": { fileName: "야타가라몬", frameWidth: 860, frameHeight: 678 },
    "에어로브이드라몬": { fileName: "에어로브이드라몬", frameWidth: 860, frameHeight: 671 },
    "에오스몬[완전체]": { fileName: "에오스몬", frameWidth: 1227, frameHeight: 1067 },
    "에테몬": { fileName: "에테몬", frameWidth: 719, frameHeight: 833 },
    "엑스티라노몬": { fileName: "엑스티라노몬", frameWidth: 1117, frameHeight: 1071 },
    "엔젤우몬": { fileName: "엔젤우몬", frameWidth: 860, frameHeight: 731 },
    "오로치몬": { fileName: "오로치몬", frameWidth: 1231, frameHeight: 1015 },
    "오보로몬": { fileName: "오보로몬", frameWidth: 861, frameHeight: 540 },
    "와이즈몬": { fileName: "와이즈몬", frameWidth: 755, frameHeight: 832 },
    "왕개굴몬": { fileName: "왕개굴몬", frameWidth: 779, frameHeight: 833 },
    "왕쿠가몬": { fileName: "왕쿠가몬", frameWidth: 860, frameHeight: 684 },
    "운석몬": { fileName: "운석몬", frameWidth: 689, frameHeight: 834 },
    "워가루몬": { fileName: "워가루몬", frameWidth: 788, frameHeight: 833 },
    "워가루몬(흑)": { fileName: "워가루몬(흑)", frameWidth: 765, frameHeight: 832 },
    "윙드라몬": { fileName: "윙드라몬", frameWidth: 861, frameHeight: 541 },
    "인어몬": { fileName: "인어몬", frameWidth: 1019, frameHeight: 1126 },
    "인펠몬": { fileName: "인펠몬", frameWidth: 860, frameHeight: 566 },
    "쥬드몬": { fileName: "쥬드몬", frameWidth: 860, frameHeight: 750 },
    "쥬레이몬": { fileName: "쥬레이몬", frameWidth: 797, frameHeight: 832 },
    "카노바이스몬": { fileName: "카노바이스몬", frameWidth: 1244, frameHeight: 942 },
    "캐논벌몬": { fileName: "캐논벌몬", frameWidth: 860, frameHeight: 629 },
    "캡틴후크몬": { fileName: "캡틴후크몬", frameWidth: 860, frameHeight: 784 },
    "콩알몬": { fileName: "콩알몬", frameWidth: 861, frameHeight: 459 },
    "크리스페일드라몬": { fileName: "크리스페일드라몬", frameWidth: 861, frameHeight: 713 },
    "토우몬": { fileName: "토우몬", frameWidth: 670, frameHeight: 832 },
    "트리케라몬": { fileName: "트리케라몬", frameWidth: 861, frameHeight: 628 },
    "파일드라몬": { fileName: "파일드라몬", frameWidth: 860, frameHeight: 825 },
    "패롯몬": { fileName: "패롯몬", frameWidth: 861, frameHeight: 812 },
    "팬더몬": { fileName: "팬더몬", frameWidth: 1091, frameHeight: 1090 },
    "팬텀몬": { fileName: "팬텀몬", frameWidth: 782, frameHeight: 832 },
    "퍼펫몬": { fileName: "퍼펫몬", frameWidth: 574, frameHeight: 833 },
    "펌프몬": { fileName: "펌프몬", frameWidth: 611, frameHeight: 832 },
    "홀리엔젤몬": { fileName: "홀리엔젤몬", frameWidth: 825, frameHeight: 832 },
    "화이트레오몬": { fileName: "화이트레오몬", frameWidth: 812, frameHeight: 832 },
    "히사류우몬": { fileName: "히사류우몬", frameWidth: 578, frameHeight: 832 },
    "히포그리포몬": { fileName: "히포그리포몬", frameWidth: 860, frameHeight: 726 },
  },
  "궁극체": {
    "가이오몬": { fileName: "가이오몬", frameWidth: 860, frameHeight: 690 },
    "고쿠몬": { fileName: "고쿠몬", frameWidth: 1044, frameHeight: 1081 },
    "그랜쿠가몬": { fileName: "그랜쿠가몬", frameWidth: 860, frameHeight: 492 },
    "넵툰몬": { fileName: "넵툰몬", frameWidth: 860, frameHeight: 792 },
    "노블펌프몬": { fileName: "노블펌프몬", frameWidth: 879, frameHeight: 1055 },
    "뇌신몬": { fileName: "뇌신몬", frameWidth: 758, frameHeight: 832 },
    "니즈헤그몬": { fileName: "니즈헤그몬", frameWidth: 1244, frameHeight: 1038 },
    "다이너몬": { fileName: "다이너몬", frameWidth: 860, frameHeight: 638 },
    "다이노렉스몬": { fileName: "다이노렉스몬", frameWidth: 862, frameHeight: 490 },
    "다크드라몬": { fileName: "다크드라몬", frameWidth: 862, frameHeight: 621 },
    "던데블몬": { fileName: "던데블몬", frameWidth: 860, frameHeight: 457 },
    "데블타몬": { fileName: "데블타몬", frameWidth: 861, frameHeight: 777 },
    "도미니몬": { fileName: "도미니몬", frameWidth: 1242, frameHeight: 1148 },
    "두프트몬": { fileName: "두프트몬", frameWidth: 860, frameHeight: 826 },
    "듀나스몬": { fileName: "듀나스몬", frameWidth: 1218, frameHeight: 856 },
    "듀크몬": { fileName: "듀크몬", frameWidth: 861, frameHeight: 673 },
    "디아블로몬": { fileName: "디아블로몬", frameWidth: 861, frameHeight: 530 },
    "라센몬": { fileName: "라센몬", frameWidth: 1194, frameHeight: 1051 },
    "러스트티라노몬": { fileName: "러스트티라노몬", frameWidth: 861, frameHeight: 621 },
    "레이브몬": { fileName: "레이브몬", frameWidth: 740, frameHeight: 829 },
    "로드나이트몬": { fileName: "로드나이트몬", frameWidth: 809, frameHeight: 832 },
    "로제몬": { fileName: "로제몬", frameWidth: 627, frameHeight: 829 },
    "로터스몬": { fileName: "로터스몬", frameWidth: 861, frameHeight: 766 },
    "리리스몬": { fileName: "리리스몬", frameWidth: 804, frameHeight: 834 },
    "리바이어몬": { fileName: "리바이어몬", frameWidth: 860, frameHeight: 451 },
    "마르스몬": { fileName: "마르스몬", frameWidth: 744, frameHeight: 832 },
    "마린엔젤몬": { fileName: "마린엔젤몬", frameWidth: 862, frameHeight: 644 },
    "마스테몬": { fileName: "마스테몬", frameWidth: 1224, frameHeight: 1193 },
    "마왕몬": { fileName: "마왕몬", frameWidth: 862, frameHeight: 759 },
    "메탈가루몬": { fileName: "메탈가루몬", frameWidth: 860, frameHeight: 644 },
    "메탈시드라몬": { fileName: "메탈시드라몬", frameWidth: 778, frameHeight: 833 },
    "메탈에테몬": { fileName: "메탈에테몬", frameWidth: 639, frameHeight: 834 },
    "미네르바몬": { fileName: "미네르바몬", frameWidth: 615, frameHeight: 832 },
    "미라쥬가오가몬": { fileName: "미라쥬가오가몬", frameWidth: 837, frameHeight: 832 },
    "바이킹몬": { fileName: "바이킹몬", frameWidth: 1005, frameHeight: 1054 },
    "반쵸릴리몬": { fileName: "반쵸릴리몬", frameWidth: 673, frameHeight: 833 },
    "발두르몬": { fileName: "발두르몬", frameWidth: 811, frameHeight: 832 },
    "발키리몬": { fileName: "발키리몬", frameWidth: 611, frameHeight: 833 },
    "베놈묘티스몬": { fileName: "베놈묘티스몬", frameWidth: 845, frameHeight: 833 },
    "베누스몬": { fileName: "베누스몬", frameWidth: 712, frameHeight: 832 },
    "베르스타몬": { fileName: "베르스타몬", frameWidth: 632, frameHeight: 831 },
    "베르제브몬": { fileName: "베르제브몬", frameWidth: 516, frameHeight: 833 },
    "베리얼묘티스몬": { fileName: "베리얼묘티스몬", frameWidth: 860, frameHeight: 559 },
    "벨페몬": { fileName: "벨페몬", frameWidth: 860, frameHeight: 752 },
    "볼트몬": { fileName: "볼트몬", frameWidth: 777, frameHeight: 833 },
    "브레이크드라몬": { fileName: "브레이크드라몬", frameWidth: 860, frameHeight: 462 },
    "블랙메탈가루몬": { fileName: "블랙메탈가루몬", frameWidth: 861, frameHeight: 642 },
    "블랙워그레이몬": { fileName: "블랙워그레이몬", frameWidth: 824, frameHeight: 832 },
    "블룸로드몬": { fileName: "블룸로드몬", frameWidth: 867, frameHeight: 1202 },
    "블리츠그레이몬": { fileName: "블리츠그레이몬", frameWidth: 860, frameHeight: 694 },
    "빅웃코몬": { fileName: "빅웃코몬", frameWidth: 1118, frameHeight: 851 },
    "빅토리그레이몬": { fileName: "빅토리그레이몬", frameWidth: 862, frameHeight: 587 },
    "샤벨레오몬": { fileName: "샤벨레오몬", frameWidth: 862, frameHeight: 648 },
    "샤인그레이몬": { fileName: "샤인그레이몬", frameWidth: 858, frameHeight: 778 },
    "샤크라몬": { fileName: "샤크라몬", frameWidth: 585, frameHeight: 833 },
    "세라피몬": { fileName: "세라피몬", frameWidth: 542, frameHeight: 833 },
    "세인트가르고몬": { fileName: "세인트가르고몬", frameWidth: 684, frameHeight: 832 },
    "수신몬": { fileName: "수신몬", frameWidth: 861, frameHeight: 705 },
    "스피노몬": { fileName: "스피노몬", frameWidth: 862, frameHeight: 689 },
    "슬레이어드라몬": { fileName: "슬레이어드라몬", frameWidth: 860, frameHeight: 668 },
    "시리우스몬": { fileName: "시리우스몬", frameWidth: 1122, frameHeight: 866 },
    "신퍼펫몬": { fileName: "신퍼펫몬", frameWidth: 860, frameHeight: 743 },
    "아누비스몬": { fileName: "아누비스몬", frameWidth: 1078, frameHeight: 1127 },
    "아크투루스몬": { fileName: "아크투루스몬", frameWidth: 1175, frameHeight: 939 },
    "알파몬": { fileName: "알파몬", frameWidth: 724, frameHeight: 832 },
    "알포스브이드라몬": { fileName: "알포스브이드라몬", frameWidth: 683, frameHeight: 832 },
    "에오스몬": { fileName: "에오스몬", frameWidth: 1204, frameHeight: 1179 },
    "여왕벌몬": { fileName: "여왕벌몬", frameWidth: 1244, frameHeight: 1000 },
    "오류우몬": { fileName: "오류우몬", frameWidth: 861, frameHeight: 755 },
    "오파니몬": { fileName: "오파니몬", frameWidth: 786, frameHeight: 834 },
    "워그레이몬": { fileName: "워그레이몬", frameWidth: 860, frameHeight: 823 },
    "유피테르몬": { fileName: "유피테르몬", frameWidth: 1079, frameHeight: 1084 },
    "저스티몬": { fileName: "저스티몬", frameWidth: 860, frameHeight: 827 },
    "제스몬": { fileName: "제스몬", frameWidth: 861, frameHeight: 735 },
    "지드가루몬": { fileName: "지드가루몬", frameWidth: 858, frameHeight: 746 },
    "카오스듀크몬": { fileName: "카오스듀크몬", frameWidth: 861, frameHeight: 671 },
    "캐논드라몬": { fileName: "캐논드라몬", frameWidth: 861, frameHeight: 634 },
    "케루비몬(선)": { fileName: "케루비몬(선)", frameWidth: 827, frameHeight: 832 },
    "케루비몬(악)": { fileName: "케루비몬(악)", frameWidth: 750, frameHeight: 833 },
    "쿠즈하몬": { fileName: "쿠즈하몬", frameWidth: 392, frameHeight: 833 },
    "크레니엄몬": { fileName: "크레니엄몬", frameWidth: 585, frameHeight: 833 },
    "크레스가루몬": { fileName: "크레스가루몬", frameWidth: 860, frameHeight: 729 },
    "크로노몬[디스트로이]": { fileName: "크로노몬[디스트로이]", frameWidth: 1223, frameHeight: 828 },
    "크로노몬[홀리]": { fileName: "크로노몬[홀리]", frameWidth: 1102, frameHeight: 1132 },
    "타이거베스파몬": { fileName: "타이거베스파몬", frameWidth: 862, frameHeight: 645 },
    "타이타몬": { fileName: "타이타몬", frameWidth: 984, frameHeight: 591 },
    "택티몬": { fileName: "택티몬", frameWidth: 821, frameHeight: 834 },
    "파워드라몬": { fileName: "파워드라몬", frameWidth: 862, frameHeight: 704 },
    "패럴렐몬": { fileName: "패럴렐몬", frameWidth: 1177, frameHeight: 848 },
    "푸쿠몬": { fileName: "푸쿠몬", frameWidth: 860, frameHeight: 802 },
    "풍신몬": { fileName: "풍신몬", frameWidth: 861, frameHeight: 777 },
    "플래티넘워매몬": { fileName: "플래티넘워매몬", frameWidth: 860, frameHeight: 613 },
    "플레시오몬": { fileName: "플레시오몬", frameWidth: 820, frameHeight: 833 },
    "플루토몬": { fileName: "플루토몬", frameWidth: 1234, frameHeight: 982 },
    "피노키몬": { fileName: "피노키몬", frameWidth: 862, frameHeight: 803 },
    "피닉스몬": { fileName: "피닉스몬", frameWidth: 861, frameHeight: 676 },
    "피에몬": { fileName: "피에몬", frameWidth: 660, frameHeight: 829 },
    "헤라클래스캅테리몬": { fileName: "헤라클래스캅테리몬", frameWidth: 860, frameHeight: 519 },
    "헤비레오몬": { fileName: "헤비레오몬", frameWidth: 1164, frameHeight: 971 },
    "헤비메탈드라몬": { fileName: "헤비메탈드라몬", frameWidth: 1241, frameHeight: 906 },
    "헥세블라우몬": { fileName: "헥세블라우몬", frameWidth: 861, frameHeight: 685 },
    "황금무사몬": { fileName: "황금무사몬", frameWidth: 860, frameHeight: 747 },
    "황제드라몬": { fileName: "황제드라몬", frameWidth: 861, frameHeight: 453 },
    "히드라몬": { fileName: "히드라몬", frameWidth: 1237, frameHeight: 945 },
  },
  "초궁극체": {
    "가이오몬[엄도의형]": { fileName: "가이오몬[엄도의형]", frameWidth: 1242, frameHeight: 988 },
    "기가시드라몬": { fileName: "기가시드라몬", frameWidth: 1244, frameHeight: 770 },
    "다이노타이거몬": { fileName: "다이노타이거몬", frameWidth: 858, frameHeight: 730 },
    "두프트몬[레오파드]": { fileName: "두프트몬[레오파드]", frameWidth: 1137, frameHeight: 817 },
    "라센몬[격앙]": { fileName: "라센몬[격앙]", frameWidth: 1235, frameHeight: 1021 },
    "라이덴몬": { fileName: "라이덴몬", frameWidth: 1684, frameHeight: 1217 },
    "라플레시몬": { fileName: "라플레시몬", frameWidth: 1146, frameHeight: 1146 },
    "레이브몬[버스트]": { fileName: "레이브몬[버스트]", frameWidth: 860, frameHeight: 766 },
    "로제몬[버스트]": { fileName: "로제몬[버스트]", frameWidth: 814, frameHeight: 833 },
    "루체몬[사탄]": { fileName: "루체몬[사탄]", frameWidth: 861, frameHeight: 764 },
    "메르바몬": { fileName: "메르바몬", frameWidth: 989, frameHeight: 1064 },
    "미라쥬가오가몬[버스트]": { fileName: "미라쥬가오가몬[버스트]", frameWidth: 860, frameHeight: 585 },
    "베르제브몬[블라스트]": { fileName: "베르제브몬[블라스트]", frameWidth: 714, frameHeight: 833 },
    "벨페몬[레이지]": { fileName: "벨페몬[레이지]", frameWidth: 861, frameHeight: 784 },
    "샤인그레이몬[루인]": { fileName: "샤인그레이몬[루인]", frameWidth: 861, frameHeight: 661 },
    "샤인그레이몬[버스트]": { fileName: "샤인그레이몬[버스트]", frameWidth: 861, frameHeight: 525 },
    "샤크라몬[무녀]": { fileName: "샤크라몬[무녀]", frameWidth: 1122, frameHeight: 1193 },
    "아마게몬": { fileName: "아마게몬", frameWidth: 861, frameHeight: 436 },
    "알파몬[왕룡검]": { fileName: "알파몬[왕룡검]", frameWidth: 1244, frameHeight: 785 },
    "엑자몬": { fileName: "엑자몬", frameWidth: 861, frameHeight: 482 },
    "오메가몬": { fileName: "오메가몬", frameWidth: 703, frameHeight: 834 },
    "오메가몬[알터-S]": { fileName: "오메가몬[알터-S]", frameWidth: 671, frameHeight: 833 },
    "오메가몬[즈왈트-D]": { fileName: "오메가몬[즈왈트-D]", frameWidth: 1236, frameHeight: 1159 },
    "오메가몬[즈왈트]": { fileName: "오메가몬[즈왈트]", frameWidth: 700, frameHeight: 832 },
    "오파니몬[풀다운]": { fileName: "오파니몬[풀다운]", frameWidth: 861, frameHeight: 668 },
    "카오스드라몬": { fileName: "카오스드라몬", frameWidth: 861, frameHeight: 707 },
    "카오스피에몬": { fileName: "카오스피에몬", frameWidth: 986, frameHeight: 1130 },
    "쿠즈하몬[무녀]": { fileName: "쿠즈하몬[무녀]", frameWidth: 1006, frameHeight: 1157 },
    "황제드라몬[파이터]": { fileName: "황제드라몬[파이터]", frameWidth: 860, frameHeight: 767 },
    "황제드라몬[팔라딘]": { fileName: "황제드라몬[팔라딘]", frameWidth: 860, frameHeight: 755 },
  },
}

const getCombatantIdleAnimationSprite = (combatant) => {
  const stage = combatant?.speciesStage ?? combatant?.speciesData?.stage
  const imageName = combatant?.imageName ?? combatant?.name
  const meta = stage && imageName ? IDLE_ANIMATION_SPRITE_META_BY_STAGE[stage]?.[imageName] : null

  if (!stage || !meta) {
    return null
  }

  return {
    url: createPublicAssetUrl('애니메이션', '대기', stage, `${meta.fileName}.png`),
    ratio: meta.frameWidth / meta.frameHeight,
    inverseRatio: meta.frameHeight / meta.frameWidth,
  }
}

const getDigimonTypeIconUrl = (type) =>
  DIGIMON_TYPE_ICON_NAMES.has(type) ? createPublicAssetUrl('타입', `${type}.png`) : null

const getDigimonAttributeIconUrl = (attribute) => {
  const iconName = ATTRIBUTE_ICON_FILE_MAP[attribute] ?? attribute

  return iconName ? createPublicAssetUrl('속성', `${iconName}.png`) : null
}

const getSkillTooltipTheme = (attribute) => SKILL_TOOLTIP_THEME_MAP[attribute] ?? SKILL_TOOLTIP_THEME_MAP.무

const DigimonTraitIcon = ({ className, src, label }) => {
  if (!src) {
    return null
  }

  return (
    <img
      className={['digimon-status__trait', className].filter(Boolean).join(' ')}
      src={src}
      alt={label}
      title={label}
    />
  )
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

const MatchupGuideModal = ({ onConfirm }) => {
  const typeEntries = Object.entries(typeAdvantageMap)
  const attributeEntries = Object.entries(attributeAdvantageMap)

  return (
    <div className="matchup-guide-overlay" role="dialog" aria-modal="true" aria-labelledby="matchup-guide-title">
      <div className="matchup-guide-panel">
        <button
          type="button"
          className="matchup-guide-close"
          aria-label="상성표 확인 후 게임 시작"
          onClick={onConfirm}
        >
          X
        </button>

        <div className="matchup-guide-header">
          <p className="matchup-guide-kicker">BATTLE GUIDE</p>
          <h2 id="matchup-guide-title" className="matchup-guide-title">
            상성표
          </h2>
          <p className="matchup-guide-summary">
            기술 속성과 디지몬 타입이 유리할수록 피해가 커지고, 불리하면 피해가 줄어든다.
          </p>
        </div>

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
                <strong>x2</strong>
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
            <p className="matchup-guide-note">무 속성은 상성 변화가 없다.</p>
          </section>
        </div>

        <div className="matchup-guide-footer">
          <span>타입과 속성이 모두 유리하면 최대 x3</span>
          <span>둘 다 불리하면 공격이 통하지 않음</span>
        </div>
      </div>
    </div>
  )
}

const createShuffledBgmQueue = (previousUrl = null, sourceTracks = bgmTracks) => {
  const queue = [...sourceTracks]

  for (let index = queue.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[queue[index], queue[randomIndex]] = [queue[randomIndex], queue[index]]
  }

  if (queue.length > 1 && queue[0]?.url === previousUrl) {
    ;[queue[0], queue[1]] = [queue[1], queue[0]]
  }

  return queue
}

const BackgroundMusic = ({ settings }) => {
  const safeSettings = sanitizeSettings(settings)
  const initialEnabledTracks = getEnabledBgmTracks(safeSettings)
  const audioRef = useRef(null)
  const enabledTracksRef = useRef(initialEnabledTracks)
  const targetVolumeRef = useRef(getEffectiveBgmVolume(safeSettings))
  const queueRef = useRef(createShuffledBgmQueue(null, initialEnabledTracks))
  const currentTrackRef = useRef(null)
  const fadeFrameRef = useRef(null)
  const hasStartedRef = useRef(false)
  const hasUserGestureRef = useRef(false)
  const isFadingOutRef = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    const enabledTracks = getEnabledBgmTracks(safeSettings)

    enabledTracksRef.current = enabledTracks
    targetVolumeRef.current = getEffectiveBgmVolume(safeSettings)
    queueRef.current = queueRef.current.filter((track) =>
      enabledTracks.some((enabledTrack) => enabledTrack.url === track.url)
    )

    if (!audio) {
      return
    }

    if (enabledTracks.length === 0) {
      audio.pause()
      audio.removeAttribute('src')
      currentTrackRef.current = null
      hasStartedRef.current = false
      queueRef.current = []
      return
    }

    if (!currentTrackRef.current && !hasStartedRef.current && hasUserGestureRef.current) {
      queueRef.current = createShuffledBgmQueue(null, enabledTracks)
      const nextTrack = queueRef.current.shift() ?? enabledTracks[0]
      currentTrackRef.current = nextTrack
      audio.pause()
      audio.src = nextTrack.url
      audio.currentTime = 0
      audio.volume = targetVolumeRef.current
      audio.play()
        .then(() => {
          hasStartedRef.current = true
        })
        .catch(() => {
          hasStartedRef.current = false
          audio.pause()
        })
      return
    }

    if (
      currentTrackRef.current &&
      !enabledTracks.some((track) => track.url === currentTrackRef.current?.url)
    ) {
      queueRef.current = createShuffledBgmQueue(null, enabledTracks)

      if (hasStartedRef.current) {
        const nextTrack = queueRef.current.shift() ?? enabledTracks[0]
        currentTrackRef.current = nextTrack
        audio.pause()
        audio.src = nextTrack.url
        audio.currentTime = 0
        audio.volume = targetVolumeRef.current
        audio.play().catch(() => {
          hasStartedRef.current = false
          audio.pause()
        })
        return
      }

      audio.pause()
      audio.removeAttribute('src')
      currentTrackRef.current = null
      return
    }

    if (hasStartedRef.current) {
      audio.volume = targetVolumeRef.current
    }
  }, [
    safeSettings.masterVolume,
    safeSettings.bgmVolume,
    safeSettings.enabledBgmUrls,
  ])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return undefined
    }

    const cancelFade = () => {
      if (fadeFrameRef.current) {
        window.cancelAnimationFrame(fadeFrameRef.current)
        fadeFrameRef.current = null
      }
    }

    const fadeVolume = (targetVolume, durationMs) => {
      cancelFade()
      const startVolume = audio.volume
      const startedAt = window.performance.now()

      const tick = (currentTime) => {
        const progress = Math.min(1, (currentTime - startedAt) / durationMs)
        const easedProgress = 1 - (1 - progress) ** 3
        audio.volume = startVolume + (targetVolume - startVolume) * easedProgress

        if (progress < 1) {
          fadeFrameRef.current = window.requestAnimationFrame(tick)
        } else {
          audio.volume = targetVolume
          fadeFrameRef.current = null
        }
      }

      fadeFrameRef.current = window.requestAnimationFrame(tick)
    }

    const getNextTrack = () => {
      const enabledTracks = enabledTracksRef.current

      if (enabledTracks.length === 0) {
        return null
      }

      if (queueRef.current.length === 0) {
        queueRef.current = createShuffledBgmQueue(currentTrackRef.current?.url, enabledTracks)
      }

      return queueRef.current.shift() ?? enabledTracks[0]
    }

    const playNextTrack = async () => {
      const nextTrack = getNextTrack()

      if (!nextTrack) {
        audio.pause()
        hasStartedRef.current = false
        currentTrackRef.current = null
        return
      }

      currentTrackRef.current = nextTrack
      isFadingOutRef.current = false
      audio.pause()
      audio.src = nextTrack.url
      audio.volume = 0
      audio.currentTime = 0

      try {
        await audio.play()
        hasStartedRef.current = true
        fadeVolume(targetVolumeRef.current, BGM_FADE_IN_MS)
      } catch {
        hasStartedRef.current = false
        audio.pause()
      }
    }

    const startAfterUserGesture = () => {
      hasUserGestureRef.current = true

      if (hasStartedRef.current) {
        return
      }

      playNextTrack()
    }

    const handleTimeUpdate = () => {
      if (
        isFadingOutRef.current ||
        !Number.isFinite(audio.duration) ||
        audio.duration <= BGM_FADE_OUT_SECONDS
      ) {
        return
      }

      if (audio.duration - audio.currentTime <= BGM_FADE_OUT_SECONDS) {
        isFadingOutRef.current = true
        fadeVolume(0, BGM_FADE_OUT_MS)
      }
    }

    const handleEnded = () => {
      playNextTrack()
    }

    const handleError = () => {
      window.setTimeout(playNextTrack, 400)
    }

    window.addEventListener('pointerdown', startAfterUserGesture)
    window.addEventListener('keydown', startAfterUserGesture)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      cancelFade()
      window.removeEventListener('pointerdown', startAfterUserGesture)
      window.removeEventListener('keydown', startAfterUserGesture)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.pause()
    }
  }, [])

  return <audio ref={audioRef} preload="auto" aria-hidden="true" />
}

const ButtonClickSound = ({ settings }) => {
  const safeSettings = sanitizeSettings(settings)
  const audioPoolRef = useRef([])
  const audioIndexRef = useRef(0)
  const volumeRef = useRef(BUTTON_CLICK_SFX_VOLUME * getEffectiveSfxVolume(safeSettings))

  useEffect(() => {
    volumeRef.current = BUTTON_CLICK_SFX_VOLUME * getEffectiveSfxVolume(safeSettings)
    audioPoolRef.current.forEach((audio) => {
      audio.volume = volumeRef.current
    })
  }, [safeSettings.masterVolume, safeSettings.sfxVolume])

  useEffect(() => {
    audioPoolRef.current = Array.from({ length: BUTTON_CLICK_SFX_POOL_SIZE }, () => {
      const audio = new Audio(BUTTON_CLICK_SFX_URL)
      audio.preload = 'auto'
      audio.volume = volumeRef.current

      return audio
    })

    const handleClick = (event) => {
      const targetElement = event.target instanceof Element ? event.target : null
      const clickedButton = targetElement?.closest('button,[role="button"]')

      if (!clickedButton || clickedButton.getAttribute('aria-disabled') === 'true') {
        return
      }

      if ('disabled' in clickedButton && clickedButton.disabled) {
        return
      }

      const audioPool = audioPoolRef.current

      if (audioPool.length === 0) {
        return
      }

      const audio = audioPool[audioIndexRef.current % audioPool.length]
      audioIndexRef.current += 1
      audio.currentTime = 0
      audio.volume = volumeRef.current
      resumeBattleSfxAudioContext()
      const playPromise = audio.play()

      if (playPromise?.catch) {
        playPromise.catch(() => {})
      }
    }

    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
      audioPoolRef.current.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      audioPoolRef.current = []
    }
  }, [])

  return null
}

const MAX_ACTIVE_COMBATANTS = 2
const MAX_ENEMY_COMBATANTS = 2
const PARTY_SLOT_COUNT = 8
const STARTING_PLAYER_LEVEL = 5
const BOSS_STAGE_INTERVAL = 10
const BOSS_STAT_MULTIPLIER = 1.5
const BOSS_STAGE_NO_GATE_LIMIT = 50
const BOSS_STAGE_ONE_GATE_LIMIT = 100
const BOSS_STAGE_TWO_GATE_LIMIT = 150
const STARTER_PARTY_COST_LIMIT = 10
const STARTER_GROWTH_COST = 3
const DIGI_EGG_HATCH_LEVEL = 3
const BUFF_STAGE_DURATION = 10
const BATTLE_STAT_MODIFIER_DURATION = 3
const STATUS_DURATION_TURNS = 3
const STATUS_EARLY_CURE_CHANCE = 30
const IV_MAX = 31
const DIGIMON_STAGE_ORDER = ['유아기', '유년기', '성장기', '성숙기', '완전체', '궁극체', '초궁극체']
const EVOLUTION_STAGE_REQUIREMENTS = {
  유아기: { level: 1, stats: { hp: 8, attack: 8, specialAttack: 8, defense: 8, specialDefense: 8, speed: 8 } },
  유년기: { level: 3, stats: { hp: 10, attack: 10, specialAttack: 10, defense: 10, specialDefense: 10, speed: 10 } },
  성장기: { level: 5, stats: { hp: 14, attack: 14, specialAttack: 14, defense: 14, specialDefense: 14, speed: 14 } },
  성숙기: { level: 16, stats: { hp: 24, attack: 24, specialAttack: 24, defense: 24, specialDefense: 24, speed: 24 } },
  완전체: { level: 30, stats: { hp: 46, attack: 46, specialAttack: 46, defense: 46, specialDefense: 46, speed: 46 } },
  궁극체: { level: 45, stats: { hp: 70, attack: 70, specialAttack: 70, defense: 70, specialDefense: 70, speed: 70 } },
  초궁극체: { level: 65, stats: { hp: 102, attack: 102, specialAttack: 102, defense: 102, specialDefense: 102, speed: 102 } },
}
const STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
const EVOLUTION_REQUIREMENT_STAT_KEYS = ['hp', 'attack', 'specialAttack', 'defense', 'specialDefense', 'speed']
const BUFFABLE_STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
const STATUS_EFFECT_TYPES = ['독', '맹독', '혼란', '착란', '마비', '행동불능', '수면', '혼수상태']
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
const COMBATANT_INFO_TABS = [
  { key: 'stats', label: '스탯' },
  { key: 'ivs', label: '개체치' },
]
const COMBATANT_STAT_CHART_FIELDS = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: '공격' },
  { key: 'defense', label: '방어' },
  { key: 'speed', label: '스피드' },
  { key: 'specialDefense', label: '특수방어' },
  { key: 'specialAttack', label: '특수공격' },
]
const IV_FIELD_KEYS = COMBATANT_STAT_CHART_FIELDS.map((field) => field.key)
const STAT_CHART_CENTER = 60
const STAT_CHART_RADIUS = 46
const EXP_BAR_ANIMATION_MS = 520
const EXP_BAR_RESET_MS = 70
const EXP_BAR_VISIBLE_AFTER_MS = 450
const LEVEL_UP_STAT_ANIMATION_MS = 900
const LEVEL_UP_STAT_VISIBLE_AFTER_MS = 1050
const CAPTURE_INFO_TAB_DURATION_MS = 1000
const CLASSIC_LEVEL_CAPS = [
  10, 16, 24, 32, 38, 48, 56, 64, 74, 84, 94, 104, 114, 126, 138, 150, 162, 174, 188, 200,
]
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
const getRewardRerollCost = (stage, rerollCount = 0) =>
  getRewardRerollBaseCost(stage) * (Math.max(0, rerollCount) + 1)
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
const createTrimmedSpriteDataUrl = (imageElement) => {
  const width = imageElement?.naturalWidth ?? 0
  const height = imageElement?.naturalHeight ?? 0

  if (!width || !height || typeof document === 'undefined') {
    return null
  }

  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = width
  sourceCanvas.height = height
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })

  if (!sourceContext) {
    return null
  }

  try {
    sourceContext.drawImage(imageElement, 0, 0)
    const { data } = sourceContext.getImageData(0, 0, width, height)
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[(y * width + x) * 4 + 3]

        if (alpha <= 8) {
          continue
        }

        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }

    if (maxX < minX || maxY < minY) {
      return null
    }

    const trimWidth = maxX - minX + 1
    const trimHeight = maxY - minY + 1

    if (trimWidth === width && trimHeight === height) {
      return null
    }

    const trimmedCanvas = document.createElement('canvas')
    trimmedCanvas.width = trimWidth
    trimmedCanvas.height = trimHeight
    const trimmedContext = trimmedCanvas.getContext('2d')

    if (!trimmedContext) {
      return null
    }

    trimmedContext.drawImage(
      sourceCanvas,
      minX,
      minY,
      trimWidth,
      trimHeight,
      0,
      0,
      trimWidth,
      trimHeight
    )

    return trimmedCanvas.toDataURL('image/png')
  } catch {
    return null
  }
}
const getLivingCombatants = (combatants) => (combatants ?? []).filter(isCombatantAbleToBattle)
const getFastestCombatantSpeed = (combatants) =>
  Math.max(
    1,
    ...getLivingCombatants(combatants).map((combatant) => Math.max(1, combatant?.speed ?? 1))
  )
const getRunChanceValue = ({ party, activeAllyIds, enemies, attemptCount = 1 }) => {
  const activeAllies = (activeAllyIds ?? [])
    .map((allyId) => getCombatantById(party, allyId))
    .filter(isCombatantAbleToBattle)
  const runnerSpeed = getFastestCombatantSpeed(activeAllies.length ? activeAllies : party)
  const enemySpeed = getFastestCombatantSpeed(enemies)

  if (runnerSpeed > enemySpeed) {
    return 256
  }

  return Math.floor((runnerSpeed * 128) / Math.max(1, enemySpeed) + attemptCount * 30)
}
const rollRunAttempt = ({ party, activeAllyIds, enemies, attemptCount }) => {
  const chanceValue = getRunChanceValue({ party, activeAllyIds, enemies, attemptCount })

  return chanceValue >= 256 || Math.floor(Math.random() * 256) < chanceValue
}
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
const getFirstLivingPartyMember = (party, preferredIds = []) => {
  const currentParty = party ?? []
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

      return isCombatantAbleToBattle(member) && !actedIdSet.has(memberId)
    }) ?? null
  )
}
const normalizeBuffState = (activeBuffs) =>
  BUFFABLE_STAT_KEYS.reduce((result, statKey) => {
    const nextValue = Math.max(0, Math.floor(activeBuffs?.[statKey] ?? 0))
    result[statKey] = Math.min(BUFF_STAGE_DURATION, nextValue)
    return result
  }, {})

const normalizeBattleStatModifiers = (statModifiers) =>
  BUFFABLE_STAT_KEYS.reduce((result, statKey) => {
    const modifier = statModifiers?.[statKey]
    const turns = Math.max(0, Math.min(BATTLE_STAT_MODIFIER_DURATION, Math.floor(modifier?.turns ?? 0)))
    const multiplier = Number.isFinite(modifier?.multiplier) ? modifier.multiplier : 1

    result[statKey] = turns > 0 && multiplier > 0 ? { turns, multiplier } : null
    return result
  }, {})

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
  item?.ignoreLevelCap ? MAX_DIGIMON_LEVEL : levelCap

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
        currentHp: Math.min(member.maxHp, member.currentHp + rewardItem.partyHealAmount),
      }
    }

    return member
  })

const applyInstantRewardEffect = (player, rewardItem, levelCap = Infinity) => {
  if (!player) {
    return {
      nextPlayer: player,
      shouldStore: true,
    }
  }

  if (rewardItem?.buffStatKey) {
    const nextActiveBuffs = {
      ...normalizeBuffState(player.activeBuffs),
      [rewardItem.buffStatKey]: BUFF_STAGE_DURATION,
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
      currentHp: Math.min(player.maxHp, player.currentHp + rewardItem.healAmount),
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
      item?.evolutionReturn
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
    if (!member?.name || isCombatantEgg(member)) {
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
    if (!member?.name || (materialCounts[member.name] ?? 0) <= 0) {
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
    const currentStageRank = getDigimonStageRank(combatant.speciesStage)

    return Boolean(
      targetData &&
        combatant.speciesData?.진화가능?.includes(item.evolutionItemFor) &&
        targetData.이름 !== combatant.name &&
        getDigimonStageRank(targetData.stage) >= currentStageRank
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

const canRandomRewardItemAppear = (item, inventory = {}, rewardTarget = null, levelCap = Infinity) => {
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

  if (ROGUE_REWARD_ITEM_IDS.has(item.id) || ROGUE_DIGI_EGG_NAMES.has(item.digiEggName)) {
    return 'rogue'
  }

  if (MASTER_REWARD_ITEM_IDS.has(item.id)) {
    return 'master'
  }

  return 'common'
}

const selectWeightedRewardRarity = (items) => {
  const availableWeights = REWARD_RARITY_WEIGHTS.filter(({ key }) =>
    items.some((item) => getRewardItemRarity(item) === key)
  )
  const totalWeight = availableWeights.reduce((total, rarity) => total + rarity.weight, 0)
  let roll = Math.random() * totalWeight

  for (const rarity of availableWeights) {
    roll -= rarity.weight

    if (roll <= 0) {
      return rarity.key
    }
  }

  return availableWeights[availableWeights.length - 1]?.key ?? 'common'
}

const selectRandomRewardItemsByRarity = (items, count = 3) => {
  const selectedItems = []
  let candidates = [...items]

  while (selectedItems.length < count && candidates.length > 0) {
    const selectedRarity = selectWeightedRewardRarity(candidates)
    const rarityCandidates = candidates.filter((item) => getRewardItemRarity(item) === selectedRarity)
    const selectedItem = shuffleItems(rarityCandidates)[0] ?? shuffleItems(candidates)[0]

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
const DAMAGE_TEXT_DURATION_MS = 920
const HIT_EFFECT_SEQUENCE_INTERVAL_MS = 1000
const ATTACK_MOTION_DURATION_MS = 760
const PROJECTILE_EFFECT_DURATION_MS = 620
const RUN_STAGE_ADVANCE_DELAY_MS = 650

const hitEffectAttributeClassMap = {
  화염: 'fire',
  불: 'fire',
  물: 'water',
  나무: 'wood',
  풀: 'wood',
  흙: 'earth',
  땅: 'earth',
  번개: 'electric',
  전기: 'electric',
  얼음: 'ice',
  바람: 'wind',
  강철: 'steel',
  금속: 'steel',
  빛: 'light',
  어둠: 'dark',
  무: 'neutral',
}

const getHitEffectAttributeClass = (attribute) =>
  hitEffectAttributeClassMap[String(attribute ?? '무').trim()] ?? 'neutral'

const babySkillVisualEffectClassMap = {
  '글레어 아이': 'baby-glare-eye',
  '다이아몬드 더스트': 'baby-diamond-dust',
  '독성 거품': 'baby-toxic-bubbles',
  '뜨거운 숨결': 'baby-hot-breath',
  변신: 'baby-metamorphosis',
  '비누 거품': 'baby-soap-bubbles',
  '산성 거품': 'baby-acid-bubbles',
  스모크: 'baby-smoke',
  '시드 크래커': 'baby-seed-cracker',
  '엔젤 더스트': 'baby-angel-dust',
  '열기를 띤 거품': 'baby-heated-bubbles',
  '작은 쇳가루': 'baby-metal-filings',
  '재밍 파우더': 'baby-jamming-powder',
  '점성 거품': 'baby-sticky-bubbles',
  '푸와 페더': 'baby-puwa-feather',
  '버블 봄': 'baby-bubble-bomb',
  푸슈: 'baby-pushu',
  '아기 젖꼭지': 'baby-pacifier',
}

const childSkillVisualEffectClassMap = {
  거품: 'child-bubbles',
  '공기 거품': 'child-air-bubble',
  꼬마불꽃주먹: 'child-flame-fist',
  '네일 스크래치': 'child-nail-scratch',
  '더블 버블': 'child-double-bubble',
  '따끔따끔 스파크': 'child-prickly-spark',
  '메탈 드롭': 'child-metal-drop',
  물어뜯기: 'child-bite',
  살생석: 'child-killing-stone',
  '샤본 플라워': 'child-shabon-flower',
  '쇼크 샤우트': 'child-shock-shout',
  '스마일 팡': 'child-smile-fang',
  '신축성 거품': 'child-elastic-bubble',
  '엔젤 링': 'child-angel-ring',
  파인콘: 'child-pinecone',
  '포로로 브리즈': 'child-pororo-breeze',
  '폭스 테일': 'child-fox-tail',
  '하울링 헤르츠': 'child-howling-hertz',
  '핫 가스': 'child-hot-gas',
  '핫 바이트': 'child-hot-bite',
  '홉 어택': 'child-hop-attack',
  '뾰족뾰족 어택': 'child-spiky-attack',
  '미사일 크래시': 'child-missile-crash',
  '페인트 스플레시': 'child-paint-splash',
  삐약삐약: 'child-peep',
  '따끔따끔 롤링': 'child-prickly-rolling',
}

const stageSkillVisualEffectLookup = new Map(
  [
    ...growthSkillData.map((skillData) => [
      skillData.기술명,
      { skillData, stage: 'rookie' },
    ]),
    ...matureSkillData.map((skillData) => [
      skillData.기술명,
      { skillData, stage: 'mature' },
    ]),
    ...perfectSkillData.map((skillData) => [
      skillData.기술명,
      { skillData, stage: 'perfect' },
    ]),
    ...ultimateSkillData.map((skillData) => [
      skillData.기술명,
      { skillData, stage: 'ultimate' },
    ]),
    ...superUltimateSkillData.map((skillData) => [
      skillData.기술명,
      { skillData, stage: 'super-ultimate' },
    ]),
  ].filter(([skillName]) => Boolean(skillName))
)

const stageSkillAttributeMotifMap = {
  화염: 'flame',
  불: 'flame',
  번개: 'electric',
  전기: 'electric',
  물: 'water',
  얼음: 'ice',
  바람: 'wind',
  나무: 'plant',
  풀: 'plant',
  강철: 'metal',
  금속: 'metal',
  흙: 'rock',
  땅: 'rock',
  빛: 'summon',
  어둠: 'nightmare',
}

const stageSkillMotifConfigMap = {
  blast: { hue: 210, secondaryHue: 35, width: 38, height: 38, radius: '50%' },
  bite: { hue: 24, secondaryHue: 44, width: 46, height: 30, radius: '52% 48% 46% 54%' },
  bubble: { hue: 190, secondaryHue: 165, width: 44, height: 34, radius: '58% 42% 62% 38%' },
  color: { hue: 312, secondaryHue: 54, width: 48, height: 32, radius: '50%' },
  electric: { hue: 55, secondaryHue: 188, width: 52, height: 24, radius: '4px' },
  feather: { hue: 150, secondaryHue: 190, width: 58, height: 20, radius: '100% 8% 100% 8%' },
  fist: { hue: 28, secondaryHue: 7, width: 46, height: 32, radius: '62% 38% 58% 42%' },
  flame: { hue: 18, secondaryHue: 45, width: 48, height: 34, radius: '60% 42% 58% 42%' },
  guard: { hue: 205, secondaryHue: 48, width: 42, height: 42, radius: '24% 24% 46% 46%' },
  horn: { hue: 42, secondaryHue: 15, width: 46, height: 34, radius: '50% 12% 50% 12%' },
  ice: { hue: 198, secondaryHue: 220, width: 34, height: 52, radius: '8px' },
  metal: { hue: 208, secondaryHue: 218, width: 52, height: 26, radius: '12px' },
  nightmare: { hue: 265, secondaryHue: 320, width: 46, height: 34, radius: '50%' },
  plant: { hue: 112, secondaryHue: 56, width: 44, height: 30, radius: '70% 8% 70% 8%' },
  powder: { hue: 55, secondaryHue: 130, width: 48, height: 32, radius: '50%' },
  rock: { hue: 32, secondaryHue: 18, width: 38, height: 34, radius: '26% 48% 32% 52%' },
  roll: { hue: 210, secondaryHue: 56, width: 44, height: 44, radius: '50%' },
  shell: { hue: 176, secondaryHue: 214, width: 48, height: 34, radius: '24% 54% 34% 54%' },
  slash: { hue: 210, secondaryHue: 35, width: 58, height: 22, radius: '4px' },
  sound: { hue: 52, secondaryHue: 198, width: 62, height: 38, radius: '50%' },
  summon: { hue: 48, secondaryHue: 272, width: 48, height: 48, radius: '50%' },
  thread: { hue: 160, secondaryHue: 210, width: 58, height: 22, radius: '999px' },
  water: { hue: 194, secondaryHue: 218, width: 52, height: 28, radius: '999px' },
  wind: { hue: 172, secondaryHue: 205, width: 64, height: 20, radius: '999px' },
}

const stageSkillStageConfigMap = {
  rookie: {
    hueOffset: 0,
    secondaryHueOffset: 0,
    widthBoost: 0,
    heightBoost: 0,
    accentBoost: 0,
  },
  mature: {
    hueOffset: 14,
    secondaryHueOffset: 18,
    widthBoost: 14,
    heightBoost: 10,
    accentBoost: 6,
  },
  perfect: {
    hueOffset: 28,
    secondaryHueOffset: 36,
    widthBoost: 26,
    heightBoost: 18,
    accentBoost: 12,
  },
  ultimate: {
    hueOffset: 48,
    secondaryHueOffset: 58,
    widthBoost: 38,
    heightBoost: 26,
    accentBoost: 18,
  },
  'super-ultimate': {
    hueOffset: 72,
    secondaryHueOffset: 84,
    widthBoost: 52,
    heightBoost: 36,
    accentBoost: 26,
  },
}

const stageSkillMotifRules = [
  {
    motif: 'nightmare',
    patterns: [
      '나이트메어',
      '드림',
      '디 ･ 슈르넨',
      '아이 오브',
      '다크',
      '데스',
      '데빌',
      '데들리',
      '헬즈',
      '공포',
      '최면',
      '미드나이트',
      '셰이드',
      '섀도',
      '죽음',
      '레이드',
      '신드롬',
      '데드',
      '얼라이브',
      '블러디',
      '암흑',
      '어둠',
      '저주',
      '오블리비언',
      '파라다이스 로스트',
      '판도라',
      '포이즌',
      '헬리',
      '블랙 매터',
      '다크니스',
      '데몬즈',
      '로스트',
      '로스트룸',
      '베놈',
      '메가 데스',
      '블랙 데스',
      '테러',
      '팬텀',
      '데프스',
      '디스페어',
      '카오스',
      '케이오스',
      '사바스',
      '스포커',
      '스토커',
      '다크네스',
      '카니발',
    ],
  },
  {
    motif: 'flame',
    patterns: [
      '파이어',
      '플레임',
      '불꽃',
      '화염',
      '토이 플레임',
      '볼케이노',
      '메가파이어',
      '메가화염',
      '불 뿜기',
      '불타는',
      '호염룡',
      '페트라 파이어',
      '푸른화염포',
      '아나키스트 플레임',
      '파이어 페더',
      '블루 플레어',
      '화염볼',
      '매드니스 파이어',
      '이그저스트 플레임',
      '도깨비 불',
      '래비드 파이어',
      '마스터 파이어',
      '메테오 플레임',
      '블레이즈',
      '콜드 플레임',
      '버밀리온',
      '가이아',
      '버닝',
      '프로미넌스',
      '오거 플레임',
      '인페르노',
      '화력',
      '그랑 ･ 델 ･ 솔',
      '홀리 플레어',
      '버너',
      '블루머더',
      '코로나',
      '퍼가토리얼 플레임',
      '블레이즈',
      '레스팅',
    ],
  },
  {
    motif: 'electric',
    patterns: [
      '썬더',
      '전기',
      '라이트닝',
      '스파크',
      '쇼크',
      '침봉',
      '기어 스팅거',
      '번개',
      '번쩍',
      '볼트',
      '스턴',
      '블리츠크리그',
      '묠니르',
      '번개창',
      '해머 스파크',
      '라이트닝',
      '녹다운',
      '파일',
      '헥썬더',
      '버니어',
      '일렉',
      '플라즈마',
      '마볼트',
      '프라즈먼트',
      '퍼니시 저지',
      '뇌광',
    ],
  },
  {
    motif: 'ice',
    patterns: [
      '아이스',
      '헤일',
      '빙빙',
      '블레이징',
      '얼음',
      '영도',
      '프로즌',
      '아이시클',
      '미스트',
      '팬텀',
      '빙월아',
      '프리저',
      '프로스트',
      '코큐토스',
      '블리자드',
      '아크틱',
      '크리스탈',
    ],
  },
  {
    motif: 'wind',
    patterns: [
      '타이푼',
      '트위스터',
      '회오리',
      '폭풍',
      '선풍',
      '윙',
      '게일',
      '진공',
      '카마이타치',
      '수리검 날개',
      '메테오 윙',
      '유성 폭풍',
      '토네이도',
      '스카이',
      '소닉',
      '블래스트',
      '지가 스톰',
      '다크 스톰',
      '일륜의 춤',
      '효광일섬',
      '볼텍스',
      '사이크론',
      '허리케인',
      '플라이',
      '황금날개',
      '스트림',
    ],
  },
  { motif: 'feather', patterns: ['깃털', '날개', '부리', '팔코', '플롯트'] },
  {
    motif: 'plant',
    patterns: [
      '넛츠',
      '시드',
      '아이비',
      '대나무',
      '프루츠',
      '호엽',
      '라라',
      '브랜치',
      '선인장',
      '홍당무',
      '리프',
      '태양 광선',
      '꽃잎',
      '폴렌',
      '체리',
      '로열 너츠',
      '로제스',
      '레이피어',
      '페탈',
      '쏜',
      '위프',
      '바이올런트 퍼니셔',
      '스프라우트',
      '위스렌',
      '발레 건',
    ],
  },
  {
    motif: 'powder',
    patterns: [
      '꽃가루',
      '파우더',
      '자장가',
      '치즈',
      '더스트',
      '참',
      '판타지아',
      '미러 더스트',
      '드림 더스트',
      '스마일리',
      '세레나데',
      '러블리',
      '하트 브레이크',
      '프리티',
      '트릭 오어 트릿',
      'LOVE YOU',
      '러브',
      '유혹',
      '플래티넘',
      '바나나',
      '슬립',
      '테라피',
      '생명의키스',
    ],
  },
  { motif: 'thread', patterns: ['그물', '실크', '스레드', '전기 실', '거미줄', '네트워크'] },
  {
    motif: 'metal',
    patterns: [
      '메탈',
      '캐논',
      '톱니',
      'M16',
      'DCD',
      '포인터',
      '기어',
      '레이저',
      '스틸',
      '아이언',
      '틴',
      '그레네이드',
      '드릴',
      '스나이프',
      '스카우터',
      '파워 메탈',
      '팡팡레이저',
      '파괴',
      '디스트럭션',
      '디스트로이',
      '디스트로이어',
      '뉴클리어',
      '레그 리볼버',
      '로켓',
      '레이저포',
      '아토믹',
      '블래스터',
      '하울링 캐논',
      '플러그 봄',
      '메탈리카',
      '딥 퍼플',
      '보링',
      '로더',
      '수류탄',
      '∞',
      '무한',
      '미사일',
      '블릿',
      '불릿',
      '스테이크',
      '호넷 이레이저',
      '포지트론',
      '하이퍼 무한',
      '키를리안',
      '라이징 ･ 선',
    ],
  },
  { motif: 'bubble', patterns: ['버블', '거품'] },
  {
    motif: 'water',
    patterns: [
      '워터',
      '물고기',
      '스크류',
      '테일',
      '핀',
      '브라인',
      '러시',
      '아쿠아',
      '넵튠',
      '프레셔',
      '샤워',
      '타이달',
      '웨이브',
      '수류',
      '아시파트라바나',
      '오션',
      '애틀랜틱',
      '댐',
      '디멘션 시저',
      '파이널 ･ 엘리시온',
    ],
  },
  {
    motif: 'rock',
    patterns: [
      '록',
      '돌',
      '폭탄',
      '크랙',
      '퀘이크',
      '본',
      '보머',
      '응가',
      '덩크',
      '투척',
      '크랙',
      '봄버',
      '봄',
      '해머 크러시',
      '그래비티',
      '엑스크리먼트',
      '피라미드',
      '그라운드',
      '지진',
      '암공',
      '크래처',
      '인텐스',
      '디비전',
    ],
  },
  {
    motif: 'slash',
    patterns: [
      '시클',
      '검',
      '블레이드',
      '슬래시',
      '절공참',
      '구렬공참',
      '수아란격',
      '제비',
      '비검',
      '크림슨',
      '엣지',
      '블레이드',
      '슬라이서',
      '양날검',
      '영혼가르기',
      '세이버',
      '에지',
      '커팅',
      '범필섬',
      '천만의 태도',
      '아메노무라쿠모',
      '참인',
      '브레이커',
      '세이버',
      '레이피어',
      '태도',
      '성검',
      '엑스칼리버',
      '그레이 소드',
      '트럼프검',
      '펜릴 소드',
      '철검',
      '소닉 슬래시',
      '엣지 블리자드',
      '코스모 블레이드',
      '오메가 블레이드',
      '하켄 슬래셔',
      '왕룡검',
      '그레이달파',
      '사이즈',
    ],
  },
  {
    motif: 'bite',
    patterns: [
      '바이트',
      '송곳니',
      '팡',
      '클로',
      '스크래치',
      '네일',
      '주사기',
      '크런치',
      '물어뜯기',
      '크로우',
      '스컬',
      '칼립바이트',
      '애니멀 네일',
      '카이저 네일',
      '이레이즈 클로',
      '스크랩리스 클로',
      '프로즌 클로',
      '길티 크로우',
      '다크니스 크로우',
      '디스트로이 크로우',
      '레이븐 클로',
      '게일 클로',
      '네일 크러셔',
      '칼립바이트',
      '하이랜드 팡',
      '그라운드 팡',
    ],
  },
  {
    motif: 'horn',
    patterns: [
      '호른',
      '투구',
      '램',
      '뿔',
      '대뿔',
      '트러스트',
      '트라이던트',
      '앵커',
      '랜스',
      '스파이크',
      '재블린',
      '피어',
      '찌르기',
      '스팅거',
      '토마호크',
    ],
  },
  {
    motif: 'guard',
    patterns: ['등껍질', '가드', '철갑', '미러 가드', '황금 갑옷', '버프', '필드', '결계'],
  },
  { motif: 'roll', patterns: ['회전', '구르기', '빙빙'] },
  {
    motif: 'roll',
    patterns: [
      '스핀',
      '스피닝',
      '풀 스로틀',
      '대회전',
      '메리 고 라운드',
      '마스커레이드',
      '스트라이크 롤',
      '스파이럴',
      '자이로',
      '파이널 스트라이크 롤',
    ],
  },
  {
    motif: 'fist',
    patterns: [
      '주먹',
      '펀치',
      '백핸드',
      '때리기',
      '태클',
      '헤딩',
      '다이브',
      '가르기',
      '베기',
      '권',
      '너클',
      '핸드',
      '슬랩',
      '배싱',
      '블로',
      '임팩트',
      '내려치기',
      '망치',
      '차지',
      '강타',
      '슬랩',
      '스트라이크',
      '어택',
      '크러시',
      '프레스',
      '다이브',
      '차징',
      '비트 프레스',
      '임팩트',
      '킥',
      '액셀 암',
      '크리티컬 암',
      '트리니티 암',
      '블리츠 암',
      '스매시',
      '최후의일격',
      '보름달 유성 충격',
      '레이지',
      '레오파드 모드',
      '격앙',
      '어썸 링 잭',
    ],
  },
  {
    motif: 'sound',
    patterns: [
      '외침',
      '친구',
      '공기 팡',
      '호변허',
      '호엽설',
      '포효',
      '하울링',
      '레름',
      '로어',
      '에코',
      '심포니',
      '초음파',
      '사무라이 톤',
      '왈츠',
      '드래곤즈 로어',
    ],
  },
  {
    motif: 'summon',
    patterns: [
      '그랜드 크로스',
      '서몬',
      '이합도',
      '절광충',
      '트리플렉스 포스',
      '헤븐즈',
      '솔 샷',
      '솔 블로',
      '트윙클',
      '광선',
      '골든 트라이앵글',
      '노던 크로스',
      '천국',
      '니르바나',
      '미카후츠노카미',
      '니기미타마',
      '아라미타마',
      '에니그마',
      '게니아스',
      '메테오 럭스',
      '금강계만다라',
      '태장계만다라',
      '글로리어스',
      '디지털라이즈',
      '오브 ･ 소울',
      '샤이닝',
      '스타라이트',
      '아우스',
      '람프란투스',
      '엘리시온',
      '퍼지 샤인',
      '헤븐즈',
      '저스티스',
      '제로 헤븐스',
      '디바인',
      '아발론',
      '팬드래곤즈 글로리',
      '샤리테',
      '무녀의 결계',
      '홀리',
    ],
  },
  { motif: 'color', patterns: ['컬러풀', '화려', '원색'] },
]

const skillDetailVisualEffectRules = [
  {
    detail: 'cross',
    patterns: [
      '그랜드 크로스',
      '노던 크로스',
      '세븐 헤븐즈',
      '금강계만다라',
      '태장계만다라',
      '트리플렉스 포스',
      '디지털라이즈 ･ 오브 ･ 소울',
      '제로 헤븐스',
      '디바인',
      '팬드래곤즈 글로리',
      '람프란투스',
    ],
  },
  {
    detail: 'cannon',
    patterns: [
      '캐논',
      '블래스터',
      '블래스트',
      '디스트로이어',
      '디스트럭션',
      '무한',
      '∞',
      '지드 포',
      '파동포',
      '발사',
    ],
  },
  {
    detail: 'laser',
    patterns: ['레이저', '광선', '빔', '포지트론', '뉴클리어', '아토믹', '퀄리얼라이즈'],
  },
  {
    detail: 'missile',
    patterns: ['미사일', '로켓', '그레네이드', '수류탄', 'DCD', '봄버', '플러그 봄'],
  },
  {
    detail: 'bomb',
    patterns: ['폭탄', '봄', '크랙', '퀘이크', '크래처', '어나이얼레이션', '그레네이드 스톰'],
  },
  {
    detail: 'breath',
    patterns: ['브레스', '불 뿜기', '화염포', '푸른화염포', '코큐토스', '와이번'],
  },
  {
    detail: 'blade',
    patterns: [
      '소드',
      '검',
      '세이버',
      '블레이드',
      '슬래시',
      '슬라이서',
      '에지',
      '엣지',
      '커팅',
      '태도',
      '참',
      '양단',
      '엑스칼리버',
      '무라쿠모',
      '사이즈',
    ],
  },
  {
    detail: 'claw',
    patterns: [
      '클로',
      '네일',
      '크로우',
      '팡',
      '바이트',
      '물어뜯기',
      '크런치',
      '토리드 바이스',
    ],
  },
  {
    detail: 'pierce',
    patterns: ['랜스', '창', '재블린', '피어', '스팅거', '스파이크', '찌르기', '트라이던트', '앵커', '호른', '뿔'],
  },
  {
    detail: 'impact',
    patterns: [
      '펀치',
      '주먹',
      '권',
      '너클',
      '킥',
      '태클',
      '강타',
      '스매시',
      '차지',
      '임팩트',
      '프레스',
      '해머',
      '망치',
      '모닝스타',
      '최후의일격',
    ],
  },
  {
    detail: 'spiral',
    patterns: ['토네이도', '사이크론', '허리케인', '회전', '스핀', '스파이럴', '볼텍스', '대회전', '롤'],
  },
  {
    detail: 'wave',
    patterns: ['웨이브', '샤워', '오션', '아쿠아', '워터', '타이달', '댐', '수류', '언듈레이션'],
  },
  { detail: 'bubble', patterns: ['버블', '거품', '솝', '비눗방울'] },
  {
    detail: 'thunder',
    patterns: ['썬더', '번개', '라이트닝', '일렉', '플라즈마', '볼트', '스파크', '뇌광', '전기'],
  },
  {
    detail: 'flame',
    patterns: ['파이어', '플레임', '화염', '불꽃', '버닝', '코로나', '가이아', '인페르노', '프로미넌스', '버너'],
  },
  {
    detail: 'ice',
    patterns: ['아이스', '얼음', '블리자드', '프로스트', '프리저', '크리스탈', '빙', '영도', '아이시클', '아크틱'],
  },
  {
    detail: 'poison',
    patterns: ['포이즌', '독', '톡신', '베놈', '애시드', '산성', '푸르츠 플레셰트'],
  },
  {
    detail: 'powder',
    patterns: ['파우더', '더스트', '미스트', '꽃가루', '폴렌', '스포어', '가루', '최면', '참'],
  },
  {
    detail: 'plant',
    patterns: ['시드', '꽃잎', '브랜치', '리프', '넛츠', '페탈', '쏜', '위프', '선인장', '홍당무', '위스렌'],
  },
  { detail: 'thread', patterns: ['그물', '거미줄', '실크', '스레드', '네트워크'] },
  {
    detail: 'sound',
    patterns: ['외침', '포효', '하울링', '로어', '초음파', '심포니', '에코', '톤', '왈츠', '세레나데', '레름'],
  },
  {
    detail: 'dark',
    patterns: [
      '다크',
      '데스',
      '나이트메어',
      '블랙',
      '헬',
      '로스트',
      '카오스',
      '케이오스',
      '악',
      '저주',
      '디스페어',
      '사바스',
      '스토커',
    ],
  },
  {
    detail: 'light',
    patterns: ['천국', '홀리', '헤븐', '샤인', '빛', '글로리어스', '샤이닝', '스타라이트', '퍼지 샤인', 'LOVE YOU'],
  },
  {
    detail: 'data',
    patterns: ['데이터', '디지털', '네트워크', '크로노', '타임', '디멘션', '에니그마', '게니아스'],
  },
  {
    detail: 'cosmic',
    patterns: ['메테오', '유성', '스타', '코스모', '우주', '퀘이사', '오로라', '루나', '보름달', '그라비티', '그래비티'],
  },
  {
    detail: 'shield',
    patterns: ['가드', '방패', '갑옷', '힐링', '큐어', '필드', '결계', '테라피', '버프', '황금 갑옷'],
  },
  {
    detail: 'heart',
    patterns: ['러브', '하트', '스마일', '프리티', '키스', '유혹', '러블리'],
  },
  {
    detail: 'feather',
    patterns: ['깃털', '날개', '윙', '페더', '버드', '피닉스', '레이븐'],
  },
]

const skillDetailAttributeMap = {
  화염: 'flame',
  번개: 'thunder',
  전기: 'thunder',
  물: 'wave',
  얼음: 'ice',
  바람: 'spiral',
  나무: 'plant',
  풀: 'plant',
  강철: 'cannon',
  금속: 'cannon',
  흙: 'bomb',
  땅: 'bomb',
  빛: 'light',
  어둠: 'dark',
}

const stageSkillVisualEffectProfileCache = new Map()
const skillDetailVisualEffectProfileCache = new Map()

const getPositiveStringHash = (value) => {
  let hash = 0
  for (const character of String(value ?? '')) {
    hash = (hash * 31 + character.codePointAt(0)) >>> 0
  }
  return hash
}

const createHslColor = (hue, saturation = 82, lightness = 62, alpha = 1) =>
  `hsl(${Math.round(hue % 360)} ${saturation}% ${lightness}% / ${alpha})`

const getSkillDetailVisualEffectProfile = (skillName) => {
  const normalizedSkillName = String(skillName ?? '').trim()

  if (!normalizedSkillName) {
    return null
  }

  const cachedProfile = skillDetailVisualEffectProfileCache.get(normalizedSkillName)
  if (cachedProfile) {
    return cachedProfile
  }

  const skillData =
    stageSkillVisualEffectLookup.get(normalizedSkillName)?.skillData ??
    allSkillLookup.get(normalizedSkillName)
  const matchedDetails = skillDetailVisualEffectRules
    .filter((rule) => rule.patterns.some((pattern) => normalizedSkillName.includes(pattern)))
    .map((rule) => rule.detail)
  const attributeDetail = skillDetailAttributeMap[String(skillData?.속성 ?? '').trim()]
  const detailNames = [matchedDetails[0] ?? attributeDetail ?? 'impact']
  const hash = getPositiveStringHash(normalizedSkillName)
  const detailHue = 24 + (hash % 320)
  const detailProfile = {
    className: ['skill-vfx-detail', ...detailNames.map((detail) => `skill-vfx-detail--${detail}`)]
      .filter(Boolean)
      .join(' '),
    style: {
      '--detail-rotate': `${((hash >>> 3) % 72) - 36}deg`,
      '--detail-rotate-alt': `${((hash >>> 9) % 96) - 48}deg`,
      '--detail-spread': `${24 + (hash % 24)}px`,
      '--detail-spread-alt': `${18 + ((hash >>> 5) % 30)}px`,
      '--detail-core-scale': (1 + ((hash >>> 6) % 7) * 0.03).toFixed(2),
      '--detail-primary-fallback': createHslColor(detailHue, 86, 64),
      '--detail-secondary-fallback': createHslColor(detailHue + 52, 88, 68),
      '--detail-accent-fallback': createHslColor(detailHue + 104, 94, 74),
    },
  }

  skillDetailVisualEffectProfileCache.set(normalizedSkillName, detailProfile)
  return detailProfile
}

const getStageSkillMotif = (skillName, skillData) => {
  const normalizedSkillName = String(skillName ?? '').trim()
  const matchedRule = stageSkillMotifRules.find((rule) =>
    rule.patterns.some((pattern) => normalizedSkillName.includes(pattern))
  )

  if (matchedRule) {
    return matchedRule.motif
  }

  return stageSkillAttributeMotifMap[String(skillData?.속성 ?? '').trim()] ?? 'blast'
}

const getStageSkillVisualEffectProfile = (skillName) => {
  const normalizedSkillName = String(skillName ?? '').trim()
  const skillEntry = stageSkillVisualEffectLookup.get(normalizedSkillName)
  const skillData = skillEntry?.skillData

  if (!skillData) {
    return null
  }

  const cachedProfile = stageSkillVisualEffectProfileCache.get(normalizedSkillName)
  if (cachedProfile) {
    return cachedProfile
  }

  const stageConfig =
    stageSkillStageConfigMap[skillEntry.stage] ?? stageSkillStageConfigMap.rookie
  const motif = getStageSkillMotif(normalizedSkillName, skillData)
  const config = stageSkillMotifConfigMap[motif] ?? stageSkillMotifConfigMap.blast
  const hash = getPositiveStringHash(normalizedSkillName)
  const hueShift = (hash % 31) - 15 + stageConfig.hueOffset
  const secondaryShift = ((hash >>> 5) % 45) - 22 + stageConfig.secondaryHueOffset
  const sizeShift = (hash % 5) * 2
  const width = config.width + sizeShift + stageConfig.widthBoost
  const height = config.height + ((hash >>> 3) % 5) * 2 + stageConfig.heightBoost
  const accentDistance = 22 + (hash % 10) + stageConfig.accentBoost
  const rotate = ((hash >>> 7) % 56) - 28
  const slug = `r${hash.toString(36)}`
  const stageSpecificClassNames =
    skillEntry.stage === 'rookie'
      ? [`skill-vfx--rookie-${slug}`]
      : [
          `skill-vfx--${skillEntry.stage}`,
          `skill-vfx--${skillEntry.stage}-${motif}`,
          `skill-vfx--${skillEntry.stage}-${slug}`,
        ]
  const profile = {
    className: ['skill-vfx--rookie', `skill-vfx--rookie-${motif}`, ...stageSpecificClassNames]
      .filter(Boolean)
      .join(' '),
    style: {
      '--rookie-primary': createHslColor(config.hue + hueShift),
      '--rookie-secondary': createHslColor(config.secondaryHue + secondaryShift, 88, 66),
      '--rookie-accent': createHslColor(config.hue + 58 + hueShift, 94, 74),
      '--rookie-projectile-width': `clamp(${Math.max(24, width - 14)}px, ${(width / 12).toFixed(2)}vw, ${width + 12}px)`,
      '--rookie-projectile-height': `clamp(${Math.max(18, height - 10)}px, ${(height / 12).toFixed(2)}vw, ${height + 10}px)`,
      '--rookie-radius': config.radius,
      '--rookie-rotate': `${rotate}deg`,
      '--rookie-accent-a-x': `${-accentDistance}px`,
      '--rookie-accent-a-y': `${-12 - ((hash >>> 4) % 12)}px`,
      '--rookie-accent-b-x': `${14 + ((hash >>> 8) % 16)}px`,
      '--rookie-accent-b-y': `${-8 + ((hash >>> 2) % 18)}px`,
      '--rookie-accent-c-x': `${-6 + ((hash >>> 6) % 14)}px`,
      '--rookie-accent-c-y': `${18 + ((hash >>> 10) % 14)}px`,
      '--rookie-hit-rotate': `${rotate * -1}deg`,
    },
  }

  stageSkillVisualEffectProfileCache.set(normalizedSkillName, profile)
  return profile
}

const skillVisualEffectClassMap = {
  ...babySkillVisualEffectClassMap,
  ...childSkillVisualEffectClassMap,
}

const getSkillVisualEffectClass = (skillName) => {
  const normalizedSkillName = String(skillName ?? '').trim()
  const visualEffectClass = skillVisualEffectClassMap[normalizedSkillName]
  const detailClassName = getSkillDetailVisualEffectProfile(normalizedSkillName)?.className ?? ''

  if (!visualEffectClass) {
    return [
      getStageSkillVisualEffectProfile(normalizedSkillName)?.className ?? '',
      detailClassName,
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [`skill-vfx--${visualEffectClass}`, detailClassName].filter(Boolean).join(' ')
}

const getSkillVisualEffectStyle = (skillName) => {
  const visualEffectStyle = {
    ...(getStageSkillVisualEffectProfile(skillName)?.style ?? {}),
    ...(getSkillDetailVisualEffectProfile(skillName)?.style ?? {}),
  }

  return Object.keys(visualEffectStyle).length > 0 ? visualEffectStyle : null
}

const mergeEffectStyles = (...styles) => {
  const mergedStyle = styles.reduce(
    (result, style) => (style ? { ...result, ...style } : result),
    {}
  )

  return Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined
}

const getAttackMotionStyle = (attackMotion) =>
  Number.isFinite(attackMotion?.lungeDistance)
    ? { '--attack-lunge-distance': `${attackMotion.lungeDistance}px` }
    : undefined

const isSpecialAttackCategory = (category) => category === '특수형' || category === '마법'

const getHitEffectClassName = (effect) =>
  [
    'hit-effect',
    `hit-effect--${getHitEffectAttributeClass(effect?.attribute)}`,
    isSpecialAttackCategory(effect?.category) ? 'hit-effect--special' : 'hit-effect--physical',
    getSkillVisualEffectClass(effect?.skillName),
  ]
    .filter(Boolean)
    .join(' ')

const getProjectileEffectClassName = (effect) =>
  [
    'skill-projectile',
    `skill-projectile--${getHitEffectAttributeClass(effect?.attribute)}`,
    isSpecialAttackCategory(effect?.category) ? 'skill-projectile--special' : 'skill-projectile--physical',
    getSkillVisualEffectClass(effect?.skillName),
  ]
    .filter(Boolean)
    .join(' ')

let battleSfxAudioContext = null

const battleAttackSoundProfiles = {
  fire: {
    wave: 'sawtooth',
    base: 170,
    accent: 780,
    impact: 118,
    filter: 1450,
    noise: 1850,
  },
  water: {
    wave: 'sine',
    base: 290,
    accent: 520,
    impact: 185,
    filter: 980,
    noise: 720,
  },
  wood: {
    wave: 'triangle',
    base: 230,
    accent: 390,
    impact: 150,
    filter: 1250,
    noise: 1050,
  },
  earth: {
    wave: 'square',
    base: 92,
    accent: 150,
    impact: 74,
    filter: 620,
    noise: 520,
  },
  electric: {
    wave: 'square',
    base: 620,
    accent: 1180,
    impact: 430,
    filter: 2600,
    noise: 3100,
  },
  ice: {
    wave: 'triangle',
    base: 520,
    accent: 940,
    impact: 260,
    filter: 2200,
    noise: 2450,
  },
  wind: {
    wave: 'sine',
    base: 340,
    accent: 760,
    impact: 210,
    filter: 1800,
    noise: 1900,
  },
  steel: {
    wave: 'square',
    base: 180,
    accent: 980,
    impact: 96,
    filter: 1700,
    noise: 2600,
  },
  light: {
    wave: 'sine',
    base: 640,
    accent: 1280,
    impact: 330,
    filter: 2800,
    noise: 3000,
  },
  dark: {
    wave: 'sawtooth',
    base: 110,
    accent: 360,
    impact: 82,
    filter: 740,
    noise: 980,
  },
  neutral: {
    wave: 'triangle',
    base: 220,
    accent: 480,
    impact: 128,
    filter: 1150,
    noise: 1350,
  },
}

const getBattleSfxAudioContext = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext

  if (!AudioContextConstructor) {
    return null
  }

  if (!battleSfxAudioContext || battleSfxAudioContext.state === 'closed') {
    battleSfxAudioContext = new AudioContextConstructor()
  }

  return battleSfxAudioContext
}

const resumeBattleSfxAudioContext = () => {
  const audioContext = getBattleSfxAudioContext()

  if (audioContext?.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }

  return audioContext
}

const getBattleAttackSoundProfile = (attribute) =>
  battleAttackSoundProfiles[getHitEffectAttributeClass(attribute)] ?? battleAttackSoundProfiles.neutral

const createBattleNoiseBuffer = (audioContext, duration) => {
  const sampleCount = Math.max(1, Math.floor(audioContext.sampleRate * duration))
  const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate)
  const output = buffer.getChannelData(0)

  for (let index = 0; index < sampleCount; index += 1) {
    const fadeOut = 1 - index / sampleCount
    output[index] = (Math.random() * 2 - 1) * fadeOut
  }

  return buffer
}

const playBattleTone = ({
  audioContext,
  startAt,
  duration,
  frequency,
  endFrequency,
  type = 'sine',
  volume = 0.08,
  filterFrequency = 1200,
  filterType = 'lowpass',
}) => {
  if (!audioContext) {
    return
  }

  const oscillator = audioContext.createOscillator()
  const filter = audioContext.createBiquadFilter()
  const gain = audioContext.createGain()
  const safeStartAt = Math.max(audioContext.currentTime, startAt)
  const safeDuration = Math.max(0.04, duration)
  const attackEndAt = safeStartAt + Math.min(0.018, safeDuration * 0.25)
  const endAt = safeStartAt + safeDuration

  oscillator.type = type
  oscillator.frequency.setValueAtTime(Math.max(30, frequency), safeStartAt)

  if (Number.isFinite(endFrequency)) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), endAt)
  }

  filter.type = filterType
  filter.frequency.setValueAtTime(Math.max(80, filterFrequency), safeStartAt)
  filter.Q.setValueAtTime(filterType === 'bandpass' ? 7 : 1.8, safeStartAt)
  gain.gain.setValueAtTime(0.0001, safeStartAt)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), attackEndAt)
  gain.gain.exponentialRampToValueAtTime(0.0001, endAt)

  oscillator.connect(filter)
  filter.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(safeStartAt)
  oscillator.stop(endAt + 0.04)
}

const playBattleNoise = ({
  audioContext,
  startAt,
  duration,
  volume = 0.08,
  filterFrequency = 1200,
  filterType = 'bandpass',
}) => {
  if (!audioContext) {
    return
  }

  const safeStartAt = Math.max(audioContext.currentTime, startAt)
  const safeDuration = Math.max(0.04, duration)
  const endAt = safeStartAt + safeDuration
  const source = audioContext.createBufferSource()
  const filter = audioContext.createBiquadFilter()
  const gain = audioContext.createGain()

  source.buffer = createBattleNoiseBuffer(audioContext, safeDuration)
  filter.type = filterType
  filter.frequency.setValueAtTime(Math.max(80, filterFrequency), safeStartAt)
  filter.Q.setValueAtTime(filterType === 'bandpass' ? 8 : 1.2, safeStartAt)
  gain.gain.setValueAtTime(0.0001, safeStartAt)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), safeStartAt + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, endAt)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(audioContext.destination)
  source.start(safeStartAt)
  source.stop(endAt + 0.02)
}

let battleSfxVolumeMultiplier = 1

const setBattleSfxVolumeMultiplier = (value) => {
  battleSfxVolumeMultiplier = Math.max(0, Math.min(1, Number(value) || 0))
}

const playBattleAttackSound = (effect, phase) => {
  const audioContext = resumeBattleSfxAudioContext()

  if (!audioContext) {
    return
  }

  const profile = getBattleAttackSoundProfile(effect?.attribute)
  const now = audioContext.currentTime
  const volume = BATTLE_ATTACK_SFX_VOLUME * battleSfxVolumeMultiplier

  if (phase === 'physical-move') {
    playBattleNoise({
      audioContext,
      startAt: now,
      duration: 0.2,
      volume: volume * 0.22,
      filterFrequency: profile.noise,
      filterType: 'bandpass',
    })
    playBattleTone({
      audioContext,
      startAt: now,
      duration: 0.18,
      frequency: profile.base * 0.82,
      endFrequency: profile.accent * 0.72,
      type: 'triangle',
      volume: volume * 0.18,
      filterFrequency: profile.filter,
    })
    return
  }

  if (phase === 'special-launch') {
    playBattleTone({
      audioContext,
      startAt: now,
      duration: 0.18,
      frequency: profile.base,
      endFrequency: profile.accent,
      type: profile.wave,
      volume: volume * 0.3,
      filterFrequency: profile.filter,
    })
    playBattleNoise({
      audioContext,
      startAt: now + 0.03,
      duration: 0.12,
      volume: volume * 0.12,
      filterFrequency: profile.noise,
    })
    return
  }

  if (phase === 'special-travel') {
    playBattleTone({
      audioContext,
      startAt: now + 0.1,
      duration: 0.42,
      frequency: profile.accent * 0.9,
      endFrequency: profile.base * 1.12,
      type: profile.wave === 'square' ? 'triangle' : profile.wave,
      volume: volume * 0.16,
      filterFrequency: profile.filter * 1.2,
      filterType: 'bandpass',
    })
    playBattleNoise({
      audioContext,
      startAt: now + 0.08,
      duration: 0.42,
      volume: volume * 0.08,
      filterFrequency: profile.noise,
      filterType: 'bandpass',
    })
    return
  }

  if (phase === 'hit') {
    playBattleTone({
      audioContext,
      startAt: now,
      duration: 0.16,
      frequency: profile.impact,
      endFrequency: Math.max(42, profile.impact * 0.58),
      type: isSpecialAttackCategory(effect?.category) ? profile.wave : 'square',
      volume: volume * 0.55,
      filterFrequency: profile.filter,
    })
    playBattleTone({
      audioContext,
      startAt: now + 0.018,
      duration: 0.12,
      frequency: profile.accent,
      endFrequency: profile.accent * 0.68,
      type: 'triangle',
      volume: volume * 0.18,
      filterFrequency: profile.filter * 1.5,
      filterType: 'bandpass',
    })
    playBattleNoise({
      audioContext,
      startAt: now,
      duration: 0.14,
      volume: volume * 0.32,
      filterFrequency: profile.noise,
      filterType: 'bandpass',
    })
  }
}

const createRewardSelection = (
  inventory = {},
  rewardTarget = null,
  levelCap = Infinity,
  currentStage = 1,
  rerollCount = 0
) => ({
  randomItems: selectRandomRewardItemsByRarity(
    randomRewardItemPool.filter((item) =>
      canRandomRewardItemAppear(item, inventory, rewardTarget, levelCap)
    ),
    3
  ),
  selectedRandomItemId: null,
  isResolving: false,
  isRevealing: true,
  revealKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  rerollCount,
  rerollCost: getRewardRerollCost(currentStage, rerollCount),
})

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
  '/맵/황금향.png',
  '/맵/황천.png',
]

const MAP_ROTATION_MS = 9000
const MAP_FADE_MS = 2600
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

const baseDigitDrops = [
  { duration: '8.4s', delay: '-5.2s', opacity: 0.46, scale: 0.95, swap: '2.4s' },
  { duration: '7.8s', delay: '-1.4s', opacity: 0.56, scale: 1.05, swap: '2.1s' },
  { duration: '9.1s', delay: '-6.7s', opacity: 0.42, scale: 0.9, swap: '2.6s' },
  { duration: '7.1s', delay: '-2.8s', opacity: 0.62, scale: 1.12, swap: '1.9s' },
  { duration: '9.8s', delay: '-8.5s', opacity: 0.4, scale: 0.88, swap: '2.5s' },
  { duration: '6.9s', delay: '-3.3s', opacity: 0.58, scale: 1, swap: '2s' },
  { duration: '8.7s', delay: '-0.6s', opacity: 0.5, scale: 1.08, swap: '2.2s' },
  { duration: '10.2s', delay: '-7.4s', opacity: 0.38, scale: 0.86, swap: '2.8s' },
  { duration: '7.4s', delay: '-4.9s', opacity: 0.55, scale: 1.04, swap: '2.05s' },
  { duration: '8.9s', delay: '-1.8s', opacity: 0.47, scale: 0.94, swap: '2.35s' },
  { duration: '7.7s', delay: '-6.1s', opacity: 0.6, scale: 1.14, swap: '1.85s' },
  { duration: '9.5s', delay: '-2.2s', opacity: 0.41, scale: 0.9, swap: '2.55s' },
  { duration: '7.2s', delay: '-5.5s', opacity: 0.57, scale: 1.02, swap: '2s' },
  { duration: '8.8s', delay: '-7.9s', opacity: 0.45, scale: 0.92, swap: '2.3s' },
  { duration: '6.8s', delay: '-4.1s', opacity: 0.53, scale: 1.08, swap: '1.75s' },
]

const getRandomLeft = () => `${(Math.random() * 92 + 4).toFixed(1)}%`
const getRandomDrift = () => `${(Math.random() * 24 - 12).toFixed(1)}px`

const getRandomMapIndex = (currentIndex = -1) => {
  if (mapBackgrounds.length <= 1) {
    return 0
  }

  let nextIndex = currentIndex

  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * mapBackgrounds.length)
  }

  return nextIndex
}

const mapBackgroundByName = mapBackgrounds.reduce((result, url) => {
  const fileName = url.split('/').pop() ?? ''
  result[fileName.replace('.png', '')] = url
  return result
}, {})

const getMapNameForStage = (stage) => {
  const safeStage = Math.min(Math.max(stage, 1), TOTAL_STAGE_COUNT)
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
  getMapEncounterGroups(mapName)?.[getEncounterGroupForStage(stage)] ?? []

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

const getLevelCapForStage = (stage) => {
  if (stage <= 10) {
    return 10
  }

  const safeStage = Math.min(Math.max(stage, 1), TOTAL_STAGE_COUNT)
  const capIndex = Math.min(CLASSIC_LEVEL_CAPS.length - 1, Math.floor((safeStage - 1) / STAGES_PER_MAP))
  return CLASSIC_LEVEL_CAPS[capIndex]
}

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
  isBossStage(stage) ? 1 : rollPercentChance(20) ? MAX_ENEMY_COMBATANTS : 1

const getBossHpGateCountForStage = (stage) => {
  if (!isBossStage(stage) || stage <= BOSS_STAGE_NO_GATE_LIMIT) {
    return 0
  }

  if (stage <= BOSS_STAGE_ONE_GATE_LIMIT) {
    return 1
  }

  if (stage <= BOSS_STAGE_TWO_GATE_LIMIT) {
    return 2
  }

  return 3
}

const createBossHpBreakpoints = (stage) => {
  const gateCount = getBossHpGateCountForStage(stage)

  return Array.from({ length: gateCount }, (_, index) => (gateCount - index) / (gateCount + 1))
}

const createBattleLog = (...lines) => lines.filter(Boolean)

const isBattlePromptLog = (line) =>
  /은 어떤 행동을 할까\?$/.test(line) ||
  /은 어떻게 행동할까\?$/.test(line) ||
  /은 무엇을 할까\?$/.test(line)

const isBattleLogActionStart = (line) =>
  line.includes('을(를) 사용했다!') ||
  line.includes('돌아와!') ||
  line.includes('부탁해!') ||
  line.includes('도망치려 했다!') ||
  line.includes('헤이스트가 발동했다!') ||
  line === '상대의 차례!'

const isBattleLogStandalone = (line) =>
  isBattlePromptLog(line) ||
  line.includes('데미지를 입었다') ||
  line.includes('움직일 수 없었다') ||
  line.includes('행동할 수 없었다') ||
  line.includes('풀죽어서') ||
  line.includes('풀죽었다') ||
  line.includes('상태가 풀렸다') ||
  line.includes('상태가 자연스럽게 풀렸다') ||
  line.includes('체력선이 버텼다') ||
  line.includes('생명의 힘') ||
  line.includes('기적의루비') ||
  line.includes('아이템을 선택하세요') ||
  line.includes('눈앞이 깜깜해졌다') ||
  line.includes('경험치') ||
  line.includes('레벨이') ||
  line.includes('배웠다')

const createBattleLogSteps = (logs = []) =>
  createBattleLog(...logs).reduce((steps, line) => {
    const shouldStartNewStep =
      steps.length === 0 || isBattleLogActionStart(line) || isBattleLogStandalone(line)

    if (shouldStartNewStep) {
      steps.push([line])
      return steps
    }

    steps[steps.length - 1].push(line)
    return steps
  }, [])

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

const STATUS_EFFECT_CLASS_MAP = {
  독: 'poison',
  맹독: 'toxic',
  혼란: 'confusion',
  착란: 'derangement',
  마비: 'paralysis',
  행동불능: 'disabled',
  수면: 'sleep',
  혼수상태: 'coma',
}

const getCombatantStatusBadge = (combatant) => {
  const normalizedStatus = normalizeStatusEffect(combatant?.statusEffect)
  if (!normalizedStatus) {
    return null
  }

  const definition = getStatusEffectDefinition(normalizedStatus.type)
  return {
    label: definition?.label ?? normalizedStatus.type,
    className: STATUS_EFFECT_CLASS_MAP[normalizedStatus.type] ?? 'neutral',
  }
}

const formatInfoValue = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  return value
}

const createStableHash = (value) => {
  const text = String(value ?? '')
  let hash = 2166136261

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

const getIvDetectorCount = (inventory = {}) =>
  Math.max(0, Math.min(IV_DETECTOR_MAX, inventory?.[IV_DETECTOR_ITEM_ID] ?? 0))

const getRevealedEnemyIvKeys = (combatant, inventory = {}) => {
  const revealCount = Math.min(
    IV_FIELD_KEYS.length,
    getIvDetectorCount(inventory) * IV_DETECTOR_REVEALED_STATS_PER_ITEM
  )

  if (!combatant || revealCount <= 0) {
    return []
  }

  const seed = `${combatant.id ?? ''}|${combatant.name ?? ''}|${combatant.level ?? 0}`

  return [...IV_FIELD_KEYS]
    .sort((firstKey, secondKey) => {
      const firstHash = createStableHash(`${seed}|${firstKey}`)
      const secondHash = createStableHash(`${seed}|${secondKey}`)

      return firstHash - secondHash
    })
    .slice(0, revealCount)
}

const getCombatantInfoTabs = (side, options = {}) => {
  if (side !== 'enemy') {
    return COMBATANT_INFO_TABS
  }

  if (!options.canViewEnemyInfo || !options.canViewEnemyIvs) {
    return []
  }

  return COMBATANT_INFO_TABS.filter((tab) => tab.key === 'ivs')
}

const isClientPointInsideElement = (element, clientX, clientY) => {
  if (!element) {
    return false
  }

  const rect = element.getBoundingClientRect()

  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
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

const getCombatantStatChartData = (combatant, activeTab, revealedIvKeys = null) => {
  if (!combatant || !activeTab) {
    return null
  }

  const isBattleStats = activeTab === 'stats'
  const revealedIvKeySet = Array.isArray(revealedIvKeys) ? new Set(revealedIvKeys) : null
  const maximumValue = isBattleStats
    ? Math.max(...COMBATANT_STAT_CHART_FIELDS.map((field) => getStatChartValue(combatant, field.key)), 1)
    : IV_MAX

  return COMBATANT_STAT_CHART_FIELDS.map((field) => {
    const rawValue = isBattleStats
      ? getStatChartValue(combatant, field.key)
      : combatant?.[activeTab]?.[field.key] ?? 0
    const isHiddenIv = activeTab === 'ivs' && revealedIvKeySet && !revealedIvKeySet.has(field.key)
    const value = isHiddenIv ? 0 : rawValue

    return {
      ...field,
      isHidden: isHiddenIv,
      value,
      valueText:
        isHiddenIv
          ? '??'
          : isBattleStats && field.key === 'hp'
          ? String(combatant.maxHp)
          : isBattleStats
            ? String(value)
            : `${value}/${maximumValue}`,
      ratio: maximumValue > 0 ? value / maximumValue : 0,
    }
  })
}

const CombatantStatChart = ({ combatant, activeTab, revealedIvKeys = null }) => {
  const chartData = getCombatantStatChartData(combatant, activeTab, revealedIvKeys)

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
            item.isHidden ? 'combatant-stat-chart__label--hidden' : '',
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

const CombatantIdentityStrip = ({ combatant }) => {
  if (!combatant) {
    return null
  }

  const typeIconUrl = getDigimonTypeIconUrl(combatant.type)
  const attributeIconUrl = getDigimonAttributeIconUrl(combatant.attribute)
  const statusBadge = getCombatantStatusBadge(combatant)

  return (
    <div className="combatant-info__identity">
      <strong className="combatant-info__name">{combatant.name}</strong>
      {statusBadge ? (
        <span
          className={[
            'adventure-player__status',
            'combatant-info__status',
            `adventure-player__status--${statusBadge.className}`,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {statusBadge.label}
        </span>
      ) : null}
      <span className="combatant-info__pill">{formatInfoValue(combatant.speciesStage)}</span>
      <span className="combatant-info__pill combatant-info__pill--trait">
        {typeIconUrl ? <img className="combatant-info__icon" src={typeIconUrl} alt="" /> : null}
        {formatInfoValue(combatant.type)}
      </span>
      <span className="combatant-info__pill combatant-info__pill--trait">
        {attributeIconUrl ? (
          <img className="combatant-info__icon" src={attributeIconUrl} alt="" />
        ) : null}
        {formatInfoValue(combatant.attribute)}
      </span>
      <span className="combatant-info__level">Lv.{combatant.level}</span>
    </div>
  )
}

const CombatantInfoPanel = ({
  combatant,
  side,
  activeTab,
  onTabChange,
  canViewEnemyInfo = false,
  canViewEnemyIvs = false,
  revealedIvKeys = null,
}) => {
  if (!combatant) {
    return null
  }

  const availableTabs = getCombatantInfoTabs(side, { canViewEnemyInfo, canViewEnemyIvs })
  const resolvedActiveTab = availableTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : availableTabs[0]?.key ?? null

  return (
    <div
      className={['combatant-info', `combatant-info--${side}`].filter(Boolean).join(' ')}
      role="group"
      aria-label={`${combatant.name} 상세 정보`}
    >
      <CombatantIdentityStrip combatant={combatant} />

      {availableTabs.length > 0 ? (
        <div className="combatant-info__tabs" role="tablist" aria-label={`${combatant.name} 정보 탭`}>
          {availableTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={[
                'combatant-info__tab',
                resolvedActiveTab === tab.key ? 'combatant-info__tab--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="tab"
              aria-selected={resolvedActiveTab === tab.key}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {resolvedActiveTab ? (
        <CombatantStatChart
          combatant={combatant}
          activeTab={resolvedActiveTab}
          revealedIvKeys={revealedIvKeys}
        />
      ) : null}
    </div>
  )
}

const CaptureInfoPreview = ({ combatant }) => {
  if (!combatant) {
    return null
  }

  const activeTab = 'ivs'
  const activeTabLabel = COMBATANT_INFO_TABS.find((tab) => tab.key === activeTab)?.label ?? '개체치'

  return (
    <aside className="capture-info-popover" aria-live="polite" aria-label={`${combatant.name} 포획 정보`}>
      <div className="capture-info-popover__header">
        <p className="capture-info-popover__title">포획 성공</p>
        <span className="capture-info-popover__mode">{activeTabLabel}</span>
      </div>
      <CombatantIdentityStrip combatant={combatant} />
      <div className="capture-info-popover__steps" aria-hidden="true">
        <span className="combatant-info__tab combatant-info__tab--active capture-info-popover__step">
          {activeTabLabel}
        </span>
      </div>
      <CombatantStatChart combatant={combatant} activeTab={activeTab} />
    </aside>
  )
}

const getStatusEffectDefinition = (statusType) => {
  switch (statusType) {
    case '독':
      return {
        label: '독',
        endTurnDamageRatio: 0.08,
      }
    case '맹독':
      return {
        label: '맹독',
        endTurnDamageRatio: 0.14,
      }
    case '혼란':
      return {
        label: '혼란',
        actionSuccessRate: 0.5,
        curesOnHit: true,
      }
    case '착란':
      return {
        label: '착란',
        actionSuccessRate: 0,
        curesOnHit: true,
      }
    case '마비':
      return {
        label: '마비',
        actionSuccessRate: 0.5,
      }
    case '행동불능':
      return {
        label: '행동불능',
        actionSuccessRate: 0,
      }
    case '수면':
      return {
        label: '수면',
        actionSuccessRate: 0.5,
        curesOnHit: true,
      }
    case '혼수상태':
      return {
        label: '혼수상태',
        actionSuccessRate: 0,
        curesOnHit: true,
      }
    default:
      return null
  }
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

const getSkillData = (skillName) => {
  return (
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
    effects.push('적 전체를 대상으로 공격한다.')
  }

  if (skillData.상태이상) {
    const chanceText = skillData.상태이상확률 ? `${skillData.상태이상확률} 확률로 ` : ''
    effects.push(`${chanceText}${skillData.상태이상} 상태이상을 부여한다.`)
  }

  return effects.length > 0 ? effects.join(' ') : null
}

const BattleSkillTooltip = ({ skillData, className = '' }) => {
  if (!skillData) {
    return null
  }

  const effectDescription = getSkillEffectDescription(skillData)
  const theme = getSkillTooltipTheme(skillData.속성)
  const infoRows = [
    { label: '속성', value: skillData.속성 },
    { label: '분류', value: skillData.분류 },
    { label: '위력', value: skillData.데미지 ?? null },
    { label: '명중률', value: skillData.명중률 ?? null },
    { label: '범위', value: getSkillRangeLabel(skillData) },
  ].filter((row) => row.value !== null && row.value !== undefined && row.value !== '')

  return (
    <div
      className={['battle-skill-tooltip', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <div
        className="battle-skill-tooltip__card"
        style={{
          '--skill-tooltip-border': theme.border,
          '--skill-tooltip-card-start': theme.cardStart,
          '--skill-tooltip-card-end': theme.cardEnd,
          '--skill-tooltip-header-bg': theme.headerBg,
          '--skill-tooltip-section-bg': theme.sectionBg,
          '--skill-tooltip-light-surface': theme.lightSurface,
          '--skill-tooltip-mid-surface': theme.midSurface,
          '--skill-tooltip-dark-text': theme.darkText,
          '--skill-tooltip-light-text': theme.lightText,
        }}
      >
        <div className="battle-skill-tooltip__header">
          <p className="battle-skill-tooltip__name">{skillData.기술명}</p>
        </div>
        <div className="battle-skill-tooltip__section">배틀</div>
        {effectDescription ? (
          <div className="battle-skill-tooltip__effect">
            <div className="battle-skill-tooltip__effect-title">효과</div>
            <p className="battle-skill-tooltip__effect-text">{effectDescription}</p>
          </div>
        ) : null}
        <div className="battle-skill-tooltip__info-grid">
          {infoRows.map((row) => (
            <div key={row.label} className="battle-skill-tooltip__row">
              <span className="battle-skill-tooltip__label">{row.label}</span>
              <span className="battle-skill-tooltip__value">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const getChartRelation = (chart, attackValue, defendValue) => {
  if (!attackValue || attackValue === '무' || !defendValue || defendValue === '무') {
    return 0
  }

  const strongAgainst = chart[attackValue] ?? []
  const counterAgainst = chart[defendValue] ?? []

  if (strongAgainst.includes(defendValue)) {
    return 1
  }

  if (counterAgainst.includes(attackValue)) {
    return -1
  }

  return 0
}

const getFinalMultiplier = (typeRelation, attributeRelation) => {
  const favorableCount = [typeRelation, attributeRelation].filter((value) => value > 0).length
  const unfavorableCount = [typeRelation, attributeRelation].filter((value) => value < 0).length

  if (favorableCount === 2) {
    return 3
  }

  if (favorableCount === 1 && unfavorableCount === 0) {
    return 2
  }

  if (favorableCount === 1 && unfavorableCount === 1) {
    return 1
  }

  if (favorableCount === 0 && unfavorableCount === 2) {
    return 0
  }

  if (favorableCount === 0 && unfavorableCount === 1) {
    return 0.5
  }

  return 1
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

  return Math.max(0, Math.min(100, baseAccuracy + accuracyBonus - accuracyPenalty))
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

const normalizeBossHpBreakpoints = (combatant) =>
  Array.isArray(combatant?.bossHpBreakpoints)
    ? combatant.bossHpBreakpoints.filter(
        (breakpoint) => Number.isFinite(breakpoint) && breakpoint > 0 && breakpoint < 1
      )
    : []

const resolveBossHpGate = ({ combatant, rawNextHp }) => {
  const breakpoints = normalizeBossHpBreakpoints(combatant)

  if (
    !combatant?.isBoss ||
    combatant.currentHp <= 0 ||
    rawNextHp >= combatant.currentHp ||
    breakpoints.length === 0
  ) {
    return {
      nextCombatant: combatant,
      nextHp: rawNextHp,
      battleLogs: [],
    }
  }

  const crossedBreakpointIndex = breakpoints.findIndex((breakpoint) => {
    const thresholdHp = Math.max(1, Math.floor(combatant.maxHp * breakpoint))

    return combatant.currentHp > thresholdHp && rawNextHp <= thresholdHp
  })

  if (crossedBreakpointIndex === -1) {
    return {
      nextCombatant: combatant,
      nextHp: rawNextHp,
      battleLogs: [],
    }
  }

  const thresholdHp = Math.max(1, Math.floor(combatant.maxHp * breakpoints[crossedBreakpointIndex]))

  return {
    nextCombatant: {
      ...combatant,
      bossHpBreakpoints: breakpoints.slice(crossedBreakpointIndex + 1),
    },
    nextHp: thresholdHp,
    battleLogs: [`${combatant.name}의 보스 체력선이 버텼다!`],
  }
}

const resolveCombatantDamageHp = ({ combatant, rawNextHp, canEndure = true }) => {
  const gateResult = resolveBossHpGate({ combatant, rawNextHp })
  const endureResult = resolveLifeForceEndure({
    combatant: gateResult.nextCombatant,
    previousHp: combatant.currentHp,
    nextHp: gateResult.nextHp,
    canEndure,
  })

  return {
    nextCombatant: {
      ...gateResult.nextCombatant,
      currentHp: endureResult.nextHp,
    },
    nextHp: endureResult.nextHp,
    battleLogs: [...gateResult.battleLogs, ...endureResult.battleLogs],
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

const clampStatValue = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

const createBaseStats = (data) =>
  STAT_KEYS.reduce((result, statKey) => {
    result[statKey] = Math.max(1, data?.[BASE_STAT_FIELD_MAP[statKey]] ?? 50)
    return result
  }, {})

const createRandomIvs = () =>
  STAT_KEYS.reduce((result, statKey) => {
    result[statKey] = getRandomIntInclusive(0, IV_MAX)
    return result
  }, {})

const normalizeStatBlock = (block, fallbackBlock, maximumValue) =>
  STAT_KEYS.reduce((result, statKey) => {
    const rawValue = block?.[statKey]
    const fallbackValue = fallbackBlock?.[statKey] ?? 0
    const nextValue = Number.isFinite(rawValue) ? Math.floor(rawValue) : fallbackValue

    result[statKey] = clampStatValue(nextValue, 0, maximumValue)
    return result
  }, {})

const calculateHpStat = ({ base, iv, level }) =>
  Math.floor(((2 * base + iv) * level) / 100) + level + 10

const calculateOtherStat = ({ base, iv, level }) =>
  Math.floor((Math.floor(((2 * base + iv) * level) / 100) + 5))

const getBuffMultiplier = (activeBuffs, statKey) =>
  BUFFABLE_STAT_KEYS.includes(statKey) && (activeBuffs?.[statKey] ?? 0) > 0 ? 1.1 : 1

const getBattleStatModifierMultiplier = (statModifiers, statKey) =>
  normalizeBattleStatModifiers(statModifiers)[statKey]?.multiplier ?? 1

const getDigicloneMultiplier = (digiclones, statKey) => {
  const cloneCount = normalizeDigiclones(digiclones)[statKey] ?? 0

  return 1 + cloneCount * 0.1
}

const getTypePowerMultiplier = (combatant) => {
  const combatantType = combatant?.type

  if (!combatantType) {
    return 1
  }

  const typePowerUps = normalizeTypePowerUps(combatant.typePowerUps)
  const boostCount = typePowerUps[combatantType] ?? 0

  return 1 + boostCount * 0.1
}

const getAttributePowerMultiplier = (combatant, skillAttribute) => {
  const attributeKey = getAttributePowerUpKey(skillAttribute)

  if (!attributeKey) {
    return 1
  }

  const attributePowerUps = normalizeAttributePowerUps(combatant?.attributePowerUps)
  const boostCount = attributePowerUps[attributeKey] ?? 0

  return 1 + boostCount * 0.1
}

const calculateBattleStats = ({ baseStats, level, ivs, activeBuffs, statModifiers, digiclones }) => ({
  maxHp: Math.max(
    1,
    Math.floor(
      calculateHpStat({
        base: baseStats.hp,
        iv: ivs.hp,
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
        iv: ivs.attack,
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
        iv: ivs.defense,
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
        iv: ivs.specialAttack,
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
        iv: ivs.specialDefense,
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
        iv: ivs.speed,
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

const getDigimonStageRank = (stage) => {
  const rank = DIGIMON_STAGE_ORDER.indexOf(stage)

  return rank >= 0 ? rank : -1
}

const getEvolutionStageRequirement = (stage) =>
  EVOLUTION_STAGE_REQUIREMENTS[stage] ?? {
    level: 80,
    stats: { hp: 125, attack: 125, specialAttack: 125, defense: 125, specialDefense: 125, speed: 125 },
  }

const getEvolutionRequirements = (targetData) => {
  if (targetData?.stage === '유아기') {
    return []
  }

  const customRequirement = targetData?.진화조건 ?? null
  const stageRequirement = getEvolutionStageRequirement(targetData?.stage)

  return [
    {
      key: 'level',
      label: '레벨',
      current: (combatant) => combatant?.level ?? 0,
      required: Number(customRequirement?.레벨 ?? stageRequirement.level),
    },
    ...EVOLUTION_REQUIREMENT_STAT_KEYS.map((statKey) => ({
      key: statKey,
      label: STAT_LABEL_MAP[statKey] ?? statKey,
      current: (combatant) => getCombatantBattleStatValue(combatant, statKey),
      required: Number(customRequirement?.[BASE_STAT_FIELD_MAP[statKey]] ?? stageRequirement.stats?.[statKey] ?? 1),
    })),
  ]
}

const getEvolutionOptions = (combatant, inventory = {}) => {
  if (!combatant?.speciesData?.진화가능?.length) {
    return []
  }

  const currentStageRank = getDigimonStageRank(combatant.speciesStage)

  return combatant.speciesData.진화가능
    .map((targetName) => allDigimonLookup.get(targetName))
    .filter(Boolean)
    .filter((targetData) => targetData.이름 !== combatant.name && getDigimonStageRank(targetData.stage) >= currentStageRank)
    .map((targetData) => {
      const itemRequirement = itemEvolutionRewardItemByTarget.get(targetData.이름) ?? null

      if (itemRequirement) {
        const itemCount = inventory?.[itemRequirement.id] ?? 0

        return {
          targetData,
          evolutionType: 'item',
          itemRequirement,
          itemCount,
          requirements: [],
          canEvolve: itemCount > 0,
        }
      }

      const requirements = getEvolutionRequirements(targetData).map((requirement) => {
        const currentValue = requirement.current(combatant)

        return {
          key: requirement.key,
          label: requirement.label,
          current: currentValue,
          required: requirement.required,
          isMet: currentValue >= requirement.required,
        }
      })

      return {
        targetData,
        evolutionType: 'stat',
        requirements,
        canEvolve: requirements.every((requirement) => requirement.isMet),
      }
    })
}

const getReadyEvolutionPreviewTargets = (combatant, inventory = {}) =>
  getEvolutionOptions(combatant, inventory)
    .filter((option) => option.canEvolve)
    .map((option) => ({
      name: option.targetData.이름,
      stage: option.targetData.stage,
      imageUrl: option.targetData.imageUrl,
    }))

const createEvolvedCombatant = (combatant, targetData) => {
  if (!combatant || !targetData) {
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
    ivs: combatant.ivs,
    activeBuffs: combatant.activeBuffs,
    statModifiers: combatant.statModifiers,
    typePowerUps: combatant.typePowerUps,
    attributePowerUps: combatant.attributePowerUps,
    digiclones: combatant.digiclones,
    recoveryPrograms: combatant.recoveryPrograms,
    battleItems: combatant.battleItems,
    statusEffect: combatant.statusEffect,
    stageName: targetData.stage,
  })

  return {
    ...evolvedCombatant,
    currentHp:
      combatant.currentHp <= 0
        ? 0
        : Math.max(1, Math.min(evolvedCombatant.maxHp, Math.floor(evolvedCombatant.maxHp * hpRatio))),
    evolutionHistory: [...(combatant.evolutionHistory ?? []), combatant.name],
  }
}

const createJogressCombatant = (primaryCombatant, partnerCombatants, targetData) => {
  const materialCombatants = [
    primaryCombatant,
    ...(Array.isArray(partnerCombatants) ? partnerCombatants : [partnerCombatants]),
  ].filter(Boolean)

  if (!primaryCombatant || materialCombatants.length <= 1 || !targetData) {
    return primaryCombatant
  }

  const mergedIvs = STAT_KEYS.reduce((result, statKey) => {
    result[statKey] = Math.max(...materialCombatants.map((combatant) => combatant.ivs?.[statKey] ?? 0))
    return result
  }, {})
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
  const jogressCombatant = createCombatant({
    id: primaryCombatant.id,
    name: targetData.이름,
    imageUrl: targetData.imageUrl ?? '',
    data: targetData,
    level: Math.max(...materialCombatants.map((combatant) => combatant.level ?? 1)),
    experience: Math.max(...materialCombatants.map((combatant) => combatant.experience ?? 0)),
    ivs: mergedIvs,
    activeBuffs: primaryCombatant.activeBuffs,
    statModifiers: primaryCombatant.statModifiers,
    typePowerUps: primaryCombatant.typePowerUps,
    attributePowerUps: primaryCombatant.attributePowerUps,
    digiclones: primaryCombatant.digiclones,
    recoveryPrograms: primaryCombatant.recoveryPrograms,
    battleItems: primaryCombatant.battleItems,
    statusEffect: null,
    stageName: targetData.stage,
  })

  return {
    ...jogressCombatant,
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

  return Boolean(targetName && allDigimonLookup.has(targetName))
}

const createReturnedEvolutionCombatant = (combatant) => {
  const targetName = getEvolutionReturnTargetName(combatant)
  const targetData = targetName ? allDigimonLookup.get(targetName) : null

  if (!combatant || !targetData) {
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
    ivs: combatant.ivs,
    activeBuffs: combatant.activeBuffs,
    statModifiers: combatant.statModifiers,
    typePowerUps: combatant.typePowerUps,
    attributePowerUps: combatant.attributePowerUps,
    digiclones: combatant.digiclones,
    recoveryPrograms: combatant.recoveryPrograms,
    battleItems: combatant.battleItems,
    statusEffect: combatant.statusEffect,
    stageName: targetData.stage,
  })

  return {
    ...returnedCombatant,
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
  ivs,
  activeBuffs,
  statModifiers,
  typePowerUps,
  attributePowerUps,
  digiclones,
  recoveryPrograms,
  battleItems,
  statusEffect,
  stageName,
}) => {
  const baseStats = createBaseStats(data)
  const resolvedIvs = normalizeStatBlock(ivs, createRandomIvs(), IV_MAX)
  const resolvedActiveBuffs = normalizeBuffState(activeBuffs)
  const resolvedStatModifiers = normalizeBattleStatModifiers(statModifiers)
  const resolvedTypePowerUps = normalizeTypePowerUps(typePowerUps)
  const resolvedAttributePowerUps = normalizeAttributePowerUps(attributePowerUps)
  const resolvedDigiclones = normalizeDigiclones(digiclones)
  const resolvedRecoveryPrograms = normalizeRecoveryPrograms(recoveryPrograms)
  const resolvedBattleItems = normalizeBattleItems(battleItems)
  const resolvedStatusEffect = normalizeStatusEffect(statusEffect)
  const battleStats = calculateBattleStats({
    baseStats,
    level,
    ivs: resolvedIvs,
    activeBuffs: resolvedActiveBuffs,
    statModifiers: resolvedStatModifiers,
    digiclones: resolvedDigiclones,
  })

  return {
    id,
    name,
    imageUrl: imageUrl ?? '',
    imageName: data?.imageName ?? data?.이미지명 ?? name,
    speciesData: data,
    speciesStage: stageName ?? data?.stage ?? null,
    baseStats,
    ivs: resolvedIvs,
    activeBuffs: resolvedActiveBuffs,
    statModifiers: resolvedStatModifiers,
    typePowerUps: resolvedTypePowerUps,
    attributePowerUps: resolvedAttributePowerUps,
    digiclones: resolvedDigiclones,
    recoveryPrograms: resolvedRecoveryPrograms,
    battleItems: resolvedBattleItems,
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
    skills: getDigimonSkillNamesForLevel(data, level),
  }
}

const createCapturedPartyMember = (enemy, captureId) =>
  refreshCombatantStats(
    {
      ...enemy,
      id: captureId,
      activeBuffs: normalizeBuffState(null),
      statModifiers: normalizeBattleStatModifiers(null),
      typePowerUps: normalizeTypePowerUps(null),
      attributePowerUps: normalizeAttributePowerUps(null),
      digiclones: normalizeDigiclones(null),
      recoveryPrograms: normalizeRecoveryPrograms(null),
      battleItems: normalizeBattleItems(null),
      statusEffect: null,
      isBoss: false,
      bossStage: null,
      bossHpSegmentCount: 1,
      bossHpBreakpoints: [],
    },
    {
      activeBuffs: normalizeBuffState(null),
      statusEffect: null,
    }
  )

const createDigiEggCombatant = ({
  id,
  eggName,
  hatchPool = [],
  stagesRemaining = DIGI_EGG_HATCH_STAGE_COUNT + 1,
}) => ({
  id,
  isEgg: true,
  eggName,
  eggHatchPool: [...hatchPool],
  eggStagesRemaining: Math.max(1, Math.floor(stagesRemaining)),
  name: `${eggName} 디지에그`,
  imageUrl: `/아이템/디지에그/${eggName}.png`,
  speciesData: null,
  speciesStage: DIGI_EGG_STAGE,
  baseStats: createBaseStats(null),
  ivs: createRandomIvs(),
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

const hatchDigiEggCombatant = (combatant) => {
  const hatchPool = (combatant?.eggHatchPool ?? []).filter((name) => allDigimonLookup.has(name))

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
      level: DIGI_EGG_HATCH_LEVEL,
      ivs: combatant.ivs,
      stageName: targetData?.stage ?? null,
    }),
    hatchLogs: [`${combatant.name}가 ${hatchName}(으)로 부화했다!`],
  }
}

const progressDigiEggPartyByStage = (party) => {
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

    const hatchResult = hatchDigiEggCombatant(member)
    hatchLogs.push(...hatchResult.hatchLogs)
    return hatchResult.nextCombatant
  })

  return {
    nextParty,
    hatchLogs,
  }
}

const getEnemyLevelRangeForStage = (stage) => {
  const safeStage = Math.min(Math.max(stage, 1), TOTAL_STAGE_COUNT)
  const stageBand = Math.floor((safeStage - 1) / STAGES_PER_MAP)
  const fixedLevelRanges = [
    [1, 8],
    [8, 12],
    [12, 20],
    [20, 30],
  ]

  return (
    fixedLevelRanges[stageBand] ??
    [
      Math.min(MAX_DIGIMON_LEVEL, 30 + (stageBand - fixedLevelRanges.length) * 10),
      Math.min(MAX_DIGIMON_LEVEL, 40 + (stageBand - fixedLevelRanges.length) * 10),
    ]
  )
}

const getEnemyLevelForStage = (stage) => {
  const safeStage = Math.min(Math.max(stage, 1), TOTAL_STAGE_COUNT)
  const [minimumLevel, maximumLevel] = getEnemyLevelRangeForStage(safeStage)
  const stageProgress = ((safeStage - 1) % STAGES_PER_MAP) / Math.max(1, STAGES_PER_MAP - 1)
  const levelSpan = Math.max(0, maximumLevel - minimumLevel)
  const scaledLevel = minimumLevel + levelSpan * stageProgress
  const variance = Math.max(1, Math.floor(levelSpan * 0.18))
  const progressiveMinimum = Math.max(minimumLevel, Math.floor(scaledLevel) - variance)
  const progressiveMaximum = Math.min(maximumLevel, Math.ceil(scaledLevel) + variance)

  return getRandomIntInclusive(progressiveMinimum, progressiveMaximum)
}

const getBossLevelForStage = (stage) => getEnemyLevelRangeForStage(stage)[1]

const getExperienceReward = (enemy) =>
  Math.max(
    18,
    Math.floor(
      (enemy.level * 6 + enemy.baseStatTotal * 0.06) *
        (enemy.isBoss ? BOSS_STAT_MULTIPLIER : 1)
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

const getRandomEnemySkill = (enemy) => {
  if (!enemy?.skills?.length) {
    return null
  }

  return enemy.skills[Math.floor(Math.random() * enemy.skills.length)]
}

const getMatchupResult = ({ attackerType, skillAttribute, defenderType, defenderAttribute }) => {
  const typeRelation = getChartRelation(typeAdvantageMap, attackerType, defenderType)
  const attributeRelation = getChartRelation(
    attributeAdvantageMap,
    skillAttribute,
    defenderAttribute
  )

  return {
    typeRelation,
    attributeRelation,
    multiplier: getFinalMultiplier(typeRelation, attributeRelation),
  }
}

const refreshCombatantStats = (
  combatant,
  {
    level = combatant.level,
    ivs = combatant.ivs,
    activeBuffs = combatant.activeBuffs,
    statModifiers = combatant.statModifiers,
    digiclones = combatant.digiclones,
    statusEffect = combatant.statusEffect,
    preserveMaxHpDelta = false,
  } = {}
) => {
  const battleStats = calculateBattleStats({
    baseStats: combatant.baseStats,
    level,
    ivs,
    activeBuffs,
    statModifiers,
    digiclones,
  })
  const statMultiplier = combatant.isBoss ? BOSS_STAT_MULTIPLIER : 1
  const resolvedBattleStats = {
    maxHp: Math.max(1, Math.floor(battleStats.maxHp * statMultiplier)),
    attack: Math.max(1, Math.floor(battleStats.attack * statMultiplier)),
    specialAttack: Math.max(1, Math.floor(battleStats.specialAttack * statMultiplier)),
    defense: Math.max(1, Math.floor(battleStats.defense * statMultiplier)),
    specialDefense: Math.max(1, Math.floor(battleStats.specialDefense * statMultiplier)),
    speed: Math.max(1, Math.floor(battleStats.speed * statMultiplier)),
  }
  const maxHpDelta = resolvedBattleStats.maxHp - combatant.maxHp

  return {
    ...combatant,
    ivs,
    activeBuffs: normalizeBuffState(activeBuffs),
    statModifiers: normalizeBattleStatModifiers(statModifiers),
    digiclones: normalizeDigiclones(digiclones),
    statusEffect: normalizeStatusEffect(statusEffect),
    level,
    experienceToNext: getExperienceToNextLevel(level),
    currentHp: preserveMaxHpDelta
      ? Math.min(resolvedBattleStats.maxHp, combatant.currentHp + maxHpDelta)
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

const tickCombatantBuffsByStage = (combatant) => {
  const currentBuffs = normalizeBuffState(combatant.activeBuffs)
  const nextBuffs = BUFFABLE_STAT_KEYS.reduce((result, statKey) => {
    result[statKey] = Math.max(0, (currentBuffs[statKey] ?? 0) - 1)
    return result
  }, {})

  const hasChanged = BUFFABLE_STAT_KEYS.some(
    (statKey) => (currentBuffs[statKey] ?? 0) !== (nextBuffs[statKey] ?? 0)
  )

  if (!hasChanged) {
    return combatant
  }

  return refreshCombatantStats(combatant, { activeBuffs: nextBuffs })
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
    const damage = Math.max(1, Math.floor(nextCombatant.maxHp * statusDefinition.endTurnDamageRatio))
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

  if (progressedStatus.turns >= STATUS_DURATION_TURNS) {
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

const progressBattleStatModifiers = (combatant) => {
  const currentModifiers = normalizeBattleStatModifiers(combatant?.statModifiers)
  const nextModifiers = BUFFABLE_STAT_KEYS.reduce((result, statKey) => {
    const modifier = currentModifiers[statKey]

    if (!modifier) {
      result[statKey] = null
      return result
    }

    const nextTurns = modifier.turns - 1
    result[statKey] = nextTurns > 0 ? { ...modifier, turns: nextTurns } : null
    return result
  }, {})

  return refreshCombatantStats(combatant, {
    statModifiers: nextModifiers,
    preserveMaxHpDelta: true,
  })
}

const resolveTurnEndCombatantEffects = (
  combatant,
  { side = 'enemy', skipEndTurnDamage = false } = {}
) => {
  const statusResult = resolveTurnEndStatus(combatant, { side, skipEndTurnDamage })
  const nextCombatant =
    statusResult.nextCombatant?.currentHp > 0
      ? progressBattleStatModifiers(statusResult.nextCombatant)
      : statusResult.nextCombatant

  return {
    nextCombatant,
    battleLogs: statusResult.battleLogs,
  }
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
    .filter(isCombatantAbleToBattle)
  const activeShareAmount = activeRecipients.length
    ? Math.max(1, Math.floor(boostedExperience / activeRecipients.length))
    : 0

  activeRecipients.forEach((recipient) => {
    const experienceResult = applyExperienceAmount({
      combatant: recipient,
      experienceAmount: activeShareAmount,
      levelCap,
    })
    nextParty = replacePartyMember(nextParty, experienceResult.nextCombatant)
    battleLogs.push(...experienceResult.battleLogs)
    skillLearnEvents.push(...(experienceResult.skillLearnEvents ?? []))
  })

  if (getInventoryItemCount(inventory, EXP_SHARE_ITEM_ID) > 0) {
    const activeIdSet = new Set(activeAllyIds)
    const sharedExperienceAmount = Math.max(1, Math.floor(boostedExperience * 0.2))

    nextParty
      .filter(
        (member) =>
          !activeIdSet.has(member.id) &&
          isCombatantAbleToBattle(member)
      )
      .forEach((member) => {
        const experienceResult = applyExperienceAmount({
          combatant: member,
          experienceAmount: sharedExperienceAmount,
          levelCap,
        })
        nextParty = replacePartyMember(nextParty, experienceResult.nextCombatant)
        battleLogs.push(...experienceResult.battleLogs)
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
    ? party
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
    return pool.find((target) => target?.currentHp <= 0) ?? null
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
    const healAmount = Math.max(1, Math.floor(target.maxHp * (effect.healRatio ?? 0)))
    const nextHp = Math.min(target.maxHp, target.currentHp + healAmount)
    const appliedHeal = Math.max(0, nextHp - target.currentHp)

    return {
      nextTarget: {
        ...target,
        currentHp: nextHp,
      },
      battleLogs: [`${target.name}의 HP가 ${appliedHeal} 회복됐다!`],
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
    const nextModifiers = {
      ...normalizeBattleStatModifiers(target.statModifiers),
      [effect.statKey]: {
        turns: effect.turns ?? BATTLE_STAT_MODIFIER_DURATION,
        multiplier: effect.multiplier ?? 1,
      },
    }

    return {
      nextTarget: refreshCombatantStats(target, {
        statModifiers: nextModifiers,
        preserveMaxHpDelta: true,
      }),
      battleLogs: [`${target.name}의 ${getStatModifierLabel(effect)}!`],
    }
  }

  if (effect.kind === 'status') {
    if (normalizeStatusEffect(target.statusEffect)) {
      return {
        nextTarget: target,
        battleLogs: [`${target.name}은(는) 이미 상태이상에 걸려 있다.`],
      }
    }

    if (Math.random() * 100 >= (effect.chance ?? 100)) {
      return {
        nextTarget: target,
        battleLogs: [`${actor.name}의 ${skillData.기술명}은(는) 실패했다!`],
      }
    }

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

  return {
    nextTarget: target,
    battleLogs: [`${skillData.기술명}의 효과는 아직 적용되지 않았다.`],
  }
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
    battleLogs.push(...effectResult.battleLogs)
  })

  return {
    nextParty,
    nextEnemies,
    battleLogs,
  }
}

const resolveAttackAction = ({
  attacker,
  defender,
  skillName,
  announce = true,
  attackerSide = 'ally',
}) => {
  const skillData = getSkillData(skillName)
  const skillStatusData = getSkillStatusData(skillData)
  const battleLogs = announce ? [createSkillUseLog(attacker.name, skillData.기술명)] : []
  const accuracyValue = getModifiedAccuracyValue(skillData, attacker, defender, attackerSide)

  if (Math.random() * 100 >= accuracyValue) {
    return {
      nextDefender: defender,
      battleLogs: [...battleLogs, `${attacker.name}의 공격이 빗나갔다!`],
      hitEffects: [
        {
          attackerId: attacker.id,
          attackerSide,
          targetId: defender.id,
          targetSide: attackerSide === 'ally' ? 'enemy' : 'ally',
          attribute: skillData.속성 ?? '무',
          category: skillData.분류 ?? '물리형',
          skillName: skillData.기술명,
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

  if (finalMultiplier === 0) {
    return {
      nextDefender: defender,
      battleLogs: [...battleLogs, '상성이 너무 불리해서 공격이 통하지 않았다!'],
      hitEffects: [],
    }
  }

  const boostedSkillPower =
    (skillData.데미지 ?? 0) *
    getTypePowerMultiplier(attacker) *
    getAttributePowerMultiplier(attacker, skillData.속성)
  const scaledPower =
    (((2 * Math.max(1, attacker.level)) / 5 + 2) * boostedSkillPower * Math.max(1, attackStat)) /
    Math.max(1, defenseStat)
  const baseDamage = Math.floor(scaledPower / 50) + 2
  const randomFactor = 0.85 + Math.random() * 0.15
  const damage = Math.max(1, Math.floor(baseDamage * finalMultiplier * randomFactor))
  const rawNextHp = Math.max(0, defender.currentHp - damage)
  const hpResult = resolveCombatantDamageHp({
    combatant: defender,
    rawNextHp,
    canEndure: attackerSide === 'enemy',
  })
  const nextHp = hpResult.nextHp
  const appliedDamage = Math.max(0, defender.currentHp - nextHp)
  let nextDefender = hpResult.nextCombatant
  const nextLogs = [...battleLogs, `${defender.name}에게 ${appliedDamage} 데미지!`]
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
  } else if (!normalizeStatusEffect(nextDefender.statusEffect) && skillStatusData) {
    if (Math.random() * 100 < skillStatusData.chance) {
      nextDefender = refreshCombatantStats(nextDefender, {
        statusEffect: createStatusEffect(skillStatusData.type),
      })
      nextLogs.push(`${nextDefender.name}은(는) 상태이상(${skillStatusData.type})에 걸렸다!`)
    }
  }

  return {
    nextDefender,
    battleLogs: nextLogs,
    hitEffects:
      appliedDamage > 0
        ? [
            {
              attackerId: attacker.id,
              attackerSide,
              targetId: defender.id,
              targetSide: attackerSide === 'ally' ? 'enemy' : 'ally',
              attribute: skillData.속성 ?? '무',
              category: skillData.분류 ?? '물리형',
              skillName: skillData.기술명,
              damage: appliedDamage,
              targetCurrentHp: nextDefender.currentHp,
              targetStatusEffect: nextDefender.statusEffect ?? null,
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

const resolveEnemyPartyActions = ({ enemies, party, activeAllyIds, inventory = {} }) => {
  let nextEnemies = [...enemies]
  let nextParty = [...party]
  const battleLogs = []
  const hitEffects = []

  nextEnemies.forEach((enemy, enemyIndex) => {
    if (!isCombatantAbleToBattle(enemy)) {
      return
    }

    let nextEnemy = { ...enemy }
    let targetAlly = getFirstLivingPartyMember(nextParty, activeAllyIds)
    const enemySkill = getRandomEnemySkill(nextEnemy)
    const enemySkillData = enemySkill ? getSkillData(enemySkill) : null
    const isAreaAttack = isSkillAreaAttack(enemySkillData)

    if (!targetAlly) {
      return
    }

    const startStatusResult = resolveTurnStartStatus(nextEnemy)
    nextEnemy = startStatusResult.nextCombatant
    battleLogs.push(...startStatusResult.battleLogs)

    targetAlly = getCombatantById(nextParty, targetAlly.id) ?? targetAlly

    if (
      enemySkill &&
      startStatusResult.canAct &&
      isCombatantAbleToBattle(nextEnemy)
    ) {
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
            announce: false,
            inventory,
            attackerSide: 'enemy',
          })
          const recoveryResult = resolveRecoveryProgramOnDefeat(attackResult.nextDefender)
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
          inventory,
          attackerSide: 'enemy',
        })
        const recoveryResult = resolveRecoveryProgramOnDefeat(attackResult.nextDefender)
        targetAlly = recoveryResult.nextCombatant
        nextParty = replacePartyMember(nextParty, targetAlly)
        battleLogs.push(...attackResult.battleLogs)
        battleLogs.push(...recoveryResult.battleLogs)
        hitEffects.push(...(attackResult.hitEffects ?? []))
      }
    }

    if (isCombatantAbleToBattle(nextEnemy)) {
      const endStatusResult = resolveTurnEndCombatantEffects(nextEnemy, { side: 'enemy' })
      nextEnemy = endStatusResult.nextCombatant
      battleLogs.push(...endStatusResult.battleLogs)
    }

    nextEnemies[enemyIndex] = nextEnemy
  })

  return {
    nextEnemies,
    nextParty,
    battleLogs,
    hitEffects,
  }
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

const createEnemyBattleTurnActions = ({ enemies, party, activeAllyIds, startOrder = 0 }) => {
  const livingActiveAllies = activeAllyIds
    .map((allyId) => getCombatantById(party, allyId))
    .filter(isCombatantAbleToBattle)

  return getLivingCombatants(enemies)
    .map((enemy, index) => {
      const enemySkill = getRandomEnemySkill(enemy)

      if (!enemySkill || !livingActiveAllies.length) {
        return null
      }

      return createBattleTurnAction({
        side: 'enemy',
        actor: enemy,
        skillName: enemySkill,
        targetId: getRandomCombatant(livingActiveAllies)?.id ?? null,
        order: startOrder + index,
      })
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

    if (!action.skillName || !isCombatantAbleToBattle(actor)) {
      return
    }

    if (flinchedActorIds.has(action.actorId)) {
      battleLogs.push(`${actor.name}은(는) 풀죽어서 움직일 수 없었다!`)
      flinchedActorIds.delete(action.actorId)
      return
    }

    const skillData = getSkillData(action.skillName)
    const isAreaAttack = isSkillAreaAttack(skillData)
    const defeatedEnemies = []
    const startStatusResult = resolveTurnStartStatus(actor)
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

    if (startStatusResult.canAct && isCombatantAbleToBattle(actor)) {
      if (action.side === 'ally' && action.priority > 0) {
        battleLogs.push(`${actor.name}의 헤이스트가 발동했다!`)
      }

      const getDeathBoneFlinchLogs = (target) => {
        const hasPendingTargetAction = sortedActions
          .slice(actionIndex + 1)
          .some((futureAction) => futureAction.side === 'enemy' && futureAction.actorId === target?.id)

        if (
          action.side !== 'ally' ||
          !isCombatantAbleToBattle(target) ||
          !hasPendingTargetAction ||
          !rollDeathBoneFlinch(actor)
        ) {
          return []
        }

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
              announce: false,
              inventory,
              attackerSide: action.side,
            })

            if (action.side === 'ally') {
              nextEnemies = replaceCombatantById(nextEnemies, attackResult.nextDefender)

              if (target.currentHp > 0 && attackResult.nextDefender.currentHp === 0) {
                defeatedEnemies.push(target)
              }
              battleLogs.push(...attackResult.battleLogs)
              battleLogs.push(...getDeathBoneFlinchLogs(attackResult.nextDefender))
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
            targetCandidates.find((target) => target.id === action.targetId) ?? targetCandidates[0]

          if (selectedTarget) {
            const attackResult = resolveAttackAction({
              attacker: actor,
              defender: selectedTarget,
              skillName: action.skillName,
              inventory,
              attackerSide: action.side,
            })

            if (action.side === 'ally') {
              nextEnemies = replaceCombatantById(nextEnemies, attackResult.nextDefender)

              if (selectedTarget.currentHp > 0 && attackResult.nextDefender.currentHp === 0) {
                defeatedEnemies.push(selectedTarget)
              }
              battleLogs.push(...attackResult.battleLogs)
              battleLogs.push(...getDeathBoneFlinchLogs(attackResult.nextDefender))
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

    actor = getBattleTurnActor({ action, party: nextParty, enemies: nextEnemies }) ?? actor

    if (isCombatantAbleToBattle(actor)) {
      const shouldSkipAllyEndTurnStatusDamage =
        action.side === 'ally' && nextEnemies.every((enemy) => !isCombatantAbleToBattle(enemy))
      const endStatusResult = resolveTurnEndCombatantEffects(actor, {
        side: action.side,
        skipEndTurnDamage: shouldSkipAllyEndTurnStatusDamage,
      })
      actor = endStatusResult.nextCombatant
      battleLogs.push(...endStatusResult.battleLogs)

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
  })

  const miracleRubyResult = applyMiracleRubyTurnHealing({
    party: nextParty,
    activeAllyIds,
  })
  nextParty = miracleRubyResult.nextParty
  battleLogs.push(...miracleRubyResult.battleLogs)

  return {
    nextParty,
    nextEnemies,
    battleLogs,
    skillLearnEvents,
    hitEffects,
  }
}

const createBossCombatant = ({ stage, name, data }) => {
  const hpBreakpoints = createBossHpBreakpoints(stage)
  const combatant = createCombatant({
    id: `boss-${stage}-${name}`,
    name,
    imageUrl: data?.imageUrl ?? '',
    data,
    level: getBossLevelForStage(stage),
    stageName: data?.stage ?? null,
  })

  return refreshCombatantStats(
    {
      ...combatant,
      isBoss: true,
      bossStage: stage,
      bossHpSegmentCount: hpBreakpoints.length + 1,
      bossHpBreakpoints: hpBreakpoints,
    },
    {
      preserveMaxHpDelta: true,
    }
  )
}

const buildEnemyParty = (stage, encounterPool, encounterCount, bossEncounterPool = []) => {
  if (isBossStage(stage)) {
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
            name: bossName,
            data: bossData,
          }),
        ]
      : []
  }

  const shuffledNames = shuffleItems(encounterPool)

  return shuffledNames.slice(0, Math.min(MAX_ENEMY_COMBATANTS, encounterCount)).map((name, index) => {
    const data = allDigimonLookup.get(name)
    const level = getEnemyLevelForStage(stage)

    return createCombatant({
      id: `${name}-${index}`,
      name,
      imageUrl: data?.imageUrl ?? '',
      data,
      level,
      stageName: data?.stage ?? null,
    })
  })
}

const createDigitDrop = (drop, index) => ({
  ...drop,
  id: index,
  left: getRandomLeft(),
  drift: getRandomDrift(),
})

function App() {
  const [digitDrops, setDigitDrops] = useState(() =>
    baseDigitDrops.map((drop, index) => createDigitDrop(drop, index))
  )
  const [screenMode, setScreenMode] = useState('menu')
  const [settingsTab, setSettingsTab] = useState('general')
  const [isBgmSettingsOpen, setIsBgmSettingsOpen] = useState(false)
  const [gameSettings, setGameSettings] = useState(() => loadSettingsFromStorage())
  const [selectedGrowthIndex, setSelectedGrowthIndex] = useState(0)
  const [selectedStarterNames, setSelectedStarterNames] = useState(() =>
    growthStageDigimon[0]?.name ? [growthStageDigimon[0].name] : []
  )
  const [isMatchupGuideOpen, setIsMatchupGuideOpen] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [hasSaveData, setHasSaveData] = useState(() => hasSavedGameState())
  const [selectedBattleCommand, setSelectedBattleCommand] = useState('attack')
  const [battlePanelMode, setBattlePanelMode] = useState('commands')
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0)
  const [hoveredSkillIndex, setHoveredSkillIndex] = useState(null)
  const [selectedEnemyTargetId, setSelectedEnemyTargetId] = useState(null)
  const [hoveredEnemyTargetId, setHoveredEnemyTargetId] = useState(null)
  const [combatantInfoTab, setCombatantInfoTab] = useState('stats')
  const [activeCombatantInfoId, setActiveCombatantInfoId] = useState(null)
  const [currentLogs, setCurrentLogs] = useState([])
  const [rewardState, setRewardState] = useState(null)
  const [evolutionState, setEvolutionState] = useState(null)
  const [evolutionScene, setEvolutionScene] = useState(null)
  const [mapSelectionState, setMapSelectionState] = useState(null)
  const [capturePreview, setCapturePreview] = useState(null)
  const [skillReplaceState, setSkillReplaceState] = useState(null)
  const [hitEffects, setHitEffects] = useState([])
  const [attackMotions, setAttackMotions] = useState([])
  const [projectileEffects, setProjectileEffects] = useState([])
  const [trimmedBattleSprites, setTrimmedBattleSprites] = useState({})
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
  const capturePreviewTimeoutsRef = useRef([])
  const capturePreviewIdRef = useRef(0)
  const activeCombatantInfoElementRef = useRef(null)
  const previousPlayerProgressRef = useRef(null)
  const [mapTransition, setMapTransition] = useState(() => {
    const initialIndex = getRandomMapIndex()

    return {
      activeIndex: initialIndex,
      previousIndex: initialIndex,
      isFading: false,
    }
  })

  useEffect(() => {
    saveSettingsToStorage(gameSettings)
    setBattleSfxVolumeMultiplier(getEffectiveSfxVolume(gameSettings))
  }, [gameSettings])

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
  const getEvolutionSceneDuration = (duration) =>
    gameSettings.evolutionSpeed === 'skip'
      ? 0
      : getScaledDuration(duration, gameSettings.evolutionSpeed)

  const clearExpAnimationQueue = () => {
    expAnimationTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    expAnimationTimeoutsRef.current = []
  }

  const clearHitEffectQueue = () => {
    hitEffectTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    hitEffectTimeoutsRef.current = []
    battleEffectFrameIdsRef.current.forEach((frameId) => window.cancelAnimationFrame(frameId))
    battleEffectFrameIdsRef.current = []
    setHitEffects([])
    setAttackMotions([])
    setProjectileEffects([])
  }

  const clearBattleLogSequence = () => {
    battleLogSequenceTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    battleLogSequenceTimeoutsRef.current = []
  }

  const showBattleLogSequence = (logs, { finalBattlePanel = 'commands' } = {}) => {
    const steps = createBattleLogSteps(logs)
    clearBattleLogSequence()

    if (steps.length === 0) {
      setCurrentLogs([])
      setBattlePanelMode(finalBattlePanel)
      return 0
    }

    setBattlePanelMode('logs')
    setCurrentLogs(steps[0])

    steps.slice(1).forEach((stepLogs, stepIndex) => {
      const timeoutId = window.setTimeout(() => {
        setCurrentLogs(stepLogs)
        battleLogSequenceTimeoutsRef.current = battleLogSequenceTimeoutsRef.current.filter(
          (currentTimeoutId) => currentTimeoutId !== timeoutId
        )
      }, getGameDuration(BATTLE_LOG_STEP_MS * (stepIndex + 1)))
      battleLogSequenceTimeoutsRef.current.push(timeoutId)
    })

    const totalDelay = getGameDuration(
      BATTLE_LOG_STEP_MS * Math.max(0, steps.length - 1) + BATTLE_LOG_FINAL_DELAY_MS
    )
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
    setCurrentLogs(createBattleLog(...logs))
  }

  const saveStageGameState = (nextGameState) => {
    const didSave = saveGameStateToStorage(nextGameState)
    setHasSaveData(didSave || hasSavedGameState())
  }

  const clearStageSave = () => {
    clearSavedGameStateFromStorage()
    setHasSaveData(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleStorageChange = (event) => {
      if (event.key === SAVE_STORAGE_KEY) {
        setHasSaveData(hasSavedGameState())
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const getBattleSpriteUrl = (imageUrl) => trimmedBattleSprites[imageUrl] ?? imageUrl

  const handleBattleSpriteLoad = (event) => {
    const imageElement = event.currentTarget
    const sourceUrl = imageElement.dataset.sourceSrc

    if (!sourceUrl || trimmedBattleSprites[sourceUrl]) {
      return
    }

    const trimmedUrl = createTrimmedSpriteDataUrl(imageElement)

    if (!trimmedUrl) {
      return
    }

    setTrimmedBattleSprites((current) =>
      current[sourceUrl]
        ? current
        : {
            ...current,
            [sourceUrl]: trimmedUrl,
          }
      )
  }

  const renderBattleSprite = (combatant, side) => {
    const isAlly = side === 'ally'
    const idleAnimationSprite = getCombatantIdleAnimationSprite(combatant)
    const className = [
      'adventure-player__sprite',
      isAlly ? 'adventure-player__sprite--ally' : 'adventure-player__sprite--enemy',
      `adventure-player__sprite--size-${combatant.size}`,
      idleAnimationSprite ? 'adventure-player__sprite--idle-sheet' : '',
    ]
      .filter(Boolean)
      .join(' ')

    if (idleAnimationSprite) {
      return (
        <span
          key="idle-animation"
          className={className}
          role="img"
          aria-label={combatant.name}
          style={{
            '--idle-sprite-url': `url("${idleAnimationSprite.url}")`,
            '--idle-frame-ratio': idleAnimationSprite.ratio,
            '--idle-frame-inverse-ratio': idleAnimationSprite.inverseRatio,
          }}
        />
      )
    }

    return (
      <img
        className={className}
        src={getBattleSpriteUrl(combatant.imageUrl)}
        alt={combatant.name}
        data-source-src={combatant.imageUrl}
        onLoad={handleBattleSpriteLoad}
      />
    )
  }

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

    const point = {
      x: elementRect.left - fieldRect.left + elementRect.width / 2,
      y: elementRect.top - fieldRect.top + elementRect.height * 0.45,
      headY: elementRect.top - fieldRect.top + elementRect.height * 0.18,
      fieldCenterX: fieldRect.width / 2,
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
      id: `${effect.targetId}-${hitEffectIdRef.current}`,
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
    }, getGameDuration(Math.max(HIT_EFFECT_DURATION_MS, DAMAGE_TEXT_DURATION_MS)))

    hitEffectTimeoutsRef.current.push(endTimeoutId)
  }

  const applyVisualAttackDamage = (effect) => {
    const hasHpChange = Number.isFinite(effect?.targetCurrentHp)
    const hasStatusChange =
      effect && Object.prototype.hasOwnProperty.call(effect, 'targetStatusEffect')

    if (!effect?.targetId || (!hasHpChange && !hasStatusChange)) {
      return
    }

    setGameState((current) => {
      if (!current || screenMode !== 'adventure') {
        return current
      }

      const applyHitResult = (combatant) => {
        if (!combatant || combatant.id !== effect.targetId) {
          return combatant
        }

        return {
          ...combatant,
          currentHp: hasHpChange
            ? Math.max(0, Math.min(combatant.maxHp, effect.targetCurrentHp))
            : combatant.currentHp,
          statusEffect: hasStatusChange
            ? normalizeStatusEffect(effect.targetStatusEffect)
            : combatant.statusEffect,
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
        }
      }

      return {
        ...current,
        enemies: (current.enemies ?? []).map(applyHitResult),
      }
    })
  }

  const playBattleAttackEffects = (effects = []) => {
    const validEffects = effects.filter((effect) => effect?.targetId)

    if (validEffects.length === 0) {
      return 0
    }

    const getEffectAnimationDuration = (effect) => {
      const isPhysical = effect.category === '물리형' || effect.category === '물리'
      const hitFeedbackDuration = Math.max(HIT_EFFECT_DURATION_MS, DAMAGE_TEXT_DURATION_MS)
      const baseDuration = isPhysical
        ? Math.floor(ATTACK_MOTION_DURATION_MS * 0.42) + hitFeedbackDuration + 120
        : PROJECTILE_EFFECT_DURATION_MS + hitFeedbackDuration + 120
      return getGameDuration(baseDuration)
    }

    const getPhysicalAttackLungeDistance = (effect) => {
      const attackerPoint = getCombatantEffectPoint(effect.attackerId, { preferCached: true })
      const targetPoint = getCombatantEffectPoint(effect.targetId)
      const fallbackCenterX =
        attackerPoint && targetPoint ? (attackerPoint.x + targetPoint.x) / 2 : null
      const centerX = Number.isFinite(attackerPoint?.fieldCenterX)
        ? attackerPoint.fieldCenterX
        : fallbackCenterX

      if (!attackerPoint || !Number.isFinite(centerX)) {
        return null
      }

      const distance = Math.abs(centerX - attackerPoint.x)
      return Number.isFinite(distance) && distance > 0 ? Math.round(Math.max(72, distance)) : null
    }

    validEffects.forEach((effect, index) => {
      const startTimeoutId = window.setTimeout(() => {
        hitEffectIdRef.current += 1
        const effectId = `${effect.targetId}-${hitEffectIdRef.current}`
        const isPhysical = effect.category === '물리형' || effect.category === '물리'
        const lungeDistance = isPhysical ? getPhysicalAttackLungeDistance(effect) : null
        const motionEffect = {
          ...effect,
          id: effectId,
          isPhysical,
          ...(Number.isFinite(lungeDistance) ? { lungeDistance } : {}),
        }

        if (isPhysical) {
          setAttackMotions((current) => [...current, motionEffect].slice(-4))
          playBattleAttackSound(effect, 'physical-move')

          const hitTimeoutId = window.setTimeout(() => {
            playBattleAttackSound(effect, 'hit')
            showHitEffect(effect)
            applyVisualAttackDamage(effect)
            hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(
              (currentTimeoutId) => currentTimeoutId !== hitTimeoutId
            )
          }, getGameDuration(Math.floor(ATTACK_MOTION_DURATION_MS * 0.42)))
          hitEffectTimeoutsRef.current.push(hitTimeoutId)

          const endMotionTimeoutId = window.setTimeout(() => {
            setAttackMotions((current) =>
              current.filter((currentEffect) => currentEffect.id !== effectId)
            )
            hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(
              (currentTimeoutId) => currentTimeoutId !== endMotionTimeoutId
            )
          }, getGameDuration(ATTACK_MOTION_DURATION_MS))

          hitEffectTimeoutsRef.current.push(endMotionTimeoutId)
        } else {
          const startPoint = getCombatantEffectPoint(effect.attackerId)
          const endPoint = getCombatantEffectPoint(effect.targetId)
          playBattleAttackSound(effect, 'special-launch')
          playBattleAttackSound(effect, 'special-travel')

          if (startPoint && endPoint) {
            setProjectileEffects((current) =>
              [
                ...current,
                {
                  ...motionEffect,
                  startX: startPoint.x,
                  startY: startPoint.y,
                  endX: endPoint.x,
                  endY: endPoint.y,
                },
              ].slice(-4)
            )
          }

          const hitTimeoutId = window.setTimeout(() => {
            playBattleAttackSound(effect, 'hit')
            showHitEffect(effect)
            applyVisualAttackDamage(effect)
            hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(
              (currentTimeoutId) => currentTimeoutId !== hitTimeoutId
            )
          }, getGameDuration(PROJECTILE_EFFECT_DURATION_MS))
          hitEffectTimeoutsRef.current.push(hitTimeoutId)

          const endProjectileTimeoutId = window.setTimeout(() => {
            setProjectileEffects((current) =>
              current.filter((currentEffect) => currentEffect.id !== effectId)
            )
            hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(
              (currentTimeoutId) => currentTimeoutId !== endProjectileTimeoutId
            )
          }, getGameDuration(PROJECTILE_EFFECT_DURATION_MS + 80))

          hitEffectTimeoutsRef.current.push(endProjectileTimeoutId)
        }

        hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(
          (currentTimeoutId) => currentTimeoutId !== startTimeoutId
        )
      }, getGameDuration(index * HIT_EFFECT_SEQUENCE_INTERVAL_MS))

      hitEffectTimeoutsRef.current.push(startTimeoutId)
    })

    return Math.max(
      ...validEffects.map(
        (effect, index) => getGameDuration(index * HIT_EFFECT_SEQUENCE_INTERVAL_MS) + getEffectAnimationDuration(effect)
      )
    )
  }

  const runAfterBattleAttackEffects = (effects, callback, { logs = [] } = {}) => {
    const logDelay = logs.length > 0 ? showBattleLogSequence(logs, { finalBattlePanel: 'logs' }) : 0
    const effectDelay = playBattleAttackEffects(effects)
    const delay = Math.max(logDelay, effectDelay)

    if (delay <= 0) {
      callback()
      return
    }

    if (logs.length === 0) {
      setBattlePanelMode('animating')
    }

    const finishTimeoutId = window.setTimeout(() => {
      callback()
      hitEffectTimeoutsRef.current = hitEffectTimeoutsRef.current.filter(
        (currentTimeoutId) => currentTimeoutId !== finishTimeoutId
      )
    }, delay)

    hitEffectTimeoutsRef.current.push(finishTimeoutId)
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

  const clearCapturePreviewTimeouts = () => {
    capturePreviewTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    capturePreviewTimeoutsRef.current = []
  }

  const showCapturePreview = (combatant) => {
    clearCapturePreviewTimeouts()
    capturePreviewIdRef.current += 1
    const previewId = `${combatant.id}-${capturePreviewIdRef.current}`

    setCapturePreview({
      combatant,
      id: previewId,
    })

    const hideTimeoutId = window.setTimeout(() => {
      setCapturePreview(null)
      capturePreviewTimeoutsRef.current = []
    }, CAPTURE_INFO_TAB_DURATION_MS * 3)
    capturePreviewTimeoutsRef.current.push(hideTimeoutId)
  }

  const openCombatantInfo = (combatantInfoId, element) => {
    activeCombatantInfoElementRef.current = element
    setActiveCombatantInfoId(combatantInfoId)
  }

  const closeCombatantInfo = () => {
    activeCombatantInfoElementRef.current = null
    setActiveCombatantInfoId(null)
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

  const handleSkipSkillReplacement = () => {
    advanceSkillReplacementQueue()
  }

  const handleReplaceSkill = (oldSkillName) => {
    const activeEvent = skillReplaceState?.queue?.[skillReplaceState.index ?? 0]

    if (!activeEvent?.combatantId || !oldSkillName) {
      advanceSkillReplacementQueue()
      return
    }

    setGameState((current) => {
      if (!current) {
        return current
      }

      const currentParty = syncPartyMember(current.party, current.player)
      const targetMember = getCombatantById(currentParty, activeEvent.combatantId)

      if (!targetMember) {
        return current
      }

      let hasReplaced = false
      const nextSkills = (targetMember.skills ?? []).map((skillName) => {
        if (!hasReplaced && skillName === oldSkillName) {
          hasReplaced = true
          return activeEvent.newSkillName
        }

        return skillName
      })

      if (!hasReplaced) {
        return current
      }

      const updatedMember = {
        ...targetMember,
        skills: [...new Set(nextSkills)].slice(0, MAX_COMBATANT_SKILL_COUNT),
      }
      const nextParty = replacePartyMember(currentParty, updatedMember)
      const nextPlayer =
        current.player?.id === updatedMember.id
          ? updatedMember
          : getCombatantById(nextParty, current.player?.id) ?? current.player

      return {
        ...current,
        player: nextPlayer,
        party: nextParty,
      }
    })
    advanceSkillReplacementQueue()
  }

  const showLevelUpStatPreview = (previousStats, currentStats, evolutionTargets = []) => {
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
    setLevelUpStatPreview({
      isExiting: false,
      rows: statRows,
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
        actingAllyId: null,
        actingAlly: null,
      }
    }

    const party = battleState.party?.length
      ? syncPartyMember(battleState.party, battleState.player)
      : []
    const activeAllyIds = getActiveAllyIdsForParty(
      party,
      battleState.activeAllyIds ?? [battleState.player?.id],
      getBattleAllyLimit(battleState)
    )
    const preferredActingAllyId =
      activeAllyIds.includes(battleState.actingAllyId) &&
      isCombatantAbleToBattle(getCombatantById(party, battleState.actingAllyId))
        ? battleState.actingAllyId
        : null
    const actingAllyId =
      preferredActingAllyId ??
      getNextActingAllyId(party, activeAllyIds, battleState.actedAllyIds ?? []) ??
      getFirstLivingPartyMember(party, activeAllyIds)?.id ??
      null

    return {
      party,
      activeAllyIds,
      actingAllyId,
      actingAlly: getCombatantById(party, actingAllyId),
    }
  }

  const finishBattleAction = ({
    nextParty,
    nextEnemies,
    logs,
    actedAllyId,
    hitEffects: actionHitEffects = [],
    nextInventory = gameState?.inventory ?? {},
    nextGold = gameState?.gold ?? 0,
    preferredActiveAllyIds = gameState?.activeAllyIds ?? [],
    capturedPreviewCombatant = null,
  }) => {
    if (!gameState) {
      return
    }

    playBattleAttackEffects(actionHitEffects)

    let resolvedParty = [...nextParty]
    let resolvedEnemies = [...nextEnemies]
    let resolvedLogs = [...logs]
    let presentedLogCount = 0
    let activeAllyIds = getActiveAllyIdsForParty(
      resolvedParty,
      preferredActiveAllyIds,
      getBattleAllyLimit(gameState)
    )
    let actedAllyIds = Array.from(
      new Set([...(gameState.actedAllyIds ?? []), actedAllyId].filter(Boolean))
    )

    const commitBattleState = ({ nextPlayer, battlePanel, nextActedAllyIds = actedAllyIds }) => {
      setGameState({
        ...gameState,
        player: nextPlayer,
        party: resolvedParty,
        enemies: resolvedEnemies,
        inventory: nextInventory,
        gold: nextGold,
        activeAllyIds,
        actingAllyId: nextPlayer?.id ?? null,
        actedAllyIds: nextActedAllyIds,
        pendingAllyActions: [],
      })
      const logsToPresent =
        presentedLogCount > 0 ? resolvedLogs.slice(presentedLogCount) : resolvedLogs
      showBattleLogSequence(logsToPresent, { finalBattlePanel: battlePanel })
      setSelectedEnemyTargetId(null)

      if (battlePanel === 'commands') {
        setSelectedBattleCommand('attack')
        setSelectedSkillIndex(0)
      }

      if (capturedPreviewCombatant) {
        showCapturePreview(capturedPreviewCombatant)
      }
    }

    const commitVictory = () => {
      resolvedParty = resolvedParty.map((member) =>
        activeAllyIds.includes(member.id) ? tickCombatantBuffsByStage(member) : member
      )
      activeAllyIds = getActiveAllyIdsForParty(
        resolvedParty,
        activeAllyIds,
        getBattleAllyLimit(gameState)
      )
      nextGold += getStageClearGoldReward(gameState.currentStage, nextInventory)
      resolvedLogs.push('아이템을 선택하세요')
      const rewardTarget = getFirstLivingPartyMember(resolvedParty, activeAllyIds)
      setRewardState(
        createRewardSelection(
          nextInventory,
          resolvedParty,
          gameState.levelCap,
          gameState.currentStage
        )
      )
      commitBattleState({
        nextPlayer: rewardTarget,
        battlePanel: 'logs',
        nextActedAllyIds: [],
      })
    }

    const commitDefeat = () => {
      clearStageSave()
      resolvedLogs.push('눈앞이 깜깜해졌다...')
      commitBattleState({
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

    if (resolvedEnemies.every((enemy) => !isCombatantAbleToBattle(enemy))) {
      commitVictory()
      return
    }

    if (!resolvedParty.some((member) => isCombatantAbleToBattle(member))) {
      commitDefeat()
      return
    }

    let nextActingAllyId = getNextActingAllyId(resolvedParty, activeAllyIds, actedAllyIds)

    if (nextActingAllyId) {
      const nextPlayer = getCombatantById(resolvedParty, nextActingAllyId)
      resolvedLogs.push(getBattlePrompt(nextPlayer.name))
      commitBattleState({ nextPlayer, battlePanel: 'commands' })
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
    resolvedLogs.push(...enemyPhaseResult.battleLogs)
    presentedLogCount = resolvedLogs.length

    runAfterBattleAttackEffects(enemyPhaseResult.hitEffects, () => {
      activeAllyIds = getActiveAllyIdsForParty(
        resolvedParty,
        activeAllyIds,
        getBattleAllyLimit(gameState)
      )
      const miracleRubyResult = applyMiracleRubyTurnHealing({
        party: resolvedParty,
        activeAllyIds,
      })
      resolvedParty = miracleRubyResult.nextParty
      resolvedLogs.push(...miracleRubyResult.battleLogs)
      activeAllyIds = getActiveAllyIdsForParty(
        resolvedParty,
        activeAllyIds,
        getBattleAllyLimit(gameState)
      )
      actedAllyIds = []

      if (resolvedEnemies.every((enemy) => !isCombatantAbleToBattle(enemy))) {
        commitVictory()
        return
      }

      if (!resolvedParty.some((member) => isCombatantAbleToBattle(member))) {
        commitDefeat()
        return
      }

      nextActingAllyId = getNextActingAllyId(resolvedParty, activeAllyIds, actedAllyIds)
      const nextPlayer =
        getCombatantById(resolvedParty, nextActingAllyId) ??
        getFirstLivingPartyMember(resolvedParty, activeAllyIds)
      resolvedLogs.push(getBattlePrompt(nextPlayer.name))
      commitBattleState({ nextPlayer, battlePanel: 'commands', nextActedAllyIds: [] })
    }, { logs: resolvedLogs })
  }

  const finishResolvedTurn = ({
    nextParty,
    nextEnemies,
    logs,
    skillLearnEvents = [],
    nextInventory = gameState?.inventory ?? {},
    nextGold = gameState?.gold ?? 0,
    preferredActiveAllyIds = gameState?.activeAllyIds ?? [],
    nextEscapeAttempts = gameState?.escapeAttempts ?? 0,
    alreadyPresentedLogCount = 0,
  }) => {
    if (!gameState) {
      return
    }

    let resolvedParty = [...nextParty]
    let resolvedEnemies = [...nextEnemies]
    let resolvedLogs = [...logs]
    let activeAllyIds = getActiveAllyIdsForParty(
      resolvedParty,
      preferredActiveAllyIds,
      getBattleAllyLimit(gameState)
    )

    const commitBattleState = ({ nextPlayer, battlePanel }) => {
      setGameState({
        ...gameState,
        player: nextPlayer,
        party: resolvedParty,
        enemies: resolvedEnemies,
        inventory: nextInventory,
        gold: nextGold,
        escapeAttempts: nextEscapeAttempts,
        activeAllyIds,
        actingAllyId: nextPlayer?.id ?? null,
        actedAllyIds: [],
        pendingAllyActions: [],
      })
      const logsToPresent =
        alreadyPresentedLogCount > 0 ? resolvedLogs.slice(alreadyPresentedLogCount) : resolvedLogs
      showBattleLogSequence(logsToPresent, { finalBattlePanel: battlePanel })
      setSelectedBattleCommand('attack')
      setSelectedSkillIndex(0)
      setSelectedEnemyTargetId(null)
      queueSkillReplacementEvents(skillLearnEvents)
    }

    const commitVictory = () => {
      resolvedParty = resolvedParty.map((member) =>
        activeAllyIds.includes(member.id) ? tickCombatantBuffsByStage(member) : member
      )
      activeAllyIds = getActiveAllyIdsForParty(
        resolvedParty,
        activeAllyIds,
        getBattleAllyLimit(gameState)
      )
      nextGold += getStageClearGoldReward(gameState.currentStage, nextInventory)
      resolvedLogs.push('전투에서 승리했다!')
      const rewardTarget = getFirstLivingPartyMember(resolvedParty, activeAllyIds)
      setRewardState(
        createRewardSelection(
          nextInventory,
          resolvedParty,
          gameState.levelCap,
          gameState.currentStage
        )
      )
      commitBattleState({
        nextPlayer: rewardTarget,
        battlePanel: 'logs',
      })
    }

    const commitDefeat = () => {
      clearStageSave()
      resolvedLogs.push('눈앞이 깜깜해졌다...')
      commitBattleState({
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

    if (resolvedEnemies.every((enemy) => !isCombatantAbleToBattle(enemy))) {
      commitVictory()
      return
    }

    if (!resolvedParty.some((member) => isCombatantAbleToBattle(member))) {
      commitDefeat()
      return
    }

    const nextPlayer = getFirstLivingPartyMember(resolvedParty, activeAllyIds)
    resolvedLogs.push(getBattlePrompt(nextPlayer.name))
    commitBattleState({ nextPlayer, battlePanel: 'commands' })
  }

  const startNextStage = ({ currentGameState, currentPlayer, nextStageNum, mapName }) => {
    const encounterGroup = getEncounterGroupForStage(nextStageNum)
    const encounterCount = getEncounterCountForStage(nextStageNum)
    const levelCap = getLevelCapForStage(nextStageNum)
    const mapEncounterPool = getMapEncounterGroups(mapName)?.[encounterGroup] ?? []
    const bossEncounterPool = getBossEncounterNamesForStage(mapName, nextStageNum)
    const newEnemies = buildEnemyParty(
      nextStageNum,
      mapEncounterPool,
      encounterCount,
      bossEncounterPool
    )
    const eggProgressResult = progressDigiEggPartyByStage(
      syncPartyMember(currentGameState.party, currentPlayer)
    )
    const didMoveMap = isMapMoveStage(nextStageNum)
    const nextParty = didMoveMap
      ? fullyRestoreParty(eggProgressResult.nextParty)
      : eggProgressResult.nextParty
    const preferredActiveAllyIds = [
      currentPlayer?.id,
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
    const nextPlayer =
      getCombatantById(nextParty, currentPlayer?.id) ??
      getFirstLivingPartyMember(nextParty, nextActiveAllyIds) ??
      currentPlayer

    const nextGameState = {
      ...currentGameState,
      currentStage: nextStageNum,
      currentMap: mapName,
      encounterGroup,
      encounterCount,
      encounterPool: mapEncounterPool,
      levelCap,
      enemies: newEnemies,
      player: nextPlayer,
      party: nextParty,
      activeAllyIds: nextActiveAllyIds,
      actingAllyId: nextPlayer?.id ?? null,
      actedAllyIds: [],
      pendingAllyActions: [],
      escapeAttempts: 0,
    }

    setGameState(nextGameState)
    saveStageGameState(nextGameState)
    setIsPlayerExpBarVisible(false)
    showImmediateBattleLogs(
      ...eggProgressResult.hatchLogs,
      didMoveMap ? '새로운 지역에 도착해 파티 전원이 부활하고 완전히 회복됐다!' : null,
      getBattlePrompt(nextPlayer?.name ?? '디지몬')
    )
    setSelectedBattleCommand('attack')
    setSelectedSkillIndex(0)
    setSelectedEnemyTargetId(null)
    setBattlePanelMode('commands')
    setRewardState(null)
    setEvolutionState(null)
    setMapSelectionState(null)
    setCapturePreview(null)
  }

  const handleNextStage = (currentGameState, currentPlayer) => {
    const nextStageNum = currentGameState.currentStage + 1
    if (nextStageNum > TOTAL_STAGE_COUNT) {
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

    if (isMapMoveStage(nextStageNum)) {
      const hasMapItem = (currentGameState.inventory?.[MAP_ITEM_ID] ?? 0) > 0

      if (hasMapItem) {
        setMapSelectionState({
          currentGameState,
          currentPlayer,
          nextStageNum,
          options: getConnectedMapNames(currentGameState.currentMap),
        })
        showImmediateBattleLogs('지도를 펼쳤다. 다음 지역을 선택해줘!')
        setBattlePanelMode('logs')
        setSelectedBattleCommand('attack')
        setSelectedEnemyTargetId(null)
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

  const handleSkillSelect = (skillIndex) => {
    if (rewardState || !gameState || battlePanelMode !== 'attack') {
      return
    }

    const playerSkill = battleSkillSlots[skillIndex]

    if (!playerSkill) {
      return
    }

    setSelectedSkillIndex(skillIndex)
    setHoveredSkillIndex(skillIndex)
    setSelectedBattleCommand('attack')
    setSelectedEnemyTargetId(null)

    const playerSkillData = getSkillData(playerSkill)
    const livingEnemies = gameState.enemies.filter((enemy) => isCombatantAbleToBattle(enemy))

    if (!shouldChooseEnemyTarget(playerSkillData, livingEnemies.length)) {
      setHoveredSkillIndex(null)
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
    setHoveredSkillIndex(null)
    setHoveredEnemyTargetId(null)
    clearBattleLogSequence()
    setCurrentLogs([])
  }

  const handleSkillPreview = (skillIndex) => {
    if (rewardState || !gameState || battlePanelMode !== 'attack') {
      return
    }

    if (!battleSkillSlots[skillIndex]) {
      return
    }

    setHoveredSkillIndex(skillIndex)
  }

  const handleSkillPreviewClear = () => {
    setHoveredSkillIndex(null)
  }

  const handleTargetPreview = (enemyId) => {
    if (rewardState || !gameState || battlePanelMode !== 'attack-targets') {
      return
    }

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
    if (!playerSkill) return

    setSelectedSkillIndex(skillIndex)
    setHoveredSkillIndex(null)
    setHoveredEnemyTargetId(null)
    setSelectedBattleCommand('attack')
    const playerSkillData = getSkillData(playerSkill)
    const isAreaAttack = isSkillAreaAttack(playerSkillData)
    const needsEnemyTarget = isEnemyTargetSkill(playerSkillData)
    const isSingleEnemyTarget =
      needsEnemyTarget && getSkillTargetScope(playerSkillData) === 'single'

    if (!isSingleEnemyTarget || isAreaAttack) {
      setSelectedEnemyTargetId(null)
    }

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

    if (nextPendingActions.length < livingActiveAllyIds.length) {
      const nextActedAllyIds = nextPendingActions.map((action) => action.actorId)
      const nextActingAllyId = getNextActingAllyId(
        battleContext.party,
        battleContext.activeAllyIds,
        nextActedAllyIds
      )
      const nextPlayer =
        getCombatantById(battleContext.party, nextActingAllyId) ??
        getFirstLivingPartyMember(battleContext.party, battleContext.activeAllyIds)

      setGameState({
        ...gameState,
        player: nextPlayer,
        party: battleContext.party,
        activeAllyIds: battleContext.activeAllyIds,
        actingAllyId: nextPlayer?.id ?? null,
        actedAllyIds: nextActedAllyIds,
        pendingAllyActions: nextPendingActions,
      })
      showImmediateBattleLogs(`${actingAlly.name}의 행동을 정했다!`, getBattlePrompt(nextPlayer.name))
      setBattlePanelMode('commands')
      setSelectedSkillIndex(0)
      setSelectedEnemyTargetId(null)
      return
    }

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
    }, { logs: turnResult.battleLogs })
  }

  useEffect(() => {
    if (screenMode === 'adventure' || mapTransition.isFading) {
      return undefined
    }

    const rotationId = window.setTimeout(() => {
      setMapTransition((current) => ({
        previousIndex: current.activeIndex,
        activeIndex: getRandomMapIndex(current.activeIndex),
        isFading: true,
      }))
    }, MAP_ROTATION_MS)

    return () => {
      window.clearTimeout(rotationId)
    }
  }, [mapTransition.activeIndex, mapTransition.isFading, screenMode])

  useEffect(() => {
    if (screenMode === 'adventure' || !mapTransition.isFading) {
      return undefined
    }

    const fadeId = window.setTimeout(() => {
      setMapTransition((current) => ({
        ...current,
        previousIndex: current.activeIndex,
        isFading: false,
      }))
    }, MAP_FADE_MS)

    return () => {
      window.clearTimeout(fadeId)
    }
  }, [mapTransition.activeIndex, mapTransition.isFading, screenMode])

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
      readyEvolutionTargets: getReadyEvolutionPreviewTargets(gameState.player, gameState.inventory),
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
      const previousReadyEvolutionTargetNames = new Set(
        (previousSnapshot.readyEvolutionTargets ?? []).map((target) => target.name)
      )
      const newlyReadyEvolutionTargets = currentSnapshot.readyEvolutionTargets.filter(
        (target) => !previousReadyEvolutionTargetNames.has(target.name)
      )

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
  ])

  useEffect(
    () => () => {
      expAnimationTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      levelUpStatTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      hitEffectTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      battleEffectFrameIdsRef.current.forEach((frameId) => window.cancelAnimationFrame(frameId))
      battleLogSequenceTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      clearCapturePreviewTimeouts()
    },
    []
  )

  useEffect(() => {
    if (!activeCombatantInfoId) {
      return undefined
    }

    const handleCombatantInfoPointerMove = (event) => {
      const activeElement = activeCombatantInfoElementRef.current
      const closeActiveCombatantInfo = () => {
        activeCombatantInfoElementRef.current = null
        setActiveCombatantInfoId(null)
      }

      if (!activeElement || !document.body.contains(activeElement)) {
        closeActiveCombatantInfo()
        return
      }

      const infoPanel = activeElement.querySelector('.combatant-info')
      const isInsideTrigger = isClientPointInsideElement(activeElement, event.clientX, event.clientY)
      const isInsidePanel = isClientPointInsideElement(infoPanel, event.clientX, event.clientY)

      if (!isInsideTrigger && !isInsidePanel) {
        closeActiveCombatantInfo()
      }
    }

    window.addEventListener('pointermove', handleCombatantInfoPointerMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handleCombatantInfoPointerMove)
    }
  }, [activeCombatantInfoId])

  const repositionDigitDrop = (dropId) => {
    setDigitDrops((currentDrops) =>
      currentDrops.map((drop) =>
        drop.id === dropId
          ? {
              ...drop,
              left: getRandomLeft(),
              drift: getRandomDrift(),
            }
          : drop
      )
    )
  }

  const handleDigitLoop = (dropId, event) => {
    if (event.target !== event.currentTarget || event.animationName !== 'digit-fall') {
      return
    }

    repositionDigitDrop(dropId)
  }

  const resetAdventureUiState = () => {
    clearCapturePreviewTimeouts()
    clearHitEffectQueue()
    clearExpAnimationQueue()
    clearLevelUpStatAnimationQueue()
    clearBattleLogSequence()
    setCapturePreview(null)
    setRewardState(null)
    setEvolutionState(null)
    setEvolutionScene(null)
    setMapSelectionState(null)
    setSkillReplaceState(null)
    setLevelUpStatPreview(null)
    setCurrentLogs([])
    setSelectedBattleCommand('attack')
    setBattlePanelMode('commands')
    setSelectedSkillIndex(0)
    setHoveredSkillIndex(null)
    setSelectedEnemyTargetId(null)
    setHoveredEnemyTargetId(null)
    setActiveCombatantInfoId(null)
    setIsPlayerExpBarVisible(false)
    setIsPlayerExpTransitionInstant(true)
  }

  const handleMenuAction = (actionKey) => {
    if (actionKey === 'new-game') {
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
      const savedGameState = loadSavedGameStateFromStorage()

      if (!savedGameState) {
        clearStageSave()
        return
      }

      resetAdventureUiState()
      setGameState(savedGameState)
      setDisplayedPlayerExpRatio(getExperienceRatio(savedGameState.player))
      showImmediateBattleLogs(getBattlePrompt(savedGameState.player?.name ?? '디지몬'))
      setScreenMode('adventure')
    }
  }

  const handleRunAttempt = () => {
    if (
      rewardState ||
      mapSelectionState ||
      !gameState ||
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

    const nextEscapeAttempts = (gameState.escapeAttempts ?? 0) + 1
    const runSucceeded = rollRunAttempt({
      party: currentParty,
      activeAllyIds,
      enemies: gameState.enemies,
      attemptCount: nextEscapeAttempts,
    })
    const runLogs = [`${actingAlly.name}은(는) 도망치려 했다!`]

    setSelectedBattleCommand('run')
    setSelectedEnemyTargetId(null)
    setHoveredEnemyTargetId(null)
    setHoveredSkillIndex(null)

    if (runSucceeded) {
      const nextPlayer =
        getCombatantById(currentParty, gameState.player?.id) ??
        getFirstLivingPartyMember(currentParty, activeAllyIds) ??
        actingAlly
      const escapedGameState = {
        ...gameState,
        player: nextPlayer,
        party: currentParty,
        activeAllyIds,
        actedAllyIds: [],
        pendingAllyActions: [],
        escapeAttempts: 0,
      }

      setGameState(escapedGameState)
      setBattlePanelMode('logs')
      showImmediateBattleLogs(...runLogs, '무사히 도망쳤다!', '보상 없이 다음 스테이지로 이동한다.')

      window.setTimeout(() => {
        handleNextStage(escapedGameState, escapedGameState.player)
      }, getGameDuration(RUN_STAGE_ADVANCE_DELAY_MS))
      return
    }

    const enemyActions = createEnemyBattleTurnActions({
      enemies: gameState.enemies,
      party: currentParty,
      activeAllyIds,
    })
    const turnResult = resolveBattleTurnActions({
      party: currentParty,
      enemies: gameState.enemies,
      activeAllyIds,
      actions: enemyActions,
      levelCap: gameState.levelCap,
      inventory: gameState.inventory,
    })
    const failureLogs = [
      ...runLogs,
      '도망칠 수 없었다!',
      ...(enemyActions.length > 0 ? ['상대의 차례!'] : []),
      ...turnResult.battleLogs,
    ]

    runAfterBattleAttackEffects(turnResult.hitEffects, () => {
      finishResolvedTurn({
        nextParty: turnResult.nextParty,
        nextEnemies: turnResult.nextEnemies,
        logs: failureLogs,
        skillLearnEvents: turnResult.skillLearnEvents,
        preferredActiveAllyIds: activeAllyIds,
        nextEscapeAttempts,
        alreadyPresentedLogCount: failureLogs.length,
      })
    }, { logs: failureLogs })
  }

  const handleBattleCommandSelect = (commandKey) => {
    if (
      rewardState ||
      mapSelectionState ||
      !gameState ||
      battlePanelMode === 'logs' ||
      battlePanelMode === 'animating'
    ) {
      return
    }

    const isPriorityCommand = commandKey === 'swap' || commandKey === 'run'

    if ((gameState.pendingAllyActions ?? []).length > 0 && commandKey !== 'attack' && !isPriorityCommand) {
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
      setHoveredSkillIndex(null)
      setHoveredEnemyTargetId(null)
      setSelectedEnemyTargetId(null)
      return
    }

    if (commandKey === 'item') {
      setBattlePanelMode('items')
      setHoveredSkillIndex(null)
      setHoveredEnemyTargetId(null)
      setSelectedEnemyTargetId(null)
      return
    } else if (commandKey === 'swap') {
      setBattlePanelMode('party')
      setHoveredSkillIndex(null)
      setHoveredEnemyTargetId(null)
      setSelectedEnemyTargetId(null)
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

    setSelectedEnemyTargetId(enemyId)
    setHoveredEnemyTargetId(null)
    handleExecuteSkill(selectedSkillIndex, enemyId)
  }

  const handleUseCaptureItem = (itemId) => {
    const battleContext = getBattleContext()
    const actingAlly = battleContext.actingAlly

    if (
      rewardState ||
      !gameState ||
      battlePanelMode !== 'items' ||
      !actingAlly ||
      !isCombatantAbleToBattle(actingAlly)
    ) {
      return
    }

    const captureItem = captureItemLookup.get(itemId)
    const itemCount = gameState.inventory?.[itemId] ?? 0

    if (!captureItem || itemCount <= 0) {
      return
    }

    const livingEnemies = gameState.enemies.filter((enemy) => isCombatantAbleToBattle(enemy))
    if (livingEnemies.length !== 1) {
      showImmediateBattleLogs(
        '적 디지몬이 1마리만 남았을 때 포획할 수 있다!',
        getBattlePrompt(actingAlly.name)
      )
      return
    }

    clearCapturePreviewTimeouts()
    setCapturePreview(null)

    const targetEnemy = livingEnemies[0]
    const targetEnemyIndex = gameState.enemies.findIndex((enemy) => enemy.id === targetEnemy.id)
    const captureChance = captureChanceByTier[captureItem.captureTier] ?? 0
    const isCaptured = rollPercentChance(captureChance)
    const nextInventory = removeInventoryItem(gameState.inventory, itemId)
    let nextEnemies = [...gameState.enemies]
    let nextParty = [...battleContext.party]
    let capturedPreviewCombatant = null
    const logs = [`${actingAlly.name}은(는) ${captureItem.name}을(를) 사용했다!`]

    if (isCaptured) {
      const capturedMember = createCapturedPartyMember(
        targetEnemy,
        `captured-${gameState.currentStage}-${targetEnemy.id}-${nextParty.length}`
      )
      nextEnemies[targetEnemyIndex] = {
        ...targetEnemy,
        currentHp: 0,
        statusEffect: null,
      }
      nextParty = [...nextParty, capturedMember]
      capturedPreviewCombatant = capturedMember
      logs.push(`${targetEnemy.name}을(를) 포획했다!`)
    } else {
      logs.push(`${targetEnemy.name}은(는) 그물에서 빠져나왔다!`)
    }

    finishBattleAction({
      nextParty,
      nextEnemies,
      logs,
      actedAllyId: actingAlly.id,
      nextInventory,
      preferredActiveAllyIds: battleContext.activeAllyIds,
      capturedPreviewCombatant,
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
    const pendingAllyActions = (gameState.pendingAllyActions ?? []).filter(
      (action) =>
        action.side === 'ally' &&
        action.actorId !== currentPlayer.id &&
        isCombatantAbleToBattle(getCombatantById(battleContext.party, action.actorId))
    )

    if (pendingAllyActions.length > 0) {
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

      setGameState(switchedGameState)
      setSelectedBattleCommand('swap')
      setSelectedEnemyTargetId(null)
      setBattlePanelMode('logs')

      runAfterBattleLayout(() => {
        runAfterBattleAttackEffects(turnResult.hitEffects, () => {
          finishResolvedTurn({
            nextParty: turnResult.nextParty,
            nextEnemies: turnResult.nextEnemies,
            logs: presentedLogs,
            skillLearnEvents: turnResult.skillLearnEvents,
            preferredActiveAllyIds: nextActiveAllyIds,
            alreadyPresentedLogCount: presentedLogs.length,
          })
        }, { logs: presentedLogs })
      })
      return
    }

    setGameState({
      ...gameState,
      player: nextPlayer,
      party: battleContext.party,
      activeAllyIds: nextActiveAllyIds,
      actingAllyId: nextPlayer.id,
      actedAllyIds: Array.from(
        new Set([...(gameState.actedAllyIds ?? []), nextPlayer.id].filter(Boolean))
      ),
      pendingAllyActions: [],
    })
    setSelectedBattleCommand('swap')
    setSelectedEnemyTargetId(null)
    setBattlePanelMode('logs')

    runAfterBattleLayout(() => {
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

  const completeRewardItemUse = ({ rewardItem, source, targetId = null, targetIds = [] }) => {
    if (!gameState || !rewardItem) {
      return
    }

    if (source === 'fixed' && (gameState.gold ?? 0) < (rewardItem.price ?? 0)) {
      return
    }

    const currentParty = syncPartyMember(gameState.party, gameState.player)
    const levelCap = gameState.levelCap ?? Infinity
    const effectiveRewardItem = getRewardItemWithInventoryModifiers(rewardItem, gameState.inventory)
    const finishRewardUse = (nextGameState, skillLearnEvents = []) => {
      setGameState(nextGameState)
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
      window.setTimeout(() => {
        setRewardState(null)
        setEvolutionState(null)
        handleNextStage(nextGameState, nextGameState.player)
      }, 1200)
    }

    if (effectiveRewardItem.jogressRecipes) {
      const selectedMembers = targetIds.map((memberId) => getCombatantById(currentParty, memberId)).filter(Boolean)
      const jogressRecipe = getJogressRecipeForMembers(selectedMembers, effectiveRewardItem.jogressRecipes)
      const targetData = jogressRecipe ? allDigimonLookup.get(jogressRecipe.targetName) : null

      if (selectedMembers.length !== (jogressRecipe?.materials?.length ?? 0) || !jogressRecipe || !targetData) {
        return
      }

      const [primaryMember, ...partnerMembers] = selectedMembers
      const jogressMember = createJogressCombatant(primaryMember, partnerMembers, targetData)
      const selectedIdSet = new Set(targetIds)
      const partnerIdSet = new Set(partnerMembers.map((member) => member.id))
      const nextParty = currentParty
        .filter((member) => !partnerIdSet.has(member.id))
        .map((member) => (member.id === primaryMember.id ? jogressMember : member))
      const nextPlayer =
        selectedIdSet.has(gameState.player?.id)
          ? jogressMember
          : getCombatantById(nextParty, gameState.player?.id) ??
            getFirstLivingPartyMember(nextParty, gameState.activeAllyIds) ??
            jogressMember
      const nextActiveAllyIds = getActiveAllyIdsForParty(
        nextParty,
        (gameState.activeAllyIds ?? []).filter((memberId) => !partnerIdSet.has(memberId)),
        getBattleAllyLimit(gameState)
      )

      finishRewardUse({
        ...gameState,
        gold: source === 'fixed' ? (gameState.gold ?? 0) - (rewardItem.price ?? 0) : gameState.gold,
        player: nextPlayer,
        party: nextParty,
        activeAllyIds: nextActiveAllyIds,
      })
      return
    }

    if (rewardItem.digiEggName) {
      const nextEgg = createDigiEggCombatant({
        id: `egg-${gameState.currentStage}-${currentParty.length + 1}-${Date.now()}`,
        eggName: rewardItem.digiEggName,
        hatchPool: rewardItem.hatchPool ?? [],
      })
      const nextParty = [...currentParty, nextEgg]
      const nextPlayer =
        getCombatantById(nextParty, gameState.player?.id) ?? gameState.player ?? nextParty[0] ?? null

      finishRewardUse({
        ...gameState,
        gold: source === 'fixed' ? (gameState.gold ?? 0) - (rewardItem.price ?? 0) : gameState.gold,
        player: nextPlayer,
        party: nextParty,
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
    setEvolutionState((current) =>
      current
        ? {
            ...current,
            confirmTargetName: targetName,
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
    if (!gameState || !evolutionState?.selectedMemberId || !evolutionState.confirmTargetName) {
      return
    }

    const currentParty = syncPartyMember(gameState.party, gameState.player)
    const selectedMember = getCombatantById(currentParty, evolutionState.selectedMemberId)
    const targetData = allDigimonLookup.get(evolutionState.confirmTargetName)
    const selectedOption = getEvolutionOptions(selectedMember, gameState.inventory).find(
      (option) => option.targetData.이름 === targetData?.이름
    )

    if (!selectedMember || !targetData || !selectedOption?.canEvolve) {
      return
    }

    const evolvedMember = createEvolvedCombatant(selectedMember, targetData)
    const nextParty = replacePartyMember(currentParty, evolvedMember)
    const nextInventory =
      selectedOption.evolutionType === 'item' && selectedOption.itemRequirement
        ? removeInventoryItem(gameState.inventory, selectedOption.itemRequirement.id)
        : gameState.inventory
    const nextPlayer =
      getCombatantById(nextParty, gameState.player?.id) ??
      getFirstLivingPartyMember(nextParty, gameState.activeAllyIds) ??
      evolvedMember
    const sceneId = `${selectedMember.id}-${targetData.이름}-${Date.now()}`

    setGameState({
      ...gameState,
      inventory: nextInventory,
      player: nextPlayer,
      party: nextParty,
    })

    if (gameSettings.evolutionSpeed === 'skip') {
      setEvolutionScene(null)
      setEvolutionState({
        mode: 'party',
        selectedMemberId: null,
        confirmTargetName: null,
      })
      return
    }

    setEvolutionScene({
      id: sceneId,
      phase: 'before',
      fromName: selectedMember.name,
      fromImageUrl: selectedMember.imageUrl,
      toName: evolvedMember.name,
      toImageUrl: evolvedMember.imageUrl,
    })
    window.setTimeout(() => {
      setEvolutionScene((current) =>
        current?.id === sceneId
          ? {
              ...current,
              phase: 'after',
            }
          : current
      )
    }, getEvolutionSceneDuration(EVOLUTION_SCENE_SWITCH_MS))
    window.setTimeout(() => {
      setEvolutionScene((current) => (current?.id === sceneId ? null : current))
      setEvolutionState({
        mode: 'party',
        selectedMemberId: null,
        confirmTargetName: null,
      })
    }, getEvolutionSceneDuration(EVOLUTION_SCENE_TOTAL_MS))
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

    const rerollCost = rewardState.rerollCost ?? getRewardRerollCost(gameState.currentStage, 0)
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
      nextRerollCount
    )

    setGameState({
      ...gameState,
      party: currentParty,
      gold: (gameState.gold ?? 0) - rerollCost,
    })
    setRewardState(nextRewardState)
  }

  const handleInventoryTooltipPosition = (event) => {
    const itemElement = event.currentTarget
    const stageElement = itemElement.closest('.adventure-stage')

    if (!stageElement) {
      return
    }

    const itemRect = itemElement.getBoundingClientRect()
    const stageRect = stageElement.getBoundingClientRect()
    const tooltipWidth = Math.min(260, Math.max(160, stageRect.width - 24))
    const safeInset = 12
    const itemCenterX = itemRect.left + itemRect.width / 2
    const minCenterX = stageRect.left + safeInset + tooltipWidth / 2
    const maxCenterX = stageRect.right - safeInset - tooltipWidth / 2
    const clampedCenterX = Math.min(Math.max(itemCenterX, minCenterX), maxCenterX)

    itemElement.style.setProperty('--inventory-tooltip-shift', `${clampedCenterX - itemCenterX}px`)
    itemElement.style.setProperty('--inventory-tooltip-max-width', `${tooltipWidth}px`)
  }

  const selectedGrowthDigimon = growthStageDigimon[selectedGrowthIndex] ?? growthStageDigimon[0]
  const selectedStarterCost = selectedStarterNames.length * STARTER_GROWTH_COST
  const selectedGrowthSkills = getDigimonSkillNamesForLevel(
    selectedGrowthDigimon?.data,
    STARTING_PLAYER_LEVEL
  )
  const selectedGrowthSkillSlots = Array.from(
    { length: 4 },
    (_, index) => selectedGrowthSkills[index] ?? null
  )
  const selectedGrowthType = selectedGrowthDigimon?.data?.타입 ?? '무'
  const selectedGrowthAttribute = selectedGrowthDigimon?.data?.속성 ?? '무'
  const selectedStarterSlots = Array.from(
    { length: PARTY_SLOT_COUNT },
    (_, index) =>
      selectedStarterNames[index]
        ? growthStageDigimon.find((digimon) => digimon.name === selectedStarterNames[index]) ?? null
        : null
  )
  const handleToggleStarterSelection = (digimon, index) => {
    setSelectedGrowthIndex(index)
    setSelectedStarterNames((currentNames) => {
      const isSelected = currentNames.includes(digimon.name)

      if (isSelected) {
        return currentNames.filter((name) => name !== digimon.name)
      }

      if (
        currentNames.length >= PARTY_SLOT_COUNT ||
        currentNames.length * STARTER_GROWTH_COST + STARTER_GROWTH_COST > STARTER_PARTY_COST_LIMIT
      ) {
        return currentNames
      }

      return [...currentNames, digimon.name]
    })
  }
  const handleRemoveStarterSelection = (digimonName) => {
    if (!digimonName) {
      return
    }

    setSelectedStarterNames((currentNames) => currentNames.filter((name) => name !== digimonName))
  }
  const handleRequestStartAdventure = () => {
    if (selectedStarterNames.length <= 0) {
      return
    }

    setIsMatchupGuideOpen(true)
  }
  const handleStartAdventure = () => {
    const selectedStarterDigimon = selectedStarterNames
      .map((name) => growthStageDigimon.find((digimon) => digimon.name === name))
      .filter(Boolean)

    if (!selectedStarterDigimon.length) {
      return
    }

    const startingStage = 1
    const mapName = getMapNameForStage(startingStage)
    const encounterGroup = getEncounterGroupForStage(startingStage)
    const encounterCount = getEncounterCountForStage(startingStage)
    const levelCap = getLevelCapForStage(startingStage)
    const mapEncounterPool = mapData[mapName]?.등장디지몬?.[encounterGroup] ?? []
    const bossEncounterPool = getBossEncounterNamesForStage(mapName, startingStage)
    const enemies = buildEnemyParty(startingStage, mapEncounterPool, encounterCount, bossEncounterPool)
    const startingParty = selectedStarterDigimon.slice(0, PARTY_SLOT_COUNT).map((digimon, index) =>
      createCombatant({
        id: index === 0 ? 'player' : `player-${index + 1}`,
        name: digimon.name,
        imageUrl: digimon.url,
        data: digimon.data,
        level: STARTING_PLAYER_LEVEL,
        stageName: digimon.stage ?? '성장기',
      })
    )
    const player = startingParty[0]
    const activeAllyIds = getActiveAllyIdsForParty(
      startingParty,
      [player.id],
      getBattleAllyLimit({
        encounterCount,
        enemies,
      })
    )

    const initialGameState = {
      currentStage: startingStage,
      maxStage: TOTAL_STAGE_COUNT,
      currentMap: mapName,
      gold: 0,
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
    }

    setGameState(initialGameState)
    saveStageGameState(initialGameState)
      showImmediateBattleLogs(getBattlePrompt(player.name))
    setSelectedBattleCommand('attack')
    setBattlePanelMode('commands')
    setSelectedSkillIndex(0)
    setSelectedEnemyTargetId(null)
    setRewardState(null)
    setEvolutionState(null)
    setMapSelectionState(null)
    setCapturePreview(null)
    setScreenMode('adventure')
  }
  const handleConfirmMatchupGuideStart = () => {
    setIsMatchupGuideOpen(false)
    handleStartAdventure()
  }

  const activeBackgroundUrl =
    screenMode === 'adventure' && gameState
      ? getMapBackgroundUrl(gameState.currentMap)
      : mapBackgrounds[
          mapTransition.isFading ? mapTransition.previousIndex : mapTransition.activeIndex
        ]
  const nextBackgroundUrl =
    screenMode === 'adventure' && gameState
      ? activeBackgroundUrl
      : mapBackgrounds[mapTransition.activeIndex]
  const battleContext = getBattleContext()
  const partyMembers = battleContext.party
  const activeSkillReplaceEvent = skillReplaceState?.queue?.[skillReplaceState.index ?? 0] ?? null
  const skillReplaceCombatant = activeSkillReplaceEvent
    ? getCombatantById(partyMembers, activeSkillReplaceEvent.combatantId)
    : null
  const skillReplaceNewSkillData = activeSkillReplaceEvent
    ? getSkillData(activeSkillReplaceEvent.newSkillName)
    : null
  const skillReplaceCurrentSkills = skillReplaceCombatant?.skills ?? []
  const activeAllyIds = battleContext.activeAllyIds
  const activeAllies = activeAllyIds
    .map((memberId) => getCombatantById(partyMembers, memberId))
    .filter(Boolean)
  const actingAlly = battleContext.actingAlly ?? gameState?.player ?? null
  const playerSkills = actingAlly?.skills ?? []
  const battleSkillSlots = Array.from(
    { length: MAX_COMBATANT_SKILL_COUNT },
    (_, index) => playerSkills[index] ?? null
  )
  const selectedSkill = battleSkillSlots[selectedSkillIndex]
  const selectedSkillData = selectedSkill ? getSkillData(selectedSkill) : null
  const activePreviewSkillIndex =
    hoveredSkillIndex !== null && battleSkillSlots[hoveredSkillIndex] ? hoveredSkillIndex : null
  const activePreviewSkillData =
    activePreviewSkillIndex !== null ? getSkillData(battleSkillSlots[activePreviewSkillIndex]) : null
  const isAttackPanelOpen = battlePanelMode === 'attack'
  const isAttackTargetPanelOpen = battlePanelMode === 'attack-targets'
  const isSkillConsoleOpen = isAttackPanelOpen || isAttackTargetPanelOpen
  const actionPanelSkillData = activePreviewSkillData ?? (isAttackTargetPanelOpen ? selectedSkillData : null)
  const isItemPanelOpen = battlePanelMode === 'items'
  const isPartyPanelOpen = battlePanelMode === 'party'
  const captureInventoryItems = captureItemOrder.map((itemId) => {
    const item = captureItemLookup.get(itemId)

    return {
      ...item,
      count: gameState?.inventory?.[itemId] ?? 0,
    }
  })
  const hasDigimonDetector = true
  const hasIvDetector = getIvDetectorCount(gameState?.inventory) > 0
  const hasGlobeItem = (gameState?.inventory?.[GLOBE_ITEM_ID] ?? 0) > 0
  const hudCombatant = actingAlly ?? gameState?.player ?? null
  const inventoryHudItems = [...rewardItemLookup.values()]
    .map((item) => {
      const count = gameState?.inventory?.[item.id] ?? 0

      if (!item || item.captureTier || item.digiEggName || item.battleItemKey || count <= 0) {
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
        description: `${item.description} · 남은 턴 ${remainingTurns}`,
        imageUrl: item.imageUrl,
        value: remainingTurns,
        isBuff: true,
      }
    })
    .filter(Boolean)
  const activeTypeUpHudItems = typeUpRewardItems
    .map((item) => {
      const count = normalizeTypePowerUps(hudCombatant?.typePowerUps)[item.typeUpKey] ?? 0

      if (count <= 0) {
        return null
      }

      return {
        id: item.id,
        name: item.name,
        description: `${item.description} · 현재 ${count}/${TYPE_POWER_UP_MAX}`,
        imageUrl: item.imageUrl,
        value: count,
        isMaxed: count >= TYPE_POWER_UP_MAX,
        isTypeUp: true,
      }
    })
    .filter(Boolean)
  const activeAttributeUpHudItems = attributeUpRewardItems
    .map((item) => {
      const count = normalizeAttributePowerUps(hudCombatant?.attributePowerUps)[item.attributeUpKey] ?? 0

      if (count <= 0) {
        return null
      }

      return {
        id: item.id,
        name: item.name,
        description: `${item.description} · 현재 ${count}/${ATTRIBUTE_POWER_UP_MAX}`,
        imageUrl: item.imageUrl,
        value: count,
        isMaxed: count >= ATTRIBUTE_POWER_UP_MAX,
        isAttributeUp: true,
      }
    })
    .filter(Boolean)
  const activeDigicloneHudItems = digicloneRewardItems
    .map((item) => {
      const count = normalizeDigiclones(hudCombatant?.digiclones)[item.digicloneKey] ?? 0

      if (count <= 0) {
        return null
      }

      return {
        id: item.id,
        name: item.name,
        description: `${STAT_LABEL_MAP[item.digicloneKey] ?? item.name} ${count * 10}% 증가 · 현재 ${count}/${DIGICLONE_MAX}`,
        imageUrl: item.imageUrl,
        value: count,
        isMaxed: count >= DIGICLONE_MAX,
        isDigiclone: true,
      }
    })
    .filter(Boolean)
  const activeRecoveryProgramHudItems = recoveryProgramRewardItems
    .map((item) => {
      const count = normalizeRecoveryPrograms(hudCombatant?.recoveryPrograms)[item.recoveryProgramKey] ?? 0

      if (count <= 0) {
        return null
      }

      return {
        id: item.id,
        name: item.name,
        description: `${item.description} · 현재 ${count}/${RECOVERY_PROGRAM_MAX}`,
        imageUrl: item.imageUrl,
        value: count,
        isMaxed: count >= RECOVERY_PROGRAM_MAX,
        isRecoveryProgram: true,
      }
    })
    .filter(Boolean)
  const activeBattleItemHudItems = battleItemRewardItems
    .map((item) => {
      const count = normalizeBattleItems(hudCombatant?.battleItems)[item.battleItemKey] ?? 0

      if (count <= 0) {
        return null
      }

      const maxCount = item.maxOwnedPerCombatant ?? 0

      return {
        id: item.id,
        name: item.name,
        description: `${item.description} · 현재 ${count}/${maxCount}`,
        imageUrl: item.imageUrl,
        value: count,
        isMaxed: maxCount > 0 && count >= maxCount,
        isBattleItem: true,
      }
    })
    .filter(Boolean)
  const adventureHudItems = [
    ...inventoryHudItems,
    ...activeBuffHudItems,
    ...activeTypeUpHudItems,
    ...activeAttributeUpHudItems,
    ...activeDigicloneHudItems,
    ...activeRecoveryProgramHudItems,
    ...activeBattleItemHudItems,
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
    { length: Math.max(PARTY_SLOT_COUNT, rewardTargetMembers.length) },
    (_, index) => rewardTargetMembers[index] ?? null
  )
  const evolutionPartyMembers = partyMembers.filter((member) => !isCombatantEgg(member))
  const evolutionPartySlots = Array.from(
    { length: Math.max(PARTY_SLOT_COUNT, evolutionPartyMembers.length) },
    (_, index) => evolutionPartyMembers[index] ?? null
  )
  const selectedEvolutionMember = evolutionState?.selectedMemberId
    ? getCombatantById(evolutionPartyMembers, evolutionState.selectedMemberId)
    : null
  const evolutionOptions = selectedEvolutionMember
    ? getEvolutionOptions(selectedEvolutionMember, gameState?.inventory)
    : []
  const pendingEvolutionOption = evolutionState?.confirmTargetName
    ? evolutionOptions.find((option) => option.targetData.이름 === evolutionState.confirmTargetName)
    : null
  const currentTargetEnemyIndex = gameState ? getLivingEnemyIndex(gameState.enemies) : -1
  const selectedTargetEnemy =
    gameState?.enemies?.find(
      (enemy) => enemy.id === selectedEnemyTargetId && isCombatantAbleToBattle(enemy)
    ) ?? null
  const visibleEnemies = gameState?.enemies?.filter((enemy) => isCombatantAbleToBattle(enemy)) ?? []
  const shouldShowSkillAdvantage = visibleEnemies.length <= 1
  const currentTargetEnemy =
    selectedTargetEnemy ??
    (currentTargetEnemyIndex >= 0 && gameState ? gameState.enemies[currentTargetEnemyIndex] : null)
  const renderHitEffects = () =>
    hitEffects.map((effect) => (
      <span key={effect.id} className="battle-hit-feedback" aria-hidden="true">
        <span
          className={getHitEffectClassName(effect)}
          style={mergeEffectStyles(
            getSkillVisualEffectStyle(effect?.skillName),
            Number.isFinite(effect.hitX) && Number.isFinite(effect.hitY)
              ? {
                  '--hit-x': `${effect.hitX}px`,
                  '--hit-y': `${effect.hitY}px`,
                }
              : null
          )}
        >
          <span className="hit-effect__accent hit-effect__accent--a" />
          <span className="hit-effect__accent hit-effect__accent--b" />
          <span className="hit-effect__accent hit-effect__accent--c" />
        </span>
        {effect.isMiss || (Number.isFinite(effect.damage) && effect.damage > 0) ? (
          <span
            className={[
              'damage-text',
              effect.isMiss ? 'damage-text--miss' : '',
              `damage-text--${getHitEffectAttributeClass(effect.attribute)}`,
            ]
              .filter(Boolean)
              .join(' ')}
            style={
              Number.isFinite(effect.damageX) && Number.isFinite(effect.damageY)
                ? {
                    '--damage-x': `${effect.damageX}px`,
                    '--damage-y': `${effect.damageY}px`,
                  }
                : undefined
            }
          >
            {effect.isMiss ? 'MISS' : effect.damage}
          </span>
        ) : null}
      </span>
    ))

  const mainScreenStyle = {
    '--attack-motion-duration': `${getGameDuration(ATTACK_MOTION_DURATION_MS)}ms`,
    '--projectile-effect-duration': `${getGameDuration(PROJECTILE_EFFECT_DURATION_MS)}ms`,
    '--hit-effect-duration': `${getGameDuration(HIT_EFFECT_DURATION_MS)}ms`,
    '--damage-text-duration': `${getGameDuration(DAMAGE_TEXT_DURATION_MS)}ms`,
    '--exp-bar-duration': `${getExpDuration(EXP_BAR_ANIMATION_MS)}ms`,
  }

  return (
    <main
      className={['main-screen', screenMode === 'adventure' ? 'main-screen--adventure' : '']
        .filter(Boolean)
        .join(' ')}
      style={mainScreenStyle}
    >
      <BackgroundMusic settings={gameSettings} />
      <ButtonClickSound settings={gameSettings} />
      <div
        className="main-screen__background main-screen__background--base"
        aria-hidden="true"
        style={
          screenMode === 'adventure' ? undefined : { backgroundImage: `url("${activeBackgroundUrl}")` }
        }
      />
      {screenMode !== 'adventure' && (
        <div
          className={[
            'main-screen__background',
            'main-screen__background--next',
            mapTransition.isFading ? 'main-screen__background--visible' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
          style={{ backgroundImage: `url("${nextBackgroundUrl}")` }}
        />
      )}
      {screenMode !== 'adventure' && <div className="main-screen__veil" aria-hidden="true" />}
      {screenMode !== 'adventure' && (
        <div className="digit-rain" aria-hidden="true">
          {digitDrops.map((drop) => (
            <div
              key={drop.id}
              className={[
                'digit-drop',
                drop.id % 2 === 1 ? 'digit-drop--invert' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onAnimationIteration={(event) => handleDigitLoop(drop.id, event)}
              style={{
                '--drop-left': drop.left,
                '--drop-duration': drop.duration,
                '--drop-delay': drop.delay,
                '--drop-opacity': drop.opacity,
                '--drop-scale': drop.scale,
                '--drop-drift': drop.drift,
                '--swap-duration': drop.swap,
              }}
            >
              <span className="digit-drop__value digit-drop__value--zero">0</span>
              <span className="digit-drop__value digit-drop__value--one">1</span>
            </div>
          ))}
        </div>
      )}

      {screenMode === 'menu' && (
        <header className="title-band">
          <div className="title-band__inner">
            <img className="title-band__logo" src="/Title.png" alt="DigiRogue" />
          </div>
        </header>
      )}

      <section
        className={[
          'playfield',
          screenMode === 'new-game' ? 'playfield--selection' : '',
          screenMode === 'settings' ? 'playfield--settings' : '',
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
            screenMode === 'adventure' ? 'playfield__content--adventure' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {screenMode === 'menu' ? (
            <aside className="menu-panel">
              <nav className="menu-panel__list" aria-label={'\uBA54\uC778 \uBA54\uB274'}>
                {menuItems.map((item) => {
                  const isContinueItem = item.key === 'continue'
                  const isDisabled = isContinueItem ? !hasSaveData : item.disabled

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={[
                        'menu-item',
                        item.key === 'new-game' ? 'menu-item--current' : '',
                        isDisabled ? 'menu-item--disabled' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      disabled={isDisabled}
                      onClick={() => handleMenuAction(item.key)}
                    >
                      <span className="menu-item__marker" aria-hidden="true">
                        {item.key === 'new-game' ? '\u25B6' : ''}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </aside>
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
                        ['bgmVolume', '오디오'],
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
                          <span className="settings-row__label">BGM 설정</span>
                          <span className="settings-bgm-entry__summary">
                            활성 BGM {gameSettings.enabledBgmUrls.length}/{bgmTracks.length}
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
                          <h2 className="settings-bgm-window__title">BGM 설정</h2>
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
                        <div className="settings-bgm__list">
                          {bgmTracks.map((track) => {
                            const isEnabled = gameSettings.enabledBgmUrls.includes(track.url)

                            return (
                              <div key={track.url} className="settings-bgm__item">
                                <span className="settings-bgm__title">{track.title}</span>
                                <button
                                  type="button"
                                  className={[
                                    'settings-bgm__toggle',
                                    isEnabled ? 'settings-bgm__toggle--enabled' : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                  onClick={() => toggleBgmTrack(track.url)}
                                >
                                  {isEnabled ? '설정' : '해제'}
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
            <section className="selection-screen" aria-label="처음 디지몬 선택">
              <div className="selection-preview">
                <div className="selection-preview__top">
                  <button
                    type="button"
                    className="selection-back"
                    onClick={() => {
                      setIsMatchupGuideOpen(false)
                      setScreenMode('menu')
                    }}
                  >
                    {'\u25C0 \uB4A4\uB85C'}
                  </button>
                  <div className="selection-preview__title-group">
                    <p className="selection-label">현재 디지몬</p>
                    <h2 className="selection-name">{selectedGrowthDigimon.name}</h2>
                  </div>
                </div>

                <div className="selection-preview__frame">
                  <img
                    className="selection-preview__image"
                    src={getBattleSpriteUrl(selectedGrowthDigimon.url)}
                    alt={selectedGrowthDigimon.name}
                    data-source-src={selectedGrowthDigimon.url}
                    onLoad={handleBattleSpriteLoad}
                  />
                </div>

                <div className="selection-preview__traits" aria-label="타입과 속성">
                  <span className="selection-trait selection-trait--type">{selectedGrowthType}</span>
                  <span className="selection-trait selection-trait--attribute">
                    {selectedGrowthAttribute}
                  </span>
                </div>

                <div className="selection-preview__skills" aria-label="기술 목록">
                  {selectedGrowthSkillSlots.map((skillName, index) =>
                    skillName ? (
                      <span key={`${skillName}-${index}`} className="selection-skill">
                        {skillName}
                      </span>
                    ) : (
                      <span key={`empty-skill-${index}`} className="selection-skill selection-skill--empty">
                        -
                      </span>
                    )
                  )}
                </div>

                <div className="selection-preview__actions">
                  <button
                    type="button"
                    className="selection-start"
                    disabled={selectedStarterNames.length <= 0}
                    onClick={handleRequestStartAdventure}
                  >
                    {'\uC2DC\uC791'}
                  </button>
                </div>
              </div>

              <div className="selection-gallery">
                <div className="selection-gallery__main">
                  <div className="selection-gallery__header">
                    <p className="selection-label">디지몬 목록</p>
                    <p className="selection-count">
                      {selectedGrowthIndex + 1}/{growthStageDigimon.length}
                    </p>
                  </div>

                  <div className="selection-grid">
                    {growthStageDigimon.map((digimon, index) => {
                      const selectedOrder = selectedStarterNames.indexOf(digimon.name)
                      const isSelected = selectedOrder >= 0
                      const isPreviewed = index === selectedGrowthIndex
                      const canSelectMore =
                        selectedStarterNames.length < PARTY_SLOT_COUNT &&
                        selectedStarterCost + STARTER_GROWTH_COST <= STARTER_PARTY_COST_LIMIT
                      const isDisabled = !isSelected && !canSelectMore

                      return (
                        <button
                          key={digimon.url}
                          type="button"
                          className={[
                            'selection-card',
                            isPreviewed ? 'selection-card--active' : '',
                            isSelected ? 'selection-card--selected' : '',
                            isDisabled ? 'selection-card--locked' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => handleToggleStarterSelection(digimon, index)}
                          aria-pressed={isSelected}
                        >
                          <span className="selection-card__cost">{STARTER_GROWTH_COST}</span>
                          {isSelected ? (
                            <span className="selection-card__order">{selectedOrder + 1}</span>
                          ) : null}
                          <img
                            className="selection-card__image"
                            src={createDigimonArtworkUrl(digimon.stage ?? '성장기', digimon.name)}
                            alt={digimon.name}
                            onError={hideBrokenArtwork}
                          />
                          <span className="selection-card__name">{digimon.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <aside className="selection-party" aria-label="현재 팀 구성">
                  <div className="selection-party__header">
                    <p className="selection-label">TEAM</p>
                    <span className="selection-party__count">
                      {selectedStarterNames.length}/{PARTY_SLOT_COUNT}
                    </span>
                  </div>
                  <div className="selection-party__slots">
                    {selectedStarterSlots.map((digimon, index) =>
                      digimon ? (
                        <button
                          key={`starter-${digimon.name}`}
                          type="button"
                          className="selection-party-slot selection-party-slot--filled"
                          onClick={() => handleRemoveStarterSelection(digimon.name)}
                          aria-label={`${digimon.name} 선택 해제`}
                        >
                          <span className="selection-party-slot__order">{index + 1}</span>
                          <img
                            className="selection-party-slot__image"
                            src={createDigimonArtworkUrl(digimon.stage ?? '성장기', digimon.name)}
                            alt=""
                            onError={hideBrokenArtwork}
                          />
                          <span className="selection-party-slot__name">{digimon.name}</span>
                        </button>
                      ) : (
                        <div key={`starter-empty-${index}`} className="selection-party-slot">
                          <span className="selection-party-slot__empty">?</span>
                        </div>
                      )
                    )}
                  </div>
                  <div className="selection-cost selection-cost--party" aria-label="전체 코스트">
                    <span>전체 코스트</span>
                    <strong>
                      {selectedStarterCost}/{STARTER_PARTY_COST_LIMIT}
                    </strong>
                  </div>
                </aside>
              </div>

              {isMatchupGuideOpen ? (
                <MatchupGuideModal onConfirm={handleConfirmMatchupGuideStart} />
              ) : null}
            </section>
          ) : (
            <section className="adventure-screen" aria-label={'\uAC8C\uC784 \uC2DC\uC791 \uD654\uBA74'}>
              <div className="adventure-stage">
                <div
                  className="adventure-stage__background"
                  aria-hidden="true"
                  style={{ backgroundImage: `url("${activeBackgroundUrl}")` }}
                />
                <div className="adventure-hud">
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
                          onFocus={handleInventoryTooltipPosition}
                          onMouseEnter={handleInventoryTooltipPosition}
                        >
                          <img className="adventure-inventory-item__image" src={item.imageUrl} alt="" />
                          <span className="adventure-inventory-item__count">{item.value}</span>
                        </div>
                      ))
                    ) : (
                      <span className="adventure-inventory-strip__empty"></span>
                    )}
                  </div>
                  <div className="adventure-summary-card">
                    <p className="adventure-summary-card__line adventure-summary-card__line--stage">
                      <span>
                        {gameState?.currentMap} - {gameState?.currentStage} / {gameState?.maxStage}
                      </span>
                    </p>
                    <p className="adventure-summary-card__line adventure-summary-card__line--gold">
                      <span>GOLD</span>
                      <span className="adventure-summary-card__gold">{formatGold(gameState?.gold ?? 0)}</span>
                    </p>
                  </div>
                </div>

                <div className="adventure-field">
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
                      const allyAttackMotion = attackMotions.find(
                        (effect) => effect.attackerId === ally.id
                      )
                      const hasPhysicalAllyAttackMotion = allyAttackMotion?.isPhysical
                      const allyHpRatio = Math.max(
                        0,
                        Math.min(100, (ally.currentHp / ally.maxHp) * 100)
                      )
                      const allyStatusBadge = getCombatantStatusBadge(ally)
                      const allyTypeIconUrl = getDigimonTypeIconUrl(ally.type)
                      const allyAttributeIconUrl = getDigimonAttributeIconUrl(ally.attribute)
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
                              hasPhysicalAllyAttackMotion
                                ? 'adventure-player__sprite-wrap--attacking'
                                : '',
                              hasPhysicalAllyAttackMotion &&
                              allyAttackMotion.targetSide === 'enemy'
                                ? 'adventure-player__sprite-wrap--attack-right'
                                : '',
                              activeCombatantInfoId === `player-${ally.id}`
                                ? 'adventure-player__sprite-wrap--info-open'
                                : '',
                            ]
                            .filter(Boolean)
                            .join(' ')}
                            style={getAttackMotionStyle(allyAttackMotion)}
                            ref={setCombatantEffectAnchorRef(ally.id)}
                            tabIndex={0}
                            aria-label={`${ally.name} 상세 정보`}
                            onPointerEnter={(event) =>
                              openCombatantInfo(`player-${ally.id}`, event.currentTarget)
                            }
                            onFocus={(event) =>
                              openCombatantInfo(`player-${ally.id}`, event.currentTarget)
                            }
                            onBlur={(event) => {
                              if (!event.currentTarget.contains(event.relatedTarget)) {
                                closeCombatantInfo()
                              }
                            }}
                          >
                            {renderBattleSprite(ally, 'ally', allyAttackMotion)}
                            <CombatantInfoPanel
                              combatant={ally}
                              side="ally"
                              activeTab={combatantInfoTab}
                              onTabChange={setCombatantInfoTab}
                            />
                          </div>

                          <div
                            className="digimon-status"
                            role="group"
                            aria-label={`${ally.name} 체력과 경험치`}
                          >
                            <img
                              className="digimon-status__portrait"
                              src={createDigimonArtworkUrl(ally.speciesStage, ally.imageName ?? ally.name)}
                              alt=""
                              data-fallback-src={ally.imageUrl}
                              onError={hideBrokenArtwork}
                            />
                            <p className="digimon-status__name">
                              <span className="digimon-status__name-text">{ally.name}</span>
                              {allyStatusBadge ? (
                                <span
                                  className={[
                                    'adventure-player__status',
                                    `adventure-player__status--${allyStatusBadge.className}`,
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {allyStatusBadge.label}
                                </span>
                              ) : null}
                              <DigimonTraitIcon
                                className="digimon-status__trait--type"
                                src={allyTypeIconUrl}
                                label={`${ally.type} 타입`}
                              />
                              <DigimonTraitIcon
                                className="digimon-status__trait--attribute"
                                src={allyAttributeIconUrl}
                                label={`${ally.attribute} 속성`}
                              />
                              <span className="digimon-status__level">Lv.{ally.level}</span>
                            </p>
                            <div className="digimon-status__hp" role="img" aria-label="HP bar">
                              <span
                                className="digimon-status__hp-fill"
                                style={{ width: `${allyHpRatio}%` }}
                              />
                              <p className="digimon-status__hp-text">
                                {ally.currentHp} / {ally.maxHp}
                              </p>
                            </div>
                            <div
                              className="digimon-status__exp digimon-status__exp--visible"
                              role="img"
                              aria-label="experience bar"
                              aria-hidden="false"
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
                      const enemyAttackMotion = attackMotions.find(
                        (effect) => effect.attackerId === enemy.id
                      )
                      const hasPhysicalEnemyAttackMotion = enemyAttackMotion?.isPhysical
                      const enemyHpRatio = Math.max(
                        0,
                        Math.min(100, (enemy.currentHp / enemy.maxHp) * 100)
                      )
                      const enemyStatusBadge = getCombatantStatusBadge(enemy)
                      const enemyTypeIconUrl = getDigimonTypeIconUrl(enemy.type)
                      const enemyAttributeIconUrl = getDigimonAttributeIconUrl(enemy.attribute)
                      const enemyRevealedIvKeys = getRevealedEnemyIvKeys(enemy, gameState?.inventory)
                      const canViewEnemyIvs = hasIvDetector && enemyRevealedIvKeys.length > 0

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
                              hasPhysicalEnemyAttackMotion
                                ? 'adventure-player__sprite-wrap--attacking'
                                : '',
                              hasPhysicalEnemyAttackMotion &&
                              enemyAttackMotion.targetSide === 'ally'
                                ? 'adventure-player__sprite-wrap--attack-left'
                                : '',
                              hasDigimonDetector && activeCombatantInfoId === `enemy-${enemy.id}`
                                ? 'adventure-player__sprite-wrap--info-open'
                                : '',
                            ]
                            .filter(Boolean)
                            .join(' ')}
                            style={getAttackMotionStyle(enemyAttackMotion)}
                            ref={setCombatantEffectAnchorRef(enemy.id)}
                            tabIndex={hasDigimonDetector ? 0 : undefined}
                            aria-label={`${enemy.name} 상세 정보`}
                            onPointerEnter={
                              hasDigimonDetector
                                ? (event) =>
                                    openCombatantInfo(`enemy-${enemy.id}`, event.currentTarget)
                                : undefined
                            }
                            onFocus={
                              hasDigimonDetector
                                ? (event) =>
                                    openCombatantInfo(`enemy-${enemy.id}`, event.currentTarget)
                                : undefined
                            }
                            onBlur={
                              hasDigimonDetector
                                ? (event) => {
                                    if (!event.currentTarget.contains(event.relatedTarget)) {
                                      closeCombatantInfo()
                                    }
                                  }
                                : undefined
                            }
                          >
                            {renderBattleSprite(enemy, 'enemy', enemyAttackMotion)}
                            {hasDigimonDetector ? (
                              <CombatantInfoPanel
                                combatant={enemy}
                                side="enemy"
                                activeTab={combatantInfoTab}
                                onTabChange={setCombatantInfoTab}
                                canViewEnemyInfo={hasDigimonDetector}
                                canViewEnemyIvs={canViewEnemyIvs}
                                revealedIvKeys={enemyRevealedIvKeys}
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
                            aria-label={`${enemy.name} 체력`}
                          >
                            <img
                              className="digimon-status__portrait"
                              src={createDigimonArtworkUrl(enemy.speciesStage, enemy.imageName ?? enemy.name)}
                              alt=""
                              data-fallback-src={enemy.imageUrl}
                              onError={hideBrokenArtwork}
                            />
                            <p className="digimon-status__name">
                              {enemy.isBoss ? (
                                <span className="digimon-status__boss-label">BOSS</span>
                              ) : null}
                              <span className="digimon-status__name-text">{enemy.name}</span>
                              {enemyStatusBadge ? (
                                <span
                                  className={[
                                    'adventure-player__status',
                                    `adventure-player__status--${enemyStatusBadge.className}`,
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {enemyStatusBadge.label}
                                </span>
                              ) : null}
                              <DigimonTraitIcon
                                className="digimon-status__trait--type"
                                src={enemyTypeIconUrl}
                                label={`${enemy.type} 타입`}
                              />
                              <DigimonTraitIcon
                                className="digimon-status__trait--attribute"
                                src={enemyAttributeIconUrl}
                                label={`${enemy.attribute} 속성`}
                              />
                              <span className="digimon-status__level">Lv.{enemy.level}</span>
                            </p>
                            <div className="digimon-status__hp" role="img" aria-label="HP bar">
                              <span
                                className="digimon-status__hp-fill digimon-status__hp-fill--enemy"
                                style={{ width: `${enemyHpRatio}%` }}
                              />
                              {enemy.isBoss && (enemy.bossHpSegmentCount ?? 1) > 1 ? (
                                <span className="digimon-status__hp-segments" aria-hidden="true">
                                  {Array.from({
                                    length: Math.max(0, (enemy.bossHpSegmentCount ?? 1) - 1),
                                  }).map((_, segmentIndex) => (
                                    <span
                                      key={segmentIndex}
                                      className="digimon-status__hp-segment"
                                      style={{
                                        left: `${((segmentIndex + 1) / (enemy.bossHpSegmentCount ?? 1)) * 100}%`,
                                      }}
                                    />
                                  ))}
                                </span>
                              ) : null}
                              <p className="digimon-status__hp-text">
                                {enemy.currentHp} / {enemy.maxHp}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="hit-effect-layer" aria-hidden="true">
                    {renderHitEffects()}
                  </div>

                  <div className="skill-projectile-layer" aria-hidden="true">
                    {projectileEffects.map((effect) => (
                      <span
                        key={effect.id}
                        className={[
                          getProjectileEffectClassName(effect),
                          effect.endX < effect.startX ? 'skill-projectile--reverse' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        style={{
                          '--projectile-start-x': `${effect.startX}px`,
                          '--projectile-start-y': `${effect.startY}px`,
                          '--projectile-end-x': `${effect.endX}px`,
                          '--projectile-end-y': `${effect.endY}px`,
                          ...getSkillVisualEffectStyle(effect?.skillName),
                        }}
                      >
                        <span className="skill-projectile__core" />
                        <span className="skill-projectile__accent skill-projectile__accent--a" />
                        <span className="skill-projectile__accent skill-projectile__accent--b" />
                        <span className="skill-projectile__accent skill-projectile__accent--c" />
                      </span>
                    ))}
                  </div>
                </div>

                {rewardState && (
                  <div className="reward-screen" aria-label={'스테이지 클리어 보상'}>
                    <div className="reward-screen__veil" aria-hidden="true" />
                    <div className="reward-screen__fixed">
                      {fixedRewardItems.map((item) => {
                        const canAfford = (gameState?.gold ?? 0) >= item.price
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
                              canAfford && hasUsableTarget ? '' : 'reward-item--disabled',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={
                              !canAfford ||
                              !hasUsableTarget ||
                              rewardState.isResolving ||
                              Boolean(rewardState.pendingTarget)
                            }
                            onClick={() => handlePurchaseFixedRewardItem(item.id)}
                            data-tooltip={item.description}
                            title={item.description}
                          >
                            <img className="reward-item__image" src={item.imageUrl} alt="" />
                            <strong className="reward-item__name">{item.name}</strong>
                            <span className="reward-item__price">{formatGold(item.price)}</span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="reward-screen__random">
                      <div className="reward-screen__random-list">
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
                              onClick={() => handleClaimRandomRewardItem(item.id)}
                              data-tooltip={isRevealingReward ? '' : item.description}
                              title={isRevealingReward ? '' : item.description}
                            >
                              <img
                                className="reward-item__image"
                                src={isRevealingReward ? REWARD_REVEAL_IMAGE_URL : item.imageUrl}
                                alt=""
                              />
                              <strong className="reward-item__name">
                                {isRevealingReward ? '\u00A0' : item.name}
                              </strong>
                            </button>
                          )
                        })}
                      </div>
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
                                  onClick={() => handleSelectRewardTarget(member.id)}
                                >
                                  <img className="party-member__image" src={member.imageUrl} alt="" />
                                  <span className="party-member__name">{member.name}</span>
                                  <span className="party-member__level">Lv.{member.level}</span>
                                  <span className="party-member__hp">
                                    <span
                                      className="party-member__hp-fill"
                                      style={{ width: `${hpRatio}%` }}
                                    />
                                  </span>
                                  <span className="party-member__hp-text">
                                    {member.currentHp}/{member.maxHp}
                                  </span>
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
                        className="reward-screen__party-button"
                        disabled={rewardState.isResolving || Boolean(rewardState.pendingTarget)}
                        onClick={handleOpenEvolutionParty}
                      >
                        보유디지몬
                      </button>
                    </div>

                    {evolutionState ? (
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
                                const evolutionCount = getEvolutionOptions(member, gameState?.inventory).length

                                return (
                                  <button
                                    key={member.id}
                                    type="button"
                                    className="party-member evolution-party-member"
                                    onClick={() => handleSelectEvolutionMember(member.id)}
                                  >
                                    <img className="party-member__image" src={member.imageUrl} alt="" />
                                    <span className="party-member__name">{member.name}</span>
                                    <span className="party-member__level">Lv.{member.level}</span>
                                    <span className="party-member__hp">
                                      <span
                                        className="party-member__hp-fill"
                                        style={{ width: `${hpRatio}%` }}
                                      />
                                    </span>
                                    <span className="party-member__hp-text">
                                      진화 {evolutionCount}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          ) : selectedEvolutionMember ? (
                            <div className="evolution-detail">
                              <section className="evolution-detail__current">
                                <img
                                  className="evolution-detail__current-image"
                                  src={selectedEvolutionMember.imageUrl}
                                  alt={selectedEvolutionMember.name}
                                />
                                <div className="evolution-detail__current-info">
                                  <p className="evolution-detail__name">{selectedEvolutionMember.name}</p>
                                  <p className="evolution-detail__meta">
                                    Lv.{selectedEvolutionMember.level} · {selectedEvolutionMember.speciesStage}
                                  </p>
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

                              <section className="evolution-detail__options" aria-label="진화 가능 목록">
                                {evolutionOptions.length > 0 ? (
                                  evolutionOptions.map((option) => {
                                    const [levelRequirement, ...statRequirements] = option.requirements
                                    const isItemEvolution = option.evolutionType === 'item'

                                    return (
                                      <button
                                        key={option.targetData.이름}
                                        type="button"
                                        className={[
                                          'evolution-option',
                                          option.canEvolve ? 'evolution-option--ready' : 'evolution-option--locked',
                                        ]
                                          .filter(Boolean)
                                          .join(' ')}
                                        disabled={!option.canEvolve}
                                        onClick={() => handleRequestEvolution(option.targetData.이름)}
                                      >
                                        <img
                                          className="evolution-option__image"
                                          src={option.targetData.imageUrl}
                                          alt=""
                                        />
                                        <span className="evolution-option__body">
                                          <strong className="evolution-option__name">
                                            {option.targetData.이름}
                                          </strong>
                                          <span className="evolution-option__stage">
                                            {option.targetData.stage}
                                          </span>
                                          <span
                                            className={[
                                              'evolution-option__requirements',
                                              isItemEvolution ? 'evolution-option__requirements--item' : '',
                                            ]
                                              .filter(Boolean)
                                              .join(' ')}
                                          >
                                            {isItemEvolution ? (
                                              <span
                                                className={[
                                                  'evolution-option__item-requirement',
                                                  option.canEvolve
                                                    ? 'evolution-option__requirement--met'
                                                    : 'evolution-option__requirement--missing',
                                                ]
                                                  .filter(Boolean)
                                                  .join(' ')}
                                              >
                                                {option.itemRequirement?.name}
                                              </span>
                                            ) : (
                                              <>
                                                {levelRequirement ? (
                                                  <span
                                                    className={[
                                                      'evolution-option__requirement',
                                                      'evolution-option__requirement--level',
                                                      levelRequirement.isMet
                                                        ? 'evolution-option__requirement--met'
                                                        : 'evolution-option__requirement--missing',
                                                    ]
                                                      .filter(Boolean)
                                                      .join(' ')}
                                                  >
                                                    <span className="evolution-option__requirement-label">
                                                      {levelRequirement.label}
                                                    </span>
                                                    <span className="evolution-option__requirement-value">
                                                      {levelRequirement.current}/{levelRequirement.required}
                                                    </span>
                                                  </span>
                                                ) : null}
                                                <span className="evolution-option__stat-requirements">
                                                  {statRequirements.map((requirement) => (
                                                    <span
                                                      key={requirement.key}
                                                      className={[
                                                        'evolution-option__requirement',
                                                        requirement.isMet
                                                          ? 'evolution-option__requirement--met'
                                                          : 'evolution-option__requirement--missing',
                                                      ]
                                                      .filter(Boolean)
                                                      .join(' ')}
                                                    >
                                                      <span className="evolution-option__requirement-label">
                                                        {requirement.label}
                                                      </span>
                                                      <span className="evolution-option__requirement-value">
                                                        {requirement.current}/{requirement.required}
                                                      </span>
                                                    </span>
                                                  ))}
                                                </span>
                                              </>
                                            )}
                                          </span>
                                        </span>
                                      </button>
                                    )
                                  })
                                ) : (
                                  <p className="evolution-detail__empty">현재 진화 가능한 디지몬이 없습니다.</p>
                                )}
                              </section>

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
                                  {selectedEvolutionMember.name}을(를) {pendingEvolutionOption.targetData.이름}(으)로
                                  진화하겠습니다.
                                </p>
                                <div className="evolution-confirm__actions">
                                  <button type="button" onClick={handleConfirmEvolution}>
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

                {activeSkillReplaceEvent && skillReplaceCombatant ? (
                  <div className="skill-replace-screen" role="dialog" aria-modal="true">
                    <div className="skill-replace-screen__panel">
                      <div className="skill-replace-screen__header">
                        <span className="skill-replace-screen__eyebrow">새 기술</span>
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
                        잊을 기술을 선택해줘. 배우지 않으면 현재 기술 구성을 유지한다.
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
                        배우지 않는다
                      </button>
                    </div>
                  </div>
                ) : null}

                {mapSelectionState && !rewardState && (
                  <div className="map-selection-screen" aria-label="지도 이동 선택">
                    <div className="map-selection-screen__panel">
                      <div className="map-selection-screen__header">
                        <p className="map-selection-screen__eyebrow">지도</p>
                        <h3 className="map-selection-screen__title">다음 지역을 선택해줘</h3>
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
                            <span className="map-selection-screen__group">등장디지몬</span>
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

                {isPartyPanelOpen && !rewardState && actingAlly && (
                  <div className="party-screen" aria-label="보유 디지몬">
                    <div className="party-screen__current" aria-label="현재 행동 디지몬">
                      <img
                        className="party-screen__current-image"
                        src={actingAlly.imageUrl}
                        alt={actingAlly.name}
                      />
                      <div className="party-screen__current-card">
                        <p className="party-screen__name">{actingAlly.name}</p>
                        <p className="party-screen__level">Lv.{actingAlly.level}</p>
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
                            onClick={() => handleSwitchPartyMember(member.id)}
                          >
                            <img className="party-member__image" src={member.imageUrl} alt="" />
                            <span className="party-member__name">{member.name}</span>
                            <span className="party-member__level">
                              {isEgg ? DIGI_EGG_STAGE : `Lv.${member.level}`}
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
                  <div className="battle-action-panel" aria-label="공격 선택">
                    <section className="battle-action-panel__left">
                      <div className="battle-action-panel__header">
                        <span className="battle-action-panel__eyebrow">
                          {isAttackTargetPanelOpen ? 'TARGET' : 'SKILL'}
                        </span>
                        {isAttackTargetPanelOpen ? (
                          <strong className="battle-action-panel__title">공격 대상</strong>
                        ) : null}
                      </div>

                      {isAttackPanelOpen ? (
                        <div
                          className="battle-skill-grid battle-skill-grid--action-panel"
                          onMouseLeave={handleSkillPreviewClear}
                        >
                          {battleSkillSlots.map((skill, index) => {
                            const skillData = skill ? getSkillData(skill) : null
                            const isAreaAttack = isSkillAreaAttack(skillData)
                            const skillMatchup =
                              skill && !isAreaAttack && currentTargetEnemy && gameState
                                ? getMatchupResult({
                                    attackerType: actingAlly?.type,
                                    skillAttribute: skillData?.속성,
                                    defenderType: currentTargetEnemy.type,
                                    defenderAttribute: currentTargetEnemy.attribute,
                                  })
                                : null
                            const isAdvantageous = isAreaAttack
                              ? (gameState?.enemies ?? []).some(
                                  (enemy) =>
                                    isCombatantAbleToBattle(enemy) &&
                                    getMatchupResult({
                                      attackerType: actingAlly?.type,
                                      skillAttribute: skillData?.속성,
                                      defenderType: enemy.type,
                                      defenderAttribute: enemy.attribute,
                                    }).multiplier > 1
                                )
                              : (skillMatchup?.multiplier ?? 1) > 1

                            return (
                              <button
                                key={`${skill ?? 'empty'}-${index}`}
                                type="button"
                                className={[
                                  'battle-skill',
                                  skill ? '' : 'battle-skill--empty',
                                  index === activePreviewSkillIndex && skill
                                    ? 'battle-skill--active'
                                    : '',
                                  shouldShowSkillAdvantage && isAdvantageous
                                    ? 'battle-skill--advantage'
                                    : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                disabled={!skill}
                                onMouseEnter={() => handleSkillPreview(index)}
                                onFocus={() => handleSkillPreview(index)}
                                onBlur={handleSkillPreviewClear}
                                onClick={() => {
                                  if (skill) {
                                    handleSkillSelect(index)
                                  }
                                }}
                              >
                                <span className="battle-skill__marker" aria-hidden="true">
                                  {index === activePreviewSkillIndex && skill ? '\u25B6' : ''}
                                </span>
                                <span className="battle-skill__label">{skill ?? ''}</span>
                                {isAreaAttack ? <span className="battle-skill__badge">전체</span> : null}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="battle-target-panel battle-target-panel--action">
                          <div className="battle-target-list" onMouseLeave={handleTargetPreviewClear}>
                            {visibleEnemies.map((enemy) => {
                              const targetMatchup =
                                selectedSkillData && !isSkillAreaAttack(selectedSkillData)
                                  ? getMatchupResult({
                                      attackerType: actingAlly?.type,
                                      skillAttribute: selectedSkillData?.속성,
                                      defenderType: enemy.type,
                                      defenderAttribute: enemy.attribute,
                                    })
                                  : null
                              const isAdvantageousTarget = (targetMatchup?.multiplier ?? 1) > 1

                              return (
                                <button
                                  key={enemy.id}
                                  type="button"
                                  className={[
                                    'battle-target',
                                    hoveredEnemyTargetId === enemy.id ? 'battle-target--active' : '',
                                    isAdvantageousTarget ? 'battle-target--advantage' : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                  onMouseEnter={() => handleTargetPreview(enemy.id)}
                                  onFocus={() => handleTargetPreview(enemy.id)}
                                  onBlur={handleTargetPreviewClear}
                                  onClick={() => handleAttackTargetSelect(enemy.id)}
                                >
                                  <span className="battle-target__name">{enemy.name}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </section>

                    {actionPanelSkillData ? (
                      <aside className="battle-action-panel__tooltip" aria-label="기술 정보">
                        <BattleSkillTooltip
                          skillData={actionPanelSkillData}
                          className="battle-skill-tooltip--panel"
                        />
                      </aside>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="battle-console" aria-label={'\uBC30\uD2C0 UI'}>
                <section
                  className={[
                    'battle-console__message',
                    currentLogs.length > 0 ? 'battle-console__message--logs' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={'\uBC30\uD2C0 \uBA54\uC2DC\uC9C0'}
                >
                  {currentLogs.length > 0 ? (
                    <div className="battle-console__log-list">
                      {currentLogs.map((log, index) => (
                        <p key={index} className="battle-console__message-text">
                          {log}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="battle-console__message-text">
                      {actingAlly?.name}
                      {'\uC740 \uBB34\uC5C7\uC744 \uD560\uAE4C?'}
                    </p>
                  )}
                </section>

                <section className="battle-console__commands" aria-label={'\uBC30\uD2C0 \uBA54\uB274'}>
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
                        battlePanelMode === 'logs' ||
                        Boolean(rewardState) ||
                        Boolean(mapSelectionState)
                      }
                      onClick={() => handleBattleCommandSelect(item.key)}
                    >
                      <span className="battle-command__marker" aria-hidden="true">
                        {item.key === selectedBattleCommand ? '\u25B6' : ''}
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
                    aria-label="레벨업 스탯 상승량"
                  >
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
                        {levelUpStatPreview.evolutionTargets.map((target) => (
                          <div key={target.name} className="level-up-stats__evolution">
                            <img
                              className="level-up-stats__evolution-image"
                              src={target.imageUrl}
                              alt=""
                            />
                            <span className="level-up-stats__evolution-body">
                              <strong>{target.name}</strong>
                              <span>{target.stage}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </aside>
                )}

                {capturePreview ? (
                  <CaptureInfoPreview
                    key={capturePreview.id}
                    combatant={capturePreview.combatant}
                  />
                ) : null}

                {isItemPanelOpen && !rewardState && (
                  <aside className="battle-item-popover" aria-label="아이템 목록">
                    <div className="battle-item-list">
                      {captureInventoryItems.map((item) => {
                        const itemCount = item.count ?? 0

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={[
                              'battle-item-row',
                              itemCount <= 0 ? 'battle-item-row--empty' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={itemCount <= 0}
                            onClick={() => handleUseCaptureItem(item.id)}
                          >
                            <img className="battle-item-row__image" src={item.imageUrl} alt="" />
                            <span className="battle-item-row__name">{item.name}</span>
                            <span className="battle-item-row__count">X{itemCount}</span>
                          </button>
                        )
                      })}
                    </div>
                  </aside>
                )}
              </div>

              {evolutionScene ? (
                <div
                  className={[
                    'evolution-cutscene',
                    evolutionScene.phase === 'after'
                      ? 'evolution-cutscene--after'
                      : 'evolution-cutscene--before',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label="진화 연출"
                >
                  <div className="evolution-cutscene__header">
                    <strong className="evolution-cutscene__title">
                      {evolutionScene.phase === 'after'
                        ? `${evolutionScene.toName} 진화!`
                        : `${evolutionScene.fromName} 진화!`}
                    </strong>
                  </div>
                  <div className="evolution-cutscene__stage">
                    <span className="evolution-cutscene__aura" aria-hidden="true" />
                    <img
                      key={`${evolutionScene.id}-${evolutionScene.phase}`}
                      className="evolution-cutscene__digimon"
                      src={
                        evolutionScene.phase === 'after'
                          ? evolutionScene.toImageUrl
                          : evolutionScene.fromImageUrl
                      }
                      alt={
                        evolutionScene.phase === 'after'
                          ? evolutionScene.toName
                          : evolutionScene.fromName
                      }
                    />
                  </div>
                  <div className="evolution-cutscene__flash" aria-hidden="true" />
                </div>
              ) : null}
            </section>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
