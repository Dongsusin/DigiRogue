// Ten-stage bands retain the existing evolution pacing. Every source of levels
// uses this same cap, including items, hatching, and legacy run restoration.
export const STAGE_LEVEL_CAPS = Object.freeze([
  14, 22, 32, 42, 52, 62, 72, 82, 92, 102, 112, 122, 132, 142, 152, 162, 172, 182, 192, 200,
])
const stageOf = stage => Math.min(200, Math.max(1, Math.floor(Number(stage) || 1)))
export const getStageLevelCap = (stage, mode = 'classic') => mode === 'endless' ? Infinity : STAGE_LEVEL_CAPS[Math.floor((stageOf(stage) - 1) / 10)]

export const isAtLevelCap = (level, cap) => Number.isFinite(Number(level)) &&
  Number.isFinite(Number(cap)) && Number(cap) > 0 && Number(level) >= Number(cap)

export function getStageEnemyLevelRange(stage, mode = 'classic') {
  if (mode === 'endless' && stage > 200) {
    const band = Math.floor((stage - 1) / 10)
    const ceiling = 200 + (band - 19) * 14
    return [ceiling - 13, ceiling]
  }
  const safeStage = stageOf(stage), band = Math.floor((safeStage - 1) / 10)
  return [band === 0 ? 3 : Math.floor(STAGE_LEVEL_CAPS[band - 1] * .88), Math.max(3, STAGE_LEVEL_CAPS[band] - (band < 5 ? 4 : 2))]
}

export function getEnemyDifficultyModifiers(combatant) {
  if (combatant?.specialQuest && combatant?.enemyStage) {
    const stage = stageOf(combatant.enemyStage)
    return { hp: 1.6 + stage * .002, stats: 1.1 + stage * .0005 }
  }
  if (combatant?.isBoss) {
    const stage = stageOf(combatant.bossStage ?? combatant.enemyStage ?? 10)
    return { hp: 1.42 + stage * .0024, stats: 1.01 + stage * .0005 }
  }
  if (!combatant?.enemyStage) return { hp: 1, stats: 1 }
  const progress = (stageOf(combatant.enemyStage) - 1) / 199
  if (combatant.rivalEncounter) return { hp: (combatant.enemyStage < 20 ? 1.1 : 1.2) + progress * .3, stats: 1.02 + progress * .1 }
  return { hp: 1.08 + progress * .18, stats: 1.01 + progress * .09 }
}

export function enforceCombatantLevelCap(combatant, cap, refresh) {
  if (!combatant || combatant.isEgg || combatant.level <= cap) return combatant
  const next = refresh(combatant, { level: cap })
  return { ...next,
    currentHp: combatant.currentHp <= 0 ? 0 : Math.max(1, Math.min(next.maxHp, Math.round(next.maxHp * combatant.currentHp / Math.max(1, combatant.maxHp)))),
    experience: Math.min(Math.max(0, combatant.experience ?? 0), Math.max(0, next.experienceToNext - 1)),
  }
}

// Late caps must be reachable through ordinary battles, including a rotated party.
export function getAdventureExperienceMultiplier(stage) {
  const progress = (stageOf(stage) - 1) / 199
  return 1.4 + progress * .9
}

// Exceptional forms remain powerful, but cannot roll as ordinary early wildlife.
// The map pool still decides identity. This ceiling only controls encounter timing.
export function getWildPowerCeiling(stage) {
  const s = stageOf(stage)
  return s <= 10 ? 440 : s <= 20 ? 560 : s <= 30 ? 640 : s <= 40 ? 730 : s <= 50 ? 800
    : s <= 70 ? 870 : s <= 90 ? 940 : s <= 130 ? 1000 : s <= 170 ? 1060 : 1130
}

export function pickWildEncounterNames(pool, speciesLookup, count, stage, random = Math.random) {
  const ceiling = getWildPowerCeiling(stage)
  const all = [...new Set(pool)].filter(name => speciesLookup.has(name))
  const timed = all.filter(name => speciesLookup.get(name).전투총합 <= ceiling)
  const candidates = timed.length ? timed : all.sort((a, b) => speciesLookup.get(a).전투총합 - speciesLookup.get(b).전투총합).slice(0, 2)
  const chosen = []
  while (chosen.length < count && candidates.length) {
    const weights = candidates.map(name => Math.max(.08, (1 - Math.max(0, speciesLookup.get(name).전투총합 - ceiling * .8) / (ceiling * .25)) ** 2))
    let roll = random() * weights.reduce((sum, value) => sum + value, 0)
    let index = weights.length - 1
    for (let i = 0; i < weights.length; i++) { roll -= weights[i]; if (roll < 0) { index = i; break } }
    chosen.push(candidates.splice(index, 1)[0])
  }
  return chosen
}
