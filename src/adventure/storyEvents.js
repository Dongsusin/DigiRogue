import { isSpecialQuestEligible } from './specialQuests.js'
import { EVOLUTION_ITEM_LOOKUP } from '../data/evolutionItems.js'
import { getQuestRisk, getQuestRoll, failedQuestChoice } from './questRisk.js'
import { getRegionalTrust, updateRegionalTrust } from '../battle/regionalSupport.js'
import { EVENT_STORIES, EVENT_STORY_LOOKUP } from './eventStories.js'
import { recoverAfterVictory } from '../balance/combat.js'
import { addAnalysis, canScanSpecies, describeAnalysisGains, removeCaptureItems } from '../battle/digimonAnalysis.js'
import { ADVENTURE_UTILITY_ITEMS } from '../data/adventureItems.js'
import { getEventBattlePreview } from './eventBattles.js'
import { createDungeonSpec } from './dungeons.js'
import { BATTLE_ITEM_LOOKUP, drawBattleCardDrops } from '../battle/battleItems.js'
import { getTrainerScanGain } from '../progression/trainerSkills.js'
import { isDailyMode, isModeItemAllowed } from '../progression/gameModes.js'

const stats = { attack: '공격', specialAttack: '특공', defense: '방어', specialDefense: '특방', speed: '스피드' }
const spiritFor = { 화염: 'fire', 물: 'water', 얼음: 'ice', 나무: 'wood', 번개: 'thunder', 강철: 'steel', 바람: 'wind', 흙: 'earth', 빛: 'light', 어둠: 'dark' }
const living = state => (state.party ?? []).filter(unit => unit && !unit.isEgg && unit.currentHp > 0)
const bounded = value => Math.min(3, Math.max(0, Number(value) || 0))
export const getEventStory = event => EVENT_STORY_LOOKUP.get(event?.storyId)
export const STORY_EVENT_VERSION = 7

export function createStoryProgress(state, theme, random = Math.random) {
  const memory = state.eventMemory ?? {}
  const special = EVENT_STORIES.filter(story => story.special && story.themes.includes(theme) && isSpecialQuestEligible(state, story))
  if (special.length && random() < .18) {
    const selected = special[Math.min(special.length - 1, Math.floor(Math.max(0, Math.min(.999999, random())) * special.length))]
    return { version: STORY_EVENT_VERSION, storyId: selected.id, phase: 'choice', revision: 0, questRoll: Math.min(.999999999, Math.max(0, random())) }
  }
  const eligible = EVENT_STORIES.filter(story => !story.special && story.theme === theme &&
    (!story.maps || story.maps.includes(state.currentMap)) &&
    (!story.requiresFlag || memory.flags?.[story.requiresFlag]))
  const followup = eligible.find(story => story.requiresFlag && !memory.seen?.[story.id])
  const bond = getRegionalTrust(state) < 2 ? eligible.find(story => story.id.startsWith('regional-bond-') && !memory.seen?.[story.id]) : null
  const dungeon = state.currentStage % 20 === 5 ? eligible.find(story => story.dungeon && !memory.seen?.[story.id]) : null
  const candidates = eligible.filter(story => !story.requiresFlag)
  const leastSeen = Math.min(...candidates.map(story => memory.seen?.[story.id] ?? 0))
  const unseen = candidates.filter(story => (memory.seen?.[story.id] ?? 0) === leastSeen)
  const local = unseen.filter(story => story.maps)
  const pool = local.length ? local : unseen
  const selected = followup ?? bond ?? dungeon ?? pool[Math.min(pool.length - 1, Math.floor(Math.max(0, Math.min(.999999, random())) * pool.length))]
  return { version: STORY_EVENT_VERSION, storyId: selected.id, phase: 'choice', revision: 0, questRoll: Math.min(.999999999, Math.max(0, random())) }
}

// Old local saves retain NPC discounts and can recover regional trust from their journal.
export function upgradeRegionalTrustMemory(memory = {}) {
  let next = memory
  for (const entry of memory.journal ?? []) {
    if (Object.hasOwn(memory.regions ?? {}, entry.mapName)) continue
    const route = EVENT_STORY_LOOKUP.get(entry.storyId)?.routes.find(choice => choice.id === entry.choiceId)
    if (route?.regionTrust || route?.trust) next = updateRegionalTrust(next, entry.mapName, route.regionTrust ?? route.trust)
  }
  return next
}

