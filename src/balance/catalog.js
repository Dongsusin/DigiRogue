import { REGION_EFFECT_TEXT } from '../battle/regionModifiers.js'
import { getEvolutionLevel, getEvolutionTargets, getEvolutionInvestment } from '../data/evolutionRules.js'
import { getDigimonPassiveId } from '../data/digimonPassives.js'
import { getLoreProfile, createLoreStats, costForPower } from './loreProfiles.js'
import { getDigimonTrainingStage } from '../data/digimonStages.js'

// Raw species/animation names stay intact; this is the single gameplay tuning layer.
export const BALANCE_REVISION = 5
export const STAGE_TUNING = {
  유아기: { level: 1 }, 유년기: { level: 3 },
  성장기: { level: 5 }, 성숙기: { level: 15 },
  완전체: { level: 30 }, 궁극체: { level: 50 },
  초궁극체: { level: 75 }, 아머체: { level: 15 }, 하이브리드체: { level: 15 },
}
const healerNames = new Set(['엔젤몬', '엔젤우몬', '홀리엔젤몬', '세라피몬', '홀리드라몬', '페닉스몬', '로제몬', '로터스몬', '마린엔젤몬', '케루비몬(선)', '시스터몬 블랑', '시스터몬 블랑[각성]', '큐트몬'])
const roleSupport = {
  물리형: ['어택 차지', ['액셀 부스트', '크리티컬 바인드', '리셋 보디']],
  특수형: ['매직 차지', ['스펠 부스트', '매직 리플렉트', '크리티컬 브레이크']],
  수비형: ['헤이트 차지', ['세이프티 가드', '스테이터스 배리어', '어택 리플렉트']],
  기동형: ['스피드 차지', ['패닉 위스프', '베놈 트랩', '찌릿찌릿 네트']],
  균형형: ['힐', ['커스 배리어', '오라', '메디테이터']],
}
export const BASIC_SKILLS = [
  { 기술명: '기본 타격', 데미지: 45, 명중률: '100%', 분류: '물리형', 속성: '무', 전체공격: false, cooldown: 0,
    효과설명: '재사용 대기 없이 사용하는 무속성 물리 공격. 공격 기술이 모두 대기 중일 때 사용할 수 있습니다.' },
  { 기술명: '기본 파동', 데미지: 45, 명중률: '100%', 분류: '특수형', 속성: '무', 전체공격: false, cooldown: 0,
    효과설명: '재사용 대기 없이 사용하는 무속성 특수 공격. 공격 기술이 모두 대기 중일 때 사용할 수 있습니다.' },
]
const statLabels = { attack: '공격', defense: '방어', specialAttack: '특공', specialDefense: '특방', speed: '스피드' }
const redesignedSupport = {
  '디보션 필드': { kind: 'heal', targetSide: 'ally', scope: 'all', healRatio: 0.5 },
  '무녀의 결계': { kind: 'guard', targetSide: 'ally', scope: 'single', guard: 'status', turns: 3 },
  '크리티컬 바인드': { kind: 'stat-modifier', statKey: 'attack', multiplier: 0.8, duration: 'region' },
  '크리티컬 브레이크': { kind: 'stat-modifier', statKey: 'specialAttack', multiplier: 0.8, turns: 2 },
  '헤이트 차지': { kind: 'guard', guard: 'taunt', turns: 2 },
  '액셀 부스트': { kind: 'stat-modifier', statKey: 'attack', multiplier: 1.3, duration: 'region' },
  '스펠 부스트': { kind: 'stat-modifier', statKey: 'specialAttack', multiplier: 1.3, duration: 'region' },
  '어택 리플렉트': { kind: 'guard', guard: 'physical', turns: 2 },
  '매직 리플렉트': { kind: 'guard', guard: 'special', turns: 2 },
  '커스 배리어': { kind: 'guard', guard: 'status', turns: 3 },
  '스테이터스 배리어': { kind: 'guard', guard: 'stats', turns: 3 },
  '세이프티 가드': { kind: 'guard', guard: 'endure', turns: 3 },
}
export const GUARD_DESCRIPTIONS = {
  taunt: '단일 공격을 자신에게 유도하고 받는 피해를 25% 줄입니다. 전체 공격에는 유도가 적용되지 않습니다.',
  physical: '물리 방벽을 펼쳐 받는 물리 피해를 50% 줄입니다. 피해를 되돌려주지는 않습니다.',
  special: '특수 방벽을 펼쳐 받는 특수 피해를 50% 줄입니다. 피해를 되돌려주지는 않습니다.',
  status: '상태이상을 해제하고 새로운 상태이상을 막습니다.',
  stats: '능력치 하락을 해제하고 새로운 능력치 하락을 막습니다.',
  endure: 'HP가 2 이상일 때 치명적인 피해를 한 번 HP 1로 버팁니다.',
}

