import { isStatModifierActive, mergeRegionStatModifier, REGION_EFFECT_TEXT } from './regionModifiers.js'
import { addAnalysis, canScanSpecies, getAnalysisProgress, describeAnalysisGains } from './digimonAnalysis.js'
import { getDigimonPassive } from '../data/digimonPassives.js'
import { hasAdventureItem, ADVENTURE_CONSUMABLES } from '../data/adventureItems.js'
import { getItemScanGain } from '../data/adventureItems.js'
import { getTrainerScanGain, getTrainerLuck, pickTrainerRewardItem } from '../progression/trainerSkills.js'
import { pickLuckRewardRarity } from '../progression/itemLuck.js'
import { isModeItemAllowed } from '../progression/gameModes.js'

const card = (id, name, code, description, effect, rarity = 'good', maxOwned = 8) => ({
  id, name, cardCode: code, description, effect, rarity,
  imageUrl: `/items/cards/${code}.png`, consumable: true, maxOwned,
})
const battleCardDefinitions = [
  card('card-attack', '공격 플러그인 A', 'EX2-066', '아군 한 마리의 공격 +30% · 자신의 3행동 동안.', { stats: { attack: 1.3 }, turns: 3 }),
  card('card-speed', '고속 플러그인 D', 'EX2-068', '아군 한 마리의 스피드 +30% · 자신의 3행동 동안.', { stats: { speed: 1.3 }, turns: 3 }),
  card('card-defense', '방어 플러그인 C', 'BT10-105', '아군 한 마리가 받는 물리 피해 −50% · 자신의 3행동 동안.', { guard: 'physical', turns: 3 }),
  card('card-power', '강화 플러그인 O', 'BT10-109', '아군 한 마리의 특공 +30% · 자신의 3행동 동안.', { stats: { specialAttack: 1.3 }, turns: 3 }),
  card('card-blue', '블루 카드', 'EX2-072', '적 전체의 데이터를 수집합니다. 낮은 단계·약한 종일수록 스캔율이 더 많이 증가합니다.', { scan: true }, 'common'),
  card('card-holy-wave', '홀리 웨이브', 'BT1-107', '생존 아군 한 마리의 최대 HP 40% 회복 · 상태이상 치료.', { heal: .4, cure: true }, 'rare'),
  card("card-god-breath", "갓 브레스", "BT3-105", "능력치 하락을 막습니다 · 대상의 3행동 동안.", {"guard":"stats","turns":3}, "good", 6),
  card("card-tactical", "치밀한 전술", "BT3-097", "새로운 상태이상을 막습니다 · 대상의 3행동 동안.", {"guard":"status","turns":3}, "good", 6),
  card("card-ice-wall", "얼음 빙벽!!", "EX1-068", "받는 특수 피해 −50% · 대상의 2행동 동안.", {"guard":"special","turns":2}, "good", 6),
  card("card-beast-cyclone", "수랑대회전", "BT3-106", "공격·방어 +20% · 대상의 3행동 동안.", {"stats":{"attack":1.2,"defense":1.2},"turns":3}, "good", 6),
  card("card-hidden-power", "숨겨진 힘의 발현!!", "BT3-103", "공격·특공 +35% · 대상의 2행동 동안.", {"stats":{"attack":1.35,"specialAttack":1.35},"turns":2}, "rare", 4),
  card("card-necrophobia", "네크로포비아", "BT3-110", "쓰러진 예비 디지몬 한 마리를 최대 HP의 50%로 부활시킵니다.", {"revive":0.5}, "rare", 4),
  card("card-reinforce", "리인포스 메모리 부스트!!", "BT6-100", "전투 중인 생존 아군 전체의 최대 HP 25%를 회복합니다.", {"heal":0.25,"scope":"all"}, "rare", 4),
  card("card-return-match", "리턴 매치다!", "BT3-109", "쓰러진 예비 디지몬 한 마리를 최대 HP의 25%로 부활시킵니다.", {"revive":0.25}, "good", 6),
  card("card-stop-fighting", "싸움은 그만두자", "BT3-099", "전투 중인 아군 전체의 상태이상과 능력치 하락을 해제합니다.", {"cure":true,"clearDebuffs":true,"scope":"all"}, "rare", 4),
  card("card-death-parade", "데스페라도 블래스터", "BT3-100", "적 전체의 공격·특공 −15% · 각 대상의 2행동 동안. 보스·라이벌은 효과 절반.", {"stats":{"attack":0.85,"specialAttack":0.85},"targetSide":"enemy","scope":"all","turns":2}, "rare", 4),
  card("card-positron-laser", "포지트론 레이저", "BT3-104", "적 한 마리의 스피드 −30% · 대상의 2행동 동안. 보스·라이벌은 효과 절반.", {"stats":{"speed":0.7},"targetSide":"enemy","turns":2}, "good", 6),
  card("card-laser-eye", "레이저 아이", "ST5-15", "적 한 마리의 방어·특방 −20% · 대상의 2행동 동안. 보스·라이벌은 효과 절반.", {"stats":{"defense":0.8,"specialDefense":0.8},"targetSide":"enemy","turns":2}, "rare", 4),
  card("card-emergency", "긴급 프로그램 정지!", "EX1-072", "HP가 2 이상일 때 치명적인 피해를 한 번 HP 1로 버팁니다 · 대상의 2행동 동안.", {"guard":"endure","turns":2}, "rare", 4),
  card("card-memory-boost", "블루 메모리 부스트!!", "P-036", "아군 한 마리의 기술과 공용 재사용 대기시간을 2행동 줄입니다.", {"cooldownReduction":2}, "rare", 4),
]
export const BATTLE_CARDS = battleCardDefinitions.map(item => item.effect.stats
  ? { ...item, effect: Object.fromEntries([...Object.entries(item.effect).filter(([key]) => key !== 'turns'), ['duration', 'region']]), description: item.description
    .replace(/(?:자신의 |각 대상의 |대상의 )?\d+(?:행동|턴) 동안/g, REGION_EFFECT_TEXT) }
  : item)
