// DigiRogue investment rewards and requirements, not official numerical rankings.
// Original form names, skills and combat identities remain unchanged.
const apex = (level, skillPower, stats) => ({
  level, skillPower, stats, itemCount: 1,
})
export const ENDGAME_EVOLUTION_TUNING = Object.freeze({
  '알파몬[왕룡검]': apex(95, { '왕룡검': 210, '성검 그레이달파': 195 }, ['attack', 'specialAttack', 'specialDefense']),
  '오메가몬[알터-B]': apex(95, { '그레이 캐논': 205 }, ['specialAttack', 'hp', 'defense']),
  '오메가몬[즈왈트-D]': apex(95, { '그레이 소드': 210 }, ['attack', 'speed', 'hp']),
  '황제드라몬[팔라딘]': apex(105, { '오메가 블레이드': 225 }, ['attack', 'speed', 'specialDefense']),
  '오메가몬[X항체]': apex(110, { '올 딜리트': 235 }, ['attack', 'specialAttack', 'speed']),
  '오메가몬[머시풀]': apex(110, { '우령도': 230 }, ['attack', 'specialAttack', 'specialDefense']),
  '오그도몬': apex(120, { '오라티오 ･ 그란디오로크아': 225, '카테드랄': 195, '그라두스': 210 }, ['hp', 'specialAttack', 'specialDefense']),
  '얼티메이트카오스몬': apex(120, { '브로큰 디스트로이': 220, '얼티마 버스트': 235 }, ['attack', 'specialAttack', 'hp']),
  '지드밀레니엄몬': apex(120, { '타임 디스트로이어': 245 }, ['hp', 'specialAttack', 'specialDefense']),
})

// Route rewards compare equivalent native profiles; they do not replace stage/lore budgets.
// Pure stat evolutions and itemless form changes have no resource premium.
const ITEM_REWARDS = Object.freeze({
  good:   { statBonus: .14, skillMultiplier: 1.10, trainingMultiplier: 1.08 },
  rare:   { statBonus: .18, skillMultiplier: 1.12, trainingMultiplier: 1.12 },
  rogue:  { statBonus: .22, skillMultiplier: 1.15, trainingMultiplier: 1.16 },
  master: { statBonus: .28, skillMultiplier: 1.18, trainingMultiplier: 1.20 },
})

export function resolveEvolutionInvestment(name, { item, recipe } = {}) {
  const specific = ENDGAME_EVOLUTION_TUNING[name]
  const count = recipe?.materials?.length ?? 0
  const common = { level: specific?.level, stats: specific?.stats, itemCount: 1 }
  if (item) {
    const reward = ITEM_REWARDS[item.rarity] ?? ITEM_REWARDS.good
    const compound = Math.min(2, Math.max(0, count - 1)) * .02
    return { ...common, ...reward, route: 'item',
      statBonus: Number((reward.statBonus + compound).toFixed(2)),
      trainingMultiplier: Number((reward.trainingMultiplier + compound).toFixed(2)),
      // Named apex attacks belong to these forms, never the shared skill catalog.
      ...(item.rarity === 'master' && specific ? { skillPower: specific.skillPower } : {}) }
  }
  if (count >= 2) {
    const tier = Math.min(2, count - 2)
    return { ...common, route: 'jogress', statBonus: [.08, .10, .12][tier],
      skillMultiplier: [1.04, 1.06, 1.08][tier], trainingMultiplier: [1.04, 1.06, 1.08][tier] }
  }
  return { ...common, route: 'level', statBonus: 0, skillMultiplier: 1, trainingMultiplier: 1 }
}
