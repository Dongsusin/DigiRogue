import assert from 'node:assert/strict'
import { test, after } from 'node:test'
const originalRandom = Math.random
Math.random = () => .5
after(() => { Math.random = originalRandom })
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { BOSS_PROFILES } from '../src/data/bossProfiles.js'
import { RIVAL_PROFILES } from '../src/data/rivalProfiles.js'
import { getEncounterTactics, ENCOUNTER_PATTERN_ROSTER } from '../src/data/encounterPatterns.js'
import { applyEncounterDrain } from '../src/battle/encounterPatterns.js'
import { createRivalEncounter } from '../src/battle/rivalEncounters.js'
import { createBattlePresentation } from '../src/three/battleLogTimeline.js'
import { resolveBossReactions } from '../src/battle/bossEncounters.js'
const e = await loadBattleEngine()
const unit = (name,id=name,extra={}) => ({...e.createCombatant({id,name,data:e.allDigimonLookup.get(name),level:60}),...extra})
const boss = (name,actions=0,extra={}) => e.refreshCombatantStats(unit(name,'boss',{isBoss:true,bossStage:80,enemyStage:80,
 bossEncounter:{version:2,kind:'wild',id:'pattern-test',leader:true,stage:80,initialName:name,phases:[],rules:[],phase:0,usedRules:[],pendingRules:[],actions,companionIds:[],hitStreak:0},...extra}))
const party = () => [unit('아구몬','a'),unit('파피몬','b'),unit('팔몬','reserve'),{id:'egg',isEgg:true,currentHp:1}]
const turn = (enemy,p=party(),path='resolveBattleTurnActions') => path==='resolveBattleTurnActions'
 ? e.resolveBattleTurnActions({party:p,enemies:[enemy],activeAllyIds:['a','b'],inventory:{},actions:[e.createBattleTurnAction({side:'enemy',actor:enemy,skillName:'기본 타격',targetId:'a'})]})
 : e.resolveEnemyPartyActions({party:p,enemies:[enemy],activeAllyIds:['a','b'],inventory:{}})
const prepare = enemy => e.prepareBossTurn({enemies:[enemy],actorId:enemy.id,party:party(),activeAllyIds:['a','b']})
test('WarGreymon chooses its native Brave Tornado as a finite signature',()=>{
 const r=prepare(boss('워그레이몬',2));assert.equal(r.skill?.기술명,'브레이브 토네이도');assert(r.consumesAction)
 const next=prepare(r.nextEnemies[0]);assert.equal(next.skill,null);assert.equal(next.consumesAction,false)
})
test('Craniamon Avalon guards both damage classes and replaces the attack in both paths',()=>{
 for(const path of ['resolveBattleTurnActions','resolveEnemyPartyActions']) {
 const r=turn(boss('크레니엄몬',1),party(),path),b=r.nextEnemies[0]
 assert(b.battleGuards.physical>0&&b.battleGuards.special>0,path)
 assert.equal(r.hitEffects.filter(h=>h.attackerId==='boss').length,0,path)
 }
})
test('Love Serenade weakens only the active party, with no additional damage',()=>{
 const p=party(),r=turn(boss('에테몬',1),p)
 assert.equal(r.nextParty[0].statModifiers.attack?.multiplier,.85)
 assert.equal(r.nextParty[1].statModifiers.attack?.multiplier,.85)
 assert.deepEqual(r.nextParty.slice(2),p.slice(2));assert.equal(r.hitEffects.length,0)
})
test('enemy stat barriers and passives still protect against the Serenade',()=>{
 const p=party();p[0].battleGuards={stats:2};const r=turn(boss('에테몬',1),p)
 assert.equal(r.nextParty[0].statModifiers.attack,null);assert.equal(r.nextParty[1].statModifiers.attack?.multiplier,.85)
})
test('Diaboromon makes one ordinary clone and neither actor attacks during summoning',()=>{
 const r=turn(boss('디아블로몬',1));assert.equal(r.nextEnemies.length,2)
 const clone=r.nextEnemies.find(u=>u.id!=='boss');assert.equal(clone.name,'디아블로몬');assert.equal(clone.isBoss,false)
 assert.equal(clone.bossEncounter,undefined);assert.equal(r.hitEffects.length,0)
 assert.equal(e.prepareBossTurn({enemies:r.nextEnemies,actorId:'boss',party:r.nextParty,activeAllyIds:['a','b']}).nextEnemies.length,2)
})
test('only one power is spent per actor action, leaving other triggered rules pending',()=>{
 const b=boss('아구몬',0);b.bossEncounter.rules=['one','two'].map(id=>({id,label:id,condition:{kind:'actions',count:0},effect:{stats:{attack:1.1}}}))
 const r=prepare(b);assert.equal(r.changes.filter(c=>c.consumesAction).length,1)
 assert.deepEqual(r.nextEnemies[0].bossEncounter.usedRules,['one']);assert(r.nextEnemies[0].bossEncounter.pendingRules.includes('two'))
})
test('an HP phase wins over a queued species power without spending it',()=>{
 const b=boss('크레니엄몬',1);b.currentHp=Math.floor(b.maxHp*.5);b.bossEncounter.phases=[{id:'hp',atHp:.5,label:'구간 해방',effect:{stats:{attack:1.1}}}]
 const r=prepare(b);assert.equal(r.changes.filter(c=>c.consumesAction).length,1)
 assert.equal(r.nextEnemies[0].battleGuards.physical ?? 0,0)
 assert.equal(prepare(r.nextEnemies[0]).nextEnemies[0].battleGuards.physical,2)
})
test('species abilities remain finite across actual save/resume',()=>{
 const r=prepare(boss('워그레이몬',2)),p=party();const s=e.parseSavedGameState(JSON.stringify({version:1,kind:'manual',gameState:{currentStage:80,currentMap:'시작의마을',gameMode:'classic',phase:'battle',party:p.filter(u=>!u.isEgg),player:p[0],enemies:r.nextEnemies,activeAllyIds:['a','b'],encounterCount:2,inventory:{},trainerSkills:{}}}))
 assert(s);assert.equal(prepare(s.enemies[0]).consumesAction,false)
 assert(s.enemies[0].bossEncounter.usedRules.some(id=>id.includes('워그레이몬')))
})
test('ordinary wildlife and final encounters do not acquire these tactics',()=>{
 assert.equal(prepare(unit('크레니엄몬','boss')).consumesAction,false)
 const b=boss('크레니엄몬',10);b.bossEncounter.kind='final';assert.equal(prepare(b).consumesAction,false)
})
test('native signature respects incapacitation and cannot substitute a second attack',()=>{
 for(const path of ['resolveBattleTurnActions','resolveEnemyPartyActions']) {
 const b=boss('워그레이몬',2);b.statusEffect={type:'행동불능',turns:0}
 const r=turn(b,party(),path);assert.equal(r.hitEffects.length,0)
 assert(r.nextEnemies[0].bossEncounter.usedRules.some(id=>id.includes('워그레이몬')))
 }
})

