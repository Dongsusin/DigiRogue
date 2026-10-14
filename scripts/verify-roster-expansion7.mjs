import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import expansion from '../src/data/rosterExpansion7.json' with { type: 'json' }
import {getEvolutionRoute,getEvolutionTargets,ITEM_EVOLUTION_REQUIREMENTS,JOGRESS_RECIPES} from '../src/data/evolutionRules.js'
import {ITEM_EVOLUTION_REWARD_ITEMS} from '../src/data/evolutionItems.js'
import {getDigimonPassive} from '../src/data/digimonPassives.js'
import {resolveEvolutionCinematic} from '../src/data/evolutionCinematics.js'
import {loadBattleEngine} from './lib/battle-engine-fixture.mjs'
const e=await loadBattleEngine()
const clones={hp:10,attack:10,defense:10,specialAttack:10,specialDefense:10,speed:10}
const unit=(name,level=140)=>e.createCombatant({id:name,name,data:e.allDigimonLookup.get(name),level,digiclones:clones})
const state=(party,inventory={})=>({currentStage:191,currentMap:'시작의마을',gameMode:'classic',player:party[0],party,inventory,enemies:[],activeAllyIds:[party[0].id],trainerSkills:{}})
test('all added forms have actual native attack clips, readable 3D portraits, combat profiles, moves and scenes',()=>{
 assert.equal(expansion.names.length,150)
 const manifest=JSON.parse(fs.readFileSync(new URL('../src/data/digimonModelManifest.json',import.meta.url)))
 for(const name of expansion.names){const data=e.allDigimonLookup.get(name);assert(data,name);const u=unit(name);assert(u.maxHp>0&&u.skills.length,name);assert(getDigimonPassive(u),name);for(const skill of data.기술)assert(e.getSkillData(skill,{name}),name+':'+skill);
 const model=manifest[name],bytes=fs.readFileSync(new URL('../public'+model.url,import.meta.url)),g=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12))),clips=g.animations.map(a=>a.name);assert(['idle','damage','down'].every(c=>clips.includes(c)),name);assert(clips.some(c=>/^attack|^special/.test(c)),name);assert(!(model.authoredMotion?.roles??[]).some(r=>/^attack|^special/.test(r)),name);for(const folder of ['thumbs','previews'])assert(fs.statSync(new URL('../public'+model.url.replace(/([^/]+)\.glb$/,(m,s)=>folder+'/'+s+'.webp'),import.meta.url)).size>0,name);
 const scene=resolveEvolutionCinematic({from:[{name:'아구몬'}],to:{name}}, {style:'rumble'});assert(scene.duration>0&&scene.palette.length===3,name);
 }
})
test('Jupitermon and both Chronomon modes have only the requested immediate ancestors',()=>{
 for(const [target,parents] of Object.entries(expansion.exclusiveParents))for(const source of e.allDigimonLookup.keys()){const included=getEvolutionTargets({이름:source,진화가능:[target]}).includes(target);assert.equal(included,parents.includes(source),source+' -> '+target)}
 const j=e.allDigimonLookup.get('유피테르몬[래스 모드]');assert.equal(j.stage,'초궁극체')
})
for(const [target,rule] of Object.entries(expansion.items).filter(([target])=>ITEM_EVOLUTION_REQUIREMENTS[target]))test(target+': correct materials and one catalyst consumed; missing catalyst and low level rejected',()=>{
 const recipe=JOGRESS_RECIPES.find(x=>x.targetName===target),party=(recipe?.materials??[rule.from[0]]).map(n=>unit(n)),item=ITEM_EVOLUTION_REWARD_ITEMS.find(x=>x.evolutionItemFor===target);assert(item);assert.equal(item.requiredCount,1);assert.equal(ITEM_EVOLUTION_REQUIREMENTS[target].itemCount,1);
 assert.equal(e.resolveManualEvolution(state(party),party[0].id,target),null);
 const low=party.map(x=>({...x,level:rule.level-1}));assert.equal(e.resolveManualEvolution(state(low,{[item.id]:1}),low[0].id,target),null);
 const before=state(party,{[item.id]:2}),copy=JSON.stringify(before);const result=e.resolveManualEvolution(before,party[0].id,target);assert(result,target+': not reachable');assert.equal(result.evolvedMember.name,target);assert.equal(result.nextGameState.inventory[item.id],1);assert.equal(JSON.stringify(before),copy);if(recipe)assert.equal(result.nextGameState.party.length,1)
})

