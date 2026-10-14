import expansion7 from '../data/rosterExpansion7.json' with { type: 'json' }
// These are authored fan-game ratings, not official numerical stats or a canonical ranking.
// Stage is a growth classification; it never supplies a species' combat budget or cost.
export const LORE_SOURCES = Object.freeze({
  expansion6_zeedmillenniumon: 'https://digimon.net/reference_ko/detail.php?directory_name=zeedmillenniumon',
  expansion6_xiangpengmon: 'https://digimon.net/reference_ko/detail.php?directory_name=xiangpengmon',
  expansion6_vulcanusmon: 'https://digimon.net/reference_ko/detail.php?directory_name=vulcanusmon',
  expansion6_ultimatechaosmon: 'https://digimon.net/reference_ko/detail.php?directory_name=ultimatechaosmon',
  expansion6_takutoumon: 'https://digimon.net/reference_ko/detail.php?directory_name=takutoumon',
  expansion6_suijinmon: 'https://digimon.net/reference_ko/detail.php?directory_name=suijinmon',
  expansion6_sakuyamon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=sakuyamon_x',
  expansion6_rosemon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=rosemon_x',
  expansion6_rookchessmon: 'https://digimon.net/reference_ko/detail.php?directory_name=rookchessmon',
  expansion6_hououmon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=hououmon_x',
  expansion6_ofanimon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=ofanimon_x',
  expansion6_ogudomon: 'https://digimon.net/reference_ko/detail.php?directory_name=ogudomon',
  expansion6_megidramon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=megidramon_x',
  expansion6_lilithmon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=lilithmon_x',
  expansion6_junomon_hysteric: 'https://digimon.net/reference_ko/detail.php?directory_name=junomon_hysteric',
  expansion6_junomon: 'https://digimon.net/reference_ko/detail.php?directory_name=junomon',
  expansion6_jetmervamon: 'https://digimon.net/reference_ko/detail.php?directory_name=jetmervamon',
  expansion6_huankunmon: 'https://digimon.net/reference_ko/detail.php?directory_name=huankunmon',
  expansion6_goddramon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=goddramon_x',
  expansion6_gigaseadramon: 'https://digimon.net/reference_ko/detail.php?directory_name=gigaseadramon',
  expansion6_gankoomon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=gankoomon_x',
  expansion6_fujinmon: 'https://digimon.net/reference_ko/detail.php?directory_name=fujinmon',
  expansion6_erlangmon: 'https://digimon.net/reference_ko/detail.php?directory_name=erlangmon',
  expansion6_dorbickmon: 'https://digimon.net/reference_ko/detail.php?directory_name=dorbickmon',
  expansion6_dinotigermon: 'https://digimon.net/reference_ko/detail.php?directory_name=dinotigermon',
  expansion6_cherubimon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=cherubimon_x',
  expansion6_bishopchessmon: 'https://digimon.net/reference_ko/detail.php?directory_name=bishopchessmon',
  expansion6_barbamon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=barbamon_x',
  expansion6_zdgarurumon: 'https://digimon.net/reference_ko/detail.php?directory_name=zdgarurumon',
  expansion6_venusmon: 'https://digimon.net/reference_ko/detail.php?directory_name=venusmon',
  expansion6_raidenmon: 'https://digimon.net/reference_ko/detail.php?directory_name=raidenmon',
  expansion6_rafflesimon: 'https://digimon.net/reference_ko/detail.php?directory_name=rafflesimon',
  expansion6_queenchessmon: 'https://digimon.net/reference_ko/detail.php?directory_name=queenchessmon',
  expansion6_plutomon: 'https://digimon.net/reference_ko/detail.php?directory_name=plutomon',
  expansion6_marsmon: 'https://digimon.net/reference_ko/detail.php?directory_name=marsmon',
  expansion6_kingchessmon: 'https://digimon.net/reference_ko/detail.php?directory_name=kingchessmon',
  expansion6_eosmon_lv6: 'https://digimon.net/reference_ko/detail.php?directory_name=eosmon_lv6',
  expansion6_ceresmon: 'https://digimon.net/reference_ko/detail.php?directory_name=ceresmon',
  expansion5_kuzuhamon_miko: 'https://digimon.net/reference_ko/detail.php?directory_name=kuzuhamon_miko',
  expansion5_insekimon: 'https://digimon.net/reference_ko/detail.php?directory_name=insekimon',
  expansion5_wisemon: 'https://digimon.net/reference_ko/detail.php?directory_name=wisemon',
  expansion4_beelzebumonblastmode: 'https://digimon.net/reference_ko/detail.php?directory_name=beelzebumonblastmode',
  expansion4_sleipmon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=sleipmon_x',
  expansion4_duftmon_x: 'https://digimon.net/reference_ko/detail.php?directory_name=duftmon_x',
  expansion4_gottsumon: 'https://digimon.net/reference_ko/detail.php?directory_name=gottsumon',
  lucemon: 'https://digimon.net/reference_en/detail.php?directory_name=lucemon',
  numemon: 'https://digimon.net/reference_en/detail.php?directory_name=numemon',
  platinum: 'https://digimon.net/reference_en/detail.php?directory_name=platinumnumemon',
  wargreymon: 'https://digimon.net/reference_en/detail.php?directory_name=wargreymon',
  metalgarurumon: 'https://digimon.net/reference_en/detail.php?directory_name=metalgarurumon',
  angemon: 'https://digimon.net/reference_en/detail.php?directory_name=angemon',
  holy: 'https://digimon.net/reference_en/detail.php?directory_name=holyangemon',
  leomon: 'https://digimon.net/reference_en/detail.php?directory_name=leomon',
  skull: 'https://digimon.net/reference_en/detail.php?directory_name=skullgreymon',
  knight: 'https://digimon.net/reference_en/detail.php?directory_name=omegamon',
  examon: 'https://digimon.net/reference_en/detail.php?directory_name=examon',
  ulforce: 'https://digimon.net/reference_en/detail.php?directory_name=ulforcevdramon',
  miracle: 'https://digimon.net/reference_en/detail.php?directory_name=magnamon',
  demon: 'https://digimon.net/reference_en/detail.php?directory_name=beelzebumon',
  leviamon: 'https://digimon.net/reference_en/detail.php?directory_name=leviamon',
  sovereign: 'https://digimon.net/reference_en/detail.php?directory_name=zhuqiaomon',
  emperor: 'https://digimon.net/reference_en/detail.php?directory_name=huanglongmon',
  ancient: 'https://digimon.net/reference_en/detail.php?directory_name=ancientgreymon',
  susano: 'https://digimon.net/reference_en/detail.php?directory_name=susanoomon',
  marine: 'https://digimon.net/reference_en/detail.php?directory_name=marinangemon',
  jijimon: 'https://digimon.net/reference_en/detail.php?directory_name=jijimon',
})

