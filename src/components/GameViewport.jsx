import { useLayoutEffect, useRef, useState } from 'react'
import { blocksPortrait, fitGameFrame } from '../layout/gameLayout.js'
import './GameViewport.css'

export default function GameViewport({ children }) {
  const viewportRef = useRef(null)
  const [view, setView] = useState(() => ({
    ...fitGameFrame(window.innerWidth, window.innerHeight),
    blocked: blocksPortrait(window.innerWidth, window.innerHeight, window.matchMedia('(any-pointer: coarse)').matches),
  }))
  useLayoutEffect(() => {
    const touch = window.matchMedia('(any-pointer: coarse)')
    let size = { width: window.innerWidth, height: window.innerHeight }
    const update = () => setView({ ...fitGameFrame(size.width, size.height), blocked: blocksPortrait(size.width, size.height, touch.matches) })
    const observer = new ResizeObserver(([entry]) => { size = entry.contentRect; update() })
    observer.observe(viewportRef.current)
    touch.addEventListener('change', update)
    return () => { observer.disconnect(); touch.removeEventListener('change', update) }
  }, [])
  return (
    <div className="game-viewport" ref={viewportRef} data-orientation-blocked={view.blocked}>
      <div className="game-frame-slot" style={{ width: view.width, height: view.height }} inert={view.blocked} aria-hidden={view.blocked || undefined}>
        <div className="game-frame" style={{ transform: `scale(${view.scale})` }}>
          <div className="game-design">{children}</div>
        </div>
      </div>
      {view.blocked && <section className="orientation-notice" role="alert" aria-labelledby="orientation-title">
        <svg viewBox="0 0 96 80" fill="none" aria-hidden="true"><rect x="25" y="19" width="46" height="29" rx="5" stroke="currentColor" strokeWidth="3" /><path d="M17 36a31 31 0 0 1 52-22m0 0V5m0 9h-9M79 43a31 31 0 0 1-52 22m0 0v9m0-9h9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><path d="M65 29v9" stroke="currentColor" strokeWidth="2" /></svg>
        <h1 id="orientation-title">가로 화면으로 플레이해 주세요</h1>
        <p>기기를 가로로 돌리면 이어서 플레이할 수 있어요.</p>
        <span>화면이 회전하지 않으면 기기의 회전 잠금을 해제해 주세요.</span>
      </section>}
    </div>
  )
}
