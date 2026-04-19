import { useEffect, useRef, useState } from 'react'
import babyStageData from '../data/디지몬/유아기.json'
import childStageData from '../data/디지몬/유년기.json'
import growthStageData from '../data/디지몬/성장기.json'
import matureStageData from '../data/디지몬/성숙기.json'
import perfectStageData from '../data/디지몬/완전체.json'
import ultimateStageData from '../data/디지몬/궁극체.json'
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

const DIGIMON_DETECTOR_ITEM_ID = 'digimon-detector'
const IV_DETECTOR_ITEM_ID = 'iv-detector'
const MAP_ITEM_ID = 'map-item'
const GLOBE_ITEM_ID = 'globe-item'

const fixedRewardItems = [
  {
    id: 'heal-20',
    name: '상처약',
    description: 'HP 20 회복',
    price: 120,
    healAmount: 20,
    imageUrl: '/아이템/회복/상처약.png',
  },
  {
    id: 'heal-50',
    name: '좋은 상처약',
    description: 'HP 50 회복',
    price: 280,
    healAmount: 50,
    imageUrl: '/아이템/회복/좋은상처약.png',
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
    id: 'heal-200',
    name: '고급 상처약',
    description: 'HP 200 회복',
    healAmount: 200,
    imageUrl: '/아이템/회복/고급상처약.png',
  },
  {
    id: 'heal-full-hp',
    name: '풀 회복약',
    description: '상태이상은 유지하고 HP만 모두 회복',
    healFull: true,
    imageUrl: '/아이템/회복/풀회복약.png',
  },
  {
    id: 'heal-full-cure',
    name: '회복약',
    description: 'HP를 모두 회복하고 상태이상도 치료',
    healFull: true,
    cureStatus: true,
    imageUrl: '/아이템/회복/회복약.png',
  },
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
]

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
}

const createDigimonImageUrl = (stage, name) =>
  `/${encodeURIComponent('도감')}/${encodeURIComponent(stage)}/${encodeURIComponent(name)}.png`

const createDigimonArtworkUrl = (stage, name) => (stage && name ? `/이미지/${stage}/${name}.jpg` : '')

