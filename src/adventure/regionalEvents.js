import { addAnalysis, canScanSpecies, describeAnalysisGains, getAnalysisProgress, removeCaptureItems } from '../battle/digimonAnalysis.js'
import { MAP_EVENT_STORIES } from './mapEventStories.js'

// Explicit coverage prevents a forest/factory story from appearing in an unrelated map.
export const MAP_EVENT_THEMES = {
  '시작의마을': 'town', '센트럴 타운': 'town',
  '기어 포레스트': 'forest', '이블 포레스트': 'forest', '비틀랜드': 'forest', '기어사바나': 'forest', '겐시 대륙': 'forest',
  '메탈 엠파이어': 'factory', '팩토리얼 에리어': 'factory', '어셈블러 타워': 'factory', '쓰레기의 산': 'factory', '지하 하수도': 'factory',
  '코덱 유적': 'ruins', '용정궁': 'ruins', '가디언 팰리스': 'ruins', '사규산': 'ruins',
  '네트의 바다': 'water', '용의눈호수': 'water', '아시노 섬': 'water', '어비스 에리어': 'water',
  '부트 화산': 'volcano', '무한산': 'volcano',
  '아이스 생츄어리': 'ice', '코퀴토스': 'ice',
  '다크 에리어': 'dark', '다크 웹': 'dark', '다크 필드': 'dark', '나이트메어 솔저스': 'dark', '오버델 묘지': 'dark', '황천': 'dark',
  '미하라시 산': 'sky', '선공계': 'sky', '윈드 가디언즈': 'sky', '코즈믹 에리어': 'sky',
}

const statNames = { attack: '공격', specialAttack: '특공', defense: '방어', specialDefense: '특방', speed: '스피드' }
const heal = (id, title, percent, story) => ({ id, title, story, tag: '회복', icon: '＋', heal: percent, cure: true })
const train = (id, title, stats, stages = 3) => ({ id, title, tag: '훈련', icon: '↑', stats, stages, goldCost: 1 })
const scan = (id, title, amount, cost = {}) => ({ id, title, tag: '분석', icon: '◎', analysis: amount, ...cost })

