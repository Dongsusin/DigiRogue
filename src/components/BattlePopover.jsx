import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { placePopover, toLocalRect } from '../layout/popoverLayout.js'
import './BattlePopover.css'

// Portal into the unscrolled battle stage, keeping the same 16:9 scale.
export default function BattlePopover({ anchor, onClose, children, header, label, interactive = false, placement = 'bottom', width = 320, anchorKeys = true, className = '' }) {
  const panelRef = useRef(null)
  const scrollRef = useRef(null)
  const contentRef = useRef(null)
  const id = useId()
  const container = anchor?.closest('.game-dialog-backdrop') ?? anchor?.closest('.adventure-stage')

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!anchor || !container || !panel) return
    const scroll = scrollRef.current
    const updateScroll = () => {
      panel.dataset.scrollable = String(scroll.scrollHeight > scroll.clientHeight + 1)
      panel.dataset.scrollEnd = String(scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 1)
    }
    const update = () => {
      if (!anchor.isConnected) { onClose(); return }
      const frame = container.getBoundingClientRect()
      const anchorRect = anchor.getBoundingClientRect()
      const strip = anchor.closest('.adventure-inventory-strip')?.getBoundingClientRect()
      if (strip && (anchorRect.bottom <= strip.top || anchorRect.top >= strip.bottom)) {
        panel.style.visibility = 'hidden'
        return
      }
      const local = toLocalRect(anchorRect, frame, container.clientWidth, container.clientHeight)
      const bounds = { left: 12, right: container.clientWidth - 12,
        top: interactive ? 96 : 12, bottom: container.clientHeight - (interactive ? 96 : 12) }
      panel.style.width = Math.min(width, bounds.right - bounds.left) + 'px'
      // Include the unclipped contents of the nested scroll area, even after
      // switching tabs or resizing a panel that is already height-constrained.
      const height = panel.offsetHeight - scroll.clientHeight + scroll.scrollHeight
      const result = placePopover(local, bounds, { width, height }, placement)
      Object.assign(panel.style, { left: result.x + 'px', top: result.y + 'px', width: result.width + 'px', maxHeight: result.maxHeight + 'px', visibility: 'visible' })
      panel.dataset.placement = result.placement
      updateScroll()
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(panel)
    observer.observe(contentRef.current)
    observer.observe(anchor)
    observer.observe(container.closest('.game-frame-slot') ?? container)
    // A defeated unit or a closed modal can remove its trigger without a resize.
    const lifetime = new MutationObserver(() => { if (!anchor.isConnected) onClose() })
    lifetime.observe(container.closest('.game-design') ?? container, { childList: true, subtree: true })
    // Scrolling inventory rows moves the anchor without resizing it.
    container.addEventListener('scroll', update, true)
    scroll.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      lifetime.disconnect()
      container.removeEventListener('scroll', update, true)
      scroll.removeEventListener('scroll', updateScroll)
      window.removeEventListener('resize', update)
    }
  }, [anchor, container, interactive, placement, width, header, onClose])

  useEffect(() => {
    const panel = panelRef.current
    if (!anchor || !panel) return
    let closeTimer
    const clearClose = () => window.clearTimeout(closeTimer)
    const inside = (target) => anchor.contains(target) || panel.contains(target)
    const onPointerMove = (event) => {
      clearClose()
      if (!inside(event.target)) closeTimer = window.setTimeout(onClose, 180)
    }
    const onPointerDown = (event) => { if (!inside(event.target)) onClose() }
    const onFocus = (event) => {
      clearClose()
      // Let a newly focused trigger replace this popover before closing the old one.
      // Cleanup cancels this callback when the anchor changes in the same event.
      if (!inside(event.target)) closeTimer = window.setTimeout(onClose, 0)
    }
    const onEscape = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        event.preventDefault()
        anchor.focus({ preventScroll: true })
        onClose()
      }
    }
    const onKeyDown = (event) => {
      if (anchorKeys && event.target === anchor && ['Enter', ' ', 'ArrowDown'].includes(event.key)) {
        event.preventDefault()
        const firstControl = interactive ? panel.querySelector('[role="tab"]') ?? panel.querySelector('button') : panel
        firstControl?.focus()
      }
    }
    const ariaKey = interactive ? 'aria-controls' : 'aria-describedby'
    const previous = anchor.getAttribute(ariaKey)
    anchor.setAttribute(ariaKey, id)
    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('keydown', onEscape, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearClose()
      if (previous === null) anchor.removeAttribute(ariaKey)
      else anchor.setAttribute(ariaKey, previous)
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('keydown', onEscape, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [anchor, id, interactive, onClose, anchorKeys])

  if (!container) return null
  // Portals still bubble React events through the model's trigger. Keep
  // close/tab/scroll controls from reopening it or swallowing ArrowDown.
  return createPortal(
    <div ref={panelRef} id={id} className={`game-popover ${interactive ? 'game-popover--interactive' : 'game-popover--item'} ${className}`}
      role={interactive ? 'dialog' : 'tooltip'} aria-label={label} tabIndex={-1} style={{ visibility: 'hidden' }}
      onClick={event => event.stopPropagation()} onFocus={event => event.stopPropagation()}
      onKeyDown={event => { if (event.key !== 'Escape') event.stopPropagation() }}>
      {interactive && <button className="game-popover__close" type="button" aria-label="디지몬 정보 닫기" onClick={() => { anchor.focus({ preventScroll: true }); onClose() }}>×</button>}
      {header && <div className="game-popover__header">{header}</div>}
      <div ref={scrollRef} className="game-popover__scroll" tabIndex={interactive || anchorKeys ? 0 : undefined} role="region" aria-label={`${label} 내용`}>
        <div ref={contentRef} className="game-popover__content">{children}</div>
      </div>
    </div>, container
  )
}
