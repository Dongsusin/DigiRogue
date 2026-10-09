// Cinematic direction for evolution scenes. Everything here is an original, procedural
// re-staging of well-known anime evolution choreography; no footage or artwork is bundled.
import { getEvolutionRoute, ITEM_EVOLUTION_REQUIREMENTS } from './evolutionRules.js'
import { getDigimonProfile } from './evolutionPossibility.js'
import { EXPANSION_EVOLUTION_SIGNATURES } from './expansionEvolutionCinematics.js'
import { ROSTER_4_EVOLUTION_SIGNATURES } from './rosterExpansion4Cinematics.js'
import { ROSTER_5_EVOLUTION_SIGNATURES } from './rosterExpansion5Cinematics.js'
import { ROSTER_6_EVOLUTION_SIGNATURES } from './rosterExpansion6Cinematics.js'

export const EVOLUTION_STYLE_OPTIONS = ['classic', 'rumble']
export const EVOLUTION_STYLE_LABELS = { classic: '기본', rumble: '슈퍼럼블' }

// Every template shares one beat structure so audio, captions and skipping stay uniform.
export const CINEMATIC_TEMPLATES = {
  adventure: { duration: 9000, charge: 1300, transform: 4300, reveal: 5600, complete: 7900, backdrop: 'stripes', callout: '진화' },
  warp: { duration: 10400, charge: 1300, transform: 5600, reveal: 6900, complete: 9200, backdrop: 'stripes', callout: '워프 진화' },
  jogress: { duration: 10400, charge: 1500, transform: 5600, reveal: 6900, complete: 9200, backdrop: 'helix', callout: '조그레스 진화' },
  xros: { duration: 9600, charge: 1200, transform: 4600, reveal: 6000, complete: 8400, backdrop: 'blueprint', callout: '디지크로스' },
  armor: { duration: 9600, charge: 1500, transform: 4900, reveal: 6100, complete: 8500, backdrop: 'stripes', callout: '아머 진화' },
  matrix: { duration: 10000, charge: 1300, transform: 5200, reveal: 6500, complete: 8800, backdrop: 'grid', callout: '매트릭스 진화' },
  card: { duration: 9000, charge: 1300, transform: 4400, reveal: 5700, complete: 7900, backdrop: 'grid', callout: '진화' },
  spirit: { duration: 9600, charge: 1300, transform: 4900, reveal: 6200, complete: 8500, backdrop: 'code', callout: '스피릿 에볼루션' },
  burst: { duration: 9600, charge: 1300, transform: 4900, reveal: 6200, complete: 8500, backdrop: 'sun', callout: '진화' },
  radiant: { duration: 9600, charge: 1300, transform: 4900, reveal: 6200, complete: 8500, backdrop: 'heaven', callout: '진화' },
  dark: { duration: 9600, charge: 1300, transform: 4900, reveal: 6200, complete: 8500, backdrop: 'void', callout: '진화' },
  // X진화: the X-antibody rewrites the data; 모드 체인지: the armour reassembles in a crystal forge.
  xantibody: { duration: 9600, charge: 1300, transform: 4900, reveal: 6200, complete: 8500, backdrop: 'glitch', callout: 'X 진화' },
  mode: { duration: 9600, charge: 1300, transform: 4900, reveal: 6200, complete: 8500, backdrop: 'prism', callout: '모드 체인지' },
  // Royal Knights: a ring of holy blades descends in a cathedral of light.
  royal: { duration: 9800, charge: 1300, transform: 5100, reveal: 6400, complete: 8700, backdrop: 'cathedral', callout: '진화' },
  // Four Sovereigns: elemental orbs circle the beast beneath a celestial dial.
  sovereign: { duration: 9600, charge: 1300, transform: 4900, reveal: 6200, complete: 8500, backdrop: 'celestial', callout: '진화' },
}

