import { getDigimonPassive } from '../data/digimonPassives.js'
import { describePassiveState, describePassiveEffect } from '../battle/passives.js'
import './PassiveAbility.css'

export default function PassiveAbility({ combatant, showState = false }) {
  const passive = getDigimonPassive(combatant)
  if (!passive) return null
  return <section className="passive-ability" aria-label="디지몬 특성">
    <div className="passive-ability__heading"><span>특성</span><strong>{passive.name}</strong>
      {showState && <small>{describePassiveState(combatant)}</small>}
    </div>
    <p>{describePassiveEffect(combatant)}</p>
  </section>
}
