import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import vm from 'node:vm'
import { createBattlePresentation } from '../src/three/battleLogTimeline.js'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { createBossEncounter } from '../src/battle/bossEncounters.js'
import { FINAL_BOSS_PROFILES } from '../src/data/finalBossProfiles.js'
const e = await loadBattleEngine(), lookup = e.allDigimonLookup
const unit = (name, id=name, extra={}) => ({...e.createCombatant({id,name,data:lookup.get(name),level:100}),...extra})
const encounter = (id, phase=0) => {
 const enemies = createBossEncounter({stage:200,mapName:'시작의마을',id,speciesLookup:lookup,
 createBossCombatant:spec=>({...unit(spec.name,'boss'),isBoss:true,bossStage:200,enemyStage:200,enemyGameMode:'hard'}),
 createCombatant:spec=>unit(spec.name,spec.id)})
 const boss=enemies[0]; boss.bossEncounter={...boss.bossEncounter,phase}; boss.currentHp=Math.floor(boss.maxHp*[.75,.5,.25][phase]); return enemies
}
const party=()=>[unit('워그레이몬','a',{evolutionHistory:['아구몬','그레이몬','메탈그레이몬'],battleItems:{'haste':2}}),unit('메탈가루몬','b',{evolutionHistory:['파피몬','가루몬','워가루몬']}),unit('아구몬','reserve'),{id:'egg',isEgg:true,currentHp:1}]
const prepare=(enemies,p=party(),activeAllyIds=['a','b'])=>e.prepareBossTurn({enemies,actorId:enemies[0].id,party:p,activeAllyIds})
const turn=(enemies,p=party())=>e.resolveBattleTurnActions({party:p,enemies,activeAllyIds:['a','b'],inventory:{},actions:[e.createBattleTurnAction({side:'enemy',actor:enemies[0],skillName:'암흑의 균열',targetId:'a',order:0})]})
test('Apocalymon returns active allies exactly one actual form, preserving level, equipment and HP ratio',()=>{
 const p=party();p[0].currentHp=Math.floor(p[0].maxHp*.6)
 const r=prepare(encounter('apocalymon-final'),p)
 assert.equal(r.nextParty[0].name,'메탈그레이몬'); assert.equal(r.nextParty[1].name,'워가루몬')
 assert.equal(r.nextParty[0].level,100);assert.deepEqual(Object.fromEntries(Object.entries(r.nextParty[0].battleItems).filter(([,n])=>n>0)),p[0].battleItems)
 assert(Math.abs(r.nextParty[0].currentHp/r.nextParty[0].maxHp-.6)<.02)
 assert.deepEqual(r.nextParty.slice(2),p.slice(2));assert(r.changes.some(c=>c.kind==='devolve'&&c.targetSide==='ally'))
 assert.equal(r.skill,null);assert(r.consumesAction)
 const again=prepare(r.nextEnemies,r.nextParty);assert.equal(again.nextParty[0].name,'메탈그레이몬')
})
test('directly selected evolved allies also have a legal predecessor; babies cannot devolve',()=>{
 const p=[unit('워그레이몬','a'),unit('깜몬','b')];const r=prepare(encounter('apocalymon-final'),p)
 assert.notEqual(r.nextParty[0].name,p[0].name);assert(lookup.has(r.nextParty[0].name));assert.equal(r.nextParty[1].name,'깜몬')
})
test('devolution replaces the boss attack in both turn paths',()=>{
 for(const path of ['resolveBattleTurnActions','resolveEnemyPartyActions']) {
 const enemies=encounter('apocalymon-final'),p=party();const r=path==='resolveBattleTurnActions'?turn(enemies,p):e[path]({enemies,party:p,activeAllyIds:['a','b']})
 assert.equal(r.nextParty[0].name,'메탈그레이몬',path+':'+JSON.stringify(r.battleLogs));assert.equal(r.hitEffects.filter(h=>h.attackerId===enemies[0].id).length,0)
 }
})
test('Arkadimon phase signature defeats exactly one active ally, with no extra attack',()=>{
 const r=turn(encounter('arcadiamon-final',1));assert.equal(r.nextParty.filter(p=>p.currentHp===0).length,1)
 assert.equal(r.nextParty[1].currentHp,r.nextParty[1].maxHp);assert.equal(r.nextParty[2].currentHp,r.nextParty[2].maxHp)
 assert.equal(r.hitEffects.filter(h=>h.targetSide==='ally').length,1)
})
test('Arkadimon instant defeat respects safety guard and automatic recovery programs',()=>{
 for(const extra of [{battleGuards:{endure:1}},{recoveryPrograms:{'recovery-program-d':1}}]) {
 const p=party();p[0]={...p[0],...extra};const r=turn(encounter('arcadiamon-final',1),p)
 assert(r.nextParty[0].currentHp>0);assert(r.nextParty[0].currentHp<r.nextParty[0].maxHp||r.nextParty[0].recoveryPrograms['recovery-program-d']===0)
 }
})
test('player-owned/native Arkadimon skills do not gain instant defeat',()=>{
 const attacker=unit('알카디몬','player'),defender=unit('워그레이몬','target',{currentHp:100000,maxHp:100000})
 const r=e.resolveAttackAction({attacker,defender,skillName:'도트 매트릭스',attackerSide:'ally'})
 assert(r.nextDefender.currentHp>0)
})
test('Yggdrasil summons one complete Royal Knight, with ordinary minion scaling and no same-turn attack',()=>{
 const enemies=encounter('yggdrasil-final');const r=turn(enemies)
 assert.equal(r.nextEnemies.length,2);const knight=r.nextEnemies.find(u=>u.id!==enemies[0].id)
 assert(knight.bossEncounter.royalKnight);assert.equal(knight.bossEncounter.leader,false);assert.equal(knight.isBoss,false)
 assert.equal(knight.enemyGameMode,'hard');assert.equal(knight.level,enemies[0].level)
 assert.equal(r.hitEffects.length,0);assert.equal(prepare(r.nextEnemies,r.nextParty).nextEnemies.length,2)
 assert(e.createEnemyBattleTurnActions({enemies:r.nextEnemies,party:r.nextParty,activeAllyIds:['a','b']}).some(a=>a.actorId===knight.id))
})
test('Yggdrasil never creates a third enemy or duplicates a living summoned knight',()=>{
 const enemies=encounter('yggdrasil-final');enemies.push(unit('듀크몬','already'))
 const r=prepare(enemies);assert.equal(r.nextEnemies.length,2)
})
test('Bagramon steals only positive temporary modifiers from active allies, capped on the boss',()=>{
 const p=party();p[0].statModifiers={attack:{multiplier:2,duration:'region'},defense:{multiplier:.7,duration:'region'}}
 p[2].statModifiers={attack:{multiplier:2,duration:'region'}}
 const r=prepare(encounter('bagramon-final',1),p);assert.equal(r.nextParty[0].statModifiers.attack,null)
 assert.equal(r.nextParty[0].statModifiers.defense.multiplier,.7);assert.equal(r.nextParty[2].statModifiers.attack.multiplier,2)
 assert.equal(r.nextEnemies[0].statModifiers.attack.multiplier,1.25)
})
test('DeathXmon clears active positive modifiers and guards without deleting equipment or negative modifiers',()=>{
 const p=party();p[0].statModifiers={attack:{multiplier:1.5,duration:'region'},defense:{multiplier:.7,duration:'region'}};p[0].battleGuards={physical:2,endure:1,taunt:2}
 const r=prepare(encounter('dexmon-final',1),p);assert.equal(r.nextParty[0].statModifiers.attack,null)
 assert.equal(r.nextParty[0].statModifiers.defense.multiplier,.7);assert.equal(r.nextParty[0].battleGuards.physical,0)
 assert.equal(r.nextParty[0].battleGuards.taunt,2);assert.deepEqual(r.nextParty[0].battleItems,p[0].battleItems)
})
test('Armageddemon absorbs its living Kuramon once and cannot regenerate an absorbed child',()=>{
 const enemies=encounter('armageddemon-final',1),r=prepare(enemies)
 assert.equal(r.nextEnemies.length,1);assert(r.nextEnemies[0].currentHp>enemies[0].currentHp)
 assert.equal(r.nextEnemies[0].bossEncounter.broodUsed,true)
})
test('Lucemon Gehenna guards both attack classes while Zwart exhausts after rampage',()=>{
 const luce=prepare(encounter('lucemon-final',1));assert(luce.nextEnemies[0].battleGuards.physical>0&&luce.nextEnemies[0].battleGuards.special>0);assert.equal(luce.skill,null)
 const zwart=prepare(encounter('zwart-d-final',1));assert(zwart.nextEnemies[0].statModifiers.attack.multiplier<1);assert.equal(zwart.skill,null)
})
test('each final boss has three explicit HP phases and a distinct special phase',()=>{
 assert.equal(FINAL_BOSS_PROFILES.length,8)
 for(const p of FINAL_BOSS_PROFILES) {assert.equal(p.phases.length,3,p.id);assert(p.phases.some(x=>x.pattern||x.signatureSkill||x.effect?.guards),p.id)}
})

