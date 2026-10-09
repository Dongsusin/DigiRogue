import { getWorldAnomaly, ANOMALY_STAGE_SPAN } from './worldAnomalies.js'

const field = (name, attributes, types = []) => ({ name, attributes, types })

export const MAP_ENVIRONMENTS = {
  '시작의마을': field('생명의 둥지', ['빛', '나무'], ['프리']),
  '센트럴 타운': field('안정된 네트워크', ['무', '강철'], ['데이터']),
  '기어 포레스트': field('숲의 생명력', ['나무'], ['데이터']),
  '이블 포레스트': field('그늘진 수림', ['나무', '어둠'], ['바이러스']),
  '비틀랜드': field('곤충의 영역', ['나무', '번개'], ['데이터']),
  '기어사바나': field('야생의 대지', ['흙', '바람'], ['프리']),
  '겐시 대륙': field('태고의 열기', ['화염', '흙'], ['프리']),
  '메탈 엠파이어': field('기계 제국', ['강철', '번개'], ['바이러스']),
  '팩토리얼 에리어': field('공장 전력', ['강철', '번개'], ['데이터']),
  '어셈블러 타워': field('연산 증폭', ['강철'], ['데이터']),
  '쓰레기의 산': field('폐기 데이터', ['어둠', '흙'], ['바이러스']),
  '지하 하수도': field('탁한 수로', ['물', '어둠'], ['바이러스']),
  '코덱 유적': field('고대의 기록', ['빛', '흙'], ['데이터']),
  '용정궁': field('용의 공명', ['화염', '물'], ['백신']),
  '가디언 팰리스': field('수호의 빛', ['빛', '강철'], ['백신']),
  '사규산': field('대지의 맥동', ['흙', '바람'], ['데이터']),
  '네트의 바다': field('푸른 해류', ['물'], ['데이터']),
  '용의눈호수': field('깊은 수맥', ['물', '얼음'], ['백신']),
  '아시노 섬': field('바닷바람', ['물', '바람'], ['프리']),
  '어비스 에리어': field('심해 압력', ['물', '어둠'], ['바이러스']),
  '부트 화산': field('용암의 열기', ['화염', '흙'], ['바이러스']),
  '무한산': field('산정의 기류', ['흙', '바람'], ['백신']),
  '아이스 생츄어리': field('빙결의 성역', ['얼음', '빛'], ['백신']),
  '코퀴토스': field('혹한의 심연', ['얼음', '어둠'], ['바이러스']),
  '다크 에리어': field('어둠의 침식', ['어둠'], ['바이러스']),
  '다크 웹': field('오염된 통신망', ['어둠', '번개'], ['바이러스']),
  '다크 필드': field('암흑의 대지', ['어둠', '흙'], ['바이러스']),
  '나이트메어 솔저스': field('악몽의 기운', ['어둠'], ['불명']),
  '오버델 묘지': field('남겨진 영혼', ['어둠', '빛'], ['바이러스']),
  '황천': field('경계의 공명', ['어둠', '빛'], ['불명']),
  '미하라시 산': field('높은 바람길', ['바람'], ['백신']),
  '선공계': field('맑은 천공', ['빛', '바람'], ['백신']),
  '윈드 가디언즈': field('폭풍의 날개', ['바람', '번개'], ['데이터']),
  '코즈믹 에리어': field('우주의 파동', ['빛', '어둠'], ['불명']),
}

const aliases = { 불: '화염', 전기: '번개', 땅: '흙', 무속성: '무' }
export function getEnvironmentMultiplier(unit, skill) {
  const field = MAP_ENVIRONMENTS[unit?.battleMap]
  if (!field || skill?.효과 || skill?.분류 === '보조형') return 1
  const attribute = aliases[skill?.속성] ?? skill?.속성
  return Math.min(1.25, (field.attributes.includes(attribute) ? 1.15 : 1) * (field.types.includes(unit.type) ? 1.08 : 1))
}

export function applyMapEnvironment(state) {
  if (!state) return state
  const anomaly = getWorldAnomaly(state, MAP_ENVIRONMENTS[state.currentMap])
  const worldAnomaly = { id: anomaly?.id ?? null, map: state.currentMap, segment: Math.floor((state.currentStage - 1) / ANOMALY_STAGE_SPAN) }
  const apply = unit => unit && !unit.isEgg ? { ...unit, battleMap: state.currentMap, battleAnomaly: anomaly?.id ?? null } : unit
  const party = (state.party ?? []).map(apply), enemies = (state.enemies ?? []).map(apply)
  return { ...state, worldAnomaly, party, enemies,
    player: party.find(unit => unit?.id === state.player?.id) ?? apply(state.player) }
}

export function describeEnvironment(mapName) {
  const field = MAP_ENVIRONMENTS[mapName]
  return field ? `${field.attributes.join('·')} 기술 피해 +15% · ${field.types.join('·')} 타입 피해 +8% · 아군·적 공통` : ''
}