export const BATTLE_CONSUMABLES = [...BATTLE_CARDS, ...ADVENTURE_CONSUMABLES]
export const getBattleItemUnit = item => item.cardCode ? '장' : '개'

export const BATTLE_ITEM_CATEGORIES = ['전체', '강화', '방어', '회복', '약화', '스캔']
export function getBattleItemCategory(item) {
  const effect = item.effect
  if (effect.scan) return '스캔'
  if (effect.targetSide === 'enemy') return '약화'
  if (effect.guard) return '방어'
  if (effect.heal || effect.revive || effect.cure || effect.clearDebuffs || effect.cooldownReduction) return '회복'
  return '강화'
}

export const BATTLE_ITEM_LOOKUP = new Map(BATTLE_CONSUMABLES.map(item => [item.id, item]))
export const CARD_EFFECT_MS = 550

export function drawBattleCardDrops(inventory, count, seed, trainerSkills = {}, gameMode = 'classic') {
  const held = { ...inventory }, drops = []
  let value = seed >>> 0
  const random = () => { value = (1664525 * value + 1013904223) >>> 0; return value / 4294967296 }
  const luck = getTrainerLuck(trainerSkills)
  for (let index = 0; index < count; index++) {
    const candidates = BATTLE_CARDS.filter(item => isModeItemAllowed(item, gameMode) && (held[item.id] ?? 0) < item.maxOwned)
    if (!candidates.length) break
    // Adding more card designs does not increase the chance of a rare drop.
    const weights = [{ key: 'common', weight: 4 }, { key: 'good', weight: 8 }, { key: 'rare', weight: 1 }]
      .filter(tier => candidates.some(item => item.rarity === tier.key))
    const rarity = pickLuckRewardRarity(weights, luck, random)
    const chosen = pickTrainerRewardItem(candidates.filter(item => item.rarity === rarity), trainerSkills, random)
    drops.push(chosen.id)
    held[chosen.id] = (held[chosen.id] ?? 0) + 1
  }
  return drops
}