test('every species in all non-final boss and rival formations has a legal native signature and authored tactic',()=>{
 const profiles=[...BOSS_PROFILES.filter(p=>p.kind!=='final'),...RIVAL_PROFILES]
 const names=[...new Set(profiles.flatMap(p=>[...p.line,...(p.formation??[]),...(p.companion?[p.companion]:[])]))]
 assert.equal(profiles.length,205);assert.equal(names.length,270)
 assert.deepEqual(Object.keys(ENCOUNTER_PATTERN_ROSTER).sort(),names.sort())
 const roles=new Set()
 for(const name of names) {
 const b=boss(name),rules=getEncounterTactics(b,e.getSkillData);assert.equal(rules.length,2,name)
 assert.equal(new Set(rules.map(r=>r.id)).size,2,name)
 const signature=rules.find(r=>r.id.endsWith(':signature')).signatureSkill
 assert(e.allDigimonLookup.get(name).기술.includes(signature.기술명),name+': native skill')
 assert(signature.데미지>0&&!signature.효과&&!signature.bossInstantDefeat,name)
 roles.add(ENCOUNTER_PATTERN_ROSTER[name].tactic)
 }
 assert.equal(roles.size,14)
})
test('all 270 signatures execute through the real turn engine without inventing skills or affecting reserves',()=>{
 for(const [name,spec] of Object.entries(ENCOUNTER_PATTERN_ROSTER)) {
 const b=boss(name,2);b.bossEncounter.usedRules=['species:'+name+':trait']
 const p=party(),r=turn(b,p)
 const uses=r.battleLogs.filter(l=>l.includes('이(가) '+spec.signature+'을(를) 사용했다!'))
 assert.equal(uses.length,1,name+': '+JSON.stringify(r.battleLogs))
 assert.equal(r.presentation.filter(x=>x.bossChanges?.some(c=>c.consumesAction)).length,1,name)
 assert.deepEqual(r.nextParty.slice(2),p.slice(2),name)
 assert(r.hitEffects.length<=2,name)
 }
})
test('physical/special hit reactions queue until the boss own action and survive JSON',()=>{
 for(const [name,category,guard] of [['가드로몬','물리형','physical'],['가루몬','특수형','special']]) {
 const b=boss(name),hits=[1,2].map(()=>({targetId:'boss',targetSide:'enemy',category,damage:1}))
 const r=resolveBossReactions({enemies:[b],actorId:'a',actorSide:'ally',hitEffects:hits,deferPatterns:true},
 {speciesLookup:e.allDigimonLookup,evolveBoss:e.evolveBossCombatant,refreshCombatantStats:e.refreshCombatantStats,getSkillData:e.getSkillData})
 assert.equal(r.changes.length,0);assert(r.nextEnemies[0].bossEncounter.pendingRules.some(id=>id.startsWith('species:')))
 const next=prepare(JSON.parse(JSON.stringify(r.nextEnemies[0])));assert.equal(next.nextEnemies[0].battleGuards[guard],2)
 }
})
test('an evolved rival drops obsolete queued species moves and keeps the new native signature',()=>{
 const b=boss('그레이몬',2);b.bossEncounter.pendingRules=['species:그레이몬:trait'];b.bossEncounter.phases=[{id:'evolve',atHp:.5,form:'워그레이몬',label:'진화',effect:{}}];b.currentHp=Math.floor(b.maxHp*.5)
 const r=prepare(b);assert(r.changes.some(c=>c.kind==='evolve'&&!c.consumesAction));assert.equal(r.consumesAction,false)
 assert.equal(r.nextEnemies[0].name,'워그레이몬');assert(!r.nextEnemies[0].bossEncounter.pendingRules.includes('species:그레이몬:trait'))
 const next=prepare(r.nextEnemies[0]);assert.equal(next.skill?.기술명,'브레이브 토네이도')
})
test('a surviving jogress formation retains fusion priority and removes its material once',()=>{
 const enemies=createRivalEncounter({stage:135,mapName:'가디언 팰리스',id:'fusion-오메가몬',speciesLookup:e.allDigimonLookup,level:100,
 createCombatant:spec=>e.createCombatant({...spec,level:spec.level??100})})
 const leader=enemies[0];leader.bossEncounter.actions=10;leader.currentHp=Math.floor(leader.maxHp*.5)
 const r=e.prepareBossTurn({enemies,actorId:leader.id,party:party(),activeAllyIds:['a','b']})
 assert.equal(r.nextEnemies.length,1);assert.equal(r.nextEnemies[0].name,'오메가몬');assert.equal(r.consumesAction,false)
 assert.equal(r.changes.filter(c=>c.kind==='fusion').length,1)
 assert(r.nextEnemies[0].bossEncounter.pendingRules.every(id=>!id.includes('워그레이몬')))
})
test('reinforcement caps at two living enemies and can replace a defeated unrelated support',()=>{
 const b=boss('디아블로몬',1),other=unit('케라몬','other')
 const blocked=e.prepareBossTurn({enemies:[b,other],actorId:'boss',party:party(),activeAllyIds:['a']})
 assert.equal(blocked.nextEnemies.length,2);assert.equal(blocked.consumesAction,false)
 other.currentHp=0
 const r=e.prepareBossTurn({enemies:[b,other],actorId:'boss',party:party(),activeAllyIds:['a']})
 assert.equal(r.nextEnemies.length,2);assert(!r.nextEnemies.some(u=>u.id==='other'))
 const timeline=createBattlePresentation({presentation:[{effects:[],bossChanges:r.changes}]})
 assert(timeline.states.some(s=>s.units.some(u=>u.insertCombatant&&u.targetCombatant.name==='디아블로몬')))
 assert.equal(prepare(r.nextEnemies[1]).consumesAction,false)
})
test('absorption heals only actual damage, capped at eight percent across multiple targets',()=>{
 const b=boss('묘티스몬');b.currentHp=Math.floor(b.maxHp*.4)
 const r=prepare(b);assert(r.skill.encounterDrain)
 const first=applyEncounterDrain(r.nextEnemies[0],r.skill,Math.floor(b.maxHp*.16))
 const second=applyEncounterDrain(first.nextAttacker,r.skill,b.maxHp)
 assert.equal(second.nextAttacker.currentHp-b.currentHp,Math.floor(b.maxHp*.08))
 assert.equal(applyEncounterDrain(second.nextAttacker,r.skill,b.maxHp).nextAttacker.currentHp,second.nextAttacker.currentHp)
 assert.equal(applyEncounterDrain(r.nextEnemies[0],r.skill,0).nextAttacker.currentHp,b.currentHp)
 const r2=turn(b);assert(r2.battleLogs.some(l=>l.includes('데이터를 흡수해 HP')));assert(!('encounterDrainBudget' in r2.nextEnemies[0].bossEncounter))
})
test('self regeneration is bounded to once for the form and cannot reset spent HP gates',()=>{
 const b=boss('케레스몬');b.currentHp=Math.floor(b.maxHp*.4);b.bossHpBreakpoints=[.25]
 const r=prepare(b);assert.equal(r.nextEnemies[0].currentHp,Math.min(b.maxHp,b.currentHp+Math.floor(b.maxHp*.15)))
 assert.deepEqual(r.nextEnemies[0].bossHpBreakpoints,[.25]);assert.equal(prepare(r.nextEnemies[0]).consumesAction,false)
})
test('legacy independent minions keep their ordinary attacks without full boss powers',()=>{
 const b=boss('디아블로몬',20);b.bossEncounter.leader=false;b.isBoss=false
 assert.equal(getEncounterTactics(b,e.getSkillData).length,0);assert.equal(prepare(b).consumesAction,false)
})

