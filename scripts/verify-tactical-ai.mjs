import test from 'node:test'
import assert from 'node:assert/strict'
import {loadBattleEngine} from './lib/battle-engine-fixture.mjs'
const e=await loadBattleEngine()
const unit=(name,id,extra={})=>({...e.createCombatant({id,name,data:e.allDigimonLookup.get(name),level:40}),currentHp:1000,maxHp:1000,attack:100,specialAttack:90,defense:50,specialDefense:50,speed:50,type:'백신',attribute:'무',...extra})
const choose=(enemies,party)=>{const before=Math.random;Math.random=()=>.999;try{return e.createEnemyBattleTurnActions({enemies,party,activeAllyIds:party.map(u=>u.id)})}finally{Math.random=before}}
test('AI no longer randomly picks a meaningfully weaker move within the old eighty-percent window',()=>{
 const enemy=unit('아구몬','e',{skills:['기본 타격','기본 파동']});const [a]=choose([enemy],[unit('팔몬','p')]);assert.equal(a.skillName,'기본 타격')
})
test('ordinary boss attacks deliberately target the favourable type matchup',()=>{
 const b=unit('그레이몬','e',{skills:['기본 타격'],isBoss:true,bossEncounter:{kind:'wild',phase:0}})
 const [a]=choose([b],[unit('팔몬','virus',{type:'바이러스'}),unit('팔몬','data',{type:'데이터'})]);assert.equal(a.targetId,'virus')
})
test('support commands explicitly select a wounded friendly target rather than an opponent',()=>{
 const healer=unit('엔젤몬','healer',{skills:['힐']}),wounded=unit('그레이몬','wounded',{currentHp:100,skills:['기본 타격']})
 const a=choose([healer,wounded],[unit('팔몬','p')]).find(a=>a.actorId==='healer');assert.equal(a.skillName,'힐');assert.equal(a.targetId,'wounded')
})
test('two attackers avoid spending both actions on an already covered knockout',()=>{
 const enemies=['e1','e2'].map(id=>unit('아구몬',id,{skills:['기본 타격']})),party=[unit('팔몬','weak',{currentHp:1}),unit('팔몬','healthy')]
 const a=choose(enemies,party);assert.equal(a[0].targetId,'weak');assert.equal(a[1].targetId,'healthy')
})
import {chooseBattleCommand,rankBattleCommands,planEnemyCommands} from '../src/battle/tacticalAI.js'
import {getFinalBossMove} from '../src/battle/finalBosses.js'
const attack=(name,power,category='물리형',extra={})=>({기술명:name,분류:category,속성:'무',데미지:power,명중률:100,...extra})
const support=(name,effect)=>({기술명:name,분류:'보조형',속성:'무',데미지:0,명중률:100,효과:effect})
const fixture=(skills,ownExtra={},foeExtra={})=>{
 const own=unit('아구몬','own',{skills:skills.map(s=>s.기술명),...ownExtra}),foe=unit('팔몬','foe',{skills:['기본 타격'],...foeExtra})
 const getSkill=(n,u)=>skills.find(s=>s.기술명===n)??e.getSkillData(n,u)
 const options={...e.getTacticalOptions([own],[foe]),getSkill,random:()=>0}
 return {own,foe,options,choose:()=>chooseBattleCommand(own,options),rank:()=>rankBattleCommands(own,options)}
}
test('physical resistance and the actual lower defense determine category selection',()=>{
 const f=fixture([attack('physical',60),attack('special',60,'특수형')],{attack:100,specialAttack:100},{defense:20,specialDefense:100,battleGuards:{physical:3}})
 assert.equal(f.choose().skillName,'physical')
 f.foe.defense=100;f.foe.specialDefense=20
 assert.equal(f.choose().skillName,'special')
})
test('a reliable finishing attack wins over a stronger inaccurate cooldown attack',()=>{
 const f=fixture([attack('reliable',30),attack('risky',150,'물리형',{명중률:40,cooldown:5})],{}, {currentHp:3})
 assert.equal(f.choose().skillName,'reliable')
})
test('available cooldown-group restrictions are respected',()=>{
 const f=fixture([attack('cooling',150,'물리형',{cooldownGroup:'blast'}),attack('ready',40)],{skillCooldowns:{'@blast':2}})
 assert.equal(f.choose().skillName,'ready')
})
test('full-health healing and already active buffs are not repeatedly cast',()=>{
 const f=fixture([support('heal',{kind:'heal',targetSide:'ally',scope:'single',healRatio:.5}),
 support('boost',{kind:'stat-modifier',targetSide:'ally',scope:'self',statKey:'attack',multiplier:1.3}),attack('hit',40)],
 {statModifiers:{attack:{multiplier:1.3,duration:'region'}}})
 assert.equal(f.choose().skillName,'hit')
})
test('a physical-only attacker does not spend its turn boosting special attack',()=>{
 const f=fixture([support('wrong',{kind:'stat-modifier',targetSide:'ally',scope:'self',statKey:'specialAttack',multiplier:1.5}),attack('hit',40)])
 assert.equal(f.rank().find(c=>c.skillName==='wrong').score,0)
})
test('an offensive setup can be selected in a long safe battle but not before a certain finish',()=>{
 const skills=[support('charge',{kind:'stat-modifier',targetSide:'ally',scope:'self',statKey:'attack',multiplier:1.5}),attack('hit',40)]
 const f=fixture(skills,{}, {attack:5,specialAttack:5})
 assert.equal(f.choose().skillName,'charge')
 f.foe.currentHp=1
 assert.equal(f.choose().skillName,'hit')
})
test('speed changes matter only when crossing a current opponent speed',()=>{
 const f=fixture([support('speed',{kind:'stat-modifier',targetSide:'ally',scope:'self',statKey:'speed',multiplier:1.5}),attack('hit',40)],{speed:50},{speed:60})
 assert(f.rank().find(c=>c.skillName==='speed').score>0)
 f.foe.speed=100
 assert.equal(f.rank().find(c=>c.skillName==='speed').score,0)
})
test('an irrelevant physical barrier is rejected against a special-only opponent',()=>{
 const f=fixture([support('wall',{kind:'guard',guard:'physical',turns:2,targetSide:'ally',scope:'self'}),attack('hit',40)],{}, {skills:['기본 파동']})
 assert.equal(f.rank().find(c=>c.skillName==='wall').score,0)
})
test('status immunity and an existing ailment prevent wasted status commands',()=>{
 const f=fixture([support('poison',{kind:'status',status:'독',chance:100,targetSide:'enemy',scope:'single'}),attack('hit',40)],{}, {battleGuards:{status:2}})
 assert.equal(f.choose().skillName,'hit')
 f.foe.battleGuards={};f.foe.statusEffect={type:'독',turns:0}
 assert.equal(f.choose().skillName,'hit')
})
test('a cure explicitly targets the disabled friendly unit',()=>{
 const skills=[support('cure',{kind:'clear-status',targetSide:'ally',scope:'single'}),attack('hit',20)]
 const f=fixture(skills)
 const patient=unit('그레이몬','patient',{statusEffect:{type:'혼수상태',turns:0},skills:['기본 타격']})
 f.options.allies.push(patient)
 const c=f.choose();assert.equal(c.skillName,'cure');assert.equal(c.targetId,'patient')
})
test('area attacks are evaluated against both active opponents',()=>{
 const f=fixture([attack('single',70),attack('area',60,'물리형',{전체공격:true})])
 f.options.opponents.push(unit('팔몬','second'))
 assert.equal(f.choose().skillName,'area')
 f.options.opponents.pop()
 assert.equal(f.choose().skillName,'single')
})
test('single attacks obey taunt but offensive ailments keep their own target pool',()=>{
 const f=fixture([attack('hit',40),support('toxic',{kind:'status',status:'맹독',chance:100,targetSide:'enemy',scope:'single'})])
 const tank=unit('팔몬','tank',{battleGuards:{taunt:2,status:2}})
 f.options.opponents.push(tank)
 const commands=f.rank()
 assert(commands.filter(c=>c.skillName==='hit').every(c=>c.targetId==='tank'))
 assert(commands.some(c=>c.skillName==='toxic'&&c.targetId==='foe'&&c.score>0))
})
test('two healers coordinate without duplicating the same friendly heal',()=>{
 const f=fixture([support('heal',{kind:'heal',targetSide:'ally',scope:'single',healRatio:.5})])
 const patient=unit('그레이몬','patient',{currentHp:200,skills:['기본 타격']})
 const other={...f.own,id:'other'}
 const commands=planEnemyCommands([f.own,other,patient],{...f.options,allowSkill:()=>true})
 assert.equal(commands.filter(c=>c.skillName==='heal'&&c.targetId==='patient').length,1)
})
test('planning is read-only and damage forecasts do not roll random values',()=>{
 const f=fixture([attack('hit',60),support('charge',{kind:'stat-modifier',statKey:'attack',multiplier:1.5,scope:'self'})])
 const snapshot=structuredClone({own:f.own,foe:f.foe})
 const before=Math.random;Math.random=()=>{throw Error('Forecast rolled RNG')}
 try{rankBattleCommands(f.own,f.options);e.getAttackForecast(f.own,f.options.getSkill('hit'),f.foe,'enemy')}finally{Math.random=before}
 assert.deepEqual({own:f.own,foe:f.foe},snapshot)
})
test('forecasts match actual non-critical damage across categories, burn, guard and equipment',()=>{
 for(const category of ['물리형','특수형'])for(const guard of [false,true])for(const burn of [false,true]){
  const a=unit('아구몬','a',{attack:173,specialAttack:137,statusEffect:burn?{type:'화상',turns:0}:null})
  const d=unit('팔몬','d',{defense:63,specialDefense:49,battleGuards:guard?{physical:2,special:2}:{}})
  const skill=attack('fixture',77,category)
  const saved=Math.random;Math.random=()=>.5
  try{const p=e.getAttackForecast(a,skill,d,'enemy'),r=e.resolveAttackAction({attacker:a,defender:d,skillName:'fixture',skillOverride:skill,attackerSide:'enemy'})
   assert.equal(p.damage,d.currentHp-r.nextDefender.currentHp,category+':'+guard+':'+burn)
  }finally{Math.random=saved}
 }
})
test('forecast respects rival HP sections as well as an ordinary unsegmented follower',()=>{
 const a=unit('아구몬','a',{attack:10000})
 const skill=attack('huge',500)
 for(const leader of [true,false]){
  const d=unit('팔몬','d',{rivalEncounter:{},bossEncounter:{leader,phase:0,phases:[]},bossHpSegmentCount:4})
  const saved=Math.random;Math.random=()=>.5
  try{
   const p=e.getAttackForecast(a,skill,d,'enemy'),r=e.resolveAttackAction({attacker:a,defender:d,skillOverride:skill,attackerSide:'enemy'})
   assert.equal(p.damage,d.currentHp-r.nextDefender.currentHp,'leader '+leader)
  }finally{Math.random=saved}
 }
})
test('legacy enemy resolution applies the selected friendly heal',()=>{
 const healer=unit('엔젤몬','healer',{skills:['힐']}),patient=unit('아구몬','patient',{currentHp:100,skills:['기본 타격']})
 const r=e.resolveEnemyPartyActions({enemies:[healer,patient],party:[unit('팔몬','p')],activeAllyIds:['p']})
 assert(r.nextEnemies.find(u=>u.id==='patient').currentHp>100)
 assert.equal(r.nextParty[0].currentHp<1000,true)
})
test('scripted final boss cycles retain their authored move and target',()=>{
 const boss=unit('아포카리몬','boss',{isBoss:true,bossEncounter:{id:'apocalymon-final',kind:'final',phase:0,actions:0}})
 assert(boss?.isBoss)
 const move=getFinalBossMove(boss);assert(move)
 const a=choose([boss],[unit('팔몬','p')])[0]
 assert.equal(a.skillName,move.skill.기술명)
})

test('hope crest prevents an ineffective stat drop from being selected',()=>{
 const f=fixture([support('weaken',{kind:'stat-modifier',targetSide:'enemy',scope:'single',statKey:'attack',multiplier:.5}),attack('hit',40)],{}, {attack:500,battleItems:{'crest-hope':1}})
 assert.equal(f.rank().find(c=>c.skillName==='weaken').score,0)
})
test('two taunters still redirect single attacks to the first taunter, exactly as resolution',()=>{
 const f=fixture([attack('hit',40)],{}, {battleGuards:{taunt:2}})
 f.options.opponents.push(unit('팔몬','second',{currentHp:1,battleGuards:{taunt:2}}))
 assert(f.rank().every(c=>c.targetId==='foe'))
})
test('a status command is not spent on an opponent whose knockout is already assigned',()=>{
 const f=fixture([attack('hit',30),support('poison',{kind:'status',status:'맹독',chance:100,targetSide:'enemy',scope:'single'})],{}, {currentHp:1})
 f.options.reservedDamage=new Map([['foe',1]])
 assert.equal(f.rank().find(c=>c.skillName==='poison').score,0)
})