const living = unit => unit && !unit.isEgg && unit.currentHp > 0
const activeModifier = (unit, key) => isStatModifierActive(unit.statModifiers?.[key]) ? unit.statModifiers[key] : null
const hasStatDrops = unit => Object.values(unit.statModifiers ?? {}).some(modifier => isStatModifierActive(modifier) && modifier.multiplier < 1)
const blocksStatDrops = unit => unit.battleGuards?.stats > 0 || hasAdventureItem(unit, 'crest-hope') || getDigimonPassive(unit)?.blockStatDrops
const statFactor = (unit, multiplier) => multiplier < 1 && (unit.isBoss || unit.rivalEncounter)
  ? 1 - (1 - multiplier) / 2 : multiplier
const effectTurns = (effect, targetId, actorId) => Math.max(0, effect.turns ?? 0) + (targetId === actorId ? 1 : 0)

export function getBattleItemTargets(state, item, actorId) {
  if (!item || !isModeItemAllowed(item, state)) return []
  const effect = item.effect
  if (effect.scan) return (state.enemies ?? []).filter(living)
    .filter(unit => canScanSpecies(unit, state.unlockedSpecies) && getAnalysisProgress(state.digimonAnalysis, unit) < 100)
  const pool = effect.targetSide === 'enemy' ? state.enemies ?? [] : state.party ?? []
  const active = state.activeAllyIds ?? []
  return pool.filter(unit => {
    if (effect.revive) return unit && !unit.isEgg && unit.currentHp <= 0 && !active.includes(unit.id)
    if (!living(unit)) return false
    if (effect.scope === 'all' && effect.targetSide !== 'enemy' && !active.includes(unit.id)) return false
    const turns = effectTurns(effect, unit.id, actorId)
    return Boolean(
      (effect.heal && unit.currentHp < unit.maxHp) ||
      (effect.cure && unit.statusEffect) ||
      (effect.clearDebuffs && hasStatDrops(unit)) ||
      (effect.cooldownReduction && Object.values(unit.skillCooldowns ?? {}).some(value => value > 0)) ||
      (effect.guard && (unit.battleGuards?.[effect.guard] ?? 0) < turns) ||
      Object.entries(effect.stats ?? {}).some(([key, multiplier]) => {
        if (multiplier < 1 && blocksStatDrops(unit)) return false
        const old = activeModifier(unit, key), factor = statFactor(unit, multiplier)
        if (!old) return true
        const improves = factor < 1 ? old.multiplier > factor : old.multiplier < factor
        return improves
      })
    )
  })
}

