import { chooseBattleCommand } from '../src/battle/tacticalAI.js'
import { advanceRunTurn, createRunStats } from '../src/progression/hallOfFame.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { REGIONAL_SUPPORT_PROFILES, REGIONAL_SUPPORT_BY_MAP } from '../src/data/regionalSupportProfiles.js'
import { getRegionalTrust, updateRegionalTrust, attachRegionalSupport, regionalBattleContext, commitRegionalBattleState, isRegionalSupport, ownedBattleUnits, hasLivingOwnedAlly, getRegionalSupportSkill } from '../src/battle/regionalSupport.js'
import { REGIONAL_BOND_STORIES } from '../src/adventure/regionalBondStories.js'
import { EVENT_STORIES } from '../src/adventure/eventStories.js'
import { createStoryProgress, getStoryChoices, resolveStoryAction, completeStoryBattle, upgradeRegionalTrustMemory } from '../src/adventure/storyEvents.js'
import { BOSS_PROFILES } from '../src/data/bossProfiles.js'
import { buildTurnPreview } from '../src/battle/commandPreview.js'
const manifest = JSON.parse(fs.readFileSync(new URL('../src/data/digimonModelManifest.json', import.meta.url)))
const maps = JSON.parse(fs.readFileSync(new URL('../data/map.json', import.meta.url)))
const unit = (id, extra = {}) => ({ id, name: '아구몬', imageName: '아구몬', level: 25, maxHp: 100, currentHp: 75, speed: 20, attack: 30, specialAttack: 25, skills: ['가짜 공격'], skillCooldowns: {}, activeBuffs: {}, battleItems: {}, ...extra })
const state = (extra = {}) => { const a = unit('a'), b = unit('b'); return { runStats: createRunStats(1000), currentMap: '시작의마을', currentStage: 10, levelCap: 25, party: [a,b], player: a, activeAllyIds: ['a','b'], actingAllyId: 'a', actedAllyIds: [], pendingAllyActions: [], enemies: [unit('boss',{isBoss:true})], inventory: {}, gold:10000, eventMemory:{regions:{시작의마을:{trust:2}}}, ...extra } }
const factory = ({id,name,level}) => unit(id,{name,imageName:name,level})
const deps = { speciesLookup: new Map(Object.keys(manifest).map(name=>[name,{이름:name}])), createCombatant:factory, refreshStats:u=>u }
const attach = s => attachRegionalSupport(s,deps)
const command = (s,id) => ({id:'resolve',value:id,eventId:s.explorationEvent.id,revision:s.explorationEvent.revision})
const storyState = story => state({currentStage:5,currentMap:story.maps[0],eventMemory:{},enemies:[],explorationEvent:{id:'exploration-5',stage:5,mapName:story.maps[0],storyId:story.id,phase:'choice',revision:0,questRoll:0,species:[]}})
test('all 34 maps have unique local stories and fully animated resident assets',()=>{
 assert.equal(REGIONAL_SUPPORT_PROFILES.length,34); assert.equal(REGIONAL_BOND_STORIES.length,34)
 assert.equal(new Set(EVENT_STORIES.map(s=>s.id)).size,EVENT_STORIES.length)
 for(const p of REGIONAL_SUPPORT_PROFILES){assert(Object.hasOwn(maps,p.mapName),p.mapName);assert(REGIONAL_BOND_STORIES.some(s=>s.maps[0]===p.mapName&&s.npc===p.name)); const m=manifest[p.name];assert(m,p.name);assert(m.clips.includes('idle')&&m.clips.includes('damage')&&m.clips.includes('down')&&m.clips.some(c=>/^attack|^special/.test(c)),p.name)}
})
test('14 new bosses and all new event opponents are present in the live roster',()=>{
 const ids=['rust-tyrannomon','moon-hunt','ceres-garden','neptune-trident','royal-wasp','valkyrie-watch','scrap-crown','alien-contact','orochi-pond','bancho-justice','suijin-foundry','sleipmon-trial','dorubick-fire','plesio-mirage']
 assert(BOSS_PROFILES.length >= 55)
 for(const id of ids){const p=BOSS_PROFILES.find(p=>p.id===id);assert(p&&p.rules.length);p.line.forEach(name=>assert(manifest[name],name))}
 REGIONAL_BOND_STORIES.flatMap(s=>s.routes.flatMap(r=>r.battle?.opponents??[])).forEach(name=>assert(manifest[name],name))
})
test('map trust clamps to 0..3 while NPC discounts and spent promise survive',()=>{
 let memory={contacts:{에렉몬:2},regions:{시작의마을:{trust:2,aidUsed:true,aidStage:10}}}
 memory=updateRegionalTrust(memory,'시작의마을',9);assert.equal(memory.regions.시작의마을.trust,3);assert.equal(memory.contacts.에렉몬,2);assert(memory.regions.시작의마을.aidUsed)
 assert.equal(getRegionalTrust({eventMemory:updateRegionalTrust(memory,'시작의마을',-9)},'시작의마을'),0)
 assert.equal(updateRegionalTrust(memory,'없는 맵',1),memory)
})
test('legacy successful journal recovers trust once without spending aid',()=>{
 const old={contacts:{에렉몬:2},journal:[{mapName:'시작의마을',storyId:'village-first-lights',choiceId:'light'},{mapName:'시작의마을',storyId:'village-first-lights',choiceId:'blanket'}]}
 const fresh=upgradeRegionalTrustMemory(old);assert.equal(getRegionalTrust({eventMemory:fresh},'시작의마을'),2);assert.equal(getRegionalTrust({eventMemory:upgradeRegionalTrustMemory(fresh)},'시작의마을'),2);assert.equal(fresh.contacts.에렉몬,2)
})
test('trust 2 earns one separate AI helper and stores the spent regional promise',()=>{
 const s=attach(state());assert.equal(s.party.length,2);assert(!s.party.some(isRegionalSupport));assert.equal(s.activeAllyIds.length,1);assert.equal(s.regionalSupport.unit.name,'에렉몬');assert(s.eventMemory.regions.시작의마을.aidUsed);assert.equal(attach(s),s)
 const next=attach({...s,currentStage:20,regionalSupport:null});assert.equal(next.regionalSupport,null)
})
test('trust 1, nonboss fights, duo bosses, event battles and all-owned-fainted cannot spend aid',()=>{
 for(const s of [state({eventMemory:{regions:{시작의마을:{trust:1}}}}),state({enemies:[unit('wild')]}),state({enemies:[unit('boss',{isBoss:true}),unit('minion')]}),state({explorationEvent:{phase:'battle'}}),state({party:[unit('a',{currentHp:0})]})]){assert.equal(attach(s),s);assert(!s.regionalSupport)}
})
test('a solo rival also accepts regional aid; higher trust gives a stronger helper',()=>{
 const s=attach(state({enemies:[unit('rival',{rivalEncounter:{leader:true}})]}));assert(s.regionalSupport)
 const strong=attach(state({eventMemory:{regions:{시작의마을:{trust:3}}}}));assert(strong.regionalSupport.unit.level>s.regionalSupport.unit.level)
})
test('composition always has one owned slot + helper while ownership/cost stay unchanged',()=>{
 const s=attach(state());const c=regionalBattleContext(s,s.party,s.activeAllyIds);assert.deepEqual(c.activeAllyIds,['a',s.regionalSupport.unit.id]);assert.equal(c.party.length,3);assert.equal(ownedBattleUnits(c.party).length,2)
 const committed=commitRegionalBattleState({...s,...c});assert.equal(committed.party.length,2);assert.deepEqual(committed.activeAllyIds,['a']);assert(!isRegionalSupport(committed.player))
})
test('fainted human slot stays vacant for manual replacement; helper cannot avoid total loss',()=>{
 const s=attach(state());const party=s.party.map(u=>u.id==='a'?{...u,currentHp:0}:u);const c=regionalBattleContext(s,party,['a']);assert.equal(c.activeAllyIds[0],'a');assert(!hasLivingOwnedAlly(c.party,c.activeAllyIds));assert(hasLivingOwnedAlly(c.party))
 const fallen=c.party.map(u=>isRegionalSupport(u)?u:{...u,currentHp:0});assert(!hasLivingOwnedAlly(fallen));assert(isRegionalSupport(fallen.at(-1))&&fallen.at(-1).currentHp>0)
})
test('round commit persists helper damage, status and cooldown without contaminating commands',()=>{
 const s=attach(state());const c=regionalBattleContext(s,s.party,s.activeAllyIds);const guest={...c.party.at(-1),currentHp:9,statusEffect:{type:'마비',turns:2},skillCooldowns:{attack:3}}
 const next=commitRegionalBattleState({...s,party:[...s.party,guest],activeAllyIds:c.activeAllyIds,actingAllyId:guest.id,player:guest,actedAllyIds:['a',guest.id],pendingAllyActions:[{side:'ally',actorId:'a'},{side:'ally',actorId:guest.id}]})
 const restored=JSON.parse(JSON.stringify(next));assert.equal(restored.regionalSupport.unit.currentHp,9);assert.equal(restored.regionalSupport.unit.skillCooldowns.attack,3);assert.equal(restored.regionalSupport.unit.statusEffect.type,'마비');assert.deepEqual(restored.activeAllyIds,['a']);assert.deepEqual(restored.actedAllyIds,['a']);assert.equal(restored.pendingAllyActions.length,1);assert.equal(restored.player.id,'a')
 assert.equal(regionalBattleContext(restored,restored.party,restored.activeAllyIds).party.at(-1).currentHp,9)
})
test('finished or stale-stage helpers never rejoin from a reward/manual save',()=>{
 const s=attach(state());const c=regionalBattleContext(s,s.party,s.activeAllyIds);const end=commitRegionalBattleState({...s,...c},{finished:true});assert.equal(regionalBattleContext(end,end.party,end.activeAllyIds).party.length,2);assert(end.eventMemory.regions.시작의마을.aidUsed)
 assert.equal(regionalBattleContext({...s,currentStage:11},s.party,s.activeAllyIds).party.length,2)
})
test('AI chooses an offensive ready skill and respects shared cooldown; supports cannot heal or stall',()=>{
 const skills={weak:{기술명:'weak',분류:'물리형',데미지:10},strong:{기술명:'strong',분류:'특수형',데미지:30,cooldownGroup:'beam'},heal:{기술명:'heal',분류:'보조형',효과:{kind:'heal'}}};const actor=unit('guest',{regionalSupport:true,skills:['weak','strong','heal']})
 assert.equal(getRegionalSupportSkill(actor,n=>skills[n],s=>s.데미지),'strong');assert.equal(getRegionalSupportSkill({...actor,skillCooldowns:{'@beam':2}},n=>skills[n],s=>s.데미지),'weak');assert.equal(getRegionalSupportSkill({...actor,skillCooldowns:{weak:1,'@beam':2}},n=>skills[n]),'기본 타격');assert.equal(getRegionalSupportSkill({...actor,currentHp:0},n=>skills[n]),null)
})
test('turn preview labels helper as automatic without turning it into a pending command',()=>{
 const s=attach(state());const c=regionalBattleContext(s,s.party,s.activeAllyIds);const rows=buildTurnPreview({allies:c.party.filter(u=>c.activeAllyIds.includes(u.id)),enemies:s.enemies});assert(rows.find(r=>r.id===s.regionalSupport.unit.id).automatic);assert(!rows.find(r=>r.id==='a').automatic)
})
for(const story of REGIONAL_BOND_STORIES){test(story.maps[0]+' resident quest has real single-choice outcomes and no premature combat rewards',()=>{
 const s=storyState(story);assert.equal(createStoryProgress(s,story.theme,()=>0).storyId,story.id)
 const choice=getStoryChoices(s).find(r=>r.id===story.routes[0].id);assert(choice&&!choice.disabledReason)
 const outcome=resolveStoryAction(s,command(s,choice.id),u=>u);assert(outcome.ok)
 if(choice.battle){assert(outcome.requestBattle);assert.equal(getRegionalTrust(outcome.state),0);assert.equal(outcome.state.gold,s.gold);const battle={...outcome.state,enemies:[unit('event-foe',{currentHp:0})],explorationEvent:{...outcome.state.explorationEvent,battle:{...outcome.state.explorationEvent.battle,enemyIds:['event-foe']}}};const won=completeStoryBattle(battle,u=>u);assert(won.ok);assert.equal(getRegionalTrust(won.state),2);assert(!completeStoryBattle(won.state,u=>u).ok);const escaped=completeStoryBattle({...battle,enemies:[unit('event-foe')]},u=>u,{escaped:true});assert(escaped.ok);assert.equal(getRegionalTrust(escaped.state),0)}
 else {assert.equal(getRegionalTrust(outcome.state),2);assert(outcome.state.explorationEvent.result.changes.some(c=>c.label===story.maps[0]));assert(!resolveStoryAction(outcome.state,command(s,choice.id),u=>u).ok)}
 assert(!resolveStoryAction(s,{...command(s,choice.id),eventId:'wrong'},u=>u).ok)
})}

