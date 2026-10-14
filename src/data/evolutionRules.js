import freeModeGroups from './freeModeChanges.json' with { type: 'json' }
// Evolution relationships follow the cited games/profiles in docs/evolution-rules.md.
// Levels and catalyst items are DigiRogue balancing choices, not official requirements.
import expansion from './rosterExpansion.json' with { type: 'json' }
import expansion2 from './rosterExpansion2.json' with { type: 'json' }
import expansion3 from './rosterExpansion3.json' with { type: 'json' }
import expansion4 from './rosterExpansion4.json' with { type: 'json' }
import expansion5 from './rosterExpansion5.json' with { type: 'json' }
import expansion6 from './rosterExpansion6.json' with { type: 'json' }
import expansion7 from './rosterExpansion7.json' with { type: 'json' }
import expansion8 from './rosterExpansion8.json' with { type: 'json' }
import { normalizeEvolutionItemRequirement } from './itemIdentity.js'
import spiritEvolution from './spiritEvolution.json' with { type: 'json' }
import adventureItemArt from './adventureItemArt.json' with { type: 'json' }
import evolutionItemArt from './evolutionItemArt.json' with { type: 'json' }
import normalEvolutionRequirements from './normalEvolutionRequirements.json' with { type: 'json' }
import itemArtworkOverrides from './itemArtworkOverrides.json' with { type: 'json' }
import treeConnections from './evolutionTreeConnections.json' with { type: 'json' }
import { isPlayableDigimon } from './speciesAvailability.js'
import { getDigimonTrainingStage } from './digimonStages.js'
import { ENDGAME_EVOLUTION_TUNING, resolveEvolutionInvestment } from './evolutionInvestment.js'
const freeModeTargets = Object.fromEntries(freeModeGroups.flatMap(group => group.map(source => [source, group.filter(target=>target!==source)])))
export const EVOLUTION_LEVELS = { 유아기: 1, 유년기: 2, 성장기: 4, 성숙기: 10, 완전체: 25, 궁극체: 45, 초궁극체: 65, 아머체: 10, 하이브리드체: 10 }

const levelOverrides = {
  ...expansion5.levels,
  ...expansion6.levels,
  ...expansion7.levels,
  ...expansion8.levels,
  ...treeConnections.levels,
  엔젤몬: 12, 데블몬: 12, 가트몬: 12, 블랙가트몬: 12,
  도루가몬: 12, 긴류우몬: 12, 바오헉몬: 12,
  스컬그레이몬: 28, 홀리엔젤몬: 28, 엔젤우몬: 28, 레이디데블몬: 28,
  도루그레몬: 28, 히샤류우몬: 28, 세이버헉몬: 28, '루체몬[폴다운]': 45,
  알파몬: 50, 오류우몬: 50, 제스몬: 50, 알포스브이드라몬: 50,
  세라피몬: 48, 오파니몬: 48, 리리스몬: 50, 마왕몬: 50, 벨페몬: 50,
  '알카디몬[초궁극체]': 65,
  ...Object.fromEntries(Object.entries(ENDGAME_EVOLUTION_TUNING).map(([name, rule]) => [name, rule.level])),
}

export const JOGRESS_RECIPES = [
  ...expansion.jogress,
  ...expansion3.jogress,
  ...expansion6.jogress,
  ...expansion7.jogress,
  ...expansion8.jogress,
  ...treeConnections.jogress,
  { targetName: '파일드라몬', materials: ['엑스브이몬', '스팅몬'], level: 25 },
  { targetName: '실피드몬', materials: ['아큐라몬', '가트몬'], level: 25 },
  { targetName: '마스테몬', materials: ['엔젤우몬', '레이디데블몬'], level: 50 },
  { targetName: '오메가몬', materials: ['워그레이몬', '메탈가루몬'], level: 65 },
  { targetName: '오메가몬[알터-S]', materials: ['블리츠그레이몬', '크레스가루몬'], level: 65 },
  { targetName: '오메가몬[즈왈트]', materials: ['블랙워그레이몬', '블랙메탈가루몬'], level: 65 },
  { targetName: '알파몬[왕룡검]', materials: ['알파몬', '오류우몬'], level: 65 },
  { targetName: '엑자몬', materials: ['슬레이어드라몬', '브레이크드라몬'], level: 65 },
  // Time Stranger's special evolution provides a documented alternative to mass Kuramon fusion.
  { targetName: '아마게몬', materials: ['디아블로몬', '인펠몬'], level: 65 },
].map(recipe => ({ ...recipe, level: ENDGAME_EVOLUTION_TUNING[recipe.targetName]?.level ?? recipe.level }))

