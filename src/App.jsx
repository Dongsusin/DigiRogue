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
const EVOLUTION_SCENE_SWITCH_MS = 3000
const EVOLUTION_SCENE_TOTAL_MS = 5000

const DIGIMON_DETECTOR_ITEM_ID = 'digimon-detector'
const IV_DETECTOR_ITEM_ID = 'iv-detector'
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
const ROGUE_DIGI_EGG_NAMES = new Set(['모르프몬', '옷코몬'])
const COMMON_REWARD_ITEM_IDS = new Set(['capture-net', 'heal-20', 'heal-50', LEVEL_UP_ITEM_ID])
const GOOD_REWARD_ITEM_IDS = new Set([
  'capture-net-super',
  'heal-200',
  'party-heal-50',
  'revive-50',
  EXP_BOOSTER_ITEM_ID,
  PARTY_LEVEL_UP_ITEM_ID,
  MAP_ITEM_ID,
  DIGIMON_DETECTOR_ITEM_ID,
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
    id: DIGIMON_DETECTOR_ITEM_ID,
    name: '디지몬탐지기',
    description: '적 디지몬의 상세 정보를 확인할 수 있다',
    unique: true,
    imageUrl: '/아이템/탐지기/디지몬탐지기.png',
  },
  {
    id: IV_DETECTOR_ITEM_ID,
    name: '개체값탐지기',
    description: '적 디지몬의 개체값 정보를 확인할 수 있다',
    unique: true,
    requiresItemId: DIGIMON_DETECTOR_ITEM_ID,
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
  '/도감/성장기/올챙몬.png',
  '/도감/성장기/옷코몬.png',
  '/도감/성장기/울퉁몬.png',
  '/도감/성장기/임프몬.png',
  '/도감/성장기/추추몬.png',
  '/도감/성장기/츄카이몬.png',
  '/도감/성장기/카메몬.png',
  '/도감/성장기/케라몬.png',
  '/도감/성장기/코테몬.png',
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
]

const growthStageDigimon = growthStageDigimonUrls.map((url) => {
  const fileName = url.split('/').pop() ?? ''
  const data = growthStageData.find((digimon) => digimon.이름 === fileName.replace('.png', ''))
  return {
    url,
    name: fileName.replace('.png', ''),
    data,
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
    result.set(digimon.이름, {
      ...digimon,
      stage,
      imageUrl: createDigimonImageUrl(stage, digimon.이름),
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
].reduce((result, skill) => {
  if (!result.has(skill.기술명)) {
    result.set(skill.기술명, skill)
  }

  return result
}, new Map())

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

const createShuffledBgmQueue = (previousUrl = null) => {
  const queue = [...bgmTracks]

  for (let index = queue.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[queue[index], queue[randomIndex]] = [queue[randomIndex], queue[index]]
  }

  if (queue.length > 1 && queue[0]?.url === previousUrl) {
    ;[queue[0], queue[1]] = [queue[1], queue[0]]
  }

  return queue
}

const BackgroundMusic = () => {
  const audioRef = useRef(null)
  const queueRef = useRef(createShuffledBgmQueue())
  const currentTrackRef = useRef(null)
  const fadeFrameRef = useRef(null)
  const hasStartedRef = useRef(false)
  const isFadingOutRef = useRef(false)

  useEffect(() => {
    const audio = audioRef.current

    if (!audio || bgmTracks.length === 0) {
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
      if (queueRef.current.length === 0) {
        queueRef.current = createShuffledBgmQueue(currentTrackRef.current?.url)
      }

      return queueRef.current.shift() ?? bgmTracks[0]
    }

    const playNextTrack = async () => {
      const nextTrack = getNextTrack()

      currentTrackRef.current = nextTrack
      isFadingOutRef.current = false
      audio.pause()
      audio.src = nextTrack.url
      audio.volume = 0
      audio.currentTime = 0

      try {
        await audio.play()
        hasStartedRef.current = true
        fadeVolume(BGM_VOLUME, BGM_FADE_IN_MS)
      } catch {
        hasStartedRef.current = false
        audio.pause()
      }
    }

    const startAfterUserGesture = () => {
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

const ButtonClickSound = () => {
  const audioPoolRef = useRef([])
  const audioIndexRef = useRef(0)

  useEffect(() => {
    audioPoolRef.current = Array.from({ length: BUTTON_CLICK_SFX_POOL_SIZE }, () => {
      const audio = new Audio(BUTTON_CLICK_SFX_URL)
      audio.preload = 'auto'
      audio.volume = BUTTON_CLICK_SFX_VOLUME

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
      audio.volume = BUTTON_CLICK_SFX_VOLUME
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
const getBattlePrompt = (name) => `${name}은 무엇을 할까?`
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

const getJogressRecipeForMembers = (members, recipes = JOGRESS_RECIPES) => {
  if ((members ?? []).length !== 2) {
    return null
  }

  const [firstMember, secondMember] = members

  if (!firstMember?.name || !secondMember?.name || firstMember.id === secondMember.id) {
    return null
  }

  return (
    (recipes ?? []).find((recipe) => {
      const selectedCounts = [firstMember.name, secondMember.name].reduce((result, name) => {
        result[name] = (result[name] ?? 0) + 1
        return result
      }, {})

      return (
        recipe.materials?.length === 2 &&
        recipe.materials.every((materialName) => {
          if ((selectedCounts[materialName] ?? 0) <= 0) {
            return false
          }

          selectedCounts[materialName] -= 1
          return true
        })
      )
    }) ?? null
  )
}

const isJogressMemberSelectable = (member, party, selectedIds = [], recipes = JOGRESS_RECIPES) => {
  if (!member || isCombatantEgg(member)) {
    return false
  }

  if (selectedIds.includes(member.id)) {
    return true
  }

  const selectedMember = selectedIds.length > 0 ? getCombatantById(party, selectedIds[0]) : null

  if (selectedMember) {
    return Boolean(getJogressRecipeForMembers([selectedMember, member], recipes))
  }

  return getAvailableJogressRecipesForParty(party, recipes).some((recipe) =>
    recipe.materials?.includes(member.name)
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

const getCombatantStatChartData = (combatant, activeTab) => {
  if (!combatant || !activeTab) {
    return null
  }

  const isBattleStats = activeTab === 'stats'
  const maximumValue = isBattleStats
    ? Math.max(...COMBATANT_STAT_CHART_FIELDS.map((field) => getStatChartValue(combatant, field.key)), 1)
    : IV_MAX

  return COMBATANT_STAT_CHART_FIELDS.map((field) => {
    const value = isBattleStats
      ? getStatChartValue(combatant, field.key)
      : combatant?.[activeTab]?.[field.key] ?? 0

    return {
      ...field,
      value,
      valueText:
        isBattleStats && field.key === 'hp'
          ? String(combatant.maxHp)
          : isBattleStats
            ? String(value)
            : `${value}/${maximumValue}`,
      ratio: maximumValue > 0 ? value / maximumValue : 0,
    }
  })
}

const CombatantStatChart = ({ combatant, activeTab }) => {
  const chartData = getCombatantStatChartData(combatant, activeTab)

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

const CombatantIdentityStrip = ({ combatant }) => {
  if (!combatant) {
    return null
  }

  const typeIconUrl = getDigimonTypeIconUrl(combatant.type)
  const attributeIconUrl = getDigimonAttributeIconUrl(combatant.attribute)

  return (
    <div className="combatant-info__identity">
      <strong className="combatant-info__name">{combatant.name}</strong>
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
        <CombatantStatChart combatant={combatant} activeTab={resolvedActiveTab} />
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
      return `${combatantName}은(는) 혼란으로 명령을 제대로 수행하지 못했다!`
    case '착란':
      return `${combatantName}은(는) 착란 상태라 명령을 수행할 수 없다!`
    case '마비':
      return `${combatantName}은(는) 마비로 몸이 굳어 움직이지 못했다!`
    case '행동불능':
      return `${combatantName}은(는) 행동불능 상태라 움직일 수 없다!`
    case '수면':
      return `${combatantName}은(는) 잠들어 있어 제대로 움직이지 못했다!`
    case '혼수상태':
      return `${combatantName}은(는) 혼수상태라 전혀 반응하지 않는다!`
    default:
      return `${combatantName}은(는) 상태이상 때문에 행동하지 못했다!`
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
const getSkillRangeLabel = (skillData) => (isSkillAreaAttack(skillData) ? '상대 전체' : '상대 1마리')

const getSkillEffectDescription = (skillData) => {
  if (!skillData) {
    return null
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

const BattleSkillTooltip = ({ skillData }) => {
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
    <div className="battle-skill-tooltip" aria-hidden="true">
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

const getCombatantBattleStatTotal = (combatant) =>
  STAT_KEYS.reduce((total, statKey) => total + getCombatantBattleStatValue(combatant, statKey), 0)

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

const calculateBattleStats = ({ baseStats, level, ivs, activeBuffs, digiclones }) => ({
  maxHp: Math.max(
    1,
    Math.floor(
      calculateHpStat({
        base: baseStats.hp,
        iv: ivs.hp,
        level,
      }) *
        getBuffMultiplier(activeBuffs, 'hp') *
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

const createJogressCombatant = (primaryCombatant, partnerCombatant, targetData) => {
  if (!primaryCombatant || !partnerCombatant || !targetData) {
    return primaryCombatant
  }

  const mergedIvs = STAT_KEYS.reduce((result, statKey) => {
    result[statKey] = Math.max(primaryCombatant.ivs?.[statKey] ?? 0, partnerCombatant.ivs?.[statKey] ?? 0)
    return result
  }, {})
  const primaryHpRatio = primaryCombatant.maxHp > 0 ? primaryCombatant.currentHp / primaryCombatant.maxHp : 1
  const partnerHpRatio = partnerCombatant.maxHp > 0 ? partnerCombatant.currentHp / partnerCombatant.maxHp : 1
  const hpRatio = Math.max(0, Math.min(1, (primaryHpRatio + partnerHpRatio) / 2))
  const jogressCombatant = createCombatant({
    id: primaryCombatant.id,
    name: targetData.이름,
    imageUrl: targetData.imageUrl ?? '',
    data: targetData,
    level: Math.max(primaryCombatant.level ?? 1, partnerCombatant.level ?? 1),
    experience: Math.max(primaryCombatant.experience ?? 0, partnerCombatant.experience ?? 0),
    ivs: mergedIvs,
    activeBuffs: primaryCombatant.activeBuffs,
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
    digiclones: resolvedDigiclones,
  })

  return {
    id,
    name,
    imageUrl: imageUrl ?? '',
    speciesData: data,
    speciesStage: stageName ?? data?.stage ?? null,
    baseStats,
    ivs: resolvedIvs,
    activeBuffs: resolvedActiveBuffs,
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
    attack: battleStats.attack,
    specialAttack: battleStats.specialAttack,
    defense: battleStats.defense,
    specialDefense: battleStats.specialDefense,
    speed: battleStats.speed,
    skills: [...(data?.기술 ?? [])].slice(0, 4),
  }
}

const createCapturedPartyMember = (enemy, captureId) =>
  refreshCombatantStats(
    {
      ...enemy,
      id: captureId,
      activeBuffs: normalizeBuffState(null),
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

const resolveTurnEndStatus = (combatant, { side = 'enemy' } = {}) => {
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

  if (statusDefinition.endTurnDamageRatio && nextCombatant.currentHp > 0) {
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
      `${nextCombatant.name}은(는) ${statusDefinition.label} 때문에 ${appliedDamage} 데미지를 입었다!`
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

const applyExperienceAmount = ({
  combatant,
  experienceAmount,
  levelCap,
}) => {
  if (!combatant || experienceAmount <= 0) {
    return {
      nextCombatant: combatant,
      battleLogs: [],
    }
  }

  let nextCombatant = { ...combatant }
  const battleLogs = []

  nextCombatant.experience += experienceAmount
  battleLogs.push(`${nextCombatant.name}은(는) 경험치 ${experienceAmount}를 얻었다!`)

  while (
    nextCombatant.level < levelCap &&
    nextCombatant.experience >= nextCombatant.experienceToNext
  ) {
    nextCombatant.experience -= nextCombatant.experienceToNext
    nextCombatant = levelUpCombatant(nextCombatant, nextCombatant.level + 1)
    battleLogs.push(`${nextCombatant.name}의 레벨이 Lv.${nextCombatant.level}이 되었다!`)
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
      })
  }

  return {
    nextParty,
    battleLogs,
  }
}

const resolveAttackAction = ({
  attacker,
  defender,
  skillName,
  announce = true,
  inventory = {},
  attackerSide = 'ally',
}) => {
  const skillData = getSkillData(skillName)
  const skillStatusData = getSkillStatusData(skillData)
  const battleLogs = announce ? [`${attacker.name}의 ${skillData.기술명}!`] : []
  const accuracyValue = getModifiedAccuracyValue(skillData, attacker, defender, attackerSide)

  if (Math.random() * 100 >= accuracyValue) {
    return {
      nextDefender: defender,
      battleLogs: [...battleLogs, `${attacker.name}의 공격이 빗나갔다!`],
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
      nextLogs.push(`${nextDefender.name}은(는) ${skillStatusData.type} 상태가 되었다!`)
    }
  }

  return {
    nextDefender,
    battleLogs: nextLogs,
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
      if (isAreaAttack) {
        battleLogs.push(`${nextEnemy.name}의 ${enemySkillData.기술명}!`)
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
      }
    }

    if (isCombatantAbleToBattle(nextEnemy)) {
      const endStatusResult = resolveTurnEndStatus(nextEnemy, { side: 'enemy' })
      nextEnemy = endStatusResult.nextCombatant
      battleLogs.push(...endStatusResult.battleLogs)
    }

    nextEnemies[enemyIndex] = nextEnemy
  })

  return {
    nextEnemies,
    nextParty,
    battleLogs,
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

      const targetCandidates = getBattleTurnTargetCandidates({
        action,
        party: nextParty,
        enemies: nextEnemies,
        activeAllyIds,
      })

      if (isAreaAttack) {
        if (targetCandidates.length > 0) {
          battleLogs.push(`${actor.name}의 ${skillData.기술명}!`)
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
          } else {
            const recoveryResult = resolveRecoveryProgramOnDefeat(attackResult.nextDefender)
            nextParty = replacePartyMember(nextParty, recoveryResult.nextCombatant)
            battleLogs.push(...attackResult.battleLogs)
            battleLogs.push(...recoveryResult.battleLogs)
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
          } else {
            const recoveryResult = resolveRecoveryProgramOnDefeat(attackResult.nextDefender)
            nextParty = replacePartyMember(nextParty, recoveryResult.nextCombatant)
            battleLogs.push(...attackResult.battleLogs)
            battleLogs.push(...recoveryResult.battleLogs)
          }
        } else {
          battleLogs.push(`${actor.name}의 공격 대상이 없다!`)
        }
      }
    }

    actor = getBattleTurnActor({ action, party: nextParty, enemies: nextEnemies }) ?? actor

    if (isCombatantAbleToBattle(actor)) {
      const endStatusResult = resolveTurnEndStatus(actor, { side: action.side })
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
  const [selectedGrowthIndex, setSelectedGrowthIndex] = useState(0)
  const [selectedStarterNames, setSelectedStarterNames] = useState(() =>
    growthStageDigimon[0]?.name ? [growthStageDigimon[0].name] : []
  )
  const [gameState, setGameState] = useState(null)
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
  const [displayedPlayerExpRatio, setDisplayedPlayerExpRatio] = useState(0)
  const [, setIsPlayerExpBarVisible] = useState(false)
  const [isPlayerExpTransitionInstant, setIsPlayerExpTransitionInstant] = useState(false)
  const [levelUpStatPreview, setLevelUpStatPreview] = useState(null)
  const expAnimationTimeoutsRef = useRef([])
  const levelUpStatTimeoutsRef = useRef([])
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

  const clearExpAnimationQueue = () => {
    expAnimationTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    expAnimationTimeoutsRef.current = []
  }

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

  const showLevelUpStatPreview = (previousStats, currentStats) => {
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

    if (!statRows.some((row) => row.gain > 0)) {
      return
    }

    clearLevelUpStatAnimationQueue()
    setLevelUpStatPreview({
      isExiting: false,
      rows: statRows,
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
    nextInventory = gameState?.inventory ?? {},
    nextGold = gameState?.gold ?? 0,
    preferredActiveAllyIds = gameState?.activeAllyIds ?? [],
    capturedPreviewCombatant = null,
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
      setCurrentLogs(createBattleLog(...resolvedLogs))
      setBattlePanelMode(battlePanel)
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
        nextActedAllyIds: [],
      })
    }

    const commitDefeat = () => {
      resolvedLogs.push('눈앞이 깜깜해졌다...')
      commitBattleState({
        nextPlayer: getCombatantById(resolvedParty, actedAllyId) ?? resolvedParty[0] ?? gameState.player,
        battlePanel: 'logs',
      })
      window.setTimeout(() => {
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
  }

  const finishResolvedTurn = ({
    nextParty,
    nextEnemies,
    logs,
    nextInventory = gameState?.inventory ?? {},
    nextGold = gameState?.gold ?? 0,
    preferredActiveAllyIds = gameState?.activeAllyIds ?? [],
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
        activeAllyIds,
        actingAllyId: nextPlayer?.id ?? null,
        actedAllyIds: [],
        pendingAllyActions: [],
      })
      setCurrentLogs(createBattleLog(...resolvedLogs))
      setBattlePanelMode(battlePanel)
      setSelectedBattleCommand('attack')
      setSelectedSkillIndex(0)
      setSelectedEnemyTargetId(null)
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
      resolvedLogs.push('눈앞이 깜깜해졌다...')
      commitBattleState({
        nextPlayer:
          getFirstLivingPartyMember(resolvedParty, activeAllyIds) ??
          resolvedParty[0] ??
          gameState.player,
        battlePanel: 'logs',
      })
      window.setTimeout(() => {
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
    const nextParty = eggProgressResult.nextParty
    const nextActiveAllyIds = getActiveAllyIdsForParty(
      nextParty,
      [],
      getBattleAllyLimit({
        encounterCount,
        enemies: newEnemies,
      })
    )
    const nextPlayer =
      getFirstLivingPartyMember(nextParty, nextActiveAllyIds) ?? currentPlayer

    setGameState({
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
    })
    setIsPlayerExpBarVisible(false)
    setCurrentLogs(
      createBattleLog(...eggProgressResult.hatchLogs, getBattlePrompt(nextPlayer?.name ?? '디지몬'))
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
      setScreenMode('menu')
      setGameState(null)
      setRewardState(null)
      setEvolutionState(null)
      setMapSelectionState(null)
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
        setCurrentLogs(createBattleLog('지도를 펼쳤다. 다음 지역을 선택해줘!'))
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

    if (isSkillAreaAttack(playerSkillData)) {
      setHoveredSkillIndex(null)
      setHoveredEnemyTargetId(null)
      handleExecuteSkill(skillIndex)
      return
    }

    const livingEnemies = gameState.enemies.filter((enemy) => isCombatantAbleToBattle(enemy))

    if (livingEnemies.length === 1) {
      setHoveredSkillIndex(null)
      setHoveredEnemyTargetId(null)
      handleExecuteSkill(skillIndex, livingEnemies[0].id)
      return
    }

    setBattlePanelMode('attack-targets')
    setHoveredSkillIndex(null)
    setHoveredEnemyTargetId(null)
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

    if (isAreaAttack) {
      setSelectedEnemyTargetId(null)
    }

    const targetEnemy = isAreaAttack
      ? gameState.enemies[getLivingEnemyIndex(gameState.enemies)]
      : gameState.enemies.find(
          (enemy) => enemy.id === targetEnemyId && isCombatantAbleToBattle(enemy)
        )

    if (!targetEnemy) {
      setCurrentLogs(
        createBattleLog(
          isAreaAttack
            ? '공격할 수 있는 적이 없다!'
            : `${actingAlly.name}의 공격 대상을 선택해줘!`
        )
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
      targetId: isAreaAttack ? null : targetEnemy.id,
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
      setCurrentLogs(createBattleLog(`${actingAlly.name}의 행동을 정했다!`, getBattlePrompt(nextPlayer.name)))
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

    finishResolvedTurn({
      nextParty: turnResult.nextParty,
      nextEnemies: turnResult.nextEnemies,
      logs: turnResult.battleLogs,
      preferredActiveAllyIds: battleContext.activeAllyIds,
    })
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
      }, 30 + EXP_BAR_ANIMATION_MS + EXP_BAR_VISIBLE_AFTER_MS)

      previousPlayerProgressRef.current = currentSnapshot
      return undefined
    }

    scheduleExpAnimationUpdate(() => {
      setIsPlayerExpBarVisible(true)
      setIsPlayerExpTransitionInstant(false)
      setDisplayedPlayerExpRatio(previousSnapshot.ratio)
      showLevelUpStatPreview(previousSnapshot.stats, currentSnapshot.stats)
    })

    let elapsed = 30

    for (let index = 0; index < levelGainCount; index += 1) {
      scheduleExpAnimationUpdate(() => {
        setIsPlayerExpTransitionInstant(false)
        setDisplayedPlayerExpRatio(100)
      }, elapsed)
      elapsed += EXP_BAR_ANIMATION_MS

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
    }, elapsed + EXP_BAR_ANIMATION_MS + EXP_BAR_VISIBLE_AFTER_MS)

    previousPlayerProgressRef.current = currentSnapshot

    return undefined
  }, [
    gameState?.player?.id,
    gameState?.player?.level,
    gameState?.player?.experience,
    gameState?.player?.experienceToNext,
  ])

  useEffect(
    () => () => {
      expAnimationTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      levelUpStatTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
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

  const handleMenuAction = (actionKey) => {
    if (actionKey === 'new-game') {
      clearCapturePreviewTimeouts()
      setCapturePreview(null)
      setRewardState(null)
      setMapSelectionState(null)
      setScreenMode('new-game')
    }
  }

  const handleBattleCommandSelect = (commandKey) => {
    if (rewardState || mapSelectionState || !gameState || battlePanelMode === 'logs') {
      return
    }

    if ((gameState.pendingAllyActions ?? []).length > 0 && commandKey !== 'attack') {
      const currentActingAlly = getBattleContext().actingAlly ?? gameState.player
      setSelectedBattleCommand('attack')
      setBattlePanelMode('commands')
      setCurrentLogs(
        createBattleLog('남은 아군의 기술을 먼저 선택해줘!', getBattlePrompt(currentActingAlly.name))
      )
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
      const currentActingAlly = getBattleContext().actingAlly ?? gameState.player
      setCurrentLogs(createBattleLog('지금은 도망칠 수 없다!', getBattlePrompt(currentActingAlly.name)))
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
      setCurrentLogs(
        createBattleLog(
          '적 디지몬이 1마리만 남았을 때 포획할 수 있다!',
          getBattlePrompt(actingAlly.name)
        )
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

    finishBattleAction({
      nextParty: battleContext.party,
      nextEnemies: gameState.enemies,
      logs: [`${currentPlayer.name}, 돌아와!`, `${nextPlayer.name}, 부탁해!`],
      actedAllyId: nextPlayer.id,
      preferredActiveAllyIds: nextActiveAllyIds,
    })
    setSelectedBattleCommand('attack')
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
    const finishRewardUse = (nextGameState) => {
      setGameState(nextGameState)

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

      if (selectedMembers.length !== 2 || !jogressRecipe || !targetData) {
        return
      }

      const [primaryMember, partnerMember] = selectedMembers
      const jogressMember = createJogressCombatant(primaryMember, partnerMember, targetData)
      const selectedIdSet = new Set(targetIds)
      const nextParty = currentParty
        .filter((member) => member.id !== partnerMember.id)
        .map((member) => (member.id === primaryMember.id ? jogressMember : member))
      const nextPlayer =
        selectedIdSet.has(gameState.player?.id)
          ? jogressMember
          : getCombatantById(nextParty, gameState.player?.id) ??
            getFirstLivingPartyMember(nextParty, gameState.activeAllyIds) ??
            jogressMember
      const nextActiveAllyIds = getActiveAllyIdsForParty(
        nextParty,
        (gameState.activeAllyIds ?? []).filter((memberId) => memberId !== partnerMember.id),
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

      const nextParty = currentParty.map((member) =>
        isRewardItemUsableByCombatant(partyLevelUpItem, member, levelCap)
          ? applyLevelUpRewardEffect(
              member,
              effectiveRewardItem.partyLevelUpAmount,
              getRewardItemLevelLimit(partyLevelUpItem, levelCap)
            )
          : member
      )
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

    finishRewardUse(nextGameState)
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

      if (selectedTargetIds.length <= 0) {
        const selectedMember = getCombatantById(currentParty, memberId)

        if (!isJogressMemberSelectable(selectedMember, currentParty, [], rewardItem.jogressRecipes)) {
          return
        }

        setRewardState((current) =>
          current?.pendingTarget
            ? {
                ...current,
                pendingTarget: {
                  ...current.pendingTarget,
                  selectedTargetIds: [memberId],
                },
              }
            : current
        )
        return
      }

      const nextTargetIds = [selectedTargetIds[0], memberId]
      const selectedMembers = nextTargetIds.map((targetId) => getCombatantById(currentParty, targetId)).filter(Boolean)

      if (!getJogressRecipeForMembers(selectedMembers, rewardItem.jogressRecipes)) {
        return
      }

      completeRewardItemUse({
        rewardItem,
        source: pendingTarget.source,
        targetIds: nextTargetIds,
      })
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
    }, EVOLUTION_SCENE_SWITCH_MS)
    window.setTimeout(() => {
      setEvolutionScene((current) => (current?.id === sceneId ? null : current))
      setEvolutionState({
        mode: 'party',
        selectedMemberId: null,
        confirmTargetName: null,
      })
    }, EVOLUTION_SCENE_TOTAL_MS)
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
    if (!gameState || !rewardState || rewardState.isResolving || rewardState.pendingTarget) {
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
    if (!gameState || !rewardState || rewardState.isResolving || rewardState.pendingTarget) {
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
  const selectedGrowthSkills = selectedGrowthDigimon?.data?.기술 ?? []
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
        stageName: '성장기',
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

    setGameState({
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
    })
    setCurrentLogs(createBattleLog(getBattlePrompt(player.name)))
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
  const activeAllyIds = battleContext.activeAllyIds
  const activeAllies = activeAllyIds
    .map((memberId) => getCombatantById(partyMembers, memberId))
    .filter(Boolean)
  const actingAlly = battleContext.actingAlly ?? gameState?.player ?? null
  const playerSkills = actingAlly?.skills ?? []
  const battleSkillSlots = Array.from({ length: 4 }, (_, index) => playerSkills[index] ?? null)
  const selectedSkill = battleSkillSlots[selectedSkillIndex]
  const selectedSkillData = selectedSkill ? getSkillData(selectedSkill) : null
  const activePreviewSkillIndex =
    hoveredSkillIndex !== null && battleSkillSlots[hoveredSkillIndex] ? hoveredSkillIndex : null
  const isAttackPanelOpen = battlePanelMode === 'attack'
  const isAttackTargetPanelOpen = battlePanelMode === 'attack-targets'
  const isSkillConsoleOpen = isAttackPanelOpen || isAttackTargetPanelOpen
  const isItemPanelOpen = battlePanelMode === 'items'
  const isPartyPanelOpen = battlePanelMode === 'party'
  const captureInventoryItems = captureItemOrder.map((itemId) => {
    const item = captureItemLookup.get(itemId)

    return {
      ...item,
      count: gameState?.inventory?.[itemId] ?? 0,
    }
  })
  const hasDigimonDetector = (gameState?.inventory?.[DIGIMON_DETECTOR_ITEM_ID] ?? 0) > 0
  const hasIvDetector = hasDigimonDetector && (gameState?.inventory?.[IV_DETECTOR_ITEM_ID] ?? 0) > 0
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

  return (
    <main
      className={['main-screen', screenMode === 'adventure' ? 'main-screen--adventure' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <BackgroundMusic />
      <ButtonClickSound />
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
            screenMode === 'adventure' ? 'playfield__content--adventure' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {screenMode === 'menu' ? (
            <aside className="menu-panel">
              <nav className="menu-panel__list" aria-label={'\uBA54\uC778 \uBA54\uB274'}>
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={[
                      'menu-item',
                      item.key === 'new-game' ? 'menu-item--current' : '',
                      item.disabled ? 'menu-item--disabled' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={item.disabled}
                    onClick={() => handleMenuAction(item.key)}
                  >
                    <span className="menu-item__marker" aria-hidden="true">
                      {item.key === 'new-game' ? '\u25B6' : ''}
                    </span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
          ) : screenMode === 'new-game' ? (
            <section className="selection-screen" aria-label={'\uC131\uC7A5\uAE30 \uC120\uD0DD'}>
              <div className="selection-preview">
                <div className="selection-preview__top">
                  <button
                    type="button"
                    className="selection-back"
                    onClick={() => setScreenMode('menu')}
                  >
                    {'\u25C0 \uB4A4\uB85C'}
                  </button>
                  <div className="selection-preview__title-group">
                    <p className="selection-label">{'\uD604\uC7AC \uC131\uC7A5\uAE30'}</p>
                    <h2 className="selection-name">{selectedGrowthDigimon.name}</h2>
                  </div>
                </div>

                <div className="selection-preview__frame">
                  <img
                    className="selection-preview__image"
                    src={selectedGrowthDigimon.url}
                    alt={selectedGrowthDigimon.name}
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
                    onClick={handleStartAdventure}
                  >
                    {'\uC2DC\uC791'}
                  </button>
                </div>
              </div>

              <div className="selection-gallery">
                <div className="selection-gallery__main">
                  <div className="selection-gallery__header">
                    <p className="selection-label">{'\uC131\uC7A5\uAE30 \uBAA9\uB85D'}</p>
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
                            src={createDigimonArtworkUrl('성장기', digimon.name)}
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
                            src={createDigimonArtworkUrl('성장기', digimon.name)}
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
                              activeCombatantInfoId === `player-${ally.id}`
                                ? 'adventure-player__sprite-wrap--info-open'
                                : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
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
                            <img
                              className="adventure-player__sprite adventure-player__sprite--ally"
                              src={ally.imageUrl}
                              alt={ally.name}
                            />
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
                              src={createDigimonArtworkUrl(ally.speciesStage, ally.name)}
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
                      const enemyHpRatio = Math.max(
                        0,
                        Math.min(100, (enemy.currentHp / enemy.maxHp) * 100)
                      )
                      const enemyStatusBadge = getCombatantStatusBadge(enemy)
                      const enemyTypeIconUrl = getDigimonTypeIconUrl(enemy.type)
                      const enemyAttributeIconUrl = getDigimonAttributeIconUrl(enemy.attribute)

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
                              hasDigimonDetector && activeCombatantInfoId === `enemy-${enemy.id}`
                                ? 'adventure-player__sprite-wrap--info-open'
                                : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            tabIndex={hasDigimonDetector ? 0 : undefined}
                            aria-label={
                              hasDigimonDetector
                                ? `${enemy.name} 상세 정보`
                                : '디지몬탐지기 획득 후 적 정보를 확인할 수 있습니다'
                            }
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
                            <img
                              className="adventure-player__sprite adventure-player__sprite--enemy"
                              src={enemy.imageUrl}
                              alt={enemy.name}
                            />
                            {hasDigimonDetector ? (
                              <CombatantInfoPanel
                                combatant={enemy}
                                side="enemy"
                                activeTab={combatantInfoTab}
                                onTabChange={setCombatantInfoTab}
                                canViewEnemyInfo={hasDigimonDetector}
                                canViewEnemyIvs={hasIvDetector}
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
                              src={createDigimonArtworkUrl(enemy.speciesStage, enemy.name)}
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
                        {rewardState.randomItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={[
                              'reward-item',
                              'reward-item--random',
                              rewardState.selectedRandomItemId === item.id ? 'reward-item--selected' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={rewardState.isResolving || Boolean(rewardState.pendingTarget)}
                            onClick={() => handleClaimRandomRewardItem(item.id)}
                            data-tooltip={item.description}
                            title={item.description}
                          >
                            <img className="reward-item__image" src={item.imageUrl} alt="" />
                            <strong className="reward-item__name">{item.name}</strong>
                          </button>
                        ))}
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
                                ? `${pendingRewardItem.name} ${pendingJogressSelectedIds.length}/2`
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
              </div>

              <div className="battle-console" aria-label={'\uBC30\uD2C0 UI'}>
                <section
                  className={[
                    'battle-console__message',
                    isSkillConsoleOpen && !rewardState ? 'battle-console__message--skills' : '',
                    !isSkillConsoleOpen && currentLogs.length > 0 ? 'battle-console__message--logs' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={
                    isSkillConsoleOpen && !rewardState
                      ? isAttackTargetPanelOpen
                        ? '공격 대상 목록'
                        : '\uAE30\uC220 \uBAA9\uB85D'
                      : '\uBC30\uD2C0 \uBA54\uC2DC\uC9C0'
                  }
                >
                  {isAttackPanelOpen && !rewardState ? (
                    <div className="battle-skill-grid" onMouseLeave={handleSkillPreviewClear}>
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
                            {skill ? <BattleSkillTooltip skillData={skillData} /> : null}
                          </button>
                        )
                      })}
                    </div>
                  ) : isAttackTargetPanelOpen && !rewardState ? (
                    <div className="battle-target-panel">
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
                  ) : currentLogs.length > 0 ? (
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
