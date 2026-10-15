import { SIMULATION_POLICY, simulationMoves, simulationSwitch, applySimulationSwitch } from './lib/adventure-simulation-policy.mjs';
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs';
import { TRAINER_SKILLS, normalizeTrainerRanks, getTrainerCostLimit, getTrainerStarterCost } from '../src/progression/trainerSkills.js';
import { applyTrainerStartingSupport } from '../src/progression/startingSupport.js';
import { recordRivalMeeting, recordRivalVictory } from '../src/battle/rivalEncounters.js';
import { CASUAL_MODE_BALANCE, HARD_MODE_BALANCE } from '../src/progression/gameDifficulty.js';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import {readFile,writeFile} from 'node:fs/promises';
const args=process.argv.slice(2), positional=args.filter(arg=>!arg.startsWith('--'));
const mode=args.includes('--hard')?'hard':'classic', maxProgression=args.includes('--max-progression')||mode==='hard';
const roundLimit=Math.max(100,Math.min(5000,Math.floor(Number(args.find(arg=>arg.startsWith('--round-limit='))?.split('=')[1])||100)));
const difficultyFile=args.find(arg=>arg.startsWith('--difficulty-file='))?.slice('--difficulty-file='.length);
const baselineDir=args.find(arg=>arg.startsWith('--baseline-dir='))?.slice('--baseline-dir='.length);
const sourceOverrides=baselineDir?Object.fromEntries(await Promise.all(['src/App.jsx','src/balance/combat.js','src/balance/catalog.js','src/progression/gameDifficulty.js'].map(async file=>[file,await readFile(resolve(baselineDir,file),'utf8')]))):{};
const e = await loadBattleEngine(difficultyFile?{difficultySource:await readFile(resolve(difficultyFile),'utf8'),sourceOverrides}:{sourceOverrides});
const seedStart=Math.max(0,Math.floor(Number(args.find(arg=>arg.startsWith('--seed-start='))?.split('=')[1])||0));
const out=resolve(positional[0]??(tmpdir()+'/digilog-adventure-balance.json')), count=Math.max(1,Math.min(300,Math.floor(Number(positional[1])||96)));
const trainerSkills=maxProgression?normalizeTrainerRanks(Object.fromEntries(TRAINER_SKILLS.map(node=>[node.id,node.maxRank]))):{};
const collection=maxProgression?{species:Object.fromEntries([...e.allDigimonLookup.keys()].map(name=>[name,{seen:true,unlocked:true}]))}:null;
const living=u=>u&&!u.isEgg&&u.currentHp>0;
const seedRandom=seed=>()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
const bestMove=(u,party,enemies,stalledTurns=0,ownedParty=party)=>simulationMoves(e,u,party,enemies,stalledTurns,ownedParty)[0];
const formPreferences={아구몬:['그레이몬','메탈그레이몬','워그레이몬'],파피몬:['가루몬','워가루몬','메탈가루몬'],팔몬:['니드몬','릴리몬','로제몬'],파닥몬:['엔젤몬','홀리엔젤몬','세라피몬'],텐타몬:['캅테리몬','아틀라캅테리몬','헤라클레스캅테리몬'],쉬라몬:['원뿔몬','쥬드몬','바이킹몬'],피요몬:['버드라몬','가루다몬','페닉스몬'],플롯트몬:['가트몬','엔젤우몬','오파니몬']};
function evolve(party,inventory){return party.map(u=>{if(!living(u))return u;for(let step=0;step<4;step++){let opts=e.getEvolutionOptions(u,inventory,party).filter(o=>o.canEvolve&&o.evolutionType==='stat'&&o.targetData.전투총합>u.baseStatTotal);const preferred=formPreferences[[...(u.evolutionHistory??[]),u.name].find(n=>formPreferences[n])]??[];if(e.getEvolutionOptions(u,inventory,party).some(o=>preferred.includes(o.targetData.이름)))opts=opts.filter(o=>preferred.includes(o.targetData.이름));opts.sort((a,b)=>Number(preferred.includes(b.targetData.이름))-Number(preferred.includes(a.targetData.이름))||b.targetData.전투총합-a.targetData.전투총합);if(!opts.length)break;u=e.createEvolvedCombatant(u,opts[0].targetData)}return u})}
function run(seed,names){Math.random=seedRandom(seed);let party=e.buildStartingParty(names,trainerSkills,collection),inventory={},gold=0,turns=0,faints=0,bossTurns=[],checkpoints=[],totalDrops=0,map=e.getMapNameForStage(1),routes=[map],rivalState={},history=[];
if(party.length!==names.length)throw new Error('Illegal starting team: '+names.join(','));
if(maxProgression){const support=applyTrainerStartingSupport({gameMode:mode,currentStage:1,inventory,gold,trainerSkills});inventory=support.inventory;gold=support.gold}
for(let stage=1;stage<=200;stage++){
 const cap=e.getLevelCapForStage(stage,mode), moved=stage>1&&(stage-1)%10===0;
 if(moved){map=e.getRandomConnectedMapName(map,stage);routes.push(map)}
 party=party.map(u=>e.prepareCombatantForStage(u,{mapChanged:moved},e.refreshCombatantStats));
 party=evolve(party,inventory);
 let enemies=e.buildEnemyParty(stage,e.getMapEncounterGroups(map)[e.getEncounterGroupForStage(stage)]??[],e.getEncounterCountForStage(stage),e.getBossEncounterNamesForStage(map,stage),{mapName:map,gameMode:mode,rivalState,history});
 const bossId=enemies.find(u=>!u.rivalEncounter&&u.bossEncounter?.leader)?.bossEncounter.id;if(bossId)history=[...history,bossId].slice(-8);
 rivalState=recordRivalMeeting({currentStage:stage,enemies,rivalState}).rivalState??rivalState;
 let env=e.applyMapEnvironment({party,enemies,currentMap:map,currentStage:stage,gameMode:mode});party=env.party;enemies=env.enemies;
 const encounterNames=enemies.map(u=>u.name), encounterId=enemies.find(u=>u.bossEncounter?.leader)?.bossEncounter.id;
 const limit=e.getBattleAllyLimit({enemies,encounterCount:enemies.length});let active=[],round=0,stalledTurns=0,bestEnemyHp=Infinity,progressKey='';const usedIncomingIds=new Set();
 while(party.some(living)&&enemies.some(living)&&round++<roundLimit){
  active=active.filter(id=>party.some(u=>u.id===id&&living(u))).slice(0,limit);
  const eligible=party.filter(u=>living(u)&&!active.includes(u.id)).sort((a,b)=>(bestMove(b,party,enemies)?.score??0)*(b.currentHp/b.maxHp+.5)-(bestMove(a,party,enemies)?.score??0)*(a.currentHp/a.maxHp+.5));
  while(active.length<limit&&eligible.length)active.push(eligible.shift().id);
  for(const id of active)usedIncomingIds.add(id);
  const key=enemies.filter(living).map(u=>u.id+':'+u.name+':'+(u.bossEncounter?.phase??'')).join('|');
  const enemyHp=enemies.filter(living).reduce((sum,u)=>sum+u.currentHp/u.maxHp,0);
  if(key!==progressKey||enemyHp<bestEnemyHp-.01){progressKey=key;bestEnemyHp=enemyHp;stalledTurns=0}else stalledTurns++;
  const swap=simulationSwitch(e,{party,activeIds:active,enemies,stalledTurns,usedIncomingIds});
  const switched=applySimulationSwitch(e,party,active,swap);party=switched.party;active=switched.activeIds;
  if(swap)usedIncomingIds.add(swap.incomingId);
  const actions=active.filter(id=>id!==switched.actedId).map((id,index)=>{const u=party.find(u=>u.id===id);const move=bestMove(u,party.filter(v=>active.includes(v.id)),enemies.filter(living),stalledTurns,party);return e.createBattleTurnAction({side:'ally',actor:u,skillName:move.name,targetId:move.targetId,order:index})});
  actions.push(...e.createEnemyBattleTurnActions({enemies,party,activeAllyIds:active,startOrder:actions.length}));
  const before=party.filter(living).length;
  const result=e.resolveBattleTurnActions({party,enemies,activeAllyIds:active,actions,levelCap:cap,inventory});party=result.nextParty;enemies=result.nextEnemies;faints+=Math.max(0,before-party.filter(living).length);turns++;
 }
 if(!party.some(living)||enemies.some(living))return{seed,names,cleared:stage-1,outcome:party.some(living)?'unresolved':'defeat',lostAt:party.some(living)?undefined:stage,unresolvedAt:party.some(living)?stage:undefined,rounds:round,turns,faints,gold,routes,party:party.map(u=>({name:u.name,level:u.level,hp:u.currentHp,max:u.maxHp})),bossTurns,checkpoints,enemies:enemies.map(u=>({name:u.name,level:u.level,hp:u.currentHp,max:u.maxHp,budget:u.baseStatTotal}))};
 if(stage%10===0)bossTurns.push({stage,rounds:round,names:encounterNames,profile:encounterId});
 party=e.recoverAfterVictory(party,stage%10===0,active).nextParty;
 gold+=e.getStageClearGoldReward(stage,inventory);
 rivalState=recordRivalVictory({currentStage:stage,enemies,rivalState,party,activeAllyIds:active}).rivalState??rivalState;
 // One real random reward per stage, no rerolls or invented inventory.
 const drops=e.createRewardSelection(inventory,party,cap,stage,0,mode).randomItems;
 const scored=drops.flatMap(item=>party.map((u,index)=>({item,index,score:!e.isRewardItemUsableByCombatant(item,u,cap)?-1:item.levelUpAmount?(cap-u.level>2?35:8):item.partyLevelUpAmount?60:item.digicloneKey?24:item.reviveRatio&&!living(u)?80:item.healFull||item.healAmount?(1-u.currentHp/u.maxHp)*45:item.battleItemKey?20:item.buffStatKey?15:item.expMultiplier?30:2}))).sort((a,b)=>b.score-a.score);
 const pick=scored[0];if(pick&&pick.score>=0){const {item,index}=pick;if(item.partyHealAmount||item.partyHealFull)party=e.applyPartyHealRewardEffect(party,item);else if(item.partyLevelUpAmount)party=party.map(u=>living(u)?e.applyLevelUpRewardEffect(u,item.partyLevelUpAmount,cap):u);else {const r=e.applyInstantRewardEffect(party[index],item,cap);party[index]=r.nextPlayer;if(r.shouldStore)inventory=e.addRewardInventoryItem(inventory,item)}totalDrops++}
 // Shop spending uses earned gold and the actual recovery function/prices.
 for(let i=0;i<party.length;i++){let u=party[i];if(!living(u)&&gold>=500){const item=e.fixedRewardItems.find(i=>i.id==='revive-50');u=e.applyInstantRewardEffect(u,item,cap).nextPlayer;gold-=500}let attempts=0;while(living(u)&&u.currentHp<u.maxHp*.85&&gold>=120&&attempts++<8){const item=e.fixedRewardItems.find(i=>i.id==='heal-20');u=e.applyInstantRewardEffect(u,item,cap).nextPlayer;gold-=120}party[i]=u}
 party=evolve(party,inventory);
 if(stage%10===0)checkpoints.push({stage,levels:party.map(u=>u.level),forms:party.map(u=>u.name),gold});
}
return{seed,names,cleared:200,outcome:'clear',turns,faints,gold,bossTurns,checkpoints,totalDrops,routes}}
const core=['아구몬','파피몬','팔몬','파닥몬','텐타몬','쉬라몬','피요몬','플롯트몬'];
const solo=args.includes('--solo');
const candidateTeams=solo?(maxProgression?[['아구몬'],['파피몬'],['팔몬'],['워그레이몬'],['메탈가루몬'],['오메가몬']]:[['아구몬'],['파피몬'],['팔몬']]):maxProgression?[core,['워그레이몬',...core.slice(1)],['메탈가루몬',...core.filter(n=>n!=='파피몬')],
 ['릴리몬','그레이몬','파닥몬','쉬라몬','텐타몬','피요몬'],['엔젤몬','가루몬','아구몬','팔몬','텐타몬','쉬라몬','피요몬'],
 ['로제몬',...core.filter(n=>n!=='팔몬')],['마린엔젤몬','엔젤몬','아구몬'],['오메가몬','파닥몬']]:
 [['아구몬','파피몬','팔몬'],['파닥몬','텐타몬','쉬라몬'],['아구몬','피요몬','파닥몬'],['팔몬','피요몬','플롯트몬'],['파피몬','텐타몬','플롯트몬'],['아구몬','쉬라몬','피요몬']];