const statLabels = { attack: '공격', defense: '방어', specialAttack: '특공', specialDefense: '특방', speed: '스피드' }
function applyCardEffect(target, effect, actorId, refreshStats) {
  const turns = effectTurns(effect, target.id, actorId), changes = {}, details = []
  let next = { ...target }
  if (effect.revive) {
    next = refreshStats({ ...next, battleGuards: {}, skillCooldowns: {} }, { statusEffect: null, statModifiers: {} })
    next.currentHp = Math.max(1, Math.floor(next.maxHp * effect.revive))
    details.push('HP ' + next.currentHp + '로 부활!')
  }
  if (effect.stats) {
    const modifiers = { ...target.statModifiers }
    for (const [key, multiplier] of Object.entries(effect.stats)) {
      if (multiplier < 1 && blocksStatDrops(target)) continue
      const factor = statFactor(target, multiplier), old = activeModifier(target, key)
      const sameDirection = old && (factor < 1 ? old.multiplier < 1 : old.multiplier > 1)
      const result = sameDirection ? (factor < 1 ? Math.min(factor, old.multiplier) : Math.max(factor, old.multiplier)) : factor
      modifiers[key] = mergeRegionStatModifier(old, result)
      details.push(statLabels[key] + ' ' + (result >= 1 ? '+' : '') + (Math.round((result - 1) * 1000) / 10) + '%')
    }
    changes.statModifiers = modifiers
  }
  if (effect.clearDebuffs) changes.statModifiers = Object.fromEntries(Object.entries(target.statModifiers ?? {})
    .filter(([, modifier]) => !(isStatModifierActive(modifier) && modifier.multiplier < 1)))
  if (effect.cure) changes.statusEffect = null
  if (Object.keys(changes).length) next = refreshStats(next, changes)
  if (effect.guard) next.battleGuards = { ...target.battleGuards, [effect.guard]: Math.max(turns, target.battleGuards?.[effect.guard] ?? 0) }
  if (effect.cooldownReduction) {
    next.skillCooldowns = Object.fromEntries(Object.entries(target.skillCooldowns ?? {})
      .map(([key, value]) => [key, Math.max(0, value - effect.cooldownReduction)]).filter(([, value]) => value > 0))
    details.push('기술 재사용 대기시간 −' + effect.cooldownReduction)
  }
  if (effect.heal) {
    const amount = Math.min(next.maxHp - target.currentHp, Math.max(1, Math.floor(next.maxHp * effect.heal)))
    next.currentHp = target.currentHp + amount
    if (amount > 0) details.push('HP ' + amount + ' 회복')
  }
  if (effect.cure && target.statusEffect) details.push('상태이상 해제')
  if (effect.clearDebuffs && hasStatDrops(target)) details.push('능력치 하락 해제')
  return { next, details }
}

export function resolveBattleConsumable(state, { itemId, actorId, targetId }, refreshStats) {
  const item = BATTLE_ITEM_LOOKUP.get(itemId)
  const actor = state.party?.find(unit => unit.id === actorId)
  const fail = error => ({ ok: false, state, error })
  if (!item || !isModeItemAllowed(item, state) || !(state.inventory?.[itemId] > 0) || !living(actor) || !state.activeAllyIds?.includes(actorId) ||
    state.awaitingReplacement || state.actedAllyIds?.includes(actorId)) return fail('지금은 사용할 수 없습니다.')
  const candidates = getBattleItemTargets(state, item, actorId)
  const effect = item.effect, affectsAll = effect.scan || effect.scope === 'all'
  const targets = affectsAll ? candidates : candidates.filter(unit => unit.id === targetId)
  if (!targets.length) return fail('효과를 받을 수 있는 대상을 선택하세요.')
  const inventory = { ...state.inventory, [itemId]: state.inventory[itemId] - 1 }
  const logs = [actor.name + '에게 명령! ' + item.name + (item.cardCode ? ' 카드 슬래시!' : ' 사용!')]
  let analysis = state.digimonAnalysis, party = state.party, enemies = state.enemies
  if (effect.scan) {
    const scanned = addAnalysis(analysis, targets, target => getTrainerScanGain(state.trainerSkills, getItemScanGain(inventory, 25), target, 'card'), state.unlockedSpecies)
    analysis = scanned.analysis
    logs.push(...describeAnalysisGains(scanned.gains))
  } else {
    const updated = new Map()
    for (const target of targets) {
      const { next, details } = applyCardEffect(target, effect, actorId, refreshStats)
      updated.set(target.id, next)
      logs.push(target.name + ': ' + (details.length ? details.join(' · ') : item.description))
    }
    if (effect.targetSide === 'enemy') enemies = enemies.map(unit => updated.get(unit.id) ?? unit)
    else party = party.map(unit => updated.get(unit.id) ?? unit)
  }
  return { ok: true, item, targetIds: targets.map(unit => unit.id), targetSide: effect.scan || effect.targetSide === 'enemy' ? 'enemy' : 'ally', logs,
    state: { ...state, party, enemies, player: party.find(unit => unit.id === state.player?.id) ?? state.player, inventory, digimonAnalysis: analysis } }
}
