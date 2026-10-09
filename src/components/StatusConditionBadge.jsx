import { useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getStatusConditionInfo } from '../battle/statusConditions.js'
import { placePopover, toLocalRect } from '../layout/popoverLayout.js'
import './StatusConditionBadge.css'

export function StatusConditionIcon({ kind }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {['poison', 'toxic'].includes(kind) && <><path d="M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z" /><path d="m9 13 6 5m0-5-6 5" />{kind === 'toxic' && <path d="M3 4 1 7m20-3 2 3" />}</>}
    {kind === 'burn' && <path d="M13 2c1 6-5 6-3 11 1-1 3-2 4-5 5 5 8 8 4 12-3 3-9 2-11-1C3 13 9 8 13 2Z" />}
    {kind === 'paralysis' && <path d="m14 2-9 12h6l-1 8 9-13h-6l1-7Z" />}
    {kind === 'confusion' && <><path d="M6 18C1 12 4 4 11 4c6 0 10 5 8 10-1 3-6 4-9 2-4-3 0-7 3-5" /><path d="m18 3 1-2m3 6 1-1M5 20l-1 2" /></>}
    {kind === 'disabled' && <><path d="m8 14-2 2a4 4 0 0 1-5-5l3-3a4 4 0 0 1 5 0m6 2 3-3a4 4 0 0 1 5 5l-3 3a4 4 0 0 1-5 0M6 3l12 18M5 21 19 3" /></>}
    {kind === 'sleep' && <><path d="M16 3A9 9 0 1 0 21 17 9 9 0 0 1 16 3Z" /><path d="M17 6h5l-5 5h5" /></>}
  </svg>
}

function StatusTooltip({ anchor, info, id }) {
  const panelRef = useRef(null)
  const container = anchor.closest('.adventure-stage, .game-design')
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || !container) return
    const update = () => {
      if (!anchor.isConnected) return
      const frame = container.getBoundingClientRect()
      const bounds = { left: 12, right: container.clientWidth - 12, top: 12, bottom: container.clientHeight - 12 }
      const local = toLocalRect(anchor.getBoundingClientRect(), frame, container.clientWidth, container.clientHeight)
      panel.style.width = Math.min(286, bounds.right - bounds.left) + 'px'
      const result = placePopover(local, bounds, { width: 286, height: panel.scrollHeight + 2 }, 'side', 9)
      Object.assign(panel.style, { left: result.x + 'px', top: result.y + 'px', width: result.width + 'px', maxHeight: result.maxHeight + 'px', visibility: 'visible' })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(anchor); observer.observe(panel); observer.observe(container)
    container.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => { observer.disconnect(); container.removeEventListener('scroll', update, true); window.removeEventListener('resize', update) }
  }, [anchor, container, info])
  if (!container) return null
  return createPortal(<aside id={id} ref={panelRef} role="tooltip" aria-label={`${info.label} 효과`}
    className="status-condition-tooltip" style={{ '--status-color': info.color, visibility: 'hidden' }}>
    <header><span className="status-condition-tooltip__icon"><StatusConditionIcon kind={info.icon} /></span>
      <div><small>상태이상</small><h3>{info.label}</h3></div><b>{info.duration}</b></header>
    <ul>{info.rules.map(rule => <li key={rule}>{rule}</li>)}</ul>
    <p>{info.recovery}</p>
  </aside>, container)
}

// A real button works with mouse hover, keyboard focus, and a tap on touch screens.
export default function StatusConditionBadge({ combatant, duration = 3, showDuration = false, className = '' }) {
  const id = useId()
  const [detail, setDetail] = useState(null)
  const info = getStatusConditionInfo(combatant, duration)
  if (!info) return null
  const open = detail?.type === info.type && detail.anchor.isConnected
  const show = event => setDetail({ anchor: event.currentTarget, type: info.type })
  return <>
    <button type="button" className={`status-condition-badge status-condition-badge--${info.key} ${className}`}
      style={{ '--status-color': info.color }} aria-label={`${info.label} 상태이상 · ${info.duration} · 효과 보기`}
      aria-describedby={open ? id : undefined} data-status={info.type}
      onPointerEnter={event => { if (event.pointerType !== 'touch') show(event) }} onPointerLeave={() => setDetail(null)}
      onFocus={show} onBlur={() => setDetail(null)}
      onClick={event => { event.stopPropagation(); show(event) }}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setDetail(null) } }}>
      <StatusConditionIcon kind={info.icon} /><span>{info.label}</span>{showDuration && <b>{info.remaining}턴</b>}
    </button>
    {open && <StatusTooltip anchor={detail.anchor} info={info} id={id} />}
  </>
}
