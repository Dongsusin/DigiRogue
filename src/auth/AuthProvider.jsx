import { useEffect, useMemo, useRef, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup,
  linkWithPopup, signInWithCredential, signOut } from 'firebase/auth'
import { firebaseAuth, authPersistenceReady } from './firebaseClient.js'
import { AuthContext } from './AuthContext.js'
import { importGuestProgress, authErrorMessage } from './profileStorage.js'
import { createAccountSession, SESSION_MESSAGES } from './accountSession.js'
import { browserStorage, initializeLauncherStorage } from '../progression/localStorage.js'
import { ensureLocalGuest } from '../progression/launcherStorage.js'
const LOCAL_SESSION = 'digirogue-offline-session-v1'
const describe = user => user ? { uid: user.uid, displayName: user.displayName || (user.isAnonymous ? '게스트' : '플레이어'),
  isAnonymous: user.isAnonymous, isLocalGuest: false } : null
const localGuest = () => ({ ...ensureLocalGuest(browserStorage()), displayName: '게스트', isAnonymous: true, isLocalGuest: true })
const localSession = () => { try { return browserStorage()?.getItem(LOCAL_SESSION) === 'guest' } catch { return false } }
const message = error => SESSION_MESSAGES[error?.code] ?? authErrorMessage(error)
// Firestore is requested only for Google players, never for local guests.
let sessionStore, sessionStorePromise
const loadStore = () => sessionStorePromise ??= import('./firebaseSessionStore.js').then(module => sessionStore = module.firebaseSessionStore)
const remoteStore = {
  async claim(...args) { return (await loadStore()).claim(...args) },
  async read(...args) { return (await loadStore()).read(...args) },
  watch(...args) { return sessionStore.watch(...args) },
  async release(...args) { return (await loadStore()).release(...args) },
}
export default function AuthProvider({ children, googleSignIn = signInWithPopup }) {
  const [identity, setIdentity] = useState(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sessionChecking, setSessionChecking] = useState(false)
  const [error, setError] = useState('')
  const anonymousRetirementRef = useRef(Promise.resolve())
  const interactiveRef = useRef(false)
  const sessionRef = useRef(null)
  const notifyRef = useRef(null)
  useEffect(() => {
    let active = true, unsubscribe
    try { initializeLauncherStorage() } catch (failure) { setError(failure.message); setReady(true); return }
    // Installed builds retain their offline entry and native save files.
    if (window.auroraGame) { setIdentity(localGuest()); setReady(true); return }
    notifyRef.current = state => {
      if (!active) return
      setSessionChecking(state.phase === 'checking' || state.phase === 'claiming')
      if (state.phase === 'ended') {
        setIdentity(null); setReady(true); setError(SESSION_MESSAGES[state.reason])
        browserStorage()?.removeItem(LOCAL_SESSION)
        if (firebaseAuth.currentUser?.uid === state.uid) {
          anonymousRetirementRef.current = signOut(firebaseAuth)
          void anonymousRetirementRef.current.catch(() => {})
        }
      }
    }
    sessionRef.current ??= createAccountSession({ store: remoteStore,
      storage: { getItem: key => window.sessionStorage.getItem(key), setItem: (key, value) => window.sessionStorage.setItem(key, value), removeItem: key => window.sessionStorage.removeItem(key) },
      onChange: state => notifyRef.current?.(state),
    })
    const verify = () => { if (document.visibilityState !== 'hidden') void sessionRef.current?.verify() }
    window.addEventListener('focus', verify)
    window.addEventListener('pageshow', verify)
    window.addEventListener('online', verify)
    window.addEventListener('offline', verify)
    document.addEventListener('visibilitychange', verify)
    authPersistenceReady.then(() => {
      if (!active) return
      unsubscribe = onAuthStateChanged(firebaseAuth, async user => {
        if (!active || interactiveRef.current) return
        if (user?.isAnonymous) {
          try {
            browserStorage()?.setItem(LOCAL_SESSION, 'guest')
            setIdentity(localGuest())
            anonymousRetirementRef.current = signOut(firebaseAuth)
            void anonymousRetirementRef.current.catch(failure => { if (active) setError(authErrorMessage(failure)) })
          } catch (failure) { setError(failure.message) }
        } else if (user) {
          setReady(false)
          try {
            await sessionRef.current.start(user.uid)
            if (active && sessionRef.current.state.phase === 'active' && firebaseAuth.currentUser?.uid === user.uid) setIdentity(describe(user))
          } catch (failure) {
            if (!active) return
            setIdentity(null); setError(message(failure))
            anonymousRetirementRef.current = signOut(firebaseAuth)
            void anonymousRetirementRef.current.catch(() => {})
          }
        } else setIdentity(localSession() ? localGuest() : null)
        if (active) setReady(true)
      }, failure => { if (active) { setError(authErrorMessage(failure)); setReady(true) } })
    }).catch(failure => { if (active) { setError(authErrorMessage(failure)); setIdentity(localSession() ? localGuest() : null); setReady(true) } })
    return () => {
      active = false; unsubscribe?.(); sessionRef.current?.dispose()
      window.removeEventListener('focus', verify); window.removeEventListener('pageshow', verify)
      window.removeEventListener('online', verify); window.removeEventListener('offline', verify)
      document.removeEventListener('visibilitychange', verify)
    }
  }, [])
  const google = async () => {
    if (interactiveRef.current) return
    interactiveRef.current = true
    setBusy(true); setError('')
    const guestBefore = identity?.isAnonymous
    let authenticatedUser
    try {
      await anonymousRetirementRef.current
      await authPersistenceReady
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      let result, linked = false
      if (firebaseAuth.currentUser?.isAnonymous) {
        try { result = await linkWithPopup(firebaseAuth.currentUser, provider); linked = true }
        catch (failure) {
          const credential = GoogleAuthProvider.credentialFromError(failure)
          if (failure.code !== 'auth/credential-already-in-use' || !credential) throw failure
          result = await signInWithCredential(firebaseAuth, credential)
        }
      } else result = await googleSignIn(firebaseAuth, provider)
      authenticatedUser = result.user
      // Never mount the game until the server confirms this tab owns the account.
      await sessionRef.current.start(result.user.uid, { takeover: true })
      if (sessionRef.current.state.phase !== 'active') return
      if (linked || (guestBefore && identity?.isLocalGuest)) importGuestProgress(browserStorage(), result.user.uid)
      browserStorage()?.removeItem(LOCAL_SESSION)
      setIdentity(describe(result.user)); setReady(true)
    } catch (failure) {
      setError(message(failure))
      if (authenticatedUser) {
        await sessionRef.current?.logout(); await signOut(firebaseAuth).catch(() => {})
        setIdentity(guestBefore ? identity : null)
      }
    } finally { interactiveRef.current = false; setBusy(false) }
  }
  const guest = async () => {
    if (interactiveRef.current) return
    interactiveRef.current = true
    setBusy(true); setError('')
    try {
      await sessionRef.current?.logout()
      await anonymousRetirementRef.current
      if (firebaseAuth.currentUser) await signOut(firebaseAuth)
      const identity = localGuest(), storage = browserStorage()
      if (!storage) throw new Error('Guest storage unavailable')
      storage.setItem(LOCAL_SESSION, 'guest')
      if (storage.getItem(LOCAL_SESSION) !== 'guest') throw new Error('Guest session was not saved')
      setIdentity(identity); setReady(true)
    } catch { setError('게스트 기록을 저장할 공간이 없습니다.') }
    finally { interactiveRef.current = false; setBusy(false) }
  }
  const logout = async () => {
    if (interactiveRef.current) return
    interactiveRef.current = true
    setBusy(true); setError('')
    try {
      await sessionRef.current?.logout(); await anonymousRetirementRef.current
      if (firebaseAuth.currentUser) await signOut(firebaseAuth)
      browserStorage()?.removeItem(LOCAL_SESSION); setIdentity(null)
    } catch (failure) { setError(message(failure)) }
    finally { interactiveRef.current = false; setBusy(false) }
  }
  const value = useMemo(() => ({ identity, ready, busy, sessionChecking, error, google, guest, logout,
    clearError: () => setError(''), launcher: Boolean(window.auroraGame) }), [identity, ready, busy, sessionChecking, error])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
