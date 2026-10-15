// Stable saved rarity keys. Integer weights are normalized before luck promotions.
// Calibrated with itemLuck.js for SS final odds: 50% / 26% / 15% / 8% / 1%.
export const ITEM_RARITIES = Object.freeze([
  { key: 'common', label: '기본', weight: 6000 },
  { key: 'good', label: '일반', weight: 1620 },
  { key: 'rare', label: '희귀', weight: 895 },
  { key: 'rogue', label: '로그', weight: 476 },
  { key: 'master', label: '마스터', weight: 9 },
].map(Object.freeze))

export const getItemRarityLabel = key => ITEM_RARITIES.find(rarity => rarity.key === key)?.label ?? '기본'
