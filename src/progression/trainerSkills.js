import { DIGIMON_TRAINING_TRAITS } from '../data/digimonTrainingTraits.js'
import { normalizeEvolutionMemory, mergeEvolutionMemory } from './evolutionMemory.js'
import { resolveItemLuck } from './itemLuck.js'
import { LEGACY_DIGIMON_STAGES } from '../data/digimonStages.js'

// Persistent fan-game training. A run keeps the learned ranks it started with.
export const TRAINER_SKILLS_STORAGE_KEY = 'digirogue-trainer-skills-v1'
export const TRAINER_SKILL_STAGE_INTERVAL = 10
export const TRAINER_COST_BASE = 10
export const TRAINER_COST_MAX = 25
export const TRAINER_SKILL_PRICE_MAX = 5
export const TRAINER_STAGES = [...LEGACY_DIGIMON_STAGES, '아머체', '하이브리드체']
export const TRAINER_ATTRIBUTES = ['무', '화염', '물', '얼음', '바람', '번개', '나무', '흙', '강철', '빛', '어둠']
// The game's species classification is its existing vaccine/data/virus/etc. type.
export const TRAINER_TYPES = ['백신', '데이터', '바이러스', '프리', '무', '불명']
export const TRAINER_STATS = { hp: 'HP', attack: '공격', defense: '방어', specialAttack: '특공', specialDefense: '특방', speed: '스피드' }
export const TRAINER_CATEGORIES = [
  { id: 'cost', name: '코스트', icon: 'bond', subtitle: '팀 확장 · 디지몬 교감' },
  { id: 'stats', name: '능력치', icon: 'attack', subtitle: '개별 능력치 · 진화 · 보스 공략' },
  { id: 'items', name: '아이템', icon: 'item', subtitle: '행운 등급 · 물자 탐색' },
  { id: 'growth', name: '경험치 및 스캔율', icon: 'scan', subtitle: '육성 · 데이터 수집' },
]

const definitions = []
const define = (id, category, name, description, effect, options = {}) => {
  const node = { id, category, name, description, effect, maxRank: 3, price: 1,
    requires: [{ id: `${category}-root`, rank: 1 }], icon: effect.kind, group: 'general', ...options }
  // Preserve the previous flat price when upgrading already learned ranks.
  node.legacyPrice = node.price
  node.rankCosts = Object.freeze(createRankCosts(node))
  node.price = node.rankCosts[0]
  definitions.push(Object.freeze(node))
  return node
}
function createRankCosts(node) {
  const { kind, scope, luckTier, reserve, boss, mode, category, finisher } = node.effect
  let costs
  if (kind === 'root') costs = [0]
  else if (kind === 'budget') costs = [node.price, node.price, node.price + 1, node.price + 1, node.price + 2]
  else if (kind === 'cost') {
    costs = !scope ? [4, 5] : ['궁극체', '초궁극체'].includes(scope.stage) ? [3, 4, 5] :
      scope.stage === '완전체' ? [2, 3, 4] : [1, 2, 3]
  } else if (kind === 'stat') costs = scope ? [1, 2, 3] : [1, 1, 2, 2, 3]
  else if (kind === 'boss') costs = category || finisher ? [3, 4, 5] : scope ? [1, 2, 3] : [2, 2, 3, 3, 4]
  else if (kind === 'evolutionRequirement') costs = [2, 2, 3, 4, 5]
  else if (kind === 'evolutionMemory') costs = [5]
  else if (kind === 'luck') costs = [[1, 1, 2, 2, 3], [2, 2, 3, 3, 4], [3, 4, 5], [4, 5, 5]][luckTier]
  else if (kind === 'experience') costs = reserve || boss ? [2, 3, 4] : scope ? [1, 2, 3] : [1, 1, 2, 2, 3]
  else if (kind === 'scan') costs = mode === 'card' ? [2, 3, 4] : scope || mode ? [1, 2, 3] : [1, 1, 2, 2, 3]
  else costs = [1, 2, 3]
  return Array.from({ length: node.maxRank }, (_, rank) => Math.min(TRAINER_SKILL_PRICE_MAX, costs[rank] ?? costs.at(-1)))
}
for (const category of TRAINER_CATEGORIES) define(`${category.id}-root`, category.id,
  { cost: '디지털 교감', stats: '파트너 훈련', items: '탐험의 지혜', growth: '데이터 연구' }[category.id],
  '연결된 스킬을 선택해 파트너와 함께 성장하세요.', { kind: 'root' }, { maxRank: 1, price: 0, requires: [], group: 'root' })

