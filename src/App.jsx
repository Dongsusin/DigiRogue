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

const growthStageDigimonUrls = [
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EA%B0%80%EC%98%A4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EA%B0%80%EC%A7%80%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EA%B3%A0%EB%B6%80%EB%A6%AC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EA%B8%B8%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%8F%84%EB%A3%A8%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%93%9C%EB%9D%BC%EC%BD%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%93%9C%EB%9D%BC%ED%81%90%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%9D%BC%EB%9D%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%A0%88%EB%82%98%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%A1%9C%ED%94%84%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%A3%A8%EC%B2%B4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%A5%98%EC%9A%B0%EB%8B%A4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%AA%A8%EB%85%B8%EB%93%9C%EB%9D%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%B2%A0%ED%83%80%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%B3%B4%EB%B3%B4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%B8%8C%EC%9D%B4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%B8%94%EB%A3%A8%EC%BD%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%82%AC%EC%9D%B4%EC%BC%80%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%83%A4%EC%BD%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%89%AC%EB%9D%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%8A%A4%EC%9C%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%95%84%EA%B5%AC%EB%AA%AC(%ED%9D%91).png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%95%84%EA%B5%AC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%95%84%EA%B8%B0%EB%B2%8C%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%95%84%EB%A5%B4%EB%A7%88%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%97%90%EB%A0%89%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%98%AC%EC%B1%99%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%98%B7%EC%BD%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%9A%B8%ED%89%81%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%9E%84%ED%94%84%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%B6%94%EC%B6%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%B8%84%EC%B9%B4%EC%9D%B4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%B9%B4%EB%A9%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%BC%80%EB%9D%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%BD%94%ED%85%8C%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%BF%A0%EB%84%A4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%BF%A0%EB%8B%A4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%81%AC%EB%9E%A9%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%85%8C%EB%A6%AC%EC%96%B4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%85%90%ED%83%80%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%86%A0%EC%9D%B4%EC%95%84%EA%B5%AC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%86%B1%EB%8B%88%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%85%EC%BB%A4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%8C%EB%8B%A5%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%8C%ED%94%BC%EB%AA%AC(%ED%9D%91).png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%8C%ED%94%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%94%EC%BD%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8E%AD%EA%B7%84%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8F%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%94%8C%EB%A1%9C%EB%9D%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%94%8C%EB%A1%AF%ED%8A%B8%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%94%BC%EC%9A%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%94%BC%EC%BD%94%EB%8D%B0%EB%B8%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%97%89%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%98%B8%ED%81%AC%EB%AA%AC.png',
]

