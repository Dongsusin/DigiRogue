import { loadBattleEngine } from './lib/battle-engine-fixture.mjs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
const e = await loadBattleEngine();
import {writeFile} from 'node:fs/promises';
const out=resolve(process.argv[2]??(tmpdir()+'/digilog-adventure-balance.json')), count=Math.max(1,Math.min(300,Math.floor(Number(process.argv[3])||96)));
const living=u=>u&&!u.isEgg&&u.currentHp>0;
const seedRandom=seed=>()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
const bestMove=(u,party,enemies)=>e.getCommandSkillNames(u,n=>e.getSkillData(n,u)).map(n=>({name:n,score:e.scoreSkill(u,e.getSkillData(n,u),party,enemies,(a,s,d)=>e.getMatchupResult({attackerType:a.type,skillAttribute:s.속성,defenderType:d.type,defenderAttribute:d.attribute}).multiplier)})).sort((a,b)=>b.score-a.score)[0];
const formPreferences={아구몬:['그레이몬','메탈그레이몬','워그레이몬'],파피몬:['가루몬','워가루몬','메탈가루몬'],팔몬:['니드몬','릴리몬','로제몬'],파닥몬:['엔젤몬','홀리엔젤몬','세라피몬'],텐타몬:['캅테리몬','아틀라캅테리몬','헤라클레스캅테리몬'],쉬라몬:['원뿔몬','쥬드몬','바이킹몬'],피요몬:['버드라몬','가루다몬','페닉스몬'],플롯트몬:['가트몬','엔젤우몬','오파니몬']};
function evolve(party,inventory){return party.map(u=>{if(!living(u))return u;for(let step=0;step<4;step++){let opts=e.getEvolutionOptions(u,inventory,party).filter(o=>o.canEvolve&&o.evolutionType==='stat'&&o.targetData.전투총합>u.baseStatTotal);const preferred=formPreferences[[...(u.evolutionHistory??[]),u.name].find(n=>formPreferences[n])]??[];if(e.getEvolutionOptions(u,inventory,party).some(o=>preferred.includes(o.targetData.이름)))opts=opts.filter(o=>preferred.includes(o.targetData.이름));opts.sort((a,b)=>Number(preferred.includes(b.targetData.이름))-Number(preferred.includes(a.targetData.이름))||b.targetData.전투총합-a.targetData.전투총합);if(!opts.length)break;u=e.createEvolvedCombatant(u,opts[0].targetData)}return u})}
function run(seed,names){Math.random=seedRandom(seed);let party=e.buildStartingParty(names),inventory={},gold=0,turns=0,faints=0,bossTurns=[],checkpoints=[],totalDrops=0,map=e.getMapNameForStage(1),routes=[map];
for(let stage=1;stage<=200;stage++){
 const cap=e.getLevelCapForStage(stage), moved=stage>1&&(stage-1)%10===0;
 if(moved){map=e.getRandomConnectedMapName(map,stage);routes.push(map)}
 party=party.map(u=>e.prepareCombatantForStage(u,{mapChanged:moved},e.refreshCombatantStats));
 party=evolve(party,inventory);
 let enemies=e.buildEnemyParty(stage,e.getMapEncounterGroups(map)[e.getEncounterGroupForStage(stage)]??[],e.getEncounterCountForStage(stage),e.getBossEncounterNamesForStage(map,stage),{mapName:map,gameMode:'classic'});
 let env=e.applyMapEnvironment({party,enemies,currentMap:map,currentStage:stage});party=env.party;enemies=env.enemies;
 const encounterNames=enemies.map(u=>u.name), encounterId=enemies.find(u=>u.bossEncounter?.leader)?.bossEncounter.id;
 const limit=e.getBattleAllyLimit({enemies,encounterCount:enemies.length});let active=[],round=0;
 while(party.some(living)&&enemies.some(living)&&round++<100){
  active=active.filter(id=>party.some(u=>u.id===id&&living(u))).slice(0,limit);
  const eligible=party.filter(u=>living(u)&&!active.includes(u.id)).sort((a,b)=>(bestMove(b,party,enemies)?.score??0)*(b.currentHp/b.maxHp+.5)-(bestMove(a,party,enemies)?.score??0)*(a.currentHp/a.maxHp+.5));
  while(active.length<limit&&eligible.length)active.push(eligible.shift().id);
  const actions=active.map((id,index)=>{const u=party.find(u=>u.id===id);const move=bestMove(u,party.filter(v=>active.includes(v.id)),enemies.filter(living)); const foes=enemies.filter(living);const skill=e.getSkillData(move.name,u); const target=foes.sort((a,b)=>e.scoreSkill(u,skill,[u],[b],(a,s,d)=>e.getMatchupResult({attackerType:a.type,skillAttribute:s.속성,defenderType:d.type,defenderAttribute:d.attribute}).multiplier)-e.scoreSkill(u,skill,[u],[a],(a,s,d)=>e.getMatchupResult({attackerType:a.type,skillAttribute:s.속성,defenderType:d.type,defenderAttribute:d.attribute}).multiplier))[0];return e.createBattleTurnAction({side:'ally',actor:u,skillName:move.name,targetId:target?.id,order:index})});
  actions.push(...e.createEnemyBattleTurnActions({enemies,party,activeAllyIds:active,startOrder:actions.length}));
  const before=party.filter(living).length;
  const result=e.resolveBattleTurnActions({party,enemies,activeAllyIds:active,actions,levelCap:cap,inventory});party=result.nextParty;enemies=result.nextEnemies;faints+=Math.max(0,before-party.filter(living).length);turns++;
 }
 if(!party.some(living)||enemies.some(living))return{seed,names,cleared:stage-1,lostAt:stage,rounds:round,turns,faints,gold,routes,party:party.map(u=>({name:u.name,level:u.level,hp:u.currentHp,max:u.maxHp})),bossTurns,checkpoints,enemies:enemies.map(u=>({name:u.name,level:u.level,hp:u.currentHp,max:u.maxHp,budget:u.baseStatTotal}))};
 if(stage%10===0)bossTurns.push({stage,rounds:round,names:encounterNames,profile:encounterId});
 party=e.recoverAfterVictory(party,stage%10===0,active).nextParty;
 gold+=e.getStageClearGoldReward(stage,inventory);
 // One real random reward per stage, no rerolls, free items, account skills or town help.
 const drops=e.createRewardSelection(inventory,party,cap,stage).randomItems;
 const scored=drops.flatMap(item=>party.map((u,index)=>({item,index,score:!e.isRewardItemUsableByCombatant(item,u,cap)?-1:item.levelUpAmount?(cap-u.level>2?35:8):item.partyLevelUpAmount?60:item.digicloneKey?24:item.reviveRatio&&!living(u)?80:item.healFull||item.healAmount?(1-u.currentHp/u.maxHp)*45:item.battleItemKey?20:item.buffStatKey?15:item.expMultiplier?30:2}))).sort((a,b)=>b.score-a.score);
 const pick=scored[0];if(pick&&pick.score>=0){const {item,index}=pick;if(item.partyHealAmount||item.partyHealFull)party=e.applyPartyHealRewardEffect(party,item);else if(item.partyLevelUpAmount)party=party.map(u=>living(u)?e.applyLevelUpRewardEffect(u,item.partyLevelUpAmount,cap):u);else {const r=e.applyInstantRewardEffect(party[index],item,cap);party[index]=r.nextPlayer;if(r.shouldStore)inventory=e.addRewardInventoryItem(inventory,item)}totalDrops++}
 // Shop spending uses earned gold and the actual recovery function/prices.
 for(let i=0;i<party.length;i++){let u=party[i];if(!living(u)&&gold>=500){const item=e.fixedRewardItems.find(i=>i.id==='revive-50');u=e.applyInstantRewardEffect(u,item,cap).nextPlayer;gold-=500}let attempts=0;while(living(u)&&u.currentHp<u.maxHp*.85&&gold>=120&&attempts++<8){const item=e.fixedRewardItems.find(i=>i.id==='heal-20');u=e.applyInstantRewardEffect(u,item,cap).nextPlayer;gold-=120}party[i]=u}
 party=evolve(party,inventory);
 if(stage%10===0)checkpoints.push({stage,levels:party.map(u=>u.level),forms:party.map(u=>u.name),gold});
}
return{seed,names,cleared:200,turns,faints,gold,bossTurns,checkpoints,totalDrops,routes}}
const teams=[['아구몬','파피몬','팔몬'],['파닥몬','텐타몬','쉬라몬'],['아구몬','피요몬','파닥몬'],['팔몬','피요몬','플롯트몬'],['파피몬','텐타몬','플롯트몬'],['아구몬','쉬라몬','피요몬']];
const results=[];
for(let i=0;i<count;i++){results.push(run(i*7919+17,teams[i%teams.length]));if((i+1)%12===0)console.log('Completed '+(i+1)+'/'+count+' runs')}
const summary={runs:count,clears:results.filter(r=>r.cleared===200).length,medianStage:results.map(r=>r.cleared).sort((a,b)=>a-b)[Math.floor(count/2)],earliestLoss:Math.min(...results.map(r=>r.cleared)),results};
await writeFile(out,JSON.stringify(summary,null,2));console.log(JSON.stringify({...summary,results:undefined,report:out},null,2));
