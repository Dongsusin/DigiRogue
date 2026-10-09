import { ITEM_EVOLUTION_REQUIREMENTS } from '../data/evolutionRules.js'
import { REGIONAL_SUPPORT_PROFILES } from '../data/regionalSupportProfiles.js'
// Original trials use the game's documented evolution branches and real assets.
const definitions = [
  ['courage','화염드라몬',['town','forest','volcano'],'화염드라몬',['화염드라몬','우가몬'],{minStage:15,minLevel:10},'타오르는 용기의 시험','겁먹은 주민이 지나갈 수 있도록 불꽃 회랑의 길을 열어야 한다.','용기는 도망치지 않는 것만으로 끝나지 않아. 마지막까지 누군가의 길을 지켜 줘.'],
  ['friendship','번개드라몬',['forest','ice','town'],'번개드라몬',['번개드라몬','가루몬'],{minStage:25,minLevel:15,minParty:2},'번개 너머의 약속','끊어진 두 중계기에 동시에 신호를 보내야 한다. 두 동료의 협력이 필요하다.','두 신호가 모두 닿아야 돌아갈 길이 생겨. 네 동료와 호흡을 맞춰 봐.'],
  ['miracles','매그너몬',['ruins','town'],'매그너몬',['매그너몬','홀리엔젤몬'],{minStage:65,minLevel:45,minTrust:3},'황금 갑옷의 응답','지역의 신뢰를 얻은 브이몬에게 황금빛 봉인이 응답한다.','기적의 힘을 맡길 수 있는지 시험하겠다. 이 빛 앞에서 물러서지 마라.'],
  ['destiny','래피드몬[아머]',['water','ice','sky'],'래피드몬[아머]',['래피드몬[아머]','안티라몬'],{minStage:65,minLevel:45,minTrust:2},'운명의 황금 신호','테리어몬의 신호에 반응한 황금 장치가 오래된 수로의 봉인을 깨운다.','빠르기만 해서는 도착하지 못해. 마지막 신호까지 지킬 수 있겠어?'],
  ['fire-spirit','아그니몬',['volcano','factory'],'아그니몬',['아그니몬','메라몬'],{minStage:25,minLevel:15,minTrust:1},'불꽃 스피릿의 계승','아구몬이 다가가자 고열의 연산로 안에서 스피릿의 흔적이 빛난다.','불꽃을 다스릴 준비가 됐다면 이 회랑을 통과해라.'],
  ['light-spirit','볼프몬',['ruins','ice','sky'],'볼프몬',['볼프몬','엔젤몬'],{minStage:25,minLevel:15,minTrust:1},'빛의 검이 남긴 길','파피몬의 디지코드가 빛의 검에 공명하며 시험의 문이 열린다.','빛을 좇되 동료의 길을 잃지 마라. 수호자를 넘어 네 힘을 보여 줘.'],
  ['blanc-awaken','시스터몬 블랑[각성]',['town','ruins'],'시스터몬 블랑',['시스터몬 블랑[각성]','시스터몬 느와르'],{minStage:45,minLevel:35,minJournal:3},'잠든 수호의 종','여러 의뢰를 마친 시스터몬 블랑이 봉인된 종을 깨우려 한다.','이번에는 제가 모두를 지킬 차례예요. 함께 시험을 넘어 주세요.'],
  ['grani','듀크몬[크림슨]',['ruins','sky'],'듀크몬',['듀크몬','메기드라몬'],{minStage:95,minLevel:60,minTrust:2},'그라니의 비행 기록','듀크몬에게 응답한 붉은 비행 기록이 수호 회랑을 연다.','그라니와 함께 날 수 있는지는 마지막 충돌에서 증명될 것이다.'],
  ['shine-burst','샤인그레이몬[버스트]',['volcano','forest'],'샤인그레이몬',['샤인그레이몬','샤인그레이몬[루인]'],{minStage:95,minLevel:55,requiredItem:'digivice-burst'},'폭주를 넘는 디지소울','버스트 디지바이스가 샤인그레이몬의 힘에 반응하지만 폭주의 잔향이 길을 가로막는다.','불꽃에 삼켜지지 않으려면 파트너와 끝까지 마음을 맞춰라.'],
  ['rose-burst','로제몬[버스트]',['forest','town'],'로제몬',['로제몬','로터스몬'],{minStage:95,minLevel:55,minTrust:2},'장미 정원의 마지막 개화','로제몬의 정원이 주민에게 나눈 온기를 기억하고 마지막 시련을 연다.','새 꽃을 피울 힘을 갖췄는지, 이 정원에서 증명해 보렴.'],
  ['wargrey-x','워그레이몬[X항체]',['ruins','factory'],'워그레이몬',['워그레이몬','블랙워그레이몬'],{minStage:115,minLevel:60,minJournal:3},'용전사의 X항체 검사','워그레이몬의 디지코드에 맞는 X항체 인자가 격리 시설에서 검출됐다.','인자를 가져가려면 검사의 마지막 전투를 통과해야 한다.'],
  ['metalgaruru-x','메탈가루몬[X항체]',['ice','factory'],'메탈가루몬',['메탈가루몬','블랙메탈가루몬'],{minStage:115,minLevel:60,minTrust:2},'빙벽 속의 X항체','메탈가루몬의 신호를 인식한 격리 장치가 냉각된 항체 보관실을 개방한다.','항체 보관실의 수호 체계가 아직 살아 있다. 끝까지 돌파해라.'],
  ['jes-x','제스몬[X항체]',['sky','ruins'],'간쿠몬',['제스몬','간쿠몬'],{minStage:115,minLevel:60,minTrust:2},'기사의 다음 수행','제스몬을 동반한 일행에게 간쿠몬이 마지막 수행을 제안한다.','동료를 지킬 힘이 필요하다면 이 시험을 끝내라.'],
  ['bell-rage','벨페몬[레이지]',['dark'],'위자몬',['벨페몬','마왕몬'],{minStage:95,minLevel:55,minJournal:3},'잠든 마왕의 자명종','벨페몬의 잠에 묶인 자명종이 어둠의 방에서 울리기 시작한다.','종을 가져오는 동안 깨어난 힘을 견뎌야 해. 위험하지만 신뢰를 걸지는 않을게.'],
  ['paladin','황제드라몬[팔라딘]',['ruins','water','sky'],'오메가몬',['오메가몬','황제드라몬[파이터]'],{minStage:135,minLevel:70,allOwned:['오메가몬'],minTrust:2},'오메가 블레이드의 계승','황제드라몬과 오메가몬이 함께 도착하자 고대 검의 봉인이 응답한다.','두 힘을 이어 받을 준비가 됐다면 이 검의 시험을 넘어라.'],
]
export const SPECIAL_QUEST_STORIES = definitions.map(([id, target, themes, npc, opponents, condition, title, opening, dialogue]) => {
  const item = ITEM_EVOLUTION_REQUIREMENTS[target]
  const itemId = item.itemId ?? 'item-evolution-' + item.itemName
  return { id: 'special-' + id, target, special: true, theme: themes[0], themes,
    maps: REGIONAL_SUPPORT_PROFILES.filter(profile => themes.includes(profile.theme)).map(profile => profile.mapName),
    npc, title, opening, dialogue, kind: '특수 진화 의뢰', specialties: [],
    condition: { owned: item.from, ...condition },
    routes: [{ id: 'trial', title: '시련에 도전하기', ending: '시련을 넘어 ' + item.itemName + '을(를) 받았다. 신뢰도는 변하지 않았다.',
      items: [itemId], battle: { opponents, levelDelta: 8, specialQuest: true, guards: { stats: 3 },
        rule: '고난도 시련 · 강화된 수호자 2마리 · 능력치 하락 방지 3턴 · 승리 시 진화 아이템 확정' } }] }
})
const hasItem = (state, id) => state.inventory?.[id] > 0 || (state.party ?? []).some(unit => !unit.isEgg && !unit.regionalSupport && unit.battleItems?.[id] > 0)
export function isSpecialQuestEligible(state, story) {
  const condition = story.condition
  const owned = (state.party ?? []).filter(unit => unit && !unit.isEgg && !unit.regionalSupport)
  const source = owned.some(unit => condition.owned.includes(unit.name) && unit.level >= condition.minLevel)
  return Boolean(source && state.currentStage >= condition.minStage && story.maps.includes(state.currentMap) &&
    !state.eventMemory?.seen?.[story.id] &&
    (!condition.minTrust || (state.eventMemory?.regions?.[state.currentMap]?.trust ?? 0) >= condition.minTrust) &&
    (!condition.minParty || owned.filter(unit => unit.currentHp > 0).length >= condition.minParty) &&
    (!condition.minJournal || (state.eventMemory?.journal?.length ?? 0) >= condition.minJournal) &&
    (!condition.allOwned || condition.allOwned.every(name => owned.some(unit => unit.name === name))) &&
    (!condition.requiredItem || hasItem(state, condition.requiredItem)))
}
export function describeSpecialQuest(story) {
  const c = story.condition
  return c.owned.join(' 또는 ') + ' Lv.' + c.minLevel + ' · STAGE ' + c.minStage + '+' +
    (c.minTrust ? ' · 지역 신뢰 ' + c.minTrust + '+' : '') + (c.minParty ? ' · 생존 동료 ' + c.minParty + '마리' : '') +
    (c.minJournal ? ' · 의뢰 기록 ' + c.minJournal + '회' : '') + (c.allOwned ? ' · ' + c.allOwned.join('·') + ' 동행' : '') +
    (c.requiredItem ? ' · 버스트 디지바이스 보유' : '')
}