// HP, attack, defense, special attack, special defense, speed. Spreads have real tradeoffs.
export const LORE_BUILDS = Object.freeze({
  paladin: { role: '물리형', label: '성스러운 격투', weights: [1.2, 1.35, 1.05, .95, 1.5, 1.05], note: '성스러운 근접 공격과 특수 방어가 강합니다.' },
  gunner: { role: '기동형', label: '기동 포격', weights: [1.1, .85, 1, 1.5, .95, 1.6], note: '빠른 포격과 특수 공격이 강하며 체력은 낮습니다.' },
  balance: { role: '균형형', label: '균형', weights: [1.2,1,1,1,1,1], note: '공격과 생존 능력이 고르게 분포합니다.' },
  striker: { role: '물리형', label: '근접 공격', weights: [1.12,1.5,1.03,0.68,0.85,1.12], note: '물리 공격이 강하고 특수 방어는 낮습니다.' },
  bruiser: { role: '물리형', label: '중량 격투', weights: [1.55,1.5,1.22,0.7,1,0.65], note: '체력과 물리 공격이 높고 행동은 느립니다.' },
  tank: { role: '수비형', label: '중장갑', weights: [1.65,0.95,1.65,0.65,1.15,0.5], note: '체력·방어를 높이고 공격력·속도를 낮췄습니다.' },
  fortress: { role: '수비형', label: '방벽', weights: [1.5,0.68,1.65,0.88,1.65,0.4], note: '양쪽 방어가 강하지만 공격과 속도는 낮습니다.' },
  caster: { role: '특수형', label: '특수 공격', weights: [1.05,0.65,0.85,1.6,1.15,1.05], note: '특수 공격이 강하고 물리전에는 약합니다.' },
  artillery: { role: '특수형', label: '중화기', weights: [1.3,0.7,1.13,1.65,0.95,0.55], note: '특수 화력을 높이고 속도를 낮췄습니다.' },
  assassin: { role: '기동형', label: '고속 근접', weights: [0.95,1.5,0.75,0.85,0.8,1.7], note: '빠른 물리 공격에 특화하며 오래 버티기는 어렵습니다.' },
  skirmisher: { role: '기동형', label: '기동 전투', weights: [1.03,1.17,0.85,1.13,0.92,1.5], note: '속도가 높고 물리·특수 공격을 함께 활용합니다.' },
  holy: { role: '균형형', label: '성스러운 수호', weights: [1.3,0.85,1.05,1.12,1.55,0.9], note: '특수 방어와 지원에 강하고 물리 화력은 낮습니다.' },
  support: { role: '균형형', label: '지원', weights: [1.45,0.5,1.12,0.85,1.55,0.95], note: '회복과 생존에 특화하며 직접 공격은 약합니다.' },
  duelist: { role: '물리형', label: '검술', weights: [1.1,1.5,1.08,0.85,1,1.3], note: '물리 공격과 속도가 높으며 방어도 확보합니다.' },
  hybrid: { role: '균형형', label: '복합 전투', weights: [1.2,1.4,1.05,1.3,1,0.95], note: '물리·특수 필살기를 모두 다루는 공격형입니다.' },
  beast: { role: '물리형', label: '야수', weights: [1.35,1.4,1,0.65,0.85,1.2], note: '체력·공격·속도가 높고 특수 능력은 낮습니다.' },
  flame: { role: '특수형', label: '화염 전투', weights: [1.2,1.12,0.98,1.42,0.85,0.85], note: '화염과 근접 공격이 강하고 특수 방어는 낮습니다.' },
  aerial: { role: '기동형', label: '공중 기동', weights: [1.05,1,0.8,1.3,0.95,1.6], note: '속도·특수 공격이 높고 방어는 낮습니다.' },
  nature: { role: '균형형', label: '자연·재생', weights: [1.3,0.82,1.12,1.18,1.3,0.72], note: '체력·특수 능력이 높고 속도는 낮습니다.' },
  slime: { role: '수비형', label: '끈질긴 생존', weights: [1.75,0.6,0.85,0.85,1.22,0.85], note: '체력이 높고 직접 공격력은 낮습니다.' },
  machine: { role: '수비형', label: '기계 장갑', weights: [1.4,1.22,1.58,0.92,1.02,0.55], note: '물리 공격·방어가 높고 기동성은 낮습니다.' },
  calamity: { role: '특수형', label: '광역 파괴', weights: [1.45,1.12,1.12,1.65,1.18,0.6], note: '체력과 특수 화력이 높고 속도는 낮습니다.' },
})