const PALETTES = {
  courage: ['#ff7a1a', '#ffd25a', '#ff3b1f'],
  friendship: ['#3fa8ff', '#bfe8ff', '#1d5bff'],
  love: ['#ff4f7d', '#ffc0d0', '#d81b4a'],
  knowledge: ['#b07bff', '#e3d0ff', '#6b3bd6'],
  sincerity: ['#5fd16a', '#d6ffd0', '#1f8f39'],
  reliability: ['#7a8cff', '#d6dcff', '#3346c4'],
  hope: ['#ffe45a', '#fffbd0', '#ffb300'],
  light: ['#ffb6e6', '#fff5fb', '#ff6fc6'],
  kindness: ['#c48bff', '#f1e2ff', '#8a4bff'],
  miracles: ['#ffcf3a', '#fff1b3', '#ff9900'],
  destiny: ['#3dd7ff', '#d6fbff', '#0b8bd1'],
  hazard: ['#ff2a2a', '#ffffff', '#ffc94a'],
  gargo: ['#5ce06a', '#e9ffe9', '#1f9d4a'],
  fox: ['#ffd54f', '#fff6d6', '#ff8f00'],
  savers: ['#ff8a1a', '#ffe6a6', '#ff3d00'],
  saversBlue: ['#38b6ff', '#e0f6ff', '#1565ff'],
  saversRose: ['#ff5c9a', '#ffe0ee', '#c2185b'],
  saversRaven: ['#6c8cff', '#e7ecff', '#2f3fb8'],
  fire: ['#ff6a00', '#ffd27a', '#ff2a00'],
  lightSpirit: ['#ffffff', '#cfe8ff', '#7ab8ff'],
  holy: ['#fff2b0', '#ffffff', '#ffd36b'],
  dark: ['#a020f0', '#ff2a4f', '#16001f'],
  omega: ['#ff8a1a', '#ffffff', '#3fa8ff'],
  blackOmega: ['#4d4d6a', '#ff2a4f', '#101018'],
  data: ['#67e8ff', '#ffe1a0', '#2bb5ff'],
  xantibody: ['#39ff7a', '#e2ffe9', '#06361a'],
  mercy: ['#ffe9a8', '#ffffff', '#c9a33a'],
  paladin: ['#ffd36b', '#fff7dc', '#3d6bff'],
  sister: ['#9fd8ff', '#ffffff', '#4a7bd6'],
  sisterNoir: ['#b07bff', '#f0e6ff', '#2a145c'],
  blade: ['#ff5a3a', '#ffe0c0', '#5c1a10'],
  rage: ['#ff3355', '#ffd0d8', '#2a0010'],
  // Royal Knights
  alpha: ['#ffd36b', '#fff6dc', '#14141e'], cranium: ['#c9c9e6', '#ffffff', '#3d3d66'], rhodo: ['#ff8ab5', '#fff0f6', '#5c1a33'],
  jes: ['#e8ecff', '#ffffff', '#5a6a9a'], sleip: ['#ff4a3b', '#ffe0dc', '#3a0a0a'],
  // Seven Demon Lords
  envy: ['#2affc0', '#dcfff4', '#00241a'], gluttony: ['#ffaa2a', '#fff0d0', '#2a1400'], sloth: ['#8a7bff', '#e6e2ff', '#120a2e'],
  lust: ['#d24bff', '#f6dcff', '#24002e'], wrath: ['#ff2a2a', '#ffd0c0', '#1a0000'],
  // Four Sovereigns
  seiryu: ['#3fb5ff', '#d8f4ff', '#0a2a6b'], suzaku: ['#ff6a2a', '#ffe0b0', '#6b1200'], byakko: ['#dfe8ff', '#ffffff', '#4a5a78'],
  genbu: ['#3ad6a0', '#d6fff0', '#0a3d33'], qilin: ['#ffd36b', '#fff6dc', '#6b4a00'],
  // Elements and families
  sea: ['#2fb7ff', '#d6f6ff', '#032a52'], deepSea: ['#5a8bff', '#cfe0ff', '#020c2e'], machine: ['#4dc3ff', '#e0f7ff', '#06213d'],
  machineRed: ['#ff6a3a', '#ffe6d6', '#06213d'], plant: ['#7ee06a', '#f3ffe0', '#1d4d16'], flower: ['#ff7ab8', '#ffe6f2', '#3d1a2e'],
  storm: ['#5fb0ff', '#e6f3ff', '#0a1a3d'], beast: ['#ffb84a', '#fff1d6', '#4a2a06'], olympos: ['#ffe39a', '#ffffff', '#3a4f9a'],
}

