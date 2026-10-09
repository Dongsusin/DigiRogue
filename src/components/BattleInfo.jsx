import { useEffect, useRef, useState } from 'react'
import { BATTLE_HISTORY_LIMIT, describeMatchup, getCombatantEffects } from '../battle/battleInfo.js'
import GameDialog from './GameDialog.jsx'
import StatusConditionBadge from './StatusConditionBadge.jsx'

export function MatchupBadge({ multiplier }) {
  const matchup = describeMatchup(multiplier)
  return <span className={`matchup-badge matchup-badge--${matchup.kind}`}>{matchup.text}</span>
}

export function TargetMatchups({ targets, support, skillName }) {
  return <section className="target-matchups" aria-label={`${skillName} 대상별 상성`}>
    <h3>대상별 상성</h3>
    {support ? <p>보조 기술은 피해 상성을 적용하지 않습니다.</p> : <>
      <ul>{targets.map(target => <li key={target.id}><span>{target.name}</span><MatchupBadge multiplier={target.multiplier} /></li>)}</ul>
      <p>타입·속성의 피해 배율입니다. 명중, 방어력, 특성, 아이템 효과는 별도로 적용됩니다.</p>
    </>}
  </section>
}

export function CombatantEffects({ combatant, statusDuration, onInspect }) {
  const effects = getCombatantEffects(combatant, statusDuration)
  if (!effects.length) return <span className="combatant-effects combatant-effects--empty">지속 효과 없음</span>
  if (effects[0].kind === 'status') return <div className="combatant-effects-row">
    <StatusConditionBadge combatant={combatant} duration={statusDuration} showDuration />
    <button type="button" className="combatant-effects" onClick={onInspect}
      aria-label={`${combatant.name} 지속 효과 ${effects.length}개 보기`} aria-haspopup="dialog">
      {effects.length > 1 && <span className="combatant-effects__more">+{effects.length - 1}</span>}
      <span className="combatant-effects__info" aria-hidden="true">ⓘ</span>
    </button>
  </div>
  return <button type="button" className="combatant-effects" onClick={onInspect}
    aria-label={`${combatant.name} 지속 효과 ${effects.length}개 보기`} aria-haspopup="dialog">
    <span className={`effect-chip effect-chip--${effects[0].kind}`}>{effects[0].label} <b>{effects[0].duration}</b></span>
    {effects.length > 1 && <span className="combatant-effects__more">+{effects.length - 1}</span>}
    <span className="combatant-effects__info" aria-hidden="true">ⓘ</span>
  </button>
}

export function CombatantEffectsDialog({ combatant, statusDuration, onClose }) {
  const effects = getCombatantEffects(combatant, statusDuration)
  return <GameDialog title={`${combatant.name}의 지속 효과`} eyebrow="BATTLE STATUS" onClose={onClose}>
    {effects.length ? <ul className="effect-details">{effects.map(effect => <li key={effect.id}>
      <div>{effect.kind === 'status' ? <StatusConditionBadge combatant={combatant} duration={statusDuration} />
        : <strong className={`effect-chip effect-chip--${effect.kind}`}>{effect.label}</strong>}<b>{effect.duration}</b></div>
      <p>{effect.detail}</p>
    </li>)}</ul> : <p>현재 적용 중인 지속 효과가 없습니다.</p>}
  </GameDialog>
}

export function BattleHistory({ history, onClose }) {
  const [filter, setFilter] = useState('all')
  const listRef = useRef(null)
  const stages = [...new Set(history.map(entry => entry.stage))].reverse()
  const entries = filter === 'all' ? history : history.filter(entry => entry.stage === Number(filter))
  useEffect(() => { const list = listRef.current; if (list) list.scrollTop = list.scrollHeight }, [filter])
  return <GameDialog title="지난 전투 기록" eyebrow="BATTLE HISTORY" onClose={onClose}
    footer={<p>이번 실행에서 실제로 표시된 최근 {BATTLE_HISTORY_LIMIT}개 메시지를 보관합니다.</p>}>
    <label className="battle-history__filter">스테이지 <select value={filter} onChange={event => setFilter(event.target.value)}>
      <option value="all">전체 기록</option>{stages.map(stage => <option key={stage} value={stage}>STAGE {stage}</option>)}
    </select></label>
    <ol className="battle-history__list" ref={listRef} tabIndex={0} aria-label="지난 전투 메시지">
      {entries.map(entry => <li key={entry.id}><span>STAGE {entry.stage}</span><p>{entry.text}</p></li>)}
    </ol>
    {!entries.length && <p>표시된 전투 기록이 없습니다.</p>}
  </GameDialog>
}
