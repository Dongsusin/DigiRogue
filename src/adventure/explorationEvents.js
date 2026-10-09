import { getQuestRoll } from './questRisk.js'
import { MAP_EVENT_THEMES, getRegionalProfile, getRegionalChoices, resolveRegionalChoice } from './regionalEvents.js'
import { STORY_EVENT_VERSION, createStoryProgress, getEventStory, getStoryChoices, resolveStoryAction } from './storyEvents.js'

const living = state => (state.party ?? []).filter(member => !member.isEgg && member.currentHp > 0)
const eventData = state => ({ version: 3, mapName: state.currentMap,
  theme: MAP_EVENT_THEMES[state.currentMap] ?? 'town',
  species: [...new Set((state.enemies ?? []).map(unit => unit.name ?? unit.imageName).filter(Boolean))] })

export function createExplorationEvent(state, { cleared = false, totalStages = 200 } = {}) {
  const stage = state?.currentStage
  if (!cleared || !Number.isInteger(stage) || stage < 5 || stage >= totalStages || stage % 10 !== 5 ||
    state.explorationEvent || (state.lastExplorationEventStage ?? 0) >= stage ||
    state.enemies?.some(enemy => enemy.currentHp > 0) || !living(state).length) return null
  const data = eventData(state)
  return { id: `exploration-${stage}`, stage, ...data, ...createStoryProgress(state, data.theme), result: null }
}

// Pending old events enter the new story without charging anything. Claimed
// results remain untouched so reloading cannot award their contents twice.
export function upgradeExplorationEvent(state) {
  const event = state?.explorationEvent
  if (!event || (event.version === STORY_EVENT_VERSION && getEventStory(event))) return state
  if (event.result) return event.version ? state : { ...state, explorationEvent: { ...event, ...eventData(state) } }
  const data = eventData(state)
  const story = getEventStory(event)
  // Keep the same unfinished encounter, but discard its old investigation and
  // puzzle controls. Increment the revision to invalidate the old screen.
  const progress = story ? { ...event, version: STORY_EVENT_VERSION, storyId: story.id, phase: event.phase === 'battle' ? 'battle' : 'choice', revision: (event.revision ?? 0) + 1, questRoll: getQuestRoll(state) }
    : createStoryProgress(state, data.theme)
  return { ...state, explorationEvent: { id: event.id, stage: event.stage, ...data, ...progress, result: null } }
}

const legacyState = state => state.explorationEvent.version === 3 ? state
  : { ...state, explorationEvent: { ...state.explorationEvent, ...eventData(state) } }

export function getExplorationChoices(state) {
  if (!state?.explorationEvent) return []
  return state.explorationEvent.version >= 4 ? getStoryChoices(state) : getRegionalChoices(legacyState(state))
}

export function getExplorationIntro(event) {
  const episode = getEventStory(event)
  if (event.version >= 4 && episode) return { title: episode.title, story: episode.opening }
  const { title, story } = getRegionalProfile(event)
  return { title, story }
}

export function resolveExplorationChoice(state, choiceId, refreshStats) {
  const event = state?.explorationEvent
  if (!event || event.stage !== state.currentStage || event.result || (state.lastExplorationEventStage ?? 0) >= event.stage) {
    return { ok: false, state, error: '이미 처리했거나 만료된 이벤트입니다.' }
  }
  return event.version >= 4 ? resolveStoryAction(state, choiceId, refreshStats)
    : resolveRegionalChoice(legacyState(state), choiceId, refreshStats)
}