export function getEventPartners(state) {
  const story = getEventStory(state.explorationEvent)
  return living(state).map(member => {
    const attribute = member.attribute ?? member.speciesData?.속성
    const spirit = story?.specialties.find(type => member.battleItems?.[`beast-spirit-${spiritFor[type]}`] > 0)
    const natural = story?.specialties.includes(attribute)
    return { id: member.id, name: member.name, currentHp: member.currentHp, maxHp: member.maxHp,
      expert: Boolean(natural || spirit), reason: natural ? `${attribute} 속성` : spirit ? `${spirit} 스피릿` : '함께 돕기' }
  })
}

export function getStoryChoices(state) {
  const event = state.explorationEvent, story = getEventStory(event)
  if (!story || event.result || event.phase !== 'choice') return []
  const members = getEventPartners(state)
  const trust = bounded(state.eventMemory?.contacts?.[story.npc])
  const discount = (1 - trust * .05) * (state.inventory?.['d-terminal'] > 0 ? .8 : 1)
  return story.routes.filter(route => !isDailyMode(state) || !(route.analysis || route.egg || route.eggProgress ||
    (route.items ?? []).some(id => !isModeItemAllowed({ id }, state)))).map(route => {
    // Pick a suitable, healthy helper automatically. The offer and commit use
    // this same calculation, so the named member pays exactly the displayed HP.
    const candidates = members.filter(unit => !route.expert || unit.expert)
      .sort((a, b) => b.currentHp / b.maxHp - a.currentHp / a.maxHp || b.currentHp - a.currentHp)
    const partner = candidates.find(unit => unit.currentHp > Math.ceil(unit.maxHp * (route.hpCost ?? 0))) ?? candidates[0]
    const goldCost = Math.round((route.goldCost ?? 0) * (100 + Math.floor(event.stage / 10) * 30) * discount)
    const goldReward = Math.round((route.goldReward ?? 0) * (300 + event.stage * 20))
    const hpCost = partner ? Math.ceil(partner.maxHp * (route.hpCost ?? 0)) : 0
    const effects = [], costs = [], requirements = []
    let disabledReason = story.special && !isSpecialQuestEligible(state, story) ? '특수 의뢰의 디지몬·진행 조건을 충족해야 합니다.' : ''
    if (route.expert) {
      if (partner) requirements.push(`${partner.name}이 돕습니다 · ${partner.reason}`)
      else disabledReason = `${story.specialties.join('·')} 속성 또는 해당 스피릿을 지닌 생존 동료가 필요합니다.`
    }
    if (route.item && !(state.inventory?.[route.item] > 0)) disabledReason = 'D-스캐너가 필요합니다.'
    if (route.egg && !state.party?.some(unit => unit.isEgg && unit.eggStagesRemaining > 1)) disabledReason = '부화까지 2스테이지 이상 남은 디지에그가 필요합니다.'
    const reviveTarget = route.revive ? state.party?.find(unit => !unit.isEgg && unit.currentHp <= 0) : null
    if (route.revive && !reviveTarget) disabledReason = '쓰러진 동료가 없습니다.'
    const rewardItems = (route.items ?? []).map(id => ADVENTURE_UTILITY_ITEMS.find(item => item.id === id) ?? BATTLE_ITEM_LOOKUP.get(id) ?? EVOLUTION_ITEM_LOOKUP.get(id)).filter(Boolean)
    if (rewardItems.some(item => (item.unique || story.special) && state.inventory?.[item.id] >= (item.maxOwned ?? 99))) disabledReason = '이 장비는 이미 보유하고 있습니다.'
    if (goldCost) {
      costs.push(`${goldCost.toLocaleString('ko-KR')} G`)
      if ((state.gold ?? 0) < goldCost) disabledReason = '골드가 부족합니다.'
      if (discount < 1) requirements.push(`신뢰·D-터미널 할인 ${Math.round((1 - discount) * 100)}% 적용`)
    }
    if (route.hpCost) {
      costs.push(partner ? `${partner.name} HP −${hpCost}` : `동료 최대 HP의 ${Math.round(route.hpCost * 100)}% 소모`)
      if (!partner || partner.currentHp <= hpCost) disabledReason ||= '체력을 소모하고도 버틸 수 있는 동료가 없습니다.'
    }
    if (!members.length) disabledReason = '전투 가능한 동료가 없습니다.'
    if (route.heal) effects.push(`생존 동료 최대 HP의 ${Math.round(route.heal * 100)}% 회복 · 상태 치료`)
    if (route.stats) effects.push(`생존 동료 ${route.stats.map(key => stats[key]).join('·')} +10% · ${route.stages}회 전투 클리어`)
    if (route.analysis) {
      const targets = (route.analysisSpecies ?? event.species ?? []).filter(name => canScanSpecies(name, state.unlockedSpecies))
      const { gains } = addAnalysis(state.digimonAnalysis, targets,
        target => getTrainerScanGain(state.trainerSkills, route.analysis, target, 'event'), state.unlockedSpecies)
      effects.push(...gains.map(entry => `${entry.name} 스캔 +${entry.gain}%p`))
    }
    if (goldReward) effects.push(`${goldReward.toLocaleString('ko-KR')} G 획득`)
    if (route.eggProgress) effects.push('디지에그 부화 대기 −1스테이지 (최소 1)')
    if (reviveTarget) effects.push(`${reviveTarget.name} 부활 · 최대 HP의 ${Math.round(route.revive * 100)}%`)
    rewardItems.forEach(item => effects.push(`${item.name} 1${item.consumable ? '장' : '개'} 획득${state.inventory?.[item.id] >= item.maxOwned ? ' (보유 한도)' : ''}`))
    if (route.randomCards) effects.push(`무작위 전투 카드 ${route.randomCards}장 획득 (보유 한도 적용)`)
    if (route.flag) effects.push('다음 만남에 후속 이야기 해금')
    if (route.trust > 0) effects.push(`${story.npc} 신뢰 +${route.trust}`)
    if (route.trust < 0) effects.push(`${story.npc} 신뢰 ${route.trust}`)
    const regionDelta = route.regionTrust ?? route.trust ?? 0
    if (regionDelta) effects.push('지역 신뢰 ' + (regionDelta > 0 ? '+' : '') + regionDelta)
    const risk = getQuestRisk(state, story, route)
    const battle = route.battle?.dungeon ? createDungeonSpec(state) : route.battle
    const battlePreview = battle ? getEventBattlePreview(state, battle) : null
    return { ...route, ...risk, battle, goldCost, goldReward, hpCost, partnerId: partner?.id, reviveTargetId: reviveTarget?.id, rewardItems, battlePreview, disabledReason,
      cost: costs.join(' · ') || '소모 없음', description: effects.join(' / '),
      preview: requirements.join(' · '), tag: route.battle ? `${battlePreview.formation} 전투` : route.expert ? '동료 특기' : route.trust < 0 ? '관계 변화' : story.kind }
  })
}

