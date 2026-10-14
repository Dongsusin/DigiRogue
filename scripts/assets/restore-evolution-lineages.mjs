import fs from 'node:fs/promises'
import {ITEM_EVOLUTION_REQUIREMENTS,JOGRESS_RECIPES} from '../../src/data/evolutionRules.js'
const root=new URL('../../',import.meta.url),load=async f=>JSON.parse(await fs.readFile(new URL(f,root))),save=async(f,j)=>{const url=new URL(f,root),raw=await fs.readFile(url,'utf8');await fs.writeFile(url,(JSON.stringify(j,null,2)+'\n').replace(/\n/g,raw.includes('\r\n')?'\r\n':'\n'))}
const expansion=await load('src/data/rosterExpansion7.json'),tree=await load('src/data/evolutionTreeConnections.json'),manifest=await load('src/data/digimonModelManifest.json'),names=new Set(Object.keys(manifest))
const restored=[
{target:'카오스몬',before:['반쵸레오몬','카오스드라몬'],after:['반쵸레오몬','다크드라몬'],source:'https://digimon.net/reference_en/detail.php?directory_name=chaosmon'},
{target:'제트메르바몬',before:['미네르바몬','스패로우몬'],after:['메르바몬','스패로우몬'],source:'https://digimon.net/reference_en/detail.php?directory_name=jetmervamon'}]
for(const change of restored){if(!change.after.every(n=>names.has(n)))throw Error('Missing original material '+change.target);tree.jogress.find(x=>x.targetName===change.target).materials=change.after;const replaced=change.before.filter(n=>!change.after.includes(n));for(const n of replaced)if(tree.branches[n])tree.branches[n]=tree.branches[n].filter(t=>t!==change.target)}
const additions=[
['캔들몬','메라몬'],['캔들몬','위자몬'],['블랙그라우몬','블랙메가로그라우몬'],['블랙그라우몬','메탈티라노몬'],
['웬디몬','안티라몬'],['케르베로스몬','플루토몬'],['케르베로스몬[인랑]','플루토몬'],['메르바몬','제트메르바몬'],
['아루다몬','카이젤그레이몬'],['아루다몬','에이션트그레이몬'],['베오울프몬','매그너가루몬[SV]'],['베오울프몬','에이션트가루몬'],
['폰체스몬(흑)','가드로몬'],['폰체스몬(흑)','스타몬'],['폰체스몬(백)','가드로몬'],['폰체스몬(백)','스타몬'],['사이케몬','아스타몬'],['팅커몬','위치몬'],
['델타몬','메가드라몬'],['델타몬','키메라몬'],['두리몬','메탈콩알몬'],['푸가몬','아수라몬'],['블루우가몬','맘몬'],['미노타몬','아수라몬'],['모털몬','쥬드몬'],['모털몬','퍼펫몬'],['스나이몬','주엘비몬'],['위치몬','미스티몬'],['위치몬','레이디데블몬'],['도그몬','퍼펫몬'],['포큐파몬','마타돌몬'],['이블몬','스컬사탄몬'],
['아라크네몬','리리스몬'],['다크슈퍼스타몬','블랙킹워매몬'],['뿌띠몬','그리포몬'],['안바르몬','그리포몬'],['엑스티라노몬','피노키몬'],['가비지몬','메탈에테몬'],['주엘비몬','반쵸스팅몬'],['주엘비몬','그랜쿠가몬'],['마스터브링프몬','크로스몬'],['미이라몬','파라오몬'],['샤크몬','메탈시드라몬'],['세이렌몬','베누스몬'],['스컬시드라몬','메탈시드라몬'],['브롯사몬','로제몬'],['브롯사몬','로터스몬'],['째리몬','하이안드로몬'],['손오공몬','간쿠몬'],['쟈가몬','피노키몬'],['마린데블몬','리바이어몬'],['삼장몬','샤크라몬'],['배드퍼펫몬','메탈에테몬'],['피치몬','둥실몬']]
for(const [from,to] of additions){if(!names.has(from)||!names.has(to))throw Error('Missing lineage '+from+' -> '+to);expansion.branches[from]=[...new Set([...(expansion.branches[from]??[]),to])];const item=expansion.items[to]??ITEM_EVOLUTION_REQUIREMENTS[to];if(item&&!JOGRESS_RECIPES.some(r=>r.targetName===to))expansion.items[to]={...item,from:[...new Set([...item.from,from])],itemCount:1}}
// Previously-unavailable base forms now supply the normal intermediate steps.
const remove=[['피치몬','뽀글몬'],['피치몬','크랩몬'],['피치몬','펭귄몬'],['유라몬','플로라몬'],['하얀몬','팅커몬'],['블루메라몬','메르바몬']]
for(const [from,to] of remove)if(expansion.branches[from])expansion.branches[from]=expansion.branches[from].filter(n=>n!==to)
for(const to of ['크랩몬','펭귄몬'])expansion.branches.둥실몬=[...new Set([...(expansion.branches.둥실몬??[]),to])]
expansion.items.메르바몬.from=['미네르바몬'];expansion.restoredLineages={recipes:restored,branches:additions,removedSkippedStages:remove,classification:'Recipe materials follow cited profiles; ordinary optional branches are explicit DigiRogue adaptations.'}
const old=await load('src/data/rosterExpansion3.json');for(const from of ['미네르바몬','메르크리몬'])old.branches[from]=(old.branches[from]??[]).filter(n=>n!=='유피테르몬');await save('src/data/rosterExpansion3.json',old)
await save('src/data/rosterExpansion7.json',expansion);await save('src/data/evolutionTreeConnections.json',tree)
for(const stage of ['유아기','유년기','성장기','성숙기','아머체','하이브리드체','완전체','궁극체','초궁극체']){const f='data/디지몬/'+stage+'.json',rows=await load(f);for(const row of rows)if(expansion.names.includes(row.이름))row.진화가능=expansion.branches[row.이름]??[];await save(f,rows)}
console.log(JSON.stringify({exitCode:0,restoredRecipes:restored.length,ordinaryLinks:additions.length,correctedSkippedStages:remove.length}))
