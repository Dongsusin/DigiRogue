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

const fixedRewardItems = [
  { id: 'heal-20', name: '20회복', description: 'HP 20 회복 아이템', price: 120, healAmount: 20 },
  { id: 'heal-50', name: '50회복', description: 'HP 50 회복 아이템', price: 280, healAmount: 50 },
  { id: 'revive', name: '부활', description: '전투 불능 시 부활', price: 700 },
]

const randomRewardItemPool = [
  { id: 'buff-attack', name: '공격력 증가', description: '10턴 동안 공격 10% 증가', buffStatKey: 'attack' },
  { id: 'buff-defense', name: '방어력 증가', description: '10턴 동안 방어 10% 증가', buffStatKey: 'defense' },
  {
    id: 'buff-special-attack',
    name: '특수공격 증가',
    description: '10턴 동안 특수공격 10% 증가',
    buffStatKey: 'specialAttack',
  },
  {
    id: 'buff-special-defense',
    name: '특수방어 증가',
    description: '10턴 동안 특수방어 10% 증가',
    buffStatKey: 'specialDefense',
  },
  { id: 'buff-speed', name: '스피드 증가', description: '10턴 동안 스피드 10% 증가', buffStatKey: 'speed' },
  { id: 'heal-20', name: '20회복', description: 'HP 20 회복 아이템', healAmount: 20 },
  { id: 'heal-50', name: '50회복', description: 'HP 50 회복 아이템', healAmount: 50 },
]

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

const BATTLE_LOG_LIMIT = 4
const STARTING_PLAYER_LEVEL = 5
const BUFF_STAGE_DURATION = 10
const IV_MAX = 31
const EV_PER_STAT_MAX = 252
const EV_TOTAL_MAX = 510
const STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
const BUFFABLE_STAT_KEYS = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
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
const createRewardSelection = () => ({
  randomItems: shuffleItems(randomRewardItemPool).slice(0, 3),
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

const shuffleItems = (items) => {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]]
  }

  return nextItems
}

const getEncounterGroupForStage = (stage) => {
  if (stage <= 20) {
    return '1'
  }

  if (stage <= 50) {
    return '2'
  }

  if (stage <= 90) {
    return '3'
  }

  if (stage <= 130) {
    return '4'
  }

  if (stage <= 170) {
    return '5'
  }

  return '6'
}

const getEncounterCountForStage = (stage) => {
  if (stage <= 40) {
    return 1
  }

  if (stage <= 120) {
    return 2
  }

  return 3
}

const createBattleLog = (...lines) => lines.filter(Boolean).slice(-BATTLE_LOG_LIMIT)