export function balanceSkill(raw) {
  // Preserve names/animation hooks while correcting a few raw-data effects that conflict with the move.
  const corrections = {
    '베이비 플레임': { 상태이상: '화상', 상태이상확률: '20%' },
    '가이아 포스': { 상태이상: null, 상태이상확률: null },
    '코큐토스 브레스': { 속성: '얼음' },
    '가루 토마호크': { 속성: '얼음' },
    '그레이스 크로스 프리저': { 전체공격: true },
    '아발론즈 게이트': { 분류: '물리형' },
    '파라다이스 로스트': { 분류: '물리형' },
    '오션 러브': { 분류: '보조형', 데미지: 0, 전체공격: false, 대상: '적 전체',
      효과: { kind: 'status', targetSide: 'enemy', scope: 'all', status: '착란', chance: 90 } },
  }
  raw = { ...raw, ...corrections[raw.기술명] }
  const skill = { ...raw }
  if (skill.효과 || skill.분류 === '보조형') {
    const effect = { ...skill.효과, ...redesignedSupport[skill.기술명] }
    skill.대상 ??= effect.scope === 'self' ? '자신' : `${effect.targetSide === 'enemy' ? '적' : '아군'} ${effect.scope === 'all' ? '전체' : '하나'}`
    skill.cooldown = 3
    if (effect.kind === 'heal') {
      effect.healRatio = effect.scope === 'all' ? (effect.healRatio > 0.25 ? 0.3 : 0.2) : (effect.healRatio > 0.5 ? 0.5 : 0.35)
      skill.cooldown = effect.healRatio >= 0.5 ? 4 : 3
      skill.cooldownGroup = 'recovery'
      skill.효과설명 = `${effect.scope === 'all' ? '전투 중인 아군 전체' : 'HP 비율이 가장 낮은 아군'}의 최대 HP ${Math.round(effect.healRatio * 100)}%를 회복합니다. 회복·부활 기술은 대기시간을 공유합니다.`
    } else if (effect.kind === 'revive') {
      effect.reviveRatio = effect.reviveRatio > 0.5 ? 0.5 : 0.3
      skill.cooldown = 5
      skill.cooldownGroup = 'recovery'
      skill.효과설명 = `쓰러진 아군 하나를 최대 HP ${Math.round(effect.reviveRatio * 100)}%로 부활시킵니다. 회복·부활 기술은 대기시간을 공유합니다.`
    } else if (effect.kind === 'stat-modifier') {
      if (!redesignedSupport[skill.기술명] && effect.scope === 'all') effect.multiplier = effect.multiplier > 1 ? 1.2 : 0.85
      effect.duration = 'region'
      delete effect.turns
      effect.multiplier = Math.max(.8, Math.min(1.3, effect.multiplier))
      const delta = Math.round(Math.abs(effect.multiplier - 1) * 100)
      skill.효과설명 = `${skill.대상}의 ${statLabels[effect.statKey]}을(를) ${REGION_EFFECT_TEXT} ${delta}% ${effect.multiplier > 1 ? '높입니다' : '낮춥니다'}. 같은 능력치 효과는 중첩되지 않습니다.`
    } else if (effect.kind === 'status') {
      effect.chance = 90
      skill.효과설명 = `${skill.대상}에게 90% 확률로 ${effect.status} 효과를 적용합니다. 보스에게는 적용 확률이 절반입니다.`
      if (skill.기술명 === '오션 러브') {
        skill.cooldown = 4
        skill.효과설명 = '싸우려는 의지를 누그러뜨려 적 전체를 90% 확률로 1행동 동안 착란 상태로 만듭니다. 직접 피해는 없습니다. 보스에게는 적용 확률이 절반입니다.'
      }
    } else if (effect.kind === 'guard') {
      skill.효과설명 = `${effect.turns}턴 동안 ${GUARD_DESCRIPTIONS[effect.guard]}`
      skill.cooldown = effect.guard === 'endure' ? 5 : 4
    } else {
      skill.cooldown = 2
    }
    skill.효과 = effect
    skill.명중률 = `${effect.kind === 'status' ? effect.chance : 100}%`
    return skill
  }
  const rawPower = Math.max(20, Number(raw.데미지) || 70)
  const area = raw.전체공격 === true
  const heavy = rawPower >= 105
  // Accurate regular attacks, stronger burst attacks, and discounted power per area target.
  skill.데미지 = Math.round(rawPower * (area ? 0.85 : 1) / 5) * 5
  skill.명중률 = `${heavy ? 90 : area ? 95 : Math.max(95, Number.parseInt(raw.명중률) || 100)}%`
  skill.cooldown = heavy ? 2 : area || rawPower >= 80 ? 1 : 0
  if (raw.상태이상) skill.상태이상확률 = `${Math.min(30, Number.parseInt(raw.상태이상확률) || 20)}%`
  // Describe the new numbers in the shared tooltip instead of leaving obsolete raw prose.
  skill.효과설명 = `${area ? '상대 전체' : '상대 하나'}에게 ${skill.속성} 속성 ${skill.분류 === '특수형' ? '특수' : '물리'} 피해를 줍니다.${raw.상태이상 ? ` 명중 시 ${skill.상태이상확률} 확률로 ${raw.상태이상}. 보스에게는 상태이상 확률이 절반입니다.` : ''}`
  return skill
}

