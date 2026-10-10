export const SESSION_KEY = 'digirogue-account-session-v1'
export const SESSION_MESSAGES = Object.freeze({
  'session/replaced': '다른 곳에서 같은 계정으로 로그인하여 로그아웃되었습니다. 마지막 자동 저장부터 이어할 수 있습니다.',
  'session/sign-in-required': '로그인 상태를 확인하려면 Google로 다시 로그인해 주세요.',
  'session/unavailable': '로그인 연결을 확인하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 로그인해 주세요.',
  'session/recent-login-required': '로그인 요청이 겹쳤습니다. 잠시 후 Google로 다시 로그인해 주세요.',
  'session/storage-unavailable': '로그인 정보를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.',
})
// Token iat is server-signed. Only elapsed local time affects the remaining
// budget, so clocks ahead or behind cannot forge or accidentally expire it.
export const sessionServerDeadline = (issuedAt, clientDeadline, now = Date.now()) => issuedAt * 1000 + Math.max(0, clientDeadline - now)
const failure = code => Object.assign(new Error(SESSION_MESSAGES[code]), { code })
// Only explicit Google sign-in may take ownership. Reloads must present the
// previous tab token, and rotate it atomically so duplicated tabs cannot share it.
export function createAccountSession({ store, storage, createId = () => crypto.randomUUID(), onChange = () => {}, timeoutMs = 12000 }) {
  let state = { phase: 'idle' }, epoch = 0, unsubscribe, verification, pendingClaim, claimAbort
  const emit = next => { state = next; onChange(state) }
  const detach = () => { unsubscribe?.(); unsubscribe = undefined }
  const forget = id => { try { if (JSON.parse(storage.getItem(SESSION_KEY) ?? 'null')?.sessionId === id) storage.removeItem(SESSION_KEY) } catch {} }
  const bounded = (task, onTimeout = () => {}) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { onTimeout(); reject(failure('session/unavailable')) }, timeoutMs)
    Promise.resolve(task).then(resolve, reject).finally(() => clearTimeout(timer))
  })
  const cancelClaim = () => { claimAbort?.abort(); claimAbort = undefined }
  const end = (reason = 'session/unavailable') => {
    const id = state.sessionId
    ++epoch; detach(); cancelClaim(); verification = undefined; forget(id)
    emit({ ...state, phase: 'ended', reason })
  }
  const verify = async () => {
    if (!['active', 'checking'].includes(state.phase)) return
    if (verification) return verification
    const generation = epoch, { uid, sessionId } = state
    emit({ ...state, phase: 'checking' })
    verification = (async () => {
      try {
        const current = await bounded(store.read(uid))
        if (generation !== epoch) return
        if (current !== sessionId) end('session/replaced')
        else emit({ ...state, phase: 'active' })
      } catch { if (generation === epoch) end() }
      finally { if (generation === epoch) verification = undefined }
    })()
    return verification
  }
  return {
    get state() { return state },
    async start(uid, { takeover = false } = {}) {
      const generation = ++epoch
      detach(); verification = undefined
      // React remounts or rapid auth changes must wait for an in-flight claim.
      if (pendingClaim) { try { await pendingClaim } catch {} }
      if (generation !== epoch) return state
      let previous
      try { const saved = JSON.parse(storage.getItem(SESSION_KEY) ?? 'null'); previous = saved?.uid === uid ? saved.sessionId : null } catch {}
      if (!takeover && !previous) throw failure('session/sign-in-required')
      const sessionId = createId()
      const record = JSON.stringify({ uid, sessionId })
      try { storage.setItem(SESSION_KEY, record); if (storage.getItem(SESSION_KEY) !== record) throw new Error('storage') }
      catch { throw failure('session/storage-unavailable') }
      emit({ phase: 'claiming', uid, sessionId })
      try {
        claimAbort = new AbortController()
        const signal = claimAbort.signal, deadline = Date.now() + timeoutMs
        pendingClaim = bounded(store.claim(uid, previous, sessionId, takeover, { signal, deadline }), cancelClaim)
        await pendingClaim
        if (generation !== epoch) return state
        emit({ phase: 'active', uid, sessionId })
        const stop = store.watch(uid, snapshot => {
          if (generation !== epoch) return
          if (!snapshot.confirmed) { void verify(); return }
          if (snapshot.sessionId !== sessionId) end('session/replaced')
        }, () => { if (generation === epoch) end() })
        if (generation === epoch) unsubscribe = stop
        else stop()
        return state
      } catch (error) {
        if (generation === epoch) end(SESSION_MESSAGES[error?.code] ? error.code : 'session/unavailable')
        throw error?.code?.startsWith('session/') ? error : failure('session/unavailable')
      } finally { if (generation === epoch) pendingClaim = undefined }
    },
    verify,
    async logout() {
      const { uid, sessionId, phase } = state
      ++epoch; detach(); cancelClaim(); verification = undefined; forget(sessionId)
      emit({ phase: 'idle' })
      if (uid && sessionId && phase !== 'ended') { try { await bounded(store.release(uid, sessionId)) } catch {} }
    },
    dispose() { ++epoch; detach(); cancelClaim(); verification = undefined },
  }
}
