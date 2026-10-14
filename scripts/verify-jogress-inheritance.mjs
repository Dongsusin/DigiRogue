import assert from 'node:assert/strict'
import test from 'node:test'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
import { ITEM_EVOLUTION_REQUIREMENTS, JOGRESS_RECIPES } from '../src/data/evolutionRules.js'
import { writeSaveSlot, readSaveSlot } from '../src/progression/saveSlots.js'
const e = await loadBattleEngine()
const target = e.allDigimonLookup.get('오메가몬')
const unit = (name, level, extra = {}) => ({ ...e.createCombatant({ id: name, name, data: e.allDigimonLookup.get(name), level }), ...extra })
const parents = () => [unit('워그레이몬', 90), unit('메탈가루몬', 121)]
const fuse = (members = parents()) => e.createJogressCombatant(members[0], members.slice(1), target)
const supports = ['오라', '가드 필드', '스피드 필드', '멘탈 필드', '하이드로 워터 I', '아쿠아 프레셔 I', '헤비 스트라이크 III', '파워 에너지 III', '베놈 트랩', '루나틱 게이트 III', '윈드 클로 I', '소닉 샷 I']
const loadedParents = () => parents().map((member, index) => ({ ...member, skills: [...member.speciesData.기술, ...supports.slice(index * 6, index * 6 + 6)] }))

// Each test exercises the shipped module-level engine rather than a test copy.
test('Jogress uses the floored arithmetic mean instead of the highest parent level', () => {
  assert.equal(fuse().level, 105)
  const three = [...parents(), unit('아구몬', 100)]
  assert.equal(fuse(three).level, 103)
})
test('both parents equipment combines by key and excess copies are discarded at each existing cap', () => {
  const [a,b] = parents()
  Object.assign(a,{typePowerUps:{백신:4},attributePowerUps:{화염:8},digiclones:{attack:8},recoveryPrograms:{'recovery-program-m':2},battleItems:{'accuracy-target':2,'miracle-ruby':3,'steel-claw':1}})
  Object.assign(b,{typePowerUps:{백신:3,데이터:2},attributePowerUps:{화염:5,물:2},digiclones:{attack:6,speed:3},recoveryPrograms:{'recovery-program-m':1,'recovery-program-d':1},battleItems:{'accuracy-target':2,'miracle-ruby':3,'steel-claw':1,'crest-hope':1}})
  const before=structuredClone([a,b]), result=fuse([a,b])
  assert.equal(result.typePowerUps.백신,5); assert.equal(result.typePowerUps.데이터,2)
  assert.equal(result.attributePowerUps.화염,10); assert.equal(result.attributePowerUps.물,2)
  assert.equal(result.digiclones.attack,10); assert.equal(result.digiclones.speed,3)
  assert.equal(result.recoveryPrograms['recovery-program-m'],2); assert.equal(result.recoveryPrograms['recovery-program-d'],1)
  assert.equal(result.battleItems['accuracy-target'],3); assert.equal(result.battleItems['miracle-ruby'],4)
  assert.equal(result.battleItems['steel-claw'],1); assert.equal(result.battleItems['crest-hope'],1)
  assert.deepEqual([a,b],before)
  assert(result.attack>fuse().attack)
})
test('inherited attachment skills combine once while parent signature moves do not carry over', () => {
  const [a,b]=parents(); a.skills=[...a.speciesData.기술,'오라','가드 필드']; b.skills=[...b.speciesData.기술,'오라','스피드 필드']
  const result=fuse([a,b])
  for(const name of ['오라','가드 필드','스피드 필드'])assert(result.skills.includes(name),name)
  assert.equal(result.skills.filter(name=>name==='오라').length,1)
  for(const name of target.기술)assert(result.skills.includes(name))
  for(const name of [...a.speciesData.기술,...b.speciesData.기술])if(!target.기술.includes(name))assert(!result.skills.includes(name),name)
  assert(result.skills.length<=8)
})
test('overflow skills stay pending for a player choice instead of silently disappearing', () => {
  const result=fuse(loadedParents())
  assert.equal(result.skills.length,8)
  assert(result.pendingJogressSkills?.length>0)
  for(const name of supports)assert(result.skills.includes(name)||result.pendingJogressSkills.includes(name),name)
  const duplicate = new Set([...result.skills,...result.pendingJogressSkills]);assert.equal(duplicate.size,result.skills.length+result.pendingJogressSkills.length)
})
test('stat refresh, leveling and save/reload preserve inherited skills and unresolved choices', () => {
  const result=fuse(loadedParents()), refreshed=e.refreshCombatantStats(result), raised=e.levelUpCombatant(result,result.level+1)
  assert(result.inheritedSkills.length > 0); assert(result.pendingJogressSkills.length > 0)
  assert.deepEqual(refreshed.skills,result.skills);assert.deepEqual(raised.skills,result.skills)
  const state={currentStage:191,currentMap:'기어 포레스트',gameMode:'classic',player:result,party:[result],enemies:[],activeAllyIds:[result.id],inventory:{},trainerSkills:{}}
  const records=new Map(),storage={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)}
  for(const slot of ['auto','manual-1','manual-2','manual-3']){
    assert(writeSaveSlot(storage,slot,state))
    const read=readSaveSlot(storage,slot,e.parseSavedGameState)
    assert.equal(read.status,'ready');assert.deepEqual(read.state.player.skills,result.skills)
    assert.deepEqual(read.state.player.pendingJogressSkills,result.pendingJogressSkills)
  }
})
test('overflow replacement and rejection each consume one choice and keep the eight-skill limit', () => {
  const result=fuse(loadedParents()), newSkill=result.pendingJogressSkills?.[0]
  assert(newSkill)
  const replaced=e.resolveJogressSkillChoice?.(result,newSkill,result.skills.at(-1))
  assert(replaced);assert(replaced.skills.includes(newSkill));assert.equal(replaced.skills.length,8)
  assert(!replaced.pendingJogressSkills.includes(newSkill));assert.deepEqual(e.refreshCombatantStats(replaced).skills,replaced.skills)
  const skipped=e.resolveJogressSkillChoice(result,newSkill)
  assert.deepEqual(skipped.skills,result.skills);assert(!skipped.pendingJogressSkills.includes(newSkill))
  assert.equal(e.resolveJogressSkillChoice(skipped,newSkill,result.skills[0]),null)
})
test('fusion commits one member and retains only unrelated party members without changing bag items', () => {
  const members=loadedParents(),other=unit('아구몬',90),recipe=JOGRESS_RECIPES.find(x=>x.targetName==='오메가몬')
  const state={currentStage:191,currentMap:'기어 포레스트',gameMode:'classic',player:members[1],party:[...members,other],activeAllyIds:members.map(x=>x.id),inventory:{'heal-20':3},trainerSkills:{}}
  const before=structuredClone(state),result=e.resolveJogressEvolution(state,members,recipe,true)
  assert(result);assert.equal(result.evolvedMember.level,105)
  assert.equal(result.nextGameState.party.length,2);assert.equal(result.nextGameState.player.id,members[0].id)
  assert(!result.nextGameState.party.some(x=>x.id===members[1].id));assert.deepEqual(result.nextGameState.inventory,state.inventory)
  assert.deepEqual(state,before)
})

