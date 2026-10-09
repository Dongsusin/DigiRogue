import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { MatchupBadge } from './BattleInfo.jsx'
import SkillInfoTooltip from './SkillInfoTooltip.jsx'
import './BattleSkillConsole.css'

export function BattleCommandIcon({ command = 'attack' }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {command === 'attack' && <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M12 6v12M6 12h12" /><circle cx="12" cy="12" r="4" /></>}
    {command === 'items' && <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 1h8M9 12h6m-3-3v6" /></>}
    {command === 'swap' && <><path d="M3 7h17l-4-4m5 14H4l4 4M3 7l4 4m14 6-4-4" /></>}
    {command === 'run' && <><path d="M12 3H4v18h8m3-14 5 5-5 5m-7-5h12" /></>}
  </svg>
}

export default function BattleSkillConsole({ actor, skills, targets, selectedSkillIndex, choosingTarget,
  hoveredTargetId, onSelectSkill, onSelectTarget, onPreviewTarget, onClearTarget, onPreviewSkill, onClearSkill, onBack, onClose }) {
  const rootRef = useRef(null)
  const [detail, setDetail] = useState(null)
  const selectedSkill = skills.find(skill => skill.index === selectedSkillIndex)
  const forcedTarget = !selectedSkill?.support && targets.find(target => target.battleGuards?.taunt > 0)
  const tooltipSkill = detail?.skill.index

  // Focus the console, not a skill: opening with a mouse must not show a keyboard tooltip.
  useLayoutEffect(() => { rootRef.current?.focus({ preventScroll: true }) }, [])
  const dismissDetail = useCallback((restoreFocus = false) => {
    if (restoreFocus) detail?.anchor.focus({ preventScroll: true })
    onClearSkill?.()
    setDetail(null)
  }, [detail, onClearSkill])
  const preview = (skill, event, mode) => {
    if (detail?.mode === 'pinned') return
    if (mode === 'pointer' && event.pointerType === 'touch') return
    if (mode === 'focus' && !event.currentTarget.matches(':focus-visible')) return
    onPreviewSkill?.(skill.index)
    const anchor = event.currentTarget
    const point = mode === 'pointer' ? { x: event.clientX, y: event.clientY } : null
    setDetail(current => current?.mode === 'pinned' ? current : { skill, anchor, point, mode })
  }
  const clearPreview = (event) => {
    const anchor = event.currentTarget
    if (detail?.anchor === anchor && detail.mode !== 'pinned') onClearSkill?.()
    setDetail(current => current?.anchor === anchor && current.mode !== 'pinned' ? null : current)
  }
  const pin = (skill, event) => {
    const closing = detail?.mode === 'pinned' && detail.skill.index === skill.index
    if (closing) onClearSkill?.()
    else onPreviewSkill?.(skill.index)
    const anchor = event.currentTarget
    setDetail(closing ? null : { skill, anchor, mode: 'pinned' })
  }
  const closeConsole = () => {
    onClearSkill?.()
    const command = rootRef.current?.closest('.adventure-screen')?.querySelector('[data-command="attack"]')
    onClose()
    command?.focus({ preventScroll: true })
  }
  const navigate = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (choosingTarget) onBack()
      else closeConsole()
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || detail?.mode === 'pinned') return
    const buttons = [...rootRef.current.querySelectorAll('[data-skill-command]:not(:disabled)')]
    if (!buttons.length) return
    event.preventDefault()
    const current = buttons.indexOf(document.activeElement)
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : current < 0 ? (event.key === 'ArrowUp' ? buttons.length - 1 : 0)
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    buttons[index].focus()
  }
  const infoButton = (skill) => <button type="button" className="digi-skill__info" aria-label={`${skill.name} 기술 정보`}
    aria-haspopup="dialog" aria-expanded={detail?.mode === 'pinned' && tooltipSkill === skill.index}
    onPointerEnter={event => preview(skill, event, 'pointer')} onPointerLeave={clearPreview}
    onFocus={event => preview(skill, event, 'focus')} onBlur={clearPreview} onClick={event => pin(skill, event)}>
    <span aria-hidden="true">i</span>
  </button>

  return <section className="digi-skill-console" aria-label="기술 명령" ref={rootRef} tabIndex={-1} onKeyDown={navigate}>
    <header className="digi-skill-console__header">
      <div className="digi-skill-console__portrait"><img src={actor.imageUrl} alt="" /></div>
      <div className="digi-skill-console__identity"><span>DIGIVICE / COMMAND</span><h2>{actor.name}<small>Lv. {actor.level}</small></h2>
        <p><i aria-hidden="true" />{choosingTarget ? '공격 대상 지정' : '파트너 명령 대기'}</p></div>
      <button type="button" className="digi-skill-console__close" aria-label="기술창 닫기" onClick={closeConsole}>×</button>
    </header>
    <div className="digi-skill-console__section-title"><span>{choosingTarget ? 'TARGET SELECT' : 'SKILL COMMAND'}</span>
      <strong>{choosingTarget ? '대상 선택' : '기술 선택'}</strong><span>{String(choosingTarget ? targets.length : skills.length).padStart(2, '0')}</span></div>
    {choosingTarget ? <>
      <div className="digi-skill-console__selected"><BattleCommandIcon /><span><small>선택한 기술</small><strong>{selectedSkill?.name}</strong></span>
        {selectedSkill && infoButton(selectedSkill)}</div>
      <div className="digi-skill-console__list" aria-label="공격 대상">
        {targets.map((target, index) => <button type="button" key={target.id} data-skill-command
          disabled={Boolean(forcedTarget && forcedTarget.id !== target.id)}
          className={`digi-target${hoveredTargetId === target.id ? ' digi-target--active' : ''}`}
          onPointerEnter={() => onPreviewTarget(target.id)} onPointerLeave={onClearTarget}
          onFocus={() => onPreviewTarget(target.id)} onBlur={onClearTarget} onClick={() => onSelectTarget(target.id)}>
          <span className="digi-target__reticle" aria-hidden="true"><img src={target.imageUrl} alt="" /></span>
          <span className="digi-target__identity"><small>TARGET {String(index + 1).padStart(2, '0')} / Lv. {target.level}{forcedTarget?.id === target.id ? ' / 도발 중' : ''}</small><strong>{target.name}</strong>
            <span className="digi-target__hp" role="meter" aria-label={`${target.name} HP`} aria-valuenow={target.currentHp} aria-valuemin={0} aria-valuemax={target.maxHp}>
              <i style={{ width: `${Math.min(100, Math.max(0, target.currentHp / target.maxHp * 100))}%` }} /></span></span>
          {!selectedSkill?.support && <MatchupBadge multiplier={selectedSkill?.targets.find(item => item.id === target.id)?.multiplier ?? 1} />}
        </button>)}
      </div>
    </> : <div className="digi-skill-console__list" aria-label="기술 목록">
      {skills.map(skill => <div key={skill.index} className={`digi-skill${tooltipSkill === skill.index ? ' digi-skill--active' : ''}`}>
        <button type="button" className="digi-skill__execute" data-skill-command aria-label={`${skill.name} 선택`}
          disabled={skill.remainingCooldown > 0}
          onPointerEnter={event => preview(skill, event, 'pointer')} onPointerLeave={clearPreview}
          onFocus={event => preview(skill, event, 'focus')} onBlur={clearPreview} onClick={() => onSelectSkill(skill.index)}>
          <span className="digi-skill__number" aria-hidden="true">{String(skill.index + 1).padStart(2, '0')}</span>
          <span className="digi-skill__attribute"><img src={skill.iconUrl} alt="" /><span>{skill.attribute}</span></span>
          <span className="digi-skill__copy"><strong>{skill.name}</strong><small>{skill.category}<span> / </span>{skill.range}</small></span>
          {skill.remainingCooldown > 0 ? <span className="digi-skill__cooldown">대기 {skill.remainingCooldown}턴</span>
            : <span className="digi-skill__ready">{skill.cooldown ? `재사용 ${skill.cooldown}턴` : '상시 사용'}</span>}
        </button>
        {infoButton(skill)}
      </div>)}
    </div>}
    <footer className="digi-skill-console__footer">
      {choosingTarget ? <button type="button" onClick={onBack}>← 기술 다시 선택</button> : <span>ⓘ 기술 정보 · 자신의 행동마다 대기시간 감소</span>}
      <span className="digi-skill-console__keyboard">↑↓ 이동 · Enter 선택 · Esc 닫기</span>
      <span className="digi-skill-console__touch">{choosingTarget ? '대상을 누르면 명령 전송' : '기술을 눌러 명령 전송'}</span>
    </footer>
    {detail && <SkillInfoTooltip detail={detail} onDismiss={dismissDetail} />}
  </section>
}
