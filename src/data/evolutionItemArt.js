import art from './evolutionItemArt.json' with { type: 'json' }

// Unaltered franchise artwork. The source and file hash are recorded per image.
export const EVOLUTION_ITEM_ART = Object.freeze(art)
const byName = new Map(Object.values(art).map(entry => [entry.name, entry]))

// Keep the original inventory keys when correcting a displayed item name.
const LEGACY_ITEM_NAMES = Object.freeze({
  '빛의 디지멘탈 · 가트몬': '친절의 디지멘탈 · 가트몬',
  '황금의 디지멘탈': '기적의 디지멘탈 · 골드브이드라몬',
  '불꽃의 스피릿': '불꽃의 휴먼 스피릿',
  '빛의 스피릿': '빛의 휴먼 스피릿',
  '블랑의 각성 인장': '에보류터 · 시스터몬 블랑',
  '느와르의 각성 인장': '에보류터 · 시스터몬 느와르',
  '시엘의 각성 인장': '에보류터 · 시스터몬 시엘',
  '엄도의 인장': '에보류터 · 가이오몬',
  '크림슨 윙': '그라니',
  '용기의 유대': '라스트 에볼루션 · 용기',
  '우정의 유대': '라스트 에볼루션 · 우정',
  '자비의 빛': '그레이도',
  '블랙 디지트론': '블랙 디지트론 · 샘플 B',
  '파괴의 인장': 'D 안티바이러스 B',
})

export function getEvolutionItemArtUrl(itemName) {
  const entry = byName.get(itemName) ?? byName.get(itemName.split(' · ')[0])
  if (!entry) throw new Error(`Missing canonical evolution item artwork: ${itemName}`)
  return entry.url
}

export function getCanonicalEvolutionItem(originalName) {
  const itemName = originalName.endsWith('의 X항체')
    ? `X항체 인자 · ${originalName.slice(0, -5)}`
    : LEGACY_ITEM_NAMES[originalName] ?? originalName
  return {
    itemName,
    ...(itemName !== originalName ? { itemId: `item-evolution-${originalName}` } : {}),
    imageUrl: getEvolutionItemArtUrl(itemName),
  }
}
