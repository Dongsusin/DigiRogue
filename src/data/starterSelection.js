import { DIGIMON_STAGES } from './digimonStages.js'
export const STARTER_STAGES = DIGIMON_STAGES
export const STARTER_PARTY_COST_LIMIT = 10
export const STARTER_TEAM_LIMIT = 8
export const STARTING_PLAYER_LEVEL = 5

// Numbering belongs to this game's roster and remains stable when browsing or sorting.
export function createStarterCatalog(speciesLookup, trainerSkills = {}, collection = null) {
  const byStage = Object.fromEntries(STARTER_STAGES.map(stage => [stage, []]))
  const entries = []
  for (const stage of STARTER_STAGES) {
    for (const data of speciesLookup.values()) {
      if (data.stage !== stage || !isPlayableDigimon(data)) continue
      const cost = data.시작코스트
      if (!Number.isSafeInteger(cost) || cost < 1) throw new Error(`시작 코스트 누락: ${data.이름}`)
      const entry = { name: data.이름, stage, data, url: data.imageUrl,
        status: collection ? getCollectionStatus(collection, data.이름) : 'unlocked',
        cost: getTrainerStarterCost(data, trainerSkills), baseCost: cost, number: entries.length + 1 }
      entries.push(entry)
      byStage[stage].push(entry)
    }
  }
  return { entries, byStage, byName: new Map(entries.map(entry => [entry.name, entry])), costLimit: getTrainerCostLimit(trainerSkills) }
}

export function createDailyStarterCatalog(catalog, challenge) {
  const entries = challenge.candidates.map(name => catalog.byName.get(name))
    .filter(entry => entry?.stage === '성장기')
    .map(entry => ({ ...entry, status: 'unlocked' }))
  return { entries, byStage: Object.fromEntries(STARTER_STAGES.map(stage => [stage, entries.filter(entry => entry.stage === stage)])),
    byName: new Map(entries.map(entry => [entry.name, entry])), costLimit: Infinity, teamLimit: 2, minTeamSize: 2,
    stageFilters: ['전체', '성장기'] }
}

const searchKey = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, '').toLocaleLowerCase('ko')
export function filterStarterEntries(catalog, { stage = '전체', query = '', sort = 'number' } = {}) {
  const needle = searchKey(query)
  const entries = (stage === '전체' ? catalog.entries : catalog.byStage[stage] ?? [])
    .filter(entry => !needle || (entry.status !== 'unknown' && getDigimonNameAliases(entry.name).some(name => searchKey(name).includes(needle))))
  const prioritizeDiscovery = catalog.entries.some(entry => entry.status === 'unknown')
  const priority = { unlocked: 0, seen: 1, unknown: 2 }
  return entries.sort((a, b) => {
    if (prioritizeDiscovery && a.status !== b.status) return priority[a.status] - priority[b.status]
    if (a.status === 'unknown' && b.status === 'unknown') return a.number - b.number
    if (sort === 'name') return a.name.localeCompare(b.name, 'ko') || a.number - b.number
    if (sort === 'cost') return a.cost - b.cost || a.number - b.number
    return a.number - b.number
  })
}

export function getStarterTeamSummary(names, catalog) {
  const team = names.map(name => catalog.byName.get(name)).filter(Boolean)
  const cost = team.reduce((total, entry) => total + entry.cost, 0)
  const valid = team.length === names.length && new Set(names).size === names.length &&
    team.every(entry => entry.status === 'unlocked') &&
    names.length <= (catalog.teamLimit ?? STARTER_TEAM_LIMIT) && cost <= (catalog.costLimit ?? STARTER_PARTY_COST_LIMIT)
  return { team, cost, remaining: (catalog.costLimit ?? STARTER_PARTY_COST_LIMIT) - cost,
    canStart: valid && team.length >= (catalog.minTeamSize ?? 1) }
}

export function getStarterSelectionBlocker(name, names, catalog) {
  const entry = catalog.byName.get(name)
  if (!entry) return '등록되지 않은 디지몬입니다.'
  if (names.includes(name)) return ''
  if (entry.status === 'unknown') return '모험에서 발견하지 않은 디지몬입니다.'
  if (entry.status === 'seen') return '부화하거나 진화하면 시작 디지몬으로 선택할 수 있어요.'
  const limit = catalog.costLimit ?? STARTER_PARTY_COST_LIMIT
  if (entry.cost > limit) return `코스트 ${entry.cost} · 시작 한도 ${limit} 초과`
  const teamLimit = catalog.teamLimit ?? STARTER_TEAM_LIMIT
  if (names.length >= teamLimit) return `팀에는 ${teamLimit}마리까지 넣을 수 있어요.`
  const { remaining } = getStarterTeamSummary(names, catalog)
  return entry.cost > remaining ? `코스트가 ${entry.cost - remaining} 부족해요. 팀에서 다른 디지몬을 빼 주세요.` : ''
}

export function toggleStarterSelection(name, names, catalog) {
  if (names.includes(name)) return names.filter(current => current !== name)
  if (getStarterSelectionBlocker(name, names, catalog)) return names
  return [...names, name]
}
import { getTrainerCostLimit, getTrainerStarterCost } from '../progression/trainerSkills.js'
import { isPlayableDigimon } from './speciesAvailability.js'
import { getCollectionStatus } from '../progression/digimonCollection.js'
import { getDigimonNameAliases } from './digimonNames.js'