const DIGIMENTALS = [
  [/용기/, 'courage', '불타오르는 용기'], [/우정/, 'friendship', '폭풍을 부르는 우정'],
  [/기적/, 'miracles', '빛나는 기적'], [/희망/, 'hope', '하늘을 나는 희망'],
  [/빛/, 'light', '미소 짓는 빛'], [/친절/, 'kindness', '다정한 친절'],
  [/사랑/, 'love', '아름다운 사랑'], [/운명/, 'destiny', '이어지는 운명'],
]

// Curated anime signature scenes, keyed by the evolved form.
const SIGNATURES = {
  // Digimon Adventure: the partners' evolution banks.
  그레이몬: { template: 'adventure', palette: 'courage' },
  메탈그레이몬: { template: 'adventure', palette: 'courage', armor: true, callout: '초진화' },
  워그레이몬: { template: 'warp', palette: 'courage', armor: true, shield: true, subtitle: '용기의 문장' },
  가루몬: { template: 'adventure', palette: 'friendship' },
  워가루몬: { template: 'adventure', palette: 'friendship', callout: '초진화' },
  메탈가루몬: { template: 'warp', palette: 'friendship', armor: true, subtitle: '우정의 문장' },
  버드라몬: { template: 'adventure', palette: 'love' },
  가루다몬: { template: 'adventure', palette: 'love', callout: '초진화' },
  페닉스몬: { template: 'warp', palette: 'love', subtitle: '사랑의 문장' },
  캅테리몬: { template: 'adventure', palette: 'knowledge' },
  아트라캅테리몬: { template: 'adventure', palette: 'knowledge', callout: '초진화' },
  헤라클레스캅테리몬: { template: 'warp', palette: 'knowledge', armor: true, subtitle: '지식의 문장' },
  릴리몬: { template: 'adventure', palette: 'sincerity', callout: '초진화' },
  엔젤몬: { template: 'radiant', palette: 'hope', wings: 6 },
  홀리엔젤몬: { template: 'radiant', palette: 'hope', wings: 8, callout: '초진화' },
  세라피몬: { template: 'radiant', palette: 'hope', wings: 10, callout: '워프 진화', subtitle: '희망의 문장' },
  가트몬: { template: 'adventure', palette: 'light' },
  엔젤우몬: { template: 'radiant', palette: 'light', wings: 8, callout: '초진화' },
  오파니몬: { template: 'radiant', palette: 'light', wings: 10, callout: '워프 진화', subtitle: '빛의 문장' },
  스컬그레이몬: { template: 'dark', palette: 'dark', callout: '암흑 진화', subtitle: '잘못된 진화' },
  베놈묘티스몬: { template: 'dark', palette: 'dark', callout: '진화', subtitle: '어둠의 군주' },
  // Digimon Adventure 02.
  엑스브이몬: { template: 'adventure', palette: 'friendship' },
  스팅몬: { template: 'adventure', palette: 'sincerity' },
  아큐라몬: { template: 'adventure', palette: 'love' },
  파일드라몬: { template: 'jogress', palette: 'friendship', sourcePalettes: ['friendship', 'sincerity'] },
  실피드몬: { template: 'jogress', palette: 'light', sourcePalettes: ['love', 'light'] },
  '황제드라몬[파이터]': { template: 'warp', palette: 'miracles', armor: true, subtitle: '전설의 고대 용' },
  // Digimon Tamers: card slash and Matrix Evolution (biomerge).
  그라우몬: { template: 'card', palette: 'hazard' },
  메가로그라우몬: { template: 'card', palette: 'hazard', callout: '초진화', armor: true },
  듀크몬: { template: 'matrix', palette: 'hazard', hazard: true, lance: true, subtitle: '성기사의 창과 방패' },
  '듀크몬[크림슨]': { template: 'matrix', palette: 'hazard', hazard: true, lance: true, wings: 8, callout: '크림슨 모드', subtitle: '진홍의 날개' },
  가르고몬: { template: 'card', palette: 'gargo' },
  래피드몬: { template: 'card', palette: 'gargo', callout: '초진화', armor: true },
  세인트가르고몬: { template: 'matrix', palette: 'gargo', armor: true, subtitle: '정의의 수호신' },
  구미호몬: { template: 'card', palette: 'fox' },
  카오스듀크몬: { template: 'dark', palette: 'hazard', hazard: true, lance: true, callout: '진화', subtitle: '마성기사' },
  // Digimon Frontier: Spirit Evolution and Fusion.
  아그니몬: { template: 'spirit', palette: 'fire', subtitle: '불꽃의 투사' },
  볼프몬: { template: 'spirit', palette: 'lightSpirit', subtitle: '빛의 투사' },
  카이젤그레이몬: { template: 'spirit', palette: 'fire', callout: '퓨전 진화', subtitle: '불꽃의 용' },
  '매그너가루몬[SV]': { template: 'spirit', palette: 'lightSpirit', callout: '퓨전 진화', subtitle: '빛의 늑대' },
  스사노오몬: { template: 'spirit', palette: 'miracles', callout: '유니파이드 스피릿 에볼루션', subtitle: '열 개의 스피릿' },
  // Digimon Savers: DNA charge and Burst Mode.
  지오그레이몬: { template: 'burst', palette: 'savers' },
  라이즈그레이몬: { template: 'burst', palette: 'savers', callout: '초진화', armor: true },
  샤인그레이몬: { template: 'burst', palette: 'savers', callout: '궁극 진화', subtitle: '태양의 용' },
  '샤인그레이몬[버스트]': { template: 'burst', palette: 'savers', burst: true, callout: '버스트 진화', subtitle: '버스트 모드' },
  가오가몬: { template: 'burst', palette: 'saversBlue' },
  마하가오가몬: { template: 'burst', palette: 'saversBlue', callout: '초진화' },
  미라쥬가오가몬: { template: 'burst', palette: 'saversBlue', callout: '궁극 진화', subtitle: '달의 수호자' },
  '미라쥬가오가몬[버스트]': { template: 'burst', palette: 'saversBlue', burst: true, callout: '버스트 진화', subtitle: '버스트 모드' },
  로제몬: { template: 'burst', palette: 'saversRose', callout: '궁극 진화' },
  '로제몬[버스트]': { template: 'burst', palette: 'saversRose', burst: true, callout: '버스트 진화', subtitle: '버스트 모드' },
  레이브몬: { template: 'burst', palette: 'saversRaven', callout: '궁극 진화' },
  '레이브몬[버스트]': { template: 'burst', palette: 'saversRaven', burst: true, callout: '버스트 진화', subtitle: '버스트 모드' },
  // Last Evolution Kizuna.
  '아구몬[용기의유대]': { template: 'radiant', palette: 'courage', wings: 0, callout: '유대 진화', subtitle: '마지막 진화' },
  '파피몬[우정의유대]': { template: 'radiant', palette: 'friendship', wings: 0, callout: '유대 진화', subtitle: '마지막 진화' },
  // Jogress finales.
  오메가몬: { template: 'jogress', palette: 'omega', sourcePalettes: ['courage', 'friendship'], cloak: true, subtitle: '성기사의 결의' },
  '오메가몬[즈왈트]': { template: 'jogress', palette: 'blackOmega', sourcePalettes: ['dark', 'blackOmega'], dark: true },
  마스테몬: { template: 'jogress', palette: 'holy', sourcePalettes: ['light', 'dark'] },
  '알파몬[왕룡검]': { template: 'jogress', palette: 'miracles', sourcePalettes: ['holy', 'miracles'] },
  // More anime partners on real routes.
  니드몬: { template: 'adventure', palette: 'sincerity' },
  쥬드몬: { template: 'adventure', palette: 'reliability' },
  오메가샤우트몬: { template: 'burst', palette: 'courage', callout: '디지크로스', subtitle: '왕의 노래' },
  베리얼묘티스몬: { template: 'dark', palette: 'dark', subtitle: '어둠의 군주' },
  '루체몬[폴다운]': { template: 'dark', palette: 'dark', callout: '타락', subtitle: '폴다운 모드' },
  // Mode changes, awakenings and dark modes.
  '오메가몬[머시풀]': { template: 'mode', palette: 'mercy', armor: true, wings: 8, subtitle: '자비의 성기사' },
  '황제드라몬[팔라딘]': { template: 'mode', palette: 'paladin', armor: true, subtitle: '팔라딘 모드' },
  '가이오몬[엄도의형]': { template: 'mode', palette: 'blade', armor: true, subtitle: '엄도의 형' },
  '오메가몬[알터-B]': { template: 'mode', palette: 'blackOmega', armor: true },
  '오메가몬[즈왈트-D]': { template: 'mode', palette: 'blackOmega', armor: true },
  '시스터몬 블랑[각성]': { template: 'radiant', palette: 'sister', wings: 4, subtitle: '각성' },
  '시스터몬 느와르[각성]': { template: 'radiant', palette: 'sisterNoir', wings: 4, subtitle: '각성' },
  '루체몬[사탄]': { template: 'dark', palette: 'dark', subtitle: '사탄 모드' },
  '벨페몬[레이지]': { template: 'dark', palette: 'rage', subtitle: '레이지 모드' },
  '오파니몬[폴다운]': { template: 'dark', palette: 'sisterNoir', wings: 10, subtitle: '폴다운 모드' },
  '샤인그레이몬[루인]': { template: 'dark', palette: 'hazard', hazard: true, subtitle: '루인 모드' },
  '라센몬[격앙]': { template: 'dark', palette: 'rage', subtitle: '격앙 모드' },
  // Royal Knights.
  알파몬: { template: 'royal', palette: 'alpha', armor: true },
  크레니엄몬: { template: 'royal', palette: 'cranium', armor: true },
  로드나이트몬: { template: 'royal', palette: 'rhodo', armor: true },
  제스몬: { template: 'royal', palette: 'jes', armor: true },
  슬레이프몬: { template: 'royal', palette: 'sleip', armor: true, shield: true },
  // Seven Great Demon Lords rise from hellfire.
  리바이어몬: { template: 'dark', palette: 'envy', backdrop: 'inferno' },
  베르제브몬: { template: 'dark', palette: 'gluttony', backdrop: 'inferno' },
  벨페몬: { template: 'dark', palette: 'sloth', backdrop: 'inferno' },
  리리스몬: { template: 'dark', palette: 'lust', backdrop: 'inferno' },
  마왕몬: { template: 'dark', palette: 'wrath', backdrop: 'inferno' },
  // Four Holy Beasts.
  청룡몬: { template: 'sovereign', palette: 'seiryu' },
  주작몬: { template: 'sovereign', palette: 'suzaku' },
  백호몬: { template: 'sovereign', palette: 'byakko' },
  현무몬: { template: 'sovereign', palette: 'genbu' },
  치린몬: { template: 'sovereign', palette: 'qilin' },
  // Olympos XII.
  미네르바몬: { template: 'radiant', palette: 'olympos', wings: 0, backdrop: 'cathedral' },
  디아나몬: { template: 'radiant', palette: 'byakko', wings: 0, backdrop: 'celestial' },
  메르크리몬: { template: 'radiant', palette: 'olympos', wings: 4, backdrop: 'cathedral' },
  넵튠몬: { template: 'burst', palette: 'deepSea', backdrop: 'abyss' },
  // The deep sea.
  시드라몬: { template: 'adventure', palette: 'sea', backdrop: 'abyss' },
  메가시드라몬: { template: 'adventure', palette: 'sea', backdrop: 'abyss' },
  메탈시드라몬: { template: 'mode', palette: 'deepSea', armor: true, backdrop: 'abyss' },
  고래몬: { template: 'adventure', palette: 'sea', backdrop: 'abyss' },
  바이킹몬: { template: 'adventure', palette: 'deepSea', backdrop: 'abyss' },
  플레시오몬: { template: 'adventure', palette: 'sea', backdrop: 'abyss' },
  마린엔젤몬: { template: 'radiant', palette: 'sea', wings: 4, backdrop: 'abyss' },
  // Machines are assembled on a blueprint.
  가드로몬: { template: 'mode', palette: 'machine', armor: true, backdrop: 'blueprint' },
  안드로몬: { template: 'mode', palette: 'machine', armor: true, backdrop: 'blueprint' },
  하이안드로몬: { template: 'mode', palette: 'machine', armor: true, backdrop: 'blueprint' },
  탱크몬: { template: 'mode', palette: 'machineRed', armor: true, backdrop: 'blueprint' },
  메탈콩알몬: { template: 'mode', palette: 'machine', armor: true, backdrop: 'blueprint' },
  메탈티라노몬: { template: 'mode', palette: 'machineRed', armor: true, backdrop: 'blueprint' },
  메가드라몬: { template: 'mode', palette: 'machineRed', armor: true, backdrop: 'blueprint' },
  카오스드라몬: { template: 'mode', palette: 'machineRed', armor: true, backdrop: 'blueprint' },
  // Plants bloom.
  우드몬: { template: 'adventure', palette: 'plant', backdrop: 'bloom' },
  쥬레이몬: { template: 'adventure', palette: 'plant', backdrop: 'bloom' },
  펌프몬: { template: 'adventure', palette: 'flower', backdrop: 'bloom' },
  로터스몬: { template: 'radiant', palette: 'flower', wings: 0, backdrop: 'bloom' },
  노블펌프몬: { template: 'adventure', palette: 'flower', backdrop: 'bloom' },
  해바라기몬: { template: 'adventure', palette: 'hope', backdrop: 'bloom' },
  라일라몬: { template: 'adventure', palette: 'flower', backdrop: 'bloom' },
  // Dragons are born in the storm.
  브이드라몬: { template: 'adventure', palette: 'storm', backdrop: 'void' },
  에어로브이드라몬: { template: 'warp', palette: 'storm', armor: true, backdrop: 'void' },
  윙드라몬: { template: 'warp', palette: 'storm', backdrop: 'void' },
  알포스브이드라몬: { template: 'royal', palette: 'storm', armor: true },
  슬레이어드라몬: { template: 'warp', palette: 'sleip', armor: true, backdrop: 'void' },
  그라운드라몬: { template: 'warp', palette: 'beast', armor: true, backdrop: 'void' },
  브레이크드라몬: { template: 'warp', palette: 'beast', armor: true, backdrop: 'void' },
  홀리드라몬: { template: 'radiant', palette: 'holy', wings: 8 },
  // Beasts roar in a blazing aura.
  레오몬: { template: 'burst', palette: 'beast' },
  아이언레오몬: { template: 'burst', palette: 'beast' },
  반쵸레오몬: { template: 'burst', palette: 'beast', burst: true },
  화이트레오몬: { template: 'burst', palette: 'byakko' },
  로더레오몬: { template: 'burst', palette: 'beast' },
}

