import { isStatModifierActive } from '../battle/regionModifiers.js'
import spiritEvolution from './spiritEvolution.json' with { type: 'json' }
import art from './adventureItemArt.json' with { type: 'json' }

const equipped = (id, description, rarity = 'good') => {
  const evolutionTargets = Object.entries({ ...spiritEvolution.humans, ...spiritEvolution.beasts }).filter(([,r])=>id===(Object.values(spiritEvolution.humans).includes(r)?'human':'beast')+'-spirit-'+r.element).map(([name])=>name)
  return { id, name: art[id].name, description: description + (evolutionTargets.length ? '\n진화창에서 '+evolutionTargets.join(' / ')+' 진화에 사용할 수 있습니다. 사용 시 장착한 스피릿 1개가 소모됩니다.' : ''),
    imageUrl: art[id].url, battleItemKey: id, maxOwnedPerCombatant: 1, rarity, ...(evolutionTargets.length?{evolutionTargets}:{}) }
}

export const ADVENTURE_BATTLE_ITEMS = [
  equipped('human-spirit-fire', '화염 기술로 주는 피해가 12% 증가합니다.'),
  equipped('human-spirit-light', '빛 기술로 주는 피해가 12% 증가합니다.'),
  equipped('human-spirit-ice', '얼음 기술로 주는 피해가 12% 증가합니다.'),
  equipped('human-spirit-wind', '바람 기술로 주는 피해가 12% 증가합니다.'),
  equipped('human-spirit-water', '회복 기술로 받는 HP 회복량이 15% 증가합니다.'),
  equipped('human-spirit-dark', '어둠 기술로 주는 피해가 12% 증가합니다.'),
  equipped('d-ark-ultimate', '주는 물리·특수 공격 피해가 50% 증가합니다.', 'master'),
  equipped('digivice-v', '받는 물리·특수 공격 피해를 35% 줄입니다.', 'master'),
  equipped('xros-loader', '승리 후 생존한 장착 디지몬의 최대 HP 25% 추가 회복 · 기술로 받는 회복량 50% 증가. 예비 파티에도 적용됩니다.', 'master'),
  equipped('steel-claw', '물리 기술로 공격할 때 상대의 방어 상승분을 절반만 적용합니다. 방어 하락과 특수방어에는 영향을 주지 않습니다.'),
  { ...equipped('d-3', '아머체일 때 주는 공격 피해가 15% 증가합니다.'), requiredStage: '아머체' },
  equipped('d-ark', '전투 승리 후 생존한 장착 디지몬의 최대 HP 5%를 추가로 회복합니다. 예비 파티에도 적용됩니다.'),
  equipped('digivice-burst', '보스·중간보스에게 주는 공격 피해가 12% 증가합니다.', 'rare'),
  equipped('crest-courage', 'HP가 1/3 이하일 때 주는 공격 피해가 25% 증가합니다.'),
  equipped('crest-friendship', '다른 아군 한 마리를 회복하는 기술의 회복량이 30% 증가합니다. 자신·전체 회복에는 적용되지 않습니다.'),
  equipped('crest-love', '아군 전체를 회복하는 기술의 회복량이 25% 증가합니다.'),
  equipped('crest-knowledge', '기술의 상태이상 부여 확률이 15%p 증가합니다. 보스의 상태이상 저항은 이후 적용됩니다.', 'rare'),
  equipped('crest-purity', '독·맹독·화상의 턴 종료 피해를 50% 줄입니다.'),
  equipped('crest-sincerity', 'HP가 가득 차 있을 때 받는 공격 피해를 30% 줄입니다.'),
  equipped('crest-hope', '상대 기술로 인한 능력치 하락을 막습니다. 이미 걸린 하락은 해제하지 않습니다.', 'rare'),
  equipped('crest-light', '약점 공격을 받을 때 상성 배율 중 1배를 넘는 부분을 절반으로 줄입니다. 2배 약점은 1.5배가 됩니다.'),
  equipped('crest-kindness', '유아기·유년기·성장기일 때 받는 전투 경험치가 30% 증가합니다. 예비 파티에도 적용됩니다.'),
  equipped('crest-miracles', '치명타 피해 배율이 1.5배에서 1.8배로 증가합니다. 치명타 확률은 변하지 않습니다.', 'rare'),
  equipped('crest-fate', '받는 치명타의 피해 배율을 1.15배로 제한합니다.', 'rare'),
  equipped('beast-spirit-fire', '물리 공격 피해가 18% 증가하지만 특수 공격 피해는 10% 감소합니다.'),
  equipped('beast-spirit-light', '특수 공격 피해가 18% 증가하지만 물리 공격 피해는 10% 감소합니다.'),
  equipped('beast-spirit-ice', '기술로 능력치가 내려간 상대에게 주는 공격 피해가 20% 증가합니다.'),
  equipped('beast-spirit-wind', '적 전체 공격의 피해가 20% 증가하지만 단일 대상 공격의 피해는 10% 감소합니다.'),
  equipped('beast-spirit-thunder', '상대보다 현재 스피드가 높으면 주는 공격 피해가 15% 증가합니다.'),
  equipped('beast-spirit-earth', '자신보다 현재 스피드가 높은 상대에게 받는 공격 피해를 15% 줄입니다.'),
  equipped('beast-spirit-steel', '받는 물리 공격 피해를 12% 줄이지만 특수 공격 피해는 5% 증가합니다.'),
  equipped('beast-spirit-water', '받는 특수 공격 피해를 12% 줄이지만 물리 공격 피해는 5% 증가합니다.'),
  equipped('beast-spirit-wood', '회복 기술로 받는 HP 회복량이 25% 증가합니다. 회복 아이템·부활에는 적용되지 않습니다.'),
  equipped('beast-spirit-dark', '상태이상에 걸린 상대에게 주는 공격 피해가 20% 증가합니다.'),
]

