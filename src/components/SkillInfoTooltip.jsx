import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { placePopover, toLocalRect } from '../layout/popoverLayout.js'
import { localSkillPointer, placeSkillTooltip } from '../layout/skillTooltipLayout.js'
import { TargetMatchups } from './BattleInfo.jsx'
import { CRITICAL_HIT_CHANCE, CRITICAL_HIT_MULTIPLIER } from '../balance/combat.js'

export default function SkillInfoTooltip({ detail, onDismiss }) {
  const { skill, anchor, mode, point } = detail
  const container = anchor?.closest('.adventure-stage')
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const id = useId()
  const pinned = mode === 'pinned'

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || !container) return
    let pointer = point
    let frameId = 0
    const position = () => {
      frameId = 0
      const frame = container.getBoundingClientRect()
      const bounds = { left: 16, right: container.clientWidth - 16, top: 88, bottom: container.clientHeight - 96 }
      const size = { width: 352, height: panel.scrollHeight + 2 }
      const layout = mode === 'pointer' && pointer
        ? placeSkillTooltip(localSkillPointer(pointer, frame, container.clientWidth, container.clientHeight), bounds, size)
        : placePopover(toLocalRect(anchor.getBoundingClientRect(), frame, container.clientWidth, container.clientHeight), bounds, size, 'side', 18)
      Object.assign(panel.style, { left: `${layout.x}px`, top: `${layout.y}px`, width: `${layout.width}px`,
        maxHeight: `${layout.maxHeight}px`, visibility: 'visible' })
      panel.dataset.placement = layout.placement
    }
    const schedule = () => { if (!frameId) frameId = requestAnimationFrame(position) }
    const move = (event) => { pointer = { x: event.clientX, y: event.clientY }; schedule() }
    position()
    const observer = new ResizeObserver(schedule)
    observer.observe(panel)
    observer.observe(container)
    const slot = container.closest('.game-frame-slot')
    if (slot) observer.observe(slot)
    if (mode === 'pointer') anchor.addEventListener('pointermove', move)
    container.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    const previousDescription = anchor.getAttribute('aria-describedby')
    anchor.setAttribute('aria-describedby', [previousDescription, id].filter(Boolean).join(' '))
    if (pinned) closeRef.current?.focus({ preventScroll: true })
    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      anchor.removeEventListener('pointermove', move)
      container.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      if (previousDescription) anchor.setAttribute('aria-describedby', previousDescription)
      else anchor.removeAttribute('aria-describedby')
    }
  }, [anchor, container, id, mode, pinned, point])

  useEffect(() => {
    const escape = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onDismiss(pinned)
    }
    const outside = (event) => {
      if (!anchor.contains(event.target) && !panelRef.current?.contains(event.target)) onDismiss(false)
    }
    window.addEventListener('keydown', escape, true)
    if (pinned) {
      document.addEventListener('pointerdown', outside)
      document.addEventListener('focusin', outside)
    }
    return () => {
      window.removeEventListener('keydown', escape, true)
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
    }
  }, [anchor, onDismiss, pinned])

  if (!container) return null
  return createPortal(
    <aside id={id} ref={panelRef} role={pinned ? 'dialog' : 'tooltip'} aria-label={`${skill.name} 기술 정보`}
      className={`skill-info-tooltip${pinned ? ' skill-info-tooltip--pinned' : ''}`} style={{ visibility: 'hidden' }} data-mode={mode}>
      <header className="skill-info-tooltip__header">
        <span className="skill-info-tooltip__code">SKILL DATA / {String(skill.index + 1).padStart(2, '0')}</span>
        {pinned && <button type="button" ref={closeRef} onClick={() => onDismiss(true)} aria-label="기술 정보 닫기">×</button>}
        <h3>{skill.name}</h3>
        <p>{skill.attribute} · {skill.category} · {skill.range}</p>
      </header>
      <dl className="skill-info-tooltip__stats">
        <div><dt>위력</dt><dd>{skill.power ?? '—'}</dd></div>
        <div><dt>명중률</dt><dd>{skill.accuracy ?? '—'}</dd></div>
      </dl>
      <p className="skill-info-tooltip__cooldown">{skill.cooldown
        ? `사용 후 ${skill.cooldown}번의 행동을 마치면 다시 사용할 수 있습니다. 다음 전투에서는 초기화됩니다.`
        : '재사용 대기시간 없이 사용할 수 있습니다.'}
        {skill.remainingCooldown > 0 && <strong> 현재 {skill.remainingCooldown}턴 대기 중</strong>}</p>
      <p className="skill-info-tooltip__description">{skill.description || (skill.support
        ? `${skill.range}에게 보조 효과를 적용합니다.`
        : `${skill.range.replace('1마리', '한 마리')}에게 ${skill.attribute} 속성의 ${skill.category.replace('형', '')} 공격을 가합니다.`)}</p>
      <TargetMatchups skillName={skill.name} support={skill.support} targets={skill.targets} />
      {!skill.support && <p className="skill-info-tooltip__cooldown">명중 시 치명타 확률 {CRITICAL_HIT_CHANCE * 100}% · 피해 {CRITICAL_HIT_MULTIPLIER}배. 상성과 별도로 적용됩니다.</p>}
      {!pinned && <p className="skill-info-tooltip__hint">ⓘ 버튼으로 설명을 고정할 수 있습니다.</p>}
    </aside>, container)
}
