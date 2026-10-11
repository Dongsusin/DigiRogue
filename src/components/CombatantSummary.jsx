import DigimonLevel from './DigimonLevel.jsx'
import './CombatantSummary.css'

export function CombatantTraits({ combatant, className = '' }) {
  if (!combatant || combatant.isEgg) return null
  return <span className={'combatant-traits ' + className}>
    <span className="combatant-traits__type" aria-label={'타입 ' + (combatant.type ?? '불명')}>{combatant.type ?? '불명'}</span>
    <span className="combatant-traits__attribute" aria-label={'속성 ' + (combatant.attribute ?? '불명')}>{combatant.attribute ?? '불명'}</span>
  </span>
}

export default function CombatantSummary({ combatant, levelCap }) {
  if (!combatant) return null
  const hp = Math.max(0, combatant.currentHp ?? 0), maxHp = Math.max(1, combatant.maxHp ?? 1)
  return <div className="combatant-summary">
    <img className="combatant-summary__portrait" src={combatant.imageUrl} alt="" />
    <div className="combatant-summary__details">
      <div className="combatant-summary__heading"><strong>{combatant.name}</strong>
        {!combatant.isEgg && <DigimonLevel level={combatant.level} levelCap={levelCap} />}</div>
      {combatant.isEgg ? <span className="combatant-summary__egg">디지에그 · 부화까지 {Math.max(0, combatant.eggStagesRemaining ?? 0)}스테이지</span> : <>
        <CombatantTraits combatant={combatant} />
        <div className="combatant-summary__hp" role="progressbar" aria-label={combatant.name + ' 체력'} aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp}>
          <span style={{ width: Math.min(100, hp / maxHp * 100) + '%' }} /></div>
        <span className="combatant-summary__hp-text">HP {hp} / {maxHp}</span>
      </>}
    </div>
  </div>
}