test('later evolution and return preserve selected inherited skills and offer any new overflow', () => {
  let fused=fuse(loadedParents())
  for(const innate of target.기술) fused=e.resolveJogressSkillChoice(fused,fused.pendingJogressSkills[0],innate)
  for(const name of [...fused.pendingJogressSkills]) fused=e.resolveJogressSkillChoice(fused,name)
  const selected=[...fused.skills]
  assert.equal(selected.length,8);assert(selected.every(name=>fused.inheritedSkills.includes(name)))
  for(const transformed of [e.createEvolvedCombatant(fused,e.allDigimonLookup.get('오메가몬[X항체]')),e.createReturnedEvolutionCombatant(fused)]){
    assert(selected.every(name=>transformed.skills.includes(name)), 'selected inheritance must not be silently truncated')
    assert.equal(transformed.skills.length,8);assert.deepEqual(e.refreshCombatantStats(transformed).skills,transformed.skills)
    assert(transformed.pendingJogressSkills.length>0,'new signatures can be offered instead of deleting a selected move')
  }
})
test('later evolution and return keep all unresolved Jogress choices', () => {
  const fused=fuse(loadedParents())
  for(const transformed of [e.createEvolvedCombatant(fused,e.allDigimonLookup.get('오메가몬[X항체]')),e.createReturnedEvolutionCombatant(fused)]){
    for(const name of fused.pendingJogressSkills) assert(transformed.skills.includes(name)||transformed.pendingJogressSkills?.includes(name), name)
    assert(e.getPendingJogressSkillEvents([transformed]).length>0)
  }
})

import { ITEM_EVOLUTION_REWARD_ITEMS } from '../src/data/evolutionItems.js'
import { rememberItemEvolution } from '../src/progression/evolutionMemory.js'

