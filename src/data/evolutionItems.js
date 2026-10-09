import { ITEM_EVOLUTION_REQUIREMENTS } from './evolutionRules.js'
// Shared IDs and artwork keep story rewards and the evolution UI identical.
export const ITEM_EVOLUTION_REWARD_ITEMS = Object.entries(ITEM_EVOLUTION_REQUIREMENTS).map(([targetName, requirement]) => ({
  id: requirement.itemId ?? 'item-evolution-' + requirement.itemName, name: requirement.itemName,
  description: requirement.from.join(' 또는 ') + ' Lv.' + requirement.level + ' 이상일 때 ' + targetName + '(으)로 ' + requirement.method + '합니다. 진화창에서 사용하며 1개를 소모합니다.',
  evolutionItemFor: targetName, rarity: requirement.rarity,
  imageUrl: requirement.imageUrl ?? '/아이템/진화/' + requirement.itemName + '.png',
}))
export const EVOLUTION_ITEM_LOOKUP = new Map(ITEM_EVOLUTION_REWARD_ITEMS.map(item => [item.id, item]))
