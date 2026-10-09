const bounded = (value, min, max) => Math.min(max, Math.max(min, value))
export function getQuestRoll(state) {
  const roll = state.explorationEvent?.questRoll
  if (Number.isFinite(roll) && roll >= 0 && roll < 1) return roll
  // Legacy unfinished events get a stable draw, including after a manual reload.
  const text = [state.trainerRunId, state.explorationEvent?.id, state.explorationEvent?.storyId].join('|')
  let hash = 2166136261
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return (hash >>> 0) / 4294967296
}
export function getQuestRisk(state, story, route) {
  if (story.special || route.battle || !(route.trust > 0 || route.regionTrust > 0 || route.expert || route.flag)) return null
  const units = (state.party ?? []).filter(unit => unit && !unit.isEgg && !unit.regionalSupport && unit.currentHp > 0)
  const expectedLevel = Math.max(1, Number.isFinite(state.levelCap) ? state.levelCap : state.currentStage ?? 1)
  const ranks = { 유아기: 0, 유년기: 0, 성장기: 1, 성숙기: 3, 아머체: 3, 하이브리드체: 4, 완전체: 5, 궁극체: 7, 초궁극체: 9 }
  const power = unit => bounded(Math.round((unit.level / expectedLevel) * 10 + ((unit.baseStatTotal ?? 300) - 300) / 35 +
    (ranks[unit.speciesStage] ?? 1)), 0, 22)
  const strongest = [...units].sort((a, b) => power(b) - power(a))[0]
  const strength = strongest ? power(strongest) : 0
  const matches = unit => story.specialties?.includes(unit.attribute ?? unit.speciesData?.속성)
  const expert = units.some(matches) || route.expert ? 10 : 0
  const reasons = []
  if (strength) reasons.push(strongest.name + ' 전투력 +' + strength + '%p')
  if (expert) reasons.push('속성 특기 +10%p')
  let equipment = 0
  for (const [id, name, bonus] of [['d-terminal', 'D-터미널', 6], ['d-scanner', 'D-스캐너', 6]]) {
    if (state.inventory?.[id] > 0) { equipment += bonus; reasons.push(name + ' +' + bonus + '%p') }
  }
  if (units.some(unit => unit.battleItems?.['crest-knowledge'] > 0)) { equipment += 5; reasons.push('지식의 문장 +5%p') }
  const pressure = Math.min(12, Math.floor((state.currentStage ?? 1) / 20))
  const successChance = bounded(65 - pressure + strength + expert + Math.min(12, equipment), 45, 95)
  return { successChance, chanceReasons: reasons, failureTrust: -1 }
}
export function failedQuestChoice(choice, story) {
  return { id: choice.id, title: choice.title + ' · 의뢰 실패', partnerId: choice.partnerId,
    goldCost: choice.goldCost, hpCost: choice.hpCost, success: false, trust: story.special ? 0 : -1, regionTrust: story.special ? 0 : -1,
    ending: story.special ? '시련을 마치지 못했다. 진화 아이템은 받지 못했지만 신뢰도는 변하지 않았다.'
      : '예상보다 어려운 문제를 해결하지 못했다. 준비에 쓴 자원은 돌아오지 않았고, 주민의 신뢰가 낮아졌다.' }
}