const paletteOf = (key) => Array.isArray(key) ? key : PALETTES[key] ?? PALETTES.data

function armorSignature(targetName) {
  const requirement = ITEM_EVOLUTION_REQUIREMENTS[targetName]
  if (requirement?.method !== '아머 진화') return null
  const [, palette, subtitle] = DIGIMENTALS.find(([pattern]) => pattern.test(requirement.itemName)) ?? [null, 'miracles', '디지멘탈']
  return { template: 'armor', palette, subtitle }
}

// Item evolutions drop a 3D capsule onto the Digimon, shaped by the kind of evolution
// and coloured from the evolving Digimon's palette (never the flat inventory art).
const CAPSULE_BY_METHOD = {
  '아머 진화': 'digimental', '스피릿 진화': 'spirit', X진화: 'xantibody', '모드 체인지': 'mode',
  '유대 진화': 'crest', 각성: 'crest', '버스트 진화': 'digivice', '워프 진화': 'mode',
}

function capsuleFor(targetName, sourceNames) {
  const requirement = ITEM_EVOLUTION_REQUIREMENTS[targetName]
  if (!requirement || !requirement.from.some((name) => sourceNames.includes(name))) return null
  const kind = CAPSULE_BY_METHOD[requirement.method] ?? 'mode'
  return { kind, split: kind === 'digimental' }
}