test('restored Chaosmon and JetMervamon require their original partners, rejecting the old replacements',()=>{
 for(const [target,materials,old]of [['카오스몬',['반쵸레오몬','다크드라몬'],'카오스드라몬'],['제트메르바몬',['메르바몬','스패로우몬'],'미네르바몬']]){const recipe=JOGRESS_RECIPES.find(r=>r.targetName===target);assert.deepEqual(recipe.materials,materials);const party=materials.map(n=>unit(n,recipe.level));const result=e.resolveJogressEvolution(state(party),party,recipe,true);assert(result,target);assert.equal(result.evolvedMember.name,target);const substitute=party.map(x=>x.name===materials[0]&&target==='제트메르바몬'||x.name===materials[1]&&target==='카오스몬'?unit(old,recipe.level):x);assert.equal(e.resolveJogressEvolution(state(substitute),substitute,recipe,true),null);assert.equal(getEvolutionRoute(old,target),null);}
})
test('new juvenile and champion intermediates continue through the gameplay evolution choices',()=>{
 for(const [from,to] of [['캔들몬','메라몬'],['블랙그라우몬','블랙메가로그라우몬'],['웬디몬','안티라몬'],['아루다몬','카이젤그레이몬'],['베오울프몬','매그너가루몬[SV]'],['폰체스몬(백)','가드로몬'],['피치몬','둥실몬']]){assert(e.allDigimonLookup.get(from).진화가능.includes(to),from+' -> '+to);assert(e.getEvolutionOptions(unit(from)).some(x=>x.targetData.이름===to),from+' -> '+to)}
 assert(!e.allDigimonLookup.get('피치몬').진화가능.includes('뽀글몬'));assert(!e.allDigimonLookup.get('미네르바몬').진화가능.includes('유피테르몬'))
})

test('DORU and Ryudamon branches no longer cross through the misplaced ultimate forms',()=>{
 for(const [from,to]of [['그레이드몬','알파몬'],['도루그레몬','도루고라몬'],['도루그레몬','알파몬'],['히샤류우몬','오류우몬']]){assert(e.allDigimonLookup.get(from).진화가능.includes(to));const u=unit(from);assert(e.getEvolutionOptions(u).some(x=>x.targetData.이름===to));}
 for(const [from,to]of [['그레이드몬','도루고라몬'],['도루그레몬','오류우몬']]){assert.equal(getEvolutionRoute(from,to),null);const u=unit(from);assert(!e.getEvolutionOptions(u).some(x=>x.targetData.이름===to));assert.equal(e.resolveManualEvolution(state([u]),u.id,to),null);}
 const stale=unit('도루그레몬');stale.speciesData={...stale.speciesData,진화가능:['알파몬','오류우몬']};const loaded=e.parseSavedGameState(JSON.stringify({version:1,gameState:state([stale])}));assert(loaded.player.speciesData.진화가능.includes('도루고라몬'));assert(!loaded.player.speciesData.진화가능.includes('오류우몬'));
})

test('old Positron Laser inventory still evolves Paildramon with the same item ID',()=>{const rule=ITEM_EVOLUTION_REQUIREMENTS['황제드라몬[파이터]'];assert.equal(rule.itemId,'item-evolution-포지트론 레이저');assert.equal(rule.level,60);const member=unit('파일드라몬');assert(e.resolveManualEvolution(state([member],{[rule.itemId]:1}),member.id,'황제드라몬[파이터]'));})

test('reintroduced Deramon remains distinct from the old mislabeled PrinceMamemon in current collections',async()=>{const {canonicalDigimonName}=await import('../src/data/digimonNames.js');const {normalizeCollection,collectionUnlockedSpecies}=await import('../src/progression/digimonCollection.js');assert.equal(canonicalDigimonName('뿌띠몬'),'뿌띠몬');assert.equal(canonicalDigimonName('뿌띠몬',{legacy:true}),'프린스콩알몬');const c=normalizeCollection({species:{뿌띠몬:{nameRevision:1,seen:true,unlocked:true},프린스콩알몬:{nameRevision:1,seen:true,unlocked:true}}});const unlocked=collectionUnlockedSpecies(c);assert(unlocked.includes('뿌띠몬'));assert(unlocked.includes('프린스콩알몬'));})


const removedForms=['얼티메이트브라키몬','바커스몬[만취 모드]','오르디네몬'];
test('requested removals cannot appear in the roster, evolution paths, rewards or downloadable models',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../src/data/digimonModelManifest.json',import.meta.url)));
 for(const name of removedForms){assert(!e.allDigimonLookup.has(name));assert(!manifest[name]);assert(!ITEM_EVOLUTION_REQUIREMENTS[name]);assert(!JOGRESS_RECIPES.some(r=>r.targetName===name||r.materials.includes(name)));assert(!ITEM_EVOLUTION_REWARD_ITEMS.some(item=>item.evolutionItemFor===name));for(const data of e.allDigimonLookup.values())assert(!getEvolutionTargets(data).includes(name),data.이름+' -> '+name);}
 for(const slug of ['ultimatebrachiomon','bacchusmon-dm','ordinemon'])for(const file of [slug+'.glb','thumbs/'+slug+'.webp','previews/'+slug+'.webp'])assert(!fs.existsSync(new URL('../public/models/digimon/'+file,import.meta.url)),file);
 for(const name of ['바커스몬','브라키몬','기자몬'])assert(e.allDigimonLookup.has(name),name);
});
test('old collection unlocks and saves cannot bring retired forms back',async()=>{
 const {normalizeCollection,collectionUnlockedSpecies}=await import('../src/progression/digimonCollection.js');const {isPlayableDigimon}=await import('../src/data/speciesAvailability.js');
 const species=Object.fromEntries(removedForms.map(name=>[name,{nameRevision:1,seen:true,unlocked:true}]));const unlocked=collectionUnlockedSpecies(normalizeCollection({species}));
 for(const name of removedForms){assert(!unlocked.includes(name));assert(!isPlayableDigimon(name));const stale={...unit('아구몬'),name,imageName:name,speciesData:{이름:name,진화가능:[]}};assert.equal(e.parseSavedGameState(JSON.stringify({version:1,gameState:state([stale])})),null);}
});
