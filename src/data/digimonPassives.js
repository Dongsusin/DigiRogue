import assignments from './digimonPassiveAssignments.json' with { type: 'json' }
import { canonicalDigimonName } from './digimonNames.js'

// Fan-game abilities. Names and values here are game rules, not official Digimon traits.
const ability = (id, name, description, effects) => Object.freeze({ id, name, description, ...effects })
const element = (id, name, attribute) => ability(id, name, `${attribute} 기술의 피해가 20% 증가합니다.`, { attackAttribute: attribute, attackMultiplier: 1.2 })
export const DIGIMON_PASSIVES = Object.freeze(Object.fromEntries([
  element('flame', '불꽃의 심장', '화염'), element('ocean', '심해의 힘', '물'),
  element('frost', '빙결의 숨결', '얼음'), element('storm', '폭풍의 날개', '바람'),
  element('voltage', '전류 증폭', '번개'), element('forest', '숲의 기운', '나무'),
  element('earth', '대지의 맥동', '흙'), element('radiance', '성스러운 빛', '빛'),
  element('darkness', '어둠의 파동', '어둠'), element('steel', '강철 무장', '강철'),
  ability('brawler', '투사의 본능', '물리 기술의 피해가 12% 증가합니다.', { attackCategory: '물리형', attackMultiplier: 1.12 }),
  ability('sorcerer', '마력 집중', '특수 기술의 피해가 12% 증가합니다.', { attackCategory: '특수형', attackMultiplier: 1.12 }),
  ability('swift', '질풍의 추격', '상대보다 스피드가 높으면 주는 피해가 18% 증가합니다.', { fasterMultiplier: 1.18 }),
  ability('resolve', '불굴의 투지', 'HP가 1/3 이하일 때 주는 피해가 30% 증가합니다.', { lowHpThreshold: 1 / 3, lowHpMultiplier: 1.3 }),
  ability('ferocity', '야수의 추격', '상대의 HP가 절반 이하이면 주는 피해가 20% 증가합니다.', { targetHpThreshold: 0.5, targetHpMultiplier: 1.2 }),
  ability('predator', '거체 사냥', '상대의 최대 HP가 자신의 1.5배 이상이면 주는 피해가 20% 증가합니다.', { giantMultiplier: 1.2 }),
  ability('armor', '견고한 갑각', '받는 물리 기술 피해가 15% 감소합니다.', { defenseCategory: '물리형', defenseMultiplier: 0.85 }),
  ability('magic-ward', '마력 장벽', '받는 특수 기술 피해가 15% 감소합니다.', { defenseCategory: '특수형', defenseMultiplier: 0.85 }),
  ability('block', '블록 조립', '매 전투 처음 받는 공격 피해를 50% 줄입니다.', { firstHitMultiplier: 0.5 }),
  ability('sturdy', '최후의 버팀', '매 전투 한 번, HP가 2 이상일 때 치명적인 피해를 받아도 HP 1로 버팁니다.', { endure: true }),
  ability('regeneration', '생명의 순환', '행동 종료 시 최대 HP의 5%를 회복합니다.', { regeneration: 0.05 }),
  ability('healer', '성스러운 치유', '자신이 사용하는 회복 기술의 회복량이 30% 증가합니다.', { outgoingHealing: 1.3 }),
  ability('receptive', '물의 가호', '자신에게 사용한 회복 기술의 회복량이 30% 증가합니다.', { incomingHealing: 1.3 }),
  ability('venom-body', '독성 체질', '독·맹독에 걸리지 않습니다.', { statusImmunities: ['독', '맹독'] }),
  ability('flame-body', '불꽃 체질', '화상에 걸리지 않고, 화염 기술 피해가 10% 증가합니다.', { statusImmunities: ['화상'], attackAttribute: '화염', attackMultiplier: 1.1 }),
  ability('insulated', '절연 갑각', '마비에 걸리지 않고, 번개 기술 피해가 10% 증가합니다.', { statusImmunities: ['마비'], attackAttribute: '번개', attackMultiplier: 1.1 }),
  ability('tranquil', '흔들리지 않는 마음', '혼란·착란·수면·혼수상태에 걸리지 않습니다.', { statusImmunities: ['혼란', '착란', '수면', '혼수상태'] }),
  ability('iron-will', '강철의 의지', '상대 기술에 의한 능력치 하락을 막습니다.', { blockStatDrops: true }),
  ability('data-ward', '데이터 보호막', '매 전투 처음 성공하는 상대의 상태이상 부여를 한 번 막습니다.', { firstStatusWard: true }),
  ability('clean-body', '정화된 데이터', '독·맹독·화상의 지속 피해가 50% 감소합니다.', { statusDamageMultiplier: 0.5 }),
  ability('venom-art', '상태이상 전문가', '상태이상을 부여하는 기술의 성공률이 15%p 증가합니다.', { statusChanceBonus: 15 }),
  ability('precision', '급소 포착', '공격의 치명타 확률이 10%p 증가합니다.', { criticalChanceBonus: 0.1 }),
  ability('focus', '정밀 조준', '공격 기술의 명중률이 10%p 증가합니다.', { accuracyBonus: 10 }),
  ability('elusive', '그림자 잔상', '자신을 노리는 공격 기술의 명중률을 8%p 낮춥니다.', { evasionBonus: 8 }),
  ability('opening', '선제 돌격', '매 전투 첫 행동에서 사용하는 공격 기술의 피해가 25% 증가합니다.', { openingMultiplier: 1.25 }),
  ability('charge', '전투 데이터 축적', '행동을 마칠 때마다 주는 피해가 5%씩 증가합니다. 최대 25%.', { actionCharge: 0.05, chargeCap: 0.25 }),
  ability('revenge', '역습의 분노', '공격 피해를 받을 때마다 주는 피해가 6%씩 증가합니다. 최대 24%.', { hitCharge: 0.06, chargeCap: 0.24 }),
  ability('dragon-bane', '드라몬 킬러', '용족 디지몬에게 주는 피해가 25% 증가합니다.', { targetFamily: '용족', familyMultiplier: 1.25 }),
  ability('virus-bane', '바이러스 제압', '바이러스 타입에게 주는 피해가 20% 증가합니다.', { targetType: '바이러스', typeMultiplier: 1.2 }),
  ability('dual-knight', '빙염의 쌍검', '화염·얼음 기술의 피해가 20% 증가합니다.', { attackAttributes: ['화염', '얼음'], attackMultiplier: 1.2 }),
  ability('guardian', '성기사의 수호', '상성으로 증가한 추가 피해를 35% 줄입니다.', { weaknessReduction: 0.35 }),
  ability('critical-guard', '급소 방호', '받는 치명타의 추가 피해를 막습니다.', { blockCriticalBonus: true }),
  ability('ruthless', '저주 사냥', '상태이상이나 능력치 하락이 있는 상대에게 주는 피해가 20% 증가합니다.', { afflictedMultiplier: 1.2 }),
  ability('drain', '데이터 흡수', '공격으로 실제 준 피해의 15%를 행동 종료 시 회복합니다. 한 행동에 최대 HP의 10%까지.', { drainRatio: 0.15, drainCap: 0.1 }),
  ability('bloodlust', '승자의 포식', '직접 쓰러뜨린 적 한 마리당 최대 HP의 10%를 행동 종료 시 회복합니다. 한 행동에 최대 20%.', { defeatHealing: 0.1, defeatHealingCap: 0.2 }),
  ability('signature', '필살기 숙련', '자신의 고유 기술로 주는 피해가 20% 증가합니다.', { signatureMultiplier: 1.2 }),
].map(entry => [entry.id, entry])))

export const DIGIMON_PASSIVE_ASSIGNMENTS = Object.freeze(assignments)
const speciesName = value => canonicalDigimonName(typeof value === 'string' ? value : value?.speciesData?.이름 ?? value?.imageName ?? value?.name ?? value?.이름)
export function getDigimonPassiveId(value) { return assignments[speciesName(value)]?.id ?? null }
export function getDigimonPassive(value) {
  if (!value || value.isEgg) return null
  return DIGIMON_PASSIVES[typeof value === 'object' && value.passiveId ? value.passiveId : getDigimonPassiveId(value)] ?? null
}
export function getDigimonFamilies(value) { return assignments[speciesName(value)]?.families ?? [] }
