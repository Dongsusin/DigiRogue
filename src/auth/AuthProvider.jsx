import { useEffect, useMemo, useRef, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup,
  linkWithPopup, signInWithCredential, signOut } from 'firebase/auth'
import { firebaseAuth, authPersistenceReady } from './firebaseClient.js'
import { AuthContext } from './AuthContext.js'
import { importGuestProgress, authErrorMessage } from './profileStorage.js'
import { browserStorage, initializeLauncherStorage } from '../progression/localStorage.js'
import { ensureLocalGuest } from '../progression/launcherStorage.js'
const LOCAL_SESSION = 'digirogue-offline-session-v1'
const describe = user => user ? { uid: user.uid, displayName: user.displayName || (user.isAnonymous ? '게스트' : '플레이어'),
  isAnonymous: user.isAnonymous, isLocalGuest: false } : null
const localGuest = () => ({ ...ensureLocalGuest(browserStorage()), displayName: '게스트', isAnonymous: true, isLocalGuest: true })
const localSession = () => { try { return browserStorage()?.getItem(LOCAL_SESSION) === 'guest' } catch { return false } }
export default function AuthProvider({ children }) {
  const [identity, setIdentity] = useState(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const anonymousRetirementRef = useRef(Promise.resolve())
  useEffect(() => {
    let active = true, unsubscribe
    try { initializeLauncherStorage() } catch (failure) { setError(failure.message); setReady(true); return }
    // Installed builds retain their offline entry and native save files.
    if (window.auroraGame) { setIdentity(localGuest()); setReady(true); return }
    authPersistenceReady.then(() => {
      if (!active) return
      unsubscribe = onAuthStateChanged(firebaseAuth, user => {
        if (!active) return
        if (user?.isAnonymous) {
          // Guest progress already uses the shared local guest namespace.
          // Retire only this browser's anonymous session, never its saved data.
          try {
            const identity = localGuest()
            browserStorage()?.setItem(LOCAL_SESSION, 'guest')
            setIdentity(identity)
            anonymousRetirementRef.current = signOut(firebaseAuth)
            void anonymousRetirementRef.current.catch(failure => { if (active) setError(authErrorMessage(failure)) })
          } catch (failure) { setError(failure.message) }
        } else setIdentity(describe(user) ?? (localSession() ? localGuest() : null))
        setReady(true)
      }, failure => { if (active) { setError(authErrorMessage(failure)); setReady(true) } })
    }).catch(failure => { if (active) { setError(authErrorMessage(failure)); setIdentity(localSession() ? localGuest() : null); setReady(true) } })
    return () => { active = false; unsubscribe?.() }
  }, [])
  const google = async () => {
    if (busy) return
    setBusy(true); setError('')
    const guestBefore = identity?.isAnonymous
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
      } else result = await signInWithPopup(firebaseAuth, provider)
      if (linked || (guestBefore && identity?.isLocalGuest)) importGuestProgress(browserStorage(), result.user.uid)
      browserStorage()?.removeItem(LOCAL_SESSION)
      setIdentity(describe(result.user))
    } catch (failure) { setError(authErrorMessage(failure)) }
    finally { setBusy(false) }
  }
  const guest = async () => {
    if (busy) return
    setBusy(true); setError('')
    try {
      const identity = localGuest()
      const storage = browserStorage()
      if (!storage) throw new Error('Guest storage unavailable')
      storage.setItem(LOCAL_SESSION, 'guest')
      if (storage.getItem(LOCAL_SESSION) !== 'guest') throw new Error('Guest session was not saved')
      setIdentity(identity)
    } catch {
      setError('게스트 기록을 저장할 공간이 없습니다.')
    } finally { setBusy(false) }
  }
  const logout = async () => {
    if (busy) return
    setBusy(true); setError('')
    try { await anonymousRetirementRef.current; if (firebaseAuth.currentUser) await signOut(firebaseAuth); browserStorage()?.removeItem(LOCAL_SESSION); setIdentity(null) }
    catch (failure) { setError(authErrorMessage(failure)) }
    finally { setBusy(false) }
  }
  const value = useMemo(() => ({ identity, ready, busy, error, google, guest, logout,
    clearError: () => setError(''), launcher: Boolean(window.auroraGame) }), [identity, ready, busy, error])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
