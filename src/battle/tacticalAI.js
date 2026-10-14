import {getCommandSkillNames,getSkillCooldown,canApplyStatus,statusUtility} from '../balance/combat.js'
import {getStatusEffectDefinition} from './statusConditions.js'
import {isStatModifierActive} from './regionModifiers.js'
import {hasAdventureItem} from '../data/adventureItems.js'
import {getDigimonPassive} from '../data/digimonPassives.js'
const alive=u=>u&&!u.isEgg&&u.currentHp>0
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n))
const ratio=u=>u.currentHp/Math.max(1,u.maxHp)
const modifier=(u,key)=>isStatModifierActive(u.statModifiers?.[key])?u.statModifiers[key].multiplier:1
const activeStatus=u=>getStatusEffectDefinition(u.statusEffect?.type)
const area=s=>s.전체공격===true||s.효과?.scope==='all'

// Read-only evaluation of visible units. No queued player commands, random
// damage rolls, reserve Digimon, or unrevealed future forms are inspected.
function context(actor,options) {
 const {getSkill,estimateAttack,allies=[actor],opponents=[],claims=new Map(),reservedDamage=new Map()}=options
 const own=allies.filter(alive),foes=opponents.filter(alive),cache=new WeakMap()
 const attacks=u=>getCommandSkillNames(u,n=>getSkill(n,u)).map(n=>getSkill(n,u)).filter(s=>s&&!s.효과&&s.분류!=='보조형'&&getSkillCooldown(u,s)===0)
 const predict=(a,s,d)=>{
  let skills=cache.get(a);if(!skills){skills=new Map();cache.set(a,skills)}
  let targets=skills.get(s);if(!targets){targets=new WeakMap();skills.set(s,targets)}
  let p=targets.get(d);if(!p){p=estimateAttack(a,s,d);targets.set(d,p)}
  return p
 }
 const best=(a,d)=>Math.max(0,...attacks(a).map(s=>{const p=predict(a,s,d);return p.damage*p.accuracy}))
 const incoming=d=>foes.reduce((sum,f)=>sum+best(f,d)*(activeStatus(f)?.actionSuccessRate??1),0)
 const outgoing=(a,targets=foes)=>Math.max(0,...targets.map(d=>best(a,d)))
 const threat=f=>Math.max(0,...own.map(d=>best(f,d)/Math.max(1,d.maxHp)))*(activeStatus(f)?.actionSuccessRate??1)
 return {actor,own,foes,allies,getSkill,predict,best,incoming,outgoing,threat,claims,reservedDamage,options}
}
function strike(c,skill,target) {
 const {actor,foes,reservedDamage}=c,p=c.predict(actor,skill,target)
 if(!(p.damage>0)||!(p.accuracy>0))return 0
 const remaining=Math.max(0,target.currentHp-(reservedDamage.get(target.id)??0))
 if(remaining<=0)return 0
 const useful=Math.min(remaining,p.damage),guaranteed=p.minDamage>=remaining&&p.accuracy>=.98
 let score=useful/Math.max(1,target.maxHp)*160*p.accuracy
 if(guaranteed)score+=105+Math.min(40,c.threat(target)*40)
 else if(p.damage>=remaining)score+=55*p.accuracy
 if(guaranteed&&foes.every(f=>f.id===target.id||(reservedDamage.get(f.id)??0)>=f.currentHp))score+=200
 score+=statusUtility(actor,skill,target,p.damage)
 // Breaking sleep/confusion on an otherwise idle opponent has a real cost.
 if(!guaranteed&&activeStatus(target)?.curesOnHit&&foes.some(f=>f.id!==target.id&&!activeStatus(f)?.curesOnHit))score-=12+(1-(activeStatus(target).actionSuccessRate??1))*30
 return Math.max(0,score-(skill.cooldown??0)*2)
}
function supporting(c,skill,target) {
 const effect=skill.효과,{actor}=c,claim=effect.kind+':'+(effect.statKey??effect.guard??effect.status??'')+':'+target.id
 if(c.claims.has(claim))return 0
 if(effect.targetSide==='enemy'&&(c.reservedDamage.get(target.id)??0)>=target.currentHp)return 0
 const danger=c.incoming(target),remainingTurns=Math.min(3,Math.max(1,Math.ceil(c.foes.reduce((n,f)=>n+f.currentHp,0)/Math.max(1,c.own.reduce((n,u)=>n+c.outgoing(u),0)))))
 switch(effect.kind){
 case 'heal':{
  if(!alive(target))return 0
  const heal=Math.min(target.maxHp-target.currentHp,c.options.estimateHealing?.(actor,skill,target)??target.maxHp*effect.healRatio)
  if(heal<=0)return 0
  const survival=target.currentHp<=danger&&target.currentHp+heal>danger?55:0
  return heal/Math.max(1,target.maxHp)*190+survival+(ratio(target)<.25?25:0)
 }
 case 'revive':return !target.isEgg&&target.currentHp<=0?85+Math.min(30,Math.max(target.attack,target.specialAttack)/Math.max(1,actor.attack)*15):0
 case 'status':{
  if(!canApplyStatus(target,effect.status))return 0
  const d=getStatusEffectDefinition(effect.status);if(!d)return 0
  const chance=(c.options.statusChance?.(actor,skill,target)??((effect.chance??90)/100*(target.isBoss?.5:1)))
  const dot=(d.endTurnDamageRatio??0)*160*(target.isBoss?.5:1)*Math.min(3,remainingTurns)
  const denial=(1-(d.actionSuccessRate??1))*(55+Math.min(30,c.threat(target)*40))
  return chance*(dot+denial+(effect.status==='화상'&&target.attack>target.specialAttack?18:0)+6)
 }
 case 'clear-status':{
  const d=activeStatus(target);if(!d)return 0
  return 25+(1-(d.actionSuccessRate??1))*65+(d.endTurnDamageRatio??0)*240+(target.statusEffect.type==='화상'&&target.attack>target.specialAttack?18:0)
 }
 case 'guard':{
  if(target.battleGuards?.[effect.guard]>0)return 0
  if(effect.guard==='status')return (activeStatus(target)?65:0)+(c.foes.some(f=>getCommandSkillNames(f,n=>c.getSkill(n,f)).some(n=>{const s=c.getSkill(n,f);return s?.상태이상||s?.효과?.kind==='status'}))?24:0)
  if(effect.guard==='stats')return Object.values(target.statModifiers??{}).some(m=>isStatModifierActive(m)&&m.multiplier<1)?60:0
  if(effect.guard==='endure')return danger>=target.currentHp&&target.currentHp>1?75:danger>target.currentHp*.6?35:0
  if(effect.guard==='taunt')return c.own.length>1&&ratio(target)>.55?Math.max(0,...c.own.filter(u=>u.id!==target.id).map(u=>c.incoming(u)/Math.max(1,u.currentHp)))*30:0
  const specific=c.foes.reduce((sum,f)=>sum+Math.max(0,...getCommandSkillNames(f,n=>c.getSkill(n,f)).map(n=>c.getSkill(n,f)).filter(s=>s&&!s.효과&&(s.분류==='특수형'?'special':'physical')===effect.guard&&getSkillCooldown(f,s)===0).map(s=>{const p=c.predict(f,s,target);return p.damage*p.accuracy})),0)
  return specific/Math.max(1,target.maxHp)*160+(specific>=target.currentHp?35:0)
 }
 case 'stat-modifier':{
  const key=effect.statKey,old=modifier(target,key)
  const raw=effect.multiplier??1,next=raw<1&&actor.id!==target.id&&(target.isBoss||target.rivalEncounter)?1-(1-raw)/2:raw,boost=next>1
  if(boost?old>=next:old<=next)return 0
  if(!boost&&(getDigimonPassive(target)?.blockStatDrops||target.battleGuards?.stats||hasAdventureItem(target,'crest-hope')))return 0
  if(key==='speed'){
   const opposed=boost?c.foes:c.own,thresholds=opposed.filter(u=>boost?target.speed<u.speed&&target.speed*next/old>=u.speed:target.speed>u.speed&&target.speed*next/old<=u.speed).length
   return thresholds?24*thresholds:0
  }
  const changed={...target,[key]:target[key]*next/old}
  if(boost){
   if(danger>=target.currentHp||remainingTurns<2)return 0
   const gain=['attack','specialAttack'].includes(key)?c.outgoing(changed)-c.outgoing(target):danger-c.incoming(changed)
   return Math.max(0,gain)/Math.max(1,c.foes[0]?.maxHp??target.maxHp)*160*Math.min(3,remainingTurns-1)
  }
  const gain=['attack','specialAttack'].includes(key)?c.own.reduce((n,u)=>n+c.best(target,u)-c.best(changed,u),0):c.own.reduce((n,u)=>n+c.best(u,changed)-c.best(u,target),0)
  return Math.max(0,gain)/Math.max(1,target.maxHp)*160*Math.min(3,remainingTurns)
 }
 case 'clear-stat-boosts':case 'clear-stat-drops':{
  const boosts=effect.kind==='clear-stat-boosts',mods=Object.entries(target.statModifiers??{}).filter(([,m])=>isStatModifierActive(m)&&(boosts?m.multiplier>1:m.multiplier<1))
  if(!mods.length)return 0
  const changed={...target};for(const[key,m]of mods)changed[key]=(changed[key]??0)/m.multiplier
  const gain=boosts?c.own.reduce((n,u)=>n+c.best(target,u)-c.best(changed,u)+c.best(u,changed)-c.best(u,target),0):c.outgoing(changed)-c.outgoing(target)+danger-c.incoming(changed)
  return Math.max(12,Math.max(0,gain)/Math.max(1,target.maxHp)*240)
 }
 default:return 0
 }
}
export function rankBattleCommands(actor,options) {
 if(!alive(actor))return []
 const c=context(actor,options),commands=[]
 for(const name of getCommandSkillNames(actor,n=>options.getSkill(n,actor))){
  const skill=options.getSkill(name,actor)
  if(!skill||getSkillCooldown(actor,skill)>0||options.allowSkill?.(skill)===false)continue
  const effect=skill.효과,isArea=area(skill)
  let pool=effect?(effect.scope==='self'?[actor]:effect.targetSide==='enemy'?c.foes:effect.kind==='revive'?c.allies.filter(u=>u&&!u.isEgg&&u.currentHp<=0):c.own):c.foes
  // Taunt redirects only single attacks, as in the actual battle resolver.
  if(!effect&&!isArea&&c.foes.some(u=>u.battleGuards?.taunt>0))pool=[c.foes.find(u=>u.battleGuards?.taunt>0)]
  const score=u=>effect?supporting(c,skill,u):strike(c,skill,u)
  if(isArea){
   if(pool.length)commands.push({skillName:name,targetId:pool[0].id,score:pool.reduce((n,u)=>n+score(u),0),skill,targets:pool})
  }else for(const target of pool)commands.push({skillName:name,targetId:target.id,score:score(target),skill,targets:[target]})
 }
 return commands.filter(c=>Number.isFinite(c.score)).sort((a,b)=>b.score-a.score)
}
export function chooseBattleCommand(actor,options) {
 const commands=rankBattleCommands(actor,options),best=commands[0]?.score??0
 if(!commands.length)return null
 const positive=commands.filter(c=>c.score>0&&c.score>=best*.995)
 const fallback=commands.filter(c=>!c.skill.효과)
 const choices=positive.length?positive:fallback.length?fallback:commands
 const random=options.random??Math.random
 return choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))]
}
export function planEnemyCommands(enemies,options) {
 const reservedDamage=new Map(),claims=new Map(),chosen=new Map()
 for(const actor of enemies.filter(alive).slice().sort((a,b)=>b.speed-a.speed)){
  const forced=options.forcedCommand?.(actor),command=forced??chooseBattleCommand(actor,{...options,allies:enemies,reservedDamage,claims,allowSkill:s=>options.allowSkill?.(actor,s)!==false})
  if(!command)continue
  chosen.set(actor.id,command)
  if(forced)continue
  for(const target of command.targets){
   const effect=command.skill.효과
   if(effect)claims.set(effect.kind+':'+(effect.statKey??effect.guard??effect.status??'')+':'+target.id,true)
   else{const p=options.estimateAttack(actor,command.skill,target);reservedDamage.set(target.id,(reservedDamage.get(target.id)??0)+Math.min(target.currentHp,p.minDamage)*p.accuracy)}
  }
 }
 return enemies.flatMap(actor=>chosen.has(actor.id)?[{actor,...chosen.get(actor.id)}]:[])
}
