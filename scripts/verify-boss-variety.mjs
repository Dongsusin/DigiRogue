import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { BOSS_PROFILES, BOSS_PROFILE_BY_ID, BOSS_MAP_THEMES } from '../src/data/bossProfiles.js'
import { RIVAL_PROFILES, RIVAL_PROFILE_BY_ID } from '../src/data/rivalProfiles.js'
import { REGIONAL_BOSS_ROUTES, REGIONAL_BOSS_PROFILES, MAP_BOSS_ROUTES } from '../src/data/regionalBossProfiles.js'
import { DIGIMON_MODELS, missingRequiredClips, hasAuthoredAttackMotion } from '../src/data/digimonModels.js'
import { getBossCandidates, getBossProfile, createBossPlan, resolveBossReactions } from '../src/battle/bossEncounters.js'
import { getRivalCandidates, createRivalEncounter, isRivalStage, recordRivalMeeting, recordRivalVictory } from '../src/battle/rivalEncounters.js'
import { resolveSegmentedBossDamage } from '../src/battle/bossPhases.js'
import { pickVariedEncounter } from '../src/battle/encounterVariety.js'
import { getEncounterProfileStage } from '../src/progression/gameModes.js'
const engine = await loadBattleEngine(), lookup = engine.allDigimonLookup
const maps = Object.keys(engine.mapData), coverage = [], rivalNames = new Map()
const factory = spec => engine.createCombatant({ ...spec, id: spec.id ?? spec.name, level: spec.level ?? 50 })
const rivalName = (profile, stage, mapName) => {
  const key = stage + ':' + profile.id
  if (!rivalNames.has(key)) rivalNames.set(key, createRivalEncounter({ stage, mapName, speciesLookup: lookup,
    id: profile.id, level: 50, createCombatant: factory })[0].name)
  return rivalNames.get(key)
}
const namesFor = (pool, stage, mapName, rival = false) => new Set(pool.map(p => rival
  ? rivalName(p, stage, mapName) : createBossPlan(p, stage).initialName))