test('rival fusion materials and true duo bosses retain their own native patterns',()=>{
 const b=boss('바리스타몬',2);b.bossEncounter.leader=false;b.isBoss=false;b.rivalEncounter={profileId:'fusion-샤우트몬[X2]',leader:false}
 assert.equal(prepare(b).skill?.기술명,ENCOUNTER_PATTERN_ROSTER[b.name].signature)
 delete b.rivalEncounter;b.isBoss=true;assert.equal(getEncounterTactics(b,e.getSkillData).length,2)
})
test('every authored trait runs once through the real battle path under its trigger',()=>{
 for(const name of Object.keys(ENCOUNTER_PATTERN_ROSTER)) {
 let b=boss(name);const trait=getEncounterTactics(b,e.getSkillData)[0]
 const trigger = condition => {
 if(condition.kind==='actions') b.bossEncounter.actions=condition.count
 if(condition.kind==='hp') b.currentHp=Math.max(1,Math.floor(b.maxHp*(condition.ratio-.1)))
 if(condition.kind==='status') b.statusEffect={type:'마비',turns:0}
 if(condition.kind==='hits') {b.bossEncounter.lastCategory=condition.category;b.bossEncounter.hitStreak=condition.count}
 if(condition.kind==='miss') b.bossEncounter.pendingRules=[trait.id]
 if(condition.kind==='all') condition.conditions.forEach(trigger)
 }
 trigger(trait.condition)
 b.bossEncounter.usedRules=['species:'+name+':signature']
 const p=party(),r=turn(b,p)
 assert(r.nextEnemies[0].bossEncounter.usedRules.includes(trait.id),name+': '+JSON.stringify(r.battleLogs))
 assert.equal(r.presentation.flatMap(x=>x.bossChanges??[]).filter(c=>c.consumesAction).length,1,name)
 assert.deepEqual(r.nextParty.slice(2),p.slice(2),name)
 assert(!r.battleLogs.some(l=>l.includes('아직 효과가 구현되지')),name)
 assert.equal(prepare(r.nextEnemies[0]).consumesAction,false,name)
 }
})