define('cost-budget-1', 'cost', '팀 확장 I', '단계마다 시작 팀의 코스트 한도 +1. 기본 한도 10 → 15.',
  { kind: 'budget', amount: 1 }, { maxRank: 5, group: 'budget' })
define('cost-budget-2', 'cost', '팀 확장 II', '단계마다 시작 팀의 코스트 한도 +1. 한도 15 → 20.',
  { kind: 'budget', amount: 1 }, { maxRank: 5, price: 2, group: 'budget', requires: [{ id: 'cost-budget-1', rank: 5 }] })
define('cost-budget-3', 'cost', '팀 확장 III', '단계마다 시작 팀의 코스트 한도 +1. 한도 20 → 25.',
  { kind: 'budget', amount: 1 }, { maxRank: 5, price: 3, group: 'budget', requires: [{ id: 'cost-budget-2', rank: 5 }] })
define('cost-all', 'cost', '파트너 유대', '모든 디지몬의 시작 코스트를 단계마다 0.25 줄입니다.',
  { kind: 'cost', amount: .25 }, { maxRank: 2, price: 3, group: 'budget', icon: 'bond' })
TRAINER_STAGES.forEach((stage, index) => define(`cost-stage-${index}`, 'cost', `${stage} 교감`,
  `${stage === '유아기' ? '유아기·유년기' : stage}의 시작 코스트를 단계마다 ${stage === '아머체' ? .25 : stage === '하이브리드체' ? .5 : index < 4 ? .25 : index === 4 ? .5 : .75} 줄입니다.`,
  { kind: 'cost', amount: stage === '아머체' ? .25 : stage === '하이브리드체' ? .5 : index < 4 ? .25 : index === 4 ? .5 : .75,
    scope: { stage: stage === '유아기' ? ['유아기', '유년기'] : stage } },
  { group: 'stage', label: stage, price: index >= 5 && index < 7 ? 2 : 1,
    ...(index >= 4 && index < 7 ? { requires: [{ id: `cost-stage-${index - 1}`, rank: 1 }] } : {}) }))
TRAINER_ATTRIBUTES.forEach((attribute, index) => define(`cost-attribute-${index}`, 'cost', `${attribute} 교감`,
  `${attribute} 속성 디지몬의 시작 코스트를 단계마다 0.25 줄입니다.`,
  { kind: 'cost', amount: .25, scope: { attribute } }, { group: 'attribute', label: attribute }))
TRAINER_TYPES.forEach((type, index) => define(`cost-type-${index}`, 'cost', `${type} 교감`,
  `${type} 종족(타입) 디지몬의 시작 코스트를 단계마다 0.25 줄입니다.`,
  { kind: 'cost', amount: .25, scope: { type } }, { group: 'type', label: type }))