import vm from 'node:vm'
const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
function appFunction(name, nextName, context, indent = '') {
  const marker = indent + 'const ' + name + ' ='
  const start = appSource.indexOf(marker), end = appSource.indexOf(indent + 'const ' + nextName + ' =', start)
  assert(start >= 0 && end > start, name + ' handler must exist')
  context.advanceRunTurn ??= advanceRunTurn
  context.chooseBattleCommand ??= chooseBattleCommand
  context.isSupportSkill ??= skill => skill?.분류 === '보조형' || Boolean(skill?.효과)
  context.getTacticalOptions = (allies, opponents) => ({ allies, opponents, getSkill: context.getSkillData,
    estimateAttack: () => ({ damage: 40, minDamage: 34, accuracy: 1 }), random: () => 0 })
  return vm.runInNewContext('(' + appSource.slice(start + marker.length, end).trim() + ')', context)
}
const lookup = (party,id) => party.find(u=>u.id===id) ?? null
const able = unit => unit && !unit.isEgg && unit.currentHp>0
function battleHarness(s) {
  const context = { gameState:s, isRegionalSupport, ownedBattleUnits, regionalBattleContext,
    getCombatantById:lookup, isCombatantAbleToBattle:able,
    applyMapEnvironment:s=>s, syncPartyMember:party=>party,
    getBattleAllyLimit:()=>1,getActiveAllyIdsForParty:party=>party.filter(able).slice(0,1).map(u=>u.id) }
  context.getFirstLivingPartyMember=appFunction('getFirstLivingPartyMember','getNextActingAllyId',context)
  context.getNextActingAllyId=appFunction('getNextActingAllyId','normalizeBuffState',context)
  context.getFaintReplacement=appFunction('getFaintReplacement','replaceFaintedAlly',context)
  return {context, getContext:appFunction('getBattleContext','finishExplorationBattle',context,'  ')}
}
test('actual App context renders helper but never asks it for a command',()=>{
 const s=attach(state()),h=battleHarness(s),c=h.getContext()
 assert.equal(c.activeAllies.length,2);assert.equal(c.actingAlly.id,'a')
 assert.equal(h.context.getNextActingAllyId(c.party,c.activeAllyIds,['a']),null)
 const vacant={...s,party:s.party.map(u=>u.id==='a'?{...u,currentHp:0}:u)}
 const dead=battleHarness(vacant).getContext();assert.equal(dead.actingAlly,null)
 const replacement=h.context.getFaintReplacement({...vacant,party:[...vacant.party,s.regionalSupport.unit],activeAllyIds:['a',s.regionalSupport.unit.id]})
 assert(replacement);assert.deepEqual(Array.from(replacement.candidates,u=>u.id),['b'])
 const noGuestReplacement=h.context.getFaintReplacement({...s,party:[...s.party,{...s.regionalSupport.unit,currentHp:0}],activeAllyIds:['a',s.regionalSupport.unit.id]})
 assert.equal(noGuestReplacement,null)
})
test('actual App AI submits exactly one ready offensive action and stops without an owned active ally',()=>{
 const s=attach(state()),c=regionalBattleContext(s,s.party,s.activeAllyIds)
 const context={hasLivingOwnedAlly,isRegionalSupport,isCombatantAbleToBattle:able,getLivingCombatants:p=>p.filter(able),getRegionalSupportSkill,
  getSkillData:name=>({기술명:name,분류:'물리형',데미지:40}),scoreSkill:()=>1,getMatchupResult:()=>({multiplier:1}),
  createBattleTurnAction:spec=>({side:spec.side,actorId:spec.actor.id,skillName:spec.skillName,targetId:spec.targetId,order:spec.order})}
 const ai=appFunction('createRegionalSupportActions','createEnemyBattleTurnActions',context)
 const actions=ai({...c,enemies:s.enemies});assert.equal(actions.length,1);assert.equal(actions[0].actorId,s.regionalSupport.unit.id);assert(actions[0].automatic);assert.equal(actions[0].targetId,'boss')
 assert.equal(ai({...c,party:c.party.map(u=>u.id==='a'?{...u,currentHp:0}:u),enemies:s.enemies}).length,0)
})
test('actual App XP distribution excludes the helper from both rewards and division',()=>{
 const s=attach(state()),c=regionalBattleContext(s,s.party,s.activeAllyIds),awarded=[]
 const ctx={getCombatantById:lookup,isCombatantAbleToBattle:able,isRegionalSupport,getExperienceReward:()=>100,getBoostedExperienceAmount:n=>n,
  getCatchUpExperienceMultiplier:()=>1,getItemExperienceMultiplier:()=>1,getTrainerExperienceMultiplier:()=>1,
  getInventoryItemCount:()=>0,EXP_SHARE_ITEM_ID:'exp-share',replacePartyMember:(party,u)=>party.map(p=>p.id===u.id?u:p),
  applyExperienceAmount:({combatant,experienceAmount})=>{awarded.push([combatant.id,experienceAmount]);return{nextCombatant:combatant,battleLogs:[],skillLearnEvents:[]}}}
 const gain=appFunction('applyPartyExperienceGain','getSupportTargetPool',ctx)
 gain({...c,defeatedEnemies:s.enemies,levelCap:25});assert.deepEqual(awarded,[['a',100],['b',55]])
 awarded.length=0;ctx.getInventoryItemCount=()=>1
 const shared=appFunction('applyPartyExperienceGain','getSupportTargetPool',ctx)
 shared({...c,defeatedEnemies:s.enemies,levelCap:25});assert.deepEqual(awarded,[['a',100],['b',75]])
})
test('actual App visual hit cue updates helper HP/status without inserting it into the saved party',()=>{
 const s=attach(state());let next=s
 const context={screenMode:'adventure',setGameState:fn=>next=fn(next),normalizeStatusEffect:s=>s}
 const apply=appFunction('applyVisualAttackDamage','playBattleAttackEffects',context,'  ')
 apply({targetSide:'ally',targetId:s.regionalSupport.unit.id,targetCurrentHp:7,targetStatusEffect:{type:'마비'}})
 assert.equal(next.regionalSupport.unit.currentHp,7);assert.equal(next.regionalSupport.unit.statusEffect.type,'마비');assert.equal(next.party.length,2);assert.equal(next.player.currentHp,75)
})
test('actual App entry and both completed-round paths are wired to aid, reset and AI',()=>{
 const entry=appSource.slice(appSource.indexOf('  const startNextStage ='),appSource.indexOf('  const handleNextStage ='))
 assert(entry.includes('regionalSupport: null'));assert(entry.includes('attachRegionalSupport(nextGameState'))
 const attack=appSource.slice(appSource.indexOf('  const handleExecuteSkill ='),appSource.indexOf('\n  useEffect(',appSource.indexOf('  const handleExecuteSkill =')))
 assert(attack.includes('nextPendingActions.push(...createRegionalSupportActions('))
 const nonAttack=appSource.slice(appSource.indexOf('  const finishBattleAction ='),appSource.indexOf('  const finishResolvedTurn ='))
 assert(nonAttack.includes('pendingAllyActions.push(...createRegionalSupportActions('))
 assert(appSource.includes('runAfterBattleRecall([guest]'))
 const storyUi=fs.readFileSync(new URL('../src/components/StoryEncounter.jsx',import.meta.url),'utf8');assert(storyUi.includes('const aid = getRegionalAid(state)'))
})