const hideBrokenArtwork = (event) => {
  event.currentTarget.style.visibility = 'hidden'
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

const createPublicAssetUrl = (...segments) =>
  `/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`

const getDigimonTypeIconUrl = (type) =>
  DIGIMON_TYPE_ICON_NAMES.has(type) ? createPublicAssetUrl('타입', `${type}.png`) : null

const getDigimonAttributeIconUrl = (attribute) => {
  const iconName = ATTRIBUTE_ICON_FILE_MAP[attribute] ?? attribute

  return iconName ? createPublicAssetUrl('속성', `${iconName}.png`) : null
}

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

const MAX_ACTIVE_COMBATANTS = 2
const MAX_ENEMY_COMBATANTS = 2
const STARTING_PLAYER_LEVEL = 5
const BUFF_STAGE_DURATION = 10
const STATUS_DURATION_TURNS = 3
const STATUS_EARLY_CURE_CHANCE = 30
const IV_MAX = 31
const EV_PER_STAT_MAX = 252
const EV_TOTAL_MAX = 510
const STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
const BUFFABLE_STAT_KEYS = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
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
  { key: 'evs', label: '노력치' },
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
const EV_YIELD_BY_STAGE = {
  유아기: 1,
  유년기: 1,
  성장기: 1,
  성숙기: 2,
  완전체: 2,
  궁극체: 3,
  초궁극체: 3,
}
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
const getStageClearGoldReward = (stage) => {
  const waveSet = Math.ceil(stage / 10) - 1
  const baseReward = (10 * stage + 175) ** (1 + 0.005 * waveSet)
  return Math.max(20, Math.floor(baseReward / 10) * 10)
}
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
const isCombatantAbleToBattle = (combatant) => (combatant?.currentHp ?? 0) > 0
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

const applyInstantRewardEffect = (player, rewardItem) => {
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

const canRandomRewardItemAppear = (item, inventory = {}) => {
  if (item.requiresItemId && (inventory?.[item.requiresItemId] ?? 0) <= 0) {
    return false
  }

  if (item.unique && (inventory?.[item.id] ?? 0) > 0) {
    return false
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

  return addInventoryItem(inventory, item.id)
}

const createRewardSelection = (inventory = {}) => ({
  randomItems: shuffleItems(randomRewardItemPool.filter((item) => canRandomRewardItemAppear(item, inventory))).slice(0, 3),
  selectedRandomItemId: null,
  isResolving: false,
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

const getEncounterCountForStage = () => (rollPercentChance(20) ? MAX_ENEMY_COMBATANTS : 1)

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
    : activeTab === 'ivs'
      ? IV_MAX
      : EV_PER_STAT_MAX

  return COMBATANT_STAT_CHART_FIELDS.map((field) => {
    const value = isBattleStats
      ? getStatChartValue(combatant, field.key)
      : combatant?.[activeTab]?.[field.key] ?? 0

    return {
      ...field,
      value,
      valueText:
        isBattleStats && field.key === 'hp'
          ? `${combatant.currentHp}/${combatant.maxHp}`
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

const getExperienceToNextLevel = (level) => Math.floor(20 + level * 12)

const clampStatValue = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

const createFlatStatBlock = (fillValue = 0) =>
  STAT_KEYS.reduce((result, statKey) => {
    result[statKey] = fillValue
    return result
  }, {})

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

const calculateHpStat = ({ base, iv, ev, level }) =>
  Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10

const calculateOtherStat = ({ base, iv, ev, level }) =>
  Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5))

const getBuffMultiplier = (activeBuffs, statKey) =>
  BUFFABLE_STAT_KEYS.includes(statKey) && (activeBuffs?.[statKey] ?? 0) > 0 ? 1.1 : 1

const calculateBattleStats = ({ baseStats, level, ivs, evs, activeBuffs }) => ({
  maxHp: Math.max(
    1,
    calculateHpStat({
      base: baseStats.hp,
      iv: ivs.hp,
      ev: evs.hp,
      level,
    })
  ),
  attack: Math.max(
    1,
    Math.floor(
      calculateOtherStat({
        base: baseStats.attack,
        iv: ivs.attack,
        ev: evs.attack,
        level,
      }) * getBuffMultiplier(activeBuffs, 'attack')
    )
  ),
  defense: Math.max(
    1,
    Math.floor(
      calculateOtherStat({
        base: baseStats.defense,
        iv: ivs.defense,
        ev: evs.defense,
        level,
      }) * getBuffMultiplier(activeBuffs, 'defense')
    )
  ),
  specialAttack: Math.max(
    1,
    Math.floor(
      calculateOtherStat({
        base: baseStats.specialAttack,
        iv: ivs.specialAttack,
        ev: evs.specialAttack,
        level,
      }) * getBuffMultiplier(activeBuffs, 'specialAttack')
    )
  ),
  specialDefense: Math.max(
    1,
    Math.floor(
      calculateOtherStat({
        base: baseStats.specialDefense,
        iv: ivs.specialDefense,
        ev: evs.specialDefense,
        level,
      }) * getBuffMultiplier(activeBuffs, 'specialDefense')
    )
  ),
  speed: Math.max(
    1,
    Math.floor(
      calculateOtherStat({
        base: baseStats.speed,
        iv: ivs.speed,
        ev: evs.speed,
        level,
      }) * getBuffMultiplier(activeBuffs, 'speed')
    )
  ),
})

const getBaseStatTotal = (baseStats) =>
  STAT_KEYS.reduce((total, statKey) => total + (baseStats?.[statKey] ?? 0), 0)

const getTotalEffortValues = (evs) =>
  STAT_KEYS.reduce((total, statKey) => total + (evs?.[statKey] ?? 0), 0)

const getDominantStatKey = (baseStats) =>
  STAT_KEYS.reduce((bestKey, currentKey) => {
    if (!bestKey) {
      return currentKey
    }

    const currentValue = baseStats?.[currentKey] ?? 0
    const bestValue = baseStats?.[bestKey] ?? 0

    return currentValue > bestValue ? currentKey : bestKey
  }, null)

const createCombatant = ({
  id,
  name,
  imageUrl,
  data,
  level = STARTING_PLAYER_LEVEL,
  currentHp,
  experience = 0,
  ivs,
  evs,
  activeBuffs,
  statusEffect,
  stageName,
}) => {
  const baseStats = createBaseStats(data)
  const resolvedIvs = normalizeStatBlock(ivs, createRandomIvs(), IV_MAX)
  const resolvedEvs = normalizeStatBlock(evs, createFlatStatBlock(0), EV_PER_STAT_MAX)
  const resolvedActiveBuffs = normalizeBuffState(activeBuffs)
  const resolvedStatusEffect = normalizeStatusEffect(statusEffect)
  const battleStats = calculateBattleStats({
    baseStats,
    level,
    ivs: resolvedIvs,
    evs: resolvedEvs,
    activeBuffs: resolvedActiveBuffs,
  })

  return {
    id,
    name,
    imageUrl: imageUrl ?? '',
    speciesData: data,
    speciesStage: stageName ?? data?.stage ?? null,
    baseStats,
    ivs: resolvedIvs,
    evs: resolvedEvs,
    activeBuffs: resolvedActiveBuffs,
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
      statusEffect: null,
    },
    {
      activeBuffs: normalizeBuffState(null),
      statusEffect: null,
    }
  )

const getEnemyLevelForStage = (stage) => {
  if (stage <= 10) {
    return getRandomIntInclusive(1, 8)
  }

  const levelCap = getLevelCapForStage(stage)
  const bandIndex = Math.floor((Math.min(Math.max(stage, 1), TOTAL_STAGE_COUNT) - 1) / STAGES_PER_MAP)
  const previousCap = bandIndex === 0 ? STARTING_PLAYER_LEVEL : CLASSIC_LEVEL_CAPS[bandIndex - 1]
  const stageProgress = ((stage - 1) % STAGES_PER_MAP) / Math.max(1, STAGES_PER_MAP - 1)
  const baseLevel = previousCap + (levelCap - previousCap) * (0.45 + stageProgress * 0.55)
  const minimumLevel = Math.max(2, Math.min(levelCap, Math.floor(baseLevel) - 1))
  const maximumLevel = Math.max(minimumLevel, Math.min(levelCap, Math.ceil(baseLevel) + 1))

  return getRandomIntInclusive(minimumLevel, maximumLevel)
}

const getExperienceReward = (enemy) =>
  Math.max(18, Math.floor(enemy.level * 6 + enemy.baseStatTotal * 0.06))

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
    evs = combatant.evs,
    activeBuffs = combatant.activeBuffs,
    statusEffect = combatant.statusEffect,
    preserveMaxHpDelta = false,
  } = {}
) => {
  const battleStats = calculateBattleStats({
    baseStats: combatant.baseStats,
    level,
    ivs,
    evs,
    activeBuffs,
  })
  const maxHpDelta = battleStats.maxHp - combatant.maxHp

  return {
    ...combatant,
    ivs,
    evs,
    activeBuffs: normalizeBuffState(activeBuffs),
    statusEffect: normalizeStatusEffect(statusEffect),
    level,
    experienceToNext: getExperienceToNextLevel(level),
    currentHp: preserveMaxHpDelta
      ? Math.min(battleStats.maxHp, combatant.currentHp + maxHpDelta)
      : Math.min(battleStats.maxHp, combatant.currentHp),
    maxHp: battleStats.maxHp,
    attack: battleStats.attack,
    specialAttack: battleStats.specialAttack,
    defense: battleStats.defense,
    specialDefense: battleStats.specialDefense,
    speed: battleStats.speed,
  }
}

const levelUpCombatant = (combatant, nextLevel) => {
  return refreshCombatantStats(combatant, {
    level: nextLevel,
    preserveMaxHpDelta: true,
  })
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

const resolveTurnEndStatus = (combatant) => {
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
    const damage = Math.max(1, Math.floor(nextCombatant.maxHp * statusDefinition.endTurnDamageRatio))
    const nextHp = Math.max(0, nextCombatant.currentHp - damage)
    nextCombatant = {
      ...nextCombatant,
      currentHp: nextHp,
    }
    battleLogs.push(`${nextCombatant.name}은(는) ${statusDefinition.label} 때문에 ${damage} 데미지를 입었다!`)

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

const applyEffortValueGain = ({ combatant, defeatedEnemies }) => {
  if (!defeatedEnemies.length) {
    return {
      nextCombatant: combatant,
      battleLogs: [],
    }
  }

  const nextEvs = { ...combatant.evs }
  let totalEvs = getTotalEffortValues(nextEvs)
  const gainedStats = createFlatStatBlock(0)

  defeatedEnemies.forEach((enemy) => {
    const dominantStatKey = getDominantStatKey(enemy.baseStats)
    const yieldAmount = EV_YIELD_BY_STAGE[enemy.speciesStage] ?? 1

    if (!dominantStatKey || yieldAmount <= 0) {
      return
    }

    const remainingStatCapacity = EV_PER_STAT_MAX - (nextEvs[dominantStatKey] ?? 0)
    const remainingTotalCapacity = EV_TOTAL_MAX - totalEvs
    const grantedValue = Math.max(0, Math.min(yieldAmount, remainingStatCapacity, remainingTotalCapacity))

    if (grantedValue === 0) {
      return
    }

    nextEvs[dominantStatKey] += grantedValue
    totalEvs += grantedValue
    gainedStats[dominantStatKey] += grantedValue
  })

  const changedStats = STAT_KEYS.filter((statKey) => gainedStats[statKey] > 0)

  if (!changedStats.length) {
    return {
      nextCombatant: combatant,
      battleLogs: [],
    }
  }

  const nextCombatant = refreshCombatantStats(combatant, { evs: nextEvs })

  return {
    nextCombatant,
    battleLogs: [],
  }
}

const applyExperienceGain = ({ combatant, defeatedEnemies, levelCap }) => {
  if (!defeatedEnemies.length) {
    return {
      nextCombatant: combatant,
      battleLogs: [],
    }
  }

  const effortValueResult = applyEffortValueGain({ combatant, defeatedEnemies })
  let nextCombatant = effortValueResult.nextCombatant
  const battleLogs = []

  battleLogs.push(...effortValueResult.battleLogs)

  defeatedEnemies.forEach((enemy) => {
    const reward = getExperienceReward(enemy)
    nextCombatant.experience += reward
    battleLogs.push(`${enemy.name}을(를) 쓰러뜨렸다!`)
    battleLogs.push(`${nextCombatant.name}은(는) 경험치 ${reward}를 얻었다!`)
  })

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

const resolveAttackAction = ({ attacker, defender, skillName, announce = true }) => {
  const skillData = getSkillData(skillName)
  const skillStatusData = getSkillStatusData(skillData)
  const battleLogs = announce ? [`${attacker.name}의 ${skillData.기술명}!`] : []
  const accuracyValue = getAccuracyValue(skillData.명중률)

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

  const scaledPower =
    (((2 * Math.max(1, attacker.level)) / 5 + 2) * (skillData.데미지 ?? 0) * Math.max(1, attackStat)) /
    Math.max(1, defenseStat)
  const baseDamage = Math.floor(scaledPower / 50) + 2
  const randomFactor = 0.85 + Math.random() * 0.15
  const damage = Math.max(1, Math.floor(baseDamage * finalMultiplier * randomFactor))
  const nextHp = Math.max(0, defender.currentHp - damage)
  let nextDefender = {
    ...defender,
    currentHp: nextHp,
  }
  const nextLogs = [...battleLogs, `${defender.name}에게 ${damage} 데미지!`]

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

const resolveEnemyPartyActions = ({ enemies, party, activeAllyIds }) => {
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
          })
          nextParty = replacePartyMember(nextParty, attackResult.nextDefender)
          battleLogs.push(...attackResult.battleLogs)
        })
      } else if (isCombatantAbleToBattle(targetAlly)) {
        const attackResult = resolveAttackAction({
          attacker: nextEnemy,
          defender: targetAlly,
          skillName: enemySkill,
        })
        targetAlly = attackResult.nextDefender
        nextParty = replacePartyMember(nextParty, targetAlly)
        battleLogs.push(...attackResult.battleLogs)
      }
    }

    if (isCombatantAbleToBattle(nextEnemy)) {
      const endStatusResult = resolveTurnEndStatus(nextEnemy)
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

const buildEnemyParty = (stage, encounterPool, encounterCount) => {
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
  const [gameState, setGameState] = useState(null)
  const [selectedBattleCommand, setSelectedBattleCommand] = useState('attack')
  const [battlePanelMode, setBattlePanelMode] = useState('commands')
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0)
  const [selectedEnemyTargetId, setSelectedEnemyTargetId] = useState(null)
  const [combatantInfoTab, setCombatantInfoTab] = useState('stats')
  const [activeCombatantInfoId, setActiveCombatantInfoId] = useState(null)
  const [currentLogs, setCurrentLogs] = useState([])
  const [rewardState, setRewardState] = useState(null)
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
      nextGold += getStageClearGoldReward(gameState.currentStage)
      resolvedLogs.push('전투에서 승리했다!')
      setRewardState(createRewardSelection(gameState.inventory))
      commitBattleState({
        nextPlayer: getFirstLivingPartyMember(resolvedParty, activeAllyIds),
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
    })
    resolvedEnemies = enemyPhaseResult.nextEnemies
    resolvedParty = enemyPhaseResult.nextParty
    resolvedLogs.push(...enemyPhaseResult.battleLogs)
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

  const startNextStage = ({ currentGameState, currentPlayer, nextStageNum, mapName }) => {
    const encounterGroup = getEncounterGroupForStage(nextStageNum)
    const encounterCount = getEncounterCountForStage(nextStageNum)
    const levelCap = getLevelCapForStage(nextStageNum)
    const mapEncounterPool = getMapEncounterGroups(mapName)?.[encounterGroup] ?? []
    const newEnemies = buildEnemyParty(nextStageNum, mapEncounterPool, encounterCount)
    const nextParty = syncPartyMember(currentGameState.party, currentPlayer)
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
    })
    setIsPlayerExpBarVisible(false)
    setCurrentLogs(createBattleLog(getBattlePrompt(nextPlayer.name)))
    setSelectedBattleCommand('attack')
    setSelectedSkillIndex(0)
    setSelectedEnemyTargetId(null)
    setBattlePanelMode('commands')
    setRewardState(null)
    setMapSelectionState(null)
    setCapturePreview(null)
  }

  const handleNextStage = (currentGameState, currentPlayer) => {
    const nextStageNum = currentGameState.currentStage + 1
    if (nextStageNum > TOTAL_STAGE_COUNT) {
      setScreenMode('menu')
      setGameState(null)
      setRewardState(null)
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
    setSelectedBattleCommand('attack')
    setSelectedEnemyTargetId(null)

    const playerSkillData = getSkillData(playerSkill)

    if (isSkillAreaAttack(playerSkillData)) {
      handleExecuteSkill(skillIndex)
      return
    }

    const livingEnemies = gameState.enemies.filter((enemy) => isCombatantAbleToBattle(enemy))

    if (livingEnemies.length === 1) {
      handleExecuteSkill(skillIndex, livingEnemies[0].id)
      return
    }

    setBattlePanelMode('attack-targets')
    setCurrentLogs([])
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
    setSelectedBattleCommand('attack')
    const playerSkillData = getSkillData(playerSkill)
    const isAreaAttack = isSkillAreaAttack(playerSkillData)

    if (isAreaAttack) {
      setSelectedEnemyTargetId(null)
    }

    const targetEnemyIndex = isAreaAttack
      ? getLivingEnemyIndex(gameState.enemies)
      : gameState.enemies.findIndex(
          (enemy) => enemy.id === targetEnemyId && isCombatantAbleToBattle(enemy)
        )

    if (targetEnemyIndex === -1) {
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

    const enemy = gameState.enemies[targetEnemyIndex]
    let logs = []
    let nextPlayer = { ...actingAlly }
    let nextParty = [...battleContext.party]
    let nextEnemies = [...gameState.enemies]
    let nextEnemy = { ...enemy }

    const startStatusResult = resolveTurnStartStatus(nextPlayer)
    nextPlayer = startStatusResult.nextCombatant
    logs.push(...startStatusResult.battleLogs)

    if (
      startStatusResult.canAct &&
      isCombatantAbleToBattle(nextPlayer) &&
      isCombatantAbleToBattle(nextEnemy)
    ) {
      if (isAreaAttack) {
        logs.push(`${nextPlayer.name}의 ${playerSkillData.기술명}!`)
        nextEnemies.forEach((targetEnemy, enemyIndex) => {
          if (!isCombatantAbleToBattle(targetEnemy)) {
            return
          }

          const result = resolveAttackAction({
            attacker: nextPlayer,
            defender: targetEnemy,
            skillName: playerSkill,
            announce: false,
          })
          nextEnemies[enemyIndex] = result.nextDefender
          logs.push(...result.battleLogs)
        })
      } else {
        const result = resolveAttackAction({
          attacker: nextPlayer,
          defender: nextEnemy,
          skillName: playerSkill,
        })
        nextEnemy = result.nextDefender
        logs.push(...result.battleLogs)
      }
    }

    if (isCombatantAbleToBattle(nextPlayer)) {
      const endStatusResult = resolveTurnEndStatus(nextPlayer)
      nextPlayer = endStatusResult.nextCombatant
      logs.push(...endStatusResult.battleLogs)
    }

    if (!isAreaAttack) {
      nextEnemies[targetEnemyIndex] = nextEnemy
    }
    const defeatedEnemies = gameState.enemies.filter(
      (currentEnemy, index) => currentEnemy.currentHp > 0 && nextEnemies[index].currentHp === 0
    )

    if (isCombatantAbleToBattle(nextPlayer) && defeatedEnemies.length > 0) {
      const experienceResult = applyExperienceGain({
        combatant: nextPlayer,
        defeatedEnemies,
        levelCap: gameState.levelCap,
      })
      nextPlayer = experienceResult.nextCombatant
      logs.push(...experienceResult.battleLogs)
    }

    nextParty = replacePartyMember(nextParty, nextPlayer)
    finishBattleAction({
      nextParty,
      nextEnemies,
      logs,
      actedAllyId: nextPlayer.id,
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

    setSelectedBattleCommand(commandKey)

    if (commandKey === 'attack') {
      setBattlePanelMode('attack')
      setSelectedSkillIndex(0)
      setSelectedEnemyTargetId(null)
      return
    }

    if (commandKey === 'item') {
      setBattlePanelMode('items')
      setSelectedEnemyTargetId(null)
      return
    } else if (commandKey === 'swap') {
      setBattlePanelMode('party')
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

  const handlePurchaseFixedRewardItem = (itemId) => {
    if (!gameState || !rewardState || rewardState.isResolving) {
      return
    }

    const rewardItem = fixedRewardItems.find((item) => item.id === itemId)
    if (!rewardItem) {
      return
    }

    if ((gameState.gold ?? 0) < rewardItem.price) {
      return
    }

    const nextGold = (gameState.gold ?? 0) - rewardItem.price
    const effectResult = applyInstantRewardEffect(gameState.player, rewardItem)
    const nextInventory = effectResult.shouldStore
      ? addRewardInventoryItem(gameState.inventory, rewardItem)
      : gameState.inventory

    setGameState({
      ...gameState,
      gold: nextGold,
      player: effectResult.nextPlayer,
      party: syncPartyMember(gameState.party, effectResult.nextPlayer),
      inventory: nextInventory,
    })
  }

  const handleClaimRandomRewardItem = (itemId) => {
    if (!gameState || !rewardState || rewardState.isResolving) {
      return
    }

    const rewardItem = rewardState.randomItems.find((item) => item.id === itemId)
    if (!rewardItem) {
      return
    }

    const effectResult = applyInstantRewardEffect(gameState.player, rewardItem)
    const nextInventory = effectResult.shouldStore
      ? addRewardInventoryItem(gameState.inventory, rewardItem)
      : gameState.inventory
    const nextGameState = {
      ...gameState,
      player: effectResult.nextPlayer,
      party: syncPartyMember(gameState.party, effectResult.nextPlayer),
      inventory: nextInventory,
    }

    setGameState(nextGameState)
    setRewardState((current) =>
      current
        ? {
            ...current,
            selectedRandomItemId: rewardItem.id,
            isResolving: true,
          }
        : current
    )
    window.setTimeout(() => {
      setRewardState(null)
      handleNextStage(nextGameState, nextGameState.player)
    }, 1200)
  }

  const selectedGrowthDigimon = growthStageDigimon[selectedGrowthIndex]
  const handleStartAdventure = () => {
    const startingStage = 1
    const mapName = getMapNameForStage(startingStage)
    const encounterGroup = getEncounterGroupForStage(startingStage)
    const encounterCount = getEncounterCountForStage(startingStage)
    const levelCap = getLevelCapForStage(startingStage)
    const mapEncounterPool = mapData[mapName]?.등장디지몬?.[encounterGroup] ?? []
    const enemies = buildEnemyParty(startingStage, mapEncounterPool, encounterCount)
    const player = createCombatant({
      id: 'player',
      name: selectedGrowthDigimon.name,
      imageUrl: selectedGrowthDigimon.url,
      data: selectedGrowthDigimon.data,
      level: STARTING_PLAYER_LEVEL,
      stageName: '성장기',
    })
    const activeAllyIds = getActiveAllyIdsForParty(
      [player],
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
      party: [player],
      activeAllyIds,
      actingAllyId: player.id,
      actedAllyIds: [],
    })
    setCurrentLogs(createBattleLog(getBattlePrompt(player.name)))
    setSelectedBattleCommand('attack')
    setBattlePanelMode('commands')
    setSelectedSkillIndex(0)
    setSelectedEnemyTargetId(null)
    setRewardState(null)
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
  const mapSelectionOptions = mapSelectionState?.options?.length
    ? mapSelectionState.options
    : getConnectedMapNames(gameState?.currentMap)
  const partySwitchMembers = partyMembers.filter((member) => member.id !== actingAlly?.id)
  const partyListSlots = Array.from(
    { length: Math.max(4, partySwitchMembers.length) },
    (_, index) => partySwitchMembers[index] ?? null
  )
  const currentTargetEnemyIndex = gameState ? getLivingEnemyIndex(gameState.enemies) : -1
  const selectedTargetEnemy =
    gameState?.enemies?.find(
      (enemy) => enemy.id === selectedEnemyTargetId && isCombatantAbleToBattle(enemy)
    ) ?? null
  const visibleEnemies = gameState?.enemies?.filter((enemy) => isCombatantAbleToBattle(enemy)) ?? []
  const currentTargetEnemy =
    selectedTargetEnemy ??
    (currentTargetEnemyIndex >= 0 && gameState ? gameState.enemies[currentTargetEnemyIndex] : null)

  return (
    <main
      className={['main-screen', screenMode === 'adventure' ? 'main-screen--adventure' : '']
        .filter(Boolean)
        .join(' ')}
    >
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
        className={['playfield', screenMode === 'adventure' ? 'playfield--adventure' : '']
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

                <div className="selection-preview__actions">
                  <button
                    type="button"
                    className="selection-start"
                    onClick={handleStartAdventure}
                  >
                    {'\uC2DC\uC791'}
                  </button>
                </div>
              </div>

              <div className="selection-gallery">
                <div className="selection-gallery__header">
                  <p className="selection-label">{'\uC131\uC7A5\uAE30 \uBAA9\uB85D'}</p>
                  <p className="selection-count">
                    {selectedGrowthIndex + 1}/{growthStageDigimon.length}
                  </p>
                </div>

                <div className="selection-grid">
                  {growthStageDigimon.map((digimon, index) => (
                    <button
                      key={digimon.url}
                      type="button"
                      className={[
                        'selection-card',
                        index === selectedGrowthIndex ? 'selection-card--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setSelectedGrowthIndex(index)}
                      aria-pressed={index === selectedGrowthIndex}
                    >
                      <img
                        className="selection-card__image"
                        src={createDigimonArtworkUrl('성장기', digimon.name)}
                        alt={digimon.name}
                        onError={hideBrokenArtwork}
                      />
                      <span className="selection-card__name">{digimon.name}</span>
                    </button>
                  ))}
                </div>
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
                  <div className="adventure-card">
                    <p className="adventure-card__label">{'\uD604\uC7AC \uB9F5'}</p>
                    <h2 className="adventure-card__value">{gameState?.currentMap}</h2>
                  </div>
                  <div className="adventure-card adventure-card--compact">
                    <p className="adventure-card__line">
                      <span className="adventure-card__label">STAGE</span>
                      <span className="adventure-card__meta">
                        {gameState?.currentStage} / {gameState?.maxStage}
                      </span>
                    </p>
                    <p className="adventure-card__line adventure-card__line--gold">
                      <span className="adventure-card__submeta">GOLD</span>
                      <span className="adventure-card__gold">{formatGold(gameState?.gold ?? 0)}</span>
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
                            className="digimon-status digimon-status--enemy"
                            role="group"
                            aria-label={`${enemy.name} 체력`}
                          >
                            <img
                              className="digimon-status__portrait"
                              src={createDigimonArtworkUrl(enemy.speciesStage, enemy.name)}
                              alt=""
                              onError={hideBrokenArtwork}
                            />
                            <p className="digimon-status__name">
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

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={[
                              'reward-item',
                              'reward-item--fixed',
                              canAfford ? '' : 'reward-item--disabled',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={!canAfford || rewardState.isResolving}
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
                          disabled={rewardState.isResolving}
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
                        const isFainted = member ? member.currentHp <= 0 : false
                        const isActiveInBattle = member ? activeAllyIds.includes(member.id) : false
                        const isDisabled = isFainted || isActiveInBattle

                        return member ? (
                          <button
                            key={member.id}
                            type="button"
                            className={[
                              'party-member',
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
                    <div className="battle-skill-grid">
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
                              index === selectedSkillIndex && skill
                                ? 'battle-skill--active'
                                : '',
                              isAdvantageous ? 'battle-skill--advantage' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={!skill}
                            onClick={() => {
                              if (skill) {
                                handleSkillSelect(index)
                              }
                            }}
                          >
                            <span className="battle-skill__marker" aria-hidden="true">
                              {index === selectedSkillIndex && skill ? '\u25B6' : ''}
                            </span>
                            <span className="battle-skill__label">{skill ?? ''}</span>
                            {isAreaAttack ? <span className="battle-skill__badge">전체</span> : null}
                          </button>
                        )
                      })}
                    </div>
                  ) : isAttackTargetPanelOpen && !rewardState ? (
                    <div className="battle-target-panel">
                      <div className="battle-target-list">
                        {visibleEnemies.map((enemy) => {
                          return (
                            <button
                              key={enemy.id}
                              type="button"
                              className="battle-target"
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
            </section>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