for (const [stat, label] of Object.entries(TRAINER_STATS)) {
  const base = define(`stats-${stat}`, 'stats', `${label} 훈련`, `모든 아군의 ${label} 능력치를 단계마다 0.75% 높입니다.`,
    { kind: 'stat', stat, amount: .0075 }, { maxRank: 5, tab: stat, icon: stat })
  for (const [group, values] of [['stage', TRAINER_STAGES], ['attribute', TRAINER_ATTRIBUTES], ['type', TRAINER_TYPES]]) {
    values.forEach((value, index) => define(`stats-${stat}-${group}-${index}`, 'stats', `${value} ${label} 훈련`,
      `${value}${group === 'stage' ? '' : group === 'attribute' ? ' 속성' : ' 종족(타입)'} 아군의 ${label} 능력치를 단계마다 1% 높입니다.`,
      { kind: 'stat', stat, amount: .01, scope: { [group]: value } },
      { tab: stat, group, label: value, icon: stat, requires: [{ id: base.id, rank: 1 }] }))
  }
}
define('stats-boss', 'stats', '보스 공략', '보스에게 주는 공격 기술 피해가 단계마다 1% 증가합니다.',
  { kind: 'boss', amount: .01 }, { tab: 'boss', maxRank: 5, icon: 'boss' })
define('stats-boss-physical', 'stats', '보스 장갑 파괴', '보스에게 주는 물리 기술 피해가 단계마다 1.25% 증가합니다.',
  { kind: 'boss', amount: .0125, category: '물리형' }, { tab: 'boss', icon: 'attack', requires: [{ id: 'stats-boss', rank: 2 }] })
define('stats-boss-special', 'stats', '보스 데이터 해체', '보스에게 주는 특수 기술 피해가 단계마다 1.25% 증가합니다.',
  { kind: 'boss', amount: .0125, category: '특수형' }, { tab: 'boss', icon: 'specialAttack', requires: [{ id: 'stats-boss', rank: 2 }] })
define('stats-boss-finish', 'stats', '결전의 일격', 'HP가 절반 이하인 보스에게 주는 기술 피해가 단계마다 1.25% 증가합니다.',
  { kind: 'boss', amount: .0125, finisher: true }, { tab: 'boss', icon: 'boss', requires: [{ id: 'stats-boss', rank: 3 }] })
TRAINER_STAGES.forEach((stage, index) => define(`stats-boss-stage-${index}`, 'stats', `${stage} 결전`,
  `${stage} 아군이 보스에게 주는 기술 피해가 단계마다 1% 증가합니다.`,
  { kind: 'boss', amount: .01, scope: { stage } }, { tab: 'boss', group: 'stage', label: stage, icon: 'boss', requires: [{ id: 'stats-boss', rank: 1 }] }))

define('stats-evolution-requirements', 'stats', '진화 적응', '필요 육성 능력치 -2.5%/단계, 최대 -12.5%. 디지몬·레벨 조건은 유지됩니다.',
  { kind: 'evolutionRequirement', amount: .025 }, { tab: 'evolution', maxRank: 5, icon: 'evolution' })
define('stats-evolution-memory', 'stats', '진화 기억', '아이템으로 성공한 진화는 아이템 없이 재사용합니다. 조그레스 재료·레벨은 유지됩니다.',
  { kind: 'evolutionMemory', amount: 1 }, { tab: 'evolution', maxRank: 1, price: 3, icon: 'memory',
    requires: [{ id: 'stats-evolution-requirements', rank: 1 }] })

// IDs, prerequisites, rank limits and prices preserve previous purchases.
define('items-good', 'items', '행운 훈련 I', '단계마다 행운 +1. 행운 등급이 오르면 높은 등급의 아이템을 더 잘 발견합니다.',
  { kind: 'luck', luckTier: 0, amount: 1 }, { maxRank: 5, icon: 'luck' })
for (const [id, name, luckTier, price, required] of [
  ['rare', '행운 훈련 II', 1, 1, 'items-good'], ['rogue', '행운 훈련 III', 2, 2, 'items-rare'], ['master', '행운 훈련 IV', 3, 3, 'items-rogue'],
]) define(`items-${id}`, 'items', name, '단계마다 행운 +1. 모든 행운 훈련을 합산하며 최대 SS등급까지 성장합니다.',
  { kind: 'luck', luckTier, amount: 1 }, { price, maxRank: id === 'rare' ? 5 : 3, icon: 'luck', requires: [{ id: required, rank: 2 }] })