export function getStoryView(state) {
  const event = state.explorationEvent, story = getEventStory(event)
  if (!story) return null
  return { ...story, trust: bounded(state.eventMemory?.contacts?.[story.npc]),
    journal: (state.eventMemory?.journal ?? []).slice(-5).reverse() }
}

export function resolveStoryAction(state, command, refreshStats) {
  const event = state.explorationEvent, story = getEventStory(event)
  const fail = error => ({ ok: false, state, error })
  if (!story || event.result || !command || typeof command !== 'object' || command.eventId !== event.id || command.revision !== event.revision) {
    return fail('화면이 갱신되었습니다. 현재 장면에서 다시 선택하세요.')
  }
  const { id, value } = command
  const leaving = id === 'leave'
  if (event.phase !== 'choice' || (!leaving && id !== 'resolve')) return fail('지금은 실행할 수 없는 행동입니다.')
  const choice = leaving ? { id: 'leave', title: '여정을 계속하기', ending: '상황을 기록해 두고 길을 나섰다. 이번에는 손을 보태지 못했지만, 이곳의 이야기는 기억에 남았다.' }
    : getStoryChoices(state).find(route => route.id === value)
  if (!choice || choice.disabledReason) return fail(choice?.disabledReason ?? '선택할 수 없는 방법입니다.')

  if (choice.battle) {
    const entranceChanges = [], entranceLogs = []
    const gold = (state.gold ?? 0) - choice.goldCost
    if (choice.goldCost) {
      entranceChanges.push({ label: '참가 비용', value: `${state.gold} → ${gold} G`, kind: 'cost' })
      entranceLogs.push(`${choice.goldCost} G 사용.`)
    }
    const party = state.party.map(member => {
      if (member.id !== choice.partnerId || !choice.hpCost) return member
      entranceChanges.push({ label: member.name, value: `HP ${member.currentHp} → ${member.currentHp - choice.hpCost}`, kind: 'cost' })
      return { ...member, currentHp: member.currentHp - choice.hpCost }
    })
    return { ok: true, requestBattle: true, logs: [`${story.title} · 전투 시작!`, ...entranceLogs], sound: 'send-out',
      state: { ...state, gold, party, player: party.find(member => member.id === state.player.id) ?? state.player,
        explorationEvent: { ...event, revision: event.revision + 1, phase: 'battle',
          battle: { routeId: choice.id, spec: choice.battle, goldReward: choice.goldReward,
            ...(choice.randomCards ? { cardDropSeed: Math.floor(Math.random() * 4294967296) } : {}),
            partnerId: choice.partnerId, entranceChanges, entranceLogs } } } }
  }
  const risk = choice.successChance != null
  const attempt = risk && getQuestRoll(state) * 100 >= choice.successChance ? failedQuestChoice(choice, story) : { ...choice, success: leaving ? null : true }
  return applyStoryOutcome(state, attempt, refreshStats)
}

