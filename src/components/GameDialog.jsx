import { useEffect, useId, useRef } from 'react'

export default function GameDialog({ title, eyebrow, onClose, children, footer, className = '', backdropClassName = '', returnFocusSelector, blockEscape = false }) {
  const id = useId()
  const panelRef = useRef(null)
  useEffect(() => {
    // The backdrop's parent may already have made the trigger inert before this effect.
    const opener = (returnFocusSelector && document.querySelector(returnFocusSelector)) || document.activeElement
    panelRef.current?.querySelector('h2')?.focus()
    return () => { requestAnimationFrame(() => { if (opener?.isConnected) opener.focus({ preventScroll: true }) }) }
  }, [returnFocusSelector])
  return <div className={`game-dialog-backdrop ${backdropClassName}`}>
    <section ref={panelRef} className={`game-dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby={id}
      onKeyDown={event => {
        // Persistent choices (events) cannot dismiss themselves, but Escape
        // must still reach the game's save-and-return confirmation.
        if (event.key === 'Escape' && !onClose && !blockEscape) return
        event.stopPropagation()
        if (event.key === 'Escape' && onClose) { event.preventDefault(); onClose() }
        if (event.key !== 'Tab') return
        const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), select, [tabindex="0"]')]
        const first = controls[0], last = controls.at(-1)
        if (!first) { event.preventDefault(); return }
        if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
          event.preventDefault(); last.focus()
        } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }}>
      <header className="game-dialog__header"><div>{eyebrow && <p className="game-dialog__eyebrow">{eyebrow}</p>}<h2 id={id} tabIndex={-1}>{title}</h2></div>
        {onClose && <button className="game-dialog__close" type="button" onClick={onClose} aria-label={`${title} 닫기`}>×</button>}
      </header>
      <div className="game-dialog__body">{children}</div>
      {footer && <footer className="game-dialog__footer">{footer}</footer>}
    </section>
  </div>
}