const growthStageDigimon = growthStageDigimonUrls.map((url) => {
  const fileName = decodeURIComponent(url.split('/').pop() ?? '')
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
const EXP_BAR_ANIMATION_MS = 520
const EXP_BAR_RESET_MS = 70
const CLASSIC_LEVEL_CAPS = [
  10, 16, 24, 32, 38, 48, 56, 64, 74, 84, 94, 104, 114, 126, 138, 150, 162, 174, 188, 200,
]
const getBattlePrompt = (name) => `${name}은 무엇을 할까?`

const mapBackgrounds = [
  '/%EB%A7%B5/%EA%B0%80%EB%94%94%EC%96%B8%20%ED%8C%B0%EB%A6%AC%EC%8A%A4.png',
  '/%EB%A7%B5/%EA%B2%90%EC%8B%9C%20%EB%8C%80%EB%A5%99.png',
  '/%EB%A7%B5/%EA%B8%B0%EC%96%B4%20%ED%8F%AC%EB%A0%88%EC%8A%A4%ED%8A%B8.png',
  '/%EB%A7%B5/%EA%B8%B0%EC%96%B4%EC%82%AC%EB%B0%94%EB%82%98.png',
  '/%EB%A7%B5/%EB%82%98%EC%9D%B4%ED%8A%B8%EB%A9%94%EC%96%B4%20%EC%86%94%EC%A0%80%EC%8A%A4.png',
  '/%EB%A7%B5/%EB%84%A4%ED%8A%B8%EC%9D%98%20%EB%B0%94%EB%8B%A4.png',
  '/%EB%A7%B5/%EB%8B%A4%ED%81%AC%20%EC%97%90%EB%A6%AC%EC%96%B4.png',
  '/%EB%A7%B5/%EB%8B%A4%ED%81%AC%20%EC%9B%B9.png',
  '/%EB%A7%B5/%EB%8B%A4%ED%81%AC%20%ED%95%84%EB%93%9C.png',
  '/%EB%A7%B5/%EB%A9%94%ED%83%88%20%EC%97%A0%ED%8C%8C%EC%9D%B4%EC%96%B4.png',
  '/%EB%A7%B5/%EB%AC%B4%ED%95%9C%EC%82%B0.png',
  '/%EB%A7%B5/%EB%AF%B8%ED%95%98%EB%9D%BC%EC%8B%9C%20%EC%82%B0.png',
  '/%EB%A7%B5/%EB%B6%80%ED%8A%B8%20%ED%99%94%EC%82%B0.png',
  '/%EB%A7%B5/%EB%B9%84%ED%8B%80%EB%9E%9C%EB%93%9C.png',
  '/%EB%A7%B5/%EC%82%AC%EA%B7%9C%EC%82%B0.png',
  '/%EB%A7%B5/%EC%84%A0%EA%B3%B5%EA%B3%84.png',
  '/%EB%A7%B5/%EC%84%BC%ED%8A%B8%EB%9F%B4%20%ED%83%80%EC%9A%B4.png',
  '/%EB%A7%B5/%EC%8B%9C%EC%9E%91%EC%9D%98%EB%A7%88%EC%9D%84.png',
  '/%EB%A7%B5/%EC%93%B0%EB%A0%88%EA%B8%B0%EC%9D%98%20%EC%82%B0.png',
  '/%EB%A7%B5/%EC%95%84%EC%8B%9C%EB%85%B8%20%EC%84%AC.png',
  '/%EB%A7%B5/%EC%95%84%EC%9D%B4%EC%8A%A4%20%EC%83%9D%EC%B8%84%EC%96%B4%EB%A6%AC.png',
  '/%EB%A7%B5/%EC%96%B4%EB%B9%84%EC%8A%A4%20%EC%97%90%EB%A6%AC%EC%96%B4.png',
  '/%EB%A7%B5/%EC%96%B4%EC%85%88%EB%B8%94%EB%9F%AC%20%ED%83%80%EC%9B%8C.png',
  '/%EB%A7%B5/%EC%98%A4%EB%B2%84%EB%8D%B8%20%EB%AC%98%EC%A7%80.png',
  '/%EB%A7%B5/%EC%9A%A9%EC%9D%98%EB%88%88%ED%98%B8%EC%88%98.png',
  '/%EB%A7%B5/%EC%9A%A9%EC%A0%95%EA%B6%81.png',
  '/%EB%A7%B5/%EC%9C%88%EB%93%9C%20%EA%B0%80%EB%94%94%EC%96%B8%EC%A6%88.png',
  '/%EB%A7%B5/%EC%9D%B4%EB%B8%94%20%ED%8F%AC%EB%A0%88%EC%8A%A4%ED%8A%B8.png',
  '/%EB%A7%B5/%EC%A7%80%ED%95%98%20%ED%95%98%EC%88%98%EB%8F%84.png',
  '/%EB%A7%B5/%EC%BD%94%EB%8D%B1%20%EC%9C%A0%EC%A0%81.png',
  '/%EB%A7%B5/%EC%BD%94%EC%A6%88%EB%AF%B9%20%EC%97%90%EB%A6%AC%EC%96%B4.png',
  '/%EB%A7%B5/%EC%BD%94%ED%80%B4%ED%86%A0%EC%8A%A4.png',
  '/%EB%A7%B5/%ED%8C%A9%ED%86%A0%EB%A6%AC%EC%96%BC%20%EC%97%90%EB%A6%AC%EC%96%B4.png',
  '/%EB%A7%B5/%ED%99%A9%EA%B8%88%ED%96%A5.png',
  '/%EB%A7%B5/%ED%99%A9%EC%B2%9C.png',
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
  const fileName = decodeURIComponent(url.split('/').pop() ?? '')
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

const getBaseStatTotal = (data) =>
  (data?.체력 ?? 0) +
  (data?.공격 ?? 0) +
  (data?.특공 ?? 0) +
  (data?.방어 ?? 0) +
  (data?.특방 ?? 0) +
  (data?.스피드 ?? 0)

const getScaledStat = (stat, level, perLevelRate) =>
  Math.max(1, Math.floor((stat ?? 50) * (1 + Math.max(0, level - STARTING_PLAYER_LEVEL) * perLevelRate)))

const calculateBattleStats = (data, level) => ({
  maxHp: Math.max(10, getScaledStat(data?.체력 ?? 50, level, 0.018)),
  attack: getScaledStat(data?.공격 ?? 50, level, 0.015),
  specialAttack: getScaledStat(data?.특공 ?? 50, level, 0.015),
  defense: getScaledStat(data?.방어 ?? 50, level, 0.015),
  specialDefense: getScaledStat(data?.특방 ?? 50, level, 0.015),
  speed: getScaledStat(data?.스피드 ?? 50, level, 0.014),
})

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

const createCombatant = ({ id, name, imageUrl, data, level = STARTING_PLAYER_LEVEL, currentHp, experience = 0 }) => {
  const battleStats = calculateBattleStats(data, level)

  return {
    id,
    name,
    imageUrl: imageUrl ?? '',
    speciesData: data,
    level,
    experience,
    experienceToNext: getExperienceToNextLevel(level),
    currentHp: currentHp ?? battleStats.maxHp,
    maxHp: battleStats.maxHp,
    baseStatTotal: getBaseStatTotal(data),
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

const levelUpCombatant = (combatant, nextLevel) => {
  const previousMaxHp = combatant.maxHp
  const nextCombatant = createCombatant({
    id: combatant.id,
    name: combatant.name,
    imageUrl: combatant.imageUrl,
    data: combatant.speciesData,
    level: nextLevel,
    experience: combatant.experience,
  })

  return {
    ...nextCombatant,
    currentHp: Math.min(nextCombatant.maxHp, combatant.currentHp + (nextCombatant.maxHp - previousMaxHp)),
  }
}

const applyExperienceGain = ({ combatant, defeatedEnemies, levelCap }) => {
  if (!defeatedEnemies.length) {
    return {
      nextCombatant: combatant,
      battleLogs: [],
    }
  }

  let nextCombatant = { ...combatant }
  const battleLogs = []

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
  }

  const handleExecuteSkill = (skillIndex) => {
    if (!gameState || battlePanelMode !== 'attack' || gameState.player.currentHp <= 0) return

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

    if (isPlayerDefeated) {
      logs.push('\uB208\uC55E\uC774 \uAE5C\uAE5C\uD574\uC84C\uB2E4...')
      setTimeout(() => {
        setScreenMode('menu')
        setGameState(null)
        setCurrentLogs([])
      }, 3000)
    } else if (allEnemiesDefeated) {
      logs.push('\uC804\uD22C\uC5D0\uC11C \uC2B9\uB9AC\uD588\uB2E4!')
      setTimeout(() => {
        handleNextStage(gameState, nextPlayer)
      }, 3000)
    } else {
      logs.push(getBattlePrompt(nextPlayer.name))
    }

    setGameState({
      ...gameState,
      player: nextPlayer,
      enemies: nextEnemies,
    })
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
      setScreenMode('new-game')
    }
  }

  const handleBattleCommandSelect = (commandKey) => {
    if (!gameState || battlePanelMode === 'logs') {
      return
    }

    setSelectedBattleCommand(commandKey)

    if (commandKey === 'attack') {
      setBattlePanelMode('attack')
      setSelectedSkillIndex(0)
      return
    }

    if (commandKey === 'item') {
      setCurrentLogs(createBattleLog('아이템은 아직 준비 중이다.', getBattlePrompt(gameState.player.name)))
    } else if (commandKey === 'swap') {
      setCurrentLogs(createBattleLog('교체 기능은 다음 단계에서 구현될 예정이다.', getBattlePrompt(gameState.player.name)))
    } else if (commandKey === 'run') {
      setCurrentLogs(createBattleLog('지금은 도망칠 수 없다!', getBattlePrompt(gameState.player.name)))
    }

    setBattlePanelMode('commands')
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
    })

    setGameState({
      currentStage: startingStage,
      maxStage: TOTAL_STAGE_COUNT,
      currentMap: mapName,
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
                    <p className="adventure-card__label">STAGE</p>
                    <p className="adventure-card__meta">
                      {gameState?.currentStage} / {gameState?.maxStage}
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
              </div>

              <div className="battle-console" aria-label={'\uBC30\uD2C0 UI'}>
                <section
                  className={[
                    'battle-console__message',
                    isAttackPanelOpen ? 'battle-console__message--skills' : '',
                    !isAttackPanelOpen && currentLogs.length > 0 ? 'battle-console__message--logs' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={
                    isAttackPanelOpen
                      ? '\uAE30\uC220 \uBAA9\uB85D'
                      : '\uBC30\uD2C0 \uBA54\uC2DC\uC9C0'
                  }
                >
                  {isAttackPanelOpen ? (
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
                      disabled={battlePanelMode === 'logs'}
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