for (const [group, name] of [['card', '카드 탐지'], ['egg', '디지에그 탐색'], ['growth', '육성 물자'], ['recovery', '회복 물자'], ['equipment', '장비 수색']]) {
  define(`items-find-${group}`, 'items', name, `같은 보상 등급에서 ${name.split(' ')[0]} 아이템의 추첨 가중치를 단계마다 7.5% 높입니다.`,
    { kind: 'item', itemGroup: group, amount: .075 }, { icon: 'item', group: 'specialty', requires: [{ id: 'items-good', rank: 1 }] })
}

define('growth-exp', 'growth', '함께하는 성장', '전투 경험치를 단계마다 2% 늘립니다. 대기 파티에도 적용됩니다.',
  { kind: 'experience', amount: .02 }, { tab: 'exp', maxRank: 5, icon: 'exp' })
define('growth-exp-reserve', 'growth', '뒤따르는 동료', '대기 중인 동료의 전투 경험치를 단계마다 2.5% 더 늘립니다.',
  { kind: 'experience', amount: .025, reserve: true }, { tab: 'exp', icon: 'exp', requires: [{ id: 'growth-exp', rank: 1 }] })
define('growth-exp-boss', 'growth', '결전의 배움', '보스 승리로 받는 경험치를 단계마다 2.5% 더 늘립니다.',
  { kind: 'experience', amount: .025, boss: true }, { tab: 'exp', icon: 'boss', requires: [{ id: 'growth-exp', rank: 2 }] })
for (const [group, values] of [['stage', TRAINER_STAGES], ['type', TRAINER_TYPES]]) values.forEach((value, index) =>
  define(`growth-exp-${group}-${index}`, 'growth', `${value} 육성`, `${value}${group === 'type' ? ' 종족(타입)' : ''} 동료의 전투 경험치를 단계마다 1.5% 늘립니다.`,
    { kind: 'experience', amount: .015, scope: { [group]: value } },
    { tab: 'exp', group, label: value, icon: 'exp', requires: [{ id: 'growth-exp', rank: 1 }] }))
define('growth-scan', 'growth', '스캔 해상도', '기본 스캔 데이터 +0.5 · 단계당 · 종별 난이도 적용.',
  { kind: 'scan', amount: .5 }, { tab: 'scan', maxRank: 5, icon: 'scan' })
define('growth-scan-encounter', 'growth', '조우 데이터', '조우 기본 데이터 +0.5 · 단계당 · 종별 난이도 적용.',
  { kind: 'scan', amount: .5, mode: 'encounter' }, { tab: 'scan', icon: 'scan', requires: [{ id: 'growth-scan', rank: 1 }] })
define('growth-scan-card', 'growth', '블루 카드 분석', '블루 카드 기본 데이터 +0.75 · 단계당 · 종별 난이도 적용.',
  { kind: 'scan', amount: .75, mode: 'card' }, { tab: 'scan', icon: 'scan', requires: [{ id: 'growth-scan', rank: 2 }] })
for (const [group, values] of [['stage', TRAINER_STAGES], ['attribute', TRAINER_ATTRIBUTES], ['type', TRAINER_TYPES]]) values.forEach((value, index) =>
  define(`growth-scan-${group}-${index}`, 'growth', `${value} 분석`, `${value}${group === 'stage' ? '' : group === 'attribute' ? ' 속성' : ' 종족(타입)'} 기본 스캔 데이터 +0.75 · 단계당 · 종별 난이도 적용.`,
    { kind: 'scan', amount: .75, scope: { [group]: value } },
    { tab: 'scan', group, label: value, icon: 'scan', requires: [{ id: 'growth-scan', rank: 1 }] }))