const getSkillData = (skillName) =>
  allSkillLookup.get(skillName) ?? {
    기술명: skillName,
    데미지: 40,
    명중률: '100%',
    분류: '물리형',
    속성: '무',
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

const getExperienceRatio = (combatant) => {
  if (!combatant?.experienceToNext) {
    return 0
  }

  return Math.max(0, Math.min(100, (combatant.experience / combatant.experienceToNext) * 100))
}

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
  stageName,
}) => {
  const baseStats = createBaseStats(data)
  const resolvedIvs = normalizeStatBlock(ivs, createRandomIvs(), IV_MAX)
  const resolvedEvs = normalizeStatBlock(evs, createFlatStatBlock(0), EV_PER_STAT_MAX)
  const resolvedActiveBuffs = normalizeBuffState(activeBuffs)
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
  const summaryText = changedStats
    .map((statKey) => `${STAT_LABEL_MAP[statKey]} +${gainedStats[statKey]}`)
    .join(', ')

  return {
    nextCombatant,
    battleLogs: [`${combatant.name}의 노력치가 올랐다! (${summaryText})`],
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

const resolveAttackAction = ({ attacker, defender, skillName }) => {
  const skillData = getSkillData(skillName)
  const battleLogs = [`${attacker.name}의 ${skillData.기술명}!`]
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
  const nextDefender = {
    ...defender,
    currentHp: nextHp,
  }
  const nextLogs = [...battleLogs, `${defender.name}에게 ${damage} 데미지!`]

  if (finalMultiplier > 1) {
    nextLogs.push('효과가 굉장했다!')
  } else if (finalMultiplier > 0 && finalMultiplier < 1) {
    nextLogs.push('효과가 별로인 듯하다...')
  }

  if (nextHp === 0) {
    nextLogs.push(`${defender.name}은(는) 쓰러졌다!`)
  }

  return {
    nextDefender,
    battleLogs: nextLogs,
  }
}

const buildEnemyParty = (stage, encounterPool, encounterCount) => {
  const shuffledNames = shuffleItems(encounterPool)

  return shuffledNames.slice(0, encounterCount).map((name, index) => {
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
  const [currentLogs, setCurrentLogs] = useState([])
  const [rewardState, setRewardState] = useState(null)
  const [displayedPlayerExpRatio, setDisplayedPlayerExpRatio] = useState(0)
  const [isPlayerExpTransitionInstant, setIsPlayerExpTransitionInstant] = useState(false)
  const expAnimationTimeoutsRef = useRef([])
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

  const handleNextStage = (currentGameState, currentPlayer) => {
    const nextStageNum = currentGameState.currentStage + 1
    if (nextStageNum > TOTAL_STAGE_COUNT) {
      setScreenMode('menu')
      setGameState(null)
      setRewardState(null)
      setCurrentLogs([])
      return
    }

    const mapName = getMapNameForStage(nextStageNum)
    const encounterGroup = getEncounterGroupForStage(nextStageNum)
    const encounterCount = getEncounterCountForStage(nextStageNum)
    const levelCap = getLevelCapForStage(nextStageNum)
    const mapEncounterPool = mapData[mapName]?.['\uB4F1\uC7A5\uB514\uC9C0\uBAAC']?.[encounterGroup] ?? []
    const newEnemies = buildEnemyParty(nextStageNum, mapEncounterPool, encounterCount)

    setGameState({
      ...currentGameState,
      currentStage: nextStageNum,
      currentMap: mapName,
      encounterGroup,
      encounterCount,
      encounterPool: mapEncounterPool,
      levelCap,
      enemies: newEnemies,
      player: currentPlayer,
    })
    setCurrentLogs(createBattleLog(getBattlePrompt(currentPlayer.name)))
    setSelectedBattleCommand('attack')
    setSelectedSkillIndex(0)
    setBattlePanelMode('commands')
    setRewardState(null)
  }

  const handleExecuteSkill = (skillIndex) => {
    if (rewardState || !gameState || battlePanelMode !== 'attack' || gameState.player.currentHp <= 0) return

    const playerSkill = battleSkillSlots[skillIndex]
    if (!playerSkill) return

    setSelectedSkillIndex(skillIndex)
    setSelectedBattleCommand('attack')

    const targetEnemyIndex = getLivingEnemyIndex(gameState.enemies)
    if (targetEnemyIndex === -1) return

    const enemy = gameState.enemies[targetEnemyIndex]
    const enemySkill = getRandomEnemySkill(enemy)

    let logs = []
    let nextPlayer = { ...gameState.player }
    let nextEnemies = [...gameState.enemies]
    let nextEnemy = { ...enemy }

    const playerAttacks = () => {
      const result = resolveAttackAction({
        attacker: nextPlayer,
        defender: nextEnemy,
        skillName: playerSkill,
      })
      nextEnemy = result.nextDefender
      logs.push(...result.battleLogs)
    }

    const enemyAttacks = () => {
      if (!enemySkill) return
      const result = resolveAttackAction({
        attacker: nextEnemy,
        defender: nextPlayer,
        skillName: enemySkill,
      })
      nextPlayer = result.nextDefender
      logs.push(...result.battleLogs)
    }

    if (nextPlayer.speed >= nextEnemy.speed) {
      playerAttacks()
      if (nextEnemy.currentHp > 0) {
        enemyAttacks()
      }
    } else {
      enemyAttacks()
      if (nextPlayer.currentHp > 0) {
        playerAttacks()
      }
    }

    nextEnemies[targetEnemyIndex] = nextEnemy
    const defeatedEnemies = gameState.enemies.filter(
      (currentEnemy, index) => currentEnemy.currentHp > 0 && nextEnemies[index].currentHp === 0
    )

    if (nextPlayer.currentHp > 0 && defeatedEnemies.length > 0) {
      const experienceResult = applyExperienceGain({
        combatant: nextPlayer,
        defeatedEnemies,
        levelCap: gameState.levelCap,
      })
      nextPlayer = experienceResult.nextCombatant
      logs.push(...experienceResult.battleLogs)
    }

    const allEnemiesDefeated = nextEnemies.every((e) => e.currentHp === 0)
    const isPlayerDefeated = nextPlayer.currentHp === 0

    if (allEnemiesDefeated && !isPlayerDefeated) {
      nextPlayer = tickCombatantBuffsByStage(nextPlayer)
    }

    const stageClearGold = allEnemiesDefeated ? getStageClearGoldReward(gameState.currentStage) : 0
    const nextGold = (gameState.gold ?? 0) + stageClearGold
    const nextGameState = {
      ...gameState,
      player: nextPlayer,
      enemies: nextEnemies,
      gold: nextGold,
    }

    if (isPlayerDefeated) {
      logs.push('\uB208\uC55E\uC774 \uAE5C\uAE5C\uD574\uC84C\uB2E4...')
      setTimeout(() => {
        setScreenMode('menu')
        setGameState(null)
        setRewardState(null)
        setCurrentLogs([])
      }, 3000)
    } else if (allEnemiesDefeated) {
      logs.push('\uC804\uD22C\uC5D0\uC11C \uC2B9\uB9AC\uD588\uB2E4!')
      setRewardState(createRewardSelection())
    } else {
      logs.push(getBattlePrompt(nextPlayer.name))
    }

    setGameState(nextGameState)
    setCurrentLogs(createBattleLog(...logs))

    if (!isPlayerDefeated && !allEnemiesDefeated) {
      setBattlePanelMode('commands')
    } else {
      setBattlePanelMode('logs') // Prevent further actions while waiting for timeout
    }
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
    if (!gameState?.player) {
      clearExpAnimationQueue()
      previousPlayerProgressRef.current = null
      setIsPlayerExpTransitionInstant(true)
      setDisplayedPlayerExpRatio(0)
      return undefined
    }

    const currentSnapshot = {
      id: gameState.player.id,
      level: gameState.player.level,
      ratio: getExperienceRatio(gameState.player),
    }
    const previousSnapshot = previousPlayerProgressRef.current

    clearExpAnimationQueue()

    if (!previousSnapshot || previousSnapshot.id !== currentSnapshot.id) {
      setIsPlayerExpTransitionInstant(true)
      setDisplayedPlayerExpRatio(currentSnapshot.ratio)

      const timeoutId = window.setTimeout(() => {
        setIsPlayerExpTransitionInstant(false)
      }, 30)
      expAnimationTimeoutsRef.current.push(timeoutId)
      previousPlayerProgressRef.current = currentSnapshot
      return undefined
    }

    const levelGainCount = Math.max(0, currentSnapshot.level - previousSnapshot.level)

    if (levelGainCount === 0) {
      setIsPlayerExpTransitionInstant(false)
      setDisplayedPlayerExpRatio(previousSnapshot.ratio)

      const timeoutId = window.setTimeout(() => {
        setDisplayedPlayerExpRatio(currentSnapshot.ratio)
      }, 30)
      expAnimationTimeoutsRef.current.push(timeoutId)
      previousPlayerProgressRef.current = currentSnapshot
      return undefined
    }

    setIsPlayerExpTransitionInstant(false)
    setDisplayedPlayerExpRatio(previousSnapshot.ratio)

    let elapsed = 30

    for (let index = 0; index < levelGainCount; index += 1) {
      const fillTimeoutId = window.setTimeout(() => {
        setIsPlayerExpTransitionInstant(false)
        setDisplayedPlayerExpRatio(100)
      }, elapsed)
      expAnimationTimeoutsRef.current.push(fillTimeoutId)
      elapsed += EXP_BAR_ANIMATION_MS

      const resetTimeoutId = window.setTimeout(() => {
        setIsPlayerExpTransitionInstant(true)
        setDisplayedPlayerExpRatio(0)
      }, elapsed)
      expAnimationTimeoutsRef.current.push(resetTimeoutId)
      elapsed += EXP_BAR_RESET_MS
    }

    const finalTimeoutId = window.setTimeout(() => {
      setIsPlayerExpTransitionInstant(false)
      setDisplayedPlayerExpRatio(currentSnapshot.ratio)
    }, elapsed)
    expAnimationTimeoutsRef.current.push(finalTimeoutId)
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
    },
    []
  )

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
      setRewardState(null)
      setScreenMode('new-game')
    }
  }

  const handleBattleCommandSelect = (commandKey) => {
    if (rewardState || !gameState || battlePanelMode === 'logs') {
      return
    }

    setSelectedBattleCommand(commandKey)

    if (commandKey === 'attack') {
      setBattlePanelMode('attack')
      setSelectedSkillIndex(0)
      return
    }

    if (commandKey === 'item') {
      setCurrentLogs(createBattleLog('아이템창은 추후 전용 아이템으로 구현될 예정이다.', getBattlePrompt(gameState.player.name)))
    } else if (commandKey === 'swap') {
      setCurrentLogs(createBattleLog('교체 기능은 다음 단계에서 구현될 예정이다.', getBattlePrompt(gameState.player.name)))
    } else if (commandKey === 'run') {
      setCurrentLogs(createBattleLog('지금은 도망칠 수 없다!', getBattlePrompt(gameState.player.name)))
    }

    setBattlePanelMode('commands')
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
      ? addInventoryItem(gameState.inventory, rewardItem.id)
      : gameState.inventory

    setGameState({
      ...gameState,
      gold: nextGold,
      player: effectResult.nextPlayer,
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
      ? addInventoryItem(gameState.inventory, rewardItem.id)
      : gameState.inventory
    const nextGameState = {
      ...gameState,
      player: effectResult.nextPlayer,
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
    })
    setCurrentLogs(createBattleLog(getBattlePrompt(player.name)))
    setSelectedBattleCommand('attack')
    setBattlePanelMode('commands')
    setSelectedSkillIndex(0)
    setRewardState(null)
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
  const playerHpRatio = gameState
    ? Math.max(0, Math.min(100, (gameState.player.currentHp / gameState.player.maxHp) * 100))
    : 0
  const playerSkills = gameState?.player.skills ?? []
  const battleSkillSlots = Array.from({ length: 4 }, (_, index) => playerSkills[index] ?? null)
  const isAttackPanelOpen = battlePanelMode === 'attack'
  const currentTargetEnemyIndex = gameState ? getLivingEnemyIndex(gameState.enemies) : -1
  const currentTargetEnemy =
    currentTargetEnemyIndex >= 0 && gameState ? gameState.enemies[currentTargetEnemyIndex] : null

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
                        src={digimon.url}
                        alt={digimon.name}
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
                  <div className="adventure-player adventure-player--ally">
                    <p className="adventure-player__name">
                      {gameState?.player.name} · Lv.{gameState?.player.level}
                    </p>
                    <div className="adventure-player__sprite-wrap adventure-player__sprite-wrap--ally">
                      <img
                        className="adventure-player__sprite adventure-player__sprite--ally"
                        src={gameState?.player.imageUrl}
                        alt={gameState?.player.name}
                      />
                    </div>

                    <div className="adventure-hp" role="img" aria-label="HP bar">
                      <div className="adventure-hp__track">
                        <span
                          className="adventure-hp__fill"
                          style={{ width: `${playerHpRatio}%` }}
                        />
                        <p className="adventure-hp__text">
                          {gameState?.player.currentHp} / {gameState?.player.maxHp}
                        </p>
                      </div>
                    </div>

                    <div className="adventure-exp" role="img" aria-label="experience bar">
                      <div className="adventure-exp__track">
                        <span
                          className={[
                            'adventure-exp__fill',
                            isPlayerExpTransitionInstant ? 'adventure-exp__fill--instant' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          style={{ width: `${displayedPlayerExpRatio}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="adventure-enemies" aria-label={'\uC801 \uB514\uC9C0\uBAAC'}>
                    {gameState?.enemies?.map((enemy, index) => {
                      const enemyHpRatio = Math.max(
                        0,
                        Math.min(100, (enemy.currentHp / enemy.maxHp) * 100)
                      )

                      return (
                        <div
                          key={enemy.id}
                          className={`adventure-enemy adventure-enemy--${gameState.enemies.length} adventure-enemy--slot-${index + 1}`}
                        >
                          <p className="adventure-player__name">
                            {enemy.name} · Lv.{enemy.level}
                          </p>
                          <div className="adventure-player__sprite-wrap adventure-player__sprite-wrap--enemy">
                            <img
                              className="adventure-player__sprite adventure-player__sprite--enemy"
                              src={enemy.imageUrl}
                              alt={enemy.name}
                            />
                          </div>

                          <div className="adventure-hp" role="img" aria-label="HP bar">
                            <div className="adventure-hp__track">
                              <span
                                className="adventure-hp__fill adventure-hp__fill--enemy"
                                style={{ width: `${enemyHpRatio}%` }}
                              />
                              <p className="adventure-hp__text">
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
                          >
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
                        >
                          <strong className="reward-item__name">{item.name}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="battle-console" aria-label={'\uBC30\uD2C0 UI'}>
                <section
                  className={[
                    'battle-console__message',
                    isAttackPanelOpen && !rewardState ? 'battle-console__message--skills' : '',
                    !isAttackPanelOpen && currentLogs.length > 0 ? 'battle-console__message--logs' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={
                    isAttackPanelOpen && !rewardState
                      ? '\uAE30\uC220 \uBAA9\uB85D'
                      : '\uBC30\uD2C0 \uBA54\uC2DC\uC9C0'
                  }
                >
                  {isAttackPanelOpen && !rewardState ? (
                    <div className="battle-skill-grid">
                      {battleSkillSlots.map((skill, index) => {
                        const skillData = skill ? getSkillData(skill) : null
                        const skillMatchup =
                          skill && currentTargetEnemy && gameState
                            ? getMatchupResult({
                                attackerType: gameState.player.type,
                                skillAttribute: skillData?.속성,
                                defenderType: currentTargetEnemy.type,
                                defenderAttribute: currentTargetEnemy.attribute,
                              })
                            : null
                        const isAdvantageous = (skillMatchup?.multiplier ?? 1) > 1

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
                                handleExecuteSkill(index)
                              }
                            }}
                          >
                            <span className="battle-skill__marker" aria-hidden="true">
                              {index === selectedSkillIndex && skill ? '\u25B6' : ''}
                            </span>
                            <span className="battle-skill__label">{skill ?? ''}</span>
                          </button>
                        )
                      })}
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
                      {gameState?.player.name}
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
                      disabled={battlePanelMode === 'logs' || Boolean(rewardState)}
                      onClick={() => handleBattleCommandSelect(item.key)}
                    >
                      <span className="battle-command__marker" aria-hidden="true">
                        {item.key === selectedBattleCommand ? '\u25B6' : ''}
                      </span>
                      <span className="battle-command__label">{item.label}</span>
                    </button>
                  ))}
                </section>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