const saveState=(p,enemies)=>({currentStage:200,currentMap:'시작의마을',gameMode:'classic',party:p.filter(u=>!u.isEgg),player:p[0],enemies,
 activeAllyIds:['a','b'],encounterCount:2,inventory:{},trainerSkills:{},phase:'battle'})
const resume=s=>e.parseSavedGameState(JSON.stringify({version:1,kind:'manual',gameState:s}))
test('devolved forms and summoned knights survive save/load without firing twice',()=>{
 for(const id of ['apocalymon-final','yggdrasil-final']) {
 const r=prepare(encounter(id));const saved=resume(saveState(r.nextParty,r.nextEnemies));assert(saved,id)
 assert.equal(saved.party[0].name,r.nextParty[0].name);assert.equal(saved.enemies.length,r.nextEnemies.length)
 const next=prepare(saved.enemies,saved.party,saved.activeAllyIds)
 assert.equal(next.nextParty[0].name,saved.party[0].name);assert.equal(next.nextEnemies.length,saved.enemies.length)
 }
})
test('old final plans gain remaining mechanics without rewinding phase/action/spent state',()=>{
 const enemies=encounter('yggdrasil-final',1);delete enemies[0].bossEncounter.specialPatternVersion
 enemies[0].bossEncounter.actions=9;enemies[0].bossEncounter.usedRules=['physical-adapt']
 enemies[0].bossEncounter.phases=enemies[0].bossEncounter.phases.map(p=>{const {pattern,...old}=p;return old})
 const s=resume(saveState(party(),enemies));assert(s);assert.equal(s.enemies[0].bossEncounter.phase,1)
 assert.equal(s.enemies[0].bossEncounter.actions,9);assert.deepEqual(s.enemies[0].bossEncounter.usedRules,['physical-adapt'])
 assert(s.enemies[0].bossEncounter.phases[0].pattern);assert.equal(prepare(s.enemies,s.party).nextEnemies.length,1)
})
test('instant KO retains fainted active slot for manual reserve choice, including resume',()=>{
 const r=turn(encounter('arcadiamon-final',1));const state=saveState(r.nextParty,r.nextEnemies)
 assert(e.getFaintReplacement(state));const saved=resume(state);assert(saved);assert(saved.awaitingReplacement)
 assert.deepEqual(saved.activeAllyIds,['a','b']);assert(e.getFaintReplacement(saved).candidates.some(u=>u.id==='reserve'))
})
test('phase timeline updates allies and inserts summoned enemies at its cue',()=>{
 const r=prepare(encounter('apocalymon-final'));const t=createBattlePresentation({presentation:[{effects:[],bossChanges:r.changes}]})
 assert(t.states.some(s=>s.units.some(u=>u.targetId==='a'&&u.targetSide==='ally'&&u.targetCombatant.name==='메탈그레이몬')))
 const summon=prepare(encounter('yggdrasil-final'));const st=createBattlePresentation({presentation:[{effects:[],bossChanges:summon.changes}]})
 assert(st.states.some(s=>s.units.some(u=>u.insertCombatant&&u.targetSide==='enemy')))
})
test('actual UI state updater inserts a knight idempotently and changes ally/player together',()=>{
 const source=fs.readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8')
 const start=source.indexOf('  const applyVisualAttackDamage ='),end=source.indexOf('  const playBattleAttackEffects =',start)
 let state=saveState(party(),encounter('yggdrasil-final'))
 const context={screenMode:'adventure',setGameState:f=>state=f(state),normalizeStatusEffect:v=>v};vm.createContext(context)
 vm.runInContext(source.slice(start,end).replace('  const applyVisualAttackDamage =','var apply ='),context)
 const r=prepare(state.enemies,state.party);const knight=r.nextEnemies[1]
 const cue={targetId:knight.id,targetSide:'enemy',targetCombatant:knight,insertCombatant:true}
 context.apply(cue);context.apply(cue);assert.equal(state.enemies.length,2)
 const de=prepare(encounter('apocalymon-final'),state.party).nextParty[0]
 context.apply({targetId:'a',targetSide:'ally',targetCombatant:de});assert.equal(state.player.name,'메탈그레이몬');assert.equal(state.party[0].name,state.player.name)
})

