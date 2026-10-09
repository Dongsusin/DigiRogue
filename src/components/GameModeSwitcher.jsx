import { useLayoutEffect, useRef } from 'react'
import { canPlayGameMode, getGameMode, getNextGameMode } from '../progression/gameModes.js'
import './GameModes.css'

export default function GameModeSwitcher({ mode, progress, onChange, focusDirection }) {
  const previousRef = useRef(null), nextRef = useRef(null)
  const locked = !canPlayGameMode(mode, progress)
  useLayoutEffect(() => {
    if (focusDirection) (focusDirection < 0 ? previousRef : nextRef).current?.focus({ preventScroll: true })
  }, [mode, focusDirection])
  return <nav className={`game-mode-switcher${locked ? ' game-mode-switcher--locked' : ''}`} data-mode={mode} aria-label="게임 모드 선택">
    <button ref={previousRef} type="button" aria-label="이전 모드" onClick={() => onChange(getNextGameMode(mode, -1), -1)}>‹</button>
    <span aria-live="polite" title={locked ? '클래식 1회 클리어 필요' : undefined}>
      {getGameMode(mode).name}{locked && <small aria-label="잠김">🔒</small>}
    </span>
    <button ref={nextRef} type="button" aria-label="다음 모드" onClick={() => onChange(getNextGameMode(mode, 1), 1)}>›</button>
  </nav>
}