export const REGIONAL_EVENTS = {
  town: { title: '마을의 통신 정비소', story: '주민들이 다음 여정을 준비하고 있습니다. 부족한 보급품을 채우거나 동료들과 훈련할 수 있습니다.', choices: [
    heal('rest', '정비소에서 쉬기', .4), train('train', '파트너 합동 훈련', ['attack', 'specialAttack']),
    scan('records', '주민들과 관측 기록 공유', 20),
    { id: 'delivery', title: '보급품 운반 돕기', tag: '의뢰', icon: '◇', hpCost: .15, goldReward: .7 },
  ] },
  forest: { title: '수풀 너머의 구조 신호', story: '길을 잃은 디지몬이 구조 신호를 보내고 있습니다. 덤불 너머로 향하거나, 발자국과 주변 데이터를 조사해 보세요.', choices: [
    { id: 'rescue', title: '덤불을 헤치고 구조하기', story: '안전한 길로 돌아온 주민이 감사의 보상과 관측 기록을 건넵니다.', tag: '구조', icon: '◇', hpCost: .15, goldReward: .5, analysis: 15 },
    heal('spring', '숲의 샘물에서 쉬기', .35), scan('tracks', '남겨진 발자국 분석', 20), train('trail', '수풀 사이 기동 훈련', ['speed']),
  ] },
  factory: { title: '멈춰 버린 정비 장치', story: '고장 난 설비에 아직 전력이 남아 있습니다. 장치를 수리해 스캔 데이터를 모으거나 회복과 방어 훈련에 활용할 수 있습니다.', choices: [
    { id: 'repair', title: '스캔 증폭 장치 수리', tag: '수리', icon: '⚙', goldCost: 1.5, analysis: 40 },
    { ...heal('maintenance', '정비 플랫폼 가동', .6), goldCost: .5 },
    train('defense', '방어 알고리즘 훈련', ['defense', 'specialDefense']),
    { id: 'recycle', title: '폐부품 회수', tag: '회수', icon: '⇄', hpCost: .1, goldReward: .5 },
  ] },
  ruins: { title: '잠들어 있던 데이터 기록', story: '석판에 오래된 디지몬 기록이 새겨져 있습니다. 기록을 해독하거나 봉인을 열어 유적의 보상을 찾아보세요.', choices: [
    scan('decode', '석판의 기록 해독', 35, { goldCost: .8 }),
    { id: 'unseal', title: '봉인된 보물함 개방', tag: '탐사', icon: '◇', hpCost: .2, goldReward: 1.1 },
    train('meditate', '기록실에서 정신 수련', ['specialAttack']), heal('well', '빛의 우물에서 쉬기', .3),
  ] },
  water: { title: '수면 아래에서 온 신호', story: '물결 사이로 표류 중인 데이터와 보급 상자가 보입니다. 잔잔한 곳에서 쉬거나 물속의 신호를 추적할 수 있습니다.', choices: [
    heal('shore', '잔잔한 물가에서 쉬기', .5), scan('sonar', '물속 신호 분석', 15),
    { id: 'salvage', title: '가라앉은 기록함 인양', tag: '인양', icon: '◇', hpCost: .2, analysis: 25, goldReward: .4 },
    train('current', '물살을 읽는 훈련', ['speed']),
  ] },
  volcano: { title: '과열된 지층의 데이터', story: '열기 속에서 압축된 데이터가 솟아납니다. 안전한 냉각 지대를 찾거나 위험을 감수하고 깊은 지층을 조사할 수 있습니다.', choices: [
    heal('cooling', '냉각 지대에서 쉬기', .25), train('heat', '열기 속 공격 훈련', ['attack', 'specialAttack'], 4),
    { id: 'excavate', title: '뜨거운 지층 탐사', tag: '위험 감수', icon: '◇', hpCost: .25, analysis: 40, goldReward: .3 },
    scan('thermal', '열원 데이터 분석', 20),
  ] },
  ice: { title: '얼음 속의 통신 기록', story: '두꺼운 얼음 아래에 오래된 신호가 갇혀 있습니다. 방한 쉼터를 이용하거나 기록을 꺼내 분석할 수 있습니다.', choices: [
    heal('shelter', '방한 쉼터에서 쉬기', .4), train('endurance', '추위 속 방어 훈련', ['defense', 'specialDefense'], 4),
    scan('frozen-signal', '얼음 아래 신호 회수', 30, { hpCost: .15 }),
    scan('exchange', '탐사대의 관측 기록 구입', 40, { goldCost: 1.2 }),
  ] },
  dark: { title: '뒤섞인 신호의 근원', story: '오염된 데이터가 길을 가리고 있습니다. 신호를 역추적하면 기록을 얻지만 동료들의 체력이 소모됩니다.', choices: [
    heal('purify', '안전 구역에서 정화', .2), scan('trace', '오염 신호 역추적', 30, { hpCost: .2 }),
    { id: 'breach', title: '균열 너머 보급품 수색', tag: '위험 감수', icon: '◇', hpCost: .25, goldReward: 1.3 },
    train('firewall', '정신 방벽 구축', ['specialDefense'], 4),
  ] },
  sky: { title: '먼 곳을 비추는 신호등대', story: '높은 곳의 중계기가 주변 데이터를 모으고 있습니다. 신호를 읽거나 이동 훈련을 하며 다음 전투를 준비하세요.', choices: [
    heal('refuge', '바람을 피해 쉬기', .3), train('flight', '기류에 맞춘 기동 훈련', ['speed'], 4), scan('beacon', '등대의 관측 기록 읽기', 25),
    scan('supplies', '중계소의 정밀 관측 의뢰', 50, { goldCost: 2 }),
  ] },
}

const membersOf = state => (state.party ?? []).filter(member => !member.isEgg && member.currentHp > 0)
export function getRegionalProfile(event) {
  const theme = Object.hasOwn(REGIONAL_EVENTS, event.theme) ? event.theme : 'town'
  const profile = REGIONAL_EVENTS[theme]
  const scene = MAP_EVENT_THEMES[event.mapName] === theme ? MAP_EVENT_STORIES[event.mapName] : null
  if (!scene) return profile
  return { ...profile, title: scene.title, story: scene.story,
    choices: profile.choices.map(choice => ({ ...choice, title: scene.choiceTitles[choice.id] ?? choice.title })) }
}