import { normalizeCollection, recordGameCollection, getCollectionStatus } from '../src/progression/digimonCollection.js'
test('temporary allies and their evolution history never unlock the local collection',()=>{
 const collection=normalizeCollection(null);assert.equal(getCollectionStatus(collection,'레오몬'),'unknown')
 const guest=unit('guest',{regionalSupport:true,name:'레오몬',imageName:'레오몬',evolutionHistory:['메라몬']})
 const next=recordGameCollection(collection,{party:[guest],player:guest,enemies:[],unlockedSpecies:[],digimonAnalysis:{}},1)
 assert.equal(getCollectionStatus(next,'레오몬'),'unknown');assert.equal(getCollectionStatus(next,'메라몬'),'unknown')
})
test('actual App manual switch keeps every intermediate state owned-only while helper remains in the resolved turn',()=>{
 const s=attach(state());const c=regionalBattleContext(s,s.party,s.activeAllyIds),states=[],finished=[];let continuation
 const ctx={gameState:s,rewardState:null,battlePanelMode:'party',getBattleContext:()=>({...c,actingAlly:s.player}),getCombatantById:lookup,
  isCombatantAbleToBattle:able,isRegionalSupport,commitRegionalBattleState,setGameState:x=>states.push(x),showImmediateBattleLogs:()=>{},
  setSelectedBattleCommand:()=>{},setBattlePanelMode:()=>{},runAfterBattleSwitch:(a,b,fn)=>continuation=fn,finishBattleAction:x=>finished.push(x)}
 const swap=appFunction('handleSwitchPartyMember','getRewardItemBySource',ctx,'  ');swap('b')
 assert.equal(states.length,1);assert(!states[0].party.some(isRegionalSupport));assert.equal(states[0].activeAllyIds[0],'b')
 continuation();assert(finished[0].nextParty.some(isRegionalSupport));assert(finished[0].preferredActiveAllyIds.includes(s.regionalSupport.unit.id))
})
test('all owned allies fainting takes precedence over a poisoned boss KO even when helper survives',()=>{
 const s=attach(state());const c=regionalBattleContext(s,s.party,s.activeAllyIds);let losses=0,rewards=0;const committed=[],h=battleHarness(s)
 const ctx={...h.context,gameState:s,hasLivingOwnedAlly,commitRegionalBattleState,completeStoryBattle,refreshCombatantStats:u=>u,clearStageSave:()=>losses++,
  gameAudio:{situation:()=>{}},gameSettings:{gameSpeed:1},setGameState:x=>committed.push(x),showBattleLogSequence:()=>{},
  setSelectedBattleCommand:()=>{},setSelectedSkillIndex:()=>{},queueSkillReplacementEvents:()=>{},window:{setTimeout:()=>1},
  createRewardSelection:()=>{rewards++;throw Error('No reward after all owned allies faint')}}
 const finish=appFunction('finishResolvedTurn','startNextStage',ctx,'  ')
 finish({nextParty:c.party.map(u=>isRegionalSupport(u)?u:{...u,currentHp:0}),nextEnemies:[{...s.enemies[0],currentHp:0}],logs:[],preferredActiveAllyIds:c.activeAllyIds})
 assert.equal(losses,1);assert.equal(rewards,0);assert.equal(committed.length,1);assert(!committed[0].party.some(isRegionalSupport));assert.equal(committed[0].rewardCheckpoint,undefined)
})
for(const command of ['item','switch'])test('actual App '+command+' round submits one AI attack plus one enemy turn without a second human attack',()=>{
 const s=attach(state()),c=regionalBattleContext(s,s.party,s.activeAllyIds),h=battleHarness(s);let submitted
 const ctx={...h.context,gameState:s,hasLivingOwnedAlly,isRegionalSupport,getRegionalSupportSkill,getLivingCombatants:p=>p.filter(able),
  getSkillData:name=>({기술명:name,분류:'물리형',데미지:40}),scoreSkill:()=>1,getMatchupResult:()=>({multiplier:1}),
  createBattleTurnAction:spec=>({side:spec.side,actorId:spec.actor.id,skillName:spec.skillName,targetId:spec.targetId,order:spec.order}),
  playBattleAttackEffects:()=>{},resolveNonAttackActionEnd:party=>({nextParty:party,battleLogs:[]}),
  createEnemyBattleTurnActions:()=>[{side:'enemy',actorId:'boss'}],
  resolveBattleTurnActions:args=>{submitted=args.actions;return{nextParty:args.party,nextEnemies:args.enemies,battleLogs:[],hitEffects:[],skillLearnEvents:[],presentation:[]}},
  runAfterBattleAttackEffects:()=>{},gameSettings:{gameSpeed:1}}
 ctx.createRegionalSupportActions=appFunction('createRegionalSupportActions','createEnemyBattleTurnActions',ctx)
 const finish=appFunction('finishBattleAction','finishResolvedTurn',ctx,'  ')
 finish({nextParty:c.party,nextEnemies:s.enemies,logs:[],actedAllyId:'a',preferredActiveAllyIds:c.activeAllyIds})
 assert.equal(submitted.filter(a=>a.actorId===s.regionalSupport.unit.id).length,1);assert.equal(submitted.filter(a=>a.side==='enemy').length,1);assert(!submitted.some(a=>a.actorId==='a'))
})
test('battle item menu and resolution both receive the composed active ally formation',()=>{
 assert(appSource.includes('<BattleItemMenu state={{ ...gameState, party: battleContext.party, activeAllyIds }}'))
 assert(appSource.includes('resolveBattleItemUse({ ...gameState, party: context.party, activeAllyIds: context.activeAllyIds }'))
})