export const ADVENTURE_UTILITY_ITEMS = [
  { id: 'd-scanner', description: '블루 카드의 기본 데이터 수집량을 40% 높입니다. 실제 스캔율 증가량은 디지몬별로 다릅니다.', rarity: 'good' },
  { id: 'd-terminal', description: '보상 아이템 새로고침에 필요한 골드를 20% 줄입니다.', rarity: 'good' },
  { id: 'digivice-ic', description: '디지에그에서 부화하는 디지몬의 레벨을 3 높입니다. 파티의 기존 알에도 적용되며 스캔 데이터 부화에는 적용되지 않습니다.', rarity: 'rare' },
].map(item => ({ ...item, name: art[item.id].name, imageUrl: art[item.id].url, maxOwned: 1, unique: true }))

const supply = (id, description, effect, rarity = 'good', maxOwned = 6) => ({
  id, name: art[id].name, imageUrl: art[id].url, description, effect, rarity,
  consumable: true, maxOwned, itemForm: 'supply',
})

export const ADVENTURE_CONSUMABLES = [
  supply('food-fried-potato', '아군 한 마리의 최대 HP 20% 회복 · 기술과 공용 재사용 대기시간 1행동 단축.', { heal: .2, cooldownReduction: 1 }, 'common', 8),
  supply('food-hamburger', '아군 한 마리의 최대 HP 35% 회복 · 기술과 공용 재사용 대기시간 1행동 단축.', { heal: .35, cooldownReduction: 1 }),
  supply('food-chicken-combo', '아군 한 마리의 최대 HP 40% 회복 · 기술과 공용 재사용 대기시간 2행동 단축.', { heal: .4, cooldownReduction: 2 }, 'rare', 4),
  supply('food-pepperoni-pizza', '아군 한 마리의 최대 HP 55% 회복 · 기술과 공용 재사용 대기시간 1행동 단축.', { heal: .55, cooldownReduction: 1 }, 'rare', 3),
  supply('food-meat-pizza', '아군 한 마리의 최대 HP 25% 회복 · 기술과 공용 재사용 대기시간 3행동 단축.', { heal: .25, cooldownReduction: 3 }, 'rare', 3),
  supply('charge-digisoul', '아군 한 마리의 기술과 공용 재사용 대기시간을 3행동 줄입니다. HP는 회복하지 않습니다.', { cooldownReduction: 3 }, 'rare', 4),
  supply('energy-pill-a', '아군 한 마리의 능력치 하락 해제 · 기술과 공용 재사용 대기시간 1행동 단축. 상태이상은 치료하지 않습니다.', { clearDebuffs: true, cooldownReduction: 1 }),
]

export const getItemVictoryRecoverySources = unit => [
  { id: 'd-ark', ratio: .05 }, { id: 'xros-loader', ratio: .25 },
].filter(item => hasAdventureItem(unit, item.id)).map(item => ({ ...item, name: art[item.id].name }))
export const getItemVictoryRecoveryBonus = unit => getItemVictoryRecoverySources(unit).reduce((total, item) => total + item.ratio, 0)

const equippedIds = new Set(ADVENTURE_BATTLE_ITEMS.map(item => item.id))
export const hasAdventureItem = (unit, id) => equippedIds.has(id) && Number(unit?.battleItems?.[id]) > 0
export const getItemScanGain = (inventory, base = 25) => base + (inventory?.['d-scanner'] > 0 ? 10 : 0)
export const getItemHatchLevel = (inventory, base) => base + (inventory?.['digivice-ic'] > 0 ? 3 : 0)
export const getItemRerollDiscount = inventory => inventory?.['d-terminal'] > 0 ? 0.8 : 1
export const getItemExperienceMultiplier = unit => hasAdventureItem(unit, 'crest-kindness') &&
  ['유아기', '유년기', '성장기'].includes(unit?.speciesStage) ? 1.3 : 1
