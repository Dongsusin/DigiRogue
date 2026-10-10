import { doc, getFirestore, getDocFromServer, onSnapshot, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore'
import { firebaseApp, firebaseAuth } from './firebaseClient.js'
import { sessionServerDeadline } from './accountSession.js'
const db = getFirestore(firebaseApp)
const sessionDocument = uid => doc(db, 'activeSessions', uid)
const reject = code => { throw Object.assign(new Error(code), { code }) }
const timely = ({ signal, deadline }) => { if (signal.aborted || Date.now() >= deadline) reject('session/unavailable') }
export const firebaseSessionStore = {
  async claim(uid, previous, next, takeover, options) {
    timely(options)
    const user = firebaseAuth.currentUser
    if (user?.uid !== uid) reject('session/sign-in-required')
    const tokenRequestStartedAt = Date.now()
    const { claims } = await user.getIdTokenResult(true)
    const authTime = claims.auth_time
    const expiresAt = sessionServerDeadline(claims.iat, options.deadline, tokenRequestStartedAt)
    timely(options)
    const ref = sessionDocument(uid)
    await runTransaction(db, async transaction => {
      timely(options)
      const current = (await transaction.get(ref)).data()
      timely(options)
      if (!takeover && (current?.sessionId !== previous || current?.authTime !== authTime)) reject('session/replaced')
      if (takeover && current && current.authTime >= authTime) reject('session/recent-login-required')
      transaction.set(ref, {
        sessionId: next, previousSessionId: takeover ? '' : previous, authTime,
        createdAt: serverTimestamp(), claimExpiresAt: Timestamp.fromMillis(expiresAt),
      })
    })
  },
  async read(uid) { return (await getDocFromServer(sessionDocument(uid))).data()?.sessionId || null },
  watch(uid, callback, onError) {
    return onSnapshot(sessionDocument(uid), { includeMetadataChanges: true }, snapshot => callback({
      sessionId: snapshot.data()?.sessionId || null,
      confirmed: !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites,
    }), onError)
  },
  async release(uid, sessionId) {
    const ref = sessionDocument(uid), deadline = Date.now() + 12000
    const user = firebaseAuth.currentUser
    if (user?.uid !== uid) return
    const tokenRequestStartedAt = Date.now()
    const { claims } = await user.getIdTokenResult(true)
    const expiresAt = sessionServerDeadline(claims.iat, deadline, tokenRequestStartedAt)
    await runTransaction(db, async transaction => {
      const current = (await transaction.get(ref)).data()
      if (current?.sessionId !== sessionId || Date.now() >= deadline) return
      // Keep the auth-time high-water mark: an older token cannot recreate a
      // deleted record and overwrite a newer successful login.
      transaction.set(ref, { ...current, sessionId: '', previousSessionId: sessionId,
        createdAt: serverTimestamp(), claimExpiresAt: Timestamp.fromMillis(expiresAt) })
    })
  },
}
