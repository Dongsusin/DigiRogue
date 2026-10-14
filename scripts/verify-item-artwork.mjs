import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash}from'node:crypto';
import {loadBattleEngine}from'./lib/battle-engine-fixture.mjs';import{buildItemDex}from'../src/data/itemDex.js';import spirit from '../src/data/spiritEvolution.json' with {type:'json'};
import {ADVENTURE_BATTLE_ITEMS,getAdventureAttackModifiers,getItemHealingMultiplier}from'../src/data/adventureItems.js';
import {canonicalItemId,normalizeItemInventory}from'../src/data/itemIdentity.js';
import {normalizeCollection}from'../src/progression/digimonCollection.js';
import{NORMAL_EVOLUTION_REQUIREMENTS,ITEM_EVOLUTION_REQUIREMENTS,getEvolutionRoute}from'../src/data/evolutionRules.js';
const e=await loadBattleEngine();const catalog=buildItemDex([...e.fixedRewardItems,...e.randomRewardItemPool],e.getRewardItemRarity);
const unit=(name,level)=>e.createCombatant({id:name,name,data:e.allDigimonLookup.get(name),level,digiclones:{hp:10,attack:10,defense:10,specialAttack:10,specialDefense:10,speed:10}});
const state=member=>({currentStage:191,currentMap:'시작의마을',gameMode:'classic',player:member,party:[member],inventory:{},enemies:[],activeAllyIds:[member.id],trainerSkills:{}});
for(const[target,r]of Object.entries(NORMAL_EVOLUTION_REQUIREMENTS))test(target+': evolves by level and stats without rogue Evoluter',()=>{assert(!ITEM_EVOLUTION_REQUIREMENTS[target]);assert(!catalog.some(i=>i.id===r.retiredItemId));for(const source of r.from){const route=getEvolutionRoute(source,target);assert.equal(route.kind,'level');assert.equal(route.level,r.level);const high=unit(source,Math.max(140,r.level));const option=e.getEvolutionOptions(high).find(o=>o.targetData.이름===target);assert(option,source+' -> '+target);assert(!option.itemRequirement);assert(option.requirements.some(x=>x.key!=='level'&&x.key!=='item'));assert(option.canEvolve);assert(e.resolveManualEvolution(state(high),high.id,target));const low=unit(source,r.level-1);assert.equal(e.resolveManualEvolution(state(low),low.id,target),null);const undertrained={...unit(source,r.level),digiclones:{}};assert.equal(e.resolveManualEvolution(state(undertrained),undertrained.id,target),null);const temporary={...undertrained,activeBuffs:{attack:10,defense:10,specialAttack:10,specialDefense:10,speed:10,hp:10}};assert.equal(e.resolveManualEvolution(state(temporary),temporary.id,target),null);}});
test('only X antibody items can share identical image bytes',()=>{const seen=new Map();for(const item of catalog){const path=new URL('../public'+item.imageUrl,import.meta.url),hash=createHash('sha256').update(fs.readFileSync(path)).digest('hex');const previous=seen.get(hash);if(previous)assert(/^X항체/.test(previous.name)&&/^X항체/.test(item.name),previous.name+' shares image with '+item.name);else seen.set(hash,item);}});
test('master catalysts retain a single-item requirement and distinct artwork',()=>{for(const[target,rule]of Object.entries(ITEM_EVOLUTION_REQUIREMENTS).filter(([,r])=>r.rarity==='master')){assert.equal(rule.itemCount??1,1);assert(!/canonical\/evoluter\.png/.test(rule.imageUrl??''),target);}});