// ---- Automatic scenes for every other route -------------------------------------------
// The evolved form's element picks colours and a backdrop, its stage picks how grand the
// choreography is, and its name nudges the hue so neighbours in an element still differ.
const ELEMENT_PALETTES = {
  화염: ['#ff6a1a', '#ffd27a', '#5a1200'], 물: ['#2fb7ff', '#d6f6ff', '#032a52'], 얼음: ['#9fe6ff', '#ffffff', '#1a4a6b'],
  바람: ['#6affc8', '#efffff', '#0b3d3a'], 번개: ['#ffe14a', '#fffbe0', '#2a2a6b'], 흙: ['#e0a050', '#fff0d0', '#3d2410'],
  나무: ['#7ee06a', '#f3ffe0', '#1d4d16'], 강철: ['#9fb8d6', '#f0f6ff', '#1a2a3d'], 어둠: ['#a03cff', '#ff4a7a', '#12001f'],
  빛: ['#ffe9a8', '#ffffff', '#c9a33a'], 무: ['#67e8ff', '#ffe1a0', '#2bb5ff'],
}
const HIGH_STAGES = ['궁극체', '초궁극체']

function elementBackdrop(element, type, stage) {
  switch (element) {
    case '화염': return type === '바이러스' ? 'inferno' : 'sun'
    case '물': return 'abyss'
    case '얼음': return 'prism'
    case '바람': return 'helix'
    case '번개': return 'void'
    case '흙': return 'celestial'
    case '나무': return 'bloom'
    case '강철': return 'blueprint'
    case '어둠': return type === '바이러스' ? 'inferno' : 'void'
    case '빛': return HIGH_STAGES.includes(stage) ? 'cathedral' : 'heaven'
    default: return type === '백신' ? 'stripes' : type === '바이러스' ? 'code' : 'grid'
  }
}

