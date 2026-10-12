import { buildChatUpdate, cleanChatText, cleanChatName, CHAT_COOLDOWN, orderedMessages } from './communityModel.js'
import { assertChatRate } from './chatModeration.js'

export function createCommunityController({ transport, now = Date.now }) {
  let state = { phase: 'connecting', count: null, messages: [], pending: false, error: '', lastSentAt: null }
  let view = { visible: false, menu: false, open: false }
  let disposed = false, connected = false, generation = 0
  let stopConnection, stopCount, stopMessages
  const observers = new Set()
  const patch = values => {
    if (disposed) return
    state = { ...state, ...values }
    for (const observer of observers) observer()
  }
  const clearReads = () => {
    stopCount?.(); stopMessages?.(); stopCount = stopMessages = undefined
  }
  const error = () => {
    connected = false
    clearReads()
    patch({ phase: 'unavailable', count: null, error: '채팅 연결을 확인해 주세요.' })
  }
  function watch(start, receive) {
    let active = true
    const stop = start(value => { if (active && !disposed) receive(value) }, () => { if (active && !disposed) error() })
    return () => { active = false; stop() }
  }
  function syncReads() {
    const countWanted = connected && view.visible && view.menu
    const messagesWanted = connected && view.visible && view.open
    if (!countWanted && stopCount) { stopCount(); stopCount = undefined; patch({ count: null }) }
    if (!messagesWanted && stopMessages) { stopMessages(); stopMessages = undefined }
    if (countWanted && !stopCount) stopCount = watch((receive, reject) => transport.watchCount(receive, reject), count => patch({ count }))
    if (messagesWanted && !stopMessages) stopMessages = watch((receive, reject) => transport.watchMessages(receive, reject), messages => patch({ messages: orderedMessages(messages) }))
  }
  return {
    uid: transport.uid,
    getSnapshot: () => state,
    subscribe(observer) { observers.add(observer); return () => observers.delete(observer) },
    setView(next) {
      if (disposed) return
      view = next
      if (!view.visible) {
        generation++; connected = false; clearReads(); stopConnection?.(); stopConnection = undefined
        patch({ phase: 'offline', count: null })
        return
      }
      if (!stopConnection) {
        const epoch = ++generation
        patch({ phase: 'connecting', error: '' })
        stopConnection = transport.connect(value => {
          if (disposed || epoch !== generation) return
          connected = value
          if (!value) clearReads()
          patch({ phase: value ? 'online' : 'connecting', count: value ? state.count : null })
          syncReads()
        }, error)
      }
      syncReads()
    },
    async send(rawText, rawName) {
      const text = cleanChatText(rawText), name = cleanChatName(rawName)
      if (!connected || !view.visible || disposed) throw new Error('채팅 연결 후 보낼 수 있습니다.')
      if (state.pending) throw new Error('메시지를 보내고 있습니다.')
      if (state.lastSentAt !== null && now() - state.lastSentAt < CHAT_COOLDOWN) throw new Error('메시지는 4초마다 보낼 수 있습니다.')
      const epoch = generation
      patch({ pending: true, error: '' })
      try {
        let [head, rate] = await Promise.all([transport.readHead(), transport.readRate()])
        assertChatRate(text, rate, now())
        for (let attempt = 0; attempt < 3; attempt++) {
          if (epoch !== generation || !connected || disposed) throw new Error('채팅 연결이 끊어졌습니다. 다시 보내 주세요.')
          try {
            await transport.write(buildChatUpdate({ seq: head + 1, uid: transport.uid, name, text, rate }))
            patch({ lastSentAt: now() })
            return
          } catch (cause) {
            if (!/permission.denied/i.test(cause.code ?? '') || attempt === 2) throw cause
            const [freshHead, freshRate] = await Promise.all([transport.readHead(), transport.readRate()])
            if (freshHead <= head) throw cause
            assertChatRate(text, freshRate, now())
            head = freshHead
            rate = freshRate
          }
        }
      } catch (cause) {
        const message = cause.code === 'CHAT_MODERATION' ? cause.message : /permission.denied/i.test(cause.code ?? '')
          ? '전송이 제한되었습니다. 도배 제한을 확인하고 잠시 후 다시 보내 주세요. 계속되면 새로고침해 주세요.'
          : '전송하지 못했습니다. 연결을 확인하고 다시 보내 주세요.'
        patch({ error: message })
        throw new Error(message, { cause })
      } finally { patch({ pending: false }) }
    },
    dispose() {
      if (disposed) return
      disposed = true; generation++; clearReads(); stopConnection?.(); stopConnection = undefined; observers.clear()
    },
  }
}