test('cooling native signatures and drain strikes remain pending in both paths and across save/resume',()=>{
 for(const [name,actions,ratio] of [['워그레이몬',2,1],['묘티스몬',0,.4]]) {
  const b=boss(name,actions);b.currentHp=Math.floor(b.maxHp*ratio)
  const skill=ENCOUNTER_PATTERN_ROSTER[name].signature
  const id='species:'+name+':'+(ratio<1?'trait':'signature')
  b.skillCooldowns={...b.skillCooldowns,[skill]:2}
  const p=party().map(u=>u.isEgg?u:{...u,currentHp:10000,maxHp:10000})
  const first=prepare(b)
  assert.equal(first.consumesAction,false,name+' must keep an available ordinary action')
  assert(first.nextEnemies[0].bossEncounter.pendingRules.includes(id))
  assert(!first.nextEnemies[0].bossEncounter.usedRules.includes(id))
  const saved=e.parseSavedGameState(JSON.stringify({version:1,gameState:{currentStage:80,currentMap:'시작의마을',gameMode:'classic',party:p.filter(u=>!u.isEgg),player:p[0],enemies:first.nextEnemies,activeAllyIds:['a','b'],encounterCount:2,inventory:{},trainerSkills:{}}}))
  assert(saved);assert.equal(prepare(saved.enemies[0]).consumesAction,false)
  for(const path of ['resolveBattleTurnActions','resolveEnemyPartyActions']) {
   const r=turn(b,p,path),next=r.nextEnemies[0]
   assert(!next.bossEncounter.usedRules.includes(id),path+': cooling rule must remain unspent')
   assert(next.bossEncounter.pendingRules.includes(id),path+': pending rule must survive')
   assert(!r.hitEffects.some(h=>h.attackerId==='boss'&&h.skillName===skill),path+': cooling native strike cannot execute')
   assert(!r.battleLogs.some(l=>l.includes('아직 재사용 대기')),path+': do not waste the ordinary action')
  }
  const ready={...first.nextEnemies[0],skillCooldowns:{...b.skillCooldowns,[skill]:0}}
  const fired=prepare(ready);assert(fired.consumesAction);assert.equal(fired.skill.기술명,skill)
  assert(fired.nextEnemies[0].bossEncounter.usedRules.includes(id));assert(!fired.nextEnemies[0].bossEncounter.pendingRules.includes(id))
 }
})
