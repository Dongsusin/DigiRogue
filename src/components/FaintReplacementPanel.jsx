import { CombatantTraits } from './CombatantSummary.jsx'
import DigimonLevel from './DigimonLevel.jsx'
import { useEffect, useRef } from 'react'
import './FaintReplacementPanel.css'

export default function FaintReplacementPanel({ party, activeAllyIds, replacement, onSelect, onInspect, levelCap }) {
  const panelRef = useRef(null)
  const faintedId = replacement.faintedIds[0]
  const fainted = party.find(member => member.id === faintedId)
  const candidateIds = new Set(replacement.candidates.map(member => member.id))

  useEffect(() => {
    panelRef.current?.querySelector('button:not(:disabled)')?.focus({ preventScroll: true })
  }, [faintedId])

  const handleKeyDown = event => {
    // Escape opens the game's save confirmation; it never selects or
    // dismisses this mandatory replacement on its own.
    if (event.key !== 'Tab') return
    const buttons = [...panelRef.current.querySelectorAll('button:not(:disabled)')]
    const first = buttons[0], last = buttons.at(-1)
    if (event.shiftKey && event.target === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && event.target === last) { event.preventDefault(); first?.focus() }
  }

  return (
    <section className="faint-replacement" ref={panelRef} role="dialog" aria-modal="true"
      aria-labelledby="faint-replacement-title" aria-describedby="faint-replacement-description"
      onKeyDown={handleKeyDown}>
      <header className="faint-replacement__header">
        <div>
          <p className="faint-replacement__notice">{fainted?.name ?? '아군 디지몬'} · 전투 불능</p>
          <h2 id="faint-replacement-title">다음 디지몬을 선택해 주세요</h2>
          <p id="faint-replacement-description">선택한 디지몬이 출전한 뒤 다음 턴을 시작합니다.</p>
        </div>
        <span className="faint-replacement__count">남은 교체 <strong>{replacement.remainingCount}</strong></span>
      </header>
      <div className="faint-replacement__list" aria-label="교체 디지몬 목록">
        {party.map(member => {
          const available = candidateIds.has(member.id)
          const reason = member.isEgg ? '부화까지 ' + member.eggStagesRemaining + '스테이지' : member.currentHp <= 0 ? '전투 불능'
            : activeAllyIds.includes(member.id) ? '출전 중' : '내보내기'
          const hpRatio = Math.max(0, Math.min(100, member.currentHp / Math.max(1, member.maxHp) * 100))
          return (
            <button type="button" key={member.id} className="faint-replacement__member"
              onPointerEnter={event => onInspect?.(event, member)} onFocus={event => onInspect?.(event, member)}
              disabled={!available} onClick={() => onSelect(member.id)}
              aria-label={`${member.name}, ${reason}${member.isEgg ? '' : `, HP ${member.currentHp}/${member.maxHp}`}`}>
              <img src={member.imageUrl} alt="" className="faint-replacement__portrait" />
              <span className="faint-replacement__details">
                <span className="faint-replacement__name">{member.name}</span>
                <span className="faint-replacement__level">{member.isEgg ? '디지에그' : <DigimonLevel level={member.level} levelCap={levelCap} />}</span>
                <CombatantTraits combatant={member} />
                {!member.isEgg && <>
                  <span className="faint-replacement__hp" aria-hidden="true">
                    <span style={{ width: `${hpRatio}%` }} />
                  </span>
                  <span className="faint-replacement__hp-text">HP {member.currentHp} / {member.maxHp}</span>
                </>}
              </span>
              <span className="faint-replacement__action">{reason}{available && <span aria-hidden="true"> →</span>}</span>
            </button>
          )
        })}
      </div>
      <p className="faint-replacement__hint">교체는 턴을 소모하지 않습니다.</p>
    </section>
  )
}