// Every currently playable species has an explicit budget and build. No random/name hashes.
// Optional final column links the specific exceptional interpretation to a checked primary source.
const rows = `
깜몬|225|balance
도도몬|235|beast
뽀글몬|230|nature
쿠라몬|255|slime
포요몬|215|support
푸니몬|240|tank
프스몬|245|flame
하얀몬|220|holy
치코몬|235|balance
도리몬|315|beast
둥실몬|280|aerial
모티몬|285|nature
뿔몬|310|tank
시드몬|305|duelist
야옹몬|275|support
어니몬|295|balance
와냐몬|290|skirmisher
츠메몬|320|assassin
코로몬|310|flame
토코몬|285|holy
퍼그몬|300|caster
프스리몬|315|flame
꼬마몬|325|striker
알카디몬[유년기]|355|assassin
가오몬|405|striker
가지몬|375|assassin
고부리몬|365|bruiser
길몬|440|flame
도루몬|430|hybrid
드라코몬|445|hybrid
드라큐몬|405|caster
라라몬|370|nature
레나몬|420|skirmisher
로프몬|395|caster
루체몬|780|holy|lucemon
류우다몬|440|duelist
모노드라몬|425|striker
베타몬|380|caster
브이몬|430|striker
샤코몬|365|tank
쉬라몬|390|balance
아구몬|405|flame
아구몬(흑)|415|flame
아기벌몬|385|skirmisher
아르마몬|395|tank
에렉몬|385|skirmisher
올챙몬|345|caster
임프몬|405|caster
추추몬|340|nature
츠카이몬|370|caster
카메몬|390|machine
케라몬|430|caster
쿠다몬|425|holy
테리어몬|395|aerial
텐타몬|395|tank
톱니몬|365|machine
파닥몬|380|aerial
파피몬|405|caster
파피몬(흑)|415|caster
팔몬|390|nature
팔코몬|410|assassin
플롯트몬|395|holy
피요몬|380|aerial
피코데블몬|365|caster
헉몬|455|duelist
호크몬|400|aerial
가무드라몬|405|skirmisher
쟈자몬|445|duelist
샤우트몬|440|hybrid
황금톱니몬|375|flame
보보몬|435|flame
즈바몬|450|duelist
베어몬|400|bruiser
에리스몬|420|skirmisher
레드펭귄몬|365|aerial
테이파몬|360|support
토이아구몬|375|machine
토이아구몬(흑)|385|machine
알카디몬[성장기]|520|assassin
츄몬|315|assassin
루나몬|395|caster
머슈몬|360|nature
시스터몬 블랑|410|support
가드로몬|495|machine
가루몬|535|beast
가루몬(흑)|545|beast
가르고몬|515|hybrid
가오가몬|530|striker
가트몬|555|duelist
개굴몬|440|caster
고스몬|455|caster
구미호몬|535|caster
그라우몬|565|flame
그레이몬|550|flame
긴류우몬|565|duelist
니드몬|490|nature
데블몬|575|caster
도루가몬|555|beast
레오몬|540|bruiser|leomon
레파몬|570|skirmisher
말벌몬|510|artillery
메라몬|515|flame
모노크로몬|515|tank
옐로우워매몬|445|slime
바오헉몬|585|duelist
버드라몬|505|aerial
베지몬|415|nature
브이드라몬|590|striker
블랙가트몬|545|duelist
스카몬|330|slime
스타몬|480|hybrid
스트라이크드라몬|550|assassin
스팅몬|540|assassin
시드라몬|530|caster
아이스몬|480|tank
아큐라몬|525|aerial
에어드라몬|540|aerial
엑스브이몬|565|hybrid
엔젤몬|580|paladin|angemon
우가몬|535|bruiser
우드몬|490|nature
워매몬|320|slime|numemon
원뿔몬|515|aerial
위자몬|530|caster
지오그레이몬|575|flame
캅테리몬|540|tank
코어드라몬(녹)|570|bruiser
코어드라몬(청)|575|aerial
쿠가몬|525|striker
크리사리몬|550|tank
토리에몬|520|striker
티라노몬|515|bruiser
펙크몬|515|assassin
프리지몬|475|tank
필몬|545|skirmisher
해바라기몬|450|nature
황금아르마몬|505|fortress
타임몬|520|caster
사이크로몬|500|bruiser
골드워매몬|390|fortress
쟈자드몬|580|duelist
라보보몬|550|flame
메이쿠몬|570|skirmisher
모야몬|390|bruiser
달팽이워매몬|405|tank
소서리몬|530|holy
즈바이거몬|580|duelist
아레스타드라몬|590|duelist
레드꼬끼몬|480|aerial
다이노휴몬|535|duelist
그리즈몬|535|bruiser
오메카몬|425|machine
탱크몬|530|machine
태스크몬|520|bruiser
멧돼지몬|515|bruiser
황소몬|515|tank
골드브이드라몬|605|hybrid
링스몬|520|flame
토토몬|445|caster
프라리몬|465|assassin
백사몬|545|aerial
비트몬|455|skirmisher
번개드라몬|560|skirmisher
사수몬|585|artillery
시프몬|520|assassin
백조몬|525|aerial
아그니몬|615|flame
알카디몬[성숙기]|635|assassin
실리컨몬|555|tank
머드프리지몬|475|tank
록몬|535|tank
그레이몬(청)|560|bruiser
후디에몬|535|support
레키스몬|530|skirmisher
볼프몬|615|duelist
라프타드라몬|555|machine
레어몬|375|slime
상굴몬|545|assassin
시스터몬 느와르|550|skirmisher
유니몬|515|aerial
화염드라몬|555|flame
가루다몬|645|aerial
고래몬|625|tank
그라운드라몬|655|bruiser
데이터몬|590|caster
도루그레몬|670|hybrid
도사몬|665|caster
디지타몬|620|tank
라이즈그레이몬|680|artillery
라일라몬|625|nature
래피드몬|675|skirmisher
레이디데블몬|655|caster
로더레오몬|655|machine
루체몬[폴다운]|920|hybrid
릴리몬|610|nature
마하가오가몬|665|striker
메가드라몬|640|artillery
메가로그라우몬|685|artillery
메가시드라몬|645|caster
메탈그레이몬|680|artillery
메탈티라노몬|650|machine
묘티스몬|675|caster
블랙메가로그라우몬|690|artillery
블루메라몬|630|flame
프린스콩알몬|730|hybrid
사이버드라몬|690|striker
세이버헉몬|715|duelist
슈퍼스타몬|610|hybrid
스컬그레이몬|670|artillery|skull
스컬사탄몬|715|assassin
실피드몬|680|aerial
아트라캅테리몬|685|tank
안티라몬|665|holy
에어로브이드라몬|725|skirmisher
에테몬|560|bruiser
엔젤우몬|690|holy
오로치몬|680|bruiser
왕개굴몬|585|bruiser
왕쿠가몬|660|striker
워가루몬|670|duelist
워가루몬(흑)|680|duelist
윙드라몬|690|aerial
인펠몬|705|skirmisher
쥬드몬|650|bruiser
쥬레이몬|625|nature
캐논벌몬|650|artillery
콩알몬|590|caster
트리케라몬|650|tank
파일드라몬|715|hybrid
팬더몬|565|bruiser
팬텀몬|665|assassin
퍼펫몬|580|caster
펌프몬|575|hybrid
홀리엔젤몬|725|holy|holy
화이트레오몬|655|beast
히샤류우몬|690|duelist
히포그리포몬|645|aerial
안드로몬|675|machine
블랙킹워매몬|515|slime
듀라몬|705|duelist
기가드라몬|665|artillery
아이언레오몬|670|striker
쟈자리히몬|695|duelist
키메라몬|735|hybrid
라보가리타몬|680|flame
메이크랙몬[비셔스]|705|assassin
메탈콩알몬|625|machine
피콜몬|650|support
데드메라몬|655|flame
베이더몬|580|caster
아르고몬[완전체]|690|caster
챠츠라몬|665|beast
인다라몬|665|bruiser
굼비라몬|625|caster
마지라몬|680|artillery
마쿠라몬|630|skirmisher
데블시드라몬|670|caster
메이크랙몬|695|skirmisher
메피스몬|665|caster
미히라몬|670|beast
파지라몬|655|artillery
산티라몬|665|assassin
신드라몬|650|aerial
스티필몬|680|striker
바지라몬|680|duelist
비가라몬|665|tank
시스터몬 블랑[각성]|680|support
시스터몬 느와르[각성]|700|skirmisher
알카디몬[완전체]|790|assassin
브리트라몬|685|flame
캐치콩알몬|610|artillery
치린몬|735|holy
크레세몬|670|skirmisher
야타가라몬|690|aerial
다이노몬|720|assassin
드라고몬|675|caster
그레이드몬|725|duelist
가름몬|685|skirmisher
나이트몬|665|tank
마타돌몬|660|duelist
토우몬|690|fortress
볼케몬|655|bruiser
그랜쿠가몬|755|striker
넵튠몬|800|duelist
노블펌프몬|715|caster
듀나스몬|845|hybrid
듀크몬|855|hybrid
디아블로몬|805|skirmisher
라센몬|775|striker
러스트티라노몬|785|machine
레이브몬|755|assassin
로드나이트몬|840|duelist
로제몬|745|nature
로터스몬|755|support
리리스몬|825|caster
리바이어몬|880|bruiser|leviamon
마린엔젤몬|680|support|marine
마스테몬|865|hybrid
마왕몬|870|caster
메탈가루몬|785|gunner|metalgarurumon
메탈시드라몬|790|artillery
메탈에테몬|700|tank
미네르바몬|785|striker
미라쥬가오가몬|780|striker
바이킹몬|765|bruiser
반쵸릴리몬|795|nature
발두르몬|850|holy
발키리몬|790|duelist
베놈묘티스몬|805|calamity
베르제브몬|840|assassin|demon
베리얼묘티스몬|830|calamity
벨페몬|790|tank
볼트몬|710|bruiser
브레이크드라몬|790|machine
블랙메탈가루몬|795|gunner
블랙워그레이몬|800|hybrid
블리츠그레이몬|805|artillery
샤벨레오몬|740|beast
샤인그레이몬|795|flame
샤크라몬|775|holy
세라피몬|825|holy
세인트가르고몬|790|artillery
슬레이어드라몬|800|duelist
알파몬|885|hybrid
알포스브이드라몬|865|assassin|ulforce
오류우몬|820|duelist
오파니몬|825|holy
워그레이몬|795|hybrid|wargreymon
제스몬|870|duelist
카오스듀크몬|855|hybrid
케루비몬(선)|830|support
케루비몬(악)|835|caster
쿠즈하몬|745|caster
크레니엄몬|850|fortress
크레스가루몬|805|duelist
타이거베스파몬|780|assassin
타이타몬|820|bruiser
택티몬|835|duelist
파워드라몬|805|artillery
플래티넘워매몬|620|fortress|platinum
플레시오몬|765|caster
피노키몬|735|caster
페닉스몬|800|holy
피에몬|810|caster
헤라클레스캅테리몬|790|tank
헤비레오몬|780|machine
에이션트가루몬|890|duelist
에이션트그레이몬|890|flame|ancient
아포카리몬|940|calamity
반쵸레오몬|825|bruiser
발바몬|840|caster
카오스드라몬|865|artillery
듀란다몬|850|duelist
이바몬|750|caster
간쿠몬|850|bruiser
그랜드로코몬|720|machine
하이안드로몬|775|machine
할배몬|800|hybrid|jijimon
킹에테몬|680|bruiser
홀리드라몬|815|holy
메탈릭드라몬|830|aerial
라구엘몬|845|assassin
볼케닉드라몬|835|flame
매그너몬|850|fortress|miracle
래피드몬[아머]|825|skirmisher
아르고몬|825|caster
청룡몬|880|holy
백호몬|880|bruiser
반쵸록몬|800|tank
반쵸스팅몬|800|assassin
현무몬|880|fortress
가르프몬|830|calamity
황룡몬|1000|fortress|emperor
러블리엔젤몬|780|striker
미타마몬|790|holy
라지엘몬|875|holy
주작몬|880|flame|sovereign
알카디몬|875|assassin
디아나몬|815|caster
도루고라몬|850|hybrid
카이젤그레이몬|875|flame
갓드라몬|830|holy
그란드라큐몬|905|caster
그리포몬|770|aerial
저스티몬|755|striker
슬레이프몬|845|skirmisher
메기드라몬|865|calamity
메르크리몬|835|assassin
파일볼케몬|770|bruiser
가이오몬|820|duelist
타이런트캅테리몬|850|tank
알카디몬[초궁극체]|1020|calamity
오메가샤우트몬|810|hybrid
두프트몬[레오파드]|870|assassin
라센몬[격앙]|850|bruiser
레이브몬[버스트]|855|assassin
로제몬[버스트]|860|nature
루체몬[사탄]|1080|calamity
미라쥬가오가몬[버스트]|875|striker
벨페몬[레이지]|950|bruiser
샤인그레이몬[루인]|895|calamity
샤인그레이몬[버스트]|900|flame
아마게몬|960|calamity
알파몬[왕룡검]|1010|hybrid
엑자몬|965|hybrid|examon
오메가몬|945|hybrid|knight
오메가몬[알터-S]|950|hybrid
오메가몬[즈왈트]|945|hybrid
오파니몬[폴다운]|875|caster
황제드라몬[파이터]|905|hybrid
황제드라몬[팔라딘]|1090|duelist
베르제브몬[X항체]|945|assassin
크레니엄몬[X항체]|935|fortress
듀나스몬[X항체]|965|hybrid
듀크몬[X항체]|955|hybrid
제스몬[X항체]|975|duelist
메탈가루몬[X항체]|890|skirmisher
밀레니엄몬|1020|calamity
오메가몬[알터-B]|985|calamity
오메가몬[머시풀]|1080|hybrid
오메가몬[X항체]|1100|hybrid
오메가몬[즈왈트-D]|995|hybrid
스사노오몬|1100|hybrid|susano
알포스브이드라몬[X항체]|965|assassin
워그레이몬[X항체]|895|hybrid
블랙워그레이몬[X항체]|900|hybrid
매그너몬[X항체]|1000|fortress
가이오몬[엄도의형]|925|duelist
아구몬[용기의유대]|975|hybrid
파피몬[우정의유대]|975|skirmisher
듀크몬[크림슨]|1010|hybrid
카오스몬|940|hybrid
카오스몬[발두르암]|970|hybrid
가드로몬(골드)|510|machine
아이스데블몬|585|caster
아트라캅테리몬(청)|690|tank
두프트몬|860|duelist
매그너가루몬[SV]|880|artillery
위그드라실 7D6|1280|fortress
에이션트볼케몬|1010|calamity
매드레오몬[암드]|585|bruiser
바리스타몬|550|tank
바스테몬|675|assassin
블래스트몬|1030|fortress
치비카메몬|340|support
큐트몬|365|support
사이버드라몬[크로스워즈]|755|hybrid
왕펭귄몬|875|hybrid
도루루몬|565|beast
그레이몬[크로스워즈]|590|striker
메일버드라몬|575|aerial
맘몬|735|tank
메탈그레이몬[크로스워즈]|780|hybrid
메탈그레이몬[사이버런처]|870|artillery
모니터몬|345|skirmisher
파라오몬|965|caster
샤우트몬[X2]|600|tank
샤우트몬[X3]|670|hybrid
샤우트몬[X4]|735|duelist
스패로우몬|390|aerial
스타몬즈|360|skirmisher
다크티라노몬|550|bruiser
유피테르몬|1100|hybrid
코에몬|355|skirmisher
타겟몬|520|skirmisher
바그라몬|1190|calamity
데크스몬|1250|calamity
위그드라실 7D6|1280|fortress
울퉁몬|345|tank|expansion4_gottsumon
두프트몬[X항체]|945|assassin|expansion4_duftmon_x
슬레이프몬[X항체]|960|skirmisher|expansion4_sleipmon_x
베르제브몬[블래스트]|1020|skirmisher|expansion4_beelzebumonblastmode
쿠즈하몬[무녀 모드]|745|support|expansion5_kuzuhamon_miko
와이즈몬|650|caster|expansion5_wisemon
운석몬|590|fortress|expansion5_insekimon
쿠즈하몬[무녀 모드]|745|support|expansion5_kuzuhamon_miko
케레스몬|950|nature|expansion6_ceresmon
에오스몬[궁극체]|960|aerial|expansion6_eosmon_lv6
킹체스몬|780|support|expansion6_kingchessmon
마르스몬|930|bruiser|expansion6_marsmon
플루토몬|1050|assassin|expansion6_plutomon
퀸체스몬|925|artillery|expansion6_queenchessmon
라플레시몬|975|nature|expansion6_rafflesimon
라이덴몬|1060|artillery|expansion6_raidenmon
베누스몬|900|support|expansion6_venusmon
지드가루몬|1035|artillery|expansion6_zdgarurumon
발바몬[X항체]|1120|caster|expansion6_barbamon_x
비숍체스몬|670|caster|expansion6_bishopchessmon
케루비몬(선)[X항체]|1100|holy|expansion6_cherubimon_x
다이노타이거몬|945|beast|expansion6_dinotigermon
도르빅크몬|985|flame|expansion6_dorbickmon
이랑몬|1020|duelist|expansion6_erlangmon
풍신몬|910|assassin|expansion6_fujinmon
간쿠몬[X항체]|1140|bruiser|expansion6_gankoomon_x
기가시드라몬|1050|artillery|expansion6_gigaseadramon
갓드라몬[X항체]|1100|holy|expansion6_goddramon_x
환쿤몬|1010|calamity|expansion6_huankunmon
제트메르바몬|1015|aerial|expansion6_jetmervamon
유노몬|930|duelist|expansion6_junomon
유노몬[히스테릭 모드]|1000|assassin|expansion6_junomon_hysteric
리리스몬[X항체]|1130|assassin|expansion6_lilithmon_x
메기드라몬[X항체]|1160|calamity|expansion6_megidramon_x
오그도몬|1250|calamity|expansion6_ogudomon
오파니몬[X항체]|1100|holy|expansion6_ofanimon_x
페닉스몬[X항체]|1080|aerial|expansion6_hououmon_x
룩체스몬|690|tank|expansion6_rookchessmon
로제몬[X항체]|1060|nature|expansion6_rosemon_x
샤크라몬[X항체]|1090|caster|expansion6_sakuyamon_x
수신몬|925|artillery|expansion6_suijinmon
탁탑몬|1020|fortress|expansion6_takutoumon
얼티메이트카오스몬|1230|hybrid|expansion6_ultimatechaosmon
불카누스몬|910|machine|expansion6_vulcanusmon
샹펑몬|1020|aerial|expansion6_xiangpengmon
지드밀레니엄몬|1250|calamity|expansion6_zeedmillenniumon
`

