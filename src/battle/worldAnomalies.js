// Temporary disturbances of a region's data. Numeric effects are fan-game rules.
export const WORLD_ANOMALIES = Object.freeze([
  { id: 'power-surge', name: '전자 폭풍', color: '#e8cf67', description: '번개 기술 +12% · 마비 성공률 +8%p', attributes: ['번개', '강철'], damage: { 번개: 1.12 }, status: '마비', statusBonus: 8 },
  { id: 'packet-fog', name: '데이터 안개', color: '#a7b9dd', description: '공격 명중 −8%p · 어둠 기술 +10%', attributes: ['어둠'], damage: { 어둠: 1.1 }, accuracy: -8 },
  { id: 'life-stream', name: '생명 데이터 순환', color: '#8ad7a4', description: '회복 기술 +15% · 나무 기술 +10%', attributes: ['나무', '빛'], damage: { 나무: 1.1 }, healing: 1.15 },
  { id: 'thermal-overflow', name: '열 데이터 과부하', color: '#efab76', description: '화염 기술 +12% · 화상 성공률 +8%p', attributes: ['화염', '흙'], damage: { 화염: 1.12 }, status: '화상', statusBonus: 8 },
  { id: 'frozen-packets', name: '빙결 패킷', color: '#9ed9f0', description: '얼음 기술 +12% · 행동불능 성공률 +8%p', attributes: ['얼음'], damage: { 얼음: 1.12 }, status: '행동불능', statusBonus: 8 },
  { id: 'net-tide', name: '네트워크 조류', color: '#77cde7', description: '물 기술 +12% · 화염 기술 −10%', attributes: ['물'], damage: { 물: 1.12, 화염: .9 } },
  { id: 'wind-tunnel', name: '기류 데이터 가속', color: '#a7d7e7', description: '바람 기술 +12% · 바람 기술 명중 +5%p', attributes: ['바람'], damage: { 바람: 1.12 }, accuracyAttribute: '바람', accuracy: 5 },
  { id: 'dark-leak', name: '다크 에리어 누출', color: '#c69be9', description: '어둠 기술 +12% · 회복 기술 −10%', attributes: ['어둠'], damage: { 어둠: 1.12 }, healing: .9 },
])
export const ANOMALY_STAGE_SPAN = 5
const hash = value => { let h = 2166136261; for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
export function getWorldAnomaly(state, field) {
  if (!state || !field) return null
  const segment = Math.floor((state.currentStage - 1) / ANOMALY_STAGE_SPAN)
  const existing = state.worldAnomaly
  if (existing?.map === state.currentMap && existing.segment === segment) {
    return WORLD_ANOMALIES.find(rule => rule.id === existing.id && rule.attributes.some(a => field.attributes.includes(a))) ?? null
  }
  const seed = hash(`${state.trainerRunId ?? 'legacy'}:${state.currentMap}:${segment}`)
  if (seed % 100 >= 60) return null
  const options = WORLD_ANOMALIES.filter(rule => rule.attributes.some(a => field.attributes.includes(a)))
  return options.length ? options[Math.floor(seed / 100) % options.length] : null
}
export const anomalyOf = unit => WORLD_ANOMALIES.find(rule => rule.id === unit?.battleAnomaly)
export const getAnomalyDamage = (unit, skill) => anomalyOf(unit)?.damage?.[skill?.속성] ?? 1
export const getAnomalyHealing = unit => anomalyOf(unit)?.healing ?? 1
export function getAnomalyAccuracy(unit, skill) {
  const rule = anomalyOf(unit)
  return rule && (!rule.accuracyAttribute || skill?.속성 === rule.accuracyAttribute) ? rule.accuracy ?? 0 : 0
}
export function getAnomalyStatusChance(unit, status, chance) {
  const rule = anomalyOf(unit)
  return Math.min(100, Math.max(0, chance + (rule?.status === status ? rule.statusBonus : 0)))
}