const excludedTeams=candidateTeams.filter(names=>names.reduce((sum,name)=>sum+getTrainerStarterCost(e.allDigimonLookup.get(name),trainerSkills),0)>getTrainerCostLimit(trainerSkills));
const teams=args.includes('--legal-teams-only')?candidateTeams.filter(names=>!excludedTeams.includes(names)):candidateTeams;
if(!teams.length)throw new Error('No legal starting teams');
const teamCosts=teams.map(names=>names.reduce((sum,name)=>sum+getTrainerStarterCost(e.allDigimonLookup.get(name),trainerSkills),0));
if(teamCosts.some(cost=>cost>getTrainerCostLimit(trainerSkills)))throw new Error('Starting cost exceeds the real budget');
const results=[];
for(let i=0;i<count;i++){results.push(run((i+seedStart)*7919+17,teams[(i+seedStart)%teams.length]));if((i+1)%12===0)console.log('Completed '+(i+1)+'/'+count+' runs: '+JSON.stringify({clears:results.filter(r=>r.outcome==='clear').length,defeats:results.filter(r=>r.outcome==='defeat').length,unresolved:results.filter(r=>r.outcome==='unresolved').length}))}
const summary={policy:SIMULATION_POLICY,mode,maxProgression,solo,seedStart,roundLimit,baselineDir:baselineDir?resolve(baselineDir):undefined,difficultyFile:difficultyFile?resolve(difficultyFile):undefined,teamCosts,excludedTeams:args.includes('--legal-teams-only')?excludedTeams:[],casualProfile:mode==='classic'&&!difficultyFile&&!baselineDir?CASUAL_MODE_BALANCE:undefined,hardProfile:mode==='hard'&&!difficultyFile&&!baselineDir?HARD_MODE_BALANCE:undefined,trainerNodes:Object.keys(trainerSkills).length,departureSkills:maxProgression,runs:count,clears:results.filter(r=>r.cleared===200).length,defeats:results.filter(r=>r.outcome==='defeat').length,unresolved:results.filter(r=>r.outcome==='unresolved').length,medianStage:results.map(r=>r.cleared).sort((a,b)=>a-b)[Math.floor(count/2)],earliestLoss:Math.min(...results.map(r=>r.cleared)),results};
await writeFile(out,JSON.stringify(summary,null,2));console.log(JSON.stringify({...summary,results:undefined,report:out},null,2));
