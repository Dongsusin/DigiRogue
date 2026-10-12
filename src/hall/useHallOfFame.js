import { useCallback, useEffect, useRef, useState } from 'react'
import { createClearRecord, queueHallRecord, readHallPending, markHallSynced } from '../progression/hallOfFame.js'

// The outbox is scoped by the same local profile as the run. Keep at most one
// pending best per mode, and never let an older acknowledgement discard a new run.
export function useHallOfFame({ state, storage, identity, itemsFor }) {
  const [notice, setNotice] = useState('')
  const active = useRef(null)
  const owner = useRef({ storage, identity })
  owner.current = { storage, identity }
  const flush = useCallback(() => {
    if (active.current) return active.current.promise
    if (!identity || !readHallPending(storage).length) return
    const work = { storage, identity }
    active.current = work
    work.promise = (async () => {
      try {
        const { createFirebaseHall } = await import('./firebaseHall.js')
        const client = await createFirebaseHall(identity)
        while (readHallPending(storage).length) {
          const [record] = readHallPending(storage)
          if (owner.current.storage !== storage || owner.current.identity?.uid !== identity.uid) return
          await client.submit(record)
          markHallSynced(storage, record)
        }
        if (owner.current.storage === storage) setNotice('명예의 전당에 클리어 기록을 등록했습니다.')
      } catch {
        if (owner.current.storage === storage) setNotice('클리어 기록을 보관했습니다. 연결되면 다시 등록합니다.')
      } finally { if (active.current === work) active.current = null }
    })()
    return work.promise
  }, [storage, identity])
  useEffect(() => {
    if (!state) return
    const record = createClearRecord(state, { itemsFor })
    if (!record) return
    try { if (queueHallRecord(storage, record)) setNotice('클리어 기록을 명예의 전당에 등록 중입니다…') }
    catch { setNotice('클리어 기록을 보관하지 못했습니다. 저장 공간을 확인해 주세요.'); return }
    void flush()
  }, [state, storage, itemsFor, flush])
  useEffect(() => {
    void flush()
    const retry = () => void flush()
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [flush])
  return { notice, retry: flush }
}