test('all 29 new routes have complete natural models and unique stable IDs', () => {
  assert.equal(REGIONAL_BOSS_ROUTES.length, 29)
  assert.equal(REGIONAL_BOSS_PROFILES.length, 58)
  assert.equal(new Set(BOSS_PROFILES.map(p => p.id)).size, BOSS_PROFILES.length)
  assert.equal(new Set(RIVAL_PROFILES.map(p => p.id)).size, RIVAL_PROFILES.length)
  assert.deepEqual(Object.keys(MAP_BOSS_ROUTES).sort(), [...maps].sort())
  for (const route of REGIONAL_BOSS_ROUTES) {
    assert.equal(route.line.length, 4)
    for (const name of route.line) {
      assert(lookup.has(name), name)
      assert.deepEqual(missingRequiredClips(DIGIMON_MODELS[name]?.clips), [], name)
      assert.equal(hasAuthoredAttackMotion(DIGIMON_MODELS[name]), false, name)
    }
    assert(route.rule.condition && route.rule.effect, route.id)
  }
})
test('every map and encounter slot has at least three starting species in classic, daily and endless cycles', () => {
  for (const mode of ['classic','daily','endless']) for (let realStage = 1; realStage <= (mode === 'endless' ? 600 : 200); realStage++) {
    const stage = getEncounterProfileStage(realStage, mode), boss = realStage % 10 === 0
    if (!boss && !isRivalStage(stage)) continue
    for (const mapName of maps) {
      const pool = boss ? getBossCandidates(stage,mapName,lookup) : getRivalCandidates(stage,mapName,lookup)
      const names = [...namesFor(pool,stage,mapName,!boss)]
      assert(names.length >= 3, mode + ':' + mapName + ':' + realStage + ':' + names.join(','))
      assert(pool.every(p => p.kind === 'final' || MAP_BOSS_ROUTES[mapName].includes(p.regionRoute ?? p.id) ||
        p.themes.includes(BOSS_MAP_THEMES[mapName])), mapName + ':' + realStage)
      if (boss && stage < 200) assert(pool.every(p => MAP_BOSS_ROUTES[mapName].includes(p.regionRoute ?? p.id)), mapName + ': curated boss routes')
      coverage.push({mode,stage:realStage,profileStage:stage,mapName,type:boss?'boss':'rival',profiles:pool.length,species:names.length,names})
      const history = pool.map(p => p.id)
      const resumed = boss ? getBossCandidates(stage,mapName,lookup,{history}) : getRivalCandidates(stage,mapName,lookup,{history})
      assert(namesFor(resumed,stage,mapName,!boss).size >= 3)
    }
  }
  const report = {passed:true,modes:3,maps:maps.length,combinations:coverage.length,
    minimumSpecies:Math.min(...coverage.map(r=>r.species)),bossProfiles:BOSS_PROFILES.length,rivalProfiles:RIVAL_PROFILES.length,rows:coverage}
  fs.writeFileSync(new URL('../docs/validation/boss-variety-2026-10-09/coverage.json',import.meta.url),JSON.stringify(report,null,2))
})
test('real App builds every scheduled local encounter in all modes without falling back to ordinary wildlife', () => {
  for (const mode of ['classic','daily','endless']) for (let stage=1;stage<=(mode==='endless'?400:200);stage++) {
    if (stage%10!==0 && !isRivalStage(getEncounterProfileStage(stage,mode))) continue
    for (const mapName of maps) {
      const enemies=engine.buildEnemyParty(stage,[],1,engine.getBossEncounterNamesForStage(mapName,stage),{mapName,gameMode:mode})
      assert(enemies.length>=1 && enemies.length<=2,mode+':'+mapName+':'+stage)
      assert(enemies[0].bossEncounter,mode+':'+mapName+':'+stage)
      assert(enemies.every(u=>u.currentHp>0 && Number.isFinite(u.attack) && Number.isFinite(u.maxHp)))
      assert(enemies.every(u=>lookup.has(u.name) && DIGIMON_MODELS[u.name]))
      assert.equal(Boolean(enemies[0].rivalEncounter),stage%10!==0)
    }
  }
})
test('exhausted three-species pools rotate, and duplicate profiles do not multiply species odds', () => {
  const candidates=['a','b','c'].map(id=>({id,name:id})),byId=new Map(candidates.map(p=>[p.id,p]))
  let history=[]
  for(let i=0;i<30;i++) {
    const p=pickVariedEncounter(candidates,p=>p.name,byId,history,()=>0)
    assert(!history.slice(-2).includes(p.id));history=[...history,p.id].slice(-8)
  }
  const duplicated=[...Array.from({length:5},(_,i)=>({id:'a'+i,name:'a'})),...candidates.slice(1)],counts={a:0,b:0,c:0}
  for(let i=0;i<300;i++) counts[pickVariedEncounter(duplicated,p=>p.name,byId,[],()=>i/300).name]++
  assert.deepEqual(counts,{a:100,b:100,c:100})
  assert.equal(pickVariedEncounter([],p=>p.name,byId),null)
})
test('live regional and final boss picks avoid the previous two species', () => {
  for(const mapName of maps) for(const stage of [10,20,60,100,150,190,200]) {
    let history=[],names=[]
    for(let i=0;i<18;i++) {
      const p=getBossProfile(stage,mapName,lookup,{history,random:()=>0}),name=createBossPlan(p,stage).initialName
      assert(!names.slice(-2).includes(name),mapName+':'+stage+':'+name)
      history=[...history,p.id].slice(-8);names.push(name)
    }
  }
})
test('rival memories retain wins and adaptation without pinning every map to the same lineage', () => {
  let state={currentStage:8,currentMap:'다크 웹',party:[],activeAllyIds:[],rivalState:{}},seen=[]
  for(let i=0;i<10;i++) {
    state.currentStage=8+i*20
    const enemies=createRivalEncounter({stage:state.currentStage,mapName:state.currentMap,rivalState:state.rivalState,
      speciesLookup:lookup,createCombatant:factory,level:50,random:()=>0})
    assert(!seen.slice(-2).includes(enemies[0].name));seen.push(enemies[0].name)
    state=recordRivalMeeting({...state,enemies})
    state=recordRivalVictory({...state,enemies:enemies.map(u=>({...u,currentHp:0}))})
  }
  assert(new Set(seen).size>=3)
  assert(Object.values(state.rivalState.encounters).some(m=>m.wins>0 && m.adaptation))
  const saved=createRivalEncounter({stage:28,mapName:'다크 웹',id:'arata',rivalState:state.rivalState,
    speciesLookup:lookup,createCombatant:factory,level:50})
  assert.equal(saved[0].rivalEncounter.profileId,'arata')
})
test('existing fusion, armor, burst and final profiles remain selectable with their formations', () => {
  for(const [id,stage,mapName] of [['fusion-파일드라몬',35,'시작의마을'],['armor-thunder',15,'미하라시 산'],
    ['fusion-오메가몬',135,'가디언 팰리스'],['burst-rose',135,'기어 포레스트']]) {
    assert(getRivalCandidates(stage,mapName,lookup).some(p=>p.id===id),id)
    const enemies=createRivalEncounter({stage,mapName,id,speciesLookup:lookup,createCombatant:factory,level:100})
    assert.equal(enemies.length,RIVAL_PROFILE_BY_ID.get(id).formation?2:1,id)
    assert(enemies[0].bossEncounter.phases.some(p=>p.form),id)
  }
  for(const p of BOSS_PROFILES.filter(p=>p.kind==='final')) {
    assert(getBossCandidates(200,'용의눈호수',lookup).includes(p))
    assert.equal(getBossProfile(200,'용의눈호수',lookup,{id:p.id}),p)
  }
})
test('every original boss profile remains reachable on a curated fitting map', () => {
  for (const profile of BOSS_PROFILES.filter(p => !p.regionRoute)) {
    let reachable = false
    for (let stage = Math.ceil(profile.minStage / 10) * 10; stage <= profile.maxStage && !reachable; stage += 10) {
      reachable = maps.some(map => getBossCandidates(stage,map,lookup).some(p => p.id === profile.id))
    }
    assert(reachable, profile.id)
  }
})
test('new boss phases retain HP gates, evolution exemptions and action-consuming powers', () => {
  const evolved=new Set(),powered=new Set(),evolveBoss=(u,data)=>({...u,name:data.이름,imageName:data.이름,speciesData:data}),refresh=u=>({...u})
  for(const p of REGIONAL_BOSS_PROFILES) for(const stage of [20,60,100,190]) {
    if(stage<p.minStage) continue
    const plan=createBossPlan(p,stage),unit={...factory({name:plan.initialName,data:lookup.get(plan.initialName)}),
      id:'boss',isBoss:true,maxHp:100,currentHp:100,bossEncounter:plan,bossHpSegmentCount:plan.segmentCount,
      bossHpBreakpoints:plan.phases.map(p=>p.atHp),statModifiers:{},battleGuards:{}}
    const damage=resolveSegmentedBossDamage(unit,0)
    assert(damage.nextHp>=100-100/plan.segmentCount)
    const response=resolveBossReactions({enemies:[{...damage.nextCombatant,currentHp:damage.nextHp}],
      actorId:'ally',actorSide:'ally',didAct:true,deferPatterns:true},
      {speciesLookup:lookup,evolveBoss,refreshCombatantStats:refresh,getSkillData:engine.getSkillData})
    if(plan.phases[0].form) {
      const change=response.changes.find(c=>c.kind==='evolve')
      assert(change && change.consumesAction===false,p.id+':'+stage)
      assert.equal(change.nextName,plan.phases[0].form);evolved.add(p.id)
    } else {
      assert(response.nextEnemies[0].bossEncounter.pendingPhase,p.id)
      const ownTurn=resolveBossReactions({enemies:response.nextEnemies,actorId:'boss',actorSide:'enemy',
        didAct:false,patternActorId:'boss',deferPatterns:true},
        {speciesLookup:lookup,evolveBoss,refreshCombatantStats:refresh,getSkillData:engine.getSkillData})
      assert(ownTurn.changes.some(c=>c.consumesAction),p.id);powered.add(p.id)
    }
  }
  assert(evolved.size>0 && powered.size===REGIONAL_BOSS_PROFILES.length)
})
