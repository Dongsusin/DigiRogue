import { JOGRESS_RECIPES } from './evolutionRules.js'

// Combinations use existing evolution routes and assets. HP/action gates and
// temporary bonuses are authored fan-game rules, not official requirements.
const fusion = (target, themes, minStage, maxStage = 199) => {
  const recipe = JOGRESS_RECIPES.find(entry => entry.targetName === target)
  if (!recipe || recipe.materials.length !== 2) throw Error(`Invalid rival fusion: ${target}`)
  return { id: `fusion-${target}`, kind: 'rival', variant: true, name: recipe.materials[0],
    line: [recipe.materials[0], target], formation: recipe.materials, themes, minStage, maxStage,
    method: recipe.method ?? '조그레스', atHp: .55, atActions: 3, fusion: true,
    effect: { clearStatus: true }, title: '야생 라이벌', emblem: '라이벌' }
}
const change = (id, from, to, themes, minStage, maxStage, method, extra = {}) => ({
  id, kind: 'rival', variant: true, name: from, line: [from, to], themes, minStage, maxStage,
  method, atHp: .5, atActions: 3, title: '야생 라이벌', emblem: '라이벌', effect: {}, ...extra,
})
const burst = (id, from, themes, stats) => change(id, from, `${from}[버스트]`, themes, 115, 199,
  '버스트 진화', { atHp: .45, effect: { clearStatus: true, stats, turns: 3 } })

export const RIVAL_VARIANTS = Object.freeze([
  {...fusion('그레이스노바몬',['holy','ancient'],155),maps:['코즈믹 에리어','선공계','용정궁']},
  {...fusion('볼토바우타몬',['dark'],135),maps:['나이트메어 솔저스','다크 에리어','황천']},
  {...fusion('카오스몬',['machine','dark'],135),maps:['메탈 엠파이어','어셈블러 타워','다크 필드']},
  {...fusion('제트메르바몬',['holy','wind'],135),maps:['윈드 가디언즈','선공계','가디언 팰리스']},
  {...change('imperial-dragon-mode','황제드라몬[드래곤]','황제드라몬[파이터]',['ancient','water'],115,199,'모드 전환'),maps:['용정궁','겐시 대륙','아시노 섬']},
  {...change('jupiter-wrath','유피테르몬','유피테르몬[래스 모드]',['holy'],155,199,'래스 모드 각성'),maps:['선공계','가디언 팰리스','코즈믹 에리어']},
  fusion('샤우트몬[X2]', ['fire', 'machine', 'town'], 15, 55),
  fusion('샤우트몬[X3]', ['earth', 'fire', 'wind'], 35, 95),
  fusion('샤우트몬[X4]', ['holy', 'town', 'wind'], 35, 95),
  fusion('메탈그레이몬[크로스워즈]', ['machine', 'fire', 'network'], 35, 95),
  fusion('메탈그레이몬[사이버런처]', ['machine', 'network', 'dark'], 65, 135),
  fusion('파일드라몬', ['water', 'forest', 'town', 'earth'], 35, 95),
  fusion('실피드몬', ['wind', 'holy', 'forest'], 35, 95),
  fusion('마스테몬', ['holy', 'dark', 'network'], 75),
  fusion('오메가몬', ['holy', 'town', 'ancient', 'ice'], 115),
  fusion('오메가몬[알터-S]', ['machine', 'fire', 'wind'], 115),
  fusion('오메가몬[즈왈트]', ['dark', 'network', 'waste'], 115),
  fusion('스사노오몬', ['holy', 'ancient', 'fire'], 135),
  fusion('밀레니엄몬', ['dark', 'ancient', 'machine'], 135),
  fusion('알파몬[왕룡검]', ['holy', 'ancient', 'earth'], 135),
  fusion('엑자몬', ['ancient', 'wind', 'earth', 'water'], 135),
  fusion('아마게몬', ['network', 'dark', 'waste'], 135),
  change('armor-fire', '브이몬', '화염드라몬', ['fire', 'earth', 'town'], 15, 35, '아머 진화', { atHp: .6, atActions: 2 }),
  change('armor-thunder', '브이몬', '번개드라몬', ['machine', 'wind', 'town'], 15, 35, '아머 진화', { atHp: .6, atActions: 2 }),
  change('dark-skull', '그레이몬', '스컬그레이몬', ['dark', 'waste', 'fire'], 35, 75, '암흑 진화',
    { atHp: .35, condition: { kind: 'hits', category: '물리형', count: 2 }, effect: { stats: { attack: 1.15, defense: .85 }, turns: 3 } }),
  change('ice-lion', '레오몬', '화이트레오몬', ['ice', 'earth', 'wind'], 35, 75, '진화', { atHp: .55 }),
  burst('burst-shine', '샤인그레이몬', ['fire', 'holy', 'earth'], { attack: 1.12 }),
  burst('burst-mirage', '미라쥬가오가몬', ['wind', 'ice', 'machine'], { speed: 1.12 }),
  burst('burst-rose', '로제몬', ['forest', 'holy', 'town'], { specialAttack: 1.12 }),
  burst('burst-raven', '레이브몬', ['wind', 'forest', 'dark'], { speed: 1.12 }),
  change('sleeping-rage', '벨페몬', '벨페몬[레이지]', ['dark', 'waste'], 115, 199, '각성',
    { atHp: .6, effect: { clearStatus: true, stats: { attack: 1.12 }, turns: 3 } }),
  change('raging-spiral', '라센몬', '라센몬[격앙]', ['network', 'earth', 'ancient'], 115, 199, '모드 체인지',
    { condition: { kind: 'critical' }, effect: { clearStatus: true, stats: { speed: 1.12 }, turns: 3 } }),
  change('ruin-flames', '샤인그레이몬', '샤인그레이몬[루인]', ['dark', 'fire', 'waste'], 115, 199, '모드 체인지',
    { atHp: .35, effect: { stats: { specialAttack: 1.15, specialDefense: .9 }, turns: 3 } }),
  change('paladin-awake', '황제드라몬[파이터]', '황제드라몬[팔라딘]', ['holy', 'ancient', 'water'], 155, 199, '모드 체인지',
    { atHp: .4, effect: { clearStatus: true, guards: { special: 1 } } }),
])
