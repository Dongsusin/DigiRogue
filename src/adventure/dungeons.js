import maps from '../../data/map.json' with { type: 'json' }
import manifest from '../data/digimonModelManifest.json' with { type: 'json' }
import { MAP_EVENT_THEMES } from './regionalEvents.js'

const locations = {
  '시작의마을': '둥지 아래의 훈련 회랑', '센트럴 타운': '봉쇄된 통신 지하실',
  '기어 포레스트': '톱니뿌리의 깊은 숲', '이블 포레스트': '검은 수액의 동굴',
  '비틀랜드': '여왕의 수목 둥지', '기어사바나': '메마른 지층의 굴', '겐시 대륙': '태고의 발자국 계곡',
  '메탈 엠파이어': '제국의 비밀 병기고', '팩토리얼 에리어': '과부하 격리 공장', '어셈블러 타워': '닫힌 연산 층',
  '쓰레기의 산': '폐기 코드 저장고', '지하 하수도': '막힌 정화 통로',
  '코덱 유적': '지워진 기록의 석실', '용정궁': '용의 시험 회랑', '가디언 팰리스': '수호자의 봉인실', '사규산': '모래 아래의 제단',
  '네트의 바다': '침몰한 패킷 항로', '용의눈호수': '호수 밑의 용맥', '아시노 섬': '산호 아래의 수로', '어비스 에리어': '심해의 신호 구덩이',
  '부트 화산': '용암 심장부', '무한산': '산정 아래의 균열', '아이스 생츄어리': '얼어붙은 기도실', '코퀴토스': '빙벽 속의 기억',
  '다크 에리어': '검은 기어의 심층', '다크 웹': '잠긴 감염 서버', '다크 필드': '빛을 삼킨 협곡',
  '나이트메어 솔저스': '되풀이되는 악몽', '오버델 묘지': '잊힌 이름의 납골당', '황천': '귀환 신호의 경계',
  '미하라시 산': '구름 아래의 바람굴', '선공계': '천공의 중계 성소', '윈드 가디언즈': '폭풍의 눈', '코즈믹 에리어': '별빛의 데이터 균열',
}
const themes = {
  town: ['토이아구몬', ['빛', '강철'], '주민들의 훈련 기록이 오래된 통로를 지키고 있다.'],
  forest: ['레오몬', ['나무', '흙'], '덩굴에 묻힌 회랑 안쪽에서 야생 디지몬의 발자국이 이어진다.'],
  factory: ['가드로몬', ['강철', '번개'], '끊긴 정비 신호를 따라 방어 기체가 봉쇄한 심층 구역으로 향한다.'],
  ruins: ['위자몬', ['빛', '흙'], '오래된 기록을 지키는 수호자들이 봉인 뒤에서 응답한다.'],
  water: ['쉬라몬', ['물', '얼음'], '바닥으로 가라앉은 보급 신호를 되찾으려면 깊은 수로를 지나야 한다.'],
  volcano: ['메라몬', ['화염', '흙'], '과열된 데이터가 지층 안에 고여 통로를 지키는 디지몬을 자극했다.'],
  ice: ['베어몬', ['얼음', '빛'], '빙벽 너머에는 돌아오지 않은 탐사대의 보급함이 남아 있다.'],
  dark: ['고스몬', ['어둠', '빛'], '가짜 귀환 신호가 길을 가린다. 두 통로를 돌파해야 진짜 불빛에 닿는다.'],
  sky: ['호크몬', ['바람', '번개'], '끊긴 중계기 너머에서 폭풍을 견딘 오래된 기록이 반짝인다.'],
}

export const DUNGEON_STORIES = Object.entries(locations).map(([mapName, title]) => {
  const theme = MAP_EVENT_THEMES[mapName], [npc, specialties, opening] = themes[theme]
  return { id: `dungeon-${Object.keys(locations).indexOf(mapName)}`, theme, maps: [mapName], npc, specialties,
    title, kind: '특별 던전', dungeon: true, opening,
    dialogue: '안쪽에서는 바로 쉴 수 없어. 두 번의 전투를 버틸 준비가 됐다면 보급함까지 함께 가 보자.',
    routes: [
      { id: 'dungeon', title: '심층 구역에 도전하기', ending: '두 통로가 열리고 보급 신호가 돌아왔다. 남겨진 보급함에서 카드와 탐사 보수를 발견했다.',
        battle: { dungeon: true }, goldReward: 1.6, randomCards: 2, trust: 1 },
      { id: 'observe', title: '입구의 흔적을 분석하기', ending: '안쪽으로 들어가지 않고 주변 디지몬의 흔적을 정리했다.', analysis: 20 },
      { id: 'rest', title: '안내자와 안전한 길로 돌아가기', ending: '안내자와 함께 안전한 길을 찾아 잠깐 쉬었다. 다음 탐사를 위한 여유를 되찾았다.', heal: .1, trust: 1 },
    ] }
})

export function createDungeonSpec(state) {
  const stage = state.currentStage
  const group = stage <= 10 ? 1 : stage <= 30 ? 2 : stage <= 50 ? 3 : stage <= 70 ? 4 : stage <= 90 ? 5 : 6
  const groups = maps[state.currentMap]?.등장디지몬 ?? {}
  const valid = names => (names ?? []).filter(name => manifest[name])
  const pool = valid(groups[group])
  const higher = valid(groups[Math.min(6, group + 1)])
  const seed = [...state.currentMap].reduce((sum, char) => sum + char.charCodeAt(0), stage)
  const pick = (list, offset) => list[(seed + offset) % list.length]
  const count = Math.min(2, (state.party ?? []).filter(unit => !unit.isEgg && unit.currentHp > 0).length)
  const opponents = Array.from({ length: count }, (_, index) => pick(pool, index))
  const guardianPool = higher.length ? higher : pool
  const waves = [
    { opponents, levelDelta: 1, guards: {} },
    { opponents: [pick(guardianPool, 3)], levelDelta: 2, guards: stage >= 15 ? { special: 2 } : {} },
  ]
  return { ...waves[0], dungeon: true, waves,
    rule: '2연전 · 전투 사이 자동 회복 없음 · 완주 시 무작위 카드 2장과 탐사 보수' }
}
