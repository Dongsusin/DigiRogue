// DigiRogue investment rewards and requirements, not official numerical rankings.
// Original form names, skills and combat identities remain unchanged.
const apex = (level, statBonus, skillPower, stats) => ({
  level, statBonus, skillMultiplier: 1.2, skillPower, stats, trainingMultiplier: 1.18, itemCount: 1, rarity: 'master',
})
export const ENDGAME_EVOLUTION_TUNING = Object.freeze({
  '알파몬[왕룡검]': apex(95, .20, { '왕룡검': 210, '성검 그레이달파': 195 }, ['attack', 'specialAttack', 'specialDefense']),
  '오메가몬[알터-B]': apex(95, .20, { '그레이 캐논': 205 }, ['specialAttack', 'hp', 'defense']),
  '오메가몬[즈왈트-D]': apex(95, .20, { '그레이 소드': 210 }, ['attack', 'speed', 'hp']),
  '황제드라몬[팔라딘]': apex(105, .24, { '오메가 블레이드': 225 }, ['attack', 'speed', 'specialDefense']),
  '오메가몬[X항체]': apex(110, .26, { '올 딜리트': 235 }, ['attack', 'specialAttack', 'speed']),
  '오메가몬[머시풀]': apex(110, .27, { '우령도': 230 }, ['attack', 'specialAttack', 'specialDefense']),
  '오그도몬': { ...apex(120, .25, { '오라티오 ･ 그란디오로크아': 225, '카테드랄': 195, '그라두스': 210 }, ['hp', 'specialAttack', 'specialDefense']), trainingMultiplier: 1.25 },
  '얼티메이트카오스몬': { ...apex(120, .25, { '브로큰 디스트로이': 220, '얼티마 버스트': 235 }, ['attack', 'specialAttack', 'hp']), trainingMultiplier: 1.25 },
  '지드밀레니엄몬': { ...apex(120, .28, { '타임 디스트로이어': 245 }, ['hp', 'specialAttack', 'specialDefense'], 3), trainingMultiplier: 1.25 },
})

export function resolveEvolutionInvestment(name, { item, recipe, mode } = {}) {
  const specific = ENDGAME_EVOLUTION_TUNING[name]
  if (specific) return specific
  const count = recipe?.materials?.length ?? 0
  // Multiple trained partners and a second-stage catalyst earn a greater return.
  const tier = count >= 3 ? 3 : count >= 2 ? 2 : item?.rarity === 'rogue' || item?.rarity === 'master' ? 3 : item ? 1 : mode ? 1 : 0
  return { statBonus: [0, .04, .08, .12][tier], skillMultiplier: [1, 1.04, 1.08, 1.12][tier],
    trainingMultiplier: [1, 1.03, 1.06, 1.10][tier], itemCount: item?.itemCount ?? 1 }
}