test('actual App owned menus exclude helper while active formation still includes it',()=>{
 const s=attach(state()),c=regionalBattleContext(s,s.party,s.activeAllyIds)
 const declaration=appSource.match(/  const partyMembers = ([^\n]+)/);assert(declaration)
 const menuParty=vm.runInNewContext(declaration[1],{battleContext:c,ownedBattleUnits})
 assert.deepEqual(Array.from(menuParty,u=>u.id),['a','b']);assert(c.party.some(isRegionalSupport))
})
test('actual App rejects a helper as a manual switch candidate even if its active slot is stale',()=>{
 const s=attach(state()),c=regionalBattleContext(s,s.party,s.activeAllyIds);let changed=0
 const ctx={gameState:s,rewardState:null,battlePanelMode:'party',getBattleContext:()=>({...c,activeAllyIds:['a'],actingAlly:s.player}),
  getCombatantById:lookup,isCombatantAbleToBattle:able,isRegionalSupport,commitRegionalBattleState,
  setGameState:()=>changed++,showImmediateBattleLogs:()=>{},setSelectedBattleCommand:()=>{},setBattlePanelMode:()=>{},runAfterBattleSwitch:()=>{}}
 const swap=appFunction('handleSwitchPartyMember','getRewardItemBySource',ctx,'  ');swap(s.regionalSupport.unit.id);assert.equal(changed,0)
})

