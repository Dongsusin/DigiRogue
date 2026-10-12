import { initializeApp, getApps } from 'firebase/app'
import { getAuth, setPersistence, indexedDBLocalPersistence, signInAnonymously, connectAuthEmulator } from 'firebase/auth'
import { getDatabase, ref, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, set, goOffline, goOnline, connectDatabaseEmulator } from 'firebase/database'
import { firebaseApp, firebaseAuth, authPersistenceReady } from '../auth/firebaseClient.js'
import { onlinePlayers, orderedMessages, collectSnapshotChildren } from './communityModel.js'

const emulator = import.meta.env.DEV && import.meta.env.VITE_COMMUNITY_EMULATOR === 'true'
let guestReady
const emulatedDatabases = new WeakSet()
export async function getCommunityAuth(identity) {
  if (!identity.isAnonymous && !emulator) {
    await authPersistenceReady
    await firebaseAuth.authStateReady()
    if (firebaseAuth.currentUser?.uid !== identity.uid) throw new Error('로그인 연결을 확인해 주세요.')
    return firebaseAuth
  }
  // Separate auth preserves local guest saves and the game's login.
  const options = emulator ? { ...firebaseApp.options, projectId: 'demo-digirouge', apiKey: 'demo-key' } : firebaseApp.options
  const app = getApps().find(item => item.name === 'digilog-community') ?? initializeApp(options, 'digilog-community')
  const auth = getAuth(app)
  if (!guestReady) guestReady = (async () => {
    if (emulator) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    await setPersistence(auth, indexedDBLocalPersistence)
    await auth.authStateReady()
    if (!auth.currentUser) await signInAnonymously(auth)
    return auth
  })().catch(error => { guestReady = undefined; throw error })
  return guestReady
}
export async function createFirebaseCommunity(identity) {
  const auth = await getCommunityAuth(identity)
  const db = getDatabase(auth.app, emulator ? 'https://demo-digirouge-default-rtdb.firebaseio.com' : firebaseApp.options.databaseURL)
  if (emulator && !emulatedDatabases.has(db)) { connectDatabaseEmulator(db, '127.0.0.1', 9000); emulatedDatabases.add(db) }
  const uid = auth.currentUser.uid
  const requests = new Set()
  // Abortable REST sends never queue a message for publication after reconnect.
  async function request(method, path, body) {
    const abort = new AbortController()
    requests.add(abort)
    const timer = setTimeout(() => abort.abort(), 10000)
    try {
      const token = await auth.currentUser.getIdToken()
      const base = emulator ? 'http://127.0.0.1:9000' : firebaseApp.options.databaseURL
      const url = base + '/' + path + '.json?auth=' + encodeURIComponent(token) + (emulator ? '&ns=demo-digirouge-default-rtdb' : '')
      const response = await fetch(url, { method, signal: abort.signal, cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      if (!response.ok) throw Object.assign(new Error('채팅 요청 실패'), { code: response.status === 401 || response.status === 403 ? 'PERMISSION_DENIED' : 'NETWORK_ERROR' })
      return await response.json()
    } finally { clearTimeout(timer); requests.delete(abort) }
  }
  function watchChildren(path, transform, callback, onError) {
    let rows = new Map()
    const target = ref(db, path)
    const changed = snapshot => { rows.set(snapshot.key, snapshot.val()); callback(transform(Object.fromEntries(rows))) }
    const removed = snapshot => { rows.delete(snapshot.key); callback(transform(Object.fromEntries(rows))) }
    const initial = onValue(target, snapshot => { rows = collectSnapshotChildren(snapshot); callback(transform(Object.fromEntries(rows))) }, onError, { onlyOnce: true })
    const stops = [initial, onChildAdded(target, changed, onError), onChildChanged(target, changed, onError), onChildRemoved(target, removed, onError)]
    return () => { stops.forEach(stop => stop()); rows.clear() }
  }
  return {
    uid,
    connect(callback, onError) {
      let active = true, epoch = 0
      goOnline(db)
      const stop = onValue(ref(db, '.info/connected'), async snapshot => {
        const current = ++epoch
        if (!snapshot.val()) { if (active) callback(false); return }
        const target = ref(db, 'presence/' + uid + '/' + crypto.randomUUID())
        try {
          await onDisconnect(target).remove()
          if (!active || current !== epoch) return
          await set(target, true)
          if (active && current === epoch) callback(true)
        } catch { if (active) onError?.() }
      }, onError)
      return () => { active = false; epoch++; stop(); for (const abort of requests) abort.abort(); goOffline(db) }
    },
    watchCount: (callback, onError) => watchChildren('presence', onlinePlayers, callback, onError),
    watchMessages: (callback, onError) => watchChildren('community/messages', rows => orderedMessages(Object.values(rows)), callback, onError),
    readHead: async () => (await request('GET', 'community/head/seq')) ?? 0,
    readRate: async () => (await request('GET', 'community/rates/' + uid)) ?? null,
    write: update => request('PATCH', 'community', update),
  }
}
