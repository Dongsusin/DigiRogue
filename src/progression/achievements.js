import manifest from '../data/digimonModelManifest.json' with { type: 'json' }
import { isPlayableDigimon } from '../data/speciesAvailability.js'
import { BOSS_PROFILES } from '../data/bossProfiles.js'
import { RIVAL_PROFILES } from '../data/rivalProfiles.js'
import { REGIONAL_SUPPORT_PROFILES } from '../data/regionalSupportProfiles.js'
import { EVENT_STORIES } from '../adventure/eventStories.js'
import { normalizeAchievementState } from './achievementState.js'
import { normalizeTrainerProgress } from './trainerSkills.js'
import { getGameItemDiscoveries } from './itemCollection.js'
import { canonicalItemId } from '../data/itemIdentity.js'
import { getCollectionStatus } from './digimonCollection.js'
import { isMainBattleWon, normalizeModeProgress, recordModeVictory } from './modeProgress.js'

export const ACHIEVEMENT_CATEGORIES = Object.freeze([{ id: 'all', name: '전체' }, { id: 'trust', name: '신뢰' },
  { id: 'rival', name: '라이벌' }, { id: 'boss', name: '보스' }, { id: 'mode', name: '모드' }, { id: 'collection', name: '수집' }])
export const ACHIEVEMENT_SPECIES = Object.freeze(Object.keys(manifest).filter(isPlayableDigimon))
const completeLine = profile => profile.line?.length && [...profile.line, ...(profile.formation ?? []), ...(profile.companion ? [profile.companion] : [])].every(name => manifest[name])
const npcNames = [...new Set([...REGIONAL_SUPPORT_PROFILES.map(p => p.name), ...EVENT_STORIES.map(p => p.npc)])].filter(name => manifest[name])
export const ACHIEVEMENTS = Object.freeze([
  ...npcNames.map(name => ({ id: 'trust:' + name, category: 'trust', name: name + '의 신뢰',
    description: '신뢰도 최대치 달성', imageName: name, contact: name, target: 3, points: 2 })),
  ...RIVAL_PROFILES.filter(completeLine).map(p => ({ id: 'rival:' + p.id, category: 'rival', name: p.line[0] + ' 계열의 라이벌',
    description: p.line.join(' → '), imageName: p.line.at(-1), profileId: p.id, line: p.line, target: 1, points: 3 })),
  ...BOSS_PROFILES.filter(completeLine).map(p => ({ id: 'boss:' + p.id, category: 'boss', name: p.title + ' 제압',
    description: p.line.join(' → '), imageName: p.line.at(-1), profileId: p.id, line: p.line, target: 1, points: p.kind === 'final' ? 10 : 5 })),
  { id: 'mode:classic', category: 'mode', name: '캐주얼 최초 클리어', description: '캐주얼 200층 클리어', mode: 'classic', target: 200, points: 10 },
  { id: 'mode:hard', category: 'mode', name: '하드 최초 클리어', description: '하드 200층 클리어', mode: 'hard', target: 200, points: 20 },
  { id: 'mode:daily', category: 'mode', name: '데일리 최초 클리어', description: '데일리 200층 클리어', mode: 'daily', target: 200, points: 15 },
  { id: 'mode:endless', category: 'mode', name: '무한 200층 돌파', description: '끝없는 모험에서 200층 돌파', mode: 'endless', target: 200, points: 10 },
  { id: 'collection:digimon', category: 'collection', name: '디지몬 도감 완성', description: '시작 가능한 모든 디지몬 획득', target: ACHIEVEMENT_SPECIES.length, points: 30 },
  { id: 'collection:items', category: 'collection', name: '아이템 도감 완성', description: '모든 아이템을 한 번 이상 획득', target: null, points: 20 },
].map(Object.freeze))
const bossIds = new Set(ACHIEVEMENTS.filter(a => a.category === 'boss').map(a => a.profileId))
const rivalIds = new Set(ACHIEVEMENTS.filter(a => a.category === 'rival').map(a => a.profileId))
const unique = values => [...new Set(values)]
const itemIds = catalog => unique((catalog ?? []).map(item => canonicalItemId(typeof item === 'string' ? item : item.id)).filter(Boolean))
export function getAchievementRows(value, { collection, trust, modes, itemCatalog = [] } = {}) {
  const progress = normalizeTrainerProgress(value), record = progress.achievements, mode = normalizeModeProgress(modes)
  const acquired = new Set(record.items), catalog = itemIds(itemCatalog)
  return ACHIEVEMENTS.map(definition => {
    const completed = Object.hasOwn(record.completed, definition.id)
    let current = 0, target = definition.target
    if (definition.category === 'trust') current = Math.max(0, Math.min(3, trust?.contacts?.[definition.contact] ?? 0))
    else if (definition.category === 'boss') current = record.bosses.includes(definition.profileId) ? 1 : 0
    else if (definition.category === 'rival') current = record.rivals.includes(definition.profileId) ? 1 : 0
    else if (definition.mode === 'classic') current = mode.classicCleared ? 200 : mode.classicBest
    else if (definition.mode === 'hard') current = mode.hardCleared ? 200 : mode.hardBest
    else if (definition.mode === 'daily') current = Math.max(0, ...Object.values(mode.dailyRecords))
    else if (definition.mode === 'endless') current = mode.endlessBest
    else if (definition.id === 'collection:digimon') current = ACHIEVEMENT_SPECIES.filter(name => getCollectionStatus(collection, name) === 'unlocked').length
    else if (definition.id === 'collection:items') { target = catalog.length; current = catalog.filter(id => acquired.has(id)).length }
    const known = completed || !definition.imageName || (definition.contact ? Object.hasOwn(trust?.contacts ?? {}, definition.contact) :
      (definition.line ?? [definition.imageName]).some(name => getCollectionStatus(collection, name) !== 'unknown'))
    return { ...definition, current: completed ? target : Math.min(current, target), target, completed, known, completedAt: record.completed[definition.id] ?? null }
  })
}
// Completion receipts and SP are returned in one trainer record and saved together.
export function recordAchievements(value, { states = [], state, collection, trust, modes, itemCatalog, acquiredItems = [], pending, now = Date.now() } = {}) {
  const progress = normalizeTrainerProgress(value), old = progress.achievements
  const retry = normalizeAchievementState(pending)
  const bosses = new Set([...old.bosses, ...retry.bosses]), rivals = new Set([...old.rivals, ...retry.rivals]), items = new Set([...old.items, ...retry.items])
  let mode = normalizeModeProgress(modes)
  for (const id of itemIds(acquiredItems)) items.add(id)
  for (const game of [...states, state].filter(Boolean)) {
    for (const id of [...getGameItemDiscoveries(game), ...(game.acquiredItemIds ?? [])]) {
      const canonical = canonicalItemId(id); if (typeof canonical === 'string' && canonical.length < 200) items.add(canonical)
    }
    for (const [key, encounter] of Object.entries(game.rivalState?.encounters ?? {})) {
      const id = key.replace(/^regional:/, '')
      if (rivalIds.has(id) && Number.isSafeInteger(encounter?.wins) && encounter.wins > 0) rivals.add(id)
    }
    if (!isMainBattleWon(game) || !game.party.some(unit => unit && !unit.isEgg && !unit.regionalSupport && unit.currentHp > 0)) continue
    mode = recordModeVictory(mode, game)
    for (const enemy of game.enemies) {
      if (enemy.rivalEncounter?.leader !== false && rivalIds.has(enemy.rivalEncounter?.profileId)) rivals.add(enemy.rivalEncounter.profileId)
      else if (!enemy.rivalEncounter && enemy.bossEncounter?.leader !== false && bossIds.has(enemy.bossEncounter?.id)) bosses.add(enemy.bossEncounter.id)
    }
  }
  const metadata = { ...old, bosses: [...bosses], rivals: [...rivals], items: [...items] }
  const next = { ...progress, achievements: metadata }
  const completed = getAchievementRows(next, { collection, trust, modes: mode, itemCatalog }).filter(a => !a.completed && (Object.hasOwn(retry.completed, a.id) || a.target > 0 && a.current >= a.target))
  const awarded = completed.reduce((sum, a) => sum + a.points, 0)
  if (awarded) { next.earned = Math.min(Number.MAX_SAFE_INTEGER, next.earned + awarded); next.achievements = { ...metadata, completed: { ...old.completed,
    ...Object.fromEntries(completed.map(a => [a.id, retry.completed[a.id] ?? (Number.isSafeInteger(now) && now >= 0 ? now : Date.now())])) } } }
  return { progress: normalizeTrainerProgress(next), awarded, completed: completed.map(a => a.id) }
}
