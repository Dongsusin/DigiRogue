import habitats from './expansionHabitats.json' with {type:'json'}
// Habitat and timing are game rules. Each line is an existing playable evolution path.
const hit={kind:'hits',category:'물리형',count:2},action={kind:'actions',count:2},low={kind:'hp',ratio:.4}
const effects={
 fire:{condition:low,effect:{clearStatus:true,stats:{specialAttack:1.16}}},
 armor:{condition:hit,effect:{guards:{physical:2}}},
 aim:{condition:action,effect:{stats:{specialAttack:1.16}}},
 swift:{condition:{kind:'miss'},effect:{stats:{speed:1.2}}},
 heal:{condition:low,effect:{healRatio:.1,clearStatus:true}},
 holy:{condition:{kind:'status'},effect:{clearStatus:true,guards:{status:2}}},
 rage:{condition:low,effect:{stats:{attack:1.16}}},
 dark:{condition:action,effect:{guards:{special:2}}},
}
const route=(id,title,line,maps,trait,minStage=10,entryStages=null)=>({
 id:'expansion-'+id,title,line,maps:maps.split('|'),themes:[],minStage,maxStage:190,
 entryStages:entryStages??(line.length===5?[10,31,71,111,151]:line.length===4?[10,31,71,121]:line.length===3?[minStage,71,131]:[minStage,111]),
 rule:{id:'expansion-instinct',label:title, ...effects[trait]},
})
export const EXPANSION_BOSS_ROUTES=Object.freeze([
 route('curse-fox','붉은 주술의 여우 계보',['레나몬','요우코몬','도우몬','쿠즈하몬'],'이블 포레스트|사규산|다크 필드','dark'),
 route('snow-breath','설원의 냉기 계보',['스노우아구몬','프리지몬','맘몬','바이킹몬'],'아이스 생츄어리|코퀴토스','armor'),
 route('black-wings','검은 날개의 반격',['츠카이몬','블랙버드라몬','야타가라몬','주작몬'],'윈드 가디언즈|미하라시 산|이블 포레스트','swift'),
 route('fuse-bomb','폐데이터 폭파 계보',['에렉몬(보라)','폭탄모야몬','가비지몬','메탈에테몬'],'쓰레기의 산|팩토리얼 에리어|부트 화산','aim'),
 route('solar','태양의 불꽃 계보',['코로나몬','파이라몬','플레어몬','아폴로몬'],'부트 화산|기어사바나|용정궁','fire'),
 route('aegio','변화하는 신인의 시련',['아이기오몬','아이기오투스몬','아이기오투스몬[홀리]','유피테르몬'],'선공계|코즈믹 에리어|가디언 팰리스','holy'),
 route('chrono-chick','시간을 지키는 검술 계보',['효코몬','부라이몬','부텐몬','크로노몬[홀리 모드]'],'겐시 대륙|사규산|코즈믹 에리어','swift'),
 route('shield','디지조이드 방패의 계보',['코쿠와몬','티아루도몬','라이지루도몬','브리웨루드라몬'],'가디언 팰리스|메탈 엠파이어|어셈블러 타워','armor'),
 route('brigade','D-브리가드 요격 부대',['코쿠와몬','메카노몬','탱크드라몬','다크드라몬'],'메탈 엠파이어|팩토리얼 에리어|다크 웹','aim'),
 route('airship','하늘의 기계 선단',['코쿠와몬','브링프몬','마스터브링프몬','크로스몬'],'윈드 가디언즈|어셈블러 타워|메탈 엠파이어','aim'),
 route('spider','거미 여왕의 군락',['코스파이더몬','스파이더몬','아라크네몬','리리스몬'],'이블 포레스트|비틀랜드|다크 필드','dark'),
 route('flowers','붉게 익어나는 꽃의 계보',['플로라몬','레드베지몬','브롯사몬','로제몬'],'기어 포레스트|이블 포레스트|비틀랜드','heal'),
 route('crustacean','갑각 군락의 왕',['크랩몬','가재드라몬','스콜피오몬','푸쿠몬'],'용의눈호수|네트의 바다|아시노 섬','armor'),
 route('abyss','심해 악마의 계보',['베타몬','연체몬','마린데블몬','리바이어몬'],'어비스 에리어|네트의 바다|지하 하수도','dark'),
 route('kappa','물의 수행자',['카메몬','가와파몬','사우자몬','점보가메몬'],'용의눈호수|네트의 바다|아시노 섬','armor'),
 route('sword','검술과 마법의 시련',['코테몬','무사몬','미스티몬','메디벌듀크몬'],'코덱 유적|가디언 팰리스|사규산','rage'),
 route('mummy','고대의 부활 의식',['고스몬','미이라몬','파라오몬'],'오버델 묘지|코덱 유적|황천','dark',10,[10,61,121]),
 route('grizzly','돌연변이 맹수의 계보',['베어몬','그리즈몬','그레이트그리즈몬','칼리스몬'],'기어사바나|무한산|겐시 대륙','rage'),
 route('black-dragon','칠흑의 마룡',['길몬','블랙그라우몬','블랙메가로그라우몬','카오스듀크몬'],'다크 필드|부트 화산|겐시 대륙','fire'),
 route('hellhound','지옥문 파수견',['파피몬(흑)','도베르몬','케르베로스몬','플루토몬'],'오버델 묘지|다크 에리어|황천','dark'),
 route('forest-bird','열매와 숲의 왕관',['플로라몬','키위몬','뿌띠몬','그리포몬'],'기어 포레스트|미하라시 산|아시노 섬','heal'),
 route('dark-star','빛을 잃은 별',['스타몬','다크슈퍼스타몬','블랙킹워매몬'],'다크 웹|코즈믹 에리어|다크 필드','dark',30,[30,71,131]),
 route('snow-ogre','눈보라와 화석의 계보',['스노우고부리몬','블루우가몬','맘몬','스컬맘몬'],'아이스 생츄어리|코퀴토스','armor'),
 route('pegasus','성스러운 날개의 시험',['파닥몬','페가수스몬'],'코덱 유적|선공계|시작의마을','holy',10,[10,31]),
 route('fire-spirit','불의 스피릿 계보',['아그니몬','브리트라몬','아루다몬','카이젤그레이몬'],'부트 화산|용정궁','fire',30,[30,61,101,151]),
 route('light-spirit','빛의 스피릿 계보',['볼프몬','가름몬','베오울프몬','매그너가루몬[SV]'],'코덱 유적|가디언 팰리스|아이스 생츄어리','holy',30,[30,61,101,151]),
 route('wind-spirit','바람의 스피릿 계보',['호크몬','페어리몬','슈츠몬','제트실피드몬'],'윈드 가디언즈|미하라시 산','swift'),
 route('ice-spirit','얼음의 스피릿 계보',['펭귄몬','챠크몬','블리자몬','왕펭귄몬'],'아이스 생츄어리|코퀴토스','armor'),
 route('sutra','깨달음을 향한 수행',['코에몬','무사몬','삼장몬','샤크라몬'],'사규산|선공계|겐시 대륙','holy'),
 route('goku','봉술의 수행자',['코에몬','타겟몬','손오공몬','간쿠몬'],'사규산|겐시 대륙|선공계','rage'),
 route('water-horse','물길을 달리는 성수',['쿠다몬','레파몬','안바르몬','그리포몬'],'용의눈호수|아시노 섬|선공계','swift'),
 route('witch','요정과 현자의 계보',['팅커몬','위치몬','미스티몬','에이션트와이즈몬'],'이블 포레스트|코덱 유적|미하라시 산','dark'),
 route('wendigo','어둠에 물든 숲의 토끼',['로프몬','웬디몬','안티라몬','케루비몬(악)'],'이블 포레스트|다크 필드|나이트메어 솔저스','dark'),
 route('jewel-insect','보석 갑각의 무사',['추추몬','스나이몬','주엘비몬','그랜쿠가몬','그랑디스쿠가몬'],'비틀랜드|기어 포레스트|미하라시 산','armor'),
 route('gun-book','총잡이와 고상한 왕',['토이아구몬','카우보이몬','바알몬','베르제브몬'],'센트럴 타운|다크 에리어|나이트메어 솔저스','aim'),
 route('scrap','폐데이터 재활용의 왕',['츄몬','스카몬','가비지몬','메탈에테몬'],'쓰레기의 산|지하 하수도|팩토리얼 에리어','heal'),
 route('shark','해류를 가르는 포식자',['크랩몬','가재드라몬','다이버몬','샤크몬','메탈시드라몬'],'용의눈호수|네트의 바다|어비스 에리어','swift'),
 route('asura','대지와 연회의 수호자',['베어몬','미노타몬','아수라몬','바커스몬'],'기어사바나|사규산|선공계','rage'),
 route('angel-blade','빛의 검을 잇는 천사',['파닥몬','엔젤몬','홀리엔젤몬','슬래쉬엔젤몬'],'코덱 유적|가디언 팰리스|선공계','holy'),
 route('bancho-mame','작은 우두머리의 의협',['텐타몬','가드로몬','빅콩알몬','반쵸콩알몬'],'시작의마을|센트럴 타운|메탈 엠파이어','rage'),
 route('psyche','화려한 모피와 마탄의 길',['사이케몬','아스타몬','베르스타몬'],'나이트메어 솔저스|다크 필드|다크 에리어','aim',10,[10,71,131]),
])
export const EXPANSION_LEGEND_PROFILES=Object.freeze(Object.entries(habitats).filter(([,h])=>h.bossOnly).map(([name,h])=>({
 id:'expansion-legend-'+name,kind:'wild',name,title:name+'의 영역',line:[name],maps:h.maps,themes:[],
 minStage:['그레이스노바몬','크로노몬[홀리 모드]','크로노몬[디스트로이 모드]','유피테르몬[래스 모드]'].includes(name)?150:110,maxStage:190,
 rules:[{id:'legend-release',label:'잠재력 해방',condition:low,effect:{clearStatus:true,stats:{attack:1.12,specialAttack:1.12}}}],
 phaseLabel:'필살기 해방',finalPower:{stats:{attack:1.12,specialAttack:1.12}},speech:'영역의 강자가 길을 막아섰다.',
})))
export const EXPANSION_MAP_BOSS_ROUTES=Object.freeze(Object.fromEntries(
 [...new Set(Object.values(habitats).flatMap(h=>h.maps))].map(map=>[map,[
 ...EXPANSION_BOSS_ROUTES.filter(r=>r.maps.includes(map)).map(r=>r.id),
 ...EXPANSION_LEGEND_PROFILES.filter(r=>r.maps.includes(map)).map(r=>r.id),
 ]])
))
