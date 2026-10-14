import test from 'node:test'
import assert from 'node:assert/strict'
import {loadBattleEngine} from './lib/battle-engine-fixture.mjs'
import {ITEM_EVOLUTION_REQUIREMENTS,JOGRESS_RECIPES} from '../src/data/evolutionRules.js'
import {ITEM_EVOLUTION_REWARD_ITEMS} from '../src/data/evolutionItems.js'
import {normalizeCollection} from '../src/progression/digimonCollection.js'
import {normalizeItemInventory,canonicalItemId} from '../src/data/itemIdentity.js'
import {removeRetiredCombatantData} from '../src/progression/retiredCombatantData.js'
import {buildItemDex} from '../src/data/itemDex.js'
const e=await loadBattleEngine(),removed=['item-evolution-investment-알파몬[왕룡검]','item-evolution-investment-오그도몬']
const unit=(name,level)=>e.createCombatant({id:name,name,data:e.allDigimonLookup.get(name),level,digiclones:{hp:10,attack:10,defense:10,specialAttack:10,specialDefense:10,speed:10}})
const state=(party,inventory={})=>({currentStage:191,currentMap:'기어 포레스트',gameMode:'classic',player:party[0],party,inventory,enemies:[],activeAllyIds:[party[0].id],trainerSkills:{}})
test('Zeed and Ultimate Chaos stay master; Grand Killer and Dramon Breaker enter the rogue reward and dex pools',()=>{
 const catalog=buildItemDex([...e.fixedRewardItems,...e.randomRewardItemPool],e.getRewardItemRarity)
 for(const [target,rarity]of [['지드밀레니엄몬','master'],['얼티메이트카오스몬','master'],['그랑디스쿠가몬','rogue'],['빅토리그레이몬','rogue']]){
  const rule=ITEM_EVOLUTION_REQUIREMENTS[target],item=ITEM_EVOLUTION_REWARD_ITEMS.find(i=>i.evolutionItemFor===target)
  assert(rule&&item,target);assert.equal(rule.rarity,rarity,target);assert.equal(item.requiredCount,1)
  assert.equal(e.randomRewardItemPool.find(i=>i.id===item.id)?.rarity,rarity,target)
  assert.equal(catalog.find(i=>i.id===item.id)?.rarity,rarity,target)
 }
})
test('the two removed exclusive catalysts cannot drop or appear in the encyclopedia',()=>{
 const catalog=buildItemDex([...e.fixedRewardItems,...e.randomRewardItemPool],e.getRewardItemRarity)
 for(const id of removed){
  assert.equal(canonicalItemId(id),null,id)
  assert(!ITEM_EVOLUTION_REWARD_ITEMS.some(i=>i.id===id))
  assert(!e.randomRewardItemPool.some(i=>i.id===id))
  assert(!catalog.some(i=>i.id===id))
 }
 assert(!ITEM_EVOLUTION_REQUIREMENTS['알파몬[왕룡검]']);assert(!ITEM_EVOLUTION_REQUIREMENTS['오그도몬'])
})
test('legacy catalyst inventory, discoveries and nested reward checkpoints are retired without touching other items',()=>{
 const inventory={...Object.fromEntries(removed.map(id=>[id,3])),'jogress-chip':2,'item-evolution-investment-지드밀레니엄몬':1}
 assert.deepEqual(normalizeItemInventory(inventory),{'jogress-chip':2,'item-evolution-investment-지드밀레니엄몬':1})
 const collection=normalizeCollection({items:Object.fromEntries(Object.keys(inventory).map(id=>[id,true]))})
 assert.deepEqual(collection.items,{'jogress-chip':true,'item-evolution-investment-지드밀레니엄몬':true})
 const old={inventory,rewardCheckpoint:{itemIds:[...removed,'jogress-chip']},resumeUi:{pendingTarget:{itemId:removed[0]}},randomItems:[{id:removed[1],name:'old'},{id:'jogress-chip'}]}
 const next=removeRetiredCombatantData(old)
 assert.deepEqual(next.inventory,normalizeItemInventory(inventory));assert.deepEqual(next.rewardCheckpoint.itemIds,['jogress-chip'])
 assert.equal(next.resumeUi.pendingTarget,null);assert.deepEqual(next.randomItems,[{id:'jogress-chip'}])
 const loaded=e.parseSavedGameState(JSON.stringify({version:1,gameState:{...state([unit('아구몬',120)],inventory),rewardCheckpoint:old.rewardCheckpoint}}))
 assert(loaded);assert.deepEqual(loaded.inventory,normalizeItemInventory(inventory));assert.deepEqual(loaded.rewardCheckpoint.itemIds,['jogress-chip'])
})
test('Alphamon Ouryuken still requires two trained partners, using the existing chip instead of the removed catalyst',()=>{
 const recipe=JOGRESS_RECIPES.find(r=>r.targetName==='알파몬[왕룡검]'),party=recipe.materials.map(n=>unit(n,recipe.level)),s=state(party,{'jogress-chip':1})
 const option=e.getEvolutionOptions(party[0],s.inventory,party).find(o=>o.targetData.이름===recipe.targetName)
 assert(option.conditionsMet);assert.equal(option.itemRequirement,null)
 const result=e.resolveJogressEvolution(s,party,recipe,true);assert(result);assert.equal(result.evolvedMember.name,recipe.targetName);assert.equal(result.nextGameState.party.length,1)
 assert.equal(e.resolveJogressEvolution(s,[party[0]],recipe,true),null)
 const low=[party[0],e.refreshCombatantStats(party[1],{level:recipe.level-1})]
 assert.equal(e.resolveJogressEvolution(state(low),low,recipe,true),null)
 const untrained=[party[0],e.createCombatant({id:party[1].id,name:party[1].name,data:party[1].speciesData,level:recipe.level})]
 assert.equal(e.resolveJogressEvolution(state(untrained),untrained,recipe,true),null)
})
test('Ogudomon retains its original parent, level and permanent training gates without an item',()=>{
 for(const name of ['리리스몬','마왕몬','발바몬']){
  const member=unit(name,120),s=state([member])
  const option=e.getEvolutionOptions(member,{},[member]).find(o=>o.targetData.이름==='오그도몬')
  assert(option,name);assert.equal(option.itemRequirement,null);assert(option.canEvolve)
  const result=e.resolveManualEvolution(s,name,'오그도몬');assert(result);assert.equal(result.evolvedMember.name,'오그도몬');assert.deepEqual(result.nextGameState.inventory,{})
  const low=unit(name,119);assert.equal(e.resolveManualEvolution(state([low]),name,'오그도몬'),null)
  const untrained=e.createCombatant({id:name,name,data:e.allDigimonLookup.get(name),level:120})
  assert.equal(e.resolveManualEvolution(state([untrained]),name,'오그도몬'),null)
 }
})
