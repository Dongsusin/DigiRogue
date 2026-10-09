// Stored rarity keys remain stable; only the player-facing good label changes.
export const ITEM_RARITIES = Object.freeze([
  { key: 'common', label: '기본', weight: 75 },
  { key: 'good', label: '일반', weight: 18 },
  { key: 'rare', label: '희귀', weight: 4 },
  { key: 'rogue', label: '로그', weight: 2.9 },
  { key: 'master', label: '마스터', weight: .1 },
].map(Object.freeze))

export const getItemRarityLabel = key => ITEM_RARITIES.find(rarity => rarity.key === key)?.label ?? '기본'
