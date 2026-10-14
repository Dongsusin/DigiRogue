import test from 'node:test'
import assert from 'node:assert/strict'
import expansion7 from '../src/data/rosterExpansion7.json' with {type:'json'}
import expansion8 from '../src/data/rosterExpansion8.json' with {type:'json'}
const expansion={names:[...expansion7.names,...expansion8.names]}
import maps from '../data/map.json' with {type:'json'}
import {BOSS_PROFILES} from '../src/data/bossProfiles.js'
import {RIVAL_PROFILES} from '../src/data/rivalProfiles.js'
import {getBossCandidates,createBossPlan} from '../src/battle/bossEncounters.js'
import {getRivalCandidates} from '../src/battle/rivalEncounters.js'
import {getPossibleEvolutionTargets} from '../src/data/evolutionPossibility.js'
import {loadBattleEngine} from './lib/battle-engine-fixture.mjs'
const e=await loadBattleEngine()
test('early volcanic and shore encounters introduce their new native inhabitants',()=>{
 assert(maps['부트 화산'].등장디지몬['1'].includes('코로나몬'))
 assert(maps['용의눈호수'].등장디지몬['1'].includes('크랩몬'))
 assert(maps['시작의마을'].등장디지몬['1'].includes('제리몬'))
 assert(!Object.values(maps['메탈 엠파이어'].등장디지몬).flat().includes('피치몬'))
})
test('new native lineages and legends are scheduled in their own regions',()=>{
 const solar=BOSS_PROFILES.find(p=>p.regionRoute==='expansion-solar');assert(solar)
 assert.deepEqual(solar.line,['코로나몬','파이라몬','플레어몬','아폴로몬'])
 assert(getBossCandidates(10,'부트 화산',e.allDigimonLookup).some(p=>p.id===solar.id))
 assert(!getBossCandidates(10,'아이스 생츄어리',e.allDigimonLookup).some(p=>p.id===solar.id))
 assert(BOSS_PROFILES.some(p=>p.id==='expansion-legend-그레이스노바몬'))
 assert(RIVAL_PROFILES.some(p=>p.id==='fusion-그레이스노바몬'))
})
test('new natural boss evolution lines never improvise unrelated ancestors or single-body jogress',()=>{
 const routes=BOSS_PROFILES.filter(p=>p.kind==='lineage'&&p.regionRoute?.startsWith('expansion-'))
 assert(routes.length>=25)
 for(const p of routes)for(let i=1;i<p.line.length;i++)assert(getPossibleEvolutionTargets(p.line[i-1]).includes(p.line[i]),p.id+': '+p.line[i-1]+' -> '+p.line[i])
})

import habitats from '../src/data/expansionHabitats.json' with {type:'json'}
import {applyExpansionHabitats} from './lib/expansion-habitats.mjs'
import {EXPANSION_BOSS_ROUTES,EXPANSION_LEGEND_PROFILES} from '../src/data/expansionEncounters.js'
test('every added species has explicit legal habitat bands or a reachable regional boss slot',()=>{
 assert.deepEqual(Object.keys(habitats).sort(),[...expansion.names].sort())
 const bossOnly=[]
 for(const [name,h] of Object.entries(habitats)){
  assert(e.allDigimonLookup.has(name),name);assert(h.maps.length>=2,name)
  for(const map of h.maps)assert(maps[map],map)
  const actual=Object.entries(maps).flatMap(([map,d])=>Object.entries(d.등장디지몬).flatMap(([band,names])=>names.includes(name)?[map+':'+band]:[])).sort()
  if(h.bossOnly){
   bossOnly.push(name);assert.deepEqual(actual,[],name)
   const p=EXPANSION_LEGEND_PROFILES.find(p=>p.name===name||p.line?.includes(name));assert(p,name)
   assert(h.maps.some(map=>Array.from({length:19},(_,i)=>(i+1)*10).some(stage=>getBossCandidates(stage,map,e.allDigimonLookup).some(x=>x.id===p.id))),name)
  }else{
   assert(h.bands.length,name)
   assert.deepEqual(actual,h.maps.flatMap(map=>h.bands.map(b=>map+':'+b)).sort(),name)
  }
 }
 assert.equal(bossOnly.length,12)
})
test('all maps receive added native wildlife and repeated habitat application is idempotent',()=>{
 for(const [map,data]of Object.entries(maps))assert(Object.values(data.등장디지몬).flat().some(n=>expansion.names.includes(n)),map)
 assert.deepEqual(applyExpansionHabitats(maps,habitats),maps)
})
test('habitat updates preserve unrelated creatures and map metadata',()=>{
 const input={home:{등장디지몬:{1:['old','new'],2:['old2']},연결맵:['other'],image:'map.webp'},other:{등장디지몬:{1:['old3','new']},arbitrary:{x:1}}}
 const result=applyExpansionHabitats(input,{new:{maps:['home'],bands:[2],bossOnly:false}})
 assert.deepEqual(result,{home:{등장디지몬:{1:['old'],2:['old2','new']},연결맵:['other'],image:'map.webp'},other:{등장디지몬:{1:['old3']},arbitrary:{x:1}}})
 assert.deepEqual(input.home.등장디지몬[1],['old','new'])
})
test('all expansion routes and legend plans use complete native models and local stage limits',()=>{
 for(const p of BOSS_PROFILES.filter(p=>p.regionRoute?.startsWith('expansion-')||p.id.startsWith('expansion-legend-'))){
  assert(p.minStage>0&&p.maxStage===190,p.id)
  for(const map of p.maps){
   const stages=Array.from({length:19},(_,i)=>(i+1)*10).filter(stage=>getBossCandidates(stage,map,e.allDigimonLookup).some(x=>x.id===p.id))
   assert(stages.length,p.id+':'+map)
   for(const stage of stages){const plan=createBossPlan(p,stage);assert(e.allDigimonLookup.has(plan.initialName),p.id);assert(plan.phases.length>0,p.id)}
  }
 }
 for(const map of Object.keys(maps))assert(getBossCandidates(200,map,e.allDigimonLookup).every(p=>!p.id.startsWith('expansion-')),map)
 assert.equal(EXPANSION_BOSS_ROUTES.length,41)
})
