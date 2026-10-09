// Readiness is obtained from the actual evolution rules, never from level alone.
export function getPartyEvolutionProgress(party, inventory, getTargets, getStats, evolutionMemory = []) {
  return (party ?? []).filter(member => member && !member.isEgg).map(member => ({
    id: member.id, name: member.name, level: member.level,
    stats: getStats(member), targets: getTargets(member, inventory, party, evolutionMemory),
  }))
}

export function getNewLevelEvolutionTargets(previous = [], current = []) {
  const before = new Map(previous.map(member => [member.id, member]))
  return current.flatMap(member => {
    const old = before.get(member.id)
    if (!old || old.name !== member.name || member.level <= old.level) return []
    const known = new Set(old.targets.map(target => target.name))
    return member.targets.filter(target => !known.has(target.name)).map(target => ({
      ...target, sourceId: member.id, sourceName: member.name,
    }))
  })
}