for(const[kind,forms]of [['human',spirit.humans],['beast',spirit.beasts]])for(const[target,r]of Object.entries(forms))test(target+': one common-grade Spirit grants equipment effect and is consumed by evolution',()=>{
 const id=kind+'-spirit-'+r.element,item=catalog.find(i=>i.id===id);assert(item);assert.equal(item.rarity,'good');assert.equal(catalog.filter(i=>i.id===id).length,1);assert(ADVENTURE_BATTLE_ITEMS.some(i=>i.id===id));assert(!e.randomRewardItemPool.some(i=>i.id===id&&i.evolutionItemFor));
 const source=r.from[0],member={...unit(source,140),battleItems:{[id]:1,'crest-courage':1}},before=JSON.stringify(member);assert.equal(e.resolveManualEvolution(state(unit(source,140)),source,target),null);const option=e.getEvolutionOptions(member).find(o=>o.targetData.이름===target);assert(option.canEvolve);assert.equal(option.itemCount,1);const result=e.resolveManualEvolution(state(member),source,target);assert(result);assert(!result.evolvedMember.battleItems[id]);assert.equal(result.evolvedMember.battleItems['crest-courage'],1);assert.equal(JSON.stringify(member),before);
 const bag={...state(member),inventory:{[id]:1}};const bagResult=e.resolveManualEvolution(bag,source,target);assert(bagResult);assert(!bagResult.nextGameState.inventory[id]);assert.equal(bagResult.evolvedMember.battleItems[id],1);
});
test('spirit fusion follows each beast and cannot skip directly from the human form',()=>{for(const[target,r]of Object.entries(spirit.fusions)){assert(!ITEM_EVOLUTION_REQUIREMENTS[target]);const b=r.from[0];assert(e.getEvolutionOptions(unit(b,140)).some(o=>o.targetData.이름===target&&o.canEvolve&&!o.itemRequirement));for(const h of Object.keys(spirit.humans))assert(!e.getEvolutionOptions(unit(h,140)).some(o=>o.targetData.이름===target),h+' -> '+target);}assert(!catalog.some(i=>/융합 스피릿/.test(i.name)));});
test('shared Digimentals merge legacy inventory and discovery records without losing counts',()=>{const a='item-evolution-용기의 디지멘탈 · 가트몬',b='item-evolution-expansion7-allomon',id='item-evolution-용기의 디지멘탈';assert.equal(canonicalItemId(a),id);assert.deepEqual(normalizeItemInventory({[a]:2,[b]:3,[id]:4}),{[id]:9});assert.deepEqual(normalizeItemInventory(normalizeItemInventory({[a]:2,[b]:3,[id]:4})),{[id]:9});const loaded=e.parseSavedGameState(JSON.stringify({version:1,gameState:{...state(unit('아구몬',140)),inventory:{[a]:2,[b]:3}}}));assert.equal(loaded.inventory[id],5);assert(!loaded.inventory[a]);const c=normalizeCollection({items:{[a]:true,[b]:true}});assert.equal(c.items[id],true);assert(!c.items[a]);assert.equal(catalog.filter(i=>i.id===id).length,1);const related=Object.entries(ITEM_EVOLUTION_REQUIREMENTS).filter(([,r])=>r.itemId===id);assert(related.length>=4);for(const[target,r]of related){const member=unit(r.from[0],140),result=e.resolveManualEvolution({...state(member),inventory:{[a]:2}},member.id,target);assert(result,target);assert.equal(result.nextGameState.inventory[id],1);assert(!result.nextGameState.inventory[a]);}});
test('human Spirit combat effects are applied only while equipped',()=>{const attrs={fire:'화염',light:'빛',ice:'얼음',wind:'바람',dark:'어둠'};for(const[element,attr]of Object.entries(attrs)){const input={attacker:{battleItems:{['human-spirit-'+element]:1}},defender:{},skillData:{속성:attr,분류:'특수형'},matchup:{},isCritical:false};assert.equal(getAdventureAttackModifiers(input).multiplier,1.12);assert.equal(getAdventureAttackModifiers({...input,attacker:{battleItems:{}}}).multiplier,1);}assert.equal(getItemHealingMultiplier({}, {battleItems:{'human-spirit-water':1}}, 'single'),1.15);});

test('Paildramon can use one shared Positron Laser for either Imperialdramon mode',()=>{for(const target of ['황제드라몬[드래곤]','황제드라몬[파이터]']){const r=ITEM_EVOLUTION_REQUIREMENTS[target];assert.equal(r.itemId,'item-evolution-포지트론 레이저');assert.equal(r.level,60);const source=unit('파일드라몬',100);assert.equal(e.resolveManualEvolution(state(source),source.id,target),null);for(const id of ['item-evolution-포지트론 레이저','item-evolution-expansion7-imperialdramon-dm']){const out=e.resolveManualEvolution({...state(source),inventory:{[id]:2}},source.id,target);assert(out,target);assert.equal(out.evolvedMember.name,target);assert.equal(out.nextGameState.inventory[r.itemId],1);}}assert.equal(catalog.filter(x=>x.id==='item-evolution-포지트론 레이저').length,1)});
test('Imperialdramon modes switch both ways without new items, levels, or equipment duplication', () => {
  let member = { ...unit('황제드라몬[드래곤]', 5), battleItems: { 'beast-spirit-fire': 1 }, currentHp: 12, experience: 2 }
  const initial = structuredClone(member)
  const equipped = value => Object.fromEntries(Object.entries(value).filter(([,count]) => count > 0))
  for (let i = 0; i < 10; i++) {
    const target = member.name === '황제드라몬[드래곤]' ? '황제드라몬[파이터]' : '황제드라몬[드래곤]'
    const route = getEvolutionRoute(member.name, target)
    assert(route.freeModeChange)
    const option = e.getEvolutionOptions(member).find(o => o.targetData.이름 === target)
    assert(option.canEvolve)
    assert(!option.itemRequirement)
    assert.equal(option.requirements.length, 0)
    const before = structuredClone(member)
    const out = e.resolveManualEvolution(state(member), member.id, target)
    assert(out)
    member = out.evolvedMember
    assert.equal(member.id, initial.id)
    assert.equal(member.level, initial.level)
    assert.equal(member.experience, initial.experience)
    assert.deepEqual(equipped(member.battleItems), equipped(initial.battleItems))
    assert.deepEqual(out.nextGameState.inventory, {})
    assert.deepEqual(before, out.selectedMember)
    assert(member.currentHp / member.maxHp <= before.currentHp / before.maxHp + 1e-9)
  }
  const paladin = e.getEvolutionOptions(unit('황제드라몬[파이터]', 100))
    .find(o => o.targetData.이름 === '황제드라몬[팔라딘]')
  assert.equal(paladin.itemRequirement.id, 'item-evolution-오메가 블레이드')
  assert(!paladin.canEvolve)
})

test('Loweemon uses the purified human darkness spirit, not the corrupted beast variant',()=>{const art=JSON.parse(fs.readFileSync(new URL('../src/data/adventureItemArt.json',import.meta.url)));assert(art['human-spirit-dark'].sourceImage.endsWith('img_kodai_20.png'));assert(art['beast-spirit-dark'].sourceImage.endsWith('img_kodai_22.png'));});
