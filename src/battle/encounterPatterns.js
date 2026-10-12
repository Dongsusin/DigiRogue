import { DIGIMON_MODELS, missingRequiredClips } from '../data/digimonModels.js'
const living = unit => unit && !unit.isEgg && unit.currentHp > 0
// Only the finite native strike selected by a non-final encounter may drain.
// Equipment and passives still resolve first; a miss/immunity/guarded zero hit heals nothing.
export function applyEncounterDrain(attacker, skill, damage) {
  if (!skill?.encounterDrain || skill.encounterSpecies !== attacker.name ||
    !attacker.bossEncounter || attacker.bossEncounter.kind === 'final' || (attacker.bossEncounter.leader === false && !attacker.isBoss && !attacker.rivalEncounter) || !living(attacker))
    return { nextAttacker: attacker, battleLogs: [] }
  const healed = Math.max(0, Math.min(attacker.maxHp - attacker.currentHp,
    Math.max(0, attacker.bossEncounter.encounterDrainBudget ?? 0), Math.floor(damage * .25)))
  return { nextAttacker: healed ? { ...attacker, currentHp: attacker.currentHp + healed, bossEncounter: { ...attacker.bossEncounter,
      encounterDrainBudget: attacker.bossEncounter.encounterDrainBudget - healed } } : attacker,
    battleLogs: healed ? [attacker.name + '이(가) 데이터를 흡수해 HP ' + healed + ' 회복!'] : [] }
}

// Reuse the existing boss-change insertion cue. Reinforcements have no boss
// script, no HP segments and no queued action until the next turn.
export function resolveEncounterPatterns({ enemies, party = [], changes = [] },
  { speciesLookup, createCombatant, refreshStats }) {
  let nextEnemies = [...enemies]
  const nextChanges = changes.map(change => ({ ...change })), battleLogs = []
  for (const change of nextChanges.slice()) {
    if (change.pattern?.kind !== 'encounter-summon' || !change.consumesAction) continue
    let boss = nextEnemies.find(unit => unit.id === change.actionActorId)
    const name = change.pattern.species, model = DIGIMON_MODELS[name]
    if (!living(boss) || boss.bossEncounter?.kind === 'final' || boss.bossEncounter?.leader === false ||
      nextEnemies.filter(living).length >= 2 || !speciesLookup.has(name) || !model || missingRequiredClips(model.clips).length) continue
    const id = boss.id + '-pattern-reinforcement'
    if (nextEnemies.some(unit => unit.id === id)) continue
    let reinforcement = createCombatant({ id, name, data: speciesLookup.get(name), level: Math.max(1, Math.floor(boss.level * .75)) })
    reinforcement = refreshStats({ ...reinforcement, isBoss: false,
      enemyStage: boss.enemyStage ?? boss.bossStage, enemyGameMode: boss.enemyGameMode,
      battleMap: boss.battleMap, battleAnomaly: boss.battleAnomaly })
    reinforcement = { ...reinforcement, currentHp: reinforcement.maxHp }
    const retiredIds = nextEnemies.filter(unit => unit.id !== boss.id && !living(unit)).map(unit => unit.id)
    boss = { ...boss, bossEncounter: { ...boss.bossEncounter,
      companionIds: [...new Set([...(boss.bossEncounter.companionIds ?? []), id])] } }
    nextEnemies = [...nextEnemies.filter(unit => !retiredIds.includes(unit.id)).map(unit => unit.id === boss.id ? boss : unit), reinforcement]
    change.nextCombatant = boss
    const logs = [boss.name + '의 데이터에서 ' + name + '이(가) 나타났다!']
    nextChanges.push({ targetId: id, targetSide: 'enemy', kind: 'reinforce', label: change.label,
      nextCombatant: reinforcement, insertCombatant: true, consumedIds: retiredIds, logs })
    battleLogs.push(...logs)
  }
  return { nextEnemies, nextParty: party, changes: nextChanges, battleLogs }
}