export const TRAINER_SKILLS = Object.freeze(definitions)
export const TRAINER_SKILL_LOOKUP = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(definitions.map(node => [node.id, node]))))
const integer = (value, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) ? Math.max(0, Math.min(max, value)) : 0
const roots = Object.fromEntries(TRAINER_CATEGORIES.map(category => [`${category.id}-root`, 1]))

export function normalizeTrainerRanks(value) {
  const ranks = { ...roots }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ranks
  // Definitions are ordered by prerequisite. A malformed/orphaned rank cannot unlock effects.
  for (const node of TRAINER_SKILLS) {
    if (node.price === 0) continue
    if (node.requires.every(required => (ranks[required.id] ?? 0) >= required.rank)) {
      const rank = integer(value[node.id], node.maxRank)
      if (rank) ranks[node.id] = rank
    }
  }
  return ranks
}
export function getTrainerSkillPrice(id, learnedRank = 0) {
  const node = typeof id === 'string' ? TRAINER_SKILL_LOOKUP[id] : id
  return node?.rankCosts[integer(learnedRank)] ?? 0
}
function paidRankCost(node, rank, paid) {
  const recorded = Array.isArray(paid?.[node.id]) ? paid[node.id][rank] : undefined
  const price = node.rankCosts[rank]
  return Number.isSafeInteger(recorded) && recorded >= 1 && recorded <= price ? recorded : price
}
export function getTrainerSpent(ranks, paid) {
  return TRAINER_SKILLS.reduce((sum, node) => sum + Array.from({ length: integer(ranks[node.id], node.maxRank) },
    (_, rank) => paidRankCost(node, rank, paid)).reduce((total, price) => total + price, 0), 0)
}
export function normalizeTrainerProgress(value) {
  const earned = integer(value?.earned)
  const learned = normalizeTrainerRanks(value?.learned)
  const legacy = value?.version == null || value.version === 1
  const paid = Object.fromEntries(TRAINER_SKILLS.filter(node => node.price > 0 && learned[node.id] > 0)
    .map(node => [node.id, Array.from({ length: learned[node.id] }, (_, rank) =>
      legacy ? node.legacyPrice : paidRankCost(node, rank, value?.paid))]))
  // Do not keep ranks that exceed the points recorded as earned.
  const endlessMilestones = normalizeEndlessMilestones(value?.endlessMilestones)
  const evolutionMemory = normalizeEvolutionMemory(value?.evolutionMemory)
  const extra = { ...(Object.keys(endlessMilestones).length ? { endlessMilestones } : {}),
    ...(evolutionMemory.length ? { evolutionMemory } : {}) }
  if (getTrainerSpent(learned, paid) > earned) return { version: 2, earned, learned: { ...roots }, paid: {}, milestones: normalizeMilestones(value?.milestones), ...extra }
  return { version: 2, earned, learned, paid, milestones: normalizeMilestones(value?.milestones), ...extra }
}
export function redistributeTrainerSkills(value) {
  const progress = normalizeTrainerProgress(value), refunded = getTrainerSpent(progress.learned, progress.paid)
  return { ok: true, refunded, progress: { ...progress, learned: { ...roots }, paid: {} } }
}
function normalizeEndlessMilestones(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([id, stages]) => /^[\w-]{1,120}$/.test(id) && Array.isArray(stages))
    .map(([id, stages]) => [id, [...new Set(stages.filter(stage => Number.isSafeInteger(stage) && stage > 200 && stage % 10 === 0))].sort((a, b) => a - b)]))
}
function normalizeMilestones(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([id, mask]) => id.length <= 120 && /^[\w-]+$/.test(id) && Number.isSafeInteger(mask) && mask > 0 && mask < 2 ** 20))
}
export const getTrainerPoints = progress => Math.max(0, progress.earned - getTrainerSpent(progress.learned, progress.paid))
export function getTrainerLearnBlocker(progress, id) {
  const node = TRAINER_SKILL_LOOKUP[id]
  if (!node) return '등록되지 않은 스킬입니다.'
  if ((progress.learned[id] ?? 0) >= node.maxRank) return '최대 단계까지 배웠습니다.'
  const missing = node.requires.find(required => (progress.learned[required.id] ?? 0) < required.rank)
  if (missing) return `${TRAINER_SKILL_LOOKUP[missing.id].name} ${missing.rank}단계가 필요합니다.`
  const price = getTrainerSkillPrice(node, progress.learned[id] ?? 0)
  if (getTrainerPoints(progress) < price) return `${price} SP가 필요합니다. ${price - getTrainerPoints(progress)} SP가 부족합니다.`
  return ''
}
export function learnTrainerSkill(value, id) {
  const progress = normalizeTrainerProgress(value)
  const error = getTrainerLearnBlocker(progress, id)
  if (error) return { ok: false, progress, error }
  const rank = progress.learned[id] ?? 0
  const price = getTrainerSkillPrice(id, rank)
  return { ok: true, price, progress: { ...progress, learned: { ...progress.learned, [id]: rank + 1 },
    paid: { ...progress.paid, [id]: [...(progress.paid[id] ?? []), price] } } }
}
export function createTrainerRun(progress, id) {
  const runId = id ?? globalThis.crypto?.randomUUID?.() ?? `run-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return { trainerRunId: runId, trainerSkills: normalizeTrainerRanks(progress.learned), evolutionMemory: normalizeEvolutionMemory(progress.evolutionMemory) }
}
export function awardTrainerVictory(value, state) {
  const progress = normalizeTrainerProgress(value)
  const stage = state?.currentStage, id = state?.trainerRunId
  if (!Number.isSafeInteger(stage) || stage < 10 || (stage > 200 && state.gameMode !== 'endless') || stage % TRAINER_SKILL_STAGE_INTERVAL ||
    typeof id !== 'string' || !/^[\w-]{1,120}$/.test(id) || state.explorationEvent?.phase === 'battle' ||
    !state.enemies?.length || state.enemies.some(unit => unit.currentHp > 0) ||
    !state.party?.some(unit => !unit.isEgg && unit.currentHp > 0)) return { progress, awarded: 0 }
  if (stage > 200) {
    const completed = progress.endlessMilestones?.[id] ?? []
    if (completed.includes(stage)) return { progress, awarded: 0 }
    return { awarded: 1, progress: { ...progress, earned: progress.earned + 1,
      endlessMilestones: { ...progress.endlessMilestones, [id]: [...completed, stage].sort((a, b) => a - b) } } }
  }
  const bit = 2 ** (stage / 10 - 1)
  const previous = progress.milestones[id] ?? 0
  if (previous & bit) return { progress, awarded: 0 }
  return { progress: { ...progress, earned: progress.earned + 1,
    milestones: { ...progress.milestones, [id]: previous | bit } }, awarded: 1 }
}

function traits(unit) {
  if (typeof unit === 'string') return DIGIMON_TRAINING_TRAITS[unit] ?? {}
  const data = unit?.speciesData ?? unit?.data ?? unit ?? {}
  return { stage: unit?.speciesStage ?? unit?.stage ?? data.stage,
    attribute: unit?.attribute ?? data.속성, type: unit?.type ?? data.타입 }
}
function matches(scope, unit) {
  const values = traits(unit)
  return !scope || Object.entries(scope).every(([key, expected]) => Array.isArray(expected) ? expected.includes(values[key]) : values[key] === expected)
}
function sum(ranks, kind, unit, accept = () => true) {
  let result = 0
  for (const [id, rank] of Object.entries(ranks ?? {})) {
    const node = TRAINER_SKILL_LOOKUP[id]
    if (node?.effect.kind === kind && rank > 0 && matches(node.effect.scope, unit) && accept(node.effect)) {
      result += Math.min(node.maxRank, integer(rank)) * node.effect.amount
    }
  }
  return result
}
export const getTrainerCostLimit = ranks => Math.min(TRAINER_COST_MAX, TRAINER_COST_BASE + sum(ranks, 'budget'))
export const getTrainerStarterCost = (data, ranks) => Math.max(1, data.시작코스트 - Math.floor(sum(ranks, 'cost', data)))
export const getTrainerEvolutionRequirement = (ranks, required) => Math.max(1, Math.ceil(required * (1 - Math.min(.125, sum(ranks, 'evolutionRequirement')))))
export const hasTrainerEvolutionMemory = ranks => sum(ranks, 'evolutionMemory') > 0
export function recordTrainerEvolutionMemory(value, memory) {
  const progress = normalizeTrainerProgress(value)
  const evolutionMemory = mergeEvolutionMemory(progress.evolutionMemory, memory)
  return evolutionMemory.length ? { ...progress, evolutionMemory } : progress
}
export const getTrainerStatMultiplier = (ranks, unit, stat) => 1 + sum(ranks, 'stat', unit, effect => effect.stat === stat)
export function applyTrainerStats(stats, ranks, unit) {
  const result = { ...stats }
  for (const stat of Object.keys(TRAINER_STATS)) {
    const key = stat === 'hp' ? 'maxHp' : stat
    result[key] = Math.max(1, Math.floor(stats[key] * getTrainerStatMultiplier(ranks, unit, stat)))
  }
  return result
}
export const getTrainerExperienceMultiplier = (unit, { reserve = false, boss = false } = {}) =>
  1 + sum(unit?.trainerSkills, 'experience', unit, effect => (!effect.reserve || reserve) && (!effect.boss || boss))
export function getTrainerBossMultiplier(attacker, defender, skill, side = 'ally') {
  if (side !== 'ally' || !defender.isBoss) return 1
  return 1 + sum(attacker?.trainerSkills, 'boss', attacker, effect =>
    (!effect.category || effect.category === skill.분류) && (!effect.finisher || defender.currentHp <= defender.maxHp / 2))
}
export const getTrainerScanGain = (ranks, base, target, mode = 'event') => Math.min(100, base + sum(ranks, 'scan', target, effect => !effect.mode || effect.mode === mode))
export const getTrainerLuck = ranks => resolveItemLuck(sum(normalizeTrainerRanks(ranks), 'luck'))
function isItemGroup(item, group) {
  if (group === 'card') return Boolean(item.cardCode)
  if (group === 'egg') return Boolean(item.digiEggName)
  if (group === 'growth') return Boolean(item.digicloneKey || item.levelUpAmount || item.partyLevelUpAmount)
  if (group === 'recovery') return Boolean(item.healAmount || item.partyHealAmount || item.healFull || item.partyHealFull || item.reviveRatio)
  if (group === 'equipment') return Boolean(item.battleItemKey || item.utilityKey || item.typeUpKey || item.attributeUpKey || item.recoveryProgramKey)
  return false
}
export function pickTrainerRewardItem(items, ranks, random = Math.random) {
  if (!items.length) return null
  const weights = items.map(item => 1 + sum(ranks, 'item', null, effect => isItemGroup(item, effect.itemGroup)))
  let roll = random() * weights.reduce((total, weight) => total + weight, 0)
  for (let i = 0; i < items.length; i++) { roll -= weights[i]; if (roll < 0) return items[i] }
  return items.at(-1)
}

export function loadTrainerProgress(storage) {
  try { return normalizeTrainerProgress(JSON.parse((storage ?? globalThis.localStorage)?.getItem(TRAINER_SKILLS_STORAGE_KEY) ?? 'null')) }
  catch { return normalizeTrainerProgress(null) }
}
export function saveTrainerProgress(progress, storage) {
  try { const target = storage ?? globalThis.localStorage; if (!target) return false; target.setItem(TRAINER_SKILLS_STORAGE_KEY, JSON.stringify(normalizeTrainerProgress(progress))); return true }
  catch { return false }
}
