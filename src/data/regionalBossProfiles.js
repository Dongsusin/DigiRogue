import { EXPANSION_BOSS_ROUTES, EXPANSION_MAP_BOSS_ROUTES } from './expansionEncounters.js'
// These routes reuse shipped, fully animated Digimon. Identities and habitats
// follow Digimon lore; phase thresholds and powers are rules for this fan game.
const hp = ratio => ({ kind: 'hp', ratio })
const power = (stats, extra = {}) => ({ stats, turns: 3, ...extra })
const tactic = (label, condition, effect) => ({ id: 'regional-instinct', label, condition, effect })
const shell = label => tactic(label, { kind: 'hits', category: '물리형', count: 2 }, { guards: { physical: 2 } })
const spirit = label => tactic(label, { kind: 'hits', category: '특수형', count: 2 }, { guards: { special: 2 } })
const fury = label => tactic(label, hp(.4), power({ attack: 1.2 }))
const focus = label => tactic(label, { kind: 'actions', count: 3 }, power({ specialAttack: 1.2 }))
const swift = label => tactic(label, hp(.5), power({ speed: 1.2 }, { clearStatus: true }))
const bloom = label => tactic(label, hp(.4), { healRatio: .08, clearStatus: true })
const route = (id, title, line, themes, rule) => ({ id, title, line, themes, rule })

export const REGIONAL_BOSS_ROUTES = Object.freeze([
  route('lion-guard', '초원의 사자 수호자', ['에렉몬','레오몬','화이트레오몬','샤벨레오몬'], ['town','earth','ice','wind'], fury('수호자의 투지')),
  route('armored-saurian', '바위 갑옷의 돌파', ['아르마몬','모노크로몬','트리케라몬','반쵸록몬'], ['earth','ancient'], shell('암석 외피')),
  route('goblin-chief', '오거 무리의 우두머리', ['고부리몬','우가몬','디지타몬','타이타몬'], ['earth','waste','ancient'], fury('오거의 분노')),
  route('scrap-monkey', '폐데이터를 모으는 왕', ['츄몬','스카몬','에테몬','메탈에테몬'], ['waste','town','earth'], shell('금속성 폐데이터')),
  route('sea-serpent', '깊은 해류의 기계룡', ['베타몬','시드라몬','메가시드라몬','메탈시드라몬'], ['water','ice'], swift('해류 돌파')),
  route('marsh-chorus', '늪과 호수의 합창', ['올챙몬','개굴몬','왕개굴몬','플레시오몬'], ['water','forest','waste'], focus('심해의 음파')),
  route('moon-watch', '물 위에 비친 달의 파수꾼', ['루나몬','레키스몬','크레세몬','디아나몬'], ['water','ice','holy','dark'], spirit('달빛의 가호')),
  route('snow-beast', '설원의 맹수', ['베어몬','그리즈몬','아이언레오몬','헤비레오몬'], ['ice','earth','machine'], shell('단단한 전투 장갑')),
  route('puppet-root', '깨어난 숲의 고목', ['머슈몬','우드몬','쥬레이몬','피노키몬'], ['forest','dark'], bloom('뿌리의 생명력')),
  route('mantis-swarm', '곤충 군락의 돌격대', ['추추몬','스팅몬','다이노몬','반쵸스팅몬'], ['forest','wind','ancient'], fury('군락의 반격')),
  route('royal-hive', '기계 벌집의 추격자', ['아기벌몬','말벌몬','캐논벌몬','타이거베스파몬'], ['forest','wind','machine','network'], swift('벌집의 경보')),
  route('steel-wing', '강철 날개의 요격', ['쟈자몬','쟈자드몬','쟈자리히몬','메탈릭드라몬'], ['machine','fire','wind','network'], focus('요격 연산')),
  route('living-blade', '스스로 단련하는 검', ['즈바몬','즈바이거몬','듀라몬','듀란다몬'], ['machine','holy','town'], fury('칼날의 결의')),
  route('factory-watch', '시설의 방위 계보', ['톱니몬','가드로몬','안드로몬','하이안드로몬'], ['machine','network','town','waste'], spirit('침입 패턴 분석')),
  route('net-infection', '네트워크를 잠식하는 군체', ['케라몬','크리사리몬','인펠몬','디아블로몬'], ['network','dark','machine'], swift('증식 가속')),
  route('cyber-hunter', '침입자를 쫓는 사이버 사냥꾼', ['모노드라몬','스트라이크드라몬','사이버드라몬','저스티몬'], ['network','machine','earth'], shell('전투 데이터 축적')),
  route('data-devourer', '금지된 데이터의 포식자', ['알카디몬[성장기]','알카디몬[성숙기]','알카디몬[완전체]','알카디몬'], ['network','dark','ancient'], focus('흡수 데이터 해방')),
  route('night-gunslinger', '어둠 속의 저격수', ['임프몬','위자몬','팬텀몬','베르제브몬'], ['dark','waste','fire'], focus('어둠의 마력')),
  route('vampire-court', '흡혈귀의 검은 궁정', ['드라큐몬','상굴몬','마타돌몬','그란드라큐몬'], ['dark','forest'], bloom('불멸의 혈맥')),
  route('shadow-wolf', '검은 늑대의 영역', ['파피몬(흑)','가루몬(흑)','워가루몬(흑)','블랙메탈가루몬'], ['dark','ice','wind','network'], swift('암흑의 추격')),
  route('volcanic-drake', '용암을 두른 화산룡', ['보보몬','라보보몬','라보가리타몬','볼케닉드라몬'], ['fire','ancient','earth'], focus('마그마 축적')),
  route('dragon-samurai', '갑옷을 두른 동방의 용', ['류우다몬','긴류우몬','히샤류우몬','오류우몬'], ['ancient','holy','earth'], shell('무사의 갑주')),
  route('ground-dragon', '대지를 가르는 녹색 용', ['드라코몬','코어드라몬(녹)','그라운드라몬','브레이크드라몬'], ['ancient','earth','machine'], fury('대지 분쇄')),
  route('sky-dragon', '창공을 가르는 푸른 용', ['드라코몬','코어드라몬(청)','윙드라몬','슬레이어드라몬'], ['ancient','wind','water'], swift('창공의 기동')),
  route('gentle-guardian', '성역을 지키는 온화한 수호자', ['로프몬','토리에몬','안티라몬','케루비몬(선)'], ['holy','forest','town'], bloom('성역의 회복')),
  route('holy-beast', '빛을 인도하는 성수', ['쿠다몬','레파몬','치린몬','슬레이프몬'], ['holy','ice','wind','ancient'], spirit('성수의 방벽')),
  route('sword-saint', '성기사의 검술 시험', ['헉몬','바오헉몬','세이버헉몬','제스몬'], ['holy','machine','ancient','fire'], fury('수행의 결실')),
  route('star-patrol', '별빛 순찰대', ['스타몬즈','스타몬','슈퍼스타몬','프린스콩알몬'], ['town','holy','network'], focus('별빛 집약')),
  route('raven-sentinel', '숲과 산의 검은 파수꾼', ['팔코몬','펙크몬','야타가라몬','레이브몬'], ['forest','wind','dark'], swift('그림자 날개')),
])