export const LORE_PROFILES = Object.freeze({ ...Object.fromEntries(rows.trim().split('\n').map(row => {
  const [name, total, build, source] = row.split('|')
  return [name, Object.freeze({ budget: Number(total), build, source: source ? LORE_SOURCES[source] : null })]
})), ...Object.fromEntries(Object.entries(expansion7.combat).map(([name, profile]) => [name, Object.freeze(profile)])) })

// Power, including cross-stage exceptions, determines the base cost. The weakest
// current Perfect (515) costs 10; every further 25 points raises cost without a cap.
export function costForPower(budget) {
  const limits = [265, 350, 425, 440, 455, 470, 485, 500, 510]
  const index = limits.findIndex(limit => budget <= limit)
  return index < 0 ? 10 + Math.ceil((budget - 515) / 25) : index + 1
}

export function getLoreProfile(name) {
  const profile = LORE_PROFILES[name]
  if (!profile) throw new Error(`디지몬 전투 설정 누락: ${name}`)
  const build = LORE_BUILDS[profile.build]
  return { ...profile, ...build, cost: costForPower(profile.budget) }
}

export function createLoreStats(profile) {
  const fields = ['체력', '공격', '방어', '특공', '특방', '스피드']
  const total = profile.weights.reduce((sum, value) => sum + value, 0)
  const stats = Object.fromEntries(fields.map((field, index) => [field, Math.round(profile.budget * profile.weights[index] / total)]))
  stats.체력 += profile.budget - Object.values(stats).reduce((sum, value) => sum + value, 0)
  return stats
}
