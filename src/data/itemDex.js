import { hasDiscoveredItem } from '../progression/itemCollection.js'
import { ITEM_RARITIES } from './itemRarities.js'

const rarityOrder = new Map(ITEM_RARITIES.map((rarity, index) => [rarity.key, index]))

// Read the same definitions and rarity resolver as rewards. Shared evolution
// items have several target entries, so retain every distinct description.
export function buildItemDex(items, getRarity = item => item.rarity ?? 'common') {
  const entries = new Map()
  for (const item of items) {
    if (!item?.id) continue
    const existing = entries.get(item.id)
    if (existing) {
      if (item.description && !existing.descriptions.includes(item.description)) existing.descriptions.push(item.description)
      continue
    }
    const resolved = getRarity(item)
    entries.set(item.id, { id: item.id, name: item.name, imageUrl: item.imageUrl,
      rarity: rarityOrder.has(resolved) ? resolved : 'common',
      descriptions: item.description ? [item.description] : [],
      kind: item.battleItemKey && item.evolutionTargets?.length ? '장착 · 진화' : item.digiEggName ? '디지에그' : item.evolutionItemFor || item.jogressRecipes ? '진화' :
        item.cardCode ? '카드' : item.consumable ? '소비' :
        item.battleItemKey || item.typeUpKey || item.attributeUpKey || item.digicloneKey || item.recoveryProgramKey ? '장착' :
        item.buffStatKey ? '능력 강화' : '모험',
      limit: item.maxOwnedPerCombatant ? '디지몬당 최대 ' + item.maxOwnedPerCombatant + '개' :
        item.maxOwned ? '최대 보유 ' + item.maxOwned + '개' : item.unique ? '최대 보유 1개' : '',
    })
  }
  return [...entries.values()].map(({ descriptions, ...entry }) => ({ ...entry, description: descriptions.join("\n\n") }))
    .sort((a, b) => rarityOrder.get(a.rarity) - rarityOrder.get(b.rarity))
}

export function filterItemDex(catalog, rarity, query = '', collection) {
  const term = query.replace(/\s/g, '').toLocaleLowerCase('ko-KR')
  return catalog.filter(item => item.rarity === rarity &&
    (!term || (collection === undefined || hasDiscoveredItem(collection, item.id)) && item.name.replace(/\s/g, '').toLocaleLowerCase('ko-KR').includes(term)))
}

export function getItemDexDisplay(item, collection) {
  return hasDiscoveredItem(collection, item.id) ? { ...item, known: true } : {
    id: item.id, rarity: item.rarity, known: false, name: '?', imageUrl: '', description: '', kind: '', limit: '',
  }
}
