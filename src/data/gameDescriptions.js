// Keep descriptions tied to the same pools and recipes used by the game.
export function createDigiEggRewardItems(eggs, hatchStages) {
  return eggs.flatMap((egg, index) => {
    const hatchPool = egg.부화가능 ?? []
    if (!hatchPool.length) return []
    const hatchText = hatchPool.length === 1
      ? `${hatchPool[0]}으로 부화합니다.`
      : `${hatchPool.join(', ')} 중 한 마리로 부화합니다.`
    return [{
      // Preserve IDs because inventory saves refer to the original egg index.
      id: `digi-egg-${index + 1}`,
      name: `${egg.이름} 디지에그`,
      description: `파티에 넣고 ${hatchStages}개 스테이지를 클리어하면 ${hatchText}`,
      digiEggName: egg.이름,
      hatchPool,
      imageUrl: `/아이템/디지에그/${egg.이름}.png`,
    }]
  })
}

export function describeJogressRecipes(recipes) {
  return [
    '아래 조합의 모든 재료 디지몬을 하나로 합쳐 진화합니다.',
    '합체 재료의 레벨·육성 조건과 전용 진화 아이템을 확인합니다.',
    ...recipes.map(({ materials, targetName, level }) => `${materials.join(' + ')} → ${targetName}${level ? ` (재료 모두 Lv.${level} 이상)` : ''}`),
  ].join('\n')
}
