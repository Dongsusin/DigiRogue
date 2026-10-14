import test from 'node:test'
import assert from 'node:assert/strict'
import eggs from '../data/디지몬/디지에그.json' with { type: 'json' }
import expansion7 from '../src/data/rosterExpansion7.json' with { type: 'json' }
import expansion8 from '../src/data/rosterExpansion8.json' with { type: 'json' }
const expansion={names:[...expansion7.names,...expansion8.names]}
import { resolveEvolutionCinematic } from '../src/data/evolutionCinematics.js'
import { listAllEvolutionRoutes, getDigimonProfile } from '../src/data/evolutionPossibility.js'
import { sampleCinematic } from '../src/three/cinematicTimeline.js'
import { createEvolutionMotif, EVOLUTION_MOTIF_KINDS } from '../src/three/evolutionMotifs.js'
import { createDigiEggRewardItems } from '../src/data/gameDescriptions.js'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
const scene = (target, from=['아구몬']) => resolveEvolutionCinematic({from:from.map(name=>({name})),to:{name:target}}, {style:'rumble'})
const themes = [
 ['코로나몬','solar','sun'], ['그레이스노바몬','solar','eclipse'],
 ['유피테르몬[래스 모드]','thunder','judgment'],
 ['크로노몬[홀리 모드]','chronos','restore'], ['크로노몬[디스트로이 모드]','chronos','reverse'],
 ['아이기오몬','score','flute'], ['세이렌몬','score','choir'],
 ['아라크네몬','web','queen'], ['코스파이더몬','web','small'],
 ['브롯사몬','blossom','garden'], ['클라비스엔젤몬','blade','key'],
 ['빅토리그레이몬','blade','great'], ['베오울프몬','blade','dual'],
 ['브리웨루드라몬','shield','fire'], ['티아루도몬','shield','ice'],
 ['라이지루도몬','shield','electric'], ['유라몬','forest','seed'],
]
for(const [name,kind,variant]of themes) test(name+': themed model-space transformation',()=>{
 const c=scene(name); assert.equal(c.motif.kind,kind);assert.equal(c.motif.variant,variant);assert.equal(c.signature,true)
})
test('all 159 added forms resolve authored motifs in both supported scene styles without white flashes',()=>{
 assert.equal(expansion.names.length,159)
 for(const name of expansion.names)for(const style of ['classic','rumble']){
  const c=resolveEvolutionCinematic({from:[{name:'아구몬'}],to:{name}}, {style});
  assert(c.signature&&!c.auto,name);assert(EVOLUTION_MOTIF_KINDS.includes(c.motif?.kind),name)
  assert.equal(c.sourceSpin,0,name);assert.equal(c.flashScale,0,name)
  assert.equal(c.palette.length,3);assert(c.palette.every(x=>/^#[a-f0-9]{6}$/i.test(x)),name)
  for(const reduced of [false,true])for(let t=0;t<=c.duration;t+=100)assert.equal(sampleCinematic(c,t,reduced).flash,0,name)
 }
 assert.equal(resolveEvolutionCinematic({mode:'hatch',to:{name:'유라몬'}}).template,'classic')
})
test('sun and moon jogress follows partner identities even when their order is swapped',()=>{
 const a=scene('그레이스노바몬',['아폴로몬','디아나몬']),b=scene('그레이스노바몬',['디아나몬','아폴로몬'])
 assert.equal(a.template,'jogress');assert.notDeepEqual(a.sourcePalettes[0],a.sourcePalettes[1]);assert.deepEqual(a.sourcePalettes[0],b.sourcePalettes[1]);assert.deepEqual(a.sourcePalettes[1],b.sourcePalettes[0])
 assert.equal(scene('유피테르몬[래스 모드]',['유피테르몬']).template,'mode')
 assert.equal(scene('아이기오투스몬[그린]',['아이기오투스몬']).template,'mode')
 assert.equal(scene('황제드라몬[드래곤]',['황제드라몬[파이터]']).template,'mode')
})
test('every added scene motif supports pause, seeking, reduced motion and finite geometry',()=>{
 const tested=new Set()
 for(const name of expansion.names){const c=scene(name);const key=c.motif.kind+':'+c.motif.variant;if(tested.has(key))continue;tested.add(key)
  for(const reducedMotion of [false,true]){const m=createEvolutionMotif(c.motif.kind,c.palette,{variant:c.motif.variant,sourcePalettes:c.sourcePalettes,reducedMotion});
   let vertices=0;m.root.traverse(o=>{const p=o.geometry?.attributes.position;if(p){vertices+=p.count;assert([...p.array].every(Number.isFinite),name)}});assert(vertices>0&&vertices<100000,name+': geometry budget')
   const snapshot=()=>{const rows=[];m.root.traverse(o=>rows.push([...o.matrixWorld.elements,o.material?.opacity??0]));return rows}
   const frame=sampleCinematic(c,3500,reducedMotion);m.update(frame,3.5,2.6);const a=snapshot();m.update(sampleCinematic(c,5500,reducedMotion),5.5,2.6);m.update(frame,3.5,2.6);assert.deepEqual(snapshot(),a,name+': seek drift')
   assert(a.flat().every(Number.isFinite),name);m.update(sampleCinematic(c,c.duration,reducedMotion),c.duration/1000,2.6);assert.equal(m.root.visible,false)
   const geos=new Set(),mats=new Set();m.root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material)});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose())
  }
 }
 assert(tested.size>=30,'individual thematic variations are used')
})
const additions=[['쟈리몬','우정','기기몬'],['뽈뽈몬','성실','카프리몬'],['피치몬','사랑','둥실몬'],['유라몬','친절','시드몬'],['제리몬','희망','구미몬']]
test('new infants join fitting existing eggs, preserving all ten saved reward IDs',()=>{
 assert.deepEqual(eggs.map(e=>e.이름),['용기','우정','사랑','지식','친절','희망','순수','성실','빛','어둠'])
 const rewards=createDigiEggRewardItems(eggs,3);assert.equal(rewards.length,10)
 for(const [i,r]of rewards.entries())assert.equal(r.id,'digi-egg-'+(i+1))
 for(const [infant,egg]of additions)assert(rewards.find(r=>r.digiEggName===egg).hatchPool.includes(infant),infant+' in '+egg)
})
test('actual hatch consumer produces each new infant and its early evolution stays reachable at low level',async()=>{
 const e=await loadBattleEngine()
 for(const [infant,,child]of additions){const egg=e.createDigiEggCombatant({id:infant,eggName:'검증용',hatchPool:[infant],stagesRemaining:1});const {nextCombatant:u}=e.hatchDigiEggCombatant(egg);assert.equal(u.name,infant);assert.equal(u.speciesData.stage,'유아기');assert.equal(u.isEgg,undefined)
  const levelled=e.refreshCombatantStats({...u,level:4});const opt=e.getEvolutionOptions(levelled).find(o=>o.targetData.이름===child);assert(opt,infant+' -> '+child);assert(opt.requirements.every(r=>r.isMet),infant+': early growth blocked')
 }
 for(const egg of eggs){assert.equal(new Set(egg.부화가능).size,egg.부화가능.length);for(const name of egg.부화가능)assert.equal(e.allDigimonLookup.get(name)?.stage,'유아기',name)}
 const stale=e.createDigiEggCombatant({id:'old-egg',eggName:'희망',hatchPool:['삭제된 디지몬']});const hatched=e.hatchDigiEggCombatant(stale).nextCombatant;assert(eggs.find(x=>x.이름==='희망').부화가능.includes(hatched.name));assert(!hatched.isEgg)
 const player=e.createCombatant({id:'save-player',name:'아구몬',data:e.allDigimonLookup.get('아구몬'),level:5})
 const loaded=e.parseSavedGameState(JSON.stringify({version:1,gameState:{currentStage:1,currentMap:'시작의마을',gameMode:'classic',player,party:[player,stale],enemies:[],encounterPool:['아구몬']}}))
 assert(loaded,'old egg save rejected');assert(loaded.party.find(u=>u.id==='old-egg').eggHatchPool.includes('제리몬'),'old egg pool was not refreshed')
})

test('every added non-infant has a playable incoming route that uses its scene',()=>{
 const routes=listAllEvolutionRoutes()
 for(const name of expansion.names.filter(n=>getDigimonProfile(n).stage!=='유아기')){
  const incoming=routes.filter(r=>r.to===name);assert(incoming.length,name)
  for(const r of incoming){const c=scene(name,r.from);assert(c.signature&&!c.auto,name);if(r.from.length>1)assert.equal(c.template,name==='샤우트몬[스타소드]'?'xros':'jogress',name)}
 }
})

test('the lunar emblem retains its blue colour with reversed jogress selection order',()=>{
 for(const from of [['아폴로몬','디아나몬'],['디아나몬','아폴로몬']]){const c=scene('그레이스노바몬',from),m=createEvolutionMotif(c.motif.kind,c.palette,{variant:c.motif.variant,sourcePalettes:c.sourcePalettes});const moon=m.parts.find(p=>p.role==='eclipse-moon');assert.equal(moon.mesh.material.color.getHexString(),'8b9dff');const g=new Set();m.root.traverse(o=>{if(o.geometry)g.add(o.geometry)});g.forEach(x=>x.dispose());m.materials.forEach(x=>x.dispose())}
})