const catalystTargets = ['그레이스노바몬', '얼티메이트카오스몬', '볼토바우타몬']
const catalystFixture = name => {
 const recipe=JOGRESS_RECIPES.find(r=>r.targetName===name),item=ITEM_EVOLUTION_REWARD_ITEMS.find(i=>i.evolutionItemFor===name)
 assert(recipe&&item&&ITEM_EVOLUTION_REQUIREMENTS[name])
 const party=recipe.materials.map(n=>unit(n,140,{digiclones:{hp:10,attack:10,defense:10,specialAttack:10,specialDefense:10,speed:10}}))
 const state={currentStage:191,currentMap:'기어 포레스트',gameMode:'classic',player:party[0],party,enemies:[],activeAllyIds:[party[0].id],inventory:{'jogress-chip':2,[item.id]:1},trainerSkills:{}}
 return{recipe,item,party,state,chip:e.randomRewardItemPool.find(i=>i.id==='jogress-chip')}
}
for(const name of catalystTargets){
 test(name+': dedicated catalyst Jogress never activates a chip, including stale saved recipe lists',()=>{
  const{recipe,party,state,chip}=catalystFixture(name);assert(chip)
  for(const offered of [chip,{...chip,jogressRecipes:structuredClone(JOGRESS_RECIPES)}]){
   assert.equal(e.canRandomRewardItemAppear(offered,state.inventory,party),false,'chip reward offered for a catalyst-only party')
   assert(!e.getAvailableJogressRecipesForParty(party,offered.jogressRecipes).some(r=>r.targetName===name))
   for(const member of party)assert.equal(e.isJogressMemberSelectable(member,party,[],offered.jogressRecipes),false)
  }
  assert(!chip.jogressRecipes.some(r=>r.targetName===recipe.targetName))
 })
 test(name+': dedicated catalyst cannot be spent through the chip route or forged pending selection',()=>{
  const{recipe,party,state}=catalystFixture(name);const before=structuredClone(state)
  assert.equal(e.getEvolutionOptions(party[0],state.inventory,party).find(o=>o.targetData.이름===name).canEvolve,true)
  for(const members of [party,[...party].reverse()])assert(e.resolveJogressEvolution(state,members,recipe,true)===null,'chip must reject dedicated catalyst route')
  assert.deepEqual(state,before,'rejecting chip fusion must not consume partners, items or progress')
 })
 test(name+': dedicated catalyst still evolves manually and consumes exactly one catalyst, not the chip',()=>{
  const{item,party,state}=catalystFixture(name);const before=structuredClone(state)
  const missing={...state,inventory:{'jogress-chip':2}};assert.equal(e.resolveManualEvolution(missing,party[0].id,name),null)
  const result=e.resolveManualEvolution(state,party[0].id,name);assert(result);assert.equal(result.evolvedMember.name,name)
  assert.equal(result.nextGameState.inventory[item.id]??0,0);assert.equal(result.nextGameState.inventory['jogress-chip'],2)
  assert.equal(result.nextGameState.party.length,1);assert.deepEqual(state,before)
 })
 test(name+': remembered dedicated Jogress remains manual and cannot be invoked through a chip',()=>{
  const{recipe,party,state}=catalystFixture(name);const trained=party.map(u=>({...u,trainerSkills:{'stats-evolution-memory':1}}))
  const remembered={...state,player:trained[0],party:trained,inventory:{'jogress-chip':2},evolutionMemory:rememberItemEvolution([],recipe.materials,name)}
  assert(e.resolveManualEvolution(remembered,trained[0].id,name));assert(e.resolveJogressEvolution(remembered,trained,recipe,true)===null,'memory does not turn dedicated catalyst fusion into chip fusion')
 })
}
test('ordinary Jogress still activates and evolves through the chip',()=>{
 const recipe=JOGRESS_RECIPES.find(r=>r.targetName==='오메가몬'),party=parents(),chip=e.randomRewardItemPool.find(i=>i.id==='jogress-chip')
 assert(chip.jogressRecipes.some(r=>r.targetName==='오메가몬'));assert(e.canRandomRewardItemAppear(chip,{},party))
 const state={currentStage:191,currentMap:'기어 포레스트',gameMode:'classic',player:party[0],party,enemies:[],activeAllyIds:[party[0].id],inventory:{},trainerSkills:{}}
 const result=e.resolveJogressEvolution(state,party,recipe,true);assert(result);assert.equal(result.evolvedMember.name,'오메가몬')
})