const ALL_REGIONAL_ROUTES = [...REGIONAL_BOSS_ROUTES, ...EXPANSION_BOSS_ROUTES]

const shared = route => ({
  regionRoute: route.id, title: route.title, themes: route.themes, emblem: null,
  ...(route.maps ? { maps: route.maps, entryStages: route.entryStages } : {}),
  source: null, speech: '영역의 우두머리가 길을 막아섰다.', rules: [route.rule],
  phaseLabel: '진화', finalPower: power({ attack: 1.15, specialAttack: 1.15 }),
})
export const REGIONAL_BOSS_PROFILES = Object.freeze(ALL_REGIONAL_ROUTES.flatMap(route => [
  { ...shared(route), id: 'regional-' + route.id, kind: 'lineage', name: route.line[0],
    line: route.line, minStage: route.minStage ?? 10, maxStage: route.maxStage ?? 190 },
  { ...shared(route), id: 'regional-' + route.id + '-wild', kind: 'wild', name: route.title,
    line: route.line.slice(1), minStage: route.entryStages?.[1] ?? 20, maxStage: route.maxStage ?? 190,
    ...(route.entryStages ? { entryStages: route.entryStages.slice(1) } : {}) },
]))
export const REGIONAL_RIVAL_PROFILES = Object.freeze(ALL_REGIONAL_ROUTES.map(route => ({
  ...shared(route), id: 'regional-' + route.id, kind: 'rival', name: route.line[0],
  line: route.line, minStage: route.minStage ? Math.max(8,route.minStage-2) : 8, maxStage: 199, title: '야생 라이벌', emblem: '라이벌',
})))