// A result is awarded only after the real enemy roster has been defeated. Escaping
// records the unfinished attempt without granting the promised reward or flag.
export function completeStoryBattle(state, refreshStats, { escaped = false, defeated = false } = {}) {
  const event = state.explorationEvent, story = getEventStory(event), pending = event?.battle
  const fail = () => ({ ok: false, state })
  if (!story || event.phase !== 'battle' || event.result || event.stage !== state.currentStage || !pending?.enemyIds?.length ||
    (state.lastExplorationEventStage ?? 0) >= event.stage || (defeated ? living(state).length > 0 : !living(state).length)) return fail()
  const route = story.routes.find(candidate => candidate.id === pending.routeId && candidate.battle)
  if (!route || (!escaped && !defeated && (state.enemies?.length !== pending.enemyIds.length ||
    pending.enemyIds.some(id => !state.enemies.some(unit => unit.id === id)) ||
    state.enemies.some(unit => !pending.enemyIds.includes(unit.id) || unit.currentHp > 0)))) return fail()
  const nextWave = (pending.waveIndex ?? 0) + 1
  if (!escaped && !defeated && pending.spec.waves?.[nextWave]) return { ok: true, continueBattle: true,
    state: { ...state, explorationEvent: { ...event, revision: event.revision + 1,
      battle: { ...pending, waveIndex: nextWave, enemyIds: [] } } } }
  const choice = escaped || defeated ? { ...failedQuestChoice({ ...route, goldCost: 0, hpCost: 0 }, story),
    id: route.id + (escaped ? '-escaped' : '-failed'), title: escaped ? '의뢰 중단 · 안전하게 철수' : '의뢰 실패 · 전멸' }
    : { ...route, success: true, goldCost: 0, hpCost: 0, goldReward: pending.goldReward, partnerId: pending.partnerId,
      items: [...(route.items ?? []), ...drawBattleCardDrops(state.inventory, route.randomCards ?? 0, pending.cardDropSeed, state.trainerSkills, state.gameMode)] }
  const result = applyStoryOutcome(state, choice, refreshStats, pending.entranceChanges, pending.entranceLogs)
  const recovery = escaped || defeated ? { nextParty: result.state.party, battleLogs: [] }
    : recoverAfterVictory(result.state.party, false, state.activeAllyIds, { equipmentOnly: true })
  const visibleIds = state.activeAllyIds == null ? null : new Set(state.activeAllyIds)
  const recoveryChanges = recovery.nextParty.flatMap((unit, index) => {
    const previousHp = result.state.party[index]?.currentHp
    if (!unit || unit.currentHp <= previousHp || (visibleIds && !visibleIds.has(unit.id))) return []
    return [{ label: unit.name + ' · D-아크', value: 'HP ' + previousHp + ' → ' + unit.currentHp, kind: 'good' }]
  })
  const completedEvent = result.state.explorationEvent
  return { ...result, recoveryLogs: recovery.battleLogs, logs: [...result.logs, ...recovery.battleLogs], state: { ...result.state,
    party: recovery.nextParty, player: recovery.nextParty.find(unit => unit.id === result.state.player?.id) ?? result.state.player,
    explorationEvent: { ...completedEvent, result: { ...completedEvent.result,
      logs: [...completedEvent.result.logs, ...recovery.battleLogs],
      changes: [...completedEvent.result.changes, ...recoveryChanges] } },
    ...(escaped ? { enemies: [] } : {}), awaitingReplacement: false,
    actedAllyIds: [], pendingAllyActions: [], escapeAttempts: 0, rewardCheckpoint: null } }
}