// Keep existing item names/IDs so inventories from older saves remain usable.
const baseItemRequirements = {
  ...expansion.items,
  ...expansion4.items,
  ...expansion5.items,
  ...expansion6.items,
  '레이브몬[버스트]': { from: ['레이브몬'], itemName: '한지호의 디지바이스', rarity: 'rare', level: 60, method: '버스트 진화' },
  '로제몬[버스트]': { from: ['로제몬'], itemName: '유진의 디지바이스', rarity: 'rare', level: 60, method: '버스트 진화' },
  '루체몬[사탄]': { from: ['루체몬[폴다운]'], itemName: '게헤나', rarity: 'rare', level: 65, method: '모드 체인지' },
  '미라쥬가오가몬[버스트]': { from: ['미라쥬가오가몬'], itemName: '토마의 디지바이스', rarity: 'rare', level: 60, method: '버스트 진화' },
  '벨페몬[레이지]': { from: ['벨페몬'], itemName: '자명종', rarity: 'rare', level: 60, method: '모드 체인지' },
  '샤인그레이몬[버스트]': { from: ['샤인그레이몬'], itemName: '최건우의 디지바이스', rarity: 'rare', level: 60, method: '버스트 진화' },
  '오파니몬[폴다운]': { from: ['오파니몬'], itemName: '악의 근원', rarity: 'rare', level: 60, method: '모드 체인지' },
  '황제드라몬[파이터]': { from: ['파일드라몬'], itemName: '포지트론 레이저', rarity: 'rare', level: 60, method: '워프 진화' },
  '황제드라몬[팔라딘]': { from: ['황제드라몬[파이터]'], itemName: '오메가 블레이드', rarity: 'rogue', level: 70, method: '모드 체인지' },
  ...expansion7.items,
  ...expansion8.items,
  ...Object.fromEntries([['human',spiritEvolution.humans],['beast',spiritEvolution.beasts]].flatMap(([kind,forms])=>Object.entries(forms).map(([target,r])=>{const itemId=kind+'-spirit-'+r.element;return[target,{from:r.from,level:r.level,itemId,itemName:adventureItemArt[itemId].name,imageUrl:adventureItemArt[itemId].url,rarity:'good',itemCount:1,method:'스피릿 진화'}]}))),
}

// Retain inventory IDs when promoting catalysts or replacing their artwork.
const promotedItemRequirements = {
  ...Object.fromEntries(Object.entries(baseItemRequirements).map(([name, rule]) => [name,
    { ...rule, ...(ENDGAME_EVOLUTION_TUNING[name] ? { level: ENDGAME_EVOLUTION_TUNING[name].level,
      rarity: 'master', itemCount: ENDGAME_EVOLUTION_TUNING[name].itemCount } : {}) }])),
  ...Object.fromEntries(['얼티메이트카오스몬', '지드밀레니엄몬'].map(name => [name, {
    from: JOGRESS_RECIPES.find(recipe => recipe.targetName === name)?.materials ??
      ['밀레니엄몬'],
    itemName: '에보류터 · ' + name, itemId: 'item-evolution-investment-' + name,
    imageUrl: '/items/evolution/canonical/evoluter.png', rarity: 'master',
    level: ENDGAME_EVOLUTION_TUNING[name].level, itemCount: ENDGAME_EVOLUTION_TUNING[name].itemCount,
    method: name === '지드밀레니엄몬' ? '워프 진화' : '조그레스',
  }])),
}