// The same named move can belong to multiple forms. Resolve power for its actual user;
// do not make an infant's shared move inherit its final form's power.
export function balanceSignatureSkill(skill, profile) {
  if (!skill || skill.효과 || skill.분류 === '보조형') return skill
  const exceptional = {
    '그랜드 크로스': 155, '세븐 헤븐즈': 135, '파라다이스 로스트': 160,
    '데드 ･ 오어 ･ 얼라이브': 165, '오메가 블레이드': 175,
    '퍼가토리얼 플레임': 175, '디바인 어톤먼트': 180,
  }
  const area = skill.전체공격 === true
  const sourcePower = skill.데미지 / (area ? .85 : 1)
  const burst = Math.max(-20, Math.min(30, (sourcePower - 70) * .55))
  const power = Math.round((exceptional[skill.기술명] ??
    Math.max(35, Math.min(175, (26 + profile.budget * .1 + burst) * (area ? .85 : 1)))) / 5) * 5
  const cooldown = power >= 165 ? 3 : power >= 120 ? 2 : power >= 85 || area ? 1 : 0
  return { ...skill, 데미지: power, cooldown, 명중률: `${power >= 120 ? 90 : area ? 95 : 100}%` }
}

export function balanceSpecies(raw, stage, skills) {
  const tuning = STAGE_TUNING[getDigimonTrainingStage(raw, stage)] ?? STAGE_TUNING[stage]
  const originalProfile = getLoreProfile(raw.이름)
  const investment = getEvolutionInvestment(raw.이름)
  const budget = Math.round(originalProfile.budget * (1 + investment.statBonus))
  const profile = { ...originalProfile, budget, cost: costForPower(budget) }
  const role = profile.role
  const stats = createLoreStats(profile)
  const encounterStats = createLoreStats(originalProfile)
  const encounterSkills = Object.fromEntries((raw.기술 ?? []).map(name => [name, balanceSignatureSkill(skills.get(name), originalProfile)]))
  const signatureSkills = Object.fromEntries(Object.entries(encounterSkills).map(([name, skill]) => {
    if (!skill || skill.효과 || skill.분류 === '보조형' || !investment.statBonus) return [name, skill]
    const power = investment.skillPower?.[name] ?? Math.max(skill.데미지, Math.min(200, Math.round(skill.데미지 * investment.skillMultiplier / 5) * 5))
    return [name, { ...skill, 데미지: power, cooldown: power >= 230 ? 4 : power >= 165 ? 3 : skill.cooldown }]
  }))
  const level = getEvolutionLevel(raw.이름, stage)
  // Support follows the species' combat identity rather than a name hash.
  const supportByBuild = {
    striker: ['어택 차지', '액셀 부스트'], bruiser: ['어택 차지', '헤이트 차지'],
    tank: ['헤이트 차지', '스테이터스 배리어'], fortress: ['스테이터스 배리어', '매직 리플렉트'],
    caster: ['매직 차지', '스펠 부스트'], artillery: ['매직 차지', '매직 리플렉트'],
    assassin: ['스피드 차지', '크리티컬 바인드'], skirmisher: ['스피드 차지', '리셋 보디'],
    holy: ['힐', '커스 배리어'], support: ['힐', '오라'], paladin: ['어택 차지', '커스 배리어'],
    duelist: ['어택 차지', '액셀 부스트'], hybrid: ['어택 차지', '스펠 부스트'],
    beast: ['어택 차지', '스피드 차지'], flame: ['매직 차지', '스펠 부스트'],
    aerial: ['스피드 차지', '매직 리플렉트'], gunner: ['매직 차지', '스피드 차지'],
    nature: ['힐', '오라'], slime: ['힐', '세이프티 가드'],
    machine: ['헤이트 차지', '어택 리플렉트'], calamity: ['매직 차지', '스펠 부스트'],
    balance: ['힐', '리셋 보디'],
  }
  const [support, advanced] = supportByBuild[profile.build] ?? [roleSupport[role][0], roleSupport[role][1][0]]
  const attachments = (raw.어티치먼트 ?? []).filter(entry => skills.has(entry.기술)).map((entry, index) => ({ ...entry,
    레벨: Math.min(entry.레벨, tuning.level + [0, 3, 6, 10, 15, 20][Math.min(index, 5)]) }))
  const first = { 레벨: tuning.level + 3, 기술: healerNames.has(raw.이름) ? (tuning.level >= 50 ? '엑스 힐' : '힐') : support }
  const second = { 레벨: tuning.level + 12, 기술: healerNames.has(raw.이름) ? (tuning.level >= 30 ? '리바이브' : '오라') : advanced }
  if (attachments.length > 1) attachments[1] = first
  else attachments.push(first)
  if (attachments.length > 4) attachments[4] = second
  else attachments.push(second)
  return { ...raw, ...stats, passiveId: getDigimonPassiveId(raw.이름), 전투역할: role,
    전투성향: profile.label, 야생전투설정: { ...encounterStats, 전투총합: originalProfile.budget, 기술설정: encounterSkills }, 설정설명: profile.note, 설정출처: profile.source,
    시작코스트: profile.cost, 전투총합: profile.budget, 기술설정: signatureSkills,
    진화가능: getEvolutionTargets(raw), 진화조건: { 레벨: level }, 어티치먼트: attachments }
}