// Explicit habitats distinguish maps that share a broad biome. Each list has
// multiple full routes, so early, late and endless-cycle encounters stay local.
const BASE_MAP_BOSS_ROUTES = {
  '시작의마을': ['lion-guard','living-blade','factory-watch','star-patrol','gentle-guardian','taichi','mimi','takeru','security','bancho-justice','adventure-duo','scrap-crown'],
  '미하라시 산': ['lion-guard','raven-sentinel','sky-dragon','holy-beast','sora','ruki','insect-lord','valkyrie-watch','white-tiger','ceres-garden','sleipmon-trial','tohma','royal-wasp'],
  기어사바나: ['lion-guard','armored-saurian','goblin-chief','ground-dragon','taichi','masaru','etemon-show','white-tiger','dorubick-fire'],
  용의눈호수: ['sea-serpent','marsh-chorus','moon-watch','sky-dragon','joe','sea-dragon','neptune-trident','plesio-mirage','moon-hunt','orochi-pond'],
  '네트의 바다': ['sea-serpent','moon-watch','sky-dragon','marsh-chorus','joe','yamato','sea-dragon','neptune-trident','azure'],
  '메탈 엠파이어': ['steel-wing','living-blade','factory-watch','cyber-hunter','snow-beast','security','machine-dragon','rust-tyrannomon','suijin-foundry','royal-wasp','alien-contact','tohma'],
  '나이트메어 솔저스': ['night-gunslinger','vampire-court','shadow-wolf','data-devourer','hikari','vampire','clown','sleeping-demon'],
  비틀랜드: ['mantis-swarm','royal-hive','puppet-root','koushiro','insect-lord','royal-wasp','tortoise'],
  '쓰레기의 산': ['scrap-monkey','goblin-chief','factory-watch','night-gunslinger','mimi','black-gears','etemon-show','scrap-crown'],
  '지하 하수도': ['scrap-monkey','marsh-chorus','factory-watch','night-gunslinger','goblin-chief','black-gears','scrap-crown','orochi-pond'],
  '윈드 가디언즈': ['raven-sentinel','sky-dragon','royal-hive','holy-beast','sora','ruki','insect-lord','valkyrie-watch','white-tiger'],
  '코덱 유적': ['holy-beast','sword-saint','gentle-guardian','dragon-samurai','star-patrol','takeru','hikari','security','craniamon','alien-contact'],
  '아이스 생츄어리': ['moon-watch','snow-beast','holy-beast','lion-guard','shadow-wolf','yamato','joe','sleeping-demon','sleipmon-trial','white-tiger','moon-hunt','tohma'],
  무한산: ['armored-saurian','dragon-samurai','ground-dragon','sky-dragon','lion-guard','taichi','dorubick-fire','huanglong'],
  '오버델 묘지': ['vampire-court','night-gunslinger','puppet-root','shadow-wolf','hikari','vampire','clown','black-gears'],
  '어셈블러 타워': ['living-blade','steel-wing','factory-watch','cyber-hunter','net-infection','security','alien-contact','suijin-foundry'],
  '부트 화산': ['volcanic-drake','steel-wing','sword-saint','night-gunslinger','taichi','takato','masaru','volcano','dorubick-fire','vermilion'],
  '이블 포레스트': ['puppet-root','vampire-court','mantis-swarm','raven-sentinel','mimi','yoshino','puppet-forest','orochi-pond'],
  '다크 웹': ['net-infection','data-devourer','cyber-hunter','shadow-wolf','factory-watch','network-hive','alien-contact','machine-dragon'],
  '다크 에리어': ['night-gunslinger','vampire-court','shadow-wolf','data-devourer','hikari','vampire','clown','sleeping-demon','network-hive'],
  코퀴토스: ['moon-watch','shadow-wolf','snow-beast','holy-beast','yamato','joe','sleeping-demon','sleipmon-trial'],
  '센트럴 타운': ['star-patrol','living-blade','factory-watch','lion-guard','gentle-guardian','jen','adventure-duo','bancho-justice','scrap-crown'],
  '어비스 에리어': ['data-devourer','vampire-court','night-gunslinger','net-infection','shadow-wolf','clown','network-hive','orochi-pond'],
  '기어 포레스트': ['royal-hive','mantis-swarm','puppet-root','raven-sentinel','gentle-guardian','koushiro','mimi','royal-wasp','ceres-garden'],
  '팩토리얼 에리어': ['steel-wing','factory-watch','cyber-hunter','living-blade','ground-dragon','security','rust-tyrannomon','suijin-foundry'],
  '코즈믹 에리어': ['star-patrol','moon-watch','living-blade','holy-beast','dragon-samurai','takeru','alien-contact','craniamon'],
  '가디언 팰리스': ['sword-saint','holy-beast','dragon-samurai','gentle-guardian','living-blade','takato','hikari','craniamon','adventure-duo'],
  '다크 필드': ['shadow-wolf','night-gunslinger','data-devourer','vampire-court','raven-sentinel','hikari','black-gears','vampire','clown'],
  '겐시 대륙': ['ground-dragon','sky-dragon','dragon-samurai','armored-saurian','goblin-chief','taichi','rust-tyrannomon','azure','huanglong'],
  '아시노 섬': ['sea-serpent','marsh-chorus','sky-dragon','moon-watch','joe','yamato','neptune-trident','plesio-mirage','tortoise'],
  선공계: ['gentle-guardian','holy-beast','dragon-samurai','sword-saint','star-patrol','takeru','hikari','huanglong'],
  용정궁: ['dragon-samurai','ground-dragon','sky-dragon','volcanic-drake','armored-saurian','taichi','azure','vermilion','huanglong'],
  사규산: ['armored-saurian','lion-guard','goblin-chief','ground-dragon','snow-beast','taichi','bancho-justice','white-tiger','huanglong'],
  황천: ['night-gunslinger','vampire-court','data-devourer','shadow-wolf','net-infection','hikari','vampire','clown','sleeping-demon'],
}
export const MAP_BOSS_ROUTES = Object.freeze(Object.fromEntries(Object.entries(BASE_MAP_BOSS_ROUTES).map(([name,routes])=>[name,[...routes,...(EXPANSION_MAP_BOSS_ROUTES[name]??[])]])))
