import { useEffect, useRef } from 'react'

export default function BattleLog({ logs, actingName, busy, waitingForReplacement = false, onOpenHistory, historyDisabled = false }) {
  const listRef = useRef(null)
  const followLatest = useRef(true)

  useEffect(() => {
    const list = listRef.current
    if (list && followLatest.current) list.scrollTop = list.scrollHeight
  }, [logs])

  const entries = logs.length ? logs : busy ? [] : [actingName ? actingName + '은 무엇을 할까?' : '전투를 준비하고 있습니다.']
  return (
    <section className="battle-console__message battle-console__message--logs" aria-label="전투 기록">
      <div className="battle-console__message-header">
        <span>전투 기록</span>
        <strong>{waitingForReplacement ? '교체 선택 중' : busy ? '진행 중' : actingName ? actingName + '의 차례' : '대기 중'}</strong>
        {onOpenHistory && <button type="button" className="battle-history-button" onClick={onOpenHistory} disabled={historyDisabled} aria-haspopup="dialog">지난 기록</button>}
      </div>
      <div
        className="battle-console__log-list"
        ref={listRef}
        role="log"
        aria-label="전투 기록 내용"
        aria-live="polite"
        aria-relevant="additions text"
        tabIndex={0}
        onScroll={(event) => {
          const list = event.currentTarget
          followLatest.current = list.scrollHeight - list.scrollTop - list.clientHeight < 24
        }}
      >
        {entries.map((log, index) => (
          <p key={index} className="battle-console__message-text" data-latest={index === entries.length - 1}>
            {log}
          </p>
        ))}
      </div>
    </section>
  )
}
