import { loadRegionalTrust } from './regionalTrustProgress.js'
import { REGIONAL_SUPPORT_PROFILES } from '../data/regionalSupportProfiles.js'

export const TOWN_STORAGE_KEY = 'digirogue-town-v1'
export const TOWN_BUILDINGS = Object.freeze([
  { id: 'hall', name: '마을 회관', keeper: '에렉몬', icon: 'hall', residents: [], x: 49, y: 28, description: '주민이 모이는 마을의 중심. 회관을 확장하면 더 많은 주민과 시설을 맞이합니다.' },
  { id: 'farm', name: '식량 농장', keeper: '팔몬', icon: 'farm', residents: ['팔몬'], x: 21, y: 61, description: '팔몬이 가꾼 식재료로 모험에 가져갈 식량을 준비합니다.' },
  { id: 'nursery', name: '디지에그 보육원', keeper: '에렉몬', icon: 'egg', residents: ['에렉몬'], x: 22, y: 28, description: '에렉몬의 보살핌으로 새로 얻는 디지에그의 부화를 앞당깁니다.' },
  { id: 'clinic', name: '회복소', keeper: '가트몬', icon: 'clinic', residents: ['가트몬', '엔젤몬', '마린엔젤몬'], x: 75, y: 29, description: '능력치 하락과 기술 소모에 대비하는 회복 보급품을 준비합니다.' },
  { id: 'workshop', name: '정비소', keeper: '톱니몬', icon: 'workshop', residents: ['톱니몬', '가드로몬', '안드로몬'], x: 74, y: 62, description: '디지털 장비를 정비해 모험에 필요한 탐색 도구를 빌려줍니다.' },
  { id: 'market', name: '교역소', keeper: '모노크로몬', icon: 'market', residents: ['모노크로몬'], x: 48, y: 72, description: '모노크로몬이 마련한 자금으로 모험을 시작합니다.' },
])
const buildingById = new Map(TOWN_BUILDINGS.map(building => [building.id, building]))
const roles = { '에렉몬':'보육원 관리', '메라몬':'시설 열원 관리', '샤코몬':'하수도 관리', '팔몬':'농장 관리', '가트몬':'회복소 관리', '엔젤몬':'회복소 지원', '마린엔젤몬':'회복소 지원', '톱니몬':'정비소 관리', '가드로몬':'정비소 지원', '안드로몬':'정비소 지원', '모노크로몬':'교역소 관리', '레오몬':'마을 경비', '위자몬':'기록 보관', '쉬라몬':'수로 관리', '프리지몬':'물자 보관', '호크몬':'지역 연락', '텐타몬':'시설 점검', '임프몬':'소문 수집', '가루몬':'정찰', '쥬드몬':'건설 지원', '스타몬':'길잡이', '홀리엔젤몬':'마을 수호', '아구몬':'화덕 관리', '버드라몬':'물자 운송' }
export const TOWN_RESIDENTS = Object.freeze([...new Set(REGIONAL_SUPPORT_PROFILES.map(profile => profile.name))].map(name => ({ name, role: roles[name] ?? '마을 지원', homes: REGIONAL_SUPPORT_PROFILES.filter(profile => profile.name === name).map(profile => profile.mapName) })))
const residentByName = new Map(TOWN_RESIDENTS.map(resident => [resident.name, resident]))
const integer = (value, max = 99999999) => Math.min(max, Math.max(0, Math.floor(Number(value) || 0)))
const receiptMap = value => Object.fromEntries(Object.entries(value ?? {}).filter(([id, stage]) => id.length > 0 && id.length <= 256 && Number.isSafeInteger(stage) && stage > 0))
const read = value => { try { return JSON.parse(value ?? 'null') } catch { return null } }
export function normalizeTown(value) {
  const residents = [...new Set(['에렉몬', '팔몬', ...(Array.isArray(value?.residents) ? value.residents : [])])].filter(name => residentByName.has(name))
  const buildings = Object.fromEntries(TOWN_BUILDINGS.map(building => [building.id, Math.max(building.id === 'hall' ? 1 : 0, integer(value?.buildings?.[building.id], 3))]))
  return { version: 1, materials: value?.version === 1 ? integer(value.materials) : 80, tokens: value?.version === 1 ? integer(value.tokens) : 2,
    buildings, residents, selectedSupport: buildingById.has(value?.selectedSupport) && value.selectedSupport !== 'hall' && buildings[value.selectedSupport] > 0 ? value.selectedSupport : 'none',
    victoryReceipts: receiptMap(value?.victoryReceipts), questReceipts: receiptMap(value?.questReceipts) }
}
export function loadTown(storage) {
  const saved = read(storage.getItem(TOWN_STORAGE_KEY))
  if (saved?.version === 1) return normalizeTown(saved)
  // Completed imported quests are not new town work. Regional trust already
  // correlates all accepted legacy slots, including their fallback run IDs.
  return normalizeTown({ ...normalizeTown(null), questReceipts: loadRegionalTrust(storage).receipts })
}
export function saveTown(storage, value) {
  try { const raw = JSON.stringify(value); if (storage.getItem(TOWN_STORAGE_KEY) !== raw) storage.setItem(TOWN_STORAGE_KEY, raw); return storage.getItem(TOWN_STORAGE_KEY) === raw } catch { return false }
}
export const getTownCapacity = town => [0, 6, 14, 24][town.buildings.hall]
export const getTownProsperity = town => town.residents.length * 2 + Object.values(town.buildings).reduce((a, b) => a + b, 0)
export function townBuildingBenefit(id, level) {
  if (!level) return '아직 건설하지 않았습니다.'
  if (id === 'hall') return '주민 정원 ' + [0, 6, 14, 24][level] + '명 · 시설 최대 Lv.' + level
  if (id === 'farm') return ['','감자튀김 2개','햄버거 2개','치킨 콤보 2개'][level]
  if (id === 'nursery') return '새 디지에그 부화 ' + (level === 3 ? 2 : 1) + '스테이지 단축' + (level >= 2 ? ' · 디지바이스 IC 보급' : '')
  if (id === 'clinic') return '에너지필 A ' + level + '개' + (level === 3 ? ' · 디지소울 충전 1개' : '')
  if (id === 'workshop') return ['','D-터미널 보급','D-터미널 · D-스캐너 보급','D-터미널 · D-스캐너 · 디지바이스 IC 보급'][level]
  if (id === 'market') return '출발 골드 +' + level * 150
  return ''
}
export function getTownUpgrade(town, id) {
  const building = buildingById.get(id), level = town.buildings[id] ?? 0
  const materials = id === 'hall' ? [0, 0, 90, 180][level + 1] : [0, 30, 70, 140][level + 1]
  const tokens = level >= 1 ? level : 0
  let reason = !building ? '알 수 없는 시설입니다.' : level >= 3 ? '최대 확장입니다.' : ''
  if (!reason && id !== 'hall' && level >= town.buildings.hall) reason = '회관을 먼저 Lv.' + (level + 1) + '로 확장하세요.'
  if (!reason && id !== 'hall' && !building.residents.some(name => town.residents.includes(name))) reason = building.residents.join(' / ') + ' 주민 영입이 필요합니다.'
  if (!reason && id === 'hall' && town.residents.length < (level === 1 ? 4 : 8)) reason = '주민 ' + (level === 1 ? 4 : 8) + '명이 필요합니다.'
  if (!reason && town.materials < materials) reason = '건설 데이터가 부족합니다.'
  if (!reason && town.tokens < tokens) reason = '교류 증표가 부족합니다.'
  return { ok: !reason, reason, materials: materials ?? 0, tokens, nextLevel: Math.min(3, level + 1) }
}
export function getTownRecruitment(town, trust, name) {
  const resident = residentByName.get(name)
  const bestTrust = resident ? Math.max(0, ...resident.homes.map(map => integer(trust?.regions?.[map], 3))) : 0
  const reason = !resident ? '알 수 없는 주민입니다.' : town.residents.includes(name) ? '이미 함께 살고 있습니다.' : town.residents.length >= getTownCapacity(town) ? '회관을 확장해 주민 정원을 늘리세요.' : bestTrust < 2 ? '연결 지역 신뢰도 2 이상이 필요합니다.' : town.tokens < 2 ? '교류 증표 2개가 필요합니다.' : ''
  return { ok: !reason, reason, bestTrust, tokens: 2 }
}
export function applyTownAction(profile, trust, command) {
  const town = normalizeTown(profile)
  if (command?.type === 'upgrade') {
    const upgrade = getTownUpgrade(town, command.buildingId)
    if (!upgrade.ok) return { ok: false, reason: upgrade.reason }
    return { ok: true, town: { ...town, materials: town.materials - upgrade.materials, tokens: town.tokens - upgrade.tokens, buildings: { ...town.buildings, [command.buildingId]: upgrade.nextLevel } }, message: buildingById.get(command.buildingId).name + ' Lv.' + upgrade.nextLevel + ' 완성!' }
  }
  if (command?.type === 'recruit') {
    const recruitment = getTownRecruitment(town, trust, command.name)
    if (!recruitment.ok) return { ok: false, reason: recruitment.reason }
    return { ok: true, town: { ...town, tokens: town.tokens - 2, residents: [...town.residents, command.name] }, message: command.name + '이(가) 마을에 합류했습니다.' }
  }
  if (command?.type === 'support' && (command.buildingId === 'none' || (buildingById.has(command.buildingId) && command.buildingId !== 'hall' && town.buildings[command.buildingId] > 0))) {
    return { ok: true, town: { ...town, selectedSupport: command.buildingId }, message: command.buildingId === 'none' ? '출발 지원을 해제했습니다.' : buildingById.get(command.buildingId).name + '의 출발 지원을 선택했습니다.' }
  }
  return { ok: false, reason: '사용할 수 없는 마을 기능입니다.' }
}
export function recordTownProgress(profile, state) {
  const runId = state?.trainerRunId, stage = state?.currentStage
  if (typeof runId !== 'string' || !runId || runId.length > 256 || !Number.isSafeInteger(stage) || stage < 1) return profile
  let next = profile
  const party = state.party ?? [state.player]
  const won = state.enemies?.length > 0 && state.enemies.every(unit => unit && Number(unit.currentHp) <= 0) && party.some(unit => unit && !unit.isEgg && !unit.regionalSupport && Number(unit.currentHp) > 0)
  if (won && stage > (profile.victoryReceipts[runId] ?? 0)) {
    const milestone = stage % 10 === 0
    next = { ...next, materials: integer(next.materials + (milestone ? 15 : 5)), tokens: integer(next.tokens + (milestone ? 1 : 0)), victoryReceipts: { ...next.victoryReceipts, [runId]: stage } }
  }
  const event = state.explorationEvent, change = event?.result?.trustChange
  if (event?.phase === 'result' && event.result?.success === true && event.stage === stage && change?.runId === runId && change.stage === stage && stage > (profile.questReceipts[runId] ?? 0)) {
    next = { ...next, materials: integer(next.materials + 20), tokens: integer(next.tokens + 1), questReceipts: { ...next.questReceipts, [runId]: stage } }
  }
  return next
}
export function applyTownStartingSupport(state, profile) {
  if (!state || state.gameMode === 'daily' || state.townSupport || state.currentStage !== 1) return state
  const town = normalizeTown(profile), id = town.selectedSupport, level = town.buildings[id] ?? 0
  const items = {}
  if (id === 'farm') items[['','food-fried-potato','food-hamburger','food-chicken-combo'][level]] = 2
  if (id === 'clinic') { items['energy-pill-a'] = level; if (level === 3) items['charge-digisoul'] = 1 }
  if (id === 'workshop') { items['d-terminal'] = 1; if (level >= 2) items['d-scanner'] = 1; if (level >= 3) items['digivice-ic'] = 1 }
  if (id === 'nursery' && level >= 2) items['digivice-ic'] = 1
  const inventory = { ...state.inventory }
  for (const [item, amount] of Object.entries(items)) if (item && amount > 0) inventory[item] = (inventory[item] ?? 0) + amount
  return { ...state, inventory, gold: (state.gold ?? 0) + (id === 'market' ? level * 150 : 0), townSupport: { buildingId: id, level, eggStageReduction: id === 'nursery' ? (level === 3 ? 2 : 1) : 0 } }
}
export function getTownEggStages(stages, support) { return Math.max(1, Math.floor(stages) - integer(support?.eggStageReduction, 2)) }

export function getTownResidentView(town, trust, name) {
  const resident = residentByName.get(name)
  const joined = Boolean(resident && town?.residents?.includes(name))
  const known = joined || Boolean(resident && Object.hasOwn(trust?.contacts ?? {}, name))
  return { known, joined, name: known ? name : '?', portraitName: known ? name : null,
    role: known ? resident.role : '?', homes: known ? resident.homes : [] }
}
const residentNamePattern = new RegExp([...residentByName.keys()].sort((a, b) => b.length - a.length).join('|'), 'g')
export function maskTownResidentNames(town, trust, text) {
  return text.replace(residentNamePattern, name => getTownResidentView(town, trust, name).name)
}
