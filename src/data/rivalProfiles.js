import { RIVAL_VARIANTS } from './rivalVariants.js'
import { REGIONAL_RIVAL_PROFILES } from './regionalBossProfiles.js'

// IDs retain compatibility with earlier runs; each rival is a wild Digimon lineage.
const rival = (id, line, themes) => ({
  id, name: line[0], kind: 'rival', line, themes, minStage: 8, maxStage: 199,
  title: '야생 라이벌', emblem: '라이벌', rules: [], phaseLabel: '진화',
})

export const RIVAL_LINEAGES = Object.freeze([
  rival("taichi", ["아구몬","그레이몬","메탈그레이몬","워그레이몬"], ["town","earth","fire","ancient"]),
  rival("yamato", ["파피몬","가루몬","워가루몬","메탈가루몬"], ["ice","water","wind","town"]),
  rival("koushiro", ["텐타몬","캅테리몬","아트라캅테리몬","헤라클레스캅테리몬"], ["machine","forest","network"]),
  rival("sora", ["피요몬","버드라몬","가루다몬","페닉스몬"], ["wind","fire","forest"]),
  rival("mimi", ["팔몬","니드몬","릴리몬","로제몬"], ["forest","earth","town","waste"]),
  rival("joe", ["쉬라몬","원뿔몬","쥬드몬","바이킹몬"], ["water","ice"]),
  rival("takeru", ["파닥몬","엔젤몬","홀리엔젤몬","세라피몬"], ["holy","wind","town"]),
  rival("hikari", ["플롯트몬","가트몬","엔젤우몬","오파니몬"], ["holy","dark","town"]),
  rival("takato", ["길몬","그라우몬","메가로그라우몬","듀크몬","듀크몬[크림슨]"], ["fire","earth","holy"]),
  rival("ruki", ["레나몬","구미호몬","도사몬","샤크라몬"], ["wind","holy","forest"]),
  rival("jen", ["테리어몬","가르고몬","래피드몬","세인트가르고몬"], ["machine","wind","town"]),
  rival("masaru", ["아구몬","지오그레이몬","라이즈그레이몬","샤인그레이몬","샤인그레이몬[버스트]"], ["fire","earth","machine"]),
  rival("tohma", ["가오몬","가오가몬","마하가오가몬","미라쥬가오가몬","미라쥬가오가몬[버스트]"], ["machine","ice","wind"]),
  rival("yoshino", ["라라몬","해바라기몬","라일라몬","로제몬","로제몬[버스트]"], ["forest","town","holy"]),
  rival("daisuke", ["브이몬","엑스브이몬","파일드라몬","황제드라몬[파이터]"], ["town","fire","ancient"]),
  rival("takuya", ["아그니몬","브리트라몬","카이젤그레이몬","스사노오몬"], ["fire","earth","ancient"]),
  rival("taiki", ["샤우트몬","샤우트몬[X2]","샤우트몬[X4]","오메가샤우트몬"], ["machine","town","fire"]),
  rival("tagiru", ["가무드라몬","아레스타드라몬","아레스타드라몬","아레스타드라몬"], ["network","wind","earth"]),
  rival("ikuto", ["팔코몬","펙크몬","야타가라몬","레이브몬"], ["forest","wind","dark"]),
  rival("ami", ["팔몬","니드몬","릴리몬","로제몬"], ["town","forest","network"]),
  rival("takumi", ["톱니몬","가드로몬","안드로몬","하이안드로몬"], ["network","machine","town"]),
  rival("arata", ["케라몬","크리사리몬","인펠몬","디아블로몬"], ["network","dark","machine"]),
  rival("nokia", ["아구몬","그레이몬","메탈그레이몬","워그레이몬"], ["town","earth","holy"]),
  rival("keisuke", ["베타몬","시드라몬","메가시드라몬","메탈시드라몬"], ["network","water","town"]),
  rival("erika", ["추추몬","후디에몬","다이노몬","반쵸스팅몬"], ["network","forest","holy"]),
  rival("ryuji", ["모노드라몬","스트라이크드라몬","사이버드라몬","저스티몬"], ["machine","network","dark"]),
  rival("chitose", ["아르마몬","황금아르마몬","토우몬","바이킹몬"], ["earth","town","water"]),
  rival("fei", ["아기벌몬","말벌몬","캐논벌몬","타이거베스파몬"], ["forest","wind","network"]),
  rival("jimiken", ["피코데블몬","데블몬","블루메라몬","볼트몬"], ["waste","dark","fire"]),
  rival("mirei", ["플롯트몬","가트몬","엔젤우몬","마스테몬"], ["holy","dark","network"]),
  rival("rina", ["브이몬","브이드라몬","에어로브이드라몬","알포스브이드라몬"], ["wind","water","ancient"]),
  rival("sayo", ["루나몬","레키스몬","크레세몬","디아나몬"], ["dark","water","ice"]),
  rival("yu", ["알카디몬[성장기]","알카디몬[성숙기]","알카디몬[완전체]","알카디몬"], ["dark","network","ancient"]),
  rival("yuugo", ["톱니몬","가드로몬","메탈티라노몬","파워드라몬"], ["network","machine","dark"]),
  rival("yuuko", ["아구몬(흑)","그레이몬(청)","스컬그레이몬","블랙워그레이몬"], ["dark","machine","town"]),
  rival("kouta", ["길몬","그라우몬","메가로그라우몬","듀크몬"], ["fire","earth","town"]),
  rival("himari", ["플롯트몬","가트몬","엔젤우몬","오파니몬"], ["holy","forest","town"]),
  rival("mameo", ["아구몬","티라노몬","콩알몬","프린스콩알몬"], ["earth","machine","ancient"]),
  rival("shiki", ["피요몬","버드라몬","가루다몬","페닉스몬"], ["wind","fire","forest"]),
  rival("takuto", ["파피몬","가루몬","워가루몬","메탈가루몬"], ["ice","water","earth"]),
  rival("shoma", ["파피몬(흑)","가루몬(흑)","워가루몬(흑)","오메가몬[즈왈트-D]"], ["dark","network","ancient"]),
  rival("akiho", ["피요몬","버드라몬","가루다몬","페닉스몬"], ["forest","wind","holy"]),
  rival("taiga", ["아구몬","그레이몬","메탈그레이몬","워그레이몬"], ["town","fire","ancient"]),
])

export const RIVAL_PROFILES = Object.freeze([...RIVAL_LINEAGES, ...REGIONAL_RIVAL_PROFILES, ...RIVAL_VARIANTS])
export const RIVAL_PROFILE_BY_ID = new Map(RIVAL_PROFILES.map(profile => [profile.id, profile]))