test('slower devolved allies cannot execute a lost signature selected before the phase',()=>{
 const enemies=encounter('apocalymon-final'),p=party();const boss=enemies[0]
 const lost=e.getCommandSkillNames(p[0],n=>e.getSkillData(n,p[0])).find(n=>!e.getCommandSkillNames(e.createReturnedEvolutionCombatant(p[0]),n=>e.getSkillData(n,e.createReturnedEvolutionCombatant(p[0]))).includes(n));assert(lost)
 const actions=[{...e.createBattleTurnAction({side:'enemy',actor:boss,skillName:'암흑의 균열',targetId:'a'}),priority:2},
 {...e.createBattleTurnAction({side:'ally',actor:p[0],skillName:lost,targetId:boss.id}),priority:0}]
 const r=e.resolveBattleTurnActions({party:p,enemies,activeAllyIds:['a','b'],actions,inventory:{}})
 assert.equal(r.hitEffects.filter(h=>h.attackerId==='a').length,0);assert(r.battleLogs.some(l=>l.includes('현재 모습')))
})
test('Arkadimon HP erasure fires once despite immobilization, and still consumes its action',()=>{
 for(const type of ['수면','빙결','마비']) {
 const enemies=encounter('arcadiamon-final',1);enemies[0].statusEffect={type,turns:3}
 const r=turn(enemies);assert.equal(r.hitEffects.filter(h=>h.targetSide==='ally').length,1,type)
 assert.equal(r.nextEnemies[0].bossEncounter.phase,2);assert.equal(r.nextParty.filter(p=>p.currentHp===0).length,1)
 }
})
test('solo summon/save/resume retains one active ally against two enemies',()=>{
 const enemies=encounter('yggdrasil-final'),p=party(),r=prepare(enemies,p,['a'])
 const state={...saveState(r.nextParty,r.nextEnemies),encounterCount:1,activeAllyIds:['a']},saved=resume(state)
 assert(saved);assert.equal(saved.enemies.length,2);assert.deepEqual(saved.activeAllyIds,['a']);assert.equal(e.getBattleAllyLimit(saved),1)
})

test('phase erasure cannot be spent by a flinch or existing skill cooldown',()=>{
 const oldRandom=Math.random;Math.random=()=>0
 try {
 const enemies=encounter('arcadiamon-final',1),p=party();enemies[0].skillCooldowns={'도트 매트릭스':9}
 p[1]={...p[1],battleItems:{'death-bone':99}}
 const actions=[{...e.createBattleTurnAction({side:'ally',actor:p[1],skillName:'기본 타격',targetId:enemies[0].id}),priority:2},
 {...e.createBattleTurnAction({side:'enemy',actor:enemies[0],skillName:'소울 앱소브션',targetId:'a'}),priority:0}]
 const r=e.resolveBattleTurnActions({party:p,enemies,activeAllyIds:['a','b'],actions,inventory:{}})
 assert.equal(r.hitEffects.filter(h=>h.attackerId===enemies[0].id&&h.targetSide==='ally').length,1)
 assert.equal(r.nextEnemies[0].bossEncounter.phase,2)
 } finally {Math.random=oldRandom}
})