export const getItemStatusChance = (actor, chance) => Math.min(100, Math.max(0, chance) +
  (hasAdventureItem(actor, 'crest-knowledge') ? 15 : 0))
export const getItemStatusDamageMultiplier = unit => hasAdventureItem(unit, 'crest-purity') ? 0.5 : 1

export function getItemHealingMultiplier(actor, target, scope) {
  let multiplier = hasAdventureItem(target, 'beast-spirit-wood') ? 1.25 : 1
  if (hasAdventureItem(target, 'human-spirit-water')) multiplier *= 1.15
  if (hasAdventureItem(target, 'xros-loader')) multiplier *= 1.5
  if (scope === 'all' && hasAdventureItem(actor, 'crest-love')) multiplier *= 1.25
  if (scope !== 'all' && actor?.id !== target?.id && hasAdventureItem(actor, 'crest-friendship')) multiplier *= 1.3
  return multiplier
}

// These modifiers are used by the actual attack resolver, so the damage number,
// HP update and log all describe the same hit. Stacking has explicit bounds.
export function getAdventureAttackModifiers({ attacker, defender, skillData, matchup, isCritical, baseCritical = 1.5 }) {
  const attackItems = [], defenseItems = []
  let attack = 1, defense = 1, critical = isCritical ? baseCritical : 1
  const modify = (unit, id, factor, defending = false) => {
    if (!hasAdventureItem(unit, id) || factor === 1) return
    if (defending) { defense *= factor; defenseItems.push(art[id].name) }
    else { attack *= factor; attackItems.push(art[id].name) }
  }
  const physical = skillData.분류 !== '특수형'
  const defenseBoost = defender.statModifiers?.defense
  modify(attacker, 'd-ark-ultimate', 1.5)
  modify(defender, 'digivice-v', .65, true)
  modify(attacker, 'steel-claw', physical && isStatModifierActive(defenseBoost) && defenseBoost.multiplier > 1
    ? defenseBoost.multiplier / (1 + (defenseBoost.multiplier - 1) / 2) : 1)
  modify(attacker, 'd-3', attacker.speciesStage === '아머체' ? 1.15 : 1)
  modify(attacker, 'digivice-burst', defender.isBoss || defender.rivalEncounter ? 1.12 : 1)
  modify(attacker, 'crest-courage', attacker.currentHp <= attacker.maxHp / 3 ? 1.25 : 1)
  modify(attacker, 'beast-spirit-fire', physical ? 1.18 : 0.9)
  modify(attacker, 'beast-spirit-light', physical ? 0.9 : 1.18)
  for (const [element, attribute] of Object.entries({fire:'화염',light:'빛',ice:'얼음',wind:'바람',dark:'어둠'}))
    if (skillData.속성 === attribute) modify(attacker, 'human-spirit-' + element, 1.12)
  modify(attacker, 'beast-spirit-wind', skillData.전체공격 === true ? 1.2 : 0.9)
  modify(attacker, 'beast-spirit-thunder', attacker.speed > defender.speed ? 1.15 : 1)
  modify(attacker, 'beast-spirit-ice', Object.values(defender.statModifiers ?? {}).some(value => isStatModifierActive(value) && value.multiplier < 1) ? 1.2 : 1)
  modify(attacker, 'beast-spirit-dark', defender.statusEffect ? 1.2 : 1)
  modify(defender, 'crest-sincerity', defender.currentHp === defender.maxHp ? 0.7 : 1, true)
  modify(defender, 'crest-light', matchup > 1 ? (1 + (matchup - 1) / 2) / matchup : 1, true)
  modify(defender, 'beast-spirit-earth', defender.speed < attacker.speed ? 0.85 : 1, true)
  modify(defender, 'beast-spirit-steel', physical ? 0.88 : 1.05, true)
  modify(defender, 'beast-spirit-water', physical ? 1.05 : 0.88, true)
  if (isCritical && hasAdventureItem(attacker, 'crest-miracles')) { critical = 1.8; attackItems.push(art['crest-miracles'].name) }
  if (isCritical && hasAdventureItem(defender, 'crest-fate')) { critical = Math.min(critical, 1.15); defenseItems.push(art['crest-fate'].name) }
  return { multiplier: Math.min(1.65, attack) * Math.max(0.55, defense), criticalMultiplier: critical,
    battleLogs: [
      ...(attackItems.length ? [`${attacker.name}의 장비 효과: ${attackItems.join(' · ')}`] : []),
      ...(defenseItems.length ? [`${defender.name}의 장비 효과: ${defenseItems.join(' · ')}`] : []),
    ] }
}
