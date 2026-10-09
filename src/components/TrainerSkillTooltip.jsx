import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { placePopover, toLocalRect } from '../layout/popoverLayout.js'
import { TRAINER_SKILL_LOOKUP, getTrainerLearnBlocker, getTrainerSkillPrice } from '../progression/trainerSkills.js'

export default function TrainerSkillTooltip({ id, anchor, node, progress }) {
  const panelRef = useRef(null)
  const container = anchor.closest('.trainer-skills')
  const rank = progress.learned[node.id] ?? 0
  const complete = rank >= node.maxRank
  const available = node.requires.every(required => (progress.learned[required.id] ?? 0) >= required.rank)
  const blocker = getTrainerLearnBlocker(progress, node.id)
  const status = complete ? '습득 완료' : !available ? '선행 스킬 필요' : blocker ? '포인트 부족' : '습득 가능'

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || !container) return
    let frameId = 0
    const position = () => {
      frameId = 0
      if (!anchor.isConnected) return
      const frame = container.getBoundingClientRect()
      const bounds = { left: 12, right: container.clientWidth - 12, top: 12, bottom: container.clientHeight - 12 }
      const local = toLocalRect(anchor.getBoundingClientRect(), frame, container.clientWidth, container.clientHeight)
      panel.style.width = `${Math.min(310, bounds.right - bounds.left)}px`
      const layout = placePopover(local, bounds, { width: 310, height: panel.scrollHeight + 2 }, 'side', 14)
      Object.assign(panel.style, { left: `${layout.x}px`, top: `${layout.y}px`, width: `${layout.width}px`,
        maxHeight: `${layout.maxHeight}px`, visibility: 'visible' })
      panel.dataset.placement = layout.placement
    }
    const schedule = () => { if (!frameId) frameId = requestAnimationFrame(position) }
    position()
    const observer = new ResizeObserver(schedule)
    observer.observe(anchor); observer.observe(panel); observer.observe(container)
    const slot = container.closest('.game-frame-slot')
    if (slot) observer.observe(slot)
    container.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      container.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
    }
  }, [anchor, container, node.id, progress])

  if (!container) return null
  return createPortal(<aside id={id} ref={panelRef} role="tooltip" aria-label={`${node.name} 설명`}
    className="trainer-skill-tooltip" style={{ visibility: 'hidden' }}>
    <header><span className={complete ? 'is-learned' : ''}>{status}</span><h3>{node.name}</h3></header>
    <p className="trainer-skill-tooltip__description">{node.description}</p>
    <dl><div><dt>습득 단계</dt><dd>{rank} / {node.maxRank}</dd></div>
      <div><dt>{complete ? '습득 상태' : '다음 단계'}</dt><dd>{complete ? '완료' : `${getTrainerSkillPrice(node, rank)} SP`}</dd></div></dl>
    {node.requires.length > 0 && <div className="trainer-skill-tooltip__requirements"><span>선행 스킬</span>
      <ul>{node.requires.map(required => {
        const met = (progress.learned[required.id] ?? 0) >= required.rank
        return <li key={required.id} className={met ? 'is-met' : ''}>{TRAINER_SKILL_LOOKUP[required.id].name} {required.rank}단계{met ? ' ✓' : ''}</li>
      })}</ul></div>}
    {!complete && blocker && <p className="trainer-skill-tooltip__blocker">{blocker}</p>}
  </aside>, container)
}