// Former Evoluter item routes now use the same level and permanent stat checks as
// ordinary evolution. Keep their allowed ancestors explicit, including modes.
export const NORMAL_EVOLUTION_REQUIREMENTS = Object.freeze(normalEvolutionRequirements)
export const ITEM_EVOLUTION_REQUIREMENTS = Object.fromEntries(Object.entries(promotedItemRequirements)
  .filter(([target]) => !NORMAL_EVOLUTION_REQUIREMENTS[target])
  .map(([target, original]) => {
    const rule=normalizeEvolutionItemRequirement(original)
    const canonicalArt=Object.values(evolutionItemArt).find(a=>a.name===rule.itemName)
    if(canonicalArt)rule.imageUrl=canonicalArt.url
    const artwork = itemArtworkOverrides[rule.itemId ?? 'item-evolution-' + rule.itemName]
    return [target, { ...rule, ...(artwork ? { imageUrl: artwork.url, itemName: artwork.name ?? rule.itemName } : {}) }]
  }))

// Dedicated catalysts keep their own evolution route; the ordinary chip cannot
// substitute for them or offer those recipes in its reward selection.
export const JOGRESS_CHIP_RECIPES = JOGRESS_RECIPES.filter(recipe => !ITEM_EVOLUTION_REQUIREMENTS[recipe.targetName])

const modeChanges = {
  '샤인그레이몬[루인]': { from: ['샤인그레이몬'], level: 60, method: '모드 체인지' },
  '라센몬[격앙]': { from: ['라센몬'], level: 60, method: '모드 체인지' },
  ...expansion2.modes,
  ...expansion4.modes,
  ...expansion5.modes,
  ...expansion6.modes,
  ...expansion7.modes,
  ...expansion8.modes,
  ...treeConnections.modes,
}

// Explicit branches only. No shared-element/type generator: it would create unrelated families.
// Unlisted sources retain the game's existing branches, subject to the method guards below.
export const EVOLUTION_BRANCH_OVERRIDES = {
  아구몬: ['그레이몬', '지오그레이몬', '티라노몬', '메라몬', '스카몬'],
  팔몬: ['니드몬', '우드몬', '해바라기몬', '베지몬'],
  라라몬: ['해바라기몬', '니드몬', '우드몬'],
  텐타몬: ['캅테리몬', '쿠가몬', '말벌몬', '가드로몬'],
  추추몬: ['스팅몬', '말벌몬'],
  레나몬: ['구미호몬', '가루몬', '블랙가트몬', '우드몬', '토리에몬'],
  피요몬: ['버드라몬', '아큐라몬', '에어드라몬'],
  쿠다몬: ['레파몬', '엔젤몬'],
  와냐몬: ['가오몬', '에렉몬', '레나몬'],
  니드몬: ['릴리몬', '쥬레이몬', '펌프몬'],
  우드몬: ['쥬레이몬', '릴리몬', '펌프몬'],
  해바라기몬: ['라일라몬', '릴리몬', '펌프몬'],
  토리에몬: ['안티라몬'],
  레오몬: ['화이트레오몬', '워가루몬', '쥬드몬', '로더레오몬', '메탈그레이몬'],
  바오헉몬: ['세이버헉몬', '라이즈그레이몬', '로더레오몬'],
  그라우몬: ['메가로그라우몬', '메가드라몬', '메탈그레이몬'],
  메탈그레이몬: ['워그레이몬', '블리츠그레이몬', '러스트티라노몬'],
  쥬드몬: ['바이킹몬', '플레시오몬', '넵튠몬'],
  인펠몬: ['디아블로몬', '베르제브몬', '마왕몬'],
  펌프몬: ['노블펌프몬', '로제몬', '로터스몬', '피에몬'],
  로더레오몬: ['헤비레오몬', '메탈가루몬', '메탈에테몬'],
  // These transformations belong to their own base forms, not other Seven Great Demon Lords.
  리리스몬: [], 마왕몬: [], 반쵸릴리몬: [], 알포스브이드라몬: [],
  // The removed intermediate forms are not replaced with unrelated species.
  프린스콩알몬: [],
}