import { BOSS_MAP_THEMES } from '../src/data/bossProfiles.js'
import { getBossCandidates, createBossPlan, resolveBossReactions } from '../src/battle/bossEncounters.js'
const extraBossIds=['rust-tyrannomon','moon-hunt','ceres-garden','neptune-trident','royal-wasp','valkyrie-watch','scrap-crown','alien-contact','orochi-pond','bancho-justice','suijin-foundry','sleipmon-trial','dorubick-fire','plesio-mirage']
for(const id of extraBossIds)test(id+' is reachable on a fitting map and its saved pending pattern replaces exactly one action',()=>{
 const p=BOSS_PROFILES.find(p=>p.id===id),rule=p.rules[0],lookup=new Map(Object.keys(manifest).map(name=>[name,{이름:name}]))
 let stage=Math.ceil(p.minStage/10)*10;if((Math.floor(stage/10)%2===1)!==(p.kind==='lineage'))stage+=10
 const map=Object.keys(BOSS_MAP_THEMES).find(map=>p.themes.includes(BOSS_MAP_THEMES[map]));assert(getBossCandidates(stage,map,lookup).some(candidate=>candidate.id===id))
 const plan=createBossPlan(p,stage),condition=rule.condition;plan.actions=condition.kind==='actions'?condition.count:0
 let boss=unit('pattern-boss',{name:plan.initialName,maxHp:100,currentHp:condition.kind==='hp'?Math.floor(100*condition.ratio):90,isBoss:true,bossEncounter:plan,statModifiers:{},battleGuards:{},statusEffect:{type:'중독'}})
 let hits=[]
 if(condition.kind==='hits')hits=Array.from({length:condition.count},()=>({targetId:boss.id,targetSide:'enemy',damage:1,category:condition.category}))
 if(condition.kind==='critical')hits=[{targetId:boss.id,targetSide:'enemy',damage:1,isCritical:true}]
 if(condition.kind==='miss')hits=[{targetId:boss.id,targetSide:'enemy',damage:0,isMiss:true}]
 const deps={speciesLookup:lookup,evolveBoss:(u,data)=>({...u,name:data.이름}),refreshCombatantStats:(u,options={})=>({...u,...options}),getSkillData:()=>null}
 const deferred=resolveBossReactions({enemies:[boss],actorId:'owned',actorSide:'ally',hitEffects:hits,deferPatterns:true},deps)
 boss=JSON.parse(JSON.stringify(deferred.nextEnemies[0]));assert(boss.bossEncounter.pendingRules?.includes(rule.id));assert(!boss.bossEncounter.usedRules.includes(rule.id))
 let active=resolveBossReactions({enemies:[boss],actorId:boss.id,actorSide:'enemy',didAct:false,patternActorId:boss.id,deferPatterns:true},deps)
 assert(active.changes.filter(change=>change.consumesAction).length<=1)
 for(let pending=0;!active.changes.some(change=>change.label===rule.label)&&pending<plan.phases.length;pending++) {
   // Every already-crossed HP section/evolution has priority. The rule must remain
   // unspent and fire on the next own action, rather than stacking both powers.
   assert(active.changes.some(change=>change.actionActorId===boss.id))
   assert(active.nextEnemies[0].bossEncounter.pendingRules.includes(rule.id))
   assert(!active.nextEnemies[0].bossEncounter.usedRules.includes(rule.id))
   active=resolveBossReactions({enemies:active.nextEnemies,actorId:boss.id,actorSide:'enemy',didAct:false,patternActorId:boss.id,deferPatterns:true},deps)
 }
 const changes=active.changes.filter(change=>change.label===rule.label);assert.equal(changes.length,1);assert(changes[0].consumesAction)
 assert.equal(active.changes.filter(change=>change.consumesAction).length,1)
 const after=active.nextEnemies[0];assert(after.bossEncounter.usedRules.includes(rule.id))
 for(const [key,multiplier] of Object.entries(rule.effect.stats??{})){const applied=after.statModifiers[key].multiplier;assert(multiplier>=1?applied>=multiplier:applied<=multiplier,'Stronger phase effects must survive a weaker pattern')}
 for(const [key,turns] of Object.entries(rule.effect.guards??{}))assert(after.battleGuards[key]>=turns)
 if(rule.effect.clearStatus)assert.equal(after.statusEffect,null)
 if(rule.effect.healRatio)assert(after.currentHp>boss.currentHp)
 const repeat=resolveBossReactions({enemies:[after],actorId:after.id,actorSide:'enemy',didAct:false,patternActorId:after.id,deferPatterns:true},deps)
 assert(!repeat.changes.some(change=>change.label===rule.label))
})