function elementTemplate(element, type, stage) {
  if (stage === '유아기' || stage === '유년기' || stage === '성장기') return { template: 'adventure' }
  if (stage === '성숙기') {
    if (element === '빛') return { template: 'radiant', wings: 0 }
    if (element === '어둠') return { template: 'dark' }
    return { template: type === '데이터' ? 'card' : 'adventure' }
  }
  if (stage === '완전체') {
    if (element === '빛') return { template: 'radiant', wings: 4 }
    if (element === '어둠') return { template: 'dark' }
    if (element === '강철') return { template: 'mode', armor: true }
    if (element === '화염' || element === '번개') return { template: 'burst' }
    return { template: 'adventure', armor: true, callout: '초진화' }
  }
  if (stage === '궁극체') {
    if (element === '빛') return { template: 'radiant', wings: 8 }
    if (element === '어둠') return { template: 'dark', hazard: type === '바이러스' }
    if (element === '강철') return { template: 'mode', armor: true }
    if (element === '화염' || element === '번개') return { template: 'burst' }
    if (element === '무') return { template: 'warp', armor: true }
    return { template: 'sovereign' }
  }
  // 초궁극체
  if (element === '어둠') return { template: 'dark', hazard: true }
  if (element === '화염') return { template: 'burst', burst: true }
  if (element === '빛' || element === '강철' || element === '무') return { template: 'royal', armor: true }
  return { template: 'sovereign' }
}