export function getRegionalChoices(state) {
  const event = state.explorationEvent
  const members = membersOf(state)
  const baseCost = 100 + Math.floor(event.stage / 10) * 30
  const baseGold = 300 + event.stage * 20
  return getRegionalProfile(event).choices.filter(template => !isDailyMode(state) || !template.analysis).map(template => {
    const choice = { ...template, goldCost: Math.round((template.goldCost ?? 0) * baseCost), goldReward: Math.round((template.goldReward ?? 0) * baseGold) }
    const costs = [], effects = [], preview = []
    let disabledReason = members.length ? '' : '전투 가능한 동료가 없습니다.'
    if (choice.goldCost) {
      costs.push(`${choice.goldCost.toLocaleString('ko-KR')} G`)
      if ((state.gold ?? 0) < choice.goldCost) disabledReason = '골드가 부족합니다.'
    }
    if (choice.hpCost) {
      costs.push(`전원 최대 HP ${Math.round(choice.hpCost * 100)}%`)
      preview.push(...members.map(member => `${member.name} −${Math.ceil(member.maxHp * choice.hpCost)} HP`))
      if (members.some(member => member.currentHp <= Math.ceil(member.maxHp * choice.hpCost))) disabledReason = '모든 참가자의 체력이 소모량보다 많아야 합니다.'
    }
    if (choice.heal) {
      effects.push(`전투 가능한 파티 전원: 최대 HP의 ${Math.round(choice.heal * 100)}% 회복 · 상태이상 치료. 쓰러진 동료와 알은 제외됩니다.`)
      preview.push(...members.map(member => `${member.name} +${Math.min(member.maxHp - member.currentHp, Math.max(1, Math.floor(member.maxHp * choice.heal)))} HP`))
      if (!members.some(member => member.currentHp < member.maxHp || member.statusEffect)) disabledReason = '이미 모두 건강합니다.'
    }
    if (choice.stats) {
      effects.push(`전투 가능한 파티 전원: ${choice.stats.map(key => statNames[key]).join('·')} 10% 강화 · ${choice.stages}회 클리어까지 유지.`)
      preview.push('기존 강화 수치는 중첩되지 않으며, 더 긴 기간은 유지합니다.')
      if (!members.some(member => choice.stats.some(key => (member.activeBuffs?.[key] ?? 0) < choice.stages))) disabledReason = '이미 같은 강화가 충분히 남아 있습니다.'
    }
    if (choice.analysis) {
      const targets = (event.species ?? []).filter(name => canScanSpecies(name, state.unlockedSpecies))
      const { gains } = addAnalysis(state.digimonAnalysis, targets,
        target => getTrainerScanGain(state.trainerSkills, choice.analysis, target, 'event'), state.unlockedSpecies)
      effects.push(...gains.map(entry => `${entry.name} 스캔 +${entry.gain}%p`))
      preview.push(...gains.map(entry => `${entry.name} ${entry.before}% → ${entry.after}%`))
      if (!targets.some(name => getAnalysisProgress(state.digimonAnalysis, name) < 100) && !choice.goldReward) disabledReason = '수집할 스캔 데이터가 없습니다.'
    }
    if (choice.goldReward) effects.push(`${choice.goldReward.toLocaleString('ko-KR')} G 획득.`)
    return { ...choice, cost: costs.join(' · ') || '무료', description: [choice.story, ...effects].filter(Boolean).join(' '),
      preview: preview.join(' · '), disabledReason }
  })
}

export function resolveRegionalChoice(state, choiceId, refreshStats) {
  const event = state.explorationEvent
  const choice = choiceId === 'skip' ? { id: 'skip', title: '그대로 출발' } : getRegionalChoices(state).find(item => item.id === choiceId)
  if (!choice || choice.disabledReason) return { ok: false, state, error: choice?.disabledReason ?? '선택할 수 없는 행동입니다.' }
  const logs = [], inventory = removeCaptureItems(state.inventory)
  const gold = (state.gold ?? 0) - (choice.goldCost ?? 0) + (choice.goldReward ?? 0)
  const party = state.party.map(member => {
    if (member.isEgg || member.currentHp <= 0) return member
    let next = { ...member }
    if (choice.hpCost) {
      next.currentHp -= Math.ceil(member.maxHp * choice.hpCost)
      logs.push(`${member.name}: HP ${member.currentHp} → ${next.currentHp}`)
    }
    if (choice.heal) {
      next.currentHp = Math.min(member.maxHp, member.currentHp + Math.max(1, Math.floor(member.maxHp * choice.heal)))
      next.statusEffect = null
      logs.push(`${member.name}: HP ${member.currentHp} → ${next.currentHp}${member.statusEffect ? ' · 상태이상 치료' : ''}`)
    }
    if (choice.stats) {
      const activeBuffs = { ...member.activeBuffs }
      for (const key of choice.stats) activeBuffs[key] = Math.max(choice.stages, activeBuffs[key] ?? 0)
      next = refreshStats(next, { activeBuffs })
    }
    return next
  })
  if (choice.goldCost) logs.push(`${choice.goldCost} G 사용.`)
  if (choice.goldReward) logs.push(`${choice.goldReward} G 획득!`)
  if (choice.stats) logs.push(`${choice.stats.map(key => statNames[key]).join('·')} 10% 강화 · 최소 ${choice.stages}회 클리어까지 유지.`)
  const analysis = addAnalysis(state.digimonAnalysis, choice.analysis ? event.species : [],
    target => getTrainerScanGain(state.trainerSkills, choice.analysis ?? 0, target, 'event'), state.unlockedSpecies)
  logs.push(...describeAnalysisGains(analysis.gains))
  if (choiceId === 'skip') logs.push('조사를 마치고 다음 전투로 향하기로 했다.')
  return { ok: true, logs, sound: choice.heal ? 'heal' : choice.stats ? 'buff' : 'item',
    state: { ...state, party, gold, inventory, digimonAnalysis: analysis.analysis,
      player: party.find(member => member.id === state.player?.id) ?? state.player,
      lastExplorationEventStage: event.stage, explorationEvent: { ...event, result: { choiceId, title: choice.title, logs } } } }
}
import { getTrainerScanGain } from '../progression/trainerSkills.js'
import { isDailyMode } from '../progression/gameModes.js'