function applyStoryOutcome(state, choice, refreshStats, entranceChanges = [], entranceLogs = []) {
  const event = state.explorationEvent, story = getEventStory(event)

  const logs = [...entranceLogs], changes = [...entranceChanges]
  const party = state.party.map(member => {
    if (member.isEgg) {
      if (!choice.eggProgress || member.eggStagesRemaining <= 1) return member
      const remaining = Math.max(1, member.eggStagesRemaining - choice.eggProgress)
      changes.push({ label: member.name, value: `부화까지 ${member.eggStagesRemaining} → ${remaining}스테이지`, kind: 'good' })
      logs.push(`${member.name}: 부화 대기 ${member.eggStagesRemaining} → ${remaining}스테이지`)
      return { ...member, eggStagesRemaining: remaining }
    }
    if (member.currentHp <= 0) {
      if (member.id !== choice.reviveTargetId || !choice.revive) return member
      const currentHp = Math.max(1, Math.floor(member.maxHp * choice.revive))
      changes.push({ label: member.name, value: `부활 · HP 0 → ${currentHp}`, kind: 'good' })
      logs.push(`${member.name}이(가) HP ${currentHp}로 돌아왔다.`)
      return { ...member, currentHp, statusEffect: null }
    }
    let next = { ...member }
    if (member.id === choice.partnerId && choice.hpCost) next.currentHp -= choice.hpCost
    if (choice.heal) {
      next.currentHp = Math.min(member.maxHp, next.currentHp + Math.max(1, Math.floor(member.maxHp * choice.heal)))
      next.statusEffect = null
    }
    if (next.currentHp !== member.currentHp || (member.statusEffect && !next.statusEffect)) {
      const value = `HP ${member.currentHp} → ${next.currentHp}${member.statusEffect && !next.statusEffect ? ' · 상태 치료' : ''}`
      changes.push({ label: member.name, value, kind: next.currentHp >= member.currentHp ? 'good' : 'cost' })
      logs.push(`${member.name}: ${value}`)
    }
    if (choice.stats) {
      const activeBuffs = { ...member.activeBuffs }
      for (const key of choice.stats) activeBuffs[key] = Math.max(activeBuffs[key] ?? 0, choice.stages)
      next = refreshStats(next, { activeBuffs })
    }
    return next
  })
  const gold = (state.gold ?? 0) - (choice.goldCost ?? 0) + (choice.goldReward ?? 0)
  if (choice.goldCost) logs.push(`${choice.goldCost} G 사용.`)
  if (choice.goldReward) logs.push(`${choice.goldReward} G 획득!`)
  if (gold !== state.gold) changes.push({ label: '골드', value: `${state.gold ?? 0} → ${gold} G`, kind: gold >= (state.gold ?? 0) ? 'good' : 'cost' })
  if (choice.stats) {
    const value = `${choice.stats.map(key => stats[key]).join('·')} +10% · 최소 ${choice.stages}회 전투 클리어`
    changes.push({ label: '생존 동료 강화', value, kind: 'good' }); logs.push(value)
  }
  const analysis = addAnalysis(state.digimonAnalysis, choice.analysis ? choice.analysisSpecies ?? event.species : [],
    target => getTrainerScanGain(state.trainerSkills, choice.analysis ?? 0, target, 'event'), state.unlockedSpecies)
  const analysisLogs = describeAnalysisGains(analysis.gains)
  logs.push(...analysisLogs)
  analysisLogs.forEach(value => changes.push({ label: '관측 기록', value, kind: 'good' }))
  const oldMemory = state.eventMemory ?? {}, oldTrust = bounded(oldMemory.contacts?.[story.npc])
  const recorded = (state.trustReceipts?.[state.trainerRunId] ?? 0) >= event.stage
  const npcDelta = story.special || recorded ? 0 : choice.trust ?? 0
  const regionDelta = story.special || recorded ? 0 : choice.regionTrust ?? choice.trust ?? 0
  const trust = bounded(oldTrust + npcDelta)
  if (trust !== oldTrust) {
    changes.push({ label: story.npc, value: `신뢰 ${oldTrust} → ${trust}`, kind: trust > oldTrust ? 'good' : 'cost' })
    logs.push(`${story.npc} 신뢰 ${oldTrust} → ${trust}${trust > oldTrust ? ' · 다음 유료 의뢰에서 신뢰 할인이 적용된다.' : ''}`)
  }
  const oldRegionTrust = getRegionalTrust(state, event.mapName)
  const regionMemory = regionDelta ? updateRegionalTrust(oldMemory, event.mapName, regionDelta) : oldMemory
  const regionTrust = getRegionalTrust({ eventMemory: regionMemory }, event.mapName)
  if (regionTrust !== oldRegionTrust) {
    const promise = regionTrust >= 2 && !regionMemory.regions[event.mapName].aidUsed ? ' · 다음 단독 보스전에 지역 동료가 한 번 도와준다.' : ''
    changes.push({ label: event.mapName, value: '지역 신뢰 ' + oldRegionTrust + ' → ' + regionTrust, kind: regionTrust > oldRegionTrust ? 'good' : 'cost' })
    logs.push(event.mapName + ' 지역 신뢰 ' + oldRegionTrust + ' → ' + regionTrust + promise)
  }
  if (choice.flag) { changes.push({ label: '이어지는 인연', value: '같은 지역 계열에서 후속 이야기가 열립니다.', kind: 'good' }); logs.push('다음 만남으로 이어질 약속을 남겼다.') }
  const inventory = removeCaptureItems(state.inventory)
  for (const id of choice.items ?? []) {
    const item = ADVENTURE_UTILITY_ITEMS.find(candidate => candidate.id === id) ?? BATTLE_ITEM_LOOKUP.get(id) ?? EVOLUTION_ITEM_LOOKUP.get(id)
    if (!item) continue
    const previous = inventory[id] ?? 0
    inventory[id] = Math.min(item.maxOwned ?? 99, previous + 1)
    const gained = inventory[id] - previous
    changes.push({ label: item.evolutionItemFor ? '진화 아이템' : item.consumable ? '획득 카드' : '획득 장비', value: `${item.name}${gained ? '' : ' · 보유 한도 도달'}`, kind: 'good' })
    logs.push(gained ? `${item.name}을(를) 받았다!` : `${item.name}: 보유 한도에 도달했다.`)
  }
  const journalEntry = { stage: event.stage, mapName: event.mapName, storyId: story.id, title: story.title,
    npc: story.npc, choiceId: choice.id, choiceTitle: choice.title, ending: choice.ending, success: choice.success ?? null, partnerName: party.find(unit => unit.id === choice.partnerId)?.name }
  const eventMemory = { ...regionMemory, seen: { ...oldMemory.seen, [story.id]: (oldMemory.seen?.[story.id] ?? 0) + 1 },
    contacts: npcDelta ? { ...oldMemory.contacts, [story.npc]: trust } : { ...oldMemory.contacts },
    flags: { ...oldMemory.flags, ...(choice.flag ? { [choice.flag]: true } : {}) },
    journal: [...(oldMemory.journal ?? []), journalEntry].slice(-20) }
  return { ok: true, logs: [choice.ending, ...logs], sound: choice.heal ? 'heal' : choice.stats ? 'buff' : 'item',
    state: { ...state, gold, party, player: party.find(unit => unit.id === state.player?.id) ?? state.player,
      inventory, digimonAnalysis: analysis.analysis, eventMemory,
      lastExplorationEventStage: event.stage, explorationEvent: { ...event, revision: event.revision + 1, phase: 'result',
        result: { choiceId: choice.id, title: choice.title, ending: choice.ending, success: choice.success ?? null, changes, logs,
          trustChange: { runId: state.trainerRunId, stage: event.stage, mapName: event.mapName, npc: story.npc,
            regionDelta, npcDelta } } } } }
}