const toHsl = (hex) => {
  const v = parseInt(hex.slice(1), 16)
  const r = (v >> 16 & 255) / 255, g = (v >> 8 & 255) / 255, b = (v & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, sat, l]
}
const fromHsl = ([h, sat, l]) => {
  const f = (n) => {
    const k = (n + h / 30) % 12
    const c = l - sat * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}
const shiftHue = (hex, degrees) => { const [h, sat, l] = toHsl(hex); return fromHsl([(h + degrees + 360) % 360, sat, l]) }

export function autoSignature(targetName) {
  const { element, type, stage } = getDigimonProfile(targetName)
  const hash = [...targetName].reduce((sum, character) => (sum * 31 + character.codePointAt(0)) >>> 0, 7)
  const shift = (hash % 25) - 12
  const base = ELEMENT_PALETTES[element] ?? ELEMENT_PALETTES.무
  return {
    ...elementTemplate(element, type, stage),
    palette: [shiftHue(base[0], shift), base[1], shiftHue(base[2], shift)],
    backdrop: elementBackdrop(element, type, stage),
    auto: true,
  }
}

function methodSignature(targetName, sourceNames) {
  const route = sourceNames.length ? getEvolutionRoute(sourceNames[0], targetName) : null
  const own = autoSignature(targetName).palette
  if (sourceNames.length > 1 || route?.kind === 'jogress') {
    if (route?.method === '디지크로스') return { template: 'xros', palette: own, motif: { kind: 'assembly' },
      sourcePalettes: sourceNames.map((name) => autoSignature(name).palette), callout: '디지크로스', subtitle: '동료의 힘을 하나로' }
    return { template: 'jogress', palette: own, sourcePalettes: sourceNames.map((name) => autoSignature(name).palette),
      ...(route?.method === '디지크로스' ? { callout: '디지크로스', subtitle: '동료의 힘을 하나로' } : {}) }
  }
  if (route?.method === '스피릿 진화') return { template: 'spirit', palette: own }
  if (route?.method === '버스트 진화') return { template: 'burst', palette: 'savers', burst: true, callout: '버스트 진화' }
  if (route?.method === 'X진화') return { template: 'xantibody', palette: 'xantibody', armor: true, subtitle: 'X항체' }
  if (route?.method === '모드 체인지') return { template: 'mode', palette: own, armor: true }
  if (route?.method === '각성' || route?.method === '유대 진화') return { template: 'radiant', palette: own, wings: 0 }
  if (route?.method === '워프 진화') return { template: 'warp', palette: own, armor: true }
  return null
}

/**
 * Picks the direction for one evolution scene.
 * - Anime signature scenes play whenever enabled and one exists for the result.
 * - Otherwise the chosen style applies: 'classic' keeps the original scene,
 *   'rumble' plays the Super Rumble-style remake of the Adventure evolution bank.
 */
export function resolveEvolutionCinematic(scene, { style = 'classic', signature = true } = {}) {
  if (!scene || scene.mode === 'hatch') return { template: 'classic' }
  const sourceNames = (scene.from ?? []).map((unit) => unit.name)
  const targetName = scene.to?.name
  // Hand-made anime scenes first, then evolution-method scenes, then the automatic scene
  // generated for every remaining route.
  let found = signature ? (armorSignature(targetName) ?? ROSTER_6_EVOLUTION_SIGNATURES[targetName] ?? ROSTER_5_EVOLUTION_SIGNATURES[targetName] ?? ROSTER_4_EVOLUTION_SIGNATURES[targetName] ?? EXPANSION_EVOLUTION_SIGNATURES[targetName] ?? SIGNATURES[targetName] ?? methodSignature(targetName, sourceNames) ?? autoSignature(targetName)) : null
  // The Super Rumble style remakes every route that has no hand-made anime scene.
  if (style === 'rumble' && (!found || found.auto)) found = null
  if (!found && style !== 'rumble') return { template: 'classic' }
  const spec = found ?? { template: 'adventure', palette: 'data' }
  const base = CINEMATIC_TEMPLATES[spec.template]
  // Optional in-between forms after the source on its own line; real evolutions never skip stages.
  const lineage = spec.chain ?? []
  const passed = Math.max(...sourceNames.map((name) => lineage.indexOf(name)), -1)
  const chain = passed < 0 ? [] : lineage.slice(passed + 1)
  const sourcePalettes = (spec.sourcePalettes ?? []).map(paletteOf)
  return {
    ...spec,
    template: spec.template,
    signature: Boolean(found) && !found.auto,
    auto: Boolean(found?.auto),
    rumble: style === 'rumble',
    palette: paletteOf(spec.palette),
    sourcePalettes: sourceNames.map((name, index) => spec.sourcePaletteByName?.[name]
      ? paletteOf(spec.sourcePaletteByName[name]) : sourcePalettes[index] ?? paletteOf(index % 2 ? 'friendship' : 'courage')),
    chain,
    capsule: capsuleFor(targetName, sourceNames),
    duration: base.duration,
    beats: { charge: base.charge, transform: base.transform, reveal: base.reveal, complete: base.complete },
    backdrop: spec.backdrop ?? base.backdrop,
    callout: spec.callout ?? base.callout,
    subtitle: spec.subtitle ?? null,
  }
}

export function describeCallout(cinematic, scene) {
  const names = (scene.from ?? []).map((unit) => unit.name)
  if (scene.mode === 'rebuild') return { lead: '관리 프로그램', line: `${cinematic.callout}` }
  if (cinematic.template === 'armor') return { lead: `디지멘탈 업!`, line: `${names[0] ?? ''} ${cinematic.callout}—!` }
  if (cinematic.template === 'jogress' || cinematic.template === 'xros') return { lead: names.join(' · '), line: `${cinematic.callout}—!` }
  if (cinematic.template === 'matrix') return { lead: '바이오 머지', line: `${names[0] ?? ''} ${cinematic.callout}—!` }
  if (cinematic.template === 'card') return { lead: '카드 슬래시!', line: `${names[0] ?? ''} ${cinematic.callout}—!` }
  if (cinematic.template === 'burst') return { lead: cinematic.burst ? '차지! 버스트 모드' : 'DNA 차지!', line: `${names[0] ?? ''} ${cinematic.callout}—!` }
  if (cinematic.template === 'spirit') return { lead: '스피릿', line: `${cinematic.callout}!` }
  return { lead: '', line: `${names[0] ?? ''} ${cinematic.callout}—!` }
}
