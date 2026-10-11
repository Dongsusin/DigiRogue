// Keep the guide, damage resolver, previews and AI on the same matchup rules.
export const typeAdvantageMap = Object.freeze({
  데이터: ['백신'], 백신: ['바이러스'], 바이러스: ['데이터'], 프리: ['불명'], 불명: ['프리'],
})
export const attributeAdvantageMap = Object.freeze({
  불: ['나무', '흙'], 나무: ['흙', '번개'], 흙: ['번개', '강철'], 번개: ['강철', '얼음'],
  강철: ['얼음', '바람'], 얼음: ['바람', '어둠'], 바람: ['어둠', '빛'], 어둠: ['빛', '물'],
  빛: ['물', '불'], 물: ['불', '나무'],
})
const attributeAliases = { 화염: '불', 전기: '번개', 땅: '흙' }
const relation = (chart, attack, defend) => {
  if (!attack || !defend || attack === '무' || defend === '무') return 0
  if (chart[attack]?.includes(defend)) return 1
  if (chart[defend]?.includes(attack)) return -1
  return 0
}
export function getMatchupResult({ attackerType, skillAttribute, defenderType, defenderAttribute }) {
  const typeRelation = relation(typeAdvantageMap, attackerType, defenderType)
  const attributeRelation = relation(attributeAdvantageMap,
    attributeAliases[skillAttribute] ?? skillAttribute, attributeAliases[defenderAttribute] ?? defenderAttribute)
  const typeMultiplier = typeRelation > 0 ? 2 : typeRelation < 0 ? .5 : 1
  const attributeMultiplier = attributeRelation > 0 ? 1.5 : attributeRelation < 0 ? .75 : 1
  return { typeRelation, attributeRelation, multiplier: typeMultiplier * attributeMultiplier }
}
