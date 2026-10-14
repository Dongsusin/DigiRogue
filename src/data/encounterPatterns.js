import { EXPANSION_TACTIC_OVERRIDES } from './expansionEncounterPatterns.js'
// Authored encounter tactics. Percentages and timings are fan-game rules;
// native signatures keep the species' existing damage, status and 3D effects.
import roster from './encounterPatternRoster.json' with { type: 'json' }
export const ENCOUNTER_PATTERN_ROSTER = Object.freeze(roster)
const actions = count => ({ kind: 'actions', count })
const hp = ratio => ({ kind: 'hp', ratio })
const hit = category => ({ kind: 'hits', category, count: 2 })
const support = (name, effect, attribute = '무') => ({ 기술명: name, 분류: '보조형', 속성: attribute,
  데미지: 0, 명중률: 100, 효과: effect })
const tactics = {
  ferocity: { label: '야성의 투지', condition: hp(.4), effect: { stats: { attack: 1.12 } } },
  physicalGuard: { label: '강인한 외피', condition: hit('물리형'), effect: { guards: { physical: 2 } } },
  specialGuard: { label: '기류의 방벽', condition: hit('특수형'), effect: { guards: { special: 2 } } },
  purify: { label: '정화의 기운', condition: { kind: 'status' }, effect: { clearStatus: true, guards: { status: 2 } } },
  bloom: { label: '생명 데이터 재생', condition: hp(.45), effect: { healRatio: .12 } },
  agile: { label: '잔영의 발걸음', condition: { kind: 'miss' }, effect: { stats: { speed: 1.15 } } },
  barrage: { label: '조준 시스템 전개', condition: actions(3), effect: { stats: { specialAttack: 1.12 } } },
  flame: { label: '열기 재점화', condition: hp(.45), effect: { clearStatus: true, stats: { specialAttack: 1.12 } } },
  electric: { label: '전하 방출', condition: actions(1), effect: {},
    support: support('전하 방출', { kind: 'status', targetSide: 'enemy', scope: 'single', status: '마비', chance: 65 }, '번개') },
  poison: { label: '독성 데이터 방출', condition: actions(1), effect: {},
    support: support('독성 데이터 방출', { kind: 'status', targetSide: 'enemy', scope: 'single', status: '독', chance: 65 }, '어둠') },
  dread: { label: '위압의 시선', condition: actions(1), effect: {},
    support: support('위압의 시선', { kind: 'stat-modifier', targetSide: 'enemy', scope: 'single', statKey: 'attack', multiplier: .85 }, '어둠') },
  absorb: { label: '생체 데이터 흡수', condition: hp(.5), effect: {}, drain: true },
  barrier: { label: '수호 방벽', condition: actions(1), effect: { guards: { physical: 2, special: 2 } } },
  network: { label: '네트워크 가속', condition: actions(1), effect: { stats: { speed: 1.15 } } },
}
const overrides = {
  ...EXPANSION_TACTIC_OVERRIDES,
  '에테몬': { label: '러브 세레나데', support: support('러브 세레나데',
    { kind: 'stat-modifier', targetSide: 'enemy', scope: 'all', statKey: 'attack', multiplier: .85 }) },
  '메탈에테몬': { label: '바나나 슬립', support: support('바나나 슬립',
    { kind: 'status', targetSide: 'enemy', scope: 'single', status: '혼수상태', chance: 65 }) },
  '데블몬': { label: '악마의 유혹', support: support('악마의 유혹',
    { kind: 'status', targetSide: 'enemy', scope: 'single', status: '혼란', chance: 70 }, '어둠') },
  '피노키몬': { label: '꼭두각시 실', support: support('꼭두각시 실',
    { kind: 'stat-modifier', targetSide: 'enemy', scope: 'single', statKey: 'speed', multiplier: .8 }) },
  '피에몬': { label: '가면의 기만', support: support('가면의 기만',
    { kind: 'clear-stat-boosts', targetSide: 'enemy', scope: 'single' }, '어둠') },
  '벨페몬': { label: '이터널 나이트메어', support: support('이터널 나이트메어',
    { kind: 'status', targetSide: 'enemy', scope: 'single', status: '수면', chance: 70 }, '어둠') },
  '벨페몬[레이지]': { label: '기프트 오브 다크니스', condition: hp(.4), support: null,
    effect: { stats: { attack: 1.15, defense: .9 }, clearStatus: true } },
  '디아나몬': { label: '달빛의 자장가', support: support('달빛의 자장가',
    { kind: 'status', targetSide: 'enemy', scope: 'single', status: '수면', chance: 70 }, '빛') },
  '그란드라큐몬': { label: '아이 오브 더 고르곤', support: support('아이 오브 더 고르곤',
    { kind: 'status', targetSide: 'enemy', scope: 'single', status: '마비', chance: 70 }, '어둠') },
  '드라큐몬': { label: '흡혈 재생', condition: hp(.5), support: null, drain: true },
  '상굴몬': { label: '흡혈 재생', condition: hp(.5), support: null, drain: true },
  '마타돌몬': { label: '흡혈 재생', condition: hp(.5), support: null, drain: true },
  '우드몬': { label: '브랜치 드레인', effect: {}, drain: true },
  '오로치몬': { label: '여덟 머리의 재생', drain: false, effect: { healRatio: .12 } },
  '크레니엄몬': { label: '아발론 · 갓 브레스' },
  '크레니엄몬[X항체]': { label: '아발론 · 강화 방벽' },
  '샤크라몬': { label: '금강계만다라 결계', effect: { guards: { special: 2, stats: 2 } } },
  '제스몬': { label: '아우스 제네릭스', effect: { clearStatus: true, guards: { physical: 2, special: 2 } } },
  '알포스브이드라몬': { label: '알포스 초재생', condition: hp(.45), effect: { healRatio: .15 } },
  '디아블로몬': { label: '데이터 분신', condition: { kind: 'all', conditions: [actions(1), { kind: 'reinforcement-room' }] },
    effect: {}, pattern: { kind: 'encounter-summon', species: '디아블로몬' } },
  '아마게몬': { label: '케라몬 증식', condition: { kind: 'all', conditions: [actions(1), { kind: 'reinforcement-room' }] },
    effect: {}, pattern: { kind: 'encounter-summon', species: '케라몬' } },
  '크리사리몬': { label: '강인한 고치', condition: hit('물리형'), effect: { guards: { physical: 2 } } },
  '케라몬': { label: '데이터 포식', condition: hp(.45), effect: { healRatio: .12 } },
  '로터스몬': { label: '서펜트 큐어', effect: { healRatio: .12, clearStatus: true } },
  '케레스몬': { label: '비옥한 열매', effect: { healRatio: .15 } },
}
// Current-form IDs let an evolved rival use its own move; old queued form IDs
// are discarded by the dispatcher without resetting any spent phase or rule.
export function getEncounterTactics(unit, getSkillData) {
  const plan = unit?.bossEncounter, spec = roster[unit?.name]
  if (!plan || plan.kind === 'final' || (plan.leader === false && !unit.isBoss && !unit.rivalEncounter) || !spec) return []
  const native = getSkillData(spec.signature, unit)
  if (!native || native.기술명 !== spec.signature || !(native.데미지 > 0) || native.효과) return []
  const id = 'species:' + unit.name + ':'
  const trait = { ...tactics[spec.tactic], ...overrides[unit.name] }
  if (spec.tactic === 'barrage' && !overrides[unit.name]?.effect) trait.effect = { stats: { [native.분류 === '물리형' ? 'attack' : 'specialAttack']: 1.12 } }
  const signatureSkill = trait.support ?? (trait.drain ? { ...native, encounterDrain: true, encounterSpecies: unit.name } : null)
  return [
    { ...trait, id: id + 'trait', ...(signatureSkill ? { signatureSkill, requiresReadySkill: Boolean(trait.drain) } : {}) },
    { id: id + 'signature', label: native.기술명, condition: actions(2), effect: {}, requiresReadySkill: true, signatureSkill: { ...native } },
  ]
}
