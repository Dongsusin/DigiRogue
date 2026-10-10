import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { ensureLocalGuest } from '../src/progression/launcherStorage.js'
import { createAccountSession, SESSION_KEY, SESSION_MESSAGES } from '../src/auth/accountSession.js'
const source = fs.readFileSync(new URL('../src/auth/AuthProvider.jsx', import.meta.url), 'utf8')
  .replace(/^import[\s\S]*?from ['"][^'"]+['"]\s*\n/gm, '')
  .replace('export default function AuthProvider', 'function AuthProvider')
  .replace('let sessionStore, sessionStorePromise', 'let sessionStore = testSessionStore, sessionStorePromise')
  .replace(/const loadStore = [^\n]+/, 'const loadStore = () => Promise.resolve(testSessionStore)')
  .replace(/return <AuthContext.Provider[^\n]+/, 'return null')
const backend = () => { const map = new Map(); return {
  getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)),
  removeItem: key => map.delete(key),
} }
function provider(storage = backend(), { savedUser = null, persistence = Promise.resolve(), retire = Promise.resolve(), restoreSession = false } = {}) {
  const state = [], effects = [], calls = { anonymous: 0, signOut: 0, googlePopup: 0, googleLink: 0 }
  let actions, count = 0
  const auth = { currentUser: savedUser }
  const tabStorage = backend(), sessions = new Map()
  if (restoreSession && savedUser) { tabStorage.setItem(SESSION_KEY, JSON.stringify({ uid: savedUser.uid, sessionId: 'existing' })); sessions.set(savedUser.uid, 'existing') }
  const testSessionStore = {
    async claim(uid, previous, next, takeover) { if (!takeover && sessions.get(uid) !== previous) throw Object.assign(new Error(), { code: 'session/replaced' }); sessions.set(uid,next) },
    async read(uid) { return sessions.get(uid) ?? null },
    watch() { return () => {} },
    async release(uid,id) { if (sessions.get(uid) === id) sessions.delete(uid) },
  }
  const context = vm.createContext({
    window: { sessionStorage: tabStorage, addEventListener() {}, removeEventListener() {} },
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    navigator: { onLine: false }, AuthContext: {}, createAccountSession, SESSION_MESSAGES, testSessionStore,
    firebaseAuth: auth, authPersistenceReady: persistence,
    useState: initial => { const key = count++; state[key] = initial; return [initial, value => { state[key] = value }] },
    useRef: initial => ({ current: initial }),
    useEffect: effect => effects.push(effect), useMemo: factory => { actions = factory(); return actions },
    browserStorage: () => storage, initializeLauncherStorage: () => {}, ensureLocalGuest,
    authErrorMessage: () => 'auth error', importGuestProgress: () => {},
    onAuthStateChanged: (_auth, callback) => { callback(auth.currentUser); return () => {} },
    signInAnonymously: async () => { calls.anonymous++; return { user: { uid: 'remote', isAnonymous: true } } },
    signOut: async () => { calls.signOut++; await retire; auth.currentUser = null },
    GoogleAuthProvider: class { setCustomParameters() {} },
    signInWithPopup: async () => { calls.googlePopup++; auth.currentUser = { uid: 'google', isAnonymous: false }; return { user: auth.currentUser } },
    linkWithPopup: async () => { calls.googleLink++; auth.currentUser = { uid: 'google', isAnonymous: false }; return { user: auth.currentUser } },
  })
  vm.runInContext(source + '\nAuthProvider({children:null})', context)
  return { state, calls, actions, effects, storage }
}
const settle = async () => { for (let i = 0; i < 40; i++) await Promise.resolve() }
const tests = [], test = (name, run) => tests.push({ name, run })
test('guest entry is local, stable, and makes zero Firebase anonymous sign-ins', async () => {
  const storage = backend(); storage.setItem('digirogue-save-v1', 'existing-guest-save')
  const p = provider(storage); await p.actions.guest()
  assert.equal(p.calls.anonymous, 0); assert.equal(p.state[0].isLocalGuest, true)
  assert.equal(storage.getItem('digirogue-offline-session-v1'), 'guest')
  const uid = p.state[0].uid
  const again = provider(storage); await again.actions.guest(); assert.equal(again.state[0].uid, uid)
  assert.equal(storage.getItem('digirogue-save-v1'), 'existing-guest-save')
})
test('guest entry does not wait for Firebase persistence or network availability', async () => {
  const p = provider(backend(), { persistence: new Promise(() => {}) })
  void p.actions.guest(); await settle()
  assert.equal(p.state[0]?.isLocalGuest, true); assert.equal(p.state[2], false)
})
test('restoring an old anonymous account stops token refresh and preserves guest saves', async () => {
  const storage = backend(); storage.setItem('digirogue-save-v1', 'previous')
  const p = provider(storage, { savedUser: { uid: 'old-anonymous', isAnonymous: true } })
  p.effects.forEach(effect => effect()); await settle()
  assert.equal(p.state[0]?.isLocalGuest, true); assert.equal(p.calls.signOut, 1)
  assert.equal(storage.getItem('digirogue-save-v1'), 'previous')
})
test('Google restoration with a valid ownership token keeps its identity', async () => {
  const p = provider(backend(), { savedUser: { uid: 'google', displayName: 'Player', isAnonymous: false }, restoreSession: true })
  p.effects.forEach(effect => effect()); await settle()
  assert.equal(p.state[0]?.uid, 'google'); assert.equal(p.state[0]?.isAnonymous, false); assert.equal(p.calls.signOut, 0)
})
test('Google login waits for delayed anonymous retirement and keeps the new Google session', async () => {
  let finish
  const retire = new Promise(resolve => { finish = resolve })
  const p = provider(backend(), { savedUser: { uid: 'old', isAnonymous: true }, retire })
  p.effects.forEach(effect => effect()); await settle()
  const login = p.actions.google(); await settle()
  assert.equal(p.calls.googleLink + p.calls.googlePopup, 0)
  finish(); await login; assert.equal(p.state[0]?.uid, 'google')
  assert.equal(p.calls.googleLink, 0); assert.equal(p.calls.googlePopup, 1)
})
test('logout waits for an existing anonymous retirement instead of racing a second sign-out', async () => {
  let finish
  const retire = new Promise(resolve => { finish = resolve })
  const p = provider(backend(), { savedUser: { uid: 'old', isAnonymous: true }, retire })
  p.effects.forEach(effect => effect()); await settle()
  const logout = p.actions.logout(); await settle()
  assert.equal(p.calls.signOut, 1)
  finish(); await logout; assert.equal(p.state[0], null)
})
test('legacy Google persistence without a session token requests a fresh login', async () => {
  const p = provider(backend(), { savedUser: { uid: 'google', isAnonymous: false } })
  p.effects.forEach(effect => effect()); await settle()
  assert.equal(p.state[0], null); assert.equal(p.calls.signOut, 1)
  assert.match(p.state[4], /다시 로그인/)
})
let passed = 0
for (const { name, run } of tests) {
  try { await run(); passed++; console.log('PASS ' + name) }
  catch (error) { console.error('FAIL ' + name + ': ' + error.message); process.exitCode = 1 }
}
console.log(`Guest Firebase budget: ${passed}/${tests.length} checks passed`)