test('actual App completed round removes KO helper from formation, keeps reserve on bench and persists 1v1',()=>{
 const s=attach(state()),c=regionalBattleContext(s,s.party,s.activeAllyIds),h=battleHarness(s),states=[],saved=[]
 const ctx={...h.context,hasLivingOwnedAlly,commitRegionalBattleState,completeStoryBattle,refreshCombatantStats:u=>u,
  setGameState:x=>states.push(x),saveStageGameState:x=>saved.push(x),showBattleLogSequence:()=>{},getBattlePrompt:n=>n,
  setSelectedBattleCommand:()=>{},setSelectedSkillIndex:()=>{},queueSkillReplacementEvents:()=>{}}
 const finish=appFunction('finishResolvedTurn','startNextStage',ctx,'  ')
 finish({nextParty:c.party.map(u=>isRegionalSupport(u)?{...u,currentHp:0}:u),nextEnemies:s.enemies,logs:[],preferredActiveAllyIds:c.activeAllyIds})
 assert.equal(states.length,1);assert.equal(states[0].runStats.totalTurns,1);assert.equal(s.runStats.totalTurns,0);assert.deepEqual(Array.from(states[0].activeAllyIds),['a']);assert.equal(states[0].awaitingReplacement,false);assert.equal(states[0].regionalSupport.unit.currentHp,0);assert(states[0].regionalSupport.defeated);assert.equal(saved.length,1)
 const resumed=JSON.parse(JSON.stringify(saved[0]));assert.equal(resumed.runStats.totalTurns,1);assert.equal(battleHarness(resumed).getContext().activeAllies.length,1);assert.equal(battleHarness(resumed).getContext().activeAllies[0].id,'a')
})
