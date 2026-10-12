import { useEffect, useRef, useState } from 'react'
import { chatAlias, cleanChatName, CHAT_LENGTH, CHAT_COOLDOWN } from '../community/communityModel.js'
import { createCommunityController } from '../community/communityController.js'
import './CommunityHub.css'

const initial = { phase: 'connecting', count: null, messages: [], pending: false, error: '', lastSentAt: null }
const time = value => new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
function ChatIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 4h16v12H9l-5 4V4Z"/><path d="M8 8h8M8 12h5"/></svg> }
export default function CommunityHub({ screenMode, identity, blocked = false }) {
  const [state, setState] = useState(initial)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [name, setName] = useState(() => chatAlias(identity))
  const [editingName, setEditingName] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [unread, setUnread] = useState(false)
  const controller = useRef(null), list = useRef(null), input = useRef(null), toggle = useRef(null), nearBottom = useRef(true)
  const supported = screenMode === 'menu' || screenMode === 'adventure'
  const view = useRef({})
  view.current = { visible: document.visibilityState !== 'hidden' && navigator.onLine, menu: screenMode === 'menu', open: open && supported && !blocked }
  useEffect(() => {
    let cancelled = false, stop
    setState(initial)
    setName(chatAlias(identity))
    try { const saved = localStorage.getItem('digirogue-chat-name:' + identity?.uid); if (saved) setName(cleanChatName(saved)) } catch { /* storage is optional */ }
    import('../community/firebaseCommunity.js').then(module => module.createFirebaseCommunity(identity)).then(transport => {
      if (cancelled) return
      const store = createCommunityController({ transport })
      controller.current = store
      stop = store.subscribe(() => setState(store.getSnapshot()))
      store.setView(view.current)
    }).catch(() => { if (!cancelled) setState({ ...initial, phase: 'unavailable', error: '채팅에 연결하지 못했습니다.' }) })
    const visibility = () => { view.current = { ...view.current, visible: document.visibilityState !== 'hidden' && navigator.onLine }; controller.current?.setView(view.current) }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('online', visibility); window.addEventListener('offline', visibility)
    return () => { cancelled = true; stop?.(); controller.current?.dispose(); controller.current = null; document.removeEventListener('visibilitychange', visibility); window.removeEventListener('online', visibility); window.removeEventListener('offline', visibility) }
  }, [identity?.uid, retry])
  useEffect(() => { controller.current?.setView(view.current) }, [screenMode, open, blocked])
  useEffect(() => {
    if (!open || !supported || blocked) return
    input.current?.focus()
    nearBottom.current = true
    setUnread(false)
  }, [open, supported, blocked])
  useEffect(() => {
    if (!list.current) return
    if (nearBottom.current) list.current.scrollTop = list.current.scrollHeight
    else setUnread(true)
  }, [state.messages, open])
  useEffect(() => {
    if (state.lastSentAt === null) return
    const tick = () => setCooldown(Math.max(0, Math.ceil((CHAT_COOLDOWN - (Date.now() - state.lastSentAt)) / 1000)))
    tick()
    const timer = setInterval(tick, 1000)
    const stop = setTimeout(() => clearInterval(timer), CHAT_COOLDOWN + 100)
    return () => { clearInterval(timer); clearTimeout(stop) }
  }, [state.lastSentAt])
  if (!supported || blocked) return null
  const online = state.phase === 'online'
  const status = online ? '연결됨' : state.phase === 'connecting' ? '연결 중' : '연결 끊김'
  const close = () => { setOpen(false); setError(''); toggle.current?.focus() }
  const saveName = () => {
    try { const clean = cleanChatName(name); setName(clean); try { localStorage.setItem('digirogue-chat-name:' + identity.uid, clean) } catch { /* chat works without storage */ } setEditingName(false); setError(''); input.current?.focus() }
    catch (cause) { setError(cause.message) }
  }
  const send = async event => {
    event.preventDefault()
    setError('')
    try { if (!controller.current) throw new Error('채팅 연결 후 보낼 수 있습니다.'); await controller.current.send(draft, name); setDraft(''); input.current?.focus() }
    catch (cause) { setError(cause.message) }
  }
  return <aside className={'community community--' + screenMode + (open ? ' community--open' : '')} aria-label="플레이어 커뮤니티" onKeyDown={event => {
    if (!open && event.key === 'Escape') return
    event.stopPropagation()
    if (event.key === 'Escape' && !event.nativeEvent.isComposing) { event.preventDefault(); close() }
  }}>
    {screenMode === 'menu' && <div className="community__players" aria-live="polite"><i data-online={online}/><span>현재 플레이 중</span><strong>{state.count === null ? '—' : state.count.toLocaleString()}<small> 명</small></strong></div>}
    <button ref={toggle} type="button" className="community__toggle" aria-expanded={open} aria-controls="community-chat" onClick={() => { setOpen(value => !value); setError('') }}><ChatIcon/><span>전체 채팅</span><span className="community__signal" data-online={online}>{status}</span><span aria-hidden="true">{open ? '−' : '+'}</span></button>
    {open && <section id="community-chat" className="community__panel" aria-label="전체 채팅">
      <header className="community__header"><span>디지털 월드 채널</span><button type="button" aria-label="채팅 접기" onClick={close}>×</button></header>
      <div className="community__messages" ref={list} role="log" aria-label="최근 채팅 메시지" aria-live="polite" aria-relevant="additions text" tabIndex={0} onScroll={event => { const el = event.currentTarget; nearBottom.current = el.scrollHeight - el.clientHeight - el.scrollTop < 32; if (nearBottom.current) setUnread(false) }}>
        {state.messages.length ? state.messages.map(message => <article key={message.seq} className={'community__message' + (message.uid === controller.current?.uid ? ' community__message--mine' : '')}><div><strong>{message.name}</strong><time dateTime={new Date(message.createdAt).toISOString()}>{time(message.createdAt)}</time></div><p>{message.text}</p></article>) : <div className="community__empty"><ChatIcon/><p>{online ? '첫 인사를 남겨 보세요.' : '채팅 연결을 기다리고 있습니다.'}</p></div>}
      </div>
      {unread && <button type="button" className="community__new" onClick={() => { nearBottom.current = true; list.current.scrollTop = list.current.scrollHeight; setUnread(false) }}>새 메시지 ↓</button>}
      <div className="community__identity">{editingName ? <><input aria-label="채팅 이름" value={name} maxLength={16} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); saveName() } }}/><button type="button" onClick={saveName}>확인</button></> : <><span>{name}</span><button type="button" onClick={() => setEditingName(true)}>이름 변경</button></>}<small>최근 40개</small></div>
      <form className="community__compose" onSubmit={send}>
        <input ref={input} aria-label="채팅 메시지" placeholder={online ? '메시지 입력…' : '연결 후 대화할 수 있어요'} value={draft} maxLength={CHAT_LENGTH} onChange={event => setDraft(event.target.value)} disabled={!online} onKeyDown={event => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }}/>
        <button type="submit" disabled={!online || state.pending || cooldown > 0 || !draft.trim()}>{state.pending ? '전송 중' : cooldown > 0 ? cooldown + '초' : '전송'}</button>
      </form>
      <div className="community__feedback"><span role="status">{error || state.error || 'Enter로 전송'}</span><span>{draft.length}/{CHAT_LENGTH}</span>{state.phase === 'unavailable' && <button type="button" onClick={() => setRetry(value => value + 1)}>재연결</button>}</div>
    </section>}
  </aside>
}
