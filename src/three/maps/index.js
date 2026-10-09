// Battle map registry: game map name -> environment module (src/three/maps/<slug>.js).
// Each module default-exports build(kit) and describes its place with the MapKit.
import { createMapKit } from './MapKit.js'

export const BATTLE_MAP_SLUGS = Object.freeze({
  '시작의마을': 'village-of-beginnings',
  '미하라시 산': 'mt-miharashi',
  '기어사바나': 'gear-savanna',
  '용의눈호수': 'dragon-eye-lake',
  '네트의 바다': 'net-ocean',
  '메탈 엠파이어': 'metal-empire',
  '나이트메어 솔저스': 'nightmare-soldiers',
  '비틀랜드': 'beetleland',
  '쓰레기의 산': 'trash-mountain',
  '지하 하수도': 'underground-sewer',
  '윈드 가디언즈': 'wind-guardians',
  '코덱 유적': 'codec-ruins',
  '아이스 생츄어리': 'ice-sanctuary',
  '무한산': 'infinity-mountain',
  '오버델 묘지': 'overdell-cemetery',
  '어셈블러 타워': 'assembler-tower',
  '부트 화산': 'boot-volcano',
  '이블 포레스트': 'evil-forest',
  '다크 웹': 'dark-web',
  '다크 에리어': 'dark-area',
  '코퀴토스': 'cocytus',
  '센트럴 타운': 'central-town',
  '어비스 에리어': 'abyss-area',
  '기어 포레스트': 'gear-forest',
  '팩토리얼 에리어': 'factorial-area',
  '코즈믹 에리어': 'cosmic-area',
  '가디언 팰리스': 'guardian-palace',
  '다크 필드': 'dark-field',
  '겐시 대륙': 'genshi-continent',
  '아시노 섬': 'ashino-island',
  '선공계': 'sengong-realm',
  '용정궁': 'dragon-palace',
  '사규산': 'sagyu-mountain',
  '황천': 'yomi',
})

export const DEFAULT_BATTLE_MAP = '시작의마을'

function seedFor(text) {
  let hash = 2166136261
  for (const char of text) hash = Math.imul(hash ^ char.codePointAt(0), 16777619)
  return hash >>> 0
}

export function getBattleMapSlug(name) {
  return BATTLE_MAP_SLUGS[name] ?? BATTLE_MAP_SLUGS[DEFAULT_BATTLE_MAP]
}

// Loads the module for a map (falls back to the generic field while a map is missing).
export async function loadBattleMapModule(name) {
  const slug = getBattleMapSlug(name)
  try {
    return { slug, module: await import(`./${slug}.js`) }
  } catch (error) {
    console.warn(`3D map "${name}" (${slug}) unavailable, using the fallback field`, error?.message)
    return { slug: 'fallback', module: await import('./fallback.js') }
  }
}

// Builds a map environment synchronously from an already loaded module.
export function buildBattleMap(module, slug) {
  const kit = createMapKit({ seed: seedFor(slug), name: slug })
  module.default(kit)
  const environment = kit.finish()
  environment.slug = slug
  return environment
}