export function getEvolutionInvestment(name) {
  return resolveEvolutionInvestment(name, { item: ITEM_EVOLUTION_REQUIREMENTS[name],
    recipe: JOGRESS_RECIPES.find(recipe => recipe.targetName === name), mode: modeChanges[name] })
}

export function getEvolutionLevel(name, stage) {
  if (ENDGAME_EVOLUTION_TUNING[name]) return ENDGAME_EVOLUTION_TUNING[name].level
  return NORMAL_EVOLUTION_REQUIREMENTS[name]?.level ?? ITEM_EVOLUTION_REQUIREMENTS[name]?.level ?? modeChanges[name]?.level
    ?? JOGRESS_RECIPES.find(recipe => recipe.targetName === name)?.level
    ?? levelOverrides[name] ?? EVOLUTION_LEVELS[getDigimonTrainingStage(name, stage)] ?? 65
}

export function getEvolutionRoute(sourceName, targetName, targetStage) {
  if (!isPlayableDigimon(sourceName) || !isPlayableDigimon(targetName)) return null
  if (spiritEvolution.blockedBranches[sourceName]?.includes(targetName)) return null
  if (expansion7.retiredBranches?.[sourceName]?.includes(targetName)) return null
  const permittedParents = expansion8.exclusiveParents[targetName] ?? expansion7.exclusiveParents[targetName]
  if (permittedParents && !permittedParents.includes(sourceName)) return null
  if (freeModeTargets[sourceName]?.includes(targetName)) return { method: '모드 전환', kind: 'mode', level: 0, freeModeChange: true }
  const recipe = JOGRESS_RECIPES.find(entry => entry.targetName === targetName)
  if (recipe) return recipe.materials.includes(sourceName)
    ? { method: recipe.method ?? '조그레스', kind: 'jogress', level: recipe.level, recipe } : null
  const normal = NORMAL_EVOLUTION_REQUIREMENTS[targetName]
  if (normal) return normal.from.includes(sourceName)
    ? { method: '일반 진화', kind: 'level', level: normal.level } : null
  const special = ITEM_EVOLUTION_REQUIREMENTS[targetName] ?? modeChanges[targetName]
  if (special) return special.from.includes(sourceName)
    ? { method: special.method, kind: ITEM_EVOLUTION_REQUIREMENTS[targetName] ? 'item' : 'level', level: special.level } : null
  const warp = sourceName === '루체몬' && targetName === '루체몬[폴다운]'
  return { method: warp ? '워프 진화' : '일반 진화', kind: 'level', level: getEvolutionLevel(targetName, targetStage) }
}

export function getEvolutionTargets(raw) {
  const name = raw.이름
  const additional = [
    ...JOGRESS_RECIPES.filter(recipe => recipe.materials.includes(name)).map(recipe => recipe.targetName),
    ...Object.entries({ ...ITEM_EVOLUTION_REQUIREMENTS, ...NORMAL_EVOLUTION_REQUIREMENTS, ...modeChanges }).filter(([, rule]) => rule.from.includes(name)).map(([target]) => target),
  ]
  return [...new Set([...(EVOLUTION_BRANCH_OVERRIDES[name] ?? raw.진화가능 ?? []), ...(expansion.branches[name] ?? []), ...(expansion2.branches[name] ?? []), ...(expansion3.branches[name] ?? []), ...(expansion4.branches[name] ?? []), ...(expansion5.branches[name] ?? []), ...(expansion6.branches[name] ?? []), ...(expansion7.branches[name] ?? []), ...(expansion8.branches[name] ?? []), ...(treeConnections.branches[name] ?? []), ...(freeModeTargets[name] ?? []), ...additional])]
    .filter(target => target !== name && getEvolutionRoute(name, target))
}

export function getEvolutionTreeBranches(name, lookup) {
  const data = lookup.get(name)
  return (data?.진화가능 ?? []).flatMap(targetName => {
    const target = lookup.get(targetName)
    const route = target && getEvolutionRoute(name, targetName, target.stage)
    return route ? [{ name: targetName, stage: target.stage, ...route }] : []
  })
}
