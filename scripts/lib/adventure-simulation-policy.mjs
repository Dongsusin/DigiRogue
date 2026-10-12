// Benchmark decisions only. The shipped battle AI and player commands are unchanged.
export const SIMULATION_POLICY = 'progress-aware-v4'
const living = u => u && !u.isEgg && u.currentHp > 0
const matchup = e => (a, s, d) => e.getMatchupResult({ attackerType: a.type, skillAttribute: s.속성, defenderType: d.type, defenderAttribute: d.attribute }).multiplier
export function simulationMoves(e, unit, allies, enemies, stalledTurns = 0, ownedParty = allies) {
  const moves = e.getCommandSkillNames(unit, name => e.getSkillData(name, unit)).map(name => {
    const skill = e.getSkillData(name, unit), effect = skill?.효과
    const score = (friendly, opposing) => e.scoreSkill(unit, skill, friendly, opposing, matchup(e))
    let options
    if (effect) {
      const hostile = effect.targetSide === 'enemy'
      if (!hostile || effect.scope === 'all') {
        // Player controls supply no ally target ID. Reuse App's automatic
        // support selection rather than inventing a manually targeted buff.
        const selected = e.chooseSupportTarget({ actor: unit, action: { side: 'ally', targetId: null }, effect,
          party: ownedParty, enemies, activeAllyIds: allies.map(u => u.id) })
        const targets = (Array.isArray(selected) ? selected : [selected]).filter(Boolean)
        options = [{ targetId: null, score: targets.length ? (hostile ? score(allies, targets) : score(targets, enemies)) : 0 }]
      } else {
        options = enemies.filter(living).map(target => ({ targetId: target.id, score: score(allies, [target]) }))
      }
    } else {
      const foes = enemies.filter(living), taunter = !skill?.전체공격 && foes.find(u => u.battleGuards?.taunt > 0)
      options = skill?.전체공격 ? [{ targetId: foes[0]?.id, score: score(allies, foes) }]
        : (taunter ? [taunter] : foes).map(target => ({ targetId: target.id, score: score(allies, [target]) }))
    }
    const best = options.sort((a, b) => b.score - a.score)[0] ?? { score: 0, targetId: null }
    if (effect?.kind === 'heal' && stalledTurns >= 8) best.score *= .25
    return { name, skill, ...best }
  })
  // A ready damaging move ends defensive loops. If none can deal damage, keep
  // legal support choices and let the explicit round limit classify the result.
  const attacks = moves.filter(move => !move.skill?.효과 && move.skill?.분류 !== '보조형' && move.score > 0)
  return (stalledTurns >= 24 && attacks.length ? attacks : moves).sort((a, b) => b.score - a.score)
}
export function simulationSwitch(e, { party, activeIds, enemies, stalledTurns, usedIncomingIds }) {
  if (stalledTurns < 12) return null
  const attackScore = u => Math.max(0, ...simulationMoves(e, u, [u], enemies).filter(m => !m.skill?.효과 && m.skill?.분류 !== '보조형').map(m => m.score))
  const reserves = party.filter(u => living(u) && !activeIds.includes(u.id) && !usedIncomingIds.has(u.id))
    .sort((a, b) => attackScore(b) - attackScore(a))
  const outgoing = party.filter(u => living(u) && activeIds.includes(u.id)).sort((a, b) => attackScore(a) - attackScore(b))[0]
  const incoming = reserves[0]
  if (!incoming || !outgoing || attackScore(incoming) <= 0 || (stalledTurns < 24 && attackScore(incoming) <= attackScore(outgoing) * 1.15)) return null
  return { outgoingId: outgoing.id, incomingId: incoming.id }
}
export function applySimulationSwitch(e, party, activeIds, swap) {
  if (!swap) return { party, activeIds, actedId: null }
  const incoming = party.find(u => u.id === swap.incomingId)
  if (!living(incoming) || activeIds.includes(incoming.id) || !activeIds.includes(swap.outgoingId)) throw new Error('Illegal simulated switch')
  const nextIds = activeIds.map(id => id === swap.outgoingId ? incoming.id : id)
  // Reuse the same status/passive/cooldown step as handleSwitchPartyMember.
  return { party: e.resolveNonAttackActionEnd(party, incoming.id).nextParty, activeIds: nextIds, actedId: incoming.id }
}
