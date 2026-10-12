import { getDigimonStageRank } from '../data/digimonStages.js'
import { DIGIMON_MODELS, missingRequiredClips } from '../data/digimonModels.js'
import { REGION_STAT_KEYS, mergeRegionStatModifier } from './regionModifiers.js'
import { FINAL_BOSS_PROFILES } from '../data/finalBossProfiles.js'

const profiles = new Map(FINAL_BOSS_PROFILES.map(profile => [profile.id, profile]))
const living = unit => unit && !unit.isEgg && unit.currentHp > 0
export function getFinalBossMove(unit) {
  const plan = unit?.bossEncounter
  const profile = unit?.isBoss && plan?.kind === 'final' && plan.leader !== false ? profiles.get(plan.id) : null
  if (!profile) return null
  const cycle = profile.cycles[Math.min(plan.phase ?? 0, profile.cycles.length - 1)]
  return cycle[Math.max(0, plan.actions ?? 0) % cycle.length]
}

export function getFinalBossSkillData(skillName, unit) {
  const move = getFinalBossMove(unit)
  return move?.skill.기술명 === skillName ? move.skill : null
}

export function getFinalBossTarget(unit, opponents = []) {
  const mode = getFinalBossMove(unit)?.target
  if (!mode) return null
  const targets = opponents.filter(living)
  return [...targets].sort(mode === 'weakest'
    ? (a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp
    : (a, b) => Math.max(b.attack, b.specialAttack) - Math.max(a.attack, a.specialAttack))[0]?.id ?? null
}

export function resolveFinalBossBeforeAction(enemies, actorId, refreshStats) {
  const unit = enemies.find(enemy => enemy.id === actorId)
  const profile = living(unit) && unit.bossEncounter?.leader !== false ? profiles.get(unit.bossEncounter?.id) : null
  const plan = unit?.bossEncounter
  const child = profile?.brood && (plan.actions ?? 0) >= 3 && !plan.broodUsed
    ? enemies.find(enemy => plan.companionIds.includes(enemy.id)) : null
  if (!child || living(child)) return { nextEnemies: enemies, changes: [], battleLogs: [] }
  const revived = refreshStats({ ...child, currentHp: Math.max(1, Math.floor(child.maxHp * .35)), statusEffect: null,
    battleGuards: {}, statModifiers: {}, skillCooldowns: {}, bossEncounter: child.bossEncounter })
  const nextUnit = { ...unit, bossEncounter: { ...plan, broodUsed: true } }
  const battleLogs = ['아마게몬의 데이터에서 쿠라몬이 한 번 더 증식했다!']
  return { nextEnemies: enemies.map(enemy => enemy.id === actorId ? nextUnit : enemy.id === child.id ? revived : enemy),
    changes: [{ targetId: child.id, targetSide: 'enemy', kind: 'reinforce', label: '쿠라몬 재증식',
      actionActorId: actorId, consumesAction: true, nextCombatant: revived, logs: battleLogs }], battleLogs }
}

// One source of truth for finite drain/reinforcement and the next-action warning.
// Called only after an action actually executed. No timers, no reserve-party effects.
export function resolveFinalBossAfterAction(enemies, context) {
  const changes = [], battleLogs = []
  const nextEnemies = enemies
  if (context.actorSide !== 'enemy' || context.didAct === false) return { nextEnemies, changes, battleLogs }
  let unit = enemies.find(enemy => enemy.id === context.actorId)
  const profile = living(unit) && unit.bossEncounter?.leader !== false ? profiles.get(unit.bossEncounter?.id) : null
  if (!profile) return { nextEnemies, changes, battleLogs }
  const plan = unit.bossEncounter
  const cycle = profile.cycles[Math.min(context.phaseBefore ?? plan.phase ?? 0, profile.cycles.length - 1)]
  const previousMove = cycle[(context.actionsBefore ?? Math.max(0, (plan.actions ?? 1) - 1)) % cycle.length]
  const emit = (target, kind, label, logs) => {
    changes.push({ targetId: target.id, targetSide: 'enemy', kind, label, nextCombatant: target, logs })
    battleLogs.push(...logs)
  }
  const hits = (context.hitEffects ?? []).filter(hit => hit.attackerId === unit.id && hit.targetSide === 'ally' && hit.damage > 0 && hit.kind !== 'status')
  if (profile.drainSkill && hits.some(hit => hit.skillName === profile.drainSkill) && (plan.drainUses ?? 0) < 2 && unit.currentHp < unit.maxHp) {
    const stolen = Math.min(Math.floor(unit.maxHp * .05), Math.floor(hits.reduce((sum, hit) => sum + hit.damage, 0) * .25))
    const healed = Math.max(0, Math.min(stolen, unit.maxHp - unit.currentHp))
    if (healed > 0) {
      unit = { ...unit, currentHp: unit.currentHp + healed, bossEncounter: { ...unit.bossEncounter, drainUses: (plan.drainUses ?? 0) + 1 } }
      emit(unit, 'power', '소울 앱소브션', [`${unit.name}이(가) 흡수한 데이터로 HP ${healed} 회복!`])
    }
  }
  // A form change can replace the cycle during the same action; its old warning is obsolete.
  if (!context.isPatternAction && previousMove.tell && (context.phaseBefore == null || context.phaseBefore === plan.phase))
    emit(unit, 'power', previousMove.skill.기술명, [previousMove.tell])
  return { nextEnemies: nextEnemies.map(enemy => enemy.id === unit.id ? unit : enemy), changes, battleLogs }
}

// Phase effects operate on the authoritative battle roster; presentation receives the same snapshots.
export const ROYAL_KNIGHT_NAMES = Object.freeze(['오메가몬', '듀크몬', '알파몬', '매그너몬', '듀나스몬',
  '로드나이트몬', '크레니엄몬', '슬레이프몬', '알포스브이드라몬', '엑자몬', '간쿠몬', '제스몬', '두프트몬'])
export function resolveFinalBossPatterns({ enemies, party = [], activeAllyIds = [], changes = [] },
  { speciesLookup, returnEvolution, createCombatant, refreshStats, isPlayable }) {
  let nextEnemies = [...enemies], nextParty = [...party]
  const nextChanges = [], battleLogs = [], phaseChanges = changes.map(change => ({ ...change }))
  const emit = (unit, side, kind, label, logs, extra = {}) => {
    nextChanges.push({targetId:unit.id,targetSide:side,kind,label,nextCombatant:unit,logs,...extra})
    battleLogs.push(...logs)
  }
  for (const change of phaseChanges) {
    if (!change.pattern || !change.consumesAction) continue
    let boss = nextEnemies.find(u => u.id === change.actionActorId)
    if (!living(boss) || !profiles.has(boss.bossEncounter?.id)) continue
    const kind = change.pattern.kind
    const active = nextParty.filter(u => activeAllyIds.includes(u.id) && living(u) && !u.regionalSupport)
    if (kind === 'devolve') for (const ally of active) {
      const history = ally.evolutionHistory ?? []
      const current = speciesLookup.get(ally.name)
      // Prefer the actual route. Directly selected evolved starters use a legal incoming link.
      const previous = history.at(-1) ?? [...speciesLookup.values()].filter(data =>
        data.진화가능?.includes(ally.name) && isPlayable(data) && getDigimonStageRank(data.stage) < getDigimonStageRank(current?.stage))
        .sort((a,b) => getDigimonStageRank(b.stage) - getDigimonStageRank(a.stage))[0]?.이름
      const returned = previous ? returnEvolution({...ally,evolutionHistory:history.length?history:[previous]}) : ally
      if (returned.name === ally.name) { battleLogs.push(ally.name + '은(는) 더 퇴화하지 않았다!'); continue }
      const next = refreshStats({...returned,battleMap:ally.battleMap,battleAnomaly:ally.battleAnomaly,
        battleGuards:{...ally.battleGuards},skillCooldowns:{...ally.skillCooldowns}})
      nextParty = nextParty.map(u => u.id === ally.id ? next : u)
      emit(next,'ally','devolve','데스 에볼루션',[ally.name + ' → ' + next.name + ' · 강제 퇴화!'])
    }
    if (kind === 'royal-knight' && nextEnemies.length < 2) {
      const candidates = ROYAL_KNIGHT_NAMES.filter(name => speciesLookup.has(name) && DIGIMON_MODELS[name] &&
        !missingRequiredClips(DIGIMON_MODELS[name].clips).length)
      const id = boss.id + '-royal-knight'
      if (candidates.length && !nextEnemies.some(u => u.id === id)) {
        const name = candidates[Math.floor(Math.random()*candidates.length)]
        let knight = createCombatant({id,name,data:speciesLookup.get(name),level:boss.level})
        knight = refreshStats({...knight,isBoss:false,enemyStage:boss.enemyStage ?? boss.bossStage,
          enemyGameMode:boss.enemyGameMode,battleMap:boss.battleMap,battleAnomaly:boss.battleAnomaly,
          bossEncounter:{...boss.bossEncounter,leader:false,royalKnight:true,initialName:name,
            phases:[],rules:[],phase:0,actions:0,usedRules:[],companionIds:[boss.id],segmentCount:1},
          bossHpMarkers:[],bossHpBreakpoints:[],bossHpSegmentCount:1})
        knight = {...knight,currentHp:knight.maxHp}
        nextEnemies = [...nextEnemies.filter(u=>u.id!==id),knight]
        boss = {...boss,bossEncounter:{...boss.bossEncounter,companionIds:[...(boss.bossEncounter.companionIds??[]),id]}}
        emit(knight,'enemy','reinforce','로열나이츠 소환',[boss.name + '의 명령으로 ' + name + '이(가) 나타났다!'],{insertCombatant:true})
      }
    }
    if (kind === 'absorb-brood') {
      const child = nextEnemies.find(u=>boss.bossEncounter.companionIds?.includes(u.id)&&living(u))
      boss = {...boss,bossEncounter:{...boss.bossEncounter,broodUsed:true}}
      if (child) {
        nextEnemies = nextEnemies.filter(u=>u.id!==child.id)
        boss = {...boss,currentHp:Math.min(boss.maxHp,boss.currentHp+Math.max(1,Math.floor(boss.maxHp*.1))),
          bossEncounter:{...boss.bossEncounter,companionIds:[]}}
        emit(boss,'enemy','power','증식체 융합',['쿠라몬의 데이터를 흡수해 아마게몬이 HP를 회복했다!'],{consumedIds:[child.id]})
      }
    }
    if (kind === 'steal-boosts' || kind === 'purge-boosts') {
      const stolen = {}, purge = kind === 'purge-boosts'
      for (const ally of active) {
        const modifiers = {...ally.statModifiers}
        let changed = false
        for (const key of REGION_STAT_KEYS) if (modifiers[key]?.multiplier > 1) {
          stolen[key] = Math.max(stolen[key]??1,Math.min(1.25,modifiers[key].multiplier));modifiers[key]=null;changed=true
        }
        const guards = {...ally.battleGuards}
        if (purge) for (const key of ['physical','special','status','stats','endure']) if (guards[key]>0) {guards[key]=0;changed=true}
        if (changed) {
          const next = refreshStats({...ally,battleGuards:guards},{statModifiers:modifiers,preserveMaxHpDelta:true})
          nextParty=nextParty.map(u=>u.id===ally.id?next:u)
          emit(next,'ally','power',change.label,[ally.name + (purge?'의 강화와 방벽 데이터가 분해됐다!':'의 강화 데이터를 빼앗겼다!')])
        }
      }
      if (!purge && Object.keys(stolen).length) {
        const modifiers={...boss.statModifiers}
        for (const [key,value] of Object.entries(stolen)) modifiers[key]=mergeRegionStatModifier(modifiers[key],value)
        boss=refreshStats(boss,{statModifiers:modifiers,preserveMaxHpDelta:true})
      }
    }
    nextEnemies=nextEnemies.map(u=>u.id===boss.id?boss:u)
    // The phase event must not later overwrite the post-effect boss snapshot.
    change.nextCombatant=boss
  }
  return {nextEnemies,nextParty,changes:[...phaseChanges,...nextChanges],battleLogs}
}
